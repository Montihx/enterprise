
# Kitsu Enterprise Platform

Next‑generation anime streaming SaaS with an async FastAPI backend, a modern Next.js 15 frontend, и продвинутой системой парсеров Shikimori/Kodik.

---

## 1. Стек и структура

- **Backend**: Python 3.12, FastAPI 0.115, Pydantic v2, SQLAlchemy 2 (async), Alembic, Celery + Redis, SlowAPI rate limiting.
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui, TanStack Query, Zustand.
- **Хранилища**: PostgreSQL 16, Redis 7, Docker / Docker Compose.

Основные директории:

- `backend/` — API, модели, парсеры, фоновые задачи.
- `frontend/` — публичный сайт и `/dashboard` админка.
- `docs/` — архитектура, деплой, parity‑чеклист и анализ референсов.

---

## 2. Быстрый старт через Docker

### 2.1. Предусловия

- Установлены Docker и Docker Compose.

### 2.2. Запуск

```bash
cd enterprise
docker-compose up --build
```

После старта:

- Frontend: `http://localhost:3000`
- Backend OpenAPI: `http://localhost:8000/docs`
- Health‑чек: `http://localhost:8000/api/health`

### 2.3. Миграции и initial data

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.initial_data
```

---

## 3. Локальная разработка

### 3.1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# или source .venv/bin/activate на Linux/macOS

pip install -r requirements.txt
pip install -r requirements-dev.txt

set DATABASE_URL=postgresql+asyncpg://kitsu:devpassword@localhost:5432/kitsu
set REDIS_URL=redis://localhost:6379/0

alembic upgrade head
python -m app.initial_data

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> На Windows установка `uvloop` из `requirements.txt` может упасть — это не критично для разработки, можно игнорировать эту ошибку или работать через WSL2.

### 3.2. Frontend (Next.js)

```bash
cd frontend
pnpm install

# настроить API URL
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 > .env.local

pnpm dev
```

Публичный сайт: `http://localhost:3000`  
Админка: `http://localhost:3000/dashboard`

---

## 4. Тесты и качество кода

### Backend

```bash
cd backend
pytest --cov=app --cov-report=term
ruff check .
mypy app
```

В CI (`.github/workflows/backend-ci.yml`) зашиты:

- линтинг `ruff`,
- типизация `mypy`,
- покрытие `pytest --cov-fail-under=85`.

### Frontend

```bash
cd frontend
pnpm lint
pnpm tsc --noEmit
pnpm test -- --coverage
```

В CI (`.github/workflows/frontend-ci.yml`) enforced:

- Jest/Vitest‑coverage с порогом **75% по строкам**.

---

## 5. Основные фичи

- Каталог аниме с фильтрами и полнотекстовым поиском (`/catalog`).
- Детальная страница тайтла, комментарии, избранное.
- Видео‑плеер с прогрессом просмотра и секцией «Continue Watching».
- Публичные коллекции (`/collections`) и приватные юзерские подборки.
- Полноценный `/dashboard`:
  - контент‑CRUD (Anime/Episodes/Releases),
  - пользователи и роли (RBAC),
  - модерация комментариев,
  - аналитика и мониторинг,
  - парсер‑система: live‑поиск, авто‑fill, scheduler, конфликты, логи.

За более детальной архитектурой и схемой БД — см. `docs/ARCHITECTURE.md` и `docs/PARITY_CHECKLIST.md`.

---

## 6. Продакшн‑деплой

Подробное руководство: `docs/DEPLOYMENT.md`.

Коротко:

1. Настроить `.env` (DATABASE_URL, REDIS_URL, SECRET_KEY, KODIK_API_KEY, STATIC_HOST).
2. Собрать и поднять `docker-compose.prod.yml`.
3. Применить миграции и выполнить `python -m app.initial_data`.
4. Повесить домен и SSL (через Nginx/Cloudflare).

