#!/bin/sh -e

cd examples
mkdir -p __build__
for ex in async-data custom-menu static-data; do
    NODE_ENV=production browserify ${ex}/app.js -t [ babelify > __build__/${ex}.js --presets [ @babel/preset-env @babel/preset-react ] --plugins [ @babel/plugin-proposal-class-properties ] ]]
done