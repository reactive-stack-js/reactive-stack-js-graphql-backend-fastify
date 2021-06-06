#!/usr/bin/env node
'use strict';

import {v4 as uuidv4} from 'uuid';
import {isString} from 'lodash';
import {SocketStream} from 'fastify-websocket';

import ReactiveStackClient from '../_reactivestack/reactive.stack.client';
import UserManager from '../auth/user.manager';

const jwtSecret = process.env.JWT_SECRET;

export default (connection: SocketStream): void => {
	const {socket} = connection;
	connection.resume();

	const mySocketID = uuidv4();
	console.log('[WS] ReactiveStackClient connected', mySocketID);
	socket.send(JSON.stringify({type: 'socketId', socketId: mySocketID}));

	const userManager = new UserManager(jwtSecret);
	let client = new ReactiveStackClient(userManager);
	let subscription = client.subscribe({
		next: (message): void => {
			if (!isString(message)) message = JSON.stringify(message);
			socket.send(message);
		},
		error: (err): void => console.log('error', err),
		complete: (): void => console.log('completed')
	});

	client.ping();

	socket.on('message', async (message: string) => {
		console.log(' - message:', message);
		message = JSON.parse(message);
		await client.consume(message);
	});

	socket.on('close', () => {
		console.log('[WS] ReactiveStackClient disconnected', mySocketID);
		if (subscription) subscription.unsubscribe();
		subscription = null;
		if (client) client.destroy();
		client = null;
	});

	socket.on('error', () => {
		console.log('[WS] ReactiveStackClient errored.');
	});
};
