#!/usr/bin/env node
'use strict';

import axios from 'axios';

import authenticate from '../../_auth/_f.authenticate';

const GG_APP_ID = process.env.GG_APP_ID;
const GG_APP_SECRET = process.env.GG_APP_SECRET;

const _getUserAccessToken = async (code: string, scope: string, redirectUri: string): Promise<any> => {
	const url =
		`https://oauth2.googleapis.com/token` +
		`?grant_type=authorization_code` +
		`&client_id=${GG_APP_ID}` +
		`&client_secret=${GG_APP_SECRET}` +
		`&redirect_uri=${redirectUri}` +
		`&code=${code}`;
	const response = await axios.post(url);

	const {data} = response;
	if (!!data && !!data.id_token) return data;
	return null;
};

const _getUserData = async (accessToken: string): Promise<any> => {
	const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`;
	const response = await axios.get(url);
	const {data} = response;

	return {
		provider: 'google',
		providerId: data.id,
		name: data.name,
		email: data.email,
		picture: data.picture
	};
};

module.exports = {
	method: 'POST',
	handler: async (request: any, reply: any): Promise<void> => {
		const {code, scope, redirect_uri} = request.body;
		const {access_token, expires_in} = await _getUserAccessToken(code, scope, redirect_uri);
		if (access_token) {
			const googleUser = await _getUserData(access_token);
			const user = await authenticate(googleUser, expires_in);
			const jwt = await reply.jwtSign(user);
			return reply.send({jwt, user});
		}
		reply.send({error: 'auch'});
	}
};
