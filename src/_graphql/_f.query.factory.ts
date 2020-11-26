#!/usr/bin/env node
'use strict';

import {first, pick, keys} from 'lodash';
import {Model} from 'mongoose';
import {GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType} from 'graphql';
import graphQLFilterTypeFactory from './_f.filter.type.factory';
import graphQLSortingTypeFactory from './_f.sorting.type.factory';

// TODO: add permissions...
const graphQLQueryFactory = (name: string, model: Model<any>, type: GraphQLObjectType) => {
	const queries: any = {};

	const filterType = graphQLFilterTypeFactory(type);
	const sortingType = graphQLSortingTypeFactory(type);

	// Single by id or query
	queries[name] = {
		type,
		args: {
			id: {type: GraphQLID}
		},
		resolve: async (parent: any, args: any) => {
			const {id} = args;
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");

			return model.findOne({_id: id});
		}
	};

	// List by filter, _sort, pageSize and page#
	queries[name + 's'] = {
		type: new GraphQLList(type),
		args: {
			...filterType.getFields(),
			_sort: {type: sortingType},
			_pageSize: {type: GraphQLInt},
			_page: {type: GraphQLInt}
		},
		resolve: (parent: any, args: any) => {
			const {_sort = {}, _pageSize, _page = 1} = args;
			const filter = pick(args, keys(filterType.getFields()));
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");
			if (_page && _pageSize) {
				return model
					.find(filter)
					.sort(_sort)
					.limit(_pageSize)
					.skip((_page - 1) * _pageSize);
			}

			return model.find(filter).sort(_sort);
		}
	};

	// Count by filter
	queries[name + 'sCount'] = {
		type: GraphQLInt,
		args: {
			...filterType.getFields()
		},
		resolve: (parent: any, args: any) => {
			const filter = pick(args, keys(filterType.getFields()));
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");
			return model.countDocuments(filter);
		}
	};

	return queries;
};
export default graphQLQueryFactory;
