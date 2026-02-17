# 📚 Kitsu Parser System: ULTIMATE Reference Analysis

**Project:** Kitsu Enterprise Platform  
**Milestone:** Week 1 (Foundation)  
**Status:** COMPLETED (Deep Dive)

This document deconstructs the reference implementations to ensure 100% functional parity and "Next-Gen" improvements over the legacy PHP DLE ecosystem.

---

## 1. Reference A: Advanced-Anime-Parser (PHP/DLE)
The DLE parser is the industry standard for Russian anime sites but suffers from monolithic bottlenecks.

### 1.1 Tab Logic Deconstruction
| Tab | DLE Feature | Kitsu SaaS Implementation Strategy |
| :--- | :--- | :--- |
| **1. General** | Domain, Proxy, Cron security. | Handled via `backend/.env` and `GeneralSettings.tsx`. Uses signed JWT for cron. |
| **2. Grabbing** | Score, LGBT, CAMRip filters. | Ported to `ShikimoriParserService._passes_filters`. |
| **3. Updates** | Auto-update logic, user alerts. | Implemented via `Celery Beat` and `NotificationService`. |
| **4. Fields** | Template mapping for titles. | Handled in `_map_anime_data` with Pydantic normalization. |
| **5. Categories** | Genre -> Site category sync. | Taxonomy reconciliation service (Week 5). |
| **6. Images** | Local storage vs Hotlinking. | `MediaService` (PIL/WebP) ensures 100% local asset hosting. |
| **7. Player** | CDN priority, quality select. | Distributed `Releases` model with `source_priority` logic. |
| **8. Schedule** | Visual Cron GUI. | `DashScheduler.tsx` + `ScheduledParserJob` model. |
| **9. Logs** | Import history. | Real-time WebSocket console + `ParserJobLog` table. |

### 1.2 "Anti-Patterns" to Avoid (from DLE)
- **Synchronous Image Fetching**: DLE often fetches images during the request. Kitsu uses **Celery workers** for non-blocking media optimization.
- **Database Bloat**: DLE stores raw HTML. Kitsu stores **JSONB** and uses Next.js for client-side rendering.
- **Hotlinking**: DLE relies on external CDNs for posters. Kitsu localizes all assets to protect against DMCA "ghosting".

---

## 2. Reference B: AnimeParsers (Python)
Provides high-performance ingestion patterns.

### 2.1 Concurrency & Resilience
- **Asyncio Semaphores**: Limits Shikimori probes to 5/s to avoid IP bans.
- **Levenshtein Matching**: Uses fuzzy title matching when external IDs are missing.
- **Exponential Backoff**: Integrated via `Tenacity` to handle `HTTP 429` (Rate Limits).

---

## 3. Core Logic: The Filter Engine
The parser must strictly respect the following rules from the specification:
1.  **CAMRip Block**: Detects "ts", "cam", "hdtc" in metadata titles.
2.  **LGBT Filter**: Scans genres for "Yaoi", "Yuri", "Shounen Ai" to respect site-wide content policy.
3.  **Score Threshold**: Skips titles with global aggregate score < `min_score` (defined in settings).
