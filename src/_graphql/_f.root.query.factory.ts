#!/usr/bin/env node
"use strict";

import * as fs from "fs";
import * as path from "path";

import * as _ from "lodash";
import {Model} from "mongoose";
import {composeWithMongoose} from "graphql-compose-mongoose";

import graphQLQueryFactory from "./_f.query.factory";
import typeComposerFieldsFactory, {GraphQLTypeFactoryFieldType} from "./_f.type.composer.fields.factory";
import Draft, {GraphQLDraftType} from "../models/draft";
import CollectionsModelsMap from "../_reactivestack/collections.models.map";

const _metaData = (model: Model<any>): any => {
	const modelName = model.modelName;
	const words = _.join(_.map(_.words(modelName), (w) => _.upperFirst(_.toLower(w))), "");

	const name = _.lowerFirst(words);
	const typeName = _.join(["GraphQL", words, "Type"], "");

	const tc = composeWithMongoose(model, {name: typeName});
	return {
		name,
		model,
		tc,
		type: tc.getType()
	};
};

const _generateGraphQLMetaData = (fullPath: string): any => {
	const model = require(fullPath).default;
	return _metaData(model);
}

const _processFile = (root: any, folder: string, file: string): any => {
	const fullPath = path.join(folder, file);
	let {graphQLMetaData} = require(fullPath);
	if (!graphQLMetaData) graphQLMetaData = _generateGraphQLMetaData(fullPath);

	const {name, model, type} = graphQLMetaData;
	_addToReverseRefs(graphQLMetaData, fullPath);

	CollectionsModelsMap.addCollectionToModelMapping(model);

	const fields = graphQLQueryFactory(name, model, type);
	return {...root, ...fields};
};

const _processFolder = (root: any, folder: string): any => {
	const fileNames = fs.readdirSync(folder);
	const files = _.filter(fileNames, (fileName) => !fs.lstatSync(path.join(folder, fileName)).isDirectory());
	files.forEach((file) => {
		const ext = path.extname(file);
		if (ext !== ".ts" && ext !== ".js") return;

		root = _processFile(root, folder, file);
	});

	const folders = _.filter(fileNames, (fileName) => fs.lstatSync(path.join(folder, fileName)).isDirectory());
	folders.forEach((subfolder) => {
		root = _processFolder(root, subfolder);
	});

	return root;
};

let reverseRefs: any[] = [];
const _addToReverseRefs = (graphQLMetaData: any, fullPath: string): void => {
	if (!_.isEmpty(graphQLMetaData.graphql)) reverseRefs.push(fullPath);
};

const _processReverseRefs = (): void => {
	_.each(reverseRefs, (fullPath: string): void => {
		const {graphQLMetaData} = require(fullPath);
		const {tc, graphql} = graphQLMetaData;

		const schemaFields: GraphQLTypeFactoryFieldType[] = [];
		_.each(graphql, (value, key) => {
			if (_.isPlainObject(value)) {
				schemaFields.push({name: key, target: key, ...value});

			} else if (_.isBoolean(value)) {
				const fields = _.keys(tc.getFields());
				const hasItemId = _.includes(fields, "itemId");
				const through = hasItemId ? "sourceDocumentItemId" : "sourceDocumentId";
				schemaFields.push({
					name: "draft",
					target: "draft",
					type: GraphQLDraftType,
					model: Draft,
					through
				});
			}
		});
		if (!_.isEmpty(schemaFields)) {
			tc.addFields(typeComposerFieldsFactory(schemaFields));
		}
	});
};

const graphQLRootQueryFactory = (folder: string): any => {
	reverseRefs = [];
	const rootQuery = _processFolder({}, folder);
	_processReverseRefs();
	return rootQuery;
};
export default graphQLRootQueryFactory;
