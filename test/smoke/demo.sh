#!/bin/sh -e

trap "exit" INT TERM
trap 'if [ "$pid" != "" ]; then kill $pid; fi' EXIT

chmod +x ./bin/webpack-udev-server.js

./bin/webpack-udev-server.js \
  --config ./demo/webpack/client.webpack.config.js \
  --config ./demo/webpack/server.webpack.config.js \
  --port 7653 &

sleep 5

echo "Testing server mode..."
curl -sf http://localhost:7653 | grep -q "Hello world."

echo "Testing client mode..."
curl -sf http://localhost:7653/js/main.js > /dev/null

echo "Done."

exit 0
