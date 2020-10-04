#!/usr/bin/env node
'use strict';

import Timeout = NodeJS.Timeout;

import * as dotenv from 'dotenv';
import * as jsonwebtoken from 'jsonwebtoken';
import {Subject, Subscription} from 'rxjs';

import AStore from "./store/_a.store";
import jwtRefresh from "./_f.jwt.refresh";
import storeFactory from "./store/_f.store.factory";
import StoreSubscriptionUpdate from "./store/_t.store.subscription.update";

dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

export default class Client extends Subject<any> {
	private _jwt: string;
	private _user: any;

	private _location: string;
	private _stores: Map<string, AStore>;
	private _subscriptions: Map<string, Subscription>;
	private readonly _interval: Timeout;

	public constructor() {
		super();
		this._stores = new Map<string, AStore>();
		this._subscriptions = new Map<string, Subscription>();
		this._interval = setInterval(this.checkSession, 299000);	// 4min 59sec
	}

	public async consume(message: any): Promise<any> {
		// console.log(' - Client::consume received message', message.type);

		switch (message.type) {
			case 'register':
				const user = jsonwebtoken.verify(message.jwt, jwtSecret);
				this._jwt = message.jwt;
				this._user = user;
				// TODO: store user in clients collection
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

	private checkSession() {
		if (this._jwt) {
			const refreshPayload = jwtRefresh(jwtSecret, this._jwt);
			if (refreshPayload) {
				const {jwt, user} = refreshPayload;
				this._jwt = jwt;
				this._user = user;
				this.next(JSON.stringify({type: 'refresh', payload: refreshPayload}));
			}
		}
	}

	private set location(location: string) {
		// console.log(' - Client location', '[' + this._location + ']', '[' + location + ']');
		if (location === this._location) return;
		this._location = location;

		this.destroy();

		this._stores = new Map<string, AStore>();
		this._subscriptions = new Map<string, Subscription>();

		// TODO: update user in clients collection
	}

	private removeSubscription(target: string): void {
		let store = this._stores.get(target);
		store.destroy();
		store = null;
		this._stores.delete(target);

		let subscription = this._subscriptions.get(target);
		subscription.unsubscribe();
		subscription = null;
		this._subscriptions.delete(target);
	}

	private updateSubscription(subscriptionConfig: StoreSubscriptionUpdate): void {
		const {target, scope, observe, config} = subscriptionConfig;

		let store = this._stores.get(target);
		if (store) {
			store.config = config;

		} else {
			store = storeFactory(scope, observe, target);

			this._stores.set(target, store);
			const subscription = store.subscribe({
				next: (m: any) => this.next(m),
				error: (e: any) => this.error(e),
				complete: () => this.complete()
			});
			this._subscriptions.set(target, subscription);

			store.config = config;
		}
	}

	public destroy() {
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

		clearInterval(this._interval);
	}

}