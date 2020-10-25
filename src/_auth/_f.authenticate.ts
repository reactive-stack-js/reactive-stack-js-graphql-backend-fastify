#!/usr/bin/env node
'use strict';

import {merge, pick} from 'lodash';

import User from '../models/user';
import jwtTokenTimes from './_f.jwt.token.times';

const authenticate = async (providerUser: any, expiresIn: number): Promise<any | null> => {
	if (!providerUser) return null;

	const {provider, providerId} = providerUser;
	let dbUser = await User.findOne({provider, providerId});
	if (!dbUser) {
		dbUser = new User(providerUser);
		dbUser = await dbUser.save();
	}

	if (!dbUser) return undefined;

	return merge(pick(dbUser, ['id', 'name', 'email', 'picture', 'provider', 'providerId']), jwtTokenTimes(expiresIn));
};
export default authenticate;
