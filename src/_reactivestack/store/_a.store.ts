#!/usr/bin/env node
'use strict';

import {isArray, each, cloneDeep, isEmpty, set} from 'lodash';
import {Model} from 'mongoose';
import {Subject, Subscription} from 'rxjs';
import * as jsondiffpatch from 'jsondiffpatch';

export enum EStoreType {
	DOCUMENT,
	COLLECTION,
	COUNT
}

// tslint:disable-next-line:variable-name
const _baseMessage = (target: string, incremental = false): any => ({
	type: incremental ? 'increment' : 'update',
	target,
	payload: {}
});

export default abstract class AStore extends Subject<any> {
	protected _model: Model<any>;
	protected _target: string;
	protected _type: EStoreType;

	protected _config: any;
	protected _strict: false;
	protected _incremental: boolean = false;

	protected _query: any;
	protected _sort: any;
	protected _fields: any;
	protected _paging: any;
	protected _populates: string[];

	protected _subscription: Subscription;

	protected constructor(model: Model<any>, target: string) {
		super();

		this._model = model;
		this._target = target;
		this._query = {};
		this._sort = {};
		this._fields = {};
		this._paging = {};
		this._populates = [];
	}

	public destroy(): void {
		if (this._subscription) this._subscription.unsubscribe();
		this._subscription = null;
	}

	protected abstract load(change: any): Promise<void>;

	protected abstract restartSubscription(): void;

	protected extractFromConfig(): void {
		const {query = {}, sort = {}, fields = {}, populates = []} = this._config;
		this._query = query;
		this._sort = sort;
		this._populates = populates;

		this._fields = fields;
		if (isArray(fields)) {
			this._fields = {};
			each(fields, (field: string) => set(this._fields, field, 1));
		}
	}

	protected set subscription(subscription: Subscription) {
		this.destroy();
		this._subscription = subscription;
		this.load({}).then(() => null);
	}

	protected get model(): Model<any> {
		return this._model;
	}

	protected emit(update: any = {}): void {
		if (this._isCount()) return this._emitOne(update);
		if (this._isDocument()) return this._emitOne(update);
		if (this._isCollection()) return this._emitMany(update);
	}

	protected emitDelete(deleted: any): void {
		this.next({
			type: 'delete',
			target: this._target,
			payload: deleted
		});
	}

	public set config(config: any) {
		if (!this._isValidConfig(config)) return;

		this._config = cloneDeep(config);
		this.extractFromConfig();
		this.restartSubscription();
	}

	public get target(): string {
		return this._target;
	}

	private _isCount(): boolean {
		return this._type === EStoreType.COUNT;
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
		return !isEmpty(diff);
	}

	private _emitOne(update: any): void {
		const message = _baseMessage(this._target, this._incremental);
		set(message.payload, this._target, update);
		this.next(message);
	}

	private _emitMany(update: any = {total: 0, data: []}): void {
		const {total, data} = update;
		const message = _baseMessage(this._target, this._incremental);
		set(message.payload, this._target, data);
		if (!this._incremental) set(message.payload, '_' + this._target + 'Count', total);
		this.next(message);
	}
}
