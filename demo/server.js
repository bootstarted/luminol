const midori = require('midori');
const createClient = require('../createClient').default;
const urlJoin = require('url-join');

const udev = createClient();

const getScripts = (stats) => {
  const main = !Array.isArray(stats.assetsByChunkName.main) ?
    [stats.assetsByChunkName.main] : stats.assetsByChunkName.main;
  const entries = main.map((path) => urlJoin(stats.publicPath, path));
  return entries.map((path) => {
    return `<script src="${path}"></script>`;
  }).join('\n');
};

const app = midori.request(function() {
  return udev.getStats('client').then((stats) => {
    return midori.compose(
      midori.header('Content-Type', 'text/html; charset=utf-8'),
      midori.send(`
        <!DOCTYPE html>
        <html>
          <body>
            Hello world.
            ${getScripts(stats)}
          </body>
        </html>
      `)
    );
  });
});

midori.listen(app, process.env.PORT, () => {
  console.log('Demo app listening.');
});
