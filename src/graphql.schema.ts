import * as path from 'path';
import {GraphQLSchema, GraphQLObjectType} from 'graphql';

import graphQLRootQueryFactory from './_reactivestack/graphql/factories/_f.root.query.factory';
import graphQLRootMutationsFactory from './_reactivestack/graphql/factories/_f.root.mutations.factory';

export default new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			...graphQLRootQueryFactory(path.join(__dirname, './models'))
		}
	}),
	mutation: new GraphQLObjectType({
		name: 'Mutations',
		fields: {
			...graphQLRootMutationsFactory(path.join(__dirname, './mutations'))
		}
	})
});
