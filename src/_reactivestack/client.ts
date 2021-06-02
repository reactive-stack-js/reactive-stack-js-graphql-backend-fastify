#!/usr/bin/env node
'use strict';

import Timeout = NodeJS.Timeout;

import {get} from 'lodash';
import {Subject, Subscription} from 'rxjs';

import AStore from './store/a.store';
import storeFactory from './store/factories/store.factory';
import {StoreSubscriptionUpdateType} from './store/t.store';
import IUserManager from './auth/i.user.manager';
import DataMiddlewareMap from "./middleware/data.middleware.map";

export default class Client extends Subject<any> {
	private _userManager: IUserManager;

	private _ping = 0;
	private _location: string;
	private _stores: Map<string, AStore>;
	private _subscriptions: Map<string, Subscription>;
	private _timeout: Timeout;

	public constructor(userManager: IUserManager) {
		super();
		this._userManager = userManager;
		this._stores = new Map<string, AStore>();
		this._subscriptions = new Map<string, Subscription>();
	}

	public async consume(message: any): Promise<void> {
		// console.log(" - Client::consume received message", message.type);

		switch (message.type) {
			case 'pong':
				this._processPong(message);
				return;

			case 'authenticate':
				this._userManager.connected(message.jwt);
				this._checkSession();
				return;

			case 'location':
				const {path} = message;
				this.location = path;
				return;

			case 'subscribe':
				this.updateSubscription(message);
				return;

			case 'unsubscribe':
				this.removeSubscription(message.target);
				return;
		}
	}

	public ping() {
		this.next({type: 'ping', id: new Date().getTime()});
		setTimeout(() => this.ping(), 60000);
	}

	private _processPong(message: any): void {
		const response = new Date().getTime();
		this._ping = response - message.id;
		this._userManager.ping(this._ping);
	}

	private _checkSession(): void {
		const check = this._userManager.checkSession();
		if (check) this.next(check);

		const refreshIn = get(check, 'refresh_in', 299000); // 299000 = 4min 59sec

		clearTimeout(this._timeout);
		this._timeout = setTimeout(() => {
			this._checkSession();
		}, refreshIn);
	}

	private set location(location: string) {
		// console.log(" - Client location", "[" + this._location + "]", "[" + location + "]");
		if (location === this._location) return;
		this._location = location;

		this.destroy();

		this._stores = new Map<string, AStore>();
		this._subscriptions = new Map<string, Subscription>();

		this._userManager.location(location);
	}

	private removeSubscription(target: string): void {
		let store = this._stores.get(target);
		if (store) store.destroy();
		store = null;
		this._stores.delete(target);

		let subscription = this._subscriptions.get(target);
		if (subscription) subscription.unsubscribe();
		subscription = null;
		this._subscriptions.delete(target);
	}

	private updateSubscription(subscriptionConfig: StoreSubscriptionUpdateType): void {
		const {target, scope, observe, config} = subscriptionConfig;

		let store = this._stores.get(target);
		if (store) {
			store.config = config;
		} else {
			store = storeFactory(scope, observe, target);

			this._stores.set(target, store);
			const subscription = store.subscribe({
				next: async (m: any): Promise<void> => {
					if (DataMiddlewareMap.hasMiddleware(scope, observe)) {
						const process = DataMiddlewareMap.getMiddleware(scope, observe);
						m = await process(m, this._userManager.user);
					}
					this.next(m);
				},
				error: (e: any): void => this.error(e),
				complete: (): void => this.complete()
			});
			this._subscriptions.set(target, subscription);

			store.config = config;
		}
	}

	public destroy(): void {
		const subscriptionsKeys = this._subscriptions.keys();
		for (const subscriptionKey of subscriptionsKeys) {
			let subscription = this._subscriptions.get(subscriptionKey);
			subscription.unsubscribe();
			subscription = null;
		}
		this._subscriptions.clear();
		this._subscriptions = null;

		const storesKeys = this._stores.keys();
		for (const storeKey of storesKeys) {
			let store = this._stores.get(storeKey);
			store.destroy();
			store = null;
		}
		this._stores.clear();
		this._stores = null;

		this._userManager.disconnected();

		clearTimeout(this._timeout);
	}
}
