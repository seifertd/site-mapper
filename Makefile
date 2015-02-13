usage :
	@echo ''
	@echo 'Core tasks                       : Description'
	@echo '--------------------             : -----------'
	@echo 'make generate                    : Generate the sitemaps in development environment'
	@echo 'make test                        : Run the tests'
	@echo 'make release VERSION=x.x.x       : Release a new version of the npm module'
	@echo ''

COFFEE=./node_modules/.bin/coffee
MOCHA=../node_modules/.bin/mocha
TESTS:=../test/**/*.coffee
TEST_REPORTER=tap
NPM_ARGS=
SRC = $(shell find src -name '*.coffee' -type f | sort)
LIB = $(SRC:src/%.coffee=lib/%.js)

clean:
	rm -rf node_modules
	rm -rf lib

build: $(LIB) node_modules

lib:
	mkdir lib

lib/%.js: src/%.coffee lib
	dirname "$@" | xargs mkdir -p
	$(COFFEE) --js <"$<" >"$@"

node_modules : 
	$(MAKE) setup

setup :
	@rm -rf node_modules
	@echo npm $(NPM_ARGS) install
	@npm $(NPM_ARGS) install

generate : 
	@NODE_ENV=development $(COFFEE) ./src/generate.coffee

VERSION = $(shell node -pe 'require("./package.json").version')
release-patch: NEXT_VERSION = $(shell node -pe 'require("semver").inc("$(VERSION)", "patch")')
release-minor: NEXT_VERSION = $(shell node -pe 'require("semver").inc("$(VERSION)", "minor")')
release-major: NEXT_VERSION = $(shell node -pe 'require("semver").inc("$(VERSION)", "major")')
release-patch: release
release-minor: release
release-major: release

release: clean setup build test
	@printf "Current version is $(VERSION). This will publish version $(NEXT_VERSION). Press [enter] to continue." >&2
	@read
	node -e '\
		var j = require("./package.json");\
		j.version = "$(NEXT_VERSION)";\
		var s = JSON.stringify(j, null, 2);\
		require("fs").writeFileSync("./package.json", s);'
	git commit package.json -m 'Version $(NEXT_VERSION)'
	git tag -a "v$(NEXT_VERSION)" -m "Version $(NEXT_VERSION)"
	git push --tags origin HEAD:master
	npm publish


.PHONY: test
test : node_modules
	@echo TESTS = $(TESTS)
	@cd test; NODE_PATH=../src NODE_ENV=test $(MOCHA) --recursive --compilers coffee:coffee-script-redux/register $(TESTS) --reporter $(TEST_REPORTER)
