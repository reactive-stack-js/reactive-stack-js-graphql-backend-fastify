#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import {GraphQLInputObjectType, GraphQLInt, GraphQLObjectType} from 'graphql';

const _sortingDescription = 'This is a sorting field, please use 1 for ASC and -1 for DESC sorting.';
const _sortingType = {
	type: GraphQLInt,
	description: _sortingDescription
};
const graphQLSortingTypeFactory = (type: GraphQLObjectType): GraphQLInputObjectType => {
	const sortingFields = {};
	_.each(type.getFields(), (value, key) => {
		if (value.resolve) return;
		else _.set(sortingFields, key, _sortingType);
	});

	return new GraphQLInputObjectType({
		name: type.name + 'Input',
		description: type.name + ' Sorting model.',
		fields: () => ({...sortingFields})
	});
};
export default graphQLSortingTypeFactory;
