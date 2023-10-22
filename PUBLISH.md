# 套件發行備註

1. 清空 `out` 資料夾

    ```sh
    rm -f out/*
    ```

2. 發行前編譯

    ```sh
    npm run vscode:prepublish
    ```

3. 封裝套件

    ```sh
    vsce package --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/
    ```

    > 這個步驟本來就會自動執行 `npm run vscode:prepublish` 命令。

4. 發行套件

    ```sh
    vsce publish -i pangu2-0.1.1.vsix
    ```
