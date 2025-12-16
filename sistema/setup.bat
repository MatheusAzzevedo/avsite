@echo off
REM ============================================
REM Setup Automático - Avoar Sistema
REM Para Windows (CMD/PowerShell)
REM ============================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║   🚀 Setup Avoar Sistema - Windows        ║
echo ║      Configuração Automática de Deps      ║
echo ╚════════════════════════════════════════════╝
echo.

REM Cores (simuladas)
echo [INFO] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    echo [INFO] Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
node --version
echo.

echo [INFO] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] npm não encontrado!
    pause
    exit /b 1
)
echo [OK] npm encontrado
npm --version
echo.

echo [INFO] Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] PostgreSQL não encontrado no PATH
    echo [INFO] Instale em: https://www.postgresql.org/download/windows/
    echo [INFO] E adicione ao PATH durante a instalação
    pause
) else (
    echo [OK] PostgreSQL encontrado
    psql --version
)
echo.

echo ════════════════════════════════════════════
echo Instalando Dependências NPM...
echo ════════════════════════════════════════════
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao instalar dependências!
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════
echo ✅ Setup Concluído!
echo ════════════════════════════════════════════
echo.
echo 📋 Próximas Etapas:
echo.
echo 1. Criar arquivo .env.local com:
echo    - Credenciais PostgreSQL
echo    - JWT_SECRET
echo.
echo    Copie de .env.example ou use:
echo    DB_USER=postgres
echo    DB_PASSWORD=postgres
echo    DB_HOST=localhost
echo    DB_PORT=5432
echo    DB_NAME=avoar_db
echo    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avoar_db
echo    JWT_SECRET=seu-secret-aqui
echo.
echo 2. Criar banco de dados:
echo    psql -U postgres -c "CREATE DATABASE avoar_db;"
echo.
echo 3. Executar schema SQL:
echo    psql -U postgres -d avoar_db -f lib\db\schema.sql
echo.
echo 4. Testar conexão:
echo    npx ts-node lib\db\test-connection.ts
echo.
echo 5. Rodar em desenvolvimento:
echo    npm run dev
echo.
echo 6. Acessar: http://localhost:3000
echo.
echo ════════════════════════════════════════════
echo.

pause

