#!/bin/sh -e

trap "exit" INT TERM
trap "kill 0" EXIT

chmod +x ./bin/webpack-udev-server.js

./bin/webpack-udev-server.js --port 8080 &
./bin/webpack-udev-server.js --slave http://localhost:8080/ \
  --config ./demo/webpack/client.webpack.config.js &
./bin/webpack-udev-server.js --slave http://localhost:8080/ \
  --config ./demo/webpack/server.webpack.config.js &

sleep 1

curl -sf http://localhost:8080 | grep -q "Hello world."
curl -sf http://localhost:8080/js/main.js > /dev/null
