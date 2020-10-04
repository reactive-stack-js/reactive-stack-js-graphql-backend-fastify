#!/usr/bin/env node
'use strict';

import {v4} from 'uuid';

export default () => v4().replace(/-/g, '');