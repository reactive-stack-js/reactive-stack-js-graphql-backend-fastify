#!/usr/bin/env node
'use strict';
import jwtTokenRefresh from './_f.jwt.token.refresh';
import IUserManager, {UserManagerRefreshType} from '../_reactivestack/util/_i.user.manager';

export default class UserManager implements IUserManager {
	private _jwt: string;
	private readonly _jwtSecret: string;

	public constructor(jwtSecret: string) {
		this._jwtSecret = jwtSecret;
	}

	public connected(jwt: any): void {
		this._jwt = jwt;

		// TODO: verify user exists, and so on...
		// const user = jsonwebtoken.verify(jwt, this._jwtSecret);
		// TODO: update database
	}

	location(location: string): void {
		// TODO: update database
	}

	disconnected(): void {
		// TODO: update database
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
