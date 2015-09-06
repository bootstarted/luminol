
import webpack from 'webpack';
import { fork } from 'child_process';
import EventEmitter from 'events';


export default function createRenderServer(renderer) {
	const serverCompiler = webpack(renderer);
	let url = '/';
	const events = new EventEmitter();
	let child = null;
	let addr = null;
	let start = false;
	let port = 0;
	let stats = null;

	function send() {
		if (child) {
			child.send([url, stats]);
		}
	}

	function trigger() {
		if (!start || !stats) {
			return;
		} else if (child) {
			// If we're already running just invoke HMR, otherwise start up.
			child.kill('SIGUSR2');
		} else {
			child = fork('../server.js', [  ], {
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
		stats = _stats;
		console.log(stats.toString(watch.stats));
		trigger();
	});

	return Object.assign(events, {
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
			stats = _stats.toJson({
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
