.PHONY: env start-ui test-ui

env:
	bash scripts/setup_env.sh

start-ui:
	@echo "Starting local UI (frontend) with API at http://localhost:8000"; \
	cd frontend && pnpm install && pnpm dev

test-ui:
	@echo "Running local Playwright UI tests"; \
	cd frontend && pnpm exec playwright install || true; \
	pnpm run test:e2e
