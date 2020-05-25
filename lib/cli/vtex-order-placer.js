#!/usr/bin/env node

'use strict';

const logger = require('lllog')();
const rc = require('rc');

const VtexOrderPlacer = require('../vtex-order-placer');

(async () => {

	const options = rc('vtex');

	const vtexOrderPlacer = new VtexOrderPlacer(options);

	try {
		await vtexOrderPlacer.process();
	} catch(e) {
		logger.error(e.message);
	}

	vtexOrderPlacer.printReport();

})();
