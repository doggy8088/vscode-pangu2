# Azure DevOps Wiki Directive 測試指南

這個目錄包含了多個簡單的測試程式，幫助你快速驗證 Azure DevOps Wiki directive 語法功能是否正確運作。

## 測試程式說明

### 1. `simple-test-1.mjs` - 基本功能測試
- **用途**: 測試基本的 directive 檢測和處理功能
- **測試內容**: 
  - 基本 mermaid directive
  - 多種 directive 類型 (warning, note)
  - 邊界情況測試
- **適合**: 初步驗證功能是否正常

### 2. `visual-test-2.mjs` - 視覺化比較測試  
- **用途**: 提供詳細的處理前後比較
- **測試內容**:
  - 複雜的混合內容
  - 詳細的分析報告
  - 視覺化差異顯示
- **適合**: 深入了解處理細節

### 3. `quick-test-3.mjs` - 快速驗證測試
- **用途**: 快速批量測試多個案例
- **測試內容**:
  - 5 個不同的測試案例
  - 效能測試
  - 統計報告
- **適合**: 日常回歸測試

### 4. `run-tests.mjs` - 測試執行器
- **用途**: 一鍵執行所有測試
- **功能**: 自動執行上述三個測試並匯總結果
- **適合**: 完整的測試流程

## 使用方法

### 快速開始
```bash
# 執行所有測試
node tests/run-tests.mjs

# 執行特定測試
node tests/run-tests.mjs simple-test-1.mjs
```

### 單獨執行測試
```bash
# 基本功能測試
node tests/simple-test-1.mjs

# 視覺化測試  
node tests/visual-test-2.mjs

# 快速驗證測試
node tests/quick-test-3.mjs
```

## 測試重點

### ✅ 應該通過的測試
1. **Directive 保留**: `::: type` 區塊內的內容應該完全保持原樣
2. **普通文字處理**: directive 外的中文 + 英文應該加入適當空格
3. **多種 directive 類型**: mermaid, warning, note, tip, error 等都應該被識別
4. **邊界情況**: 空 directive、特殊名稱等應該正確處理

### ❌ 常見問題檢測
1. directive 內容被錯誤處理 (加入了不應該的空格)
2. 普通文字沒有被處理 (缺少空格)
3. directive 邊界識別錯誤
4. 效能問題 (處理時間過長)

## 測試結果解讀

### 成功指標
- ✅ 所有 directive 區塊被正確識別
- ✅ directive 內容保持原樣 
- ✅ 普通文字獲得適當的空格處理
- ✅ 整體測試通過率 100%

### 失敗處理
如果測試失敗，檢查以下項目：
1. 確認 extension.ts 中已啟用 Azure DevOps Wiki plugin
2. 檢查 remark-azure-devops-wiki.ts 中的 directive 檢測邏輯
3. 驗證 remark-pangu.ts 中的跳過邏輯
4. 查看詳細的錯誤日誌

## 低認知負荷設計

這些測試程式設計時考慮了低認知負荷：

1. **清晰的輸出格式**: 使用表情符號和分隔線讓結果易讀
2. **簡化的 API**: 測試工具類提供簡單的方法調用
3. **自動化分析**: 自動比較處理前後的差異
4. **統計資訊**: 提供關鍵指標的數字化結果
5. **分層測試**: 從簡單到複雜，方便逐步驗證

## 測試工具類

`test-utils.ts` 提供了重構後的測試工具：

- `AzureDevOpsTestProcessor`: 主要的測試處理器
- `createTestLogger()`: 建立測試專用的日誌記錄器
- `analyzeDirectives()`: 分析文本中的 directive 結構
- `compare()`: 比較處理前後的差異

這些工具讓測試程式碼更簡潔，也更容易理解和維護。