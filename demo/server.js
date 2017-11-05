const midori = require('midori');
const createFileWatcher = require('../createFileWatcher').default;
const path = require('path');
const urlJoin = require('url-join');

const watcher = createFileWatcher(
  path.resolve(path.join('demo', 'dist', 'client', 'stats.json'))
);

const getScripts = (statsData) => {
  const stats = JSON.parse(statsData.toString('utf8'));
  const main = !Array.isArray(stats.assetsByChunkName.main) ?
    [stats.assetsByChunkName.main] : stats.assetsByChunkName.main;
  const entries = main.map((path) => urlJoin(stats.publicPath, path));
  return entries.map((path) => {
    return `<script src="${path}"></script>`;
  }).join('\n');
};

const createApp = midori.request(function() {
  return watcher.poll().then((stats) => {
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

const app = createApp();
app.listen(process.env.PORT, () => {
  console.log('Demo app listening.');
});
