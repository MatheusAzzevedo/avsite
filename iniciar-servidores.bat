@echo off
REM ============================================
REM Iniciar Servidores - Avoar Site
REM ============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║   🚀 Iniciando Servidores Avoar Site       ║
echo ╚════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    echo [INFO] Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se porta 3000 está livre
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] Porta 3000 já está em uso!
    echo [INFO] Parando processo anterior...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM Verificar se porta 3001 está livre
netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] Porta 3001 já está em uso!
    echo [INFO] Parando processo anterior...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [INFO] Iniciando Next.js na porta 3001...
start "Next.js - Porta 3001" cmd /k "cd sistema && npm run dev -- -p 3001"

timeout /t 3 /nobreak >nul

echo [INFO] Iniciando servidor estático na porta 3000...
start "Servidor Estático - Porta 3000" cmd /k "node servidor-estatico.js"

timeout /t 2 /nobreak >nul

echo.
echo ════════════════════════════════════════════
echo ✅ Servidores Iniciados!
echo ════════════════════════════════════════════
echo.
echo 📄 Site Estático: http://localhost:3000
echo 🔐 Sistema Admin: http://localhost:3000/admin/login
echo.
echo ⏹️  Para parar: Feche as janelas do terminal
echo    ou pressione Ctrl+C em cada uma
echo.
pause

