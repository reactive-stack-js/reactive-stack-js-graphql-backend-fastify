#!/usr/bin/env node
"use strict";

import * as _ from "lodash";
import {Subject} from "rxjs";
import {ChangeStream} from "mongodb";
import {Model} from "mongoose";

// TODO: add USER param to be able to CHECK PERMISSIONS in ObservableModelsMap

class ObservableModel extends Subject<any> {
	private _model: any;
	private _stream: ChangeStream;

	constructor(model: Model<any>) {
		super();
		this._model = model;
		this._stream = this._model.watch([], {fullDocument: "updateLookup"});

		this._stream.on("change", (change) => {
			// you can also just forward the entire change object: this.next(change);
			this.next(_.pick(change, ["ns", "documentKey", "operationType", "updateDescription", "fullDocument"]));
		});
	}
}

class ObservableModelsMap {

	private static _instance: ObservableModelsMap;

	public static init(): ObservableModelsMap {
		if (!this._instance) this._instance = new ObservableModelsMap();
		return this._instance;
	}

	public static get(model: Model<any>): ObservableModel {
		const instance = ObservableModelsMap.init();
		const map = instance._map;
		const collectionName = model.collection.collectionName;
		if (!map.get(collectionName)) map.set(collectionName, new ObservableModel(model));
		return map.get(collectionName);
	}

	private readonly _map: Map<string, ObservableModel>;

	private constructor() {
		this._map = new Map<string, ObservableModel>();
	}
}

const observableModel = (model: any): ObservableModel => ObservableModelsMap.get(model);
export default observableModel;

// @TODO nice2have: stop stream when no subscribers / restart stream on subscribe... not MVP:
// this._stream.close();
// observableModels.delete(id);
