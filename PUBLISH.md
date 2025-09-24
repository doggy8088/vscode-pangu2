# 套件發行備註

# 套件發行備註

## 自動發行 (推薦)

本專案已設定 GitHub Actions 自動發行流程。**當 main 分支有新的 commit 時，會自動檢查版本並執行發行流程**：

1. 自動讀取 `package.json` 中的版本號碼
2. 檢查對應的版本標籤是否已存在
3. 如果標籤不存在，則自動執行以下步驟：
   - 建構並封裝套件
   - 建立版本標籤 (例如: `v0.9.5`)
   - 建立 GitHub Release
   - 發布到 VS Code Marketplace

### 使用方式

1. 更新 `package.json` 中的版本號碼
2. 將變更推送到 main 分支：

    ```sh
    git add package.json
    git commit -m "Bump version to 1.3.0"
    git push origin main
    ```

3. GitHub Actions 會自動檢查版本並執行發行流程

### 注意事項

- 如果對應版本的標籤已存在，系統會跳過發行流程以避免重複發行
- 版本號碼必須遵循語意化版本 (Semantic Versioning) 格式
- 發行流程僅在版本標籤不存在時執行

### 手動觸發

也可以透過 GitHub Actions 頁面手動觸發發行流程。

## 手動發行

如需手動發行，可依照以下步驟：

1. 封裝套件

    ```sh
    npx @vscode/vsce package --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/ --allow-star-activation
    ```

    > 這個步驟本來就會自動執行 `npm run vscode:prepublish` 命令，且在發行前會自動預先清空 `out` 資料夾。

2. 發行套件

    ```sh
    npx @vscode/vsce publish --packagePath pangu2-0.9.4.vsix
    ```

    或者直接發行而不先封裝：

    ```sh
    npx @vscode/vsce publish --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/ --allow-star-activation
    ```
