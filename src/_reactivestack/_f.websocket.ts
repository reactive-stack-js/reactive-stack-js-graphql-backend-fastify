#!/usr/bin/env node
"use strict";

import {SocketStream} from "fastify-websocket";

import Client from "./client";
import uuidv4 from "./util/_f.unique.id";

export default (connection: SocketStream): void => {
	const {socket} = connection;
	connection.resume();

	const mySocketID = uuidv4();
	console.log("[WS] Client connected", mySocketID);
	socket.send(JSON.stringify({type: "socketId", socketId: mySocketID}));

	let client = new Client();
	let subscription = client.subscribe({
		next: (message) => socket.send(message),
		error: (err) => console.log("error", err),
		complete: () => console.log("completed")
	});

	socket.on("message", async (message: string) => {
		console.log("\n - message:", message);
		message = JSON.parse(message);
		await client.consume(message);
	});

	socket.on("close", () => {
		console.log("[WS] Client disconnected", mySocketID);
		if (subscription) subscription.unsubscribe();
		subscription = null;
		if (client) client.destroy();
		client = null;
	});

	socket.on("error", () => {
		console.log("[WS] Client errored.");
	});
};
