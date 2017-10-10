#!/bin/sh -e

trap "exit" INT TERM
trap "kill 0" EXIT

chmod +x ./bin/webpack-udev-server.js

./bin/webpack-udev-server.js \
  --config ./demo/webpack/client.webpack.config.js \
  --config ./demo/webpack/server.webpack.config.js \
  --port 8080 &

sleep 1

curl -sf http://localhost:8080 | grep -q "Hello world."
curl -sf http://localhost:8080/js/main.js > /dev/null
