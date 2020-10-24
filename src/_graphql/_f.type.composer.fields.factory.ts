#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import {Model, Types} from 'mongoose';
import {GraphQLObjectType} from 'graphql';

export type GraphQLTypeFactoryFieldType = {
	name: string;
	target: string;
	type: GraphQLObjectType | [GraphQLObjectType];
	model: Model<any>;
	through?: string;
};

const typeComposerFieldsFactory = (fields: GraphQLTypeFactoryFieldType[]): {} => {
	const typeComposerFields: any = {};
	_.each(fields, (field) => {
		let {model, type} = field;
		const {name, target, through} = field;

		if (!through) {
			typeComposerFields[target] = {type};

			if (!_.isArray(type)) {
				typeComposerFields[target].resolve = (instance: any): any => {
					return instance[name] ? model.findOne(instance[name]) : null;
				};
			} else {
				typeComposerFields[target].resolve = (instance: any): any => {
					if (_.isEmpty(instance[name])) return [];
					return model.find({_id: instance[name]});
				};
			}
		} else {
			if (_.isFunction(type)) type = type();
			if (_.isFunction(model)) model = model();

			typeComposerFields[target] = {type};
			typeComposerFields[target].resolve = async (instance: any): Promise<any> => {
				const query: any = {};
				query[through] = {$in: [Types.ObjectId(instance._id)]};
				if (!_.isArray(type)) {
					return await model.findOne(query);
				} else {
					return await model.find(query);
				}
			};
		}
	});

	return typeComposerFields;
};
export default typeComposerFieldsFactory;
