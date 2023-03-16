npm i
npm install --platform=linux electron
node_modules/.bin/tsc

# for dir in addons/*
# do
# 	node_modules/.bin/node-gyp rebuild --directory=$dir --target=13.0.1 --arch=x64 --dist-url=https://electronjs.org/headers
# 	mv $dir/build/Release/addon.node app/resources/addons/$(basename $dir).node
# done