
import { createServer } from '../lib/server';


const server = createServer({
	assets: require('webpack-config-a'),
	renderer: require('webpack-config-b')
});

server.listen(() => {
	console.log('💎  Ready: ' + server.address());
});
