#!/usr/bin/env node
"use strict";

import {model, Schema} from "mongoose";
import {GraphQLString} from "graphql";

import graphQLTypeComposerFactory from "../_graphql/_f.type.composer.factory";

export const LoremSchema = new Schema(
	{
		itemId: {type: String, required: true, index: true},
		iteration: {type: Number, required: true},
		isLatest: {type: Boolean, required: true},
		firstname: {type: String, required: true, index: true},
		lastname: {type: String, required: true, index: true},
		username: {type: String, required: true, index: true},
		email: {type: String, required: true, index: true},
		species: {type: String, required: true},
		rating: {type: Number, required: true},
		description: {type: String, required: true},
		createdBy: {type: String},
		updatedBy: {type: String}
	},
	{
		timestamps: true,
		versionKey: false,
	}
);
const Lorem = model("Lorem", LoremSchema, "lorems");
export default Lorem;

const LoremTC = graphQLTypeComposerFactory(Lorem, "GraphQLLoremType");
LoremTC.addFields({
	name: {
		type: GraphQLString,
		resolve: (instance: any) => instance.firstname + " " + instance.lastname
	}
});

export const GraphQLLoremType = LoremTC.getType();
export const GraphQLLoremTypeInput = LoremTC.getInputTypeComposer().getType();
export const graphQLMetaData = {
	name: "lorem",
	model: Lorem,
	tc: LoremTC,
	type: GraphQLLoremType,
	graphql: {
		draft: true
	}
};
