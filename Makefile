NODE = node
TEST = ./node_modules/.bin/vows
TESTS ?= test/*-test.js test/**/*-test.js

test:
	@NODE_ENV=test NODE_PATH=lib $(TEST) $(TEST_FLAGS) $(TESTS)

docs: docs/api.html

docs/api.html: lib/oauthorize/*.js
	dox \
		--title oauthorize \
		--desc "OAuth service provider toolkit for Node.js" \
		$(shell find lib/oauthorize/* -type f) > $@

docclean:
	rm -f docs/*.{1,html}

.PHONY: test docs docclean
