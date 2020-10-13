# reactive-stack-js

## ./src

### server.ts
...todo

### mongodb.connector.ts
...todo

### graphql.schema.ts
...todo

#### GraphQL server side query example

```typescript
graphql(schema, `{ lorem(id: "5f5f498eb312715040bd3c62") {name, itemId} }`)
	.then((data) => console.log(" - graphql response", data));
```
