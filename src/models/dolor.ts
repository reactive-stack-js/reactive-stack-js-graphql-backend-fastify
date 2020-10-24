#!/usr/bin/env node
'use strict';

import {model, Schema} from 'mongoose';
import Ipsum, {GraphQLIpsumType} from './ipsum';
import graphQLTypeComposerFactory from '../_graphql/_f.type.composer.factory';
import Consectetur, {GraphQLConsecteturType} from './consectetur';

const DolorSchema = new Schema(
	{
		unde: {type: String},
		omnis: {type: String},
		iste: {type: Object},
		ipsumId: {
			type: Schema.Types.ObjectId,
			ref: 'Ipsum',
			graphql: {
				type: GraphQLIpsumType,
				model: Ipsum
			}
		},
		dolorId: {
			type: Schema.Types.ObjectId,
			ref: 'Dolor',
			graphql: true
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);
const Dolor = model('Dolor', DolorSchema, 'dolors');
export default Dolor;

const DolorTC = graphQLTypeComposerFactory(Dolor, 'GraphQLDolorType');

export const GraphQLDolorType = DolorTC.getType();
export const graphQLMetaData = {
	name: 'dolor',
	model: Dolor,
	tc: DolorTC,
	type: GraphQLDolorType,
	graphql: {
		consectetur: {
			type: () => GraphQLConsecteturType,
			model: () => Consectetur,
			through: 'dolorIds'
		}
	}
};
