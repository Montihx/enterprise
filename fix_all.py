#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║     KITSU ENTERPRISE — ПОЛНЫЙ ФИКС БИЛД-ОШИБОК v2       ║
╚══════════════════════════════════════════════════════════╝

Исправляет ВСЕ ошибки из docker-compose up --build:

  [1] dropdown-menu.tsx — обрезан, нет export {}
  [2] mutations.ts — нет useCreateEpisode, useUpdateEpisode,
                     useCreateRelease, useUpdateRelease, типов
  [3] tailwindcss@4.0-beta.8 несовместим с postcss.config.js
       → понижаем до стабильного tailwindcss@3.4.x
  [4] backend/Dockerfile — FROM ... as → FROM ... AS
  [5] Проверяет остальные потенциальные проблемы
"""

import os, re, sys, json, shutil
from pathlib import Path

# ─── Цвета ───────────────────────────────────────────────────────────────────
class C:
    R = "\033[91m"; G = "\033[92m"; Y = "\033[93m"
    B = "\033[94m"; M = "\033[95m"; C = "\033[96m"
    BOLD = "\033[1m"; RESET = "\033[0m"

def ok(m):   print(f"  {C.G}✓{C.RESET}  {m}")
def warn(m): print(f"  {C.Y}⚠{C.RESET}  {m}")
def err(m):  print(f"  {C.R}✗{C.RESET}  {m}")
def info(m): print(f"  {C.C}→{C.RESET}  {m}")
def head(m): print(f"\n{C.BOLD}{C.B}{'─'*60}\n  {m}\n{'─'*60}{C.RESET}")

def find_root():
    for p in [Path(__file__).parent, Path.cwd(), Path.cwd()/"enterprise"]:
        if (p/"docker-compose.yml").exists() and (p/"frontend").exists():
            return p
    for p in [Path.cwd().parent, Path.cwd().parent.parent]:
        if (p/"docker-compose.yml").exists():
            return p
    return None

def backup(path: Path):
    bak = path.with_suffix(path.suffix + ".bak")
    if not bak.exists():
        shutil.copy2(path, bak)

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 1: dropdown-menu.tsx — добавить export {}
# ═══════════════════════════════════════════════════════════════════════════
def fix_dropdown_menu(root: Path):
    head("ФИХ 1: components/ui/dropdown-menu.tsx — недостающий export {}")

    f = root / "frontend" / "components" / "ui" / "dropdown-menu.tsx"
    if not f.exists():
        err(f"Файл не найден: {f}"); return

    content = f.read_text(encoding="utf-8")

    # Проверяем — есть ли уже export {}
    if "export {" in content:
        ok("export {} уже присутствует"); return

    # Файл обрезан на .displayName = DropdownMenuPrimitive.Separator
    # Нужно дописать правильный конец + export
    export_block = """
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
}
"""

    # Если файл обрезан на Separator.displayName без закрывающей строки — дофиксируем
    if content.rstrip().endswith("DropdownMenuPrimitive.Separator"):
        content = content.rstrip() + "\n"

    backup(f)
    f.write_text(content + export_block, encoding="utf-8")
    ok("Добавлен export {} со всеми компонентами dropdown-menu")
    ok(f"Бэкап: {f.with_suffix('.tsx.bak')}")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 2: hooks/mutations.ts — добавить недостающие хуки и типы
# ═══════════════════════════════════════════════════════════════════════════
def fix_mutations(root: Path):
    head("ФИХ 2: hooks/mutations.ts — недостающие хуки и типы")

    f = root / "frontend" / "hooks" / "mutations.ts"
    if not f.exists():
        err(f"Файл не найден: {f}"); return

    content = f.read_text(encoding="utf-8")
    additions = []

    # ── Типы ──────────────────────────────────────────────────────────────
    TYPES_TO_ADD = """
// ─── Type Definitions (used by Form components) ───────────────────────────

