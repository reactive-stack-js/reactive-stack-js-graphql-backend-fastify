#!/usr/bin/env node
'use strict';

import {model, Schema} from 'mongoose';
import Lorem, {GraphQLLoremType} from "./lorem";
import graphQLTypeComposerFactory from "../_graphql/_f.type.composer.factory";

const IpsumSchema = new Schema(
	{
		sed: {type: String},
		ut: {type: String},
		perspiciatis: {type: Object},
		loremId: {
			type: Schema.Types.ObjectId,
			ref: 'Lorem',
			graphql: {
				type: GraphQLLoremType,
				model: Lorem,
				target: 'lorem'
			}
		}
	},
	{
		timestamps: true,
		versionKey: false,
	},
);
const Ipsum = model('Ipsum', IpsumSchema, 'ipsums');
export default Ipsum;

const IpsumTC = graphQLTypeComposerFactory(Ipsum, 'GraphQLIpsumType');
export const GraphQLIpsumType = IpsumTC.getType();
export const graphQLMetaData = {
	name: 'ipsum',
	model: Ipsum,
	tc: IpsumTC,
	type: GraphQLIpsumType
};
