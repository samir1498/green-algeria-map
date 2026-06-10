.PHONY: build test test-unit test-arch test-it lint format check clean dev depgraph native native-image

MAVEN = ./mvnw

build:
	$(MAVEN) -DskipTests clean package

test:
	$(MAVEN) test

test-unit:
	$(MAVEN) test -Ptest-unit -q

test-arch:
	$(MAVEN) test -Ptest-arch -q

test-it:
	$(MAVEN) test -Ptest-it -q

lint:
	$(MAVEN) spotless:check -Pquality -q

format:
	$(MAVEN) spotless:apply -Pquality

check: test lint

clean:
	$(MAVEN) clean

dev:
	$(MAVEN) spring-boot:run

migrate:
	$(MAVEN) flyway:migrate

depgraph:
	$(MAVEN) compile -q
	jdeps -dotoutput target/deps target/classes
	dot -Tpng target/deps/summary.dot -o target/deps/graph.png

native:
	$(MAVEN) -Pnative native:compile

native-image:
	$(MAVEN) -Pnative spring-boot:build-image