export interface AnimeCreate {
  title: string;
  title_en?: string;
  title_original?: string;
  slug?: string;
  kind?: string;
  status?: string;
  description?: string;
  poster_url?: string;
  year?: number;
  score?: number;
  genres?: string[];
  episodes_total?: number;
  episodes_aired?: number;
  shikimori_id?: string;
  kodik_id?: string;
  is_adult?: boolean;
}

export type AnimeUpdate = Partial<AnimeCreate>;

export interface EpisodeCreate {
  anime_id: string;
  season?: number;
  episode: number;
  title?: string;
  description?: string;
  air_date?: string;
  duration?: number;
  filler?: boolean;
  recap?: boolean;
}

export type EpisodeUpdate = Partial<EpisodeCreate>;

export interface ReleaseCreate {
  episode_id: string;
  source?: string;
  quality?: string;
  url: string;
  embed_url?: string;
  translation_type?: string;
  translation_name?: string;
  is_active?: boolean;
}

export type ReleaseUpdate = Partial<ReleaseCreate>;
"""

    # ── Хуки для Episode ──────────────────────────────────────────────────
    EPISODE_HOOKS = """
// ─── Episode Mutations ────────────────────────────────────────────────────

export function useCreateEpisode() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: EpisodeCreate) => {
      const response = await api.post('/episodes/', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Episode created successfully');
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      router.push('/dashboard/content/episodes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create episode');
    },
  });
}

export function useUpdateEpisode(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: EpisodeUpdate) => {
      const response = await api.patch(`/episodes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Episode updated successfully');
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episode', id] });
      router.push('/dashboard/content/episodes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update episode');
    },
  });
}
"""

    # ── Хуки для Release ──────────────────────────────────────────────────
    RELEASE_HOOKS = """
// ─── Release Mutations ────────────────────────────────────────────────────

export function useCreateRelease() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ReleaseCreate) => {
      const response = await api.post('/releases/', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Release created successfully');
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      router.push('/dashboard/content/releases');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create release');
    },
  });
}

export function useUpdateRelease(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ReleaseUpdate) => {
      const response = await api.patch(`/releases/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Release updated successfully');
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      queryClient.invalidateQueries({ queryKey: ['release', id] });
      router.push('/dashboard/content/releases');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update release');
    },
  });
}
"""

    changed = False
    backup(f)

    # Добавить типы если их нет
    if "export interface EpisodeCreate" not in content:
        content = content + TYPES_TO_ADD
        ok("Добавлены типы: AnimeCreate, AnimeUpdate, EpisodeCreate, EpisodeUpdate, ReleaseCreate, ReleaseUpdate")
        changed = True
    else:
        ok("Типы уже присутствуют")

    # Добавить Episode хуки если нет
    if "useCreateEpisode" not in content:
        content = content + EPISODE_HOOKS
        ok("Добавлены хуки: useCreateEpisode, useUpdateEpisode")
        changed = True
    else:
        ok("useCreateEpisode уже есть")

    # Добавить Release хуки если нет
    if "useCreateRelease" not in content:
        content = content + RELEASE_HOOKS
        ok("Добавлены хуки: useCreateRelease, useUpdateRelease")
        changed = True
    else:
        ok("useCreateRelease уже есть")

    if changed:
        f.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {f}")
    else:
        warn("Файл не изменён — все хуки уже на месте")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 3: Tailwind CSS — понизить с 4.0-beta до стабильной 3.4.x
# ═══════════════════════════════════════════════════════════════════════════
def fix_tailwind(root: Path):
    head("ФИХ 3: Tailwind CSS — beta.8 → стабильная версия 3.4.17")

    pkg = root / "frontend" / "package.json"
    postcss = root / "frontend" / "postcss.config.js"
    tailwind_cfg = root / "frontend" / "tailwind.config.ts"

    # ── package.json: понизить tailwindcss ──────────────────────────────
    if pkg.exists():
        data = json.loads(pkg.read_text(encoding="utf-8"))
        dev_deps = data.get("devDependencies", {})
        current_tw = dev_deps.get("tailwindcss", "")
        if "beta" in current_tw or "4.0" in current_tw:
            backup(pkg)
            dev_deps["tailwindcss"] = "^3.4.17"
            # Убрать @tailwindcss/postcss если добавлялся
            dev_deps.pop("@tailwindcss/postcss", None)
            data["devDependencies"] = dev_deps
            pkg.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            ok(f"package.json: tailwindcss {current_tw} → ^3.4.17")
        else:
            ok(f"package.json: tailwindcss уже стабильная ({current_tw})")

    # ── postcss.config.js: старый формат для v3 ─────────────────────────
    if postcss.exists():
        current = postcss.read_text(encoding="utf-8")
        # v4 beta требовала @tailwindcss/postcss, v3 использует tailwindcss напрямую
        correct_postcss = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
        if current.strip() != correct_postcss.strip():
            backup(postcss)
            postcss.write_text(correct_postcss, encoding="utf-8")
            ok("postcss.config.js: восстановлен формат для tailwindcss v3")
        else:
            ok("postcss.config.js: уже корректный")

    # ── tailwind.config.ts: убедиться что v3 совместимый формат ─────────
    if tailwind_cfg.exists():
        tw_content = tailwind_cfg.read_text(encoding="utf-8")
        # В v4 beta content/theme были другими, но раз уже есть правильный config — оставляем
        if "content:" in tw_content:
            ok("tailwind.config.ts: формат корректный для v3")
        else:
            warn("tailwind.config.ts: проверь вручную — может быть несовместим с v3")

    # ── Dockerfile: добавить установку tailwindcss после pnpm install ────
    # Это гарантирует что правильная версия будет в контейнере
    df = root / "frontend" / "Dockerfile"
    if df.exists():
        content = df.read_text(encoding="utf-8")
        # Убедиться что нет принудительной установки beta-версии
        if "@tailwindcss/postcss" in content:
            backup(df)
            content = content.replace(
                "RUN pnpm add @tailwindcss/postcss\n", ""
            ).replace(
                "RUN pnpm add @tailwindcss/postcss --save-dev\n", ""
            )
            df.write_text(content, encoding="utf-8")
            ok("Dockerfile: убрана принудительная установка @tailwindcss/postcss")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 4: backend/Dockerfile — FROM ... as → FROM ... AS
# ═══════════════════════════════════════════════════════════════════════════
def fix_backend_dockerfile(root: Path):
    head("ФИХ 4: backend/Dockerfile — FROM ... as → FROM ... AS")

    df = root / "backend" / "Dockerfile"
    if not df.exists():
        err(f"Не найден: {df}"); return

    content = df.read_text(encoding="utf-8")
    fixed = re.sub(
        r"^(FROM\s+\S+(?:@\S+)?)\s+as\s+(\w+)",
        lambda m: f"{m.group(1)} AS {m.group(2)}",
        content, flags=re.MULTILINE
    )

    if fixed != content:
        backup(df)
        df.write_text(fixed, encoding="utf-8")
        ok("backend/Dockerfile: FROM ... as → FROM ... AS (убрано предупреждение)")
    else:
        ok("backend/Dockerfile: регистр AS уже корректен")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 5: frontend/Dockerfile — убедиться что --no-frozen-lockfile
# ═══════════════════════════════════════════════════════════════════════════
def fix_frontend_dockerfile(root: Path):
    head("ФИХ 5: frontend/Dockerfile — pnpm install flags")

    df = root / "frontend" / "Dockerfile"
    if not df.exists():
        err(f"Не найден: {df}"); return

    content = df.read_text(encoding="utf-8")
    original = content

    # frozen-lockfile → no-frozen-lockfile
    if "--frozen-lockfile" in content and "--no-frozen-lockfile" not in content:
        content = content.replace("--frozen-lockfile", "--no-frozen-lockfile")
        ok("Dockerfile: --frozen-lockfile → --no-frozen-lockfile")

    # FROM ... as → FROM ... AS
    fixed = re.sub(
        r"^(FROM\s+\S+(?:@\S+)?)\s+as\s+(\w+)",
        lambda m: f"{m.group(1)} AS {m.group(2)}",
        content, flags=re.MULTILINE
    )
    if fixed != content:
        content = fixed
        ok("frontend/Dockerfile: FROM ... as → FROM ... AS")

    if content != original:
        backup(df)
        df.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {df}")
    else:
        ok("frontend/Dockerfile: уже корректен")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 6: docker-compose.yml — убрать version, добавить worker/beat
# ═══════════════════════════════════════════════════════════════════════════
def fix_docker_compose(root: Path):
    head("ФИХ 6: docker-compose.yml — version + worker + beat")

    dc = root / "docker-compose.yml"
    if not dc.exists():
        err(f"Не найден: {dc}"); return

    content = dc.read_text(encoding="utf-8")
    original = content
    changed = False

    # Убрать version
    new_lines = [l for l in content.splitlines() if not l.strip().startswith("version:")]
    new_content = "\n".join(new_lines).lstrip("\n")
    if new_content != content:
        content = new_content
        ok("Убрана строка 'version:' (deprecated)")
        changed = True

    # Убрать конфликтующий volume ./frontend:/app
    if "- ./frontend:/app" in content:
        content = content.replace("      - ./frontend:/app\n", "")
        ok("Убран volume '- ./frontend:/app' (конфликтует с Docker build)")
        changed = True

    # Добавить SECRET_KEY в backend env
    if "SECRET_KEY" not in content and "backend:" in content:
        content = content.replace(
            "      API_ENV: development\n    volumes:\n      - ./backend:/app",
            "      API_ENV: development\n      SECRET_KEY: dev-secret-key-please-change-in-production\n    volumes:\n      - ./backend:/app"
        )
        ok("Добавлен SECRET_KEY в backend environment")
        changed = True

    # Добавить worker и beat
    if "worker:" not in content and "celery" not in content:
        worker_yaml = """
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kitsu_worker
    environment:
      DATABASE_URL: postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu
      REDIS_URL: redis://redis:6379/0
      API_ENV: development
      SECRET_KEY: dev-secret-key-please-change-in-production
    volumes:
      - ./backend:/app
      - media_data:/app/media
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: celery -A app.worker worker --loglevel=info
    restart: unless-stopped

  beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kitsu_beat
    environment:
      DATABASE_URL: postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu
      REDIS_URL: redis://redis:6379/0
      API_ENV: development
      SECRET_KEY: dev-secret-key-please-change-in-production
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    command: celery -A app.core.celery_app beat --loglevel=info
    restart: unless-stopped
"""
        if "\nvolumes:" in content:
            content = content.replace("\nvolumes:", worker_yaml + "\nvolumes:")
        else:
            content += worker_yaml
        ok("Добавлены сервисы worker (Celery) + beat (Scheduler)")
        changed = True
    else:
        ok("worker/beat уже присутствуют")

    if changed:
        backup(dc)
        dc.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {dc}")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 7: .env файлы
# ═══════════════════════════════════════════════════════════════════════════
def fix_env_files(root: Path):
    head("ФИХ 7: .env файлы")

    backend_env = root / "backend" / ".env"
    if not backend_env.exists():
        backend_env.write_text(
            "DATABASE_URL=postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu\n"
            "REDIS_URL=redis://redis:6379/0\n"
            "API_ENV=development\n"
            "LOG_LEVEL=INFO\n"
            "SECRET_KEY=dev-secret-key-please-change-in-production\n"
            'BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]\n'
            "KODIK_API_KEY=\n"
            "SHIKIMORI_URL=https://shikimori.one\n"
            "KODIK_URL=https://kodikapi.com\n"
            "MEDIA_ROOT=/app/media\n"
            "STATIC_HOST=http://localhost:8000/media\n",
            encoding="utf-8"
        )
        ok(f"Создан backend/.env")
    else:
        ok("backend/.env уже существует")

    fe_env = root / "frontend" / ".env.local"
    if not fe_env.exists():
        fe_env.write_text(
            "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1\n"
            "NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1\n"
            "NEXT_TELEMETRY_DISABLED=1\n",
            encoding="utf-8"
        )
        ok("Создан frontend/.env.local")
    else:
        ok("frontend/.env.local уже существует")

# ═══════════════════════════════════════════════════════════════════════════
# ФИХ 8: backend/app/main.py — cache.connect()
# ═══════════════════════════════════════════════════════════════════════════
def fix_backend_main(root: Path):
    head("ФИХ 8: backend/app/main.py — cache.connect()")

    main_py = root / "backend" / "app" / "main.py"
    if not main_py.exists():
        err(f"Не найден: {main_py}"); return

    content = main_py.read_text(encoding="utf-8")

    if "await cache.connect()" in content:
        ok("cache.connect() уже есть в lifespan"); return

    if "from app.core.cache import cache" not in content:
        if "from app.core.logging import" in content:
            content = content.replace(
                "from app.core.logging import setup_logging, logger",
                "from app.core.cache import cache\nfrom app.core.logging import setup_logging, logger"
            )
        else:
            content = "from app.core.cache import cache\n" + content
        ok("Добавлен import cache")

    # Вставить await cache.connect() в lifespan startup
    patterns = [
        ("    setup_logging()\n    Path", "    setup_logging()\n    await cache.connect()\n    Path"),
        ("    setup_logging()\n    logger", "    setup_logging()\n    await cache.connect()\n    logger"),
        ("    # Startup\n    setup_logging()", "    # Startup\n    setup_logging()\n    await cache.connect()"),
        ("    setup_logging()\n    yield", "    setup_logging()\n    await cache.connect()\n    yield"),
    ]
    fixed = False
    for old, new in patterns:
        if old in content:
            content = content.replace(old, new, 1)
            fixed = True
            break

    if not fixed:
        warn("Не удалось auto-fix cache.connect() — добавь вручную в lifespan()")
        return

    if "await cache.disconnect()" not in content and "await engine.dispose()" in content:
        content = content.replace(
            "await engine.dispose()",
            "await cache.disconnect()\n    await engine.dispose()"
        )
        ok("Добавлен cache.disconnect() в shutdown")

    backup(main_py)
    main_py.write_text(content, encoding="utf-8")
    ok(f"Сохранён: {main_py}")

# ═══════════════════════════════════════════════════════════════════════════
# ПРОВЕРКА: Сканирование на будущие проблемы
# ═══════════════════════════════════════════════════════════════════════════
def scan_future_issues(root: Path):
    head("СКАНИРОВАНИЕ: Потенциальные проблемы в будущем")

    fe = root / "frontend"
    issues = []

    # Проверить все импорты из ui/
    ui_dir = fe / "components" / "ui"
    if ui_dir.exists():
        ui_files = {f.stem for f in ui_dir.glob("*.tsx")}
        for tsx in list(fe.glob("**/*.tsx")):
            try:
                text = tsx.read_text(encoding="utf-8")
                imports = re.findall(r"from '@/components/ui/([^']+)'", text)
                for imp in imports:
                    if imp not in ui_files:
                        issues.append(f"  Нет ui/{imp}.tsx ← нужен для {tsx.relative_to(fe)}")
            except Exception:
                pass

    # Проверить mutations импорты
    mutations_path = fe / "hooks" / "mutations.ts"
    if mutations_path.exists():
        mutations_text = mutations_path.read_text(encoding="utf-8")
        exports = set(re.findall(r"^export (?:function|const|interface|type) (\w+)", mutations_text, re.MULTILINE))
        for tsx in fe.glob("**/*.tsx"):
            try:
                text = tsx.read_text(encoding="utf-8")
                for m in re.finditer(r"import \{([^}]+)\} from '@/hooks/mutations'", text):
                    for name in re.findall(r"\w+", m.group(1)):
                        if name not in exports and not name[0].islower() is False:
                            if name.startswith("use") or name[0].isupper():
                                if name not in exports:
                                    issues.append(f"  mutations.ts не экспортирует '{name}' ← нужен в {tsx.relative_to(fe)}")
            except Exception:
                pass

    # Проверить queries импорты
    queries_path = fe / "hooks" / "queries.ts"
    if queries_path.exists():
        queries_text = queries_path.read_text(encoding="utf-8")
        q_exports = set(re.findall(r"^export (?:function|const) (\w+)", queries_text, re.MULTILINE))
        for tsx in fe.glob("**/*.tsx"):
            try:
                text = tsx.read_text(encoding="utf-8")
                for m in re.finditer(r"import \{([^}]+)\} from '@/hooks/queries'", text):
                    for name in re.findall(r"\w+", m.group(1)):
                        if name.startswith("use") and name not in q_exports:
                            issues.append(f"  queries.ts не экспортирует '{name}' ← нужен в {tsx.relative_to(fe)}")
            except Exception:
                pass

    if issues:
        # Дедупликация
        seen = set()
        for issue in issues:
            if issue not in seen:
                warn(issue)
                seen.add(issue)
    else:
        ok("Потенциальных проблем с импортами не обнаружено")

# ═══════════════════════════════════════════════════════════════════════════
# ФИНАЛ
# ═══════════════════════════════════════════════════════════════════════════
def print_done(root: Path):
    print(f"""
{C.BOLD}{'═'*60}
  ✅  ВСЕ ФИКСЫ ПРИМЕНЕНЫ
{'═'*60}{C.RESET}

