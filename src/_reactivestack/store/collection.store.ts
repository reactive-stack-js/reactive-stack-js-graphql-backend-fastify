#!/usr/bin/env node
'use strict';

import sift from 'sift';
import {concat, get, intersection, isEmpty, keys, omit} from 'lodash';
import {Model} from 'mongoose';

import AStore, {EStoreType} from './_a.store';
import observableModel from '../util/_f.observable.model';

export default class CollectionStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COLLECTION;
		Object.setPrototypeOf(this, CollectionStore.prototype);
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model).subscribe({
			next: (change: any): Promise<void> => this.load(change)
		});
	}

	protected async load(change: any): Promise<void> {
		// console.log(" - CollectionStore load", change, this._target, this._query, this._sort, this._fields, this._paging);
		if (isEmpty(this._config)) return this.emit();

		const {operationType: type, documentKey, updateDescription: description, fullDocument: document} = change;
		const key = get(documentKey, '_id');

		let reload = false;
		if (isEmpty(change)) {
			reload = true;
		} else {
			switch (type) {
				case 'delete':
					reload = true;
					break;

				case 'insert':
				case 'replace':
					reload = true;
					if (!isEmpty(this._query)) {
						const test = sift(omit(this._query, ['createdAt', 'updatedAt']));
						reload = test(document);
					}
					break;

				case 'update':
					const qs = keys(this._query);
					const {updatedFields, removedFields} = description;
					const us = concat(removedFields, keys(updatedFields));
					reload = !isEmpty(intersection(qs, us));
					break;
			}
		}

		if (!reload) return;

		if (document && this._incremental) {
			if ('delete' === type) return this.emitDelete(key);

			for (const populate of this._populates) {
				await this._model.populate(document, {path: populate});
			}
			return this.emit({data: document});
		} else {
			let data = [];
			const total = await this._model.countDocuments(this._query);
			if (total > 0) data = await this._model.find(this._query, this._fields, this._paging).sort(this._sort);

			for (const populate of this._populates) {
				await this._model.populate(data, {path: populate});
			}
			this.emit({total, data});
		}
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();

		const {incremental = false, page = 1, pageSize} = this._config;
		this._incremental = incremental;

		this._paging = {};
		if (pageSize) {
			this._paging = {
				skip: (page - 1) * pageSize,
				limit: pageSize
			};
		}
	}
}
