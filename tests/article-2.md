## H2標題

```
##標題
```

### H3標題

```
### 標題
```

*斜體*

```
*文字*
```

**粗體**

```
**文字**
```

**刪除線**

~~文字~~

```
~~文字~~
```

Transfer[連結](https://markdownlivepreview.com)

```
連結文字[Transfer](https://markdownlivepreview.com)
```

另開新分頁<a href="https://markdownlivepreview.com" target="_blank">Links</a>

```
links<a href="https://markdownlivepreview.com" target="_blank">連結文字</a>LINKS
```

OK<font color=#D21A14>文字顏色</font>Color

```
<font color=#D21A14>文字</font>
```

圖片

```
![圖片Image文字](https://testingftpmdigitalnomad.blob.core.windows.net/images/d18b2e41-736f-48aa-be3a-4c0c020e000f.webp)
```

圖解小字

```
<small>圖解小字Image</small>
```

> 引言Hello World

```
> 引言文字
```

code

````
```
code
```
````

真的嗎`inline code`是的

```
This is `inline code`
```

清單

```
* 一層ACC
  * 一之二層BDD
    * 一之三層EFF
* 二層
* 三層
```

排序

```
1. 第一點
    1-1. 一之一
    1-2. 一之二
1. 第二點
1. 第三點
```

表格

```
| 欄1 | 欄2 | 欄3 |
| --- | --- | --- |
| 1-1 | 1-2 | 1-3 |
| 2-1 | 2-2 | 2-3 |
```

iframe

```
<div class="aspect-w-16 aspect-h-9">
<iframe src="https://www.youtube.com/embed/DgDNs6X0FDk" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
</div>
```

LLM 1

現今的開源「Deep Research」應用通常結合**大型語言模型（LLM）與檢索擴增生成 (RAG)技術，透過代理 (Agent)**執行網

LLM 2

1. **部署環境設置：**
   - **現有穩定版本：**目前運行版本的應用部署需要保持2個Pod。
   - **新版本：**新版本的應用需要逐步引導部分流量，最終部署2個Pod。

2. **部署策略：**
   - 採用金絲雀部署策略，逐步將部分流量引導至新版本的Pod。
   - 在新版本部署的初期，只引導少量流量，觀察系統穩定性和性能。
   - 若新版本運行良好，逐步增加流量，最終達到新版本的Pod數量為2。
