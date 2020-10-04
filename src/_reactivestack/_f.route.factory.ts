#!/usr/bin/env node
'use strict';

import * as _ from "lodash";
import {Model, Types} from "mongoose";

const routeFactory = (model: Model<any>, validator: Function) => (
	[
		{
			method: 'POST',
			url: '/api/' + _.toLower(model.modelName) + '/focus/:draftId',
			preValidation: validator,
			handler: async (request: any, reply: any) => {
				const response = await _setFocus(model, request);
				reply.send(response);
			},
		},

		{
			method: 'POST',
			url: '/api/' + _.toLower(model.modelName) + '/blur/:draftId',
			preValidation: validator,
			handler: async (request: any, reply: any) => {
				const response = await _setBlur(model, request);
				reply.send(response);
			},
		},

		{
			method: 'POST',
			url: '/api/' + _.toLower(model.modelName) + '/change/:draftId',
			preValidation: validator,
			handler: async (request: any, reply: any) => {
				const response = await _setChange(model, request);
				reply.send(response);
			},
		},

		{
			method: 'GET',
			url: '/api/' + _.toLower(model.modelName) + '/draft/:id',
			preValidation: validator,
			handler: async (request: any, reply: any) => {
				const response = await _createDraft(model, request);
				reply.send(response);
			},
		},

		{
			method: 'POST',
			url: '/api/' + _.toLower(model.modelName) + '/cancel/:draftId',
			preValidation: validator,
			handler: async (request: any, reply: any) => {
				const response = await _cancelDraft(model, request);
				reply.send(response);
			},
		}
	]
);
export default routeFactory;

const _setFocus = async (model: Model<any>, {user, params: {draftId}, body: {field}}: any) => {
	const document = await model.findOne({_id: draftId});
	if (document.isDraft) {
		let meta = _.get(document, 'meta', {});
		if (_.get(meta, field)) return false;

		_.each(meta, (val, id) => {
			if (_.get(val, 'user', false) === user.id) {
				meta = _.omit(meta, id);
			}
		});
		_.set(meta, field, {user: user.id});
		await model.updateOne({_id: draftId}, {$set: {meta}});
		return true;
	}
	return false;
};

const _setBlur = async (model: Model<any>, {user, params: {draftId}, body: {field}}: any) => {
	const document: any = await model.findOne({_id: draftId});
	if (document.isDraft) {
		const meta = _.get(document, 'meta', null);
		if (meta) {
			const curr = _.get(meta, field);
			if (curr) {
				const userId = _.get(curr, 'user');
				if (userId !== user.id) return false;
				const metaData = _.omit(meta, field);
				await model.updateOne({_id: draftId}, {$set: {meta: metaData}});
			}
		}
		return true;
	}
	return false;
};

const _setChange = async (model: Model<any>, {user, params: {draftId}, body: {field, value}}: any) => {
	const document: any = await model.findOne({_id: draftId});
	if (document.isDraft) {
		const updater = {
			updatedBy: user.id,
			updatedAt: new Date()
		};
		_.set(updater, field, value);
		await model.updateOne({_id: draftId}, {$set: updater});

		return true;
	}
	return false;
};

const _createDraft = async (model: Model<any>, {user, params: {id}}: any) => {
	const document: any = await model.findOne({_id: id});
	let existing: any = _.first(await model.find({itemId: document.itemId, isDraft: true}));
	if (!existing) {
		const draft: any = _.omit(document, ['meta', 'updatedAt', 'updatedBy']);
		draft._id = Types.ObjectId();
		draft.isDraft = true;
		draft.isLatest = false;
		draft.createdAt = new Date();
		draft.createdBy = user.id;
		existing = await model.create(draft);
	}
	return existing._id;
};

const _cancelDraft = async (model: Model<any>, {params: {draftId}}: any) => {
	const document: any = await model.findOne({_id: draftId});
	if (document.isDraft) {
		await model.remove({_id: draftId});
		return true;
	}
	return false;
};
