#!/usr/bin/env node
'use strict';

import {isEmpty} from 'lodash';
import {Model} from 'mongoose';

import observableModel from '../util/_f.observable.model';
import AStore, {EStoreType} from "./_a.store";

export default class CountStore extends AStore {
	constructor(model: Model<any>, target: string) {
		super(model, target);
		this._type = EStoreType.COUNT;
		Object.setPrototypeOf(this, CountStore.prototype);
	}

	protected restartSubscription(): void {
		this.subscription = observableModel(this.model)
			.subscribe({
				next: (c: any): Promise<void> => this.load()
			});
	}

	protected async load(): Promise<void> {
		if (isEmpty(this._config)) return this.emit();
		const count = await this._model.countDocuments(this._query);
		this.emit(count);
	}
}
