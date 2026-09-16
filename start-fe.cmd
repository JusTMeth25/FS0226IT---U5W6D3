@echo off
setlocal
title Nova - Frontend
cd /d "%~dp0FE"

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRORE] npm non trovato: installa Node.js.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Prima esecuzione: installo le dipendenze...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo Avvio frontend su http://localhost:5173 ...
call npm run dev -- --port 5173 --strictPort
if errorlevel 1 (
  echo.
  echo Frontend terminato con errore: la porta 5173 e' gia' occupata?
  pause
)
endlocal
