#!/usr/bin/env node
'use strict';

export type UserManagerRefreshType = {
	type: 'refresh';
	payload: {jwt: string; user: any};
	refresh_in: number;
};

export default interface IUserManager {
	connected(jwt: any): void;

	location(location: string): void;

	disconnected(): void;

	checkSession(): UserManagerRefreshType;
}
