#!/usr/bin/env node
'use strict';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';

import User from '../models/user';

const EXPIRES = 1800000;	// 30 mins
const REFRESH = 1200000;	// 20 mins

const _now = () => Math.floor(new Date().getTime() / 1000) * 1000;

const _times = () => ({
	token_received_at: _now(),
	expires_in: EXPIRES,
	expires_at: _now() + EXPIRES,
	expires_at_string: moment.tz(_now() + EXPIRES, moment.tz.guess()).format('YYYY/MM/DD HH:mm:ss zz'),
	refresh_in: REFRESH,
	refresh_at: _now() + REFRESH,
	refresh_at_string: moment.tz(_now() + REFRESH, moment.tz.guess()).format('YYYY/MM/DD HH:mm:ss zz'),
});

export const refresh = (token: any) => _.merge(token, _times());

const authenticate = async (providerUser: any): Promise<any | null> => {
	if (!providerUser) return null;

	let dbUser = await User.findOne({providerId: providerUser.providerId});
	if (!dbUser) {
		dbUser = new User(providerUser);
		dbUser = await dbUser.save();
	}

	if (!dbUser) return undefined;

	return _.merge(_.pick(dbUser, ['id', 'name', 'email', 'picture', 'provider', 'providerId']), _times());
};
export default authenticate;