# Change Log

All notable changes to the **盤古之白** will be documented in this file.

## 0.9.0 - 2025-02-08

* 增加處理 Markdown 文件中的全形括號問題
  * 全部改為半形括號
* 處理 LLM 常見的輸出問題
  * 解決兩個很常見的 Markdown 格式錯誤
    * `內容，**內容（Content）**內容` 換成 `內容，**內容（Content）** 內容`
    * `1. **標題：**內容` 換成 `1. **標題**：內容`

## 0.8.0 - 2023-11-24

* 修正一個小錯誤
  * 解決當 Inline Text 與 Text 之間的空白判斷可能會導致增加多餘空白的問題

## 0.7.0 - 2023-11-18

* Support for [HackMD](https://hackmd.io/)-specific syntax
  * `[TOC]`
  * [toc文章目錄生產](https://hackmd.io/@chiaoshin369/Shinbook/https%3A%2F%2Fhackmd.io%2F%40chiaoshin369%2Fhackmd#toc%E6%96%87%E7%AB%A0%E7%9B%AE%E9%8C%84%E7%94%9F%E7%94%A2)

## 0.6.1 - 2023-11-11

* Update `README.md`

## 0.6.0 - 2023-11-11

* Markdown 支援 [Azure DevOps 的 Wikis](https://learn.microsoft.com/en-us/azure/devops/project/wiki/wiki-markdown-guidance?view=azure-devops&WT.mc_id=DT-MVP-4015686#table-of-contents-toc-for-wiki-pages) 的 TOC 與 TOSP 語法
  * `[[_TOC_]]`
  * `[[_TOSP_]]`

## 0.5.0 - 2023-11-08

* 在 Markdown 文件使用「盤古之白」時支援 GFM (GitHub Flavored Markdown) 格式
  * 加入 [remark-gfm](https://www.npmjs.com/package/remark-gfm)

## 0.4.0 - 2023-11-08

* 在 Markdown 文件使用「盤古之白」時支援 YAML, TOML 格式
  * 加入 [remark-frontmatter](https://www.npmjs.com/package/remark-frontmatter)

## 0.3.0 - 2023-10-25

* 支援 **Markdown** 文件加入盤古之白
* 改用 ESM 重構程式碼
* 更新 `README.md` 內容

## 0.2.0 - 2023-10-24

* 加入 URL 格式判斷，避免 URL 也被加入盤古之白

## 0.1.1 - 2023-10-22

* 在 `README.md` 加入「盤古之白」
* 更新 GitHub Repo 連結

## 0.1.0 - 2023-10-22

* Initial release
