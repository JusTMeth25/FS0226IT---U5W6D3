@echo off
setlocal
title Nova - Avvio
cd /d "%~dp0"

echo Avvio Nova: backend e frontend in due finestre separate.
echo Per fermarli chiudi le finestre o premi Ctrl+C al loro interno.
echo.
start "Nova - Backend" cmd /k call "%~dp0start-be.cmd"
start "Nova - Frontend" cmd /k call "%~dp0start-fe.cmd"

echo Attendo che backend e frontend siano pronti (massimo 3 minuti)...
set /a TRIES=0

:wait
set /a TRIES+=1
curl.exe -s -o nul http://127.0.0.1:8080/api/info
if errorlevel 1 goto retry
curl.exe -s -o nul http://localhost:5173/
if errorlevel 1 goto retry
goto ready

:retry
if %TRIES% geq 90 goto timeout
ping -n 3 127.0.0.1 >nul
goto wait

:ready
echo Tutto pronto: apro http://localhost:5173
start "" http://localhost:5173
goto end

:timeout
echo Nessuna risposta dopo 3 minuti: controlla le finestre "Nova - Backend" e "Nova - Frontend".
pause

:end
endlocal
