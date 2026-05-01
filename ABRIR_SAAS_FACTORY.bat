@echo off
title SaaS Factory
echo.
echo  ============================================
echo    SaaS Factory - Empresa Virtual de Dev
echo  ============================================
echo.
echo  Iniciando servidor...
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
    echo  [!] Instalando dependencias...
    npm install
    echo.
)

:: Start both frontend and backend
echo  [*] Iniciando SaaS Factory...
echo  [*] Frontend: http://localhost:5173
echo  [*] Backend:  http://localhost:3001
echo.
echo  Aguarde o navegador abrir automaticamente...
echo  Para fechar, pressione Ctrl+C nesta janela.
echo.

start "" http://localhost:5173

npm run dev
