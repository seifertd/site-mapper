usage :
	@echo ''
	@echo 'Core tasks                       : Description'
	@echo '--------------------             : -----------'
	@echo 'make generate                    : Generate the sitemaps'
	@echo 'make upload                      : Upload sitemaps to S3'
	@echo 'make test                        : Run the tests'
	@echo ''

COFFEE=node_modules/.bin/coffee
MOCHA=node_modules/.bin/mocha
TESTS:=test/**/*.coffee
TEST_REPORTER=tap
NPM_ARGS=--registry http://npm-registry.snc1
SRC = $(shell find src -name '*.coffee' -type f | sort)
LIB = $(SRC:src/%.coffee=lib/%.js)

build: $(LIB) node_modules

node_modules :
	$(MAKE) setup

lib:
	mkdir lib

lib/%.js: src/%.coffee lib
	dirname "$@" | xargs mkdir -p
	$(COFFEE) --js <"$<" >"$@"

clean:
	rm -rf lib
	rm -rf node_modules

setup :
	@rm -rf node_modules
	@echo npm $(NPM_ARGS) install
	@npm $(NPM_ARGS) install

generate : build
	@NODE_PATH=lib NODE_ENV=development node ./lib/generate

test : build
	@echo TESTS = $(TESTS)
	@NODE_PATH=lib NODE_ENV=test $(MOCHA) --recursive --compilers coffee:coffee-script-redux/register $(TESTS) --reporter $(TEST_REPORTER)
