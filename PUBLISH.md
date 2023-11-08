# 套件發行備註

1. 封裝套件

    ```sh
    vsce package --baseImagesUrl https://raw.githubusercontent.com/doggy8088/vscode-pangu/main/
    ```

    > 這個步驟本來就會自動執行 `npm run vscode:prepublish` 命令，且在發行前會自動預先清空 `out` 資料夾。

2. 發行套件

    ```sh
    vsce publish -i pangu2-0.5.0.vsix
    ```
