#!/usr/bin/env node
'use strict';

import * as path from 'path';
import * as dotenv from 'dotenv';
import {initiateWorkers, MongoDBConnector} from 'reactive-stack-js-backend';

// IMPORTANT: must execute dotenv.config before importing anything requires it (like DBConnectors)
const result = dotenv.config({path: '.env.local'});
if (result.error) throw result.error;

const MONGODB_URI: string = process.env.MONGODB_URI || '';
MongoDBConnector.init(MONGODB_URI);

initiateWorkers(path.join(__dirname, 'workers'));
console.log('All workers started.');