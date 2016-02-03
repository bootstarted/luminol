/* eslint import/no-require: 0 */

// This is here so that webpack compilers can burn out this `require` call.
// Otherwise the program will include the IPC runtime when it otherwise does
// not need to.
if (process.env.IPC_URL) {
  module.exports = require('../dist/lib/runtime/dev-assets').default;
} else {
  module.exports = () => (app) => {
    console.warn('You are using dev-assets when you probably shoud not be!');
    return {
      ...app,
      request(req, res) {
        req.assets = [];
        app.request(req, res);
      },
    };
  };
}
