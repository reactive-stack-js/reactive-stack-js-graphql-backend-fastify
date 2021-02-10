#!/usr/bin/env node
'use strict';

import * as http from 'http';

declare module 'fastify' {
	// @ts-ignore
	export interface FastifyInstance<HttpServer = http.Server,
		HttpRequest = http.IncomingMessage,
		HttpResponse = http.ServerResponse> {
		// @ts-ignore
		blipp(): void;
	}
}
