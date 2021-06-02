#!/usr/bin/env node
'use strict';

const criteria = (scope: string, collection: string): string => `${scope}-${collection}`;

export default class DataMiddlewareMap {
	public static addMiddleware(scope: string, collection: string, processor: Function): void {
		DataMiddlewareMap._middlewares.set(criteria(scope, collection), processor);
	}

	public static hasMiddleware(scope: string, collection: string): boolean {
		return !!DataMiddlewareMap._middlewares.get(criteria(scope, collection));
	}

	public static getMiddleware(scope: string, collection: string): Function | null {
		return DataMiddlewareMap._middlewares.get(criteria(scope, collection));
	}

	private static readonly _middlewares: Map<string, Function> = new Map<string, Function>();
}
