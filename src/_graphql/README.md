## graphql

### GraphQL server side query example

```typescript
graphql(schema, `{ lorem(id: "5f5f498eb312715040bd3c62") {name, itemId} }`)
	.then((data) => console.log(" - graphql response", data));
```

### graphql schema example

```typescript
const GraphQLLoremType = new GraphQLObjectType({
	name: "Lorem",
	fields: () => ({
		_id: {type: new GraphQLNonNull(GraphQLString)},
		itemId: {type: GraphQLString},
		iteration: {type: GraphQLInt},
		isLatest: {type: GraphQLBoolean},
		createdAt: {type: GraphQLDateTime},
		createdBy: {type: GraphQLString},
		updatedAt: {type: GraphQLDateTime},
		updatedBy: {type: GraphQLString},
		firstname: {type: GraphQLString},
		lastname: {type: GraphQLString},
		number: {type: GraphQLInt},
		meta: {type: GraphQLJSONObject},
		name: {
			type: GraphQLString,
			resolve: (instance) => instance.firstname + " " + instance.lastname;
		}
	})
});
```