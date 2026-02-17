# 🛡️ KITSU PRODUCTION AUDIT REPORT

As Senior Software Architect, I have conducted an exhaustive audit of the current repository. Below are the identified anomalies and technical debt items that require immediate attention.

## 🔴 CRITICAL
- **Architectural Schism**: The project entry point `index.tsx` currently renders `App.tsx` (the monolithic simulator). This effectively hides the professional Next.js App Router implementation residing in `frontend/app/`. This must be reconciled for production deployment.
- **Imprecise Task Recovery**: `backend/app/tasks/system.py` uses a fixed 6-hour interval for recovering missed scheduled jobs. If a daily task is missed due to downtime, it may drift or fail to re-align with its intended window without proper cron calculation logic.
- **Media Inconsistency**: `MediaService` uses `PIL.Image.Resampling.LANCZOS`, which is high quality but expensive. In high-concurrency parser runs (Full Sync), this could lead to CPU exhaustion if not properly throttled.

## 🟠 HIGH
- **Public Collections UI**: While the backend `crud_collection.py` is robust and the Dashboard allows management, there is no public-facing `/collections` page in the Next.js app for users to explore curated lists.
- **WebSocket Throttling**: The `job_telemetry_ws` in `parsers.py` sleep is set to `0.1`, but there is no server-side message batching. High-frequency updates could flood client event loops during large batch runs.
- **Audit Coverage**: Several `bulk` operations log manually rather than leveraging the `deps.audit_trail` dependency, creating a minor forensic inconsistency in the `AuditLog` table structure.

## 🟡 MEDIUM
- **Token Leakage in Logs**: While `refresh_token` endpoint is fixed to use a POST body, the standard FastAPI logger might still capture sensitive headers if verbosity is set too high. 
- **Cache Drift**: Bulk deletions do not currently trigger a prefix-based cache invalidation for the catalog queries, potentially leading to "ghost" records appearing in the public catalog for up to 5 minutes.

## 🟢 LOW
- **Breadcrumb Staticity**: `Breadcrumbs.tsx` uses a static label map. It fails to resolve dynamic entity titles (e.g., it shows "Entity Map" instead of the actual Anime Title when editing).
- **Environment Parity**: The `docker-compose.prod.yml` requires manual secret injection. An `.env.example` or automated secret generator is missing for production hardening.

---

### Architect Recommendation
1. **Reconcile Frontend Entry**: Update `index.tsx` and `App.tsx` to serve as a proper landing node or migrate the Simulator logic into a "Demo Mode" toggle within the Next.js app.
2. **Harden Scheduler**: Implement a more resilient recovery pulse that avoids synchronization drift.
3. **Finish Collections UI**: Complete the public explorer slice to fulfill the "User Engagement" requirement of the specification.
4. **Enforce Audit Middleware**: Ensure 100% administrative mutation coverage via consistent dependency injection.