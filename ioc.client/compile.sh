#!/bin/sh
OLDPATH=$PATH
WHEREAMI=`pwd`
export PATH=$WHEREAMI/../node/bin:"$PATH"
NODEINST=`which node`

# Generate API documentation
jsdoc interface.js

# Generate libary that can be imported into Node projects
../node_modules/webpack/bin/webpack.js --config webpack.config.ioc.nodejs.client.js

# Generate libary that can be imported into html pages
../node_modules/uglify-es/bin/uglifyjs ../crypto/nacl.js > ioc.nacl.client.js.tmp
# (above could/should be something like: ../node_modules/webpack/bin/webpack.js --config webpack.config.ioc.nacl.client.js )
../node_modules/webpack/bin/webpack.js -p --config webpack.config.ioc.web.client.js
../node_modules/uglify-es/bin/uglifyjs ./ioc.web.client.js.tmp > ioc.web.client.js.min.tmp

# fuse the packed files together
cat ioc.nacl.client.js.tmp ioc.web.client.js.min.tmp  > ioc.web.client.js

# clean up
rm ioc.nacl.client.js.tmp
rm ioc.web.client.js.tmp
rm ioc.web.client.js.min.tmp

PATH=$OLDPATH
