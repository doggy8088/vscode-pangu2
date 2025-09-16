這是一個測試文件來驗證Azure DevOps Wiki語法。

普通的中文text需要正常處理。

::: mermaid
gantt
    title 文件交付時程（第一階段）
    dateFormat  YYYY-MM-DD
    section 文件交付
    專案計畫書           :done,  des1, 2024-01-01, 2024-01-31
    系統分析/設計說明書   :active, des2, 2024-02-01, 2024-02-29
    程式設計規格書       :active, des3, 2024-02-01, 2024-02-29
    系統程式碼           :active, des4, 2024-03-01, 2024-05-31
    測試計畫書           :active, des5, 2024-03-01, 2024-05-31
    測試報告書           :active, des6, 2024-06-01, 2024-06-30
    系統資安檢測報告書   :active, des7, 2024-07-01, 2024-09-01
    移轉上線報告         :active, des8, 2024-07-01, 2024-09-01
    系統管理手冊         :active, des9, 2024-07-01, 2024-09-01
:::

這段text還是要正常處理。

::: warning
這是警告message內容，中文text應該被保持原樣
:::

再來一段中文text測試。

::: note
筆記內容test123不應該被處理
:::

最後的中文text應該被正常處理。

[[_TOC_]]

這裡有更多text內容。