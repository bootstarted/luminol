#!/usr/bin/env node

import open from 'open';
import yargs from 'yargs';
import { createServer } from '../lib/server';
import { resolve } from 'path'

const argv = yargs.argv;
const server = createServer({
	assets: require(resolve(argv.assets)),
	renderer: require(resolve(argv.renderer))
});

server.listen(process.env.PORT, () => {
	const url = `http://localhost:${server.address().port}/`;
	console.log(`💎  Ready: ${url}.`);
	if (!process.env.PORT) {
		open(url);
	}
});
