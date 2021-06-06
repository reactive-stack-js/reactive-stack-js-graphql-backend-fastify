#!/usr/bin/env node
'use strict';

import * as mongoose from 'mongoose';
import {Model} from 'mongoose';

export default class CollectionsModelsMap {
	public static addCollectionToModelMapping(model: Model<any>): void {
		CollectionsModelsMap._models.set(model.collection.collectionName, model.modelName);
	}

	public static getModelByCollection(collectionName: string): Model<any> | null {
		const modelName = CollectionsModelsMap._models.get(collectionName);
		if (modelName) {
			try {
				return mongoose.model(modelName);
			} catch (error) {
				console.log('CollectionsModelsMap::getModelByCollection', collectionName, {err: error});
			}
		}
		return null;
	}

	public static print() {
		console.log(CollectionsModelsMap._models);
	}

	private static readonly _models: Map<string, string> = new Map<string, string>();
}
