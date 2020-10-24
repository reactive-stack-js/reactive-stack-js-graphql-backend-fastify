#!/usr/bin/env node
'use strict';

module.exports = {
	method: 'GET',
	preValidation: async (request: any, reply: any, done: Function): Promise<void> => {
		console.log('get / user', request.user);
		done(); // use done(..something..); to break process and return ..something..
	},
	handler: async (request: any, reply: any): Promise<void> => {
		reply.send({lorems: 'api'});
	}
};
