#!/usr/bin/env node

import yargs from 'yargs';
import { createServer } from '../lib/server';
import { resolve } from 'path'

// cheating for now
require("babel/register");

const argv = yargs.argv;
const server = createServer({
	assets: require(resolve(argv.assets)),
	renderer: require(resolve(argv.renderer))
});

server.listen(() => {
	console.log(`💎  Ready: http://localhost:${server.address().port}/`);
});
