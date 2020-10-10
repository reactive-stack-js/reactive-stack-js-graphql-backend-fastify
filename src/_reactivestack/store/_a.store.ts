#!/usr/bin/env node
"use strict";

import * as _ from "lodash";
import {Subject, Subscription} from "rxjs";
import * as jsondiffpatch from "jsondiffpatch";

export enum EStoreType { DOCUMENT, COLLECTION}

// tslint:disable-next-line:variable-name
const _baseMessage = (field: string) => ({
	type: "update",
	path: field,
	payload: {}
});

export default abstract class AStore extends Subject<any> {

	protected _model: any;
	protected _target: string;
	protected _type: EStoreType;

	protected _config: any;

	protected _query: any;
	protected _sort: any;
	protected _fields: any;
	protected _paging: any;

	protected _subscription: Subscription;

	protected constructor(model: any, target: string) {
		super();

		this._model = model;
		this._target = target;
		this._query = {};
		this._sort = {};
		this._fields = {};
		this._paging = {};
	}

	public destroy() {
		if (this._subscription) this._subscription.unsubscribe();
		this._subscription = null;
	}

	protected abstract async load(change: any): Promise<any>;

	protected abstract restartSubscription(): void;

	protected extractFromConfig() {
		const {query = {}, sort = {}, fields = {}} = this._config;
		this._query = query;
		this._sort = sort;

		this._fields = fields;
		if (_.isArray(fields)) {
			this._fields = {};
			_.each(fields, (field) => _.set(this._fields, field, 1));
		}
	}

	protected set subscription(subscription: Subscription) {
		this.destroy();
		this._subscription = subscription;
		this.load({});
	}

	protected get model() {
		return this._model;
	}

	protected emit(update: any = {}) {
		if (this._isDocument()) return this._emitOne(update);
		if (this._isCollection()) return this._emitMany(update);
	}

	public set config(config: any) {
		if (!this._isValidConfig(config)) return;

		this._config = _.cloneDeep(config);
		this.extractFromConfig();
		this.restartSubscription();
	}

	public get target() {
		return this._target;
	}

	private _isDocument(): boolean {
		return this._type === EStoreType.DOCUMENT;
	}

	private _isCollection(): boolean {
		return this._type === EStoreType.COLLECTION;
	}

	private _isValidConfig(config: any): boolean {
		if (!config) return false;
		const diff = jsondiffpatch.diff(this._config, config);
		return !_.isEmpty(diff);
	}

	private _emitOne(update: any) {
		const message = _baseMessage(this._target);
		_.set(message.payload, this._target, update);
		this.next(JSON.stringify(message));
	}

	private _emitMany(update: any = {total: 0, data: []}) {
		const {total, data} = update;
		const message = _baseMessage(this._target);
		_.set(message.payload, this._target, data);
		_.set(message.payload, "_" + this._target + "Count", total);
		this.next(JSON.stringify(message));
	}

}