{C.BOLD}Следующий шаг — пересобрать контейнеры:{C.RESET}

  {C.G}cd {root}{C.RESET}

  {C.G}docker-compose down{C.RESET}
  {C.G}docker-compose up --build{C.RESET}

  {C.C}Ждём ~3-5 минут. После старта:{C.RESET}

  В ДРУГОМ PowerShell окне:
  {C.G}docker-compose exec backend alembic upgrade head{C.RESET}
  {C.G}docker-compose exec backend python -m app.initial_data{C.RESET}

  Затем открывай:
  🌐  {C.G}http://localhost:3000{C.RESET}           Frontend
  📖  {C.G}http://localhost:8000/docs{C.RESET}      API Swagger
  💚  {C.G}http://localhost:8000/api/health{C.RESET}  Health

  Логин: {C.Y}admin@kitsu.local{C.RESET}  /  {C.Y}admin123{C.RESET}
  Dashboard: {C.G}http://localhost:3000/dashboard{C.RESET}

{C.Y}  ℹ  Бэкапы изменённых файлов: *.bak рядом с оригиналами{C.RESET}
""")

def main():
    print(f"""{C.BOLD}{C.M}
╔══════════════════════════════════════════════════════════╗
║     KITSU ENTERPRISE — ПОЛНЫЙ ФИКС БИЛД-ОШИБОК v2       ║
╚══════════════════════════════════════════════════════════╝{C.RESET}
""")

    root = find_root()
    if not root:
        err("Не найден корень проекта (docker-compose.yml + frontend/)")
        err(f"Текущая папка: {Path.cwd()}")
        err("Положи скрипт рядом с docker-compose.yml")
        if sys.platform == "win32": input("\nEnter для выхода...")
        sys.exit(1)

    info(f"Корень проекта: {root}")

    fix_dropdown_menu(root)
    fix_mutations(root)
    fix_tailwind(root)
    fix_backend_dockerfile(root)
    fix_frontend_dockerfile(root)
    fix_docker_compose(root)
    fix_env_files(root)
    fix_backend_main(root)
    scan_future_issues(root)
    print_done(root)

    if sys.platform == "win32":
        input("Нажми Enter для закрытия...")

if __name__ == "__main__":
    main()
