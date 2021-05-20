#!/usr/bin/env node
'use strict';

const criteria = (scope: string, collection: string): string => `${scope}-${collection}`;

export default class DataMiddlewareMap {
	public static addProcessor(scope: string, collection: string, processor: Function): void {
		DataMiddlewareMap._processors.set(criteria(scope, collection), processor);
	}

	public static hasProcessor(scope: string, collection: string): boolean {
		return !!DataMiddlewareMap._processors.get(criteria(scope, collection));
	}

	public static getProcessor(scope: string, collection: string): Function | null {
		return DataMiddlewareMap._processors.get(criteria(scope, collection));
	}

	private static readonly _processors: Map<string, Function> = new Map<string, Function>();
}
