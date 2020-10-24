#!/usr/bin/env node
"use strict";

import {v4} from "uuid";
import {model, Schema} from "mongoose";
import graphQLTypeComposerFactory from "../_graphql/_f.type.composer.factory";

const DraftSchema = new Schema(
	{
		collectionName: {type: String, required: true},
		sourceDocumentId: {type: String, required: true},
		sourceDocumentItemId: {type: String, required: true, default: v4()},
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
