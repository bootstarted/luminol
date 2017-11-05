# hub

Hub is a simple redux-ish pub-sub-ish-over-websockets type thing. It's not as fancy as things like socket.io or the like but it's small and simple and works well enough.

The "hub" itself is the basic dispatcher:

```js
const hub = createHub();
hub.subscribe(EVENT_TYPE, (action) => {

});
hub.dispatch({type: EVENT_TYPE, payload: 'foo'});
```

And then you can create remote hubs that are connected over websockets:

```js
import {createServer, createClient} from '...';

const server = http.createServer();

const hub1 = createServer({server, path: '/foo'});
const hub2 = createClient(hub1.url);

hub1.subscribe(EVENT_TYPE, (action) => {
  // ...
});
hub2.dispatch({type: EVENT_TYPE, payload: 'foo'});
```

If you use `redux` you can subscribe your store's dispatch to whatever action types your store's reducers consume:

```js
const store = createStore(reducer);
hub.subscribe([ACTION_TYPE1, ACTION_TYPE2, ...], store.dispatch);
```
