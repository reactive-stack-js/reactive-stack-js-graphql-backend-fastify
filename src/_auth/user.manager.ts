#!/usr/bin/env node
'use strict';

import {get} from 'lodash';
import * as jsonwebtoken from 'jsonwebtoken';

import jwtTokenRefresh from './_f.jwt.token.refresh';
import IUserManager, {UserManagerRefreshType} from './_i.user.manager';

export default class UserManager implements IUserManager {
	private _location: string;
	private _jwt: string;
	private _user: any;
	private readonly _jwtSecret: string;

	public constructor(jwtSecret: string) {
		this._jwtSecret = jwtSecret;
		this._location = '';
	}

	public connected(jwt: any): void {
		this._jwt = jwt;

		const user = jsonwebtoken.verify(jwt, this._jwtSecret);
		if (user) {
			this._user = user;
			const userId = get(this._user, '_id');
			if (userId) {
				// TODO: update database
				// await User.updateOne({_id: userId}, {$set: {online: true}});
				// if (this._location) await User.updateOne({_id: userId}, {$set: {location: this._location}});
			}
		}
	}

	ping(ping: number): void {
		const userId = get(this._user, '_id');
		if (userId) {
			// TODO: update database
			// await User.updateOne({_id: userId}, {$set: {ping}});
		}
	}

	location(location: string): void {
		if (location === 'odjava') return this.disconnected();
		this._location = location;
		const userId = get(this._user, '_id');
		if (userId) {
			// TODO: update database
			// await User.updateOne({_id: userId}, {$set: {location: this._location}});
		}
	}

	disconnected(): void {
		const userId = get(this._user, '_id');
		if (userId) {
			// TODO: update database
			// await User.updateOne({_id: userId}, {$set: {online: false}});
			// await User.updateOne({_id: userId}, {$unset: {location: ''}});
			// await User.updateOne({_id: userId}, {$unset: {table: ''}});
		}
		this._location = '';
		this._user = null;
	}

	public checkSession(): UserManagerRefreshType {
		if (this._jwt) {
			const refreshPayload = jwtTokenRefresh(this._jwtSecret, this._jwt);
			if (refreshPayload) {
				const {jwt} = refreshPayload;
				this._jwt = jwt;
				return {
					type: 'refresh',
					payload: refreshPayload,
					refresh_in: 299000
				};
			}
		}
		return null;
	}
}
