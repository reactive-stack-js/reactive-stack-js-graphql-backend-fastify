#!/usr/bin/env node
'use strict';

import * as path from 'path';
import * as dotenv from 'dotenv';

import {AddressInfo} from 'net';
import {Server, IncomingMessage, ServerResponse} from 'http';

// IMPORTANT: must execute dotenv.config before importing anything requires it (like DBConnectors)
const result = dotenv.config({path: '.env.local'});
if (result.error) throw result.error;

import {fastify, FastifyInstance, FastifyRequest} from 'fastify';
import {RouteGenericInterface} from 'fastify/types/route';

import * as fastifyJwt from 'fastify-jwt';
import * as fastifyWebsocket from 'fastify-websocket';
import fastifyGQL from 'fastify-gql';
import fastifyCors from 'fastify-cors';
import fastifyBlipp from 'fastify-blipp';
import fastifyHelmet from 'fastify-helmet';

import GQLSchema from './graphql.schema';
import websocket from './functions/websocket';
import {addFastifyRoutes, MongoDBConnector} from 'reactive-stack-js-backend';

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({logger: false});

server.register(fastifyGQL, {
	schema: GQLSchema,
	queryDepth: 7, // if smaller than 7, playground throws an error
	graphiql: 'playground', // OR graphiql: true, (but then without the playgroundSettings)
	playgroundSettings: {
		'editor.fontSize': 13,
		'editor.theme': 'light',
		'prettier.tabWidth': 3,
		'prettier.useTabs': true,
		'prettier.printWidth': 180,
		'editor.cursorShape': 'line',
		'editor.fontFamily': "'Consolas'",
		'editor.reuseHeaders': true,
		'general.betaUpdates': false,
		'request.credentials': 'omit',
		'schema.disableComments': true,
		'schema.polling.enable': true,
		'schema.polling.endpointFilter': '*',
		'schema.polling.interval': 2000,
		'tracing.hideTracingResponse': true,
		'tracing.tracingSupported': true
	}
});

server.register(fastifyBlipp);
server.register(fastifyHelmet);
server.register(fastifyWebsocket);
server.register(fastifyJwt, {secret: process.env.JWT_SECRET});
server.register(fastifyCors, {
	// put your options here
	origin: [
		'http://localhost:3001',
		'http://localhost:3002',
		'http://localhost:3003',
		'http://localhost:3004',
		'http://localhost:3005',
		'http://localhost:3006',
		'http://localhost:3007',
		'http://localhost:3008'
	]
});

const _addJWTHook = (srv: FastifyInstance<Server, IncomingMessage, ServerResponse>): void => {
	srv.addHook('onRequest', async (request: FastifyRequest<RouteGenericInterface, Server, IncomingMessage>) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			// console.error('Not logged in.');
		}
	});
};

const _addWebSocketListener = (srv: FastifyInstance<Server, IncomingMessage, ServerResponse>): void => {
	srv.get('/ws', {websocket: true}, websocket);
};

const MONGODB_URI: string = process.env.MONGODB_URI || '';
// Run the server!
const startFastifyServer = async () => {
	try {
		MongoDBConnector.init(MONGODB_URI);

		_addJWTHook(server);

		_addWebSocketListener(server);

		addFastifyRoutes(server, path.join(__dirname, 'routes'));

		await server.listen(parseInt(process.env.PORT || '3007', 10));
		console.log('');
		server.blipp();
		server.log.info(`Server listening on port ${(server.server.address() as AddressInfo).port}.`);
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

startFastifyServer()
	.then(() => ({}))
	.catch((err) => console.error('Server Error:', err));

process.on('uncaughtException', (reason: string, p: Promise<any>): void => console.error('Uncaught Exception at:', p, 'reason:', reason));
process.on('unhandledRejection', (reason: string, p: Promise<any>): void => console.error('Unhandled Rejection at:', p, 'reason:', reason));
