# ============================================================
# Kitsu Enterprise — Project Management Makefile
# ============================================================
.PHONY: help dev prod stop clean logs shell-api shell-web db-shell
.PHONY: migrate makemigrations seed install-frontend build-frontend
.PHONY: test-backend test-frontend lint format backup

# Colors
GREEN  := \033[0;32m
YELLOW := \033[1;33m
CYAN   := \033[0;36m
RED    := \033[0;31m
NC     := \033[0m

help: ## Show available commands
	@echo ""
	@echo "$(CYAN)Kitsu Enterprise$(NC) — Available Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-22s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ─── DEVELOPMENT ─────────────────────────────────────────────
dev: ## Start all services for local development
	@echo "$(CYAN)Starting development environment...$(NC)"
	docker compose up -d --build
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API:      http://localhost:8000"
	@echo "  Docs:     http://localhost:8000/api/v1/openapi.json"
	@echo "  Flower:   http://localhost:5555"

dev-logs: ## Follow all service logs
	docker compose logs -f

dev-api: ## Start only backend API
	docker compose up -d database cache api
	docker compose logs -f api

dev-web: ## Start only frontend
	docker compose up -d web
	docker compose logs -f web

stop: ## Stop all services
	docker compose down
	@echo "$(YELLOW)Services stopped$(NC)"

clean: ## Stop and remove volumes (WARNING: destroys data)
	@echo "$(RED)WARNING: This will delete all local data!$(NC)"
	@read -p "Continue? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v --remove-orphans
	@echo "$(GREEN)Clean complete$(NC)"

# ─── DATABASE ────────────────────────────────────────────────
migrate: ## Run Alembic migrations
	docker compose exec api alembic upgrade head
	@echo "$(GREEN)✓ Migrations applied$(NC)"

makemigrations: ## Create new migration (MSG="description")
	@[ -n "$(MSG)" ] || (echo "$(RED)Error: MSG is required$(NC)"; exit 1)
	docker compose exec api alembic revision --autogenerate -m "$(MSG)"

seed: ## Seed database with initial data
	docker compose exec api python app/initial_data.py
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-shell: ## Open PostgreSQL shell
	docker compose exec database psql -U kitsu -d kitsu

# ─── LOGS ─────────────────────────────────────────────────────
logs: ## Tail logs from all services
	docker compose logs -f --tail=50

logs-api: ## Tail API logs
	docker compose logs -f api --tail=100

logs-worker: ## Tail Celery worker logs
	docker compose logs -f worker --tail=100

# ─── SHELLS ───────────────────────────────────────────────────
shell-api: ## Open Python shell in API container
	docker compose exec api python

shell-web: ## Open shell in frontend container
	docker compose exec web sh

# ─── FRONTEND ─────────────────────────────────────────────────
install-frontend: ## Install frontend dependencies
	cd frontend && pnpm install

build-frontend: ## Build frontend for production
	cd frontend && pnpm build

test-frontend: ## Run frontend tests
	cd frontend && pnpm test

lint-frontend: ## Lint frontend code
	cd frontend && pnpm lint

# ─── BACKEND ──────────────────────────────────────────────────
test-backend: ## Run backend tests
	docker compose exec api python -m pytest tests/ -v --tb=short

test-backend-cov: ## Run backend tests with coverage
	docker compose exec api python -m pytest tests/ -v --cov=app --cov-report=term-missing

format-backend: ## Format backend code
	docker compose exec api black app/ tests/
	docker compose exec api isort app/ tests/

# ─── PRODUCTION ───────────────────────────────────────────────
prod: ## Start production environment
	docker compose -f docker-compose.prod.yml up -d --build
	@echo "$(GREEN)✓ Production environment started$(NC)"

prod-stop: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

# ─── UTILITIES ────────────────────────────────────────────────
ps: ## Show running services
	docker compose ps

health: ## Check health of all services
	@echo "$(CYAN)Checking service health...$(NC)"
	@curl -s http://localhost:8000/api/health | python3 -m json.tool || echo "$(RED)API unreachable$(NC)"
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000

backup: ## Create a database backup
	docker compose exec api python -c "from app.services.backup_service import BackupService; import asyncio; asyncio.run(BackupService.create_backup())"

# ─── LOCAL NETWORK SETUP ─────────────────────────────────────
local-network-info: ## Show how to access from local network
	@echo "$(CYAN)Local Network Access$(NC)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@HOST_IP=$$(hostname -I | awk '{print $$1}') && \
	echo "  Your local IP: $(GREEN)$$HOST_IP$(NC)" && \
	echo "  Frontend:      http://$$HOST_IP:3000" && \
	echo "  API:           http://$$HOST_IP:8000" && \
	echo "" && \
	echo "  To enable access from other devices, set:" && \
	echo "  $(YELLOW)NEXT_PUBLIC_API_URL=http://$$HOST_IP:8000/api/v1$(NC)"
