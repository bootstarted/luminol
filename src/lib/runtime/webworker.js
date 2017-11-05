import runtime from './common';

/*
let messageHandler;

Object.defineProperty(global, 'onmessage', {
  get: () => messageHandler,
  set: (v) => {
    messageHandler = v;
  },
});

module.hot.accept(__webpack_entry_module__, () => {
  require(__webpack_entry_module__);
});

*/

runtime({
  reload() {
    console.log('🔥  Requested full reload. Please restart your app.');
  },
});
