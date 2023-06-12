set dotenv-load

default:
  @just --list

docs:
  @cd docs && bundle exec jekyll serve

run-core:
  @cd packages/core && npm run start

build-core:
  @cd packages/core && npm run build

run-all:
  @npm run build -ws
