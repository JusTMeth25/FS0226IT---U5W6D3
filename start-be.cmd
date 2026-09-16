@echo off
setlocal
title Nova - Backend
cd /d "%~dp0BE"

rem The OpenRouter key lives in the Windows user environment. A console opened
rem before the variable was created does not see it, so read it from the registry.
rem The key is never printed.
if not defined OPENROUTER_API_KEY (
  for /f "tokens=2,*" %%A in ('reg query HKCU\Environment /v OPENROUTER_API_KEY 2^>nul ^| find "REG_"') do set "OPENROUTER_API_KEY=%%B"
)
if not defined OPENROUTER_API_KEY (
  echo [ATTENZIONE] OPENROUTER_API_KEY non impostata: il backend parte, ma Nova non potra' rispondere.
)
if not exist env.properties (
  echo [ATTENZIONE] BE\env.properties mancante: copia env.properties.example e inserisci la password del DB.
)

echo Avvio backend su http://127.0.0.1:8080 ...
call "%~dp0BE\mvnw.cmd" spring-boot:run
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Backend terminato con codice %EXIT_CODE%. Controlla i messaggi sopra: porta 8080 occupata o PostgreSQL spento?
  pause
)
endlocal
