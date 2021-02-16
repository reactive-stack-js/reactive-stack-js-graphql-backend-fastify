#!/usr/bin/env node
'use strict';

import sift from 'sift';
import {isEmpty, omit} from 'lodash';
import {Model} from 'mongoose';

import AStore, {EStoreType} from './_a.store';
import observableModel from '../util/_f.observable.model';
import {filter} from 'rxjs/operators';

export default class CollectionStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COLLECTION;
		Object.setPrototypeOf(this, CollectionStore.prototype);
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model)
			.pipe(filter((change) => this._pipeFilter(change)))
			.subscribe({
				next: (change: any): Promise<void> => this.load(change)
			});
	}

	protected async load(change: any): Promise<void> {
		// console.log(" - CollectionStore load", this._field, this._query, this._sort, this._fields, this._paging);
		if (isEmpty(this._config)) return this.emit();

		if (this._incremental) {
			const {operationType, documentKey, fullDocument: document} = change;
			if ('delete' === operationType) return this.emitDelete(documentKey);

			const test = sift(omit(this._query, ['createdAt', 'updatedAt']));
			const valid = test(document);
			if (valid && !isEmpty(document)) {
				if (!isEmpty(this._populates)) {
					for (const populate of this._populates) {
						await this._model.populate(document, {path: populate});
					}
				}
				return this.emit({data: document});
			}
			return;
		}

		let data = [];
		const total = await this._model.countDocuments(this._query);
		if (total > 0) data = await this._model.find(this._query, this._fields, this._paging).sort(this._sort);

		if (!isEmpty(this._populates)) {
			for (const populate of this._populates) {
				await this._model.populate(data, {path: populate});
			}
		}

		this.emit({total, data});
	}

	private _pipeFilter(change: any): boolean {
		if (!this._strict) return true;

		const {operationType, fullDocument: document} = change;
		if (!document && 'delete' === operationType) return true;

		const test = sift(omit(this._query, ['createdAt', 'updatedAt']));
		return test(document);
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();

		const {strict = false, incremental = false} = this._config;
		this._incremental = incremental;
		this._strict = this._incremental ? true : strict;

		const {page = 1, pageSize} = this._config;
		this._paging = {};
		if (pageSize) {
			this._paging = {
				skip: (page - 1) * pageSize,
				limit: pageSize
			};
		}
	}
}
