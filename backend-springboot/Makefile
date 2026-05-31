.PHONY: build test lint format check clean dev depgraph native native-image

MAVEN = ./mvnw

build:
	$(MAVEN) clean package

test:
	$(MAVEN) test

lint:
	$(MAVEN) verify -Pquality

format:
	$(MAVEN) spotless:apply -Pquality

check: test lint

clean:
	$(MAVEN) clean

dev:
	$(MAVEN) spring-boot:run

depgraph:
	$(MAVEN) dependency:tree

native:
	$(MAVEN) -Pnative native:compile

native-image:
	$(MAVEN) -Pnative spring-boot:build-image
