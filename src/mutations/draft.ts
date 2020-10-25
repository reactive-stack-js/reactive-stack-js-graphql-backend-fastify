#!/usr/bin/env node
'use strict';

import {Model, Types} from 'mongoose';
import {each, first, get, includes, keys, omit, set} from 'lodash';

import {GraphQLJSONObject} from 'graphql-type-json';
import {GraphQLBoolean, GraphQLID, GraphQLString} from 'graphql';

import Draft from '../models/draft';
import CollectionsModelsMap from '../_reactivestack/util/collections.models.map';

const _hasItemId = (model: Model<any>): boolean => includes(keys(model.schema.paths), 'itemId');

const _getUserId = (context: any): string => get(context, 'reply.request.user.id', null);

// TODO: extend to verify permissions, see below for usage
const _authorize = (context: any): boolean => {
	const userId = get(context, 'reply.request.user', null);
	return !!userId;
};

module.exports = {
	draftFocus: {
		type: GraphQLBoolean,
		args: {
			draftId: {type: GraphQLID},
			field: {type: GraphQLString}
		},
		resolve: async (root: any, args: any, context: any) => {
			const userId = _getUserId(context);
			const {draftId, field} = args;
			// console.log("draftFocus", {draftId, field, userId});

			if (!_authorize(context)) return false;

			const draft = await Draft.findOne({_id: draftId});
			if (!draft) throw new Error(`Draft does not exist: ${draftId}`);

			let meta = get(draft, 'meta', {});
			if (get(meta, field)) return false;

			each(meta, (val, id) => {
				if (get(val, 'user', false) === userId) meta = omit(meta, id);
			});
			set(meta, field, {user: userId});
			await Draft.updateOne({_id: draftId}, {$set: {meta}});
			return true;
		}
	},

	draftBlur: {
		type: GraphQLBoolean,
		args: {
			draftId: {type: GraphQLID},
			field: {type: GraphQLString}
		},
		resolve: async (root: any, args: any, context: any) => {
			const userId = _getUserId(context);
			const {draftId, field} = args;
			// console.log("draftBlur", {draftId, field, userId});

			const draft: any = await Draft.findOne({_id: draftId});
			if (!draft) throw new Error(`Draft does not exist: ${draftId}`);

			const meta = get(draft, 'meta', null);
			if (meta) {
				const curr = get(meta, field);
				if (curr) {
					const focusedBy = get(curr, 'user');
					if (focusedBy !== userId) return false;
					const metaData = omit(meta, field);
					await Draft.updateOne({_id: draftId}, {$set: {meta: metaData}});
				}
			}
			return true;
		}
	},

	draftChange: {
		type: GraphQLJSONObject,
		args: {
			draftId: {type: GraphQLID},
			change: {type: GraphQLJSONObject} // field, value
		},
		resolve: async (root: any, args: any, context: any) => {
			const userId = _getUserId(context);
			const {draftId, change} = args;
			const {field, value} = change;
			// console.log("draftChange", {draftId, change, userId});

			const draft: any = await Draft.findOne({_id: draftId});
			if (draft) {
				let {document} = draft;
				document = set(document, field, value);
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
			draftId: {type: GraphQLID}
		},
		resolve: async (root: any, args: any) => {
			// , context: any
			// const userId = _getUserId(context);
			// TODO: authorize...

			const {draftId} = args;
			// console.log("draftCancel", {draftId});

			await Draft.deleteOne({_id: draftId});
			return true;
		}
	},

	/**
	 * This method will not work for complex drafts.
	 * For documents that have references, please create a "create draft" method
	 * in the respective mutations file and handle it there.
	 */
	draftCreate: {
		type: GraphQLID,
		args: {
			collectionName: {type: GraphQLString},
			sourceDocumentId: {type: GraphQLID}
		},
		resolve: async (root: any, args: any, context: any) => {
			const userId = _getUserId(context);
			const {collectionName, sourceDocumentId} = args;
			// console.log("draftCreate", {userId, collectionName, sourceDocumentId});

			const model = CollectionsModelsMap.getModelByCollection(collectionName);
			if (!model) throw new Error(`Model not found for collectionName ${collectionName}`);

			const document = await model.findOne({_id: sourceDocumentId});

			const hasItemId = _hasItemId(model);
			let draftQuery: any = {collectionName, sourceDocumentId};
			if (hasItemId) draftQuery = {collectionName, sourceDocumentItemId: document.itemId};

			let existing: any = await Draft.findOne(draftQuery);
			if (!existing) {
				const draft: any = {_id: Types.ObjectId(), collectionName, sourceDocumentId};
				if (hasItemId) draft.sourceDocumentItemId = document.itemId;
				draft.document = omit(document, ['_id', 'updatedAt', 'updatedBy']);
				draft.meta = {};
				draft.createdBy = userId;
				existing = await Draft.create(draft);
			}
			return existing._id;
		}
	},

	/**
	 * This method will not work for complex drafts.
	 * For documents that have references, please create a "save draft" method
	 * in the respective mutations file and handle it there.
	 */
	draftSave: {
		type: GraphQLID,
		args: {
			draftId: {type: GraphQLID}
		},
		resolve: async (root: any, args: any, context: any) => {
			const userId = _getUserId(context);
			const {draftId} = args;

			const draft: any = await Draft.findOne({_id: draftId});
			const {collectionName} = draft;

			const model = CollectionsModelsMap.getModelByCollection(collectionName);
			if (!model) throw new Error(`Model not found for collectionName ${collectionName}`);

			const document = omit(draft.document, ['_id', 'createdAt']);

			let max: any = await model.find({itemId: document.itemId}).sort({iteration: -1}).limit(1);
			max = first(max);
			await model.updateOne({_id: max._id}, {$set: {isLatest: false}});

			document.isLatest = true;
			document.iteration = max.iteration + 1;
			document.createdBy = userId;
			document.createdAt = new Date();

			await Draft.deleteOne({_id: draftId});
			const dbDocument = await model.create(document);
			return dbDocument._id;
		}
	}
};
