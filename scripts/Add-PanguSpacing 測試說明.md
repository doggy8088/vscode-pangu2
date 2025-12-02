# Add-PanguSpacing 測試說明

本文件說明如何執行 `Add-PanguSpacing.ps1` 的單元測試。

## 環境需求

- **PowerShell 7+** (pwsh) - 必須使用 `pwsh` 執行，不支援 Windows PowerShell 5.1
- **Pester 5.x** 測試框架

## 安裝 Pester

如果尚未安裝 Pester，請在 **PowerShell 7** 中執行以下命令：

```powershell
# 確認使用 PowerShell 7+
$PSVersionTable.PSVersion

# 安裝最新版 Pester
Install-Module -Name Pester -Force -SkipPublisherCheck -Scope CurrentUser

# 確認版本 (需要 5.x)
Get-Module -Name Pester -ListAvailable
```

## 執行測試

> ⚠️ **重要**：必須使用 PowerShell 7 (`pwsh`) 執行測試，不支援 Windows PowerShell 5.1。

### 基本執行

```powershell
# 切換到 scripts 目錄
cd c:\Projects\vscode-pangu2\scripts

# 執行所有測試
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1
```

### 如果你在 Windows PowerShell 5.1 環境中

```powershell
# 使用 pwsh 明確執行
pwsh -NoProfile -Command "Set-Location 'c:\Projects\vscode-pangu2\scripts'; Import-Module Pester -Force; Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1"
```

### 詳細輸出

```powershell
# 顯示每個測試的詳細結果
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -Output Detailed
```

### 只執行特定測試

```powershell
# 只執行包含特定名稱的測試
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -FullNameFilter '*URL*'

# 只執行基本功能測試
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -FullNameFilter '*基本功能*'

# 只執行括號處理測試
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -FullNameFilter '*括號*'
```

### 產生測試報告

```powershell
# 產生 NUnit XML 格式報告
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -OutputFile .\TestResults.xml -OutputFormat NUnitXml

# 產生 JUnit XML 格式報告 (適用於 CI/CD)
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -OutputFile .\TestResults.xml -OutputFormat JUnitXml
```

### 程式碼涵蓋率

```powershell
# 執行測試並計算程式碼涵蓋率
$config = New-PesterConfiguration
$config.Run.Path = '.\Add-PanguSpacing.Tests.ps1'
$config.CodeCoverage.Enabled = $true
$config.CodeCoverage.Path = '.\Add-PanguSpacing.ps1'
$config.Output.Verbosity = 'Detailed'

Invoke-Pester -Configuration $config
```

## 測試分類

測試檔案包含以下測試分類：

| 分類 | 說明 |
|------|------|
| 基本功能 | 前置檢查、CJK 與英數字間距 |
| 日文處理 | 平假名、片假名處理 |
| 特殊符號處理 | 運算符、井號、百分號、冒號、中間點、點點號 |
| 引號處理 | 雙引號、單引號、所有格 |
| 括號處理 | 各種括號、空括號保護 |
| URL 保護 | HTTP/HTTPS URL 不被破壞 |
| 斜線路徑處理 | 斜線修復 |
| 希臘字母 | 希臘字母間距處理 |
| Pipeline 支援 | Pipeline 輸入測試 |
| 檔案處理 | -InFile、-OutFile、-InPlaceEdit、編碼 |
| 錯誤處理 | 不存在的檔案等錯誤情況 |
| 邊界情況 | 換行符、Tab、LaTeX 公式、中文標點 |
| 真實世界案例 | 技術文章、版本號、程式碼片段等 |

## 快速驗證腳本

建立一個快速驗證用的腳本：

```powershell
# quick-test.ps1
$tests = @(
    @{ Input = '中文text'; Expected = '中文 text' }
    @{ Input = '測試123'; Expected = '測試 123' }
    @{ Input = '呼叫func()函數'; Expected = '呼叫 func() 函數' }
    @{ Input = '請參考https://example.com網站'; Expected = '請參考 https://example.com 網站' }
)

$scriptPath = Join-Path $PSScriptRoot 'Add-PanguSpacing.ps1'

foreach ($test in $tests) {
    $result = & $scriptPath -Text $test.Input
    $status = if ($result -eq $test.Expected) { '✓' } else { '✗' }
    Write-Host "$status Input: $($test.Input)"
    Write-Host "  Expected: $($test.Expected)"
    Write-Host "  Got:      $result"
    Write-Host ""
}
```

## 持續整合 (CI/CD)

### GitHub Actions 範例

```yaml
name: Test Add-PanguSpacing

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Pester
        shell: pwsh
        run: |
          Install-Module -Name Pester -Force -SkipPublisherCheck

      - name: Run Tests
        shell: pwsh
        run: |
          $config = New-PesterConfiguration
          $config.Run.Path = './scripts/Add-PanguSpacing.Tests.ps1'
          $config.Run.Exit = $true
          $config.TestResult.Enabled = $true
          $config.TestResult.OutputPath = './TestResults.xml'
          $config.TestResult.OutputFormat = 'JUnitXml'
          Invoke-Pester -Configuration $config

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: TestResults.xml
```

## 新增測試案例

若要新增測試案例，請在 `Add-PanguSpacing.Tests.ps1` 中適當的 `Describe` 區塊內加入新的 `It` 測試：

```powershell
Describe 'Add-PanguSpacing 新功能' {
    It '應該處理某種情況' {
        $result = & $ScriptPath -Text '輸入文字'
        $result | Should -Be '預期結果'
    }
}
```

## 常見問題

### Q: 測試執行太慢？

A: 可以只執行特定測試：

```powershell
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -FullNameFilter '*基本*'
```

### Q: 如何看到更多 Debug 資訊？

A: 使用 `-Output Diagnostic`：

```powershell
Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -Output Diagnostic
```

### Q: 如何只執行失敗的測試？

A: 先執行一次取得失敗的測試，再用 `-FullNameFilter` 過濾：

```powershell
$result = Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -PassThru
$failedTests = $result.Failed.Name
# 手動重新執行失敗的測試
```

## 測試預期結果

執行所有測試後，應該看到類似以下的輸出：

```text
Tests completed in X.XXs
Tests Passed: 49, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0
```

如果有任何失敗的測試，請檢查輸出中的錯誤訊息，並確認 `Add-PanguSpacing.ps1` 的邏輯是否正確。
