#!/usr/bin/env node
"use strict";

import {AddressInfo} from "net";
import {Server, IncomingMessage, ServerResponse} from "http"
import * as path from "path";
import * as dotenv from "dotenv";

import {fastify, FastifyInstance} from "fastify";

import fastifyGQL from "fastify-gql";
import fastifyCors from "fastify-cors";
import fastifyBlipp from "fastify-blipp";
import fastifyHelmet from "fastify-helmet";
import * as fastifyJwt from "fastify-jwt";
import * as fastifyWebsocket from "fastify-websocket";

// IMPORTANT: must execute dotenv before importing anything that depends on process.env (like MongoDBConnector, for example)
dotenv.config({path: ".env.local"});

import GQLSchema from "./graphql.schema";
import MongoDBConnector from "./mongodb.connector";

import addRoutes from "./util/_f.add.routes";
import websocket from "./_reactivestack/_f.websocket";

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({logger: false})

server.register(fastifyGQL, {
	schema: GQLSchema,
	queryDepth: 7,					// if smaller than 7, playground throws an error

	// graphiql: true,
	graphiql: "playground",
	playgroundSettings: {
		"editor.fontSize": 13,
		"editor.theme": "light",
		"prettier.tabWidth": 3,
		"prettier.useTabs": true,
		"prettier.printWidth": 60,
		"editor.cursorShape": "line",
		"editor.fontFamily": "'Consolas'",
		"editor.reuseHeaders": true,
		"general.betaUpdates": false,
		"request.credentials": "omit",
		"schema.disableComments": true,
		"schema.polling.enable": true,
		"schema.polling.endpointFilter": "*",
		"schema.polling.interval": 2000,
		"tracing.hideTracingResponse": true,
		"tracing.tracingSupported": true
	}
});

// @ts-ignore
server.register(fastifyJwt, {secret: process.env.JWT_SECRET});
server.register(fastifyCors, {
	// put your options here
	origin: [
		"http://localhost:3007",
		"http://localhost:3008"
	]
});
// NOTE: do this only on NON-PROD environments!
server.register(fastifyHelmet, {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: [`"self"`],
			styleSrc: ["*", `https: "unsafe-inline"`],
			scriptSrc: ["*", `https: "unsafe-inline" "unsafe-eval"`],
			imgSrc: ["*", "data:"]
		},
	},
});
server.register(fastifyBlipp);
server.register(fastifyWebsocket);

const addJWTHook = (srv: FastifyInstance<Server, IncomingMessage, ServerResponse>): void => {
	srv.addHook("onRequest", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			// reply.send(err);
		}
	});
};

const addWebSocketListener = (srv: FastifyInstance<Server, IncomingMessage, ServerResponse>): void => {
	srv.get("/ws", {websocket: true}, websocket);
};

// Run the server!
const startFastifyServer = async () => {
	try {
		MongoDBConnector.init();

		addJWTHook(server);

		addWebSocketListener(server);

		addRoutes(server, path.join(__dirname, "routes"));

		await server.listen(parseInt(process.env.PORT || "3007", 10));
		console.log("");
		server.blipp();
		server.log.info(`Server listening on port ${(server.server.address() as AddressInfo).port}.`);

	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

startFastifyServer()
	.then(() => ({}))
	.catch((err) => console.error("Server Error:", err));

process.on("uncaughtException", (reason: string, p: any) => console.error("Uncaught Exception at:", p, "reason:", reason));
process.on("unhandledRejection", (reason: string, p: any) => console.error("Unhandled Rejection at:", p, "reason:", reason));
