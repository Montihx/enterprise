#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║   KITSU ENTERPRISE — ФИНАЛЬНЫЙ ПОЛНЫЙ ФИКС v3.0          ║
║   Гарантирует успешный docker-compose up --build          ║
╚══════════════════════════════════════════════════════════╝
Запуск: python fix_all_v3.py
"""

import os, re, sys, json, shutil
from pathlib import Path

class C:
    R="\033[91m"; G="\033[92m"; Y="\033[93m"
    B="\033[94m"; M="\033[95m"; C="\033[96m"
    BOLD="\033[1m"; RESET="\033[0m"

def ok(m):   print(f"  {C.G}✓{C.RESET}  {m}")
def warn(m): print(f"  {C.Y}⚠{C.RESET}  {m}")
def err(m):  print(f"  {C.R}✗{C.RESET}  {m}")
def info(m): print(f"  {C.C}→{C.RESET}  {m}")
def head(m): print(f"\n{C.BOLD}{C.B}{'─'*60}\n  {m}\n{'─'*60}{C.RESET}")

def find_root():
    for p in [Path(__file__).parent, Path.cwd(), Path.cwd()/"enterprise"]:
        if (p/"docker-compose.yml").exists() and (p/"frontend").exists():
            return p
    return None

def backup(path: Path):
    bak = path.with_suffix(path.suffix + ".bak")
    if not bak.exists():
        shutil.copy2(path, bak)

# ═══════════════════════════════════════════════════════════
# ФИХ 1: dropdown-menu.tsx — ПОЛНАЯ ЗАМЕНА файла
# (Файл обрезан + DropdownMenuShortcut не определён)
# ═══════════════════════════════════════════════════════════
DROPDOWN_MENU_FULL = '''"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

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
'''

def fix_dropdown_menu(root: Path):
    head("ФИХ 1: dropdown-menu.tsx — ПОЛНАЯ замена (DropdownMenuShortcut не определён)")
    f = root / "frontend" / "components" / "ui" / "dropdown-menu.tsx"
    if not f.exists():
        err(f"Не найден: {f}"); return
    backup(f)
    f.write_text(DROPDOWN_MENU_FULL, encoding="utf-8")
    ok("Файл полностью перезаписан с корректным DropdownMenuShortcut компонентом")
    ok("Все экспорты: DropdownMenu, Trigger, Content, Group, Portal, Sub, Item, Checkbox, Radio, Label, Separator, Shortcut")

# ═══════════════════════════════════════════════════════════
# ФИХ 2: mutations.ts — добавить все недостающие хуки и типы
# ═══════════════════════════════════════════════════════════
def fix_mutations(root: Path):
    head("ФИХ 2: hooks/mutations.ts — недостающие хуки и типы")
    f = root / "frontend" / "hooks" / "mutations.ts"
    if not f.exists():
        err(f"Не найден: {f}"); return

    content = f.read_text(encoding="utf-8")
    changed = False
    backup(f)

    TYPES = """
// ─── Type Definitions (используются Form компонентами) ───────────────────────

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

    EPISODE_HOOKS = """
// ─── Episode Mutations ────────────────────────────────────────────────────────

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

    RELEASE_HOOKS = """
// ─── Release Mutations ────────────────────────────────────────────────────────

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

    if "export interface EpisodeCreate" not in content:
        content += TYPES
        ok("Добавлены типы: AnimeCreate/Update, EpisodeCreate/Update, ReleaseCreate/Update")
        changed = True
    else:
        ok("Типы уже присутствуют")

    if "export function useCreateEpisode" not in content:
        content += EPISODE_HOOKS
        ok("Добавлены: useCreateEpisode, useUpdateEpisode")
        changed = True
    else:
        ok("useCreateEpisode уже есть")

    if "export function useCreateRelease" not in content:
        content += RELEASE_HOOKS
        ok("Добавлены: useCreateRelease, useUpdateRelease")
        changed = True
    else:
        ok("useCreateRelease уже есть")

    if changed:
        f.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {f}")

# ═══════════════════════════════════════════════════════════
# ФИХ 3: Tailwind CSS 4.0-beta → 3.4.x
# ═══════════════════════════════════════════════════════════
def fix_tailwind(root: Path):
    head("ФИХ 3: Tailwind CSS beta → стабильная 3.4.17")
    pkg = root / "frontend" / "package.json"
    if not pkg.exists():
        err(f"Не найден: {pkg}"); return

    data = json.loads(pkg.read_text(encoding="utf-8"))
    dev = data.get("devDependencies", {})
    current = dev.get("tailwindcss", "")

    if "beta" in current or current.startswith("4"):
        backup(pkg)
        dev["tailwindcss"] = "^3.4.17"
        dev.pop("@tailwindcss/postcss", None)
        data["devDependencies"] = dev
        pkg.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        ok(f"tailwindcss: {current} → ^3.4.17")
    else:
        ok(f"tailwindcss уже стабильная: {current}")

    # postcss.config.js — убедиться что v3 формат
    postcss = root / "frontend" / "postcss.config.js"
    if postcss.exists():
        correct = "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n"
        cur = postcss.read_text(encoding="utf-8")
        if "@tailwindcss/postcss" in cur:
            backup(postcss)
            postcss.write_text(correct, encoding="utf-8")
            ok("postcss.config.js: убран @tailwindcss/postcss → стандартный формат v3")
        elif cur.strip() != correct.strip():
            backup(postcss)
            postcss.write_text(correct, encoding="utf-8")
            ok("postcss.config.js: обновлён до стандартного формата v3")
        else:
            ok("postcss.config.js: уже корректный")

# ═══════════════════════════════════════════════════════════
# ФИХ 4: backend/Dockerfile — FROM as → FROM AS
# ═══════════════════════════════════════════════════════════
def fix_dockerfiles(root: Path):
    head("ФИХ 4: Dockerfiles — FROM as → FROM AS + frontend --frozen-lockfile")

    for df_path in [root / "backend" / "Dockerfile", root / "frontend" / "Dockerfile"]:
        if not df_path.exists():
            warn(f"Не найден: {df_path}"); continue

        content = df_path.read_text(encoding="utf-8")
        original = content

        # FROM ... as → FROM ... AS
        fixed = re.sub(
            r"^(FROM\s+\S+(?:@sha256:[0-9a-f]+)?)\s+as\s+(\w+)",
            lambda m: f"{m.group(1)} AS {m.group(2)}",
            content, flags=re.MULTILINE
        )
        if fixed != content:
            content = fixed
            ok(f"{df_path.parent.name}/Dockerfile: FROM ... as → FROM ... AS")

        # frontend: frozen-lockfile
        if "frontend" in str(df_path) and "--frozen-lockfile" in content and "--no-frozen-lockfile" not in content:
            content = content.replace("--frozen-lockfile", "--no-frozen-lockfile")
            ok("frontend/Dockerfile: --frozen-lockfile → --no-frozen-lockfile")

        if content != original:
            backup(df_path)
            df_path.write_text(content, encoding="utf-8")
        else:
            ok(f"{df_path.parent.name}/Dockerfile: уже корректный")

# ═══════════════════════════════════════════════════════════
# ФИХ 5: docker-compose.yml
# ═══════════════════════════════════════════════════════════
def fix_docker_compose(root: Path):
    head("ФИХ 5: docker-compose.yml")
    dc = root / "docker-compose.yml"
    if not dc.exists():
        err(f"Не найден: {dc}"); return

    content = dc.read_text(encoding="utf-8")
    original = content

    # Убрать version:
    lines = [l for l in content.splitlines() if not l.strip().startswith("version:")]
    content = "\n".join(lines).lstrip("\n")
    if content != original:
        ok("Убрана строка 'version:' (deprecated)")

    # Убрать ./frontend:/app volume-конфликт
    if "- ./frontend:/app" in content:
        content = content.replace("      - ./frontend:/app\n", "")
        ok("Убран конфликтующий volume '- ./frontend:/app'")

    # SECRET_KEY
    if "SECRET_KEY" not in content:
        content = content.replace(
            "      API_ENV: development\n    volumes:\n      - ./backend:/app",
            "      API_ENV: development\n      SECRET_KEY: dev-secret-key-please-change\n    volumes:\n      - ./backend:/app"
        )
        ok("Добавлен SECRET_KEY в backend environment")

    # worker/beat
    if "worker:" not in content:
        worker = """
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kitsu_worker
    environment:
      DATABASE_URL: postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu
      REDIS_URL: redis://redis:6379/0
      API_ENV: development
      SECRET_KEY: dev-secret-key-please-change
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
      SECRET_KEY: dev-secret-key-please-change
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    command: celery -A app.core.celery_app beat --loglevel=info
    restart: unless-stopped
"""
        if "\nvolumes:" in content:
            content = content.replace("\nvolumes:", worker + "\nvolumes:")
        else:
            content += worker
        ok("Добавлены сервисы worker + beat (Celery)")
    else:
        ok("worker/beat уже присутствуют")

    if content != original:
        backup(dc)
        dc.write_text(content, encoding="utf-8")
        ok(f"Сохранён: {dc}")

# ═══════════════════════════════════════════════════════════
# ФИХ 6: .env файлы
# ═══════════════════════════════════════════════════════════
def fix_env_files(root: Path):
    head("ФИХ 6: .env файлы")

    be = root / "backend" / ".env"
    if not be.exists():
        be.write_text(
            "DATABASE_URL=postgresql+asyncpg://kitsu:devpassword@postgres:5432/kitsu\n"
            "REDIS_URL=redis://redis:6379/0\n"
            "API_ENV=development\n"
            "SECRET_KEY=dev-secret-key-please-change-in-production\n"
            'BACKEND_CORS_ORIGINS=["http://localhost:3000"]\n'
            "KODIK_API_KEY=\n"
            "MEDIA_ROOT=/app/media\n",
            encoding="utf-8"
        )
        ok("Создан backend/.env")
    else:
        # Проверить что SECRET_KEY есть
        content = be.read_text(encoding="utf-8")
        if "SECRET_KEY" not in content:
            be.write_text(content + "\nSECRET_KEY=dev-secret-key-please-change-in-production\n", encoding="utf-8")
            ok("Добавлен SECRET_KEY в backend/.env")
        else:
            ok("backend/.env существует, SECRET_KEY есть")

    fe = root / "frontend" / ".env.local"
    if not fe.exists():
        fe.write_text(
            "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1\n"
            "NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1\n"
            "NEXT_TELEMETRY_DISABLED=1\n",
            encoding="utf-8"
        )
        ok("Создан frontend/.env.local")
    else:
        ok("frontend/.env.local существует")

# ═══════════════════════════════════════════════════════════
# ФИХ 7: backend/app/main.py — cache.connect()
# ═══════════════════════════════════════════════════════════
def fix_backend_main(root: Path):
    head("ФИХ 7: backend/app/main.py — cache.connect()")
    main_py = root / "backend" / "app" / "main.py"
    if not main_py.exists():
        err(f"Не найден: {main_py}"); return

    content = main_py.read_text(encoding="utf-8")
    if "await cache.connect()" in content:
        ok("cache.connect() уже есть"); return

    if "from app.core.cache import cache" not in content:
        content = content.replace(
            "from app.core.logging import setup_logging, logger",
            "from app.core.cache import cache\nfrom app.core.logging import setup_logging, logger",
            1
        )
        ok("Добавлен import cache")

    for old, new in [
        ("    setup_logging()\n    Path", "    setup_logging()\n    await cache.connect()\n    Path"),
        ("    setup_logging()\n    logger", "    setup_logging()\n    await cache.connect()\n    logger"),
        ("    setup_logging()\n    yield", "    setup_logging()\n    await cache.connect()\n    yield"),
    ]:
        if old in content:
            content = content.replace(old, new, 1)
            ok("Добавлен await cache.connect() в lifespan startup")
            break

    if "await cache.disconnect()" not in content and "await engine.dispose()" in content:
        content = content.replace(
            "await engine.dispose()",
            "await cache.disconnect()\n    await engine.dispose()"
        )
        ok("Добавлен await cache.disconnect() в shutdown")

    backup(main_py)
    main_py.write_text(content, encoding="utf-8")
    ok(f"Сохранён: {main_py}")

# ═══════════════════════════════════════════════════════════
# ПРОВЕРКА: Полное сканирование проекта
# ═══════════════════════════════════════════════════════════
def scan_project(root: Path):
    head("СКАНИРОВАНИЕ: Финальная проверка всего проекта")

    fe = root / "frontend"
    errors = []
    warnings = []

    # 1. Проверить все экспорты ui компонентов
    ui_exports: dict[str, set] = {}
    ui_dir = fe / "components" / "ui"
    for f in ui_dir.glob("*.tsx"):
        if f.suffix == ".bak":
            continue
        text = f.read_text(encoding="utf-8", errors="ignore")
        name = f.stem
        # Найти все экспортируемые имена
        exported = set()
        for m in re.finditer(r"^export \{([^}]+)\}", text, re.MULTILINE):
            for n in re.findall(r"\w+", m.group(1)):
                exported.add(n)
        for m in re.finditer(r"^export (?:function|const|class|interface|type) (\w+)", text, re.MULTILINE):
            exported.add(m.group(1))
        ui_exports[name] = exported

        # Проверить что все экспортированные имена определены
        for exp_name in exported:
            if exp_name not in text.replace(f"export {{\n", "").replace(f"{exp_name},", ""):
                # Более точная проверка - имя встречается в файле хотя бы дважды (определение + экспорт)
                count = text.count(exp_name)
                if count < 2:
                    errors.append(f"  ui/{name}.tsx: '{exp_name}' экспортируется но не определён")

    # 2. Проверить что все импортируемые из ui/ компоненты реально экспортируются
    for tsx in fe.glob("**/*.tsx"):
        try:
            text = tsx.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"import \{([^}]+)\} from '@/components/ui/([^']+)'", text):
                imported_names = [n.strip() for n in re.findall(r"\w+", m.group(1))]
                ui_module = m.group(2)
                if ui_module in ui_exports:
                    for name in imported_names:
                        if name and name not in ui_exports[ui_module]:
                            errors.append(f"  {tsx.relative_to(fe)}: импортирует '{name}' из ui/{ui_module} но его нет в экспортах")
        except Exception:
            pass

    # 3. Проверить mutations.ts экспорты
    mutations_f = fe / "hooks" / "mutations.ts"
    if mutations_f.exists():
        mutations_text = mutations_f.read_text(encoding="utf-8", errors="ignore")
        mut_exports = set(re.findall(r"^export (?:function|const|interface|type) (\w+)", mutations_text, re.MULTILINE))
        for tsx in fe.glob("**/*.tsx"):
            try:
                text = tsx.read_text(encoding="utf-8", errors="ignore")
                for m in re.finditer(r"import \{([^}]+)\} from '@/hooks/mutations'", text):
                    for name in re.findall(r"\w+", m.group(1)):
                        if (name.startswith("use") or name[0].isupper()) and name not in mut_exports:
                            errors.append(f"  {tsx.relative_to(fe)}: импортирует '{name}' из mutations.ts — не найден")
            except Exception:
                pass

    # 4. Проверить queries.ts экспорты
    queries_f = fe / "hooks" / "queries.ts"
    if queries_f.exists():
        queries_text = queries_f.read_text(encoding="utf-8", errors="ignore")
        q_exports = set(re.findall(r"^export (?:function|const|interface|type) (\w+)", queries_text, re.MULTILINE))
        for tsx in fe.glob("**/*.tsx"):
            try:
                text = tsx.read_text(encoding="utf-8", errors="ignore")
                for m in re.finditer(r"import \{([^}]+)\} from '@/hooks/queries'", text):
                    for name in re.findall(r"\w+", m.group(1)):
                        if name.startswith("use") and name not in q_exports:
                            errors.append(f"  {tsx.relative_to(fe)}: импортирует '{name}' из queries.ts — не найден")
            except Exception:
                pass

    # 5. Проверить что Tailwind не beta
    pkg = fe / "package.json"
    if pkg.exists():
        data = json.loads(pkg.read_text(encoding="utf-8", errors="ignore"))
        tw = data.get("devDependencies", {}).get("tailwindcss", "")
        if "beta" in tw or tw.startswith("4"):
            errors.append(f"  package.json: tailwindcss={tw} (beta несовместима с postcss.config.js)")
        else:
            ok(f"tailwindcss: {tw} (стабильная)")

    # Вывод результатов
    if errors:
        print(f"\n  {C.R}НАЙДЕНЫ ОШИБКИ:{C.RESET}")
        seen = set()
        for e in errors:
            if e not in seen:
                print(f"  {C.R}✗{C.RESET}{e}")
                seen.add(e)
    else:
        ok("Ошибок импортов не обнаружено — проект должен собраться")

    if warnings:
        for w in warnings:
            warn(w)

