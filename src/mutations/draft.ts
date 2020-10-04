#!/usr/bin/env node
'use strict';

import * as _ from "lodash";
import {Model, Types} from "mongoose";
import {GraphQLJSONObject} from "graphql-type-json";
import {GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLString} from "graphql";

import Draft from "../models/draft";
import CollectionsModelsMap from "../util/collections.models.map";

const _commonArgs = {
	draftId: {type: GraphQLID},
	field: {type: GraphQLString},
	employeeId: {type: GraphQLInt}
};

const _hasItemId = (model: Model<any>): boolean => _.includes(_.keys(model.schema.paths), 'itemId');

module.exports = {

	focus: {
		type: GraphQLBoolean,
		args: _commonArgs,
		resolve: async (parent: any, args: any) => {
			const {draftId, field, employeeId} = args;
			console.log('draft.add', parent, {draftId, field, employeeId});

			const draft = await Draft.findOne({_id: draftId});
			if (draft) {
				let meta = _.get(draft, 'meta', {});
				if (_.get(meta, field)) return false;

				_.each(meta, (val, id) => {
					if (_.get(val, 'user', false) === employeeId) {
						meta = _.omit(meta, id);
					}
				});
				_.set(meta, field, {user: employeeId});
				await Draft.updateOne({_id: draftId}, {$set: {meta}});
				return true;
			}

			return {draftId, field, employeeId, error: 'Draft does not exist!'};
		}
	},

	blur: {
		type: GraphQLBoolean,
		args: _commonArgs,
		resolve: async (parent: any, args: any) => {
			const {draftId, field, employeeId} = args;
			console.log('draft.blur', {draftId, field, employeeId});

			const draft: any = await Draft.findOne({_id: draftId});
			if (draft) {
				const meta = _.get(draft, 'meta', null);
				if (meta) {
					const curr = _.get(meta, field);
					if (curr) {
						const userId = _.get(curr, 'user');
						if (userId !== employeeId) return false;
						const metaData = _.omit(meta, field);
						await Draft.updateOne({_id: draftId}, {$set: {meta: metaData}});
					}
				}
				return true;
			}

			return {draftId, field, employeeId, error: 'Draft does not exist!'};
		}
	},

	change: {
		type: GraphQLJSONObject,
		args: {
			draftId: {type: GraphQLID},
			employeeId: {type: GraphQLInt},
			change: {type: GraphQLJSONObject}	// path, value
		},
		resolve: async (parent: any, args: any) => {
			const {draftId, change, employeeId} = args;
			const {path, value} = change;

			const draft: any = await Draft.findOne({_id: draftId});
			if (draft) {
				let {document} = draft;
				document = _.set(document, path, value);
				const updater = {
					updatedBy: employeeId,
					updatedAt: new Date(),
					document
				};
				await Draft.updateOne({_id: draftId}, {$set: updater});

				return change;
			}

			return {draftId, change, employeeId, error: 'Draft does not exist!'};
		}
	},

	create: {
		type: GraphQLID,
		args: {
			collectionName: {type: GraphQLString},
			sourceDocumentId: {type: GraphQLID},
			employeeId: {type: GraphQLInt}
		},
		resolve: async (parent: any, args: any) => {
			const {collectionName, sourceDocumentId, employeeId} = args;
			const model = CollectionsModelsMap.getModelByCollection(collectionName);
			if (!model) throw new Error(`Model not found for collectionName ${collectionName}`);

			const document = await model.findOne({_id: sourceDocumentId});

			// TODO: document hes refs?

			const hasItemId = _hasItemId(model);
			let draftQuery: any = {collectionName, sourceDocumentId};
			if (hasItemId) draftQuery = {collectionName, sourceDocumentItemId: document.itemId};

			let existing: any = await Draft.findOne(draftQuery);
			if (!existing) {
				const draft: any = {_id: Types.ObjectId(), collectionName, sourceDocumentId};
				if (hasItemId) draft.sourceDocumentItemId = document.itemId;
				draft.document = _.omit(document, ['_id', 'updatedAt', 'updatedBy']);
				draft.meta = {};
				draft.createdBy = employeeId;
				existing = await model.create(draft);
			}
			return existing._id;
		}
	},

	cancel: {
		type: GraphQLBoolean,
		args: {draftId: {type: GraphQLID}},
		resolve: async (parent: any, args: any) => {
			const {draftId} = args;
			await Draft.remove({_id: draftId});
			return true;
		}
	}

};
