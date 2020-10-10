#!/usr/bin/env node
"use strict";

import {v4} from "uuid";

export default (): string => v4().replace(/-/g, "");