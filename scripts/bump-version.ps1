#!/usr/bin/env pwsh
<#
.SYNOPSIS
    自動更新 VS Code 擴充功能的版本號

.DESCRIPTION
    此腳本會自動更新 package.json 中的版本號，支援 major、minor、patch 三種版本更新方式。
    更新後會自動執行 npm install 來同步 package-lock.json。

.PARAMETER Type
    版本更新類型：major (x.0.0)、minor (0.x.0)、patch (0.0.x)
    預設為 patch

.PARAMETER DryRun
    只顯示將要執行的操作，不實際修改檔案

.EXAMPLE
    .\bump-version.ps1
    更新 patch 版本 (例如: 1.4.0 -> 1.4.1)

.EXAMPLE
    .\bump-version.ps1 -Type minor
    更新 minor 版本 (例如: 1.4.0 -> 1.5.0)

.EXAMPLE
    .\bump-version.ps1 -Type major
    更新 major 版本 (例如: 1.4.0 -> 2.0.0)

.EXAMPLE
    .\bump-version.ps1 -Type patch -DryRun
    預覽更新 patch 版本的結果
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Type = 'patch',

    [Parameter()]
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# 取得專案根目錄
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$packageJsonPath = Join-Path $projectRoot 'package.json'

# 檢查 package.json 是否存在
if (-not (Test-Path $packageJsonPath)) {
    Write-Error "找不到 package.json 檔案: $packageJsonPath"
    exit 1
}

# 讀取 package.json
Write-Host "正在讀取 package.json..." -ForegroundColor Cyan
$packageJson = Get-Content $packageJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$currentVersion = $packageJson.version

# 驗證版本格式
if ($currentVersion -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "無效的版本號格式: $currentVersion (預期格式: x.y.z)"
    exit 1
}

# 解析版本號
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# 根據類型更新版本號
switch ($Type) {
    'major' {
        $major++
        $minor = 0
        $patch = 0
    }
    'minor' {
        $minor++
        $patch = 0
    }
    'patch' {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"

# 顯示版本變更資訊
Write-Host "`n版本更新資訊:" -ForegroundColor Yellow
Write-Host "  類型:    $Type" -ForegroundColor White
Write-Host "  目前版本: $currentVersion" -ForegroundColor White
Write-Host "  新版本:   $newVersion" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n[DryRun] 這是預覽模式，不會實際修改檔案" -ForegroundColor Magenta
    exit 0
}

# 確認是否要繼續
Write-Host ""
$confirmation = Read-Host "是否要繼續更新版本? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "已取消版本更新" -ForegroundColor Yellow
    exit 0
}

# 更新 package.json
Write-Host "`n正在更新 package.json..." -ForegroundColor Cyan
$packageJson.version = $newVersion

# 將物件轉回 JSON (保持格式)
$jsonContent = $packageJson | ConvertTo-Json -Depth 100
# 確保使用 2 空格縮排 (符合專案風格)
$jsonContent = $jsonContent -replace '(?m)^  ', '  '

# 寫入檔案 (使用 UTF-8 無 BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($packageJsonPath, $jsonContent + "`n", $utf8NoBom)

Write-Host "✓ package.json 已更新" -ForegroundColor Green

# 同步 package-lock.json
Write-Host "`n正在同步 package-lock.json..." -ForegroundColor Cyan
Push-Location $projectRoot
try {
    $npmOutput = npm install 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ package-lock.json 已同步" -ForegroundColor Green
    } else {
        Write-Warning "npm install 執行時出現警告，但版本已更新"
        Write-Host $npmOutput
    }
} finally {
    Pop-Location
}

# 顯示後續步驟提示
Write-Host "`n後續步驟:" -ForegroundColor Yellow
Write-Host "  1. 更新 CHANGELOG.md 記錄變更內容" -ForegroundColor White
Write-Host "  2. 提交變更: git add . && git commit -m 'chore: bump version to $newVersion'" -ForegroundColor White
Write-Host "  3. 建立標籤: git tag v$newVersion" -ForegroundColor White
Write-Host "  4. 推送變更: git push && git push --tags" -ForegroundColor White
Write-Host ""
Write-Host "✓ 版本更新完成!" -ForegroundColor Green
