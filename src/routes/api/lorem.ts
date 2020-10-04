#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import * as dotenv from "dotenv";

import Lorem from '../../models/lorem';
import routeFactory from "../../_reactivestack/_f.route.factory";

dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

const _validate = (request: any, reply: any, done: Function) => {
	// IMPODTANT: do NOT use plain done() without params in POST - it doubles the call for some reason...

	// console.log('_validate user:', request.user.id, request.user.name);
	// TODO: verify permissions
	// if fail use: done(..something..); to break process and return ..something..
	done();
};

module.exports = [

	// ...routeFactory(Lorem, _validate),

	// {
	// 	method: 'POST',
	// 	url: '/api/lorem/save/',
	// 	preValidation: _validate,
	// 	handler: async (request, reply) => {
	// 		const lorem: any = request.body.document;
	// 		if (lorem.isDraft) {
	// 			const max: any = _.first(await Lorem.find({itemId: lorem.itemId, isLatest: true}));
	// 			await Lorem.update({_id: max._id}, {$set: {isLatest: false}});
	//
	// 			await Lorem.update(
	// 				{_id: lorem._id},
	// 				{
	// 					$set: {
	// 						isLatest: true,
	// 						iteration: max.iteration + 1,
	// 						createdBy: request.user.id
	// 					},
	// 					$unset: {
	// 						meta: null,
	// 						isDraft: null,
	// 						updatedBy: null
	// 					}
	// 				});
	//
	// 			return reply.send(true);
	// 		}
	// 		reply.send(false);
	// 	},
	// }

];
