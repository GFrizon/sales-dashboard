@echo off
echo =========================================
echo  Dashboard de Vendas - Iniciando...
echo =========================================

echo.
echo [0/3] Encerrando processos antigos...
for /f "tokens=2 delims==; " %%p in ('wmic process where "name='node.exe' and commandline like '%%sales-dashboard%%'" get processid /value ^| find "ProcessId"') do (
  taskkill /PID %%p /F >nul 2>nul
)

echo [1/3] Limpando cache do frontend...
if exist frontend\.next rmdir /s /q frontend\.next

echo [2/3] Iniciando Backend (API)...
start "Backend - API" cmd /k "cd /d backend && npm run dev"

timeout /t 2 /nobreak > nul

echo [3/3] Iniciando Frontend...
start "Frontend - Dashboard" cmd /k "cd /d frontend && npm run dev"

echo.
echo =========================================
echo  Aguarde alguns segundos e acesse:
echo  http://localhost:3000
echo =========================================
