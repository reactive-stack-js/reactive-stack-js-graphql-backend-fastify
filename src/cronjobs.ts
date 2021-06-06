#!/usr/bin/env node
'use strict';

import * as path from 'path';
import * as dotenv from 'dotenv';

// IMPORTANT: must execute dotenv.config before importing anything requires it (like DBConnectors)
const result = dotenv.config({path: '.env.local'});
if (result.error) throw result.error;

import initiateCronjobs from "./_reactivestack/functions/initiate.cronjobs";
import MongoDBConnector from "./_reactivestack/mongodb/mongodb.connector";

const MONGODB_URI: string = process.env.MONGODB_URI || '';
MongoDBConnector.init(MONGODB_URI);

initiateCronjobs(path.join(__dirname, 'cronjobs'));
console.log('All cronjobs started.');