#!/usr/bin/env node
"use strict";

import * as fs from "fs";
import * as path from "path";

import * as _ from "lodash";
import {FastifyInstance} from "fastify";
import {IncomingMessage, Server, ServerResponse} from "http";

let _routesRootFolder: string;
const METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"];

const _getCleanRelativePath = (absoluteFilePath: string, ext: string): string => {
	let relativeFilePath = _.toLower(absoluteFilePath) + '/';
	relativeFilePath = _.replace(relativeFilePath, _.toLower(_routesRootFolder), '');
	relativeFilePath = _.replace(relativeFilePath, _.toLower(ext), '');
	relativeFilePath = _.replace(relativeFilePath, 'root', '');
	relativeFilePath = _.join(_.split(relativeFilePath, '\\'), '/');
	return relativeFilePath;
};

const _fixUrl = (url: string, relativeFilePath: string): string => {
	url = relativeFilePath + url;
	url = _.join(_.split(url, '//'), '/');
	if (_.endsWith(url, '/')) url = url.slice(0, -1);
	return url;
};

const _addRoute = (fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, route: any, relativeFilePath: string): void => {
	if (!_.has(route, "url")) route.url = '/';

	const {url} = route;
	if (!_.startsWith(_.toLower(url), relativeFilePath)) route.url = _fixUrl(url, relativeFilePath);

	if (_.has(route, "method")) route.method = _.toUpper(route.method);
	else route.method = 'GET';

	if (_.isPlainObject(route) && METHODS.includes(route.method)) fastify.route(route);
};

const addRoutes = (fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, folder: string): void => {
	if (!_routesRootFolder) _routesRootFolder = folder;

	const fileNames = fs.readdirSync(folder);
	const files = _.filter(fileNames, (name) => !fs.lstatSync(path.join(folder, name)).isDirectory());
	files.forEach((file) => {
		const ext = path.extname(file);
		if (ext !== ".ts" && ext !== ".js") return;
		const absoluteFilePath = path.join(folder, file);
		const relativeFilePath = _getCleanRelativePath(absoluteFilePath, ext);

		const route = require(absoluteFilePath);
		if (_.isArray(route)) _.each(route, (r) => _addRoute(fastify, r, relativeFilePath));
		else _addRoute(fastify, route, relativeFilePath);
	});

	const folders = _.filter(fileNames, (name) => fs.lstatSync(path.join(folder, name)).isDirectory());
	folders.forEach((file) => addRoutes(fastify, path.join(folder, file)));
};
export default addRoutes;
