#!/usr/bin/env node
'use strict';

export type StoreScopeType = 'count' | 'one' | 'many';

export type StoreSubscriptionUpdateType = {
	target: string;
	scope: StoreScopeType;
	config: any;

	// use if mongodb is the only reactive source
	observe: string; // collectionName

	// use when more than one reactive source exists, to distinguish between them
	// observe: {
	// 	source: "mongodb",
	// 	name: string			// collectionName
	// }
};
