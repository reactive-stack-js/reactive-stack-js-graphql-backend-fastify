#!/usr/bin/env node
'use strict';

import {concat, intersection, isEmpty, keys} from 'lodash';
import {Model} from 'mongoose';

import observableModel from '../databases/mongodb/functions/observable.model';
import AStore, {EStoreType} from './a.store';

export default class CountStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COUNT;
		Object.setPrototypeOf(this, CountStore.prototype);
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model).subscribe({
			next: (change: any): Promise<void> => this.load(change)
		});
	}

	protected async load(change: any): Promise<void> {
		if (isEmpty(this._config)) return this.emitOne();

		let reload = true;

		const {operationType: type} = change;
		if ('update' === type) {
			const {updateDescription: description} = change;
			if (!description) reload = true;
			else {
				const {updatedFields, removedFields} = description;
				const us = concat(removedFields, keys(updatedFields));
				reload = !isEmpty(intersection(keys(this._fields), us));
			}
		}
		if (!reload) return;

		console.log(' - DB Reload Count for query:', this._query);
		const count = await this._model.countDocuments(this._query);
		this.emitOne(count);
	}
}
