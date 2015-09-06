#!/usr/bin/env node

import yargs from 'yargs';
import { createServer } from '../lib/server';
import { resolve } from 'path'

const argv = yargs.argv;
const server = createServer({
	assets: require(resolve(argv.assets)),
	renderer: require(resolve(argv.renderer))
});

server.listen(() => {
	console.log(`💎  Ready: http://localhost:${server.address().port}/`);
});
