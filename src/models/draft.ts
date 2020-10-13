#!/usr/bin/env node
"use strict";

import {model, Schema} from "mongoose";
import uuidv4 from "../_reactivestack/util/_f.unique.id";
import graphQLTypeComposerFactory from "../_graphql/_f.type.composer.factory";
import {GraphQLString} from "graphql";
import {GraphQLJSONObject} from "graphql-type-json";
import CollectionsModelsMap from "../_reactivestack/collections.models.map";

const DraftSchema = new Schema(
	{
		collectionName: {type: String, required: true},
		sourceDocumentId: {type: String, required: true},
		sourceDocumentItemId: {type: String, required: true, default: uuidv4()},
		createdBy: {type: String, required: true},
		document: {type: Object, required: true},
		meta: {type: Object, default: {}}
	},
	{
		timestamps: true,
		versionKey: false,
	},
);
const Draft = model("Draft", DraftSchema, "drafts");
export default Draft;

const DraftTC = graphQLTypeComposerFactory(Draft, "GraphQLDraftType");
export const GraphQLDraftType = DraftTC.getType();
export const GraphQLDraftTypeInput = DraftTC.getInputTypeComposer().getType();
export const graphQLMetaData = {
	name: "draft",
	model: Draft,
	tc: DraftTC,
	type: GraphQLDraftType
};
