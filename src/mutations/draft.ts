#!/usr/bin/env node
'use strict';

import * as _ from "lodash";
import {Model, Types} from "mongoose";
import {GraphQLJSONObject} from "graphql-type-json";
import {GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLString} from "graphql";

import Draft, {GraphQLDraftType} from "../models/draft";
import CollectionsModelsMap from "../util/collections.models.map";

const _hasItemId = (model: Model<any>): boolean => _.includes(_.keys(model.schema.paths), 'itemId');

module.exports = {

	draftFocus: {
		type: GraphQLBoolean,
		args: {
			userId: {type: GraphQLString},
			draftId: {type: GraphQLID},
			field: {type: GraphQLString}
		},
		resolve: async (parent: any, args: any) => {
			const {draftId, field, userId} = args;
			console.log('draftFocus', parent, {draftId, field, userId});

			const draft = await Draft.findOne({_id: draftId});
			if (draft) {
				let meta = _.get(draft, 'meta', {});
				if (_.get(meta, field)) return false;

				_.each(meta, (val, id) => {
					if (_.get(val, 'user', false) === userId) {
						meta = _.omit(meta, id);
					}
				});
				_.set(meta, field, {user: userId});
				await Draft.updateOne({_id: draftId}, {$set: {meta}});
				return true;
			}
			return {draftId, field, userId, error: 'Draft does not exist!'};
		}
	},

	draftBlur: {
		type: GraphQLBoolean,
		args: {
			userId: {type: GraphQLString},
			draftId: {type: GraphQLID},
			field: {type: GraphQLString}
		},
		resolve: async (parent: any, args: any) => {
			const {draftId, field, userId} = args;
			console.log('draftBlur', {draftId, field, userId});

			const draft: any = await Draft.findOne({_id: draftId});
			if (draft) {
				const meta = _.get(draft, 'meta', null);
				if (meta) {
					const curr = _.get(meta, field);
					if (curr) {
						const userId = _.get(curr, 'user');
						if (userId !== userId) return false;
						const metaData = _.omit(meta, field);
						await Draft.updateOne({_id: draftId}, {$set: {meta: metaData}});
					}
				}
				return true;
			}
			return {draftId, field, userId, error: 'Draft does not exist!'};
		}
	},

	draftChange: {
		type: GraphQLJSONObject,
		args: {
			userId: {type: GraphQLString},
			draftId: {type: GraphQLID},
			change: {type: GraphQLJSONObject}	// field, value
		},
		resolve: async (parent: any, args: any) => {
			const {draftId, change, userId} = args;
			const {field, value} = change;
			console.log('draftChange', {draftId, change, userId});

			const draft: any = await Draft.findOne({_id: draftId});
			if (draft) {
				let {document} = draft;
				document = _.set(document, field, value);
				const updater = {
					updatedBy: userId,
					updatedAt: new Date(),
					document
				};
				return Draft.updateOne({_id: draftId}, {$set: updater});
			}
			return {draftId, change: {field, value}, userId, error: 'Draft does not exist!'};
		}
	},

	draftCancel: {
		type: GraphQLBoolean,
		args: {
			userId: {type: GraphQLString},
			draftId: {type: GraphQLID}
		},
		resolve: async (parent: any, args: any) => {
			const {draftId} = args;
			console.log('draftCancel', {draftId});

			await Draft.remove({_id: draftId});
			return true;
		}
	},

	/**
	 * This method will not work for complex drafts.
	 * For documents that require references, please create a create draft method
	 * in the respective mutations file and handle it there.
	 */
	draftCreate: {
		type: GraphQLDraftType,
		args: {
			userId: {type: GraphQLString},
			collectionName: {type: GraphQLString},
			sourceDocumentId: {type: GraphQLID}
		},
		resolve: async (parent: any, args: any) => {
			const {collectionName, sourceDocumentId, userId} = args;
			const model = CollectionsModelsMap.getModelByCollection(collectionName);
			if (!model) throw new Error(`Model not found for collectionName ${collectionName}`);
			console.log('draftCreate', {collectionName, sourceDocumentId, userId});

			const document = await model.findOne({_id: sourceDocumentId});

			const hasItemId = _hasItemId(model);
			let draftQuery: any = {collectionName, sourceDocumentId};
			if (hasItemId) draftQuery = {collectionName, sourceDocumentItemId: document.itemId};

			let existing: any = await Draft.findOne(draftQuery);
			if (!existing) {
				const draft: any = {_id: Types.ObjectId(), collectionName, sourceDocumentId};
				if (hasItemId) draft.sourceDocumentItemId = document.itemId;
				draft.document = _.omit(document, ['_id', 'updatedAt', 'updatedBy']);
				draft.meta = {};
				draft.createdBy = userId;
				existing = await Draft.create(draft);
			}
			return existing;
		}
	}

};
