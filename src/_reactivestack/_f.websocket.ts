#!/usr/bin/env node
'use strict';

import {v4} from 'uuid';
import {isString} from 'lodash';
import {SocketStream} from 'fastify-websocket';

import Client from './client';

export default (connection: SocketStream): void => {
	const {socket} = connection;
	connection.resume();

	const mySocketID = v4();
	console.log('[WS] Client connected', mySocketID);
	socket.send(JSON.stringify({type: 'socketId', socketId: mySocketID}));

	let client = new Client();
	let subscription = client.subscribe({
		next: (message: any): void => {

			if (!isString(message)) message = JSON.stringify(message);
			socket.send(message)
		},
		error: (err: any): void => console.log('error', err),
		complete: (): void => console.log('completed')
	});

	socket.on('message', async (message: string) => {
		console.log(' - message:', message);
		message = JSON.parse(message);
		await client.consume(message);
	});

	socket.on('close', () => {
		console.log('[WS] Client disconnected', mySocketID);
		if (subscription) subscription.unsubscribe();
		subscription = null;
		if (client) client.destroy();
		client = null;
	});

	socket.on('error', () => {
		console.log('[WS] Client errored.');
	});
};
