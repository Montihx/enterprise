<div align="center">
  <img src="logo.png" alt="Kitsu Enterprise" width="120" />
  <h1>Kitsu Enterprise</h1>
  <p>Anime streaming SaaS platform — FastAPI + Next.js 15 + PostgreSQL</p>

  ![Python](https://img.shields.io/badge/Python-3.12-blue)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
  ![Next.js](https://img.shields.io/badge/Next.js-15-black)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
  ![Redis](https://img.shields.io/badge/Redis-7-red)
  ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
</div>

---

## Обзор

**Kitsu Enterprise** — полнофункциональная платформа для потокового просмотра аниме с:

- 📺 Видеоплеер с Kodik CDN
- 🔍 Полнотекстовый поиск (PostgreSQL FTS + GIN index)
- 👤 JWT аутентификация + email верификация + сброс пароля
- 🛡️ RBAC с wildcard-пермиссиями
- 🤖 Автопарсинг из Shikimori + Kodik
- 💬 Комментарии с лайками, ответами, модерацией
- 🔔 Уведомления о новых эпизодах
- 📊 Административная панель с аудит-логами
- 🔄 WebSocket для live-прогресса парсера

---

## Быстрый старт (разработка)

### Требования

- Docker + Docker Compose
- Node.js 20+ (для фронтенда без Docker)
- Python 3.12+ (для бэкенда без Docker)

### 1. Клонировать и настроить окружение

```bash
git clone https://github.com/Montihx/enterprise.git
cd enterprise

# Backend
cp backend/.env.example backend/.env
# Отредактируйте backend/.env:
#   KODIK_API_KEY=ваш_ключ
#   SECRET_KEY=$(openssl rand -hex 32)
#   FIRST_SUPERUSER_EMAIL=admin@yoursite.com
#   FIRST_SUPERUSER_PASSWORD=ваш_надёжный_пароль
```

### 2. Запустить через Docker Compose

```bash
# Режим разработки
docker-compose up --build

# Инициализировать БД (первый запуск)
docker-compose exec api python -m app.initial_data
```

Доступно:
| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Celery Flower | http://localhost:5555 |
| Prometheus | http://localhost:9090 |

### 3. Создать суперпользователя

```bash
docker-compose exec api python -m app.initial_data
```

---

## Production Deployment

### 1. SSL сертификат

```bash
# Let's Encrypt (рекомендуется)
KITSU_DOMAIN=your-domain.com bash scripts/setup_ssl.sh certbot

# Самоподписанный (для тестирования)
bash scripts/setup_ssl.sh self-signed
```

### 2. Production docker-compose

```bash
cp .env.prod.example .env.prod
# Отредактируйте .env.prod — смените все пароли и ключи!

docker-compose -f docker-compose.prod.yml up -d
```

### 3. Переменные окружения (обязательные)

```env
SECRET_KEY=             # openssl rand -hex 32
DATABASE_URL=           # postgresql+asyncpg://...
REDIS_URL=              # redis://...
KODIK_API_KEY=          # Ваш ключ Kodik API
FIRST_SUPERUSER_PASSWORD=  # Надёжный пароль

# Email (опционально, но рекомендуется)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=app_password
EMAILS_FROM_EMAIL=noreply@yoursite.com
FRONTEND_URL=https://yoursite.com
```

---

## Архитектура

```
┌─────────────────────────────────────────────┐
│                  Nginx (TLS)                 │
│         Rate Limiting + CSP Headers          │
└────────┬─────────────────┬──────────────────┘
         │                 │
    ┌────▼────┐      ┌──────▼──────┐
    │ FastAPI │      │  Next.js 15 │
    │  API    │      │  Frontend   │
    └────┬────┘      └─────────────┘
         │
    ┌────┴──────────────────────────┐
    │  PostgreSQL 16  │  Redis 7    │
    │  + FTS indexes  │  + Pub/Sub  │
    └─────────────────┴─────────────┘
         │
    ┌────▼─────────────────────────┐
    │     Celery Workers           │
    │  Shikimori + Kodik Parsers   │
    │  + Beat Scheduler            │
    └──────────────────────────────┘
```

---

## API Эндпоинты

### Аутентификация
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login/access-token` | Вход |
| POST | `/api/v1/auth/refresh-token` | Обновить токен |
| POST | `/api/v1/auth/forgot-password` | Сброс пароля |
| POST | `/api/v1/auth/reset-password` | Установить новый пароль |
| GET | `/api/v1/auth/verify-email` | Подтвердить email |
| POST | `/api/v1/auth/change-password` | Сменить пароль |

### Аниме
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/v1/anime/` | Каталог |
| GET | `/api/v1/anime/{slug}` | Детали аниме |
| GET | `/api/v1/anime/search?q=` | Поиск |

### Взаимодействия
| Метод | URL | Описание |
|-------|-----|----------|
| GET/POST | `/api/v1/interactions/comments` | Комментарии |
| POST | `/api/v1/interactions/comments/{id}/like` | Лайк |
| POST | `/api/v1/interactions/comments/{id}/reply` | Ответ |
| DELETE | `/api/v1/interactions/comments/{id}` | Удалить |
| POST | `/api/v1/interactions/favorites` | Избранное |
| POST | `/api/v1/interactions/watch-progress` | Прогресс |

---

## Тесты

```bash
cd backend

# Установить зависимости для тестов
pip install pytest pytest-asyncio httpx aiosqlite

# Запустить тесты (SQLite in-memory, без Docker)
pytest -v

# Только быстрые тесты
pytest -m "not integration" -v

# С покрытием
pytest --cov=app --cov-report=html
```

---

## Мониторинг

| Инструмент | URL | Описание |
|-----------|-----|----------|
| FastAPI Docs | `/docs` | OpenAPI UI |
| Prometheus Metrics | `/metrics` | Метрики приложения |
| Celery Flower | `:5555` | Мониторинг воркеров |
| Prometheus | `:9090` | Агрегация метрик |

---

## Безопасность

- 🔐 JWT с разделёнными `access` и `refresh` токенами
- 🚫 Rate limiting на уровне Nginx + FastAPI (slowapi)
- 🛡️ CSP заголовки для защиты от XSS
- 🔒 HTTPS с TLS 1.2/1.3
- 🏠 HSTS заголовок
- ✅ Pydantic схемы на всех входящих данных
- 📝 Аудит-лог всех административных действий
- 🔑 PBKDF2/bcrypt хеширование паролей

---

## Лицензия

MIT License — использовать свободно, упоминание автора приветствуется.
