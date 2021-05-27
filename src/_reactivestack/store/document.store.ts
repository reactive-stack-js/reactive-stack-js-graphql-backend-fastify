#!/usr/bin/env node
'use strict';

import sift from 'sift';
import {filter} from 'rxjs/operators';
import * as _ from 'lodash';

import AStore, {EStoreType} from './a.store';
import observableModel from '../databases/mongodb/functions/_f.observable.model';

// tslint:disable-next-line:variable-name
const _getIdFromQuery = (query: any): string => (_.isString(query) ? query : _.get(query, '_id', '').toString());

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
		if (_.isEmpty(this._config)) return this.emitOne();

		const id = _getIdFromQuery(this._query);
		const {operationType: type, documentKey, updateDescription: description, fullDocument: document} = change;
		const key = _.get(documentKey, '_id', '').toString();

		let reload = false;
		if (_.isEmpty(change)) {
			reload = true;
		} else {
			switch (type) {
				case 'delete':
					if (id === key) return this.emitDelete(key);
					reload = true;
					break;

				case 'insert':
					if (id) return;
					reload = true;
					if (!_.isEmpty(this._query)) {
						const test = sift(_.omit(this._query, ['createdAt', 'updatedAt']));
						reload = test(document);
					}
					break;

				case 'replace':
				case 'update':
					if (id && id === key) reload = true;
					else if (_.isEmpty(this._fields)) reload = true;
					else {
						const qs = _.keys(this._fields);
						if (!description) reload = true;
						else {
							const {updatedFields, removedFields} = description;
							const us = _.concat(removedFields, _.keys(updatedFields));
							reload = !_.isEmpty(_.intersection(qs, us));
						}
					}
					break;
			}
		}

		if (!reload) return;
		console.log(' - DB Reload Document for query:', this._query);

		let data;
		if (!_.isEmpty(this._sort)) data = await this._loadSortedFirstDocument();
		else data = id ? await this._loadDocumentById(id) : await this._loadDocument();

		for (const populate of this._populates) {
			if (data?.populate) await data.populate(populate).execPopulate();
		}

		if (_.isEmpty(this._virtuals)) return this.emitOne(data.toJSON());

		const replacement: any = _.cloneDeep(_.omit(data.toJSON(), this._virtuals));
		for (const virtual of this._virtuals) {
			replacement[virtual] = await Promise.resolve(data[virtual]);
		}
		this.emitOne(replacement);
	}

	private _pipeFilter(change: any): boolean {
		if (!_.isEmpty(this._sort)) return true;

		const {operationType: type, documentKey, fullDocument: document} = change;
		const key = _.get(documentKey, '_id', '').toString();

		if ('delete' === type) return true;
		if (key === _getIdFromQuery(this._query)) return true;

		const test = sift(_.omit(this._query, ['createdAt', 'updatedAt']));
		return test(document);
	}

	private async _loadDocumentById(id: string): Promise<any> {
		return this._model.findById(id, this._fields);
	}

	private async _loadSortedFirstDocument(): Promise<any> {
		return _.first(await this._model.find(this._query, this._fields, this._paging).sort(this._sort));
	}

	private async _loadDocument(): Promise<any> {
		return this._model.findOne(this._query, this._fields);
	}
}
