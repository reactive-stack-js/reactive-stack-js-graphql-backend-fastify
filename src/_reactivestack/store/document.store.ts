#!/usr/bin/env node
"use strict";

import sift from "sift";
import * as _ from "lodash";
import {filter} from "rxjs/operators";

import AStore, {EStoreType} from "./_a.store";
import observableModel from "../_f.observable.model";

// tslint:disable-next-line:variable-name
const __getIdFromQuery = (query: any): string => _.isString(query) ? query : _.get(query, "_id");

export default class DocumentStore extends AStore {

	constructor(model: any, field: string) {
		super(model, field);
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
				next: (change: any) => this.load(change)
			});
	}

	protected async load(change: any): Promise<void> {
		if (_.isEmpty(this._config)) return this.emit();

		const document = change.fullDocument;

		let data;
		const id = __getIdFromQuery(this._query);
		if (id) data = !_.isEmpty(document) ? document : await this._loadDocumentById(id);
		else if (!_.isEmpty(this._sort)) data = await this._loadSortedFirstDocument();
		else data = !_.isEmpty(document) ? document : await this._loadDocument();

		this.emit(data);
	}

	private _pipeFilter(change: any): boolean {
		const document = change.fullDocument;

		// TODO: handle deletions?
		if (!document) {
			console.error("_pipeFilter error: missing document:", change);
			return false;
		}

		const id = __getIdFromQuery(this._query);
		if (id) {
			return id === _.toString(document._id);

		} else if (!_.isEmpty(this._sort)) {
			// This cannot work, must reload...

		} else {
			const test = sift(this._query);
			return test(document);
		}

		return true;
	}

	private async _loadDocumentById(id:string): Promise<any> {
		return await this._model.findById(id, this._fields);
	}

	private async _loadSortedFirstDocument(): Promise<any> {
		return _.first(
			await this._model
				.find(this._query, this._fields, this._paging)
				.sort(this._sort)
		);
	}

	private async _loadDocument(): Promise<any> {
		return await this._model.findOne(this._query, this._fields);
	}

}
