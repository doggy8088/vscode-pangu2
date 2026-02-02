# Workflow 測試計畫

本文件說明如何測試新的 GitHub Actions workflows。

## 測試目標

驗證以下功能正常運作：
1. ✅ PR 觸發 CI 並產生 VSIX artifact 和留言
2. ✅ Main branch push 觸發 CI 測試
3. ✅ package.json 變更且版本號更新時觸發 release
4. ✅ 可重用 workflows 正常運作
5. ✅ Release workflow 不會重複發布

## 測試場景

### 場景 1: PR 建置測試

**目的：** 驗證 PR 會觸發 CI，建置成功後會在 PR 留言

**步驟：**
1. 建立一個新的測試分支
2. 對任意檔案做一些小修改（例如更新 README.md）
3. 建立 PR 到 main 分支
4. 觀察 GitHub Actions 是否執行

**預期結果：**
- ✅ `build` job 成功執行
- ✅ `package` job 成功執行並上傳 artifact
- ✅ `pr-comment` job 在 PR 下方留言
- ✅ Artifact 名稱格式：`pangu2-{version}-pr{number}`
- ✅ 可以從 Actions 頁面下載 VSIX 檔案

**驗證方式：**
```bash
# 檢查 workflow 是否執行
gh run list --workflow=ci.yml --limit 1

# 檢查 artifact 是否產生
gh run view --log
```

### 場景 2: Main Branch Push 測試

**目的：** 驗證 push 到 main 分支會觸發 CI 但不會上傳 artifact

**步驟：**
1. 合併場景 1 的 PR
2. 觀察 GitHub Actions 是否執行

**預期結果：**
- ✅ `build` job 成功執行
- ✅ `package` job 成功執行但不上傳 artifact
- ✅ `pr-comment` job 不執行（因為不是 PR）

### 場景 3: 版本更新自動發布測試

**目的：** 驗證 package.json 版本變更會觸發自動發布

**步驟：**
1. 建立新分支
2. 修改 `package.json` 的 `version` 欄位（例如從 `1.4.1` 改成 `1.4.2`）
3. 建立 PR 並等待 CI 通過
4. 合併 PR 到 main
5. 觀察 release workflow 是否執行

**預期結果：**
- ✅ `check-version` job 檢測到版本變更
- ✅ `build` job 成功執行
- ✅ `package` job 成功執行並上傳 artifact
- ✅ `release` job：
  - ✅ 建立 Git tag（例如 `v1.4.2`）
  - ✅ 建立 GitHub Release
  - ✅ 上傳 VSIX 到 Release
  - ✅ 發布到 VS Code Marketplace（需要 `VSCE_PAT` secret）

**驗證方式：**
```bash
# 檢查 release workflow 是否執行
gh run list --workflow=release.yml --limit 1

# 檢查 tag 是否建立
git fetch --tags
git tag -l "v1.4.2"

# 檢查 release 是否建立
gh release view v1.4.2
```

### 場景 4: 防止重複發布測試

**目的：** 驗證相同版本不會重複發布

**步驟：**
1. 修改任意檔案（但不修改版本號）
2. 建立 PR 並合併
3. 觀察 release workflow

**預期結果：**
- ✅ `check-version` job 執行
- ✅ 檢測到 tag 已存在或版本未變更
- ✅ 後續 jobs 不執行（被 skip）

### 場景 5: 手動觸發發布測試

**目的：** 驗證可以手動觸發發布流程

**步驟：**
1. 前往 GitHub Actions 頁面
2. 選擇 "自動發布 VS Code 擴充套件" workflow
3. 點擊 "Run workflow" 按鈕
4. 選擇 main 分支
5. 點擊 "Run workflow"

**預期結果：**
- ✅ Workflow 開始執行
- ✅ 如果版本 tag 不存在，執行發布流程
- ✅ 如果版本 tag 已存在，跳過發布

### 場景 6: 非 package.json 變更不觸發 Release

**目的：** 驗證只修改其他檔案不會觸發 release

**步驟：**
1. 建立新分支
2. 只修改 README.md 或其他非 package.json 的檔案
3. 建立 PR 並合併到 main

**預期結果：**
- ✅ CI workflow 執行
- ✅ Release workflow **不執行**（因為 package.json 沒變更）

## 可重用 Workflows 測試

### 測試 build-job.yml

**驗證：**
- ✅ 正確簽出程式碼
- ✅ 安裝相依套件成功
- ✅ 建構專案成功
- ✅ 輸出版本號
- ✅ 上傳建構產物

### 測試 package-job.yml

**驗證：**
- ✅ 下載建構產物成功
- ✅ 打包 VSIX 成功
- ✅ 條件式上傳 artifact（根據 `upload-artifact` 參數）

## 問題排查

### 如果 CI 失敗

1. 檢查 GitHub Actions logs
2. 確認 Node.js 版本正確（應該是 20）
3. 確認 npm ci 成功
4. 確認 esbuild 成功

### 如果 Release 失敗

1. 檢查 `VSCE_PAT` secret 是否設定
2. 檢查版本號格式是否正確
3. 檢查 tag 是否已存在
4. 檢查 GitHub token 權限

### 如果 PR 留言沒出現

1. 檢查 workflow 權限（需要 `pull-requests: write`）
2. 檢查 artifact 是否上傳成功
3. 檢查 `github-script` 執行 logs

## 回滾計畫

如果新的 workflows 有問題，可以：

1. **緊急修復：** 使用 `workflow_dispatch` 手動觸發舊的發布流程
2. **完全回滾：** 恢復舊的 workflow 檔案
   ```bash
   git revert <commit-hash>
   git push
   ```

## 測試檢查清單

在完成所有測試後，確認：

- [ ] PR 建置功能正常
- [ ] PR 留言功能正常
- [ ] Main branch CI 測試正常
- [ ] 版本更新觸發 release 正常
- [ ] 防止重複發布機制正常
- [ ] 手動觸發發布正常
- [ ] 非 package.json 變更不觸發 release
- [ ] 可重用 workflows 正常運作
- [ ] 所有 YAML 語法正確
- [ ] Artifacts 命名正確
- [ ] GitHub Release 建立正常
- [ ] VS Code Marketplace 發布正常（如果有 token）

## 注意事項

1. **測試順序：** 建議按照場景順序測試，從簡單到複雜
2. **清理測試資料：** 測試完成後，刪除測試用的 tags 和 releases
3. **Marketplace 發布：** 如果沒有 `VSCE_PAT` secret，Marketplace 發布會失敗，但這是預期的
4. **版本號：** 測試時注意不要使用已經在 Marketplace 發布的版本號
