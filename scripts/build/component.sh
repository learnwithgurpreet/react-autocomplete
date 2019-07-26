#!/bin/sh -e

export NODE_ENV=production
mkdir -p build/lib dist
babel lib/{index,Autocomplete}.js -d build/
cd dist
browserify ../lib/Autocomplete.js \
    --external react \
    --external react-dom \
    --debug \
  | youemdee ReactAutocomplete \
    --dependency react:React \
    --dependency react-dom:ReactDOM \
  | exorcist react-autocomplete.js.map \
  > react-autocomplete.js
uglifyjs react-autocomplete.js \
    --compress \
    --mangle \
    --source-map --output react-autocomplete.min.js
