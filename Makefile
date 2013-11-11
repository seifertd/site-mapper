usage :
	@echo ''
	@echo 'Core tasks                       : Description'
	@echo '--------------------             : -----------'
	@echo 'make generate                    : Generate the sitemaps'
	@echo 'make upload                      : Upload sitemaps to S3'
	@echo 'make test                        : Run the tests'
	@echo ''

COFFEE=./node_modules/.bin/coffee
MOCHA=../node_modules/.bin/mocha
TESTS:=../test/**/*.coffee
TEST_REPORTER=tap
NPM_ARGS=
VERSION=
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

check-version:
ifndef VERSION
  $(error VERSION is undefined)
endif

release : test check-version
	@mkdir -p build
	@echo "Creating release $(VERSION)"
	@tar czf build/site-mapper-$(VERSION).tgz CHANGELOG.md LICENSE Makefile README.md bin lib node_modules package.json src test
	@npm publish build/site-mapper-$(VERSION).tgz

test : node_modules build
	@echo TESTS = $(TESTS)
	@cd test; NODE_PATH=../lib NODE_ENV=test $(MOCHA) --recursive --compilers coffee:coffee-script-redux/register $(TESTS) --reporter $(TEST_REPORTER)
