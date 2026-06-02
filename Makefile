SHELL := /bin/bash

VERSION ?= patch

# Build the parser from the grammar and run the tests (npm's pretest hook
# regenerates the parser, so plain `make test` is enough).
test:
	@npm test

lint:
	@deno lint

fmt:
	@deno fmt

fmt-check:
	@deno fmt --check

# Everything CI would check, in one go.
check: fmt-check lint test

# Release from a clean main checkout. Defaults to VERSION=patch; use
# VERSION=minor, VERSION=major, or VERSION=X.Y.Z when needed. Bumps the
# version, publishes to npm, then pushes the tag and creates a GitHub release.
release-check:
	@test "$$(git branch --show-current)" = "main" || { echo "Release from main."; exit 1; }
	@test -z "$$(git status --porcelain --untracked-files=no)" || { git status --short --untracked-files=no; echo "Commit or stash tracked changes before releasing."; exit 1; }
	@git fetch origin main --tags
	@test "$$(git rev-list --count HEAD..origin/main)" = "0" || { echo "Local main is behind origin/main."; exit 1; }
	@gh auth status >/dev/null
	@npm whoami >/dev/null 2>&1 || { echo "Run 'npm login' first."; exit 1; }
	@deno fmt --check
	@deno lint
	@npm test
	@npm pack --dry-run

release: release-check
	@case "$(VERSION)" in \
		patch|minor|major|prepatch|preminor|premajor|prerelease|[0-9]*.[0-9]*.[0-9]*) ;; \
		*) echo "Use VERSION=patch, minor, major, prerelease, or an explicit semver."; exit 1 ;; \
	esac
	@npm version "$(VERSION)"
	@npm publish
	@tag="v$$(node -p "require('./package.json').version")"; \
	git push origin main "$$tag"; \
	gh release create "$$tag" --verify-tag --title "$$tag" --generate-notes

.PHONY: test lint fmt fmt-check check release-check release