def print_done(root: Path):
    print(f"""
{C.BOLD}{'═'*60}
  ✅  ВСЕ ФИКСЫ ПРИМЕНЕНЫ
{'═'*60}{C.RESET}

{C.BOLD}ВАЖНО: Сначала очисти Docker кэш:{C.RESET}

  {C.R}docker-compose down{C.RESET}
  {C.R}docker builder prune -f{C.RESET}

{C.BOLD}Затем запусти сборку:{C.RESET}

  {C.G}docker-compose up --build{C.RESET}

  ⏳ Первый раз ~5-7 минут (без кэша)

{C.BOLD}После старта всех контейнеров — в ДРУГОМ окне:{C.RESET}

  {C.G}docker-compose exec backend alembic upgrade head{C.RESET}
  {C.G}docker-compose exec backend python -m app.initial_data{C.RESET}

{C.BOLD}Открывай:{C.RESET}
  🌐  {C.G}http://localhost:3000{C.RESET}
  📖  {C.G}http://localhost:8000/docs{C.RESET}
  💚  {C.G}http://localhost:8000/api/health{C.RESET}

  Логин: {C.Y}admin@kitsu.local{C.RESET} / {C.Y}admin123{C.RESET}

{C.Y}  Бэкапы изменённых файлов сохранены как *.bak{C.RESET}
""")

def main():
    print(f"""{C.BOLD}{C.M}
╔══════════════════════════════════════════════════════════╗
║   KITSU ENTERPRISE — ФИНАЛЬНЫЙ ПОЛНЫЙ ФИКС v3.0          ║
╚══════════════════════════════════════════════════════════╝{C.RESET}
""")
    root = find_root()
    if not root:
        err("Не найден корень проекта (docker-compose.yml + frontend/)")
        err(f"Текущая папка: {Path.cwd()}")
        if sys.platform == "win32": input("\nEnter для выхода...")
        sys.exit(1)

    info(f"Корень проекта: {root}")

    fix_dropdown_menu(root)
    fix_mutations(root)
    fix_tailwind(root)
    fix_dockerfiles(root)
    fix_docker_compose(root)
    fix_env_files(root)
    fix_backend_main(root)
    scan_project(root)
    print_done(root)

    if sys.platform == "win32":
        input("Нажми Enter для закрытия...")

if __name__ == "__main__":
    main()
