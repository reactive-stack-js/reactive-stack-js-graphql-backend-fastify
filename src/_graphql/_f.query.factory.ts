#!/usr/bin/env node
'use strict';

import {first} from 'lodash';
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
			const {id, query, sort = {}} = args;
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");

			if (id) return model.findOne({_id: args.id});

			const rows = await model.find(query).sort(sort);
			return first(rows);
		}
	};

	// List by filter, sort, pageSize and page#
	queries[name + 's'] = {
		type: new GraphQLList(type),
		args: {
			filter: {type: filterType},
			sort: {type: sortingType},
			pageSize: {type: GraphQLInt},
			page: {type: GraphQLInt}
		},
		resolve: (parent: any, args: any) => {
			const {filter = {}, sort = {}, pageSize, page} = args;
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");
			if (page && pageSize) {
				return model
					.find(filter)
					.sort(sort)
					.limit(pageSize)
					.skip((page - 1) * pageSize);
			}

			return model.find(filter).sort(sort);
		}
	};

	// Count by filter
	queries[name + 'sCount'] = {
		type: GraphQLInt,
		args: {
			filter: {type: filterType}
		},
		resolve: (parent: any, args: any) => {
			const {filter = {}} = args;
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");
			return model.countDocuments(filter);
		}
	};

	return queries;
};
export default graphQLQueryFactory;
