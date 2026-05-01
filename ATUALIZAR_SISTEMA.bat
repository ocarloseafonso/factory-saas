@echo off
chcp 65001 >nul
title SaaS Factory — Atualizar Sistema
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   SaaS Factory — Atualizar Sistema       ║
echo  ║   Baixando última versão do GitHub        ║
echo  ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Verifica se Git está instalado
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Git não encontrado!
    echo  Instale em: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

:: Verifica se é um repositório git
if not exist ".git" (
    echo  [ERRO] Este diretório não é um repositório Git.
    echo  Execute primeiro: git init
    echo.
    pause
    exit /b 1
)

:: Verifica se tem remote configurado
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  [AVISO] Nenhum repositório remoto configurado.
    echo.
    set /p REPO_URL="  Cole a URL do repositório GitHub: "
    git remote add origin %REPO_URL%
    echo  [OK] Repositório remoto adicionado!
    echo.
)

:: Salva alterações locais (se houver)
echo  [1/4] Verificando alterações locais...
git stash >nul 2>&1

:: Baixa atualizações
echo  [2/4] Baixando atualizações do GitHub...
git pull origin main 2>nul || git pull origin master 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [AVISO] Não foi possível baixar atualizações.
    echo  Verifique sua conexão ou o repositório remoto.
    echo.
    git stash pop >nul 2>&1
    pause
    exit /b 1
)

:: Restaura alterações locais
echo  [3/4] Restaurando configurações locais...
git stash pop >nul 2>&1

:: Instala dependências (caso package.json tenha mudado)
echo  [4/4] Verificando dependências...
call npm install --silent 2>nul

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   ✅ Sistema atualizado com sucesso!      ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Para iniciar o sistema, execute:
echo  ABRIR_SAAS_FACTORY.bat
echo.
pause
