@echo off
chcp 65001 >nul
title SaaS Factory - Enviar para GitHub
color 0A

echo.
echo  ==========================================
echo    SaaS Factory - Enviar para GitHub
echo    Salvando alteracoes no repositorio
echo  ==========================================
echo.

cd /d "%~dp0"

:: Verifica se Git está instalado
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Git nao encontrado!
    echo  Instale em: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

:: Verifica se tem remote
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo  [AVISO] Nenhum repositorio remoto configurado.
    echo.
    set /p REPO_URL="  Cole a URL do repositorio GitHub: "
    git remote add origin %REPO_URL%
    echo  [OK] Repositorio remoto adicionado!
    echo.
)

:: Adiciona todas as alterações
echo  [1/3] Adicionando alteracoes...
git add -A

:: Pede mensagem de commit
echo.
set /p MSG="  Descreva o que mudou (ou Enter para padrão): "
if "%MSG%"=="" set MSG=Atualização do SaaS Factory

:: Faz commit
echo  [2/3] Salvando commit...
git commit -m "%MSG%"

:: Envia para GitHub
echo  [3/3] Enviando para GitHub...
git push -u origin main 2>nul || git push -u origin master 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [AVISO] Primeiro push? Criando branch main...
    git branch -M main
    git push -u origin main
)

echo.
echo  ==========================================
echo    [OK] Enviado para GitHub com sucesso!
echo  ==========================================
echo.
pause
