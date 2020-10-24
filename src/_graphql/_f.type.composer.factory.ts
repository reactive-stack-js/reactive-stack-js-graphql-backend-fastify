#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import {Model} from 'mongoose';
import {ObjectTypeComposer} from 'graphql-compose';
import {composeWithMongoose} from 'graphql-compose-mongoose';

import typeComposerFieldsFactory, {GraphQLTypeFactoryFieldType} from './_f.type.composer.fields.factory';

const _createTargetName = (name: string): string => {
	const parts = _.split(name, 'Id');
	return _.join(parts, 'Document');
};

const graphQLTypeComposerFactory = (
	model: Model<any>,
	name: string,
	additionalFields?: any
): ObjectTypeComposer<any, any> => {
	const tc = composeWithMongoose(model, {name});
	const type = tc.getType();

	if (!_.isEmpty(additionalFields)) tc.addFields(additionalFields);

	const schemaFields: GraphQLTypeFactoryFieldType[] = [];
	_.each(model.schema.obj, (value, key) => {
		const targetName = _createTargetName(key);

		if (_.isPlainObject(value.graphql)) {
			if (!_.get(value, 'graphql.target', false)) {
				_.set(value, 'graphql.target', targetName);
			}
			schemaFields.push({name: key, ...value.graphql});
		} else if (_.isString(value.graphql)) {
			schemaFields.push({name: key, target: value.graphql, type, model});
		} else if (_.isBoolean(value.graphql)) {
			schemaFields.push({name: key, target: targetName, type, model});
		}
	});
	if (!_.isEmpty(schemaFields)) {
		tc.addFields(typeComposerFieldsFactory(schemaFields));
	}

	return tc;
};
export default graphQLTypeComposerFactory;
