#!/usr/bin/env node
"use strict";

import * as fs from "fs";
import * as path from "path";

import * as _ from "lodash";
import {FastifyInstance} from "fastify";
import {IncomingMessage, Server, ServerResponse} from "http";

const METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"];
const _addRoute = (fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, route: any): void => {
	if (_.has(route, "method")) route.method = _.toUpper(route.method);
	if (_.isPlainObject(route) && METHODS.includes(route.method)) {
		fastify.route(route);
	}
};

const addRoutes = (fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, folder: string): void => {
	const fileNames = fs.readdirSync(folder);

	const files = _.filter(fileNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	files.forEach((file) => {
		const ext = path.extname(file);
		if (ext !== ".ts" && ext !== ".js") return;

		const route = require(path.join(folder, file));
		if (_.isArray(route)) _.each(route, (r) => _addRoute(fastify, r));
		else _addRoute(fastify, route);
	});

	const folders = _.filter(fileNames, (name) => fs.lstatSync(path.join(folder, name)).isDirectory());
	folders.forEach((file) => addRoutes(fastify, path.join(folder, file)));
};

export default addRoutes;
