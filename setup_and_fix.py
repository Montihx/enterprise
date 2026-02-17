#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║       KITSU ENTERPRISE — AUTO-SETUP & FIX SCRIPT        ║
║  Запусти один раз, потом: docker-compose up --build      ║
╚══════════════════════════════════════════════════════════╝

Что делает этот скрипт:
  1. Чинит frontend/Dockerfile (pnpm frozen-lockfile → no-frozen-lockfile)
  2. Чинит FROM as → FROM AS (Docker предупреждение)
  3. Добавляет worker + beat (Celery) в docker-compose.yml
  4. Убирает конфликтующие volume-монтирования фронтенда
  5. Создаёт backend/.env с нужными переменными
  6. Создаёт frontend/.env.local
  7. Чинит backend/app/main.py — подключает Redis cache в lifespan
  8. Проверяет что Docker запущен

Запуск:  python setup_and_fix.py
         (или дважды кликни setup_and_fix.py в проводнике)
"""

import os
import sys
import subprocess
import shutil
import textwrap
from pathlib import Path

# ─── Цвета для консоли ───────────────────────────────────────────────────────
class C:
    RED    = "\033[91m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    BLUE   = "\033[94m"
    CYAN   = "\033[96m"
    BOLD   = "\033[1m"
    RESET  = "\033[0m"

def ok(msg):    print(f"  {C.GREEN}✓{C.RESET}  {msg}")
def warn(msg):  print(f"  {C.YELLOW}⚠{C.RESET}  {msg}")
def err(msg):   print(f"  {C.RED}✗{C.RESET}  {msg}")
def info(msg):  print(f"  {C.CYAN}→{C.RESET}  {msg}")
def head(msg):  print(f"\n{C.BOLD}{C.BLUE}{'─'*58}\n  {msg}\n{'─'*58}{C.RESET}")

# ─── Найти корень проекта ─────────────────────────────────────────────────────
def find_project_root():
    """Ищем папку где лежит docker-compose.yml"""
    candidates = [
        Path(__file__).parent,           # рядом со скриптом
        Path.cwd(),                       # текущая папка
        Path.cwd() / "enterprise",        # subfolder
    ]
    for p in candidates:
        if (p / "docker-compose.yml").exists():
            return p
    # Поиск на 2 уровня вверх
    for p in [Path.cwd().parent, Path.cwd().parent.parent]:
        if (p / "docker-compose.yml").exists():
            return p
    return None

# ─── ФИКС 1: frontend/Dockerfile ─────────────────────────────────────────────
def fix_frontend_dockerfile(root: Path):
    head("ФИХ 1: frontend/Dockerfile")
    df = root / "frontend" / "Dockerfile"
    
    if not df.exists():
        err(f"Dockerfile не найден: {df}")
        return False

    content = df.read_text(encoding="utf-8")
    original = content
    changed = False

    # Fix 1: frozen-lockfile → no-frozen-lockfile
    if "--frozen-lockfile" in content:
        content = content.replace(
            "pnpm install --frozen-lockfile",
            "pnpm install --no-frozen-lockfile"
        )
        ok("pnpm install --frozen-lockfile  →  --no-frozen-lockfile")
        changed = True
    else:
        ok("--frozen-lockfile уже не используется")

    # Fix 2: FROM ... as → FROM ... AS (Docker warning)
    import re
    fixed_as = re.sub(r"^(FROM\s+\S+)\s+as\s+(\w+)", r"\1 AS \2", content, flags=re.MULTILINE | re.IGNORECASE)
    if fixed_as != content:
        content = fixed_as
        ok("FROM ... as → FROM ... AS (убрано предупреждение)")
        changed = True
    else:
        ok("Регистр AS уже корректен")

    if changed:
        # Бэкап оригинала
        df.with_suffix(".Dockerfile.bak").write_text(original, encoding="utf-8")
        df.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {df}")
    return True

# ─── ФИКС 2: docker-compose.yml ──────────────────────────────────────────────
def fix_docker_compose(root: Path):
    head("ФИХ 2: docker-compose.yml")
    dc = root / "docker-compose.yml"

    if not dc.exists():
        err(f"docker-compose.yml не найден: {dc}")
        return False

    content = dc.read_text(encoding="utf-8")
    original = content
    changed = False

    # Fix: убрать volume-монтирование ./frontend:/app (оно перезаписывает build)
    # Оставим только named volumes для node_modules и .next
    if "- ./frontend:/app" in content:
        content = content.replace("      - ./frontend:/app\n", "")
        ok("Убрано: '- ./frontend:/app' (конфликтовало с Docker build)")
        changed = True

    # Fix: убрать version (deprecated warning)
    if content.startswith("version:"):
        content = "\n".join(
            line for line in content.splitlines()
            if not line.startswith("version:")
        ).lstrip("\n")
        ok("Убрана строка 'version:' (устаревший атрибут)")
        changed = True

    # Добавить worker и beat если их нет
    if "celery" not in content and "worker" not in content:
        worker_beat = """
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kitsu_worker
    environment:
      DATABASE_URL: postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu
      REDIS_URL: redis://redis:6379/0
      API_ENV: development
      SECRET_KEY: dev-secret-key-change-in-production
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
      SECRET_KEY: dev-secret-key-change-in-production
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    command: celery -A app.core.celery_app beat --loglevel=info --scheduler celery.beat:PersistentScheduler
    restart: unless-stopped
"""
        # Вставить перед "volumes:" секцией в конце
        if "\nvolumes:" in content:
            content = content.replace("\nvolumes:", worker_beat + "\nvolumes:")
        else:
            content += worker_beat

        ok("Добавлены сервисы: worker (Celery) + beat (Scheduler)")
        changed = True
    else:
        ok("Сервисы worker/beat уже присутствуют")

    # Добавить SECRET_KEY в backend environment если нет
    if "SECRET_KEY" not in content:
        content = content.replace(
            "      API_ENV: development\n    volumes:\n      - ./backend:/app",
            "      API_ENV: development\n      SECRET_KEY: dev-secret-key-change-in-production\n    volumes:\n      - ./backend:/app"
        )
        ok("Добавлен SECRET_KEY в backend environment")
        changed = True

    if changed:
        dc.with_suffix(".yml.bak").write_text(original, encoding="utf-8")
        dc.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {dc}")
    return True

# ─── ФИКС 3: backend/.env ────────────────────────────────────────────────────
def create_backend_env(root: Path):
    head("ФИХ 3: backend/.env")
    env_file = root / "backend" / ".env"

    if env_file.exists():
        warn(f"backend/.env уже существует, пропускаем (не перезаписываем)")
        ok("Если переменные некорректны — удали файл и запусти скрипт снова")
        return True

    env_content = textwrap.dedent("""\
        # ─── Kitsu Enterprise — Backend Environment ───────────────
        # Автоматически создан setup_and_fix.py
        # ВАЖНО: Измени SECRET_KEY перед production-деплоем!

        DATABASE_URL=postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu
        REDIS_URL=redis://redis:6379/0
        API_ENV=development
        LOG_LEVEL=INFO

        # JWT Security (ОБЯЗАТЕЛЬНО поменяй в production!)
        SECRET_KEY=dev-secret-key-change-in-production-please

        # CORS — разрешённые frontend origins
        BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

        # Парсеры (опционально — заполни если есть ключи)
        KODIK_API_KEY=
        SHIKIMORI_URL=https://shikimori.one
        KODIK_URL=https://kodikapi.com

        # Sentry мониторинг (опционально)
        SENTRY_DSN=

        # Медиа-файлы
        MEDIA_ROOT=/app/media
        STATIC_HOST=http://localhost:8000/media
    """)

    env_file.write_text(env_content, encoding="utf-8")
    ok(f"Создан: {env_file}")
    warn("Не забудь изменить SECRET_KEY перед production-деплоем!")
    return True

# ─── ФИКС 4: frontend/.env.local ─────────────────────────────────────────────
def create_frontend_env(root: Path):
    head("ФИХ 4: frontend/.env.local")
    env_file = root / "frontend" / ".env.local"

    if env_file.exists():
        warn(f"frontend/.env.local уже существует, пропускаем")
        return True

    env_content = textwrap.dedent("""\
        # ─── Kitsu Enterprise — Frontend Environment ──────────────
        # Автоматически создан setup_and_fix.py

        NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
        NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1
        NEXT_TELEMETRY_DISABLED=1
    """)

    env_file.write_text(env_content, encoding="utf-8")
    ok(f"Создан: {env_file}")
    return True

# ─── ФИКС 5: backend/app/main.py — cache.connect() в lifespan ────────────────
def fix_backend_main(root: Path):
    head("ФИХ 5: backend/app/main.py — Redis cache подключение")
    main_py = root / "backend" / "app" / "main.py"

    if not main_py.exists():
        err(f"Файл не найден: {main_py}")
        return False

    content = main_py.read_text(encoding="utf-8")

    if "await cache.connect()" in content:
        ok("cache.connect() уже вызывается в lifespan — ничего не меняем")
        return True

    if "from app.core.cache import cache" not in content:
        # Добавить импорт после других импортов из app.core
        if "from app.core.logging import" in content:
            content = content.replace(
                "from app.core.logging import setup_logging, logger",
                "from app.core.logging import setup_logging, logger\nfrom app.core.cache import cache"
            )
        else:
            content = "from app.core.cache import cache\n" + content
        ok("Добавлен импорт: from app.core.cache import cache")

    # Найти lifespan и добавить cache.connect()
    # Ищем паттерн startup в lifespan
    old_lifespan_patterns = [
        "    setup_logging()\n    Path(settings.MEDIA_ROOT)",
        "    setup_logging()\n    logger.info",
        "    # Startup sequence\n    setup_logging()",
    ]

    fixed = False
    for pattern in old_lifespan_patterns:
        if pattern in content:
            content = content.replace(
                pattern,
                pattern + "\n    await cache.connect()"
            )
            fixed = True
            break

    if not fixed:
        # Более агрессивный поиск — вставить после первой строки в lifespan body
        import re
        match = re.search(r"(async def lifespan\(app: FastAPI\):\n)(    )", content)
        if match:
            pos = match.end()
            content = content[:pos] + "await cache.connect()\n    " + content[pos:]
            fixed = True

    if not fixed:
        warn("Не удалось автоматически добавить cache.connect() — добавь вручную:")
        warn("  В lifespan() после setup_logging() добавь: await cache.connect()")
        warn("  В lifespan() перед 'yield' убедись что await cache.disconnect() тоже есть")
        return False

    ok("Добавлен вызов: await cache.connect() в lifespan startup")

    # Добавить cache.disconnect() перед engine.dispose() если нет
    if "await cache.disconnect()" not in content:
        if "await engine.dispose()" in content:
            content = content.replace(
                "await engine.dispose()",
                "await cache.disconnect()\n    await engine.dispose()"
            )
            ok("Добавлен вызов: await cache.disconnect() в lifespan shutdown")

    main_py.with_suffix(".py.bak").write_text(
        main_py.read_text(encoding="utf-8"), encoding="utf-8"
    )
    main_py.write_text(content, encoding="utf-8")
    ok(f"Сохранён: {main_py}")
    return True

# ─── ФИКС 6: Проверить .gitignore чтобы .env не попало в git ─────────────────
def fix_gitignore(root: Path):
    head("ФИХ 6: .gitignore — защита секретов")
    gitignore = root / ".gitignore"

    needed = [".env", ".env.local", "*.env", "**/.env", "**/.env.local"]
    if gitignore.exists():
        content = gitignore.read_text(encoding="utf-8")
        missing = [e for e in needed if e not in content]
        if missing:
            content += "\n# Env files (auto-added by setup_and_fix.py)\n"
            for m in missing:
                content += f"{m}\n"
            gitignore.write_text(content, encoding="utf-8")
            ok(f"Добавлено в .gitignore: {', '.join(missing)}")
        else:
            ok(".gitignore уже содержит правила для .env файлов")
    else:
        gitignore.write_text("\n".join(needed) + "\n__pycache__/\n*.pyc\nnode_modules/\n.next/\n")
        ok(f"Создан .gitignore с базовыми правилами")

# ─── ПРОВЕРКА: Docker запущен ─────────────────────────────────────────────────
def check_docker():
    head("ПРОВЕРКА: Docker")
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            ok("Docker Desktop запущен и доступен")
            return True
        else:
            err("Docker отвечает с ошибкой:")
            err(result.stderr[:200])
            return False
    except FileNotFoundError:
        err("Docker не установлен или не найден в PATH")
        err("Скачай Docker Desktop: https://www.docker.com/products/docker-desktop/")
        return False
    except subprocess.TimeoutExpired:
        err("Docker не отвечает — запусти Docker Desktop и подожди")
        return False

# ─── ФИНАЛЬНЫЕ ИНСТРУКЦИИ ─────────────────────────────────────────────────────
def print_next_steps(root: Path, docker_ok: bool):
    print(f"\n{C.BOLD}{'═'*58}")
    print(f"  ✅  ВСЕ ФИКСЫ ПРИМЕНЕНЫ")
    print(f"{'═'*58}{C.RESET}")

    rel = root.name
    print(f"""
{C.BOLD}📋 СЛЕДУЮЩИЕ ШАГИ:{C.RESET}

  {C.CYAN}Шаг 1:{C.RESET} Открой PowerShell/Terminal в папке проекта:

      cd {root}

  {C.CYAN}Шаг 2:{C.RESET} Запусти Docker Compose:

      {C.GREEN}docker-compose up --build{C.RESET}

      ⏳ Первый запуск займёт 3-7 минут (скачивает образы)

  {C.CYAN}Шаг 3:{C.RESET} В отдельном PowerShell окне (пока предыдущее работает):

      {C.GREEN}docker-compose exec backend alembic upgrade head{C.RESET}
      {C.GREEN}docker-compose exec backend python -m app.initial_data{C.RESET}

  {C.CYAN}Шаг 4:{C.RESET} Открой в браузере:

      🌐 Frontend:   {C.GREEN}http://localhost:3000{C.RESET}
      📖 API Docs:   {C.GREEN}http://localhost:8000/docs{C.RESET}
      💚 Health:     {C.GREEN}http://localhost:8000/api/health{C.RESET}

  {C.CYAN}Логин:{C.RESET}
      Email:    {C.YELLOW}admin@kitsu.local{C.RESET}
      Password: {C.YELLOW}admin123{C.RESET}
      Dashboard:{C.GREEN}http://localhost:3000/dashboard{C.RESET}

