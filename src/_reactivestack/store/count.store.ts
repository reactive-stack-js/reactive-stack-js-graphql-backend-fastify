#!/usr/bin/env node
'use strict';

import {concat, intersection, isEmpty, keys} from 'lodash';
import {Model} from 'mongoose';

import observableModel from '../util/_f.observable.model';
import AStore, {EStoreType} from './_a.store';

export default class CountStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COUNT;
		Object.setPrototypeOf(this, CountStore.prototype);
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model)
			.subscribe({
				next: (change: any): Promise<void> => this.load(change)
			});
	}

	protected async load(change: any): Promise<void> {
		if (isEmpty(this._config)) return this.emitOne();

		const {operationType: type, updateDescription: description} = change;

		let reload = true;
		if ('update' === type) {
			const qs = keys(this._query);
			if (!description) reload = true;
			else {
				const {updatedFields, removedFields} = description;
				const us = concat(removedFields, keys(updatedFields));
				reload = !isEmpty(intersection(qs, us));
			}
		}

		if (reload) {
			const count = await this._model.countDocuments(this._query);
			this.emitOne(count);
		}
	}
}
