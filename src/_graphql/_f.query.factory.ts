#!/usr/bin/env node
'use strict';

import {Model} from 'mongoose';
import {GraphQLJSONObject} from 'graphql-type-json';
import {GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType} from 'graphql';

// TODO: add permissions...
const graphQLQueryFactory = (name: string, model: Model<any>, type: GraphQLObjectType) => {
	const queries: any = {};

	// Single by id or query
	queries[name] = {
		type,
		args: {id: {type: GraphQLID}, query: {type: GraphQLJSONObject}},
		resolve: (parent: any, args: any) => {
			const {id, query} = args;
			// const user = _.get(context, "reply.request.user");
			// if (!user) throw new Error("Not authorized");
			if (id) return model.findOne({_id: args.id});
			return model.findOne(query);
		}
	};

	// List by filter, sort, pageSize and page#
	queries[name + 's'] = {
		type: new GraphQLList(type),
		args: {
			pageSize: {type: GraphQLInt},
			page: {type: GraphQLInt},
			filter: {type: GraphQLJSONObject},
			sort: {type: GraphQLJSONObject}
		},
		resolve: (parent: any, args: any) => {
			const {page, pageSize, filter = {}, sort = {}} = args;
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
			filter: {type: GraphQLJSONObject}
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
