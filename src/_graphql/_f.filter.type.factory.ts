#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import {GraphQLID, GraphQLInputObjectType, GraphQLObjectType} from 'graphql';

const graphQLFilterTypeFactory = (type: GraphQLObjectType): GraphQLInputObjectType => {
	const filterFields = {};
	_.each(type.getFields(), (value, key) => {
		if (value.resolve) return;
		else if (GraphQLID === value.type) return;
		else _.set(filterFields, key, _.pick(value, ['type']));
	});

	return new GraphQLInputObjectType({
		name: type.name + 'Filter',
		description: type.name + ' Filtering model.',
		fields: () => ({...filterFields})
	});
};
export default graphQLFilterTypeFactory;
