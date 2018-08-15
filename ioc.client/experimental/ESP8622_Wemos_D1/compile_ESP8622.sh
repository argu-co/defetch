#!/bin/sh
OLDPATH=$PATH
WHEREAMI=`pwd`
export PATH=$WHEREAMI/../../node/bin:"$PATH"
NODEINST=`which node`

# Generate libary that can be used on Espruino
#cat ../../crypto/lz-string.js | ../../node_modules/uglify-es/bin/uglifyjs > ioc.ESP8622_A.client.js

../../node_modules/webpack/bin/webpack.js --config ./webpack.config.ioc.client.js
#../../node_modules/webpack/bin/webpack.js --config ./webpack.config.ioc.ESP8622_B.client.js

# Uglify the bugger
#cat ioc.ESP8622.client.js | ../node_modules/uglify-es/bin/uglifyjs > ioc.ESP8622.client.js

PATH=$OLDPATH
