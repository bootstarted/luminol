import runtime from './common';

runtime({
  reload() {
    console.log('🔥  Requested full reload. Reload window to see changes.');
    // TODO: Consider what to do about this scenario.
    // window.location.reload();
  },
});
