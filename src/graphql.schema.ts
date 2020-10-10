import * as path from "path";
import {GraphQLSchema, GraphQLObjectType} from "graphql";

import graphQLRootQueryFactory from "./_graphql/_f.root.query.factory";
import graphQLRootMutationsFactory from "./_graphql/_f.root.mutations.factory";

const RootQuery = new GraphQLObjectType({
	name: "RootQueryType",
	fields: {
		...graphQLRootQueryFactory(path.join(__dirname, "./models"))
	}
});

const Mutations = new GraphQLObjectType({
	name: "Mutations",
	fields: {
		...graphQLRootMutationsFactory(path.join(__dirname, "./mutations"))
	}
});

const GQLSchema = new GraphQLSchema({
	query: RootQuery,
	mutation: Mutations
});
export default GQLSchema;

// Exmaple call:
// graphql(schema, `{ lorem(id: "5f5f498eb312715040bd3c62") {name, itemId} }`)
// 	.then(data => console.log(" - graphql on the server", data))