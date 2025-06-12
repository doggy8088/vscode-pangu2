# 套件發行備註

## 自動發行 (推薦)

本專案已設定 GitHub Actions 自動發行流程。當建立新的版本標籤時，會自動執行以下步驟：

1. 建構並封裝套件
2. 建立 GitHub Release
3. 發布到 VS Code Marketplace

### 使用方式

1. 更新 `package.json` 中的版本號碼
2. 建立並推送版本標籤：

    ```sh
    git tag v0.9.4
    git push origin v0.9.4
    ```

3. GitHub Actions 會自動執行發行流程

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
    npx @vscode/vsce publish --packagePath pangu2-0.9.3.vsix
    ```

    或者直接發行而不先封裝：

    ```sh
    npx @vscode/vsce publish --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/ --allow-star-activation
    ```
