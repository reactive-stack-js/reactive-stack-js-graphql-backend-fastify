#!/usr/bin/env node
"use strict";

type StoreSubscriptionUpdate = {
	target: string,
	scope: "many" | "one",
	config: any,

	// use if mongodb is the only reactive source
	observe: string				// collectionName

	// use when more than one reactive source exists, to distinguish between them
	// observe: {
	// 	source: "mongodb",
	// 	name: string			// collectionName
	// }
};
export default StoreSubscriptionUpdate;