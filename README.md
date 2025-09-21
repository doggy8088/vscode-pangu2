# 盤古之白

如果你跟我一樣，每次看到網頁上的中文字和英文、數字、符號擠在一塊，就會坐立難安，忍不住想在它們之間加個空格。這個 Visual Studio Code 擴充套件會自動替你在文件中所有的中文字和半形的英文、數字、符號之間插入空白。如果有任何建議與討論，歡迎來到[這裡](https://github.com/doggy8088/vscode-pangu2/issues)留言交流。

![image](images/pangu.gif)

## 主要特色

* 支援將**選取文字**加入盤古之白
* 支援將**整份文件**加入盤古之白
* 支援 **Markdown** 文件加入盤古之白
  * 支援 GFM (GitHub Flavored Markdown) 格式
  * 支援 Azure DevOps Wikis 的專屬語法
    * `[[_TOC_]]`
    * `[[_TOSP_]]`
  * 支援 [HackMD](https://hackmd.io/) 專屬的格式
    * `[TOC]`
  * 支援文件開頭的 YAML, TOML 格式
  * 可自動判斷 Inline Code、粗體、斜體、刪除線與文字之間的空白判斷
  * 支援 LaTeX 數學公式保護（如 `$d_{15}$`）
  * 支援指令區塊保護（如 `::: warning` 區塊）
* 支援儲存文件時自動加入盤古之白 (預設並未啟用)
* 智慧處理全形與半形括號轉換
* 修正 LLM 常見的格式問題
  * 自動修正 `內容，**內容（Content）**內容` → `內容，**內容（Content）** 內容`
  * 自動修正 `1. **標題：**內容` → `1. **標題**：內容`

## 使用方式

本工具主要有兩個命令：

1. 將編輯器中的**選取範圍**加入盤古之白 (`pangu2.add_space_selection`)
2. 將編輯器中的**整份文件**加入盤古之白 (`pangu2.add_space_whole`)

使用方式也有兩種：

1. 在編輯中按下滑鼠右鍵，選擇 `Pangu: 加入盤古之白 (選取範圍)` 或 `Pangu: 加入盤古之白 (整份文件)` 命令。

    程式會自動判斷你目前是否有選取文字，如果有選取文字，就只會顯示 `Pangu: 加入盤古之白 (選取範圍)` 在右鍵選單中。

    反之，沒有選取文字時，預設只會顯示 `Pangu: 加入盤古之白 (整份文件)` 在右鍵選單中。

2. 在編輯器中按下 `F1` 後輸入 `pangu` 搜尋命令，有 `Pangu: 加入盤古之白 (選取範圍)` 或 `Pangu: 加入盤古之白 (整份文件)` 可以選擇。

## 進階功能

### LaTeX 數學公式支援

擴充套件會自動保護 LaTeX 數學公式，避免公式內的下標符號被錯誤處理：

```markdown
原始： 質能關係式 $E=mc^2$ 和化學式 $H_{2}O$ 都會被正確保護
結果： 質能關係式 $E=mc^2$ 和化學式 $H_{2}O$ 都會被正確保護
```

### 指令區塊保護

支援保護 Markdown 中的指令區塊，確保其內容不被處理：

```markdown
::: warning 重要提醒
這段內容包含中文English混合，但不會被處理
:::
```

### 全形括號智慧轉換

自動將全形括號轉換為半形括號，提升文件一致性：

```
原始： 這是（全形括號）的範例
結果： 這是 (半形括號) 的範例
```

### LLM 輸出優化

針對大語言模型常見的格式問題進行自動修正：

```markdown
修正前： 內容，**標題（Content）**內容
修正後： 內容，**標題（Content）** 內容

修正前： 1. **標題：**內容說明
修正後： 1. **標題**：內容說明
```

## 選項設定

![images](images/settings.jpg)

主要設定有三個，分別是：

1. `pangu2.autoAddSpaceOnSave` (boolean)

    設定是否要自動在儲存文件時加入盤古之白。預設為 `false`。

2. `pangu2.autoAddSpaceOnSaveFileExtensions` (array)

    設定僅在特定檔案類型儲存時自動執行盤古之白。預設為 `[ ".txt" ]`。

    若設定為 `[ "*" ]`，則代表**所有檔案類型**都會自動加入盤古之白。

    > 注意：此設定僅在 `pangu2.autoAddSpaceOnSave` 為 `true` 時才會生效。

3. `pangu2.enableLooseFormatting` (boolean)

    啟用鬆散格式可減少 Markdown 中不必要的字元跳脫。預設為 `false`。

    當啟用時，會減少以下字元的跳脫：
    - `_` 符號：例如 `hello\_world` 會變成 `hello_world`
    - `[` 符號：例如 `## \[文字]` 會變成 `## [文字]`
    - `~` 符號：例如 `好開心\~` 會變成 `好開心~`，但保留雙波浪號 `~~刪除線~~` 的跳脫

    > 注意：此設定僅影響 Markdown 文件的處理。

設定範例如下：

```js
{
  "pangu2.autoAddSpaceOnSave": true,
  "pangu2.autoAddSpaceOnSaveFileExtensions": [
    ".txt",
    ".md"
  ],
  "pangu2.enableLooseFormatting": true
}
```

## 已知問題

* 目前僅支援 HTML、Markdown 與純文字文件可以正常運作，若套用其他類型的文件上，可能會導致部分語法錯誤。

* 若要在任何程式語言中使用本套件，請多利用將**選取文字**加入盤古之白的功能套用在註解上，以避免程式碼被破壞。

## 最新更新 (v1.0.0)

* ✅ **已修正** LaTeX 數學公式格式問題
* ✅ **已修正** 指令區塊內容被誤處理的問題
* ✅ **已改善** Azure DevOps Wiki 語法處理
* ✅ **已新增** 全形括號自動轉換功能
* ✅ **已新增** LLM 常見格式問題自動修正

## 感謝

本擴充套件源自 [vinta/pangu.js](https://github.com/vinta/pangu.js) 專案的幫助，自動在中文和英文、數字、符號之間插入空白。

部分程式碼參考自 [halfcrazy/vscode-pangu](https://github.com/halfcrazy/vscode-pangu) 的實作，並加以優化改進。
