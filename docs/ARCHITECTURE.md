# 🏗️ Kitsu Enterprise Architecture

## 1. System Overview
Kitsu Enterprise is a distributed SaaS platform designed for high-availability anime streaming. It follows a decoupled **API-First** architecture with a React/Next.js frontend and a FastAPI/PostgreSQL backend.

## 2. Tech Stack Core
- **Frontend:** Next.js 15 (App Router), TanStack Query v5, Tailwind CSS 4.
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2.
- **Storage:** PostgreSQL 16 (Relational + GIN Search), Redis 7 (Cache + Queue).
- **Background Workers:** Celery 5.4 orchestrated by Redis.

## 3. Data Flow & Sync Engine
The **Parser Engine** is the heart of content ingestion:
1. **Gathering:** Shikimori API provides high-fidelity metadata.
2. **Merging:** Kodik API provides CDN-backed video releases.
3. **Conflict Resolution:** Discrepancies are queued for manual administrative review.
4. **Localization:** `MediaService` downloads and converts remote assets to optimized WebP for sovereign hosting.

## 4. Performance Optimization
- **Database:** Full-text search utilizes GIN indexes and `tsvector` triggers for <100ms keyword lookup.
- **Caching:** Redis stores catalog segments and high-traffic detail pages.
- **N+1 Prevention:** Strategic use of `selectinload` and `joinedload` in SQLAlchemy queries.
- **Frontend:** Next.js automatic code splitting and server-side component optimization.

## 5. Security Model (RBAC)
Access control is enforced at the dependency level:
- `get_current_active_user`: Basic auth for comments/lists.
- `get_current_active_superuser`: Full administrative access to parsers and user management.
