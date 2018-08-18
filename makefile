default: dist

watch: dist
	node_modules/typescript/bin/tsc --watch

dist: app

server:
	python -m webbrowser "http://localhost:8081/"
	cd docs && python -m SimpleHTTPServer 8081

# APP

app: dependencies docs/index.html docs/app.js

docs/index.html: src/index.html
	mkdir -p docs
	cp src/index.html docs/index.html

docs/app.js: node_modules $(shell find src -name '*.ts')
	mkdir -p docs
	node_modules/typescript/bin/tsc

# DEPENDENCIES

dependencies: docs/system.js docs/pixi.min.js docs/pixi-filters.js

docs/system.js: node_modules
	mkdir -p docs
	cp node_modules/systemjs/dist/system.js docs/

docs/pixi-filters.js: node_modules
	mkdir -p docs
	cp node_modules/pixi-filters/dist/pixi-filters.js docs/

docs/pixi.min.js: node_modules
	mkdir -p docs
	cp node_modules/pixi.js/dist/pixi.min.js docs/

node_modules: package.json
	npm install
	npm update

# GRAPHICS

# NOTE: you'll need Inkscape and ImageMagick to rebuild the graphics
graphics: docs/images/loading.gif docs/images/icon.png

docs/images/loading.gif: src/svg/loading.svg
	mkdir -p docs/images
	mkdir -p /tmp/bw
	inkscape --export-area-page --export-png=/tmp/bw/loading.png src/svg/loading.svg
	convert -loop 0 -dispose Background \
		/tmp/bw/loading.png -crop 84x84 +repage \
		docs/images/loading.gif

docs/images/icon.png: src/svg/icon.svg
	mkdir -p docs/images
	inkscape --export-area-page --export-png=docs/images/icon.png \
		src/svg/icon.svg

# CLEANUP

clean:
	-rm -rf node_modules
	-rm -rf docs/*