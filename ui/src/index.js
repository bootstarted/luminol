import client from 'socket.io-client';
import {createElement} from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';

import App from './app';
import createStore from './store';
import {putStats, putRoute, compile} from './actions';

const store = createStore();

const Root = ({store}) => (
  <Provider store={store}><App/></Provider>
);

const element = document.getElementById('main');
render(<Root store={store}/>, element);

const io = client(process.env.IPC_URL);

io.on('stats', (stats) => {
  store.dispatch(putStats(stats));
});

io.on('compile', (stats) => {
  store.dispatch(compile(stats));
});

io.on('proxy', (route) => {
  store.dispatch(putRoute(route));
});

io.emit('watch');
