#!/usr/bin/env node
"use strict";

module.exports = {
	method: "GET",
	url: "/",
	preValidation: async (request: any, reply: any, done: Function) => {
		console.log("get / user", request.user);
		done();	// use done(..something..); to break process and return ..something..
	},
	handler: async (request: any, reply: any) => {
		reply.send({lorems: "api"});
	},
};
