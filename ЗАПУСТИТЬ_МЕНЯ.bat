@echo off
chcp 65001 >nul
title KITSU ENTERPRISE — Auto Setup

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║       KITSU ENTERPRISE — AUTO-SETUP ^& FIX SCRIPT        ║
╚══════════════════════════════════════════════════════════╝

echo.
echo Проверяем наличие Python...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ОШИБКА] Python не установлен или не найден в PATH.
    echo  Скачай Python 3.10+ с https://www.python.org/downloads/
    echo  При установке отметь галочку "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo  OK — Python найден.
echo.
echo Запускаем setup_and_fix.py...
echo.

python "%~dp0setup_and_fix.py"

if %errorlevel% neq 0 (
    echo.
    echo  [ОШИБКА] Скрипт завершился с ошибкой.
    pause
    exit /b 1
)
