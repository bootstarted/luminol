
import createAssetServer from './assets';
import createRenderServer from './renderer';
import { normalizeListen } from './util';
import EventEmitter from 'events';

const options = {
	stats: {
		hash: false,
		cached: false,
		cachedAssets: false,
		colors: true,
		modules: false,
		chunks: false
	}
};

class Server extends EventEmitter {
	constructor({ client, server }) {
		super();

		// Create the servers.
		this.assets = createAssetServer(client, options);
		this.renderer = createRenderServer(server, options);
	}

	address() {
		return this.renderer.address();
	}

	listen(...args) {
		const [port, addr, cb] = normalizeListen(...args);
		const _this = this;

		if (typeof cb === 'function') {
			this.once('listening', cb);
		}

		// Readiness.
		const state = {
			render: false,
			stats: false,
			assets: false
		};
		let notified = false;

		function mark(entry, val) {
			state[entry] = val;
			if (!notified && Object.keys(state).every(key => state[key])) {
				notified = true;
				_this.emit('listening');
			}
		}

		// Output some info.
		this.renderer.on('listening', () => {
			mark('render', 'http://localhost:' + this.renderer.address().port);
		});

		// When we know where the assets are being served, then send that info to the
		// rendering server. Same goes for when new assets have been created.
		this.assets.on('listening', () => {
			const url = 'http://localhost:' + this.assets.address().port;
			// TODO: Fix this properly.
			// This is a little bit hacky, but `publicPath` is used internally by
			// webpack to request hot updates and so it needs to accurately reflect
			// the location of the asset server. There is a bit of a race condition
			// here where the stats event could occur after the listen one and not
			// contain the updated path. This seems to work for now.
			this.assets.compiler.options.output.publicPath = url + '/';
			mark('assets', url);
			this.renderer.assets(url);
		}).on('stats', stats => {
			mark('stats', stats);
			this.renderer.stats(stats);
		});

		this.assets.listen(0);
		this.renderer.listen(port || 0, addr);
	}

	close() {
		this.assets.close();
		this.renderer.close();
	}
}

export function createServer(options) {
	return new Server(options);
}
