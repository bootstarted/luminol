
import createAssetServer from './assets';
import createRenderServer from './renderer';
import EventEmitter from 'events';

class Server extends EventEmitter {
	constructor({ assets, renderer }) {
		super();

		// Create the servers.
		this.assets = createAssetServer(assets);
		this.renderer = createRenderServer(renderer);
	}

	address() {
		return this.renderer.address();
	}

	listen(port, addr, cb) {
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

			}
		}

		// Output some info.
		renderer.on('listening', () => {
			mark('render', 'http://localhost:' + renderer.address().port);
		});

		// When we know where the assets are being served, then send that info to the
		// rendering server. Same goes for when new assets have been created.
		assets.on('listening', () => {
			const url = 'http://localhost:' + assets.address().port;
			// TODO: Fix this properly.
			// This is a little bit hacky, but `publicPath` is used internally by
			// webpack to request hot updates and so it needs to accurately reflect
			// the location of the asset server. There is a bit of a race condition
			// here where the stats event could occur after the listen one and not
			// contain the updated path. This seems to work for now.
			client.output.publicPath = url + '/';
			mark('assets', url);
			renderer.assets(url);
		}).on('stats', stats => {
			mark('stats', stats);
			renderer.stats(stats);
		});

		assets.listen(0);
		renderer.listen(port, addr);
	}

	close() {
		this.assets.close();
		this.renderer.close();
	}
}

export function createServer(options) {
	return new Server(options);
}
