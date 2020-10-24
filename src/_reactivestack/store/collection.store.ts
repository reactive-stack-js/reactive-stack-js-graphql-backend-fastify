#!/usr/bin/env node
'use strict';

import * as _ from 'lodash';
import {Model} from 'mongoose';

import AStore, {EStoreType} from './_a.store';
import observableModel from '../util/_f.observable.model';

export default class CollectionStore extends AStore {
	constructor(model: Model<any>, field: string) {
		super(model, field);
		this._type = EStoreType.COLLECTION;
		Object.setPrototypeOf(this, CollectionStore.prototype);
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model).subscribe({
			next: (c: any) => this.load()
		});
	}

	protected async load(): Promise<void> {
		// console.log("\n - CollectionSection load", this._field, this._query, this._sort, this._fields, this._paging);
		if (_.isEmpty(this._config)) return this.emit();

		let data = [];
		const total = await this._model.countDocuments(this._query);

		if (total > 0) {
			data = await this._model.find(this._query, this._fields, this._paging).sort(this._sort);
		}

		this.emit({total, data});
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();

		const {page, pageSize} = this._config;
		this._paging = {};
		if (page && pageSize) {
			this._paging = {
				skip: (page - 1) * pageSize,
				limit: pageSize
			};
		}
	}
}
