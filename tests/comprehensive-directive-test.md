# Azure DevOps Wiki語法測試文件

這是一個test document來驗證Azure DevOps Wiki的directive語法支援。

## 基本測試

普通的中文text應該被正常處理，在中文和English之間加入空格。

::: mermaid
graph TD
    A[開始] --> B{決策點}
    B -->|是| C[執行Action]
    B -->|否| D[結束Process]
    C --> D
:::

上面的mermaid圖表content不應該被處理。

## 多種Directive類型

::: warning 重要提醒
這是warning內容，包含中文text和English混合的content。
所有在warning directive內的text都不應該被pangu處理。
:::

這段text在directive外面，應該被正常處理。

::: note
筆記內容test123不應該被處理
包含多行content的note
中文text123English都要保持原樣
:::

::: tip
提示內容也是一樣，中文text與English之間不應該加入空格
:::

::: error
錯誤message內容test456也要維持原樣
:::

## 巢狀和複雜結構

正常的text內容在這裡。

::: details 詳細說明
這是details directive內容

    code block inside directive
    專案計畫書 :done, des1, 2024-01-01
    
包含code block的directive content

另一段text在directive內
:::

繼續的text內容應該被處理。

## 傳統語法測試

[[_TOC_]]

[[_TOSP_]]

這些TOC語法應該保持不變，而周圍的text應該被處理。

## 邊界測試

正常text之前。

:::invalid
這個directive名稱包含數字123應該也被處理
:::

正常text之後。

:::  spaced-directive  
directive名稱前後有空格的情況
:::

最後的text內容測試。