#!/usr/bin/env node
"use strict";

import {model, Schema, Types} from "mongoose";
import Dolor, {GraphQLDolorType} from "./dolor";
import graphQLTypeComposerFactory from "../_graphql/_f.type.composer.factory";

const ConsecteturSchema = new Schema(
	{
		natus: {type: String},
		fugiat: {type: String},
		voluptatem: {type: Object},
		dolorIds: {
			type: [Schema.Types.ObjectId],
			ref: "Dolor",
			graphql: {
				type: [GraphQLDolorType],
				model: Dolor
			}
		}
	},
	{
		timestamps: true,
		versionKey: false,
	},
);
const Consectetur = model("Consectetur", ConsecteturSchema, "consecteturs");
export default Consectetur;

const ConsecteturTC = graphQLTypeComposerFactory(Consectetur, "GraphQLConsecteturType");
export const GraphQLConsecteturType = ConsecteturTC.getType();
export const graphQLMetaData = {
	name: "consectetur",
	model: Consectetur,
	tc: ConsecteturTC,
	type: GraphQLConsecteturType
};
