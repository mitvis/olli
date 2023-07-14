set dotenv-load

list:
  @just --list

bundle-install:
  @cd docs && bundle install

docs:
  @cd docs && bundle exec jekyll serve

run:
  @cd packages/core && npm run start
