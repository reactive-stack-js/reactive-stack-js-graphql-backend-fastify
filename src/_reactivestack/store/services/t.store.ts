#!/usr/bin/env node
'use strict';

export type StoreScopeType = 'count' | 'one' | 'many';

export type StoreSubscriptionConfigType = {
	query: any;
	sort?: any;
	fields?: any;
	skip?: number;
	page?: number;
	pageSize?: number;
	strict: false;
	incremental: false;
};

export type StoreSubscriptionUpdateType = {
	target: string;
	scope: StoreScopeType;
	config: StoreSubscriptionConfigType;

	// use if mongodb is the only reactive source
	observe: string; // collectionName

	// use when more than one reactive source exists, to distinguish between them
	// observe: {
	// 	source: "mongodb",
	// 	name: string			// collectionName
	// }
};
