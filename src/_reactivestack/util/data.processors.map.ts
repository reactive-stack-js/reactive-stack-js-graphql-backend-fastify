#!/usr/bin/env node
'use strict';

const criteria = (scope: string, collection: string): string => `${scope}-${collection}`;

export default class DataProcessorsMap {
	public static addProcessor(scope: string, collection: string, processor: Function): void {
		DataProcessorsMap._processors.set(criteria(scope, collection), processor);
	}

	public static hasProcessor(scope: string, collection: string): boolean {
		return !!DataProcessorsMap._processors.get(criteria(scope, collection));
	}

	public static getProcessor(scope: string, collection: string): Function | null {
		return DataProcessorsMap._processors.get(criteria(scope, collection));
	}

	private static readonly _processors: Map<string, Function> = new Map<string, Function>();
}
