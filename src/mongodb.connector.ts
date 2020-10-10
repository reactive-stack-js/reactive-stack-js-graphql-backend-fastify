#!/usr/bin/env node
"use strict";

import * as mongoose from "mongoose";
import {Connection} from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI || "";

export default class MongoDBConnector {

	public static init(): Connection {
		if (!MongoDBConnector._instance) MongoDBConnector._instance = new MongoDBConnector();
		return this._instance._connection;
	}

	private static _instance: MongoDBConnector;
	private readonly _connection: Connection;

	private constructor() {
		mongoose
			.connect(MONGODB_URI, {
				poolSize: 10,
				useCreateIndex: true,
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(() => ({}))
			.catch(console.error);

		this._connection = mongoose.connection;
		this._connection.on("error", console.error.bind(console, "connection error:"));
		this._connection.once("open", () => console.log("MongoDB connected to", MONGODB_URI));
	}
}
