# GitHub Actions Workflows 說明

本專案使用模組化的 GitHub Actions workflows 來處理持續整合、PR 建置和自動發布。

## Workflow 架構

### 可重用工作流程 (Reusable Workflows)

#### 1. build-job.yml
負責建構專案的可重用工作流程。

**功能：**
- 簽出程式碼
- 設定 Node.js 環境
- 安裝相依套件
- 建構專案 (`npm run esbuild`)
- 上傳建構產物為 artifact

**輸出：**
- `version`: 專案版本號

**使用範例：**
```yaml
jobs:
  build:
    uses: ./.github/workflows/build-job.yml
```

#### 2. package-job.yml
負責打包 VSIX 檔案的可重用工作流程。

**輸入參數：**
- `version`: 專案版本號（必填）
- `upload-artifact`: 是否上傳 VSIX 為 artifact（選填，預設 false）
- `artifact-name`: Artifact 名稱（選填）

**功能：**
- 下載建構產物
- 打包成 VSIX 檔案
- 選擇性上傳 VSIX 為 artifact

**使用範例：**
```yaml
jobs:
  package:
    uses: ./.github/workflows/package-job.yml
    with:
      version: ${{ needs.build.outputs.version }}
      upload-artifact: true
      artifact-name: my-extension
```

### 主要工作流程 (Main Workflows)

#### 1. ci.yml - 持續整合
**觸發條件：**
- Push 到 `main` 分支
- Pull Request 到 `main` 分支

**工作流程：**
```
build (建構測試)
  ↓
package (打包測試)
  ↓ (僅限 PR)
pr-comment (PR 留言)
```

**功能說明：**
1. **build**: 使用 `build-job.yml` 建構專案
2. **package**: 使用 `package-job.yml` 打包 VSIX
   - 對 PR：上傳 artifact（名稱格式：`pangu2-{version}-pr{number}`）
   - 對 main push：僅測試打包（不上傳）
3. **pr-comment** (僅限 PR)：
   - 下載 VSIX artifact
   - 在 PR 留言，提供下載連結和安裝說明
   - 顯示檔案大小和版本資訊

#### 2. release.yml - 自動發布
**觸發條件：**
- Push 到 `main` 分支 **且** `package.json` 檔案有變更
- 手動觸發 (`workflow_dispatch`)

**工作流程：**
```
check-version (檢查版本變更)
  ↓
build (建構專案)
  ↓
package (打包發布版本)
  ↓
release (發布到 GitHub 和 Marketplace)
```

**功能說明：**
1. **check-version**:
   - 讀取 `package.json` 版本號
   - 檢查 Git tag 是否已存在
   - 檢查版本號是否真的有變更（比對上一個 commit）
   - 決定是否應該發布

2. **build**: 使用 `build-job.yml` 建構專案

3. **package**: 使用 `package-job.yml` 打包 VSIX
   - 上傳 artifact（名稱格式：`pangu2-{version}-release`）

4. **release**:
   - 建立 Git tag（格式：`v{version}`）
   - 建立 GitHub Release
   - 上傳 VSIX 到 Release
   - 發布到 VS Code Marketplace

**發布條件：**
- ✅ `package.json` 有變更
- ✅ 版本號有變更
- ✅ 該版本的 tag 不存在
- ✅ 所有前置工作成功

## 設計理念

### 為什麼這樣設計？

1. **模組化**: 
   - `build-job.yml` 和 `package-job.yml` 是可重用的工作流程
   - 避免重複的程式碼
   - 更容易維護和測試

2. **明確的職責分離**:
   - CI 負責測試和 PR 建置
   - Release 負責正式發布
   - 兩者不會同時執行

3. **安全性**:
   - Release 只在 `package.json` 變更時觸發
   - 自動檢查版本號是否真的有變更
   - 防止重複發布同一版本

4. **效率**:
   - PR 建置成功後才會留言
   - Main branch 的 push 只做測試打包
   - Release 只在必要時執行

## 常見問題

### Q: PR 什麼時候會收到建置成功的留言？
A: 當 PR 的 CI 成功完成（建構 + 打包）後，會自動在 PR 下方留言，提供 VSIX 下載連結。

### Q: 什麼情況下會觸發自動發布？
A: 必須同時滿足以下條件：
1. PR 合併到 `main` 分支
2. `package.json` 檔案有變更
3. 版本號有增加
4. 該版本的 tag 不存在

### Q: 如何手動觸發發布？
A: 在 GitHub Actions 頁面，選擇 "自動發布 VS Code 擴充套件" workflow，點擊 "Run workflow" 按鈕。

### Q: 為什麼要刪除 pr-build.yml？
A: 原本的 `pr-build.yml` 和 `ci.yml` 功能重複。現在統一合併到 `ci.yml`，根據觸發事件（PR 或 push）執行不同的步驟。

## 維護指南

### 修改建構流程
編輯 `.github/workflows/build-job.yml`

### 修改打包流程
編輯 `.github/workflows/package-job.yml`

### 修改 PR 留言內容
編輯 `.github/workflows/ci.yml` 中的 `pr-comment` job

### 修改發布流程
編輯 `.github/workflows/release.yml`

### 測試 Workflows
1. 建立測試 PR 來測試 CI 流程
2. 修改 `package.json` 版本號並合併到 main 來測試發布流程
3. 使用 `workflow_dispatch` 手動觸發來測試發布流程
