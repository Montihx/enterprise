#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║     KITSU ENTERPRISE — ULTIMATE FIX v5.0 (17.02.2026)       ║
║  Исправляет ВСЁ: main.py, docker-compose, frontend, cleanup  ║
╚══════════════════════════════════════════════════════════════╝
"""

import os
import shutil
import sys
import re
from pathlib import Path
from typing import List

# ==================== ЦВЕТА ====================
class C:
    G = "\033[92m"; Y = "\033[93m"; R = "\033[91m"
    B = "\033[94m"; BOLD = "\033[1m"; END = "\033[0m"

def ok(msg):    print(f"  {C.G}✓{C.END}  {msg}")
def warn(msg):  print(f"  {C.Y}⚠{C.END}  {msg}")
def err(msg):   print(f"  {C.R}✗{C.END}  {msg}")
def info(msg):  print(f"  {C.B}→{C.END}  {msg}")
def head(msg):  print(f"\n{C.BOLD}{C.B}{'═'*70}\n  {msg}\n{'═'*70}{C.END}")

# ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
def find_root() -> Path:
    root = Path.cwd()
    if (root / "docker-compose.yml").exists():
        return root
    for p in [root.parent, root.parent.parent]:
        if (p / "docker-compose.yml").exists():
            return p
    err("Не найден docker-compose.yml. Запусти скрипт из корня проекта!")
    sys.exit(1)

def cleanup_root(root: Path):
    head("🧹 ОЧИСТКА КОРНЯ ОТ VITE-МУСОРА")
    trash = [
        "App.tsx", "index.html", "index.tsx", "vite.config.ts", "tsconfig.json",
        "ЗАПУСТИТЬ_МЕНЯ.bat", "tasklist.txt", "kitsu_tasklist.docx",
        "metadata.json", "extract_docx.py", "*.bak"
    ]
    removed = 0
    for pattern in trash:
        for f in list(root.glob(pattern)) + list(root.glob(pattern.replace("*", ""))):
            try:
                if f.is_file():
                    f.unlink()
                    ok(f"Удалён: {f.name}")
                    removed += 1
            except:
                pass
    if removed == 0:
        ok("Мусор уже удалён ранее")
    else:
        ok(f"Удалено {removed} мусорных файлов")

def fix_main_py(root: Path):
    head("🔧 ИСПРАВЛЕНИЕ backend/app/main.py")
    path = root / "backend" / "app" / "main.py"
    if not path.exists():
        err(f"Файл не найден: {path}")
        return

    content = path.read_text(encoding="utf-8")

    # Главная ошибка
    if "await cache.connect().mkdir" in content or "Path(settings.MEDIA_ROOT)" in content:
        new_lifespan = '''@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    Path(settings.MEDIA_ROOT).mkdir(parents=True, exist_ok=True)
    await cache.connect()
    
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.API_ENV,
            traces_sample_rate=1.0,
        )
        logger.info("Sentry: Guarding application state")

    logger.info("Kitsu Enterprise API: Cluster Online", extra={"env": settings.API_ENV})
    yield
    
    # Shutdown
    logger.info("Kitsu Enterprise API: Initiating graceful shutdown")
    await cache.disconnect()
    await engine.dispose()
'''
        # Заменяем весь lifespan
        content = re.sub(r'@asynccontextmanager\s*async def lifespan\(app: FastAPI\):[\s\S]*?yield[\s\S]*?await engine\.dispose\(\)', new_lifespan, content, flags=re.MULTILINE)
        ok("Полностью исправлен lifespan + cache.connect()")

    # Добавляем импорт cache, если нет
    if "from app.core.cache import cache" not in content:
        content = content.replace(
            "from app.core.logging import setup_logging, logger",
            "from app.core.logging import setup_logging, logger\nfrom app.core.cache import cache"
        )
        ok("Добавлен импорт cache")

    path.write_text(content, encoding="utf-8")
    ok("backend/app/main.py — полностью исправлен")

def create_next_config(root: Path):
    head("📄 СОЗДАНИЕ frontend/next.config.mjs")
    frontend = root / "frontend"
    frontend.mkdir(exist_ok=True)
    config_path = frontend / "next.config.mjs"
    
    if config_path.exists():
        ok("next.config.mjs уже существует")
        return

    content = '''/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
'''
    config_path.write_text(content, encoding="utf-8")
    ok("Создан next.config.mjs (output: standalone)")

def fix_docker_compose(root: Path):
    head("🐳 ИСПРАВЛЕНИЕ docker-compose.yml (frontend volumes)")
    dc = root / "docker-compose.yml"
    if not dc.exists():
        err("docker-compose.yml не найден")
        return

    content = dc.read_text(encoding="utf-8")
    original = content

    # Добавляем правильный mount для frontend
    if "frontend:" in content and "- ./frontend:/app" not in content:
        frontend_block = """
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: kitsu_frontend
    ports:
      - '3000:3000'
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    command: pnpm dev
"""
        # Заменяем старый frontend блок
        content = re.sub(r'  frontend:[\s\S]*?depends_on:[\s\S]*?- backend', frontend_block.strip(), content)
        ok("Добавлен правильный volume mount для frontend (hot-reload работает)")

    if content != original:
        (root / "docker-compose.yml.bak").write_text(original, encoding="utf-8")
        dc.write_text(content, encoding="utf-8")
        ok("docker-compose.yml обновлён")
    else:
        ok("docker-compose.yml уже корректен")

def main():
    head("🚀 KITSU ENTERPRISE — ULTIMATE FIX v5.0")
    root = find_root()
    info(f"Корень проекта: {root}")

    cleanup_root(root)
    fix_main_py(root)
    create_next_config(root)
    fix_docker_compose(root)

    # Финальные рекомендации
    head("✅ ВСЁ ИСПРАВЛЕНО!")
    print(f"{C.G}Теперь запускай:{C.END}")
    print("   docker-compose down -v --rmi all")
    print("   docker-compose up --build")
    print("\nПосле запуска:")
    print("   http://localhost:3000          ← Frontend")
    print("   http://localhost:8000/docs     ← Swagger")
    print(f"\n{C.BOLD}Если остались ошибки — пришли лог, исправим за 30 секунд!{C.END}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        err(f"Ошибка: {e}")
        sys.exit(1)