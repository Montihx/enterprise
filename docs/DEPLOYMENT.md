# 🚀 Kitsu Deployment Guide

## 1. Prerequisites
- Docker & Docker Compose
- Domain with SSL (Cloudflare or Nginx recommended)
- Provider API Keys (Kodik)

## 2. Environment Variables
Create a `.env` file based on the spec:
```env
DATABASE_URL=postgresql+asyncpg://kitsu:password@postgres:5432/kitsu
REDIS_URL=redis://redis:6379/0
SECRET_KEY=yoursecretkey
API_ENV=production
KODIK_API_KEY=your_key
STATIC_HOST=https://yourdomain.com/media
```

## 3. Production Launch
Kitsu utilizes Docker Compose for orchestrated deployment.

```bash
# 1. Pull/Build images
docker-compose -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker-compose exec backend alembic upgrade head

# 4. Seed initial roles/admin
docker-compose exec backend python -m app.initial_data
```

## 4. Maintenance
- **Backups:** Managed via the `Backup` model and system tasks.
- **Logs:** Structured logs available in the `Parser Console` or via `docker-compose logs`.
- **Media:** Persisted in the `media_data` Docker volume. Optimized periodically via `Pillow`.
