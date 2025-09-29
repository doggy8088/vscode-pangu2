# 介紹好用工具：**使用 LinkChecker 檢查網站連結有效性**

我們在幫客戶建置的網站在上線前會做非常多品質檢查的工作，其中一項就是檢查網站連結的有效性，我個人都是使用[LinkChecker](https://github.com/linkchecker/linkchecker)來完成這個任務，它可以檢查網站上所有的連結是否有效，並且可以產生各種不同格式的報告，讓我們可以快速的找出網站上的連結問題。今天這篇文章我就來介紹這個好用工具！

![image](https://github.com/doggy8088/Learn-Git-in-30-days/assets/88981/fb1ed24b-8a34-45ce-aefa-ae317797e59f)

<p><img src="/image.axd?picture=/GitHub/278744776-fb1ed24b-8a34-45ce-aefa-ae317797e59f.webp" alt="" /></p>

### 安裝LinkChecker工具

1. **測試：**只要你有安裝Python 3，那麼你就可以透過`pip`命令來安裝LinkChecker工具：

```sh
pip3 install linkchecker
```

否則，你也可以透過Docker來執行這個工具，以下命令可以列出Docker容器中的`linkchecker`版本：

```ps1
docker run --rm -it -u 1000:1000 -v ${PWD}:/mnt ghcr.io/linkchecker/linkchecker:latest -V
```

> 注意: 這裡的 `-u 1000:1000` 是為了讓容器中的 `linkchecker` 程式不要跑在 `root` 身分下。而 `-v ${PWD}:/mnt` 則是將當前目錄掛載到容器的 `/mnt` 目錄中，方便你可以讀寫檔案。

執行結果如下：

```txt
LinkChecker 10.3.0.post7+g1ffb62a1 released 2023-10-14
Copyright (C) 2000-2016 Bastian Kleineidam, 2010-2023 LinkChecker Authors
```

### 功能特點

- 遞迴和多執行緒的連結檢查和網站爬取
- 輸出以彩色或普通文字、HTML、SQL、CSV、XML 或不同格式的網站地圖圖形呈現
- 支援 HTTP/1.1、HTTPS、FTP、mailto: 和本地檔案連結
- 透過正規表示式過濾器對連結進行檢查的限制
- 支援代理伺服器
- HTTP 和 FTP 的使用者名稱/密碼授權
- 遵守 `robots.txt` 排除協議
- 支援 Cookie
- HTML5 支援
- [外掛支援](https://linkchecker.github.io/linkchecker/man/linkchecker.html#plugins)，允許自訂頁面檢查
- 不同的介面：命令列和網頁介面

### 基本使用方式

以下所寫的命令我都會以 `linkchecker` 來呈現，如果你是透過 Docker 執行，那麼你只要替換成 `docker run --rm -it -u 1000:1000 -v ${PWD}:/mnt ghcr.io/linkchecker/linkchecker:latest` 來執行即可。

1. 查詢版本

    ```sh
    linkchecker -V
    ```

2. 檢查單一網頁是否可以連線

    加上 `-r 0` 代表探測深度為 `0`，代表只會檢查這一頁是否可以正常而已，不會檢查頁面中的連結是否有效。

    ```sh
    linkchecker -r 0 https://www.duotify.com
    ```

3. 檢查單一網頁與當中的連結是否有效 (僅包含站內網址)

    加上 `-r 1` 代表探測深度為 `1`，代表它會檢查這一頁是否可以正常連線，也會檢查這頁當中的所有超連結是否有效。

    因為 `linkchecker` 預設只會顯示「錯誤」與「警告」的網址結果，如果網址可以正常存取 ( HTTP 200 )，那就不會出現在檢測報告中。但你只要加上 `--verbose` 參數，就可以連同 HTTP 200 正常的網址也一併出現在檢測報告中。

    ```sh
    linkchecker -r 1 --verbose https://www.duotify.com
    ```

    這裡雖然說是「僅包含站內網址」，但他的邏輯有點怪，若網址長這樣：

    ```txt
    https://www.duotify.com/CloudProducts/TWCA-SSL
    ```

    那只有 `https://www.duotify.com/CloudProducts/` 網址路徑下的超連結才會被檢查，所以 `https://www.duotify.com/images/logo.png` 像這樣的網址就不會被檢查，因為他會被視為是「外部網址」，而外部網址就只會檢查 URL 的格式是否正確而已，這點要特別注意。

4. 檢查單一網頁與當中的連結是否有效 (包含檢查外部網址)

    加上 `--check-extern` 就可以檢查較為完整的網站連結，包含**站內**與**站外**的網址都會被檢查。

    ```sh
    linkchecker -r 1 --check-extern --verbose https://www.duotify.com
    ```

    > 檢查過程中若遇到 HTTP 301/302 網址轉向，檢測報告會出現警告(Warning)，但依然會繼續檢查轉向後的網址是否有效。

5. 檢查全站所有網頁的所有網址

    只要不加上 `-r` 參數，預設 `linkchecker` 就會成為一個貪婪的爬蟲，他會不斷的抓你「相同域名」下的所有頁面回來，並檢查每一個頁面中所有連結是否有效！

    ```sh
    linkchecker --check-extern https://www.duotify.com
    ```

    > 全站的連結可能很多，所以這裡我就不加上 `--verbose` 參數了，報告中只保留警告與錯誤的連結即可。

6. 檢查全站所有網頁的所有網址 (透過 Sitemap XML 檢查)

    如同搜尋引擎的爬蟲一樣，你可以透過 Sitemap XML 來指定全站所有的網址，不要讓爬蟲真的一頁一頁的剖析超連結，只要檢查 Sitemap XML 中的網址即可。

    ```sh
    linkchecker -r1 --verbose https://www.duotify.com/sitemap.xml
    ```

    上述命令採用 `-r 1` 參數，代表他會抓取 `sitemap.xml` 回來 (第 0 層)，然後再抓檔案中的所有連結進行檢查 (第 1 層)，就這樣，他不會檢查網頁中的所有超連結。

    若採用 `-r 2` 參數，那就代表他會解析所有網頁與網頁中的連結！

    ```sh
    linkchecker -r 2 --verbose https://www.duotify.com/sitemap.xml
    ```

### 輸出格式

以下是 `linkchecker` 所有支援的輸出格式：

- `text`

    標準文字格式。

- `html`

    HTML 格式，網頁中會套用連結到檢測的網址。

- `csv`

    CSV 格式，一個網址一行。

- `gml`

    輸出 GML sitemap graph 格式，會記錄 URL 之間父層與子層的關聯關係。

- `dot`

    輸出 DOT sitemap graph 格式，會記錄 URL 之間父層與子層的關聯關係。

- `gxml`

    輸出 GraphXML sitemap graph 格式。

- `xml`

    輸出 XML 格式。

- `sitemap`

    輸出 XML sitemap 格式，參見 <https://www.sitemaps.org/protocol.html>。

- `sql`

    輸出 SQL 指令檔，內容為 INSERT INTO 命令。

- `failures`

    適合排程工作的輸出格式，他會將檢測失敗的無效網址記錄在 `$XDG_DATA_HOME/linkchecker/failures` 目錄下。

- `none`

    不輸出任何資訊，通常會使用在 `-o none` 參數。適合用在偵錯時或在跑 CI/CD Pipelines 的時候，你可以透過 exit code 得知執行結果是否有異常。

基本上 `linkchecker` 輸出檢測結果的方式有兩種：

1. **輸出到檔案**

    可使用 `-F` 參數，用法如下：

    ```txt
    -F TYPE[/ENCODING][/FILENAME]
    ```

    > 你在參數列上可以指定多次 `-F` 參數，讓你一次可以輸出多種不同格式。

    LinkChecker 預設不會輸出結果到檔案。

2. **輸出到 Console**

    使用 `-o` 參數，預設會以**文字格式**輸出到 Console 上，用法如下：

    ```txt
    -o TYPE[/ENCODING]
    ```

    不指定 `-o` 參數時，預設的設定如下：

    ```txt
    -o text/utf-8
    ```

    > 若在 Windows 的命令提示視窗下，記得執行 `chcp 65001` 將預設字集改為 UTF-8，否則若遇到中文會出現亂碼。

以下是幾個常用命令：

1. 輸出 HTML 格式報表到檔案，而 Console 視窗不要顯示資訊

    ```sh
    linkchecker -r 1 --verbose -F "html/utf-8/linkchecker-duotify.html" -o none https://www.duotify.com/
    ```

2. 完全不要輸出任何資訊到 Console，可加上 `--no-status` 參數

    ```sh
    linkchecker -r 1 --verbose -F "html/utf-8/linkchecker-duotify.html" -o none --no-status https://www.duotify.com/
    ```

3. 產生網站的 Sitemap XML 檔

    若你想建立網站的 Sitemap XML 檔，可以使用 `sitemap` 輸出格式：

    ```sh
    linkchecker --verbose -F "sitemap/utf-8/linkchecker-duotify.xml" -o none https://www.duotify.com/
    ```

    > 注意: 請不要加上 `-r` 參數，而且建議從「首頁」開始抓網頁回來分析。

4. 一次輸出多份不同格式的報表

    例如你想同時輸出 `html`, `csv` 與 `sitemap` 的報表，可以這樣執行：

    ```sh
    linkchecker --verbose -F "html/utf-8/linkchecker-duotify.html" -F "csv/utf-8/linkchecker-duotify.csv" -F "sitemap/utf-8/linkchecker-duotify.xml" -o none https://www.duotify.com/
    ```

### 排除檢查的網址

當你透過 `linkchecker` 分析網站所有連結時，可能不想要檢查特定網址下的頁面，例如管理後台等等。這時你可以透過 `--ignore-url=REGEX` 參數來排除檢查的網址。這個 `--ignore-url` 可以出現多次，比對不同的網址。

> 注意: 正則表示式(REGEX)一定要採用 Python 風格的 REGEX 語法，詳見 <https://docs.python.org/3/howto/regex.html>。

例如你想排除網站後台的路徑 `/admin` 與 `/backend` 就可以這樣寫：

```sh
linkchecker --ignore-url=/admin --ignore-url=/backend www.example.com
```

> 這些被忽略的網址，`linkchecker` 將不會實際發出 HTTP 要求，而是僅檢查 URL 格式而已。

### 當個有禮貌的爬蟲

其實 `linkchecker` 在檢查連結時，都會先抓取網站的 `/robots.txt` 檔案回來，這是非常有禮貌的爬蟲作法，這是預設值。

當然，你也可以不遵守這個 `robots.txt` 的約定，無論如何都要爬網站回來 (不然我們要怎樣檢查連結有效性?)，那你可以加上 `--no-robots` 參數！

```sh
linkchecker --no-robots -r 1 --verbose -F "html/utf-8/linkchecker-duotify.html" -o none --no-status https://www.duotify.com/sitemap.xml
```

還有，預設 `linkchecker` 送出的 `User-Agent` 標頭為 `LinkChecker/X.Y`，你可以透過 `--user-agent` 參數來自訂 `User-Agent` 標頭，例如：

```ps1
linkchecker `
  -r 1 --verbose `
  --check-extern `
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36" `
  https://www.duotify.com/Training
```

> 常見 User-Agent 標頭可參見 [What are the latest user agents for Chrome?](https://www.whatismybrowser.com/guides/the-latest-user-agent/chrome)

### 偵錯方式

有時候我會覺得 `linkchecker` 的檢測結果怪怪的，這時我就會開啟**偵錯模式**，來查看 `linkchecker` 的執行過程到底做了什麼事，這點對我幫助非常大！👍

你可以加上 `-D` 參數開啟偵錯資訊輸出，而可用的參數有：

- `cmdline`
- `checking`
- `cache`
- `plugin`
- `all`

例如：

```sh
linkchecker -r 1 --verbose --check-extern -D all https://www.duotify.com/CaseShare
```

### 我的常用命令

這個是我在 PowerShell 底下經常使用的命令，不同網站設定的參數會有點不太一樣，使用時看情況調整即可：

```ps1
linkchecker `
  --verbose `
  -D all `
  -o none `
  --no-status `
  -r 1 `
  --ignore-url=/admin `
  --ignore-url=/category `
  --ignore-url=/Account `
  --ignore-url=/search `
  --ignore-url=/\d\d\d\d/\d\d/default `
  --ignore-url=/post/feed/\d\d\d\d/\d\d/ `
  --ignore-url=http://localhost `
  --check-extern `
  --no-robots `
  -F "html/utf-8/linkchecker-example.html" `
  -F "csv/utf-8/linkchecker-example.csv" `
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36" `
  https://example.com/
```

### 相關連結

- [linkchecker/linkchecker](https://github.com/linkchecker/linkchecker): check links in web documents or full websites
- [linkchecker — LinkChecker documentation](https://linkchecker.github.io/linkchecker/)
- [linkcheckerrc — LinkChecker documentation](https://linkchecker.github.io/linkchecker/man/linkcheckerrc.html)
- [What are the latest user agents for Chrome?](https://www.whatismybrowser.com/guides/the-latest-user-agent/chrome)
