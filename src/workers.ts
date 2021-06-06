#!/usr/bin/env node
'use strict';

import * as path from 'path';
import * as dotenv from 'dotenv';

// IMPORTANT: must execute dotenv.config before importing anything requires it (like DBConnectors)
const result = dotenv.config({path: '.env.local'});
if (result.error) throw result.error;

import initiateWorkers from "./_reactivestack/functions/initiate.workers";
import MongoDBConnector from "./_reactivestack/databases/mongodb/mongodb.connector";

MongoDBConnector.init();

initiateWorkers(path.join(__dirname, 'workers'));
console.log('All workers started.');