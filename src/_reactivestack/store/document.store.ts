#!/usr/bin/env node
'use strict';

import sift from 'sift';
import {filter} from 'rxjs/operators';
import {isString, get, isEmpty, first, omit, keys, concat, intersection} from 'lodash';

import AStore, {EStoreType} from './_a.store';
import observableModel from '../util/_f.observable.model';

// tslint:disable-next-line:variable-name
const _getIdFromQuery = (query: any): string => (isString(query) ? query : get(query, '_id'));

export default class DocumentStore extends AStore {
	constructor(model: any, target: string) {
		super(model, target);
		this._type = EStoreType.DOCUMENT;
		Object.setPrototypeOf(this, DocumentStore.prototype);
	}

	protected extractFromConfig(): void {
		super.extractFromConfig();

		const {skip = 0} = this._config;
		this._paging = skip ? {} : {skip, limit: 1};
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model)
			.pipe(filter((change) => this._pipeFilter(change)))
			.subscribe({
				next: (change: any): Promise<void> => this.load(change)
			});
	}

	protected async load(change: any): Promise<void> {
		if (isEmpty(this._config)) return this.emit();

		const id = _getIdFromQuery(this._query);
		const {
			operationType: type,
			documentKey: {_id: key},
			updateDescription: description,
			fullDocument: document
		} = change;

		let reload = false;
		if (isEmpty(change)) {
			reload = true;
		} else {
			switch (type) {
				case 'delete':
					if (id === key) return this.emitDelete(key);
					reload = true;
					break;

				case 'insert':
				case 'replace':
					if (id) return;

					if (!isEmpty(this._query)) {
						const test = sift(omit(this._query, ['createdAt', 'updatedAt']));
						reload = test(document);
					}
					break;

				case 'update':
					if (id === key) reload = true;
					else {
						const qs = keys(this._query);
						const {updatedFields, removedFields} = description;
						const us = concat(removedFields, keys(updatedFields));
						reload = !isEmpty(intersection(qs, us));
						break;
					}
			}
		}

		if (!reload) return;

		let data;
		if (!isEmpty(this._sort)) data = await this._loadSortedFirstDocument();
		else if (document) data = document;
		else data = id ? await this._loadDocumentById(id) : await this._loadDocument();

		for (const populate of this._populates) {
			await data.populate(populate).execPopulate();
		}

		this.emit(data);
	}

	private _pipeFilter(change: any): boolean {
		if (!isEmpty(this._sort)) return true;

		const {operationType: type, documentKey: {_id: key}, fullDocument: document} = change;
		if ('delete' === type) return true;
		if (key === _getIdFromQuery(this._query)) return true;

		const test = sift(omit(this._query, ['createdAt', 'updatedAt']));
		return test(document);
	}

	private async _loadDocumentById(id: string): Promise<any> {
		return this._model.findById(id, this._fields);
	}

	private async _loadSortedFirstDocument(): Promise<any> {
		return first(await this._model.find(this._query, this._fields, this._paging).sort(this._sort));
	}

	private async _loadDocument(): Promise<any> {
		return this._model.findOne(this._query, this._fields);
	}
}