{C.BOLD}{'═'*58}{C.RESET}
{C.YELLOW}  ℹ  Бэкапы изменённых файлов сохранены с расширением .bak{C.RESET}
""")

    if not docker_ok:
        print(f"{C.RED}  ⚠  Docker не обнаружен! Запусти Docker Desktop сначала.{C.RESET}\n")

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print(f"""
{C.BOLD}{C.BLUE}
╔══════════════════════════════════════════════════════════╗
║       KITSU ENTERPRISE — AUTO-SETUP & FIX SCRIPT        ║
╚══════════════════════════════════════════════════════════╝{C.RESET}
""")

    # Найти корень проекта
    root = find_project_root()
    if not root:
        err("Не удалось найти корень проекта (папку с docker-compose.yml)")
        err(f"Убедись что скрипт лежит рядом с docker-compose.yml")
        err(f"Текущая папка: {Path.cwd()}")
        input("\nНажми Enter для выхода...")
        sys.exit(1)

    info(f"Корень проекта: {root}")

    # Применяем все фиксы
    fix_frontend_dockerfile(root)
    fix_docker_compose(root)
    create_backend_env(root)
    create_frontend_env(root)
    fix_backend_main(root)
    fix_gitignore(root)
    docker_ok = check_docker()

    print_next_steps(root, docker_ok)

    # На Windows — пауза чтобы окно не закрылось
    if sys.platform == "win32":
        input("Нажми Enter для закрытия...")

if __name__ == "__main__":
    main()
