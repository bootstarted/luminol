
import webpack from 'webpack';
import { fork } from 'child_process';
import EventEmitter from 'events';
import path from 'path';


export default function createRenderServer(renderer, options) {
	const serverCompiler = webpack(renderer);
	let url = null;
	const events = new EventEmitter();
	let child = null;
	let addr = null;
	let start = false;
	let port = 0;
	let assetStats = null;
	let serverStats = null;

	function send() {
		if (child && url && assetStats) {
			child.send([url, assetStats]);
		}
	}

	function trigger() {
		if (!start || !serverStats) {
			return;
		} else if (child) {
			// If we're already running just invoke HMR, otherwise start up.
			child.kill('SIGUSR2');
		} else {

			const map = serverStats.toJson({ assets: true}).assetsByChunkName;
			const modules = Object.keys(map).map(key => {
				return path.join(renderer.output.path, map[key]);
			});

			// Only support one entrypoint right now. Maybe support more later.
			if (modules.length !== 1) {
				throw new Error('Must only export 1 entrypoint!');
			}

			child = fork(modules[0], [  ], {
				env: { PORT: port }
			});
			child.on('message', _addr => {
				addr = _addr;
				events.emit('listening');
			});
			child.once('exit', () => {
				events.emit('close')
			});
			child.once('error', () => {
				events.emit('close')
			});
			send();
		}
	}

	serverCompiler.watch({ }, (err, _stats) => {
		// Bail on failure.
		if (err) {
			return;
		};
		serverStats = _stats;
		console.log(serverStats.toString(options.stats));
		trigger();
	});

	return Object.assign(events, {
		compiler: serverCompiler,
		listen(_port) {
			start = true;
			port = _port;
			trigger();
		},
		address() {
			return addr;
		},
		assets(_url) {
			url = _url;
			send();
		},
		stats(_stats) {
			assetStats = _stats.toJson({
				hash: true,
				version: false,
				timings: false,
				assets: false,
				chunks: true,
				chunkModules: false,
				modules: false,
				cached: false,
				reasons: false,
				source: false,
				errorDetails: false,
				chunkOrigins: false
			});
			send();
		}
	});

}
