#!/usr/bin/env node
"use strict";

import axios from "axios";

import authenticate from "../../_reactivestack/_f.authenticate";

const GG_APP_ID = process.env.GG_APP_ID;
const GG_APP_SECRET = process.env.GG_APP_SECRET;

const _userAccessToken = async (code: string, scope: string, redirectUri: string): Promise<any> => {
	const ggurl = `https://oauth2.googleapis.com/token` +
		`?client_id=${GG_APP_ID}` +
		`&client_secret=${GG_APP_SECRET}` +
		`&redirect_uri=${redirectUri}` +
		`&grant_type=authorization_code` +
		`&code=${code}`;
	const response = await axios.post(ggurl);

	const data = response.data;
	if (!!data && !!data.id_token) return data;
	return null;
};

const _userData = async (accessToken: string): Promise<any> => {
	const ggurl = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`;
	const response = await axios.get(ggurl);
	const {data} = response;

	return {
		provider: "google",
		providerId: data.id,
		name: data.name,
		email: data.email,
		picture: data.picture
	};
};

module.exports = {
	method: "POST",
	url: "/auth/google",
	handler: async (request: any, reply: any): Promise<void> => {
		const {code, scope, redirect_uri} = request.body;
		const {access_token} = await _userAccessToken(code, scope, redirect_uri);
		if (access_token) {
			const googleUser = await _userData(access_token);
			const user = await authenticate(googleUser);
			const jwt = await reply.jwtSign(user);
			return reply.send({jwt, user});
		}
		reply.send({error: "auch"});
	},
};
