#!/usr/bin/env node

import open from 'open';
import yargs from 'yargs';
import { createServer } from '../lib/server';
import { resolve } from 'path';
import interpret from 'interpret';

const argv = yargs.argv;
const cwd = process.cwd();

function registerCompiler(moduleDescriptor) {
	if(moduleDescriptor) {
		if(typeof moduleDescriptor === "string") {
			require(moduleDescriptor);
		} else if(!Array.isArray(moduleDescriptor)) {
			moduleDescriptor.register(require(moduleDescriptor.module));
		} else {
			for(var i = 0; i < moduleDescriptor.length; i++) {
				try {
					registerCompiler(moduleDescriptor[i]);
					break;
				} catch(e) {
					// do nothing
				}
			}
		}
	}
}

function load(entry) {
	var configPath, ext;
	var extensions = Object.keys(interpret.extensions).sort(function(a, b) {
		return a.length - b.length;
	});
	configPath = resolve(entry);
	for(var i = extensions.length - 1; i >= 0; i--) {
		var tmpExt = extensions[i];
		if(configPath.indexOf(tmpExt, configPath.length - tmpExt.length) > -1) {
			ext = tmpExt;
			break;
		}
	}
	if(!ext) {
		ext = path.extname(configPath);
	}
	registerCompiler(interpret.extensions[ext]);
	return require(configPath);
}

process.env.HOT = true;

const server = createServer({
	client: load(argv.client),
	server: load(argv.server)
});

server.listen(process.env.PORT, () => {
	const url = `http://localhost:${server.address().port}/`;
	console.log(`💎  Ready: ${url}.`);
	if (!process.env.PORT) {
		open(url);
	}
});
