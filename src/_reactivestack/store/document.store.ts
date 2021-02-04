#!/usr/bin/env node
'use strict';

import sift from 'sift';
import {filter} from 'rxjs/operators';
import {isString, get, isEmpty, toString, first} from 'lodash';

import AStore, {EStoreType} from './_a.store';
import observableModel from '../util/_f.observable.model';

// tslint:disable-next-line:variable-name
const __getIdFromQuery = (query: any): string => (isString(query) ? query : get(query, '_id'));

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

		const {operationType, fullDocument: document} = change;
		if ('delete' === operationType) return this.emit(null);

		let data;
		const id = __getIdFromQuery(this._query);
		if (id) data = !isEmpty(document) ? document : await this._loadDocumentById(id);
		else if (!isEmpty(this._sort)) data = await this._loadSortedFirstDocument();
		else data = !isEmpty(document) ? document : await this._loadDocument();

		this.emit(data);
	}

	private _pipeFilter(change: any): boolean {
		const {operationType, fullDocument: document} = change;
		if (!document && 'delete' === operationType) return true;

		const id = __getIdFromQuery(this._query);
		if (id) {
			return id === toString(document._id);
		} else if (!isEmpty(this._sort)) {
			// This cannot work, must reload...
		} else {
			const test = sift(this._query);
			return test(document);
		}

		return true;
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
