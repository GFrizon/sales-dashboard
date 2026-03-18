@echo off
echo [reset] encerrando processos node do sales-dashboard...
for /f "tokens=2 delims==; " %%p in ('wmic process where "name='node.exe' and commandline like '%%sales-dashboard%%'" get processid /value ^| find "ProcessId"') do taskkill /PID %%p /F >nul 2>nul

echo [reset] subindo backend e frontend...
start "Backend - API" cmd /k "cd /d backend && npm run dev"
timeout /t 2 /nobreak > nul

if not exist frontend\.next\BUILD_ID (
  cd /d frontend
  npm run build
  cd /d ..
)

start "Frontend - Dashboard" cmd /k "cd /d frontend && npm run start"

echo [ok] aguarde 5s e abra http://localhost:3000
