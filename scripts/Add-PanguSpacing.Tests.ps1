#Requires -Version 7.0
<#
.SYNOPSIS
    Add-PanguSpacing.ps1 的單元測試

.DESCRIPTION
    使用 Pester 5.x 測試框架進行測試。
    涵蓋所有盤古之白的處理規則。

.NOTES
    執行測試：Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1
    詳細輸出：Invoke-Pester -Path .\Add-PanguSpacing.Tests.ps1 -Output Detailed
#>

BeforeAll {
    $ScriptPath = Join-Path $PSScriptRoot 'Add-PanguSpacing.ps1'
    $TestTempDir = Join-Path $env:TEMP 'PanguSpacingTests'
    if (-not (Test-Path $TestTempDir)) {
        New-Item -ItemType Directory -Path $TestTempDir -Force | Out-Null
    }
}

AfterAll {
    if (Test-Path $TestTempDir) {
        Remove-Item -Path $TestTempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Describe 'Add-PanguSpacing Basic' {
    Context 'Pre-check' {
        It 'Empty string should return empty' {
            $result = & $ScriptPath -Text ''
            $result | Should -BeNullOrEmpty
        }

        It 'Single char should return as-is' {
            $result = & $ScriptPath -Text 'A'
            $result | Should -Be 'A'
        }

        It 'Pure English should return as-is' {
            $result = & $ScriptPath -Text 'Hello World'
            $result | Should -Be 'Hello World'
        }

        It 'Pure numbers should return as-is' {
            $result = & $ScriptPath -Text '12345'
            $result | Should -Be '12345'
        }

        It 'Pure Chinese should return as-is' {
            $result = & $ScriptPath -Text '你好世界'
            $result | Should -Be '你好世界'
        }
    }

    Context 'CJK and English spacing' {
        It 'Should add space between Chinese and English' {
            $result = & $ScriptPath -Text '中文word中文'
            $result | Should -Be '中文 word 中文'
        }

        It 'Should add space between English and Chinese' {
            $result = & $ScriptPath -Text 'word中文word'
            $result | Should -Be 'word 中文 word'
        }

        It 'Should not add duplicate spaces' {
            $result = & $ScriptPath -Text '中文 word 中文'
            $result | Should -Be '中文 word 中文'
        }
    }

    Context 'CJK and number spacing' {
        It 'Should add space between Chinese and numbers' {
            $result = & $ScriptPath -Text '測試123測試'
            $result | Should -Be '測試 123 測試'
        }

        It 'Should add space between numbers and Chinese' {
            $result = & $ScriptPath -Text '123測試456'
            $result | Should -Be '123 測試 456'
        }
    }
}

Describe 'Add-PanguSpacing Japanese' {
    Context 'Hiragana' {
        It 'Should add space between Hiragana and English' {
            $result = & $ScriptPath -Text 'あいうtest'
            $result | Should -Be 'あいう test'
        }
    }

    Context 'Katakana' {
        It 'Should add space between Katakana and English' {
            $result = & $ScriptPath -Text 'アイウtest'
            $result | Should -Be 'アイウ test'
        }
    }
}

Describe 'Add-PanguSpacing Operators' {
    Context 'Math operators' {
        It 'Should add space around plus operator between CJK and ANS' {
            # 純數字運算不加空格，只在 CJK 與數字之間加空格
            $result = & $ScriptPath -Text '測試1+2等於3'
            $result | Should -Be '測試 1+2 等於 3'
        }

        It 'Should add space around minus operator between CJK and ANS' {
            # 純數字運算不加空格，只在 CJK 與數字之間加空格
            $result = & $ScriptPath -Text '測試5-3等於2'
            $result | Should -Be '測試 5-3 等於 2'
        }
    }
}

Describe 'Add-PanguSpacing Hash' {
    It 'Should add space around hash tags' {
        $result = & $ScriptPath -Text '這是#tag標籤'
        $result | Should -Be '這是 #tag 標籤'
    }

    It 'Should handle CJK hash format' {
        $result = & $ScriptPath -Text '中文#標籤#文字'
        $result | Should -Be '中文 #標籤# 文字'
    }
}

Describe 'Add-PanguSpacing Colon' {
    It 'Should convert colon to fullwidth when followed by uppercase' {
        $result = & $ScriptPath -Text '注意:ABC'
        $result | Should -Be '注意：ABC'
    }

    It 'Should convert colon to fullwidth when followed by number' {
        $result = & $ScriptPath -Text '時間:123'
        $result | Should -Be '時間：123'
    }
}

Describe 'Add-PanguSpacing Middle Dot' {
    It 'Should convert middle dot to Katakana middle dot' {
        # · (U+00B7) -> ・ (U+30FB)
        $result = & $ScriptPath -Text '威爾·喬丹'
        $result | Should -Be '威爾・喬丹'
    }

    It 'Should convert bullet to Katakana middle dot' {
        # • (U+2022) -> ・ (U+30FB)
        $result = & $ScriptPath -Text '威爾•喬丹'
        $result | Should -Be '威爾・喬丹'
    }
}

Describe 'Add-PanguSpacing Dots' {
    It 'Should add space after ellipsis before CJK' {
        $result = & $ScriptPath -Text '等等...繼續'
        $result | Should -Be '等等... 繼續'
    }

    It 'Should add space after Unicode ellipsis before CJK' {
        # … (U+2026)
        $result = & $ScriptPath -Text '等等…繼續'
        $result | Should -Be '等等… 繼續'
    }
}

Describe 'Add-PanguSpacing Quotes' {
    It 'Should add space around double quotes' {
        $result = & $ScriptPath -Text '他說"Hello"然後離開'
        $result | Should -Be '他說 "Hello" 然後離開'
    }

    It 'Should preserve possessive s' {
        $result = & $ScriptPath -Text "John's書"
        $result | Should -Be "John's 書"
    }
}

Describe 'Add-PanguSpacing Brackets' {
    Context 'CJK and brackets' {
        It 'Should add space between CJK and parentheses' {
            $result = & $ScriptPath -Text '這是(括號)測試'
            $result | Should -Be '這是 (括號) 測試'
        }

        It 'Should add space between CJK and square brackets' {
            $result = & $ScriptPath -Text '這是[方括號]測試'
            $result | Should -Be '這是 [方括號] 測試'
        }
    }

    Context 'Empty brackets protection' {
        It 'Should not break empty parentheses' {
            $result = & $ScriptPath -Text '呼叫func()函數'
            $result | Should -Be '呼叫 func() 函數'
        }

        It 'Should not break empty square brackets' {
            $result = & $ScriptPath -Text '陣列array[]測試'
            $result | Should -Be '陣列 array[] 測試'
        }

        It 'Should not break empty curly brackets' {
            $result = & $ScriptPath -Text '物件object{}測試'
            $result | Should -Be '物件 object{} 測試'
        }

        It 'Should handle non-empty brackets normally' {
            $result = & $ScriptPath -Text '呼叫func(arg)函數'
            $result | Should -Be '呼叫 func (arg) 函數'
        }
    }
}

Describe 'Add-PanguSpacing URL Protection' {
    Context 'HTTP URLs' {
        It 'Should protect HTTP URL from spacing' {
            $result = & $ScriptPath -Text '請參考http://example.com網站'
            $result | Should -Be '請參考 http://example.com 網站'
        }

        It 'Should protect HTTPS URL from spacing' {
            $result = & $ScriptPath -Text '請參考https://example.com網站'
            $result | Should -Be '請參考 https://example.com 網站'
        }

        It 'Should not add space inside URL with CJK path' {
            # URL 正則會匹配包含 CJK 的完整 URL 路徑
            $result = & $ScriptPath -Text '連結https://example.com/路徑/頁面測試'
            $result | Should -Be '連結 https://example.com/路徑/頁面測試'
        }
    }

    Context 'Multiple URLs' {
        It 'Should protect multiple URLs' {
            $result = & $ScriptPath -Text '網站A是http://a.com而網站B是http://b.com結束'
            $result | Should -Be '網站 A 是 http://a.com 而網站 B 是 http://b.com 結束'
        }
    }
}

Describe 'Add-PanguSpacing Greek Letters' {
    It 'Should add space between Chinese and Greek letters' {
        # π (U+03C0)
        $result = & $ScriptPath -Text '圓周率π約等於3.14'
        $result | Should -Be '圓周率 π 約等於 3.14'
    }
}

Describe 'Add-PanguSpacing Pipeline' {
    It 'Should support pipeline input' {
        $result = '中文text' | & $ScriptPath
        $result | Should -Be '中文 text'
    }
}

Describe 'Add-PanguSpacing File Operations' {
    BeforeEach {
        $script:TestInputFile = Join-Path $TestTempDir "input_$(Get-Random).txt"
        $script:TestOutputFile = Join-Path $TestTempDir "output_$(Get-Random).txt"
    }

    AfterEach {
        Remove-Item -Path $script:TestInputFile -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $script:TestOutputFile -Force -ErrorAction SilentlyContinue
    }

    Context 'InFile and OutFile' {
        It 'Should read and write file correctly' {
            Set-Content -Path $script:TestInputFile -Value '這是中文text測試' -Encoding utf8NoBOM -NoNewline
            & $ScriptPath -InFile $script:TestInputFile -OutFile $script:TestOutputFile
            $result = Get-Content -Path $script:TestOutputFile -Raw -Encoding utf8NoBOM
            $result | Should -Be '這是中文 text 測試'
        }
    }

    Context 'InPlaceEdit' {
        It 'Should edit file in place with -i' {
            Set-Content -Path $script:TestInputFile -Value '就地編輯test測試' -Encoding utf8NoBOM -NoNewline
            & $ScriptPath -InFile $script:TestInputFile -i
            $result = Get-Content -Path $script:TestInputFile -Raw -Encoding utf8NoBOM
            $result | Should -Be '就地編輯 test 測試'
        }

        It 'Should work with -InPlaceEdit parameter' {
            Set-Content -Path $script:TestInputFile -Value '完整參數test' -Encoding utf8NoBOM -NoNewline
            & $ScriptPath -InFile $script:TestInputFile -InPlaceEdit
            $result = Get-Content -Path $script:TestInputFile -Raw -Encoding utf8NoBOM
            $result | Should -Be '完整參數 test'
        }
    }

    Context 'Encoding' {
        It 'Should handle UTF-8 BOM encoding' {
            Set-Content -Path $script:TestInputFile -Value '編碼test測試' -Encoding utf8BOM -NoNewline
            & $ScriptPath -InFile $script:TestInputFile -OutFile $script:TestOutputFile -Encoding utf8BOM
            $result = Get-Content -Path $script:TestOutputFile -Raw -Encoding utf8BOM
            $result | Should -Be '編碼 test 測試'
        }

        It 'Should handle Unicode encoding' {
            Set-Content -Path $script:TestInputFile -Value '編碼test測試' -Encoding unicode -NoNewline
            & $ScriptPath -InFile $script:TestInputFile -OutFile $script:TestOutputFile -Encoding unicode
            $result = Get-Content -Path $script:TestOutputFile -Raw -Encoding unicode
            $result | Should -Be '編碼 test 測試'
        }
    }
}

Describe 'Add-PanguSpacing Error Handling' {
    It 'Should throw error when file does not exist' {
        { & $ScriptPath -InFile 'nonexistent_file_12345.txt' -OutFile 'output.txt' } | Should -Throw
    }
}

Describe 'Add-PanguSpacing Edge Cases' {
    Context 'Special characters' {
        It 'Should handle newline' {
            $result = & $ScriptPath -Text "中文text`n換行後text中文"
            $result | Should -Be "中文 text`n換行後 text 中文"
        }

        It 'Should handle tab' {
            $result = & $ScriptPath -Text "中文text`t定位後text中文"
            $result | Should -Be "中文 text`t定位後 text 中文"
        }
    }

    Context 'LaTeX formula protection' {
        It 'Should preserve curly brace numbers like {0}' {
            $result = & $ScriptPath -Text '公式{0}結束'
            $result | Should -Be '公式 {0} 結束'
        }
    }
}

Describe 'Add-PanguSpacing Real World Cases' {
    It 'Technical article title' {
        $result = & $ScriptPath -Text '使用Docker部署Node.js應用程式'
        $result | Should -Be '使用 Docker 部署 Node.js 應用程式'
    }

    It 'Version number' {
        $result = & $ScriptPath -Text 'v1.0.0版本已發布'
        $result | Should -Be 'v1.0.0 版本已發布'
    }

    It 'Code snippet' {
        $result = & $ScriptPath -Text '執行npm install安裝依賴'
        $result | Should -Be '執行 npm install 安裝依賴'
    }

    It 'Mixed tech terms' {
        $result = & $ScriptPath -Text 'TypeScript是JavaScript的超集'
        $result | Should -Be 'TypeScript 是 JavaScript 的超集'
    }
}

# ========================================
# 擴充測試案例
# ========================================

Describe 'Add-PanguSpacing Korean' {
    It 'Should add space between Korean and English' {
        $result = & $ScriptPath -Text '안녕하세요Hello'
        $result | Should -Be '안녕하세요 Hello'
    }

    It 'Should add space between Korean and numbers' {
        $result = & $ScriptPath -Text '가격123원'
        $result | Should -Be '가격 123 원'
    }

    It 'Should add space between English and Korean' {
        $result = & $ScriptPath -Text 'Hello안녕하세요World'
        $result | Should -Be 'Hello 안녕하세요 World'
    }
}

Describe 'Add-PanguSpacing Extended Operators' {
    Context 'Multiplication and Division' {
        It 'Should handle multiplication between CJK and numbers' {
            $result = & $ScriptPath -Text '計算3*4結果'
            $result | Should -Be '計算 3 * 4 結果'
        }

        It 'Should handle division between CJK and numbers' {
            $result = & $ScriptPath -Text '計算10/2結果'
            $result | Should -Be '計算 10 / 2 結果'
        }
    }

    Context 'Comparison operators' {
        It 'Should handle less than operator' {
            $result = & $ScriptPath -Text '判斷x<5條件'
            $result | Should -Be '判斷 x < 5 條件'
        }

        It 'Should handle greater than operator' {
            $result = & $ScriptPath -Text '判斷y>3條件'
            $result | Should -Be '判斷 y > 3 條件'
        }
    }

    Context 'Logical operators' {
        It 'Should handle ampersand operator' {
            $result = & $ScriptPath -Text '條件a&b成立'
            $result | Should -Be '條件 a & b 成立'
        }

        It 'Should handle pipe operator' {
            $result = & $ScriptPath -Text '選項a|b選擇'
            $result | Should -Be '選項 a | b 選擇'
        }

        It 'Should handle equal operator' {
            $result = & $ScriptPath -Text '變數a=5設定'
            $result | Should -Be '變數 a = 5 設定'
        }
    }
}

Describe 'Add-PanguSpacing Special Symbols' {
    Context 'Percent symbol' {
        It 'Should add space around percent' {
            $result = & $ScriptPath -Text '成功率95%很高'
            $result | Should -Be '成功率 95% 很高'
        }
    }

    Context 'Currency symbols' {
        It 'Should add space around dollar sign' {
            $result = & $ScriptPath -Text '價格$100美元'
            $result | Should -Be '價格 $100 美元'
        }
    }

    Context 'Fraction symbols' {
        It 'Should add space around fraction symbol' {
            # ½ (U+00BD)
            $result = & $ScriptPath -Text '體積½公升'
            $result | Should -Be '體積 ½ 公升'
        }
    }

    Context 'Dingbat symbols' {
        It 'Should add space around checkmark' {
            # ✓ (U+2713)
            $result = & $ScriptPath -Text '完成✓標記'
            $result | Should -Be '完成 ✓ 標記'
        }
    }
}

Describe 'Add-PanguSpacing Extended Greek' {
    It 'Should add space between Chinese and alpha' {
        # α (U+03B1)
        $result = & $ScriptPath -Text '變數α等於'
        $result | Should -Be '變數 α 等於'
    }

    It 'Should add space between Chinese and beta' {
        # β (U+03B2)
        $result = & $ScriptPath -Text '測試版β發布'
        $result | Should -Be '測試版 β 發布'
    }

    It 'Should add space between Chinese and sigma' {
        # Σ (U+03A3)
        $result = & $ScriptPath -Text '總和Σ計算'
        $result | Should -Be '總和 Σ 計算'
    }
}

Describe 'Add-PanguSpacing URL Advanced' {
    Context 'URL with query parameters' {
        It 'Should protect URL with query string' {
            $result = & $ScriptPath -Text '網址https://example.com?id=123&name=test結束'
            $result | Should -Be '網址 https://example.com?id=123&name=test 結束'
        }
    }

    Context 'URL with anchor' {
        It 'Should protect URL with hash anchor' {
            $result = & $ScriptPath -Text '連結https://example.com#section測試'
            $result | Should -Be '連結 https://example.com#section 測試'
        }
    }

    Context 'URL with port' {
        It 'Should protect URL with port number' {
            $result = & $ScriptPath -Text '伺服器http://localhost:8080測試'
            $result | Should -Be '伺服器 http://localhost:8080 測試'
        }
    }
}

Describe 'Add-PanguSpacing Boundary Cases' {
    Context 'Line boundaries' {
        It 'Should handle English at line start' {
            $result = & $ScriptPath -Text 'English開頭'
            $result | Should -Be 'English 開頭'
        }

        It 'Should handle English at line end' {
            $result = & $ScriptPath -Text '結尾English'
            $result | Should -Be '結尾 English'
        }

        It 'Should handle number at line start' {
            $result = & $ScriptPath -Text '123開頭'
            $result | Should -Be '123 開頭'
        }

        It 'Should handle number at line end' {
            $result = & $ScriptPath -Text '結尾456'
            $result | Should -Be '結尾 456'
        }
    }

    Context 'Multiline with CRLF' {
        It 'Should handle CRLF line endings' {
            $text = "第一行text`r`n第二行English`r`n第三行123"
            $result = & $ScriptPath -Text $text
            $expected = "第一行 text`r`n第二行 English`r`n第三行 123"
            $result | Should -Be $expected
        }
    }

    Context 'Consecutive spaces' {
        It 'Should preserve existing multiple spaces' {
            $result = & $ScriptPath -Text '中文  English  中文'
            $result | Should -Be '中文  English  中文'
        }
    }
}

# ========================================
# Markdown 語法移除測試
# ========================================

Describe 'Add-PanguSpacing Markdown Stripping' {
    Context 'Default behavior (StripMarkdown disabled)' {
        It 'Should NOT strip markdown by default' {
            $result = & $ScriptPath -Text '這是**粗體**測試'
            $result | Should -Be '這是**粗體**測試'
        }

        It 'Should NOT strip inline code by default' {
            $result = & $ScriptPath -Text '使用`npm`安裝'
            $result | Should -Be '使用`npm`安裝'
        }
    }

    Context 'TOC removal' {
        It 'Should remove [[_TOC_]]' {
            $result = & $ScriptPath -Text '文章開頭[[_TOC_]]正文開始' -StripMarkdown
            $result | Should -Be '文章開頭正文開始'
        }

        It 'Should remove [[_TOSP_]]' {
            $result = & $ScriptPath -Text '開頭[[_TOSP_]]正文' -StripMarkdown
            $result | Should -Be '開頭正文'
        }

        It 'Should remove [TOC]' {
            $result = & $ScriptPath -Text '目錄[TOC]內容' -StripMarkdown
            $result | Should -Be '目錄內容'
        }
    }

    Context 'Code blocks' {
        It 'Should strip code block markers and keep content' {
            $text = "前文`n" + '```javascript' + "`nconst x = 1;`n" + '```' + "`n後文"
            $result = & $ScriptPath -Text $text -StripMarkdown
            $result | Should -Be "前文`nconst x = 1;`n後文"
        }

        It 'Should handle code block without language' {
            $text = "前文`n" + '```' + "`ncode here`n" + '```' + "`n後文"
            $result = & $ScriptPath -Text $text -StripMarkdown
            $result | Should -Be "前文`ncode here`n後文"
        }
    }

    Context 'Inline code' {
        It 'Should strip backticks and keep content' {
            $result = & $ScriptPath -Text '使用`npm`安裝套件' -StripMarkdown
            $result | Should -Be '使用 npm 安裝套件'
        }

        It 'Should handle multiple inline codes' {
            $result = & $ScriptPath -Text '執行`npm install`然後`npm start`啟動' -StripMarkdown
            $result | Should -Be '執行 npm install 然後 npm start 啟動'
        }
    }

    Context 'Bold text' {
        It 'Should strip ** bold markers' {
            $result = & $ScriptPath -Text '這是**重點**內容' -StripMarkdown
            $result | Should -Be '這是重點內容'
        }

        It 'Should strip __ bold markers' {
            $result = & $ScriptPath -Text '這是__重點__內容' -StripMarkdown
            $result | Should -Be '這是重點內容'
        }
    }

    Context 'Italic text' {
        It 'Should strip * italic markers' {
            $result = & $ScriptPath -Text '這是*強調*文字' -StripMarkdown
            $result | Should -Be '這是強調文字'
        }
    }

    Context 'Links' {
        It 'Should keep link text and remove URL' {
            $result = & $ScriptPath -Text '請參考[官方文件](https://example.com)說明' -StripMarkdown
            $result | Should -Be '請參考官方文件說明'
        }

        It 'Should handle multiple links' {
            $result = & $ScriptPath -Text '參考[文件A](url1)和[文件B](url2)' -StripMarkdown
            $result | Should -Be '參考文件 A 和文件 B'
        }
    }

    Context 'Images' {
        It 'Should remove image syntax completely' {
            $result = & $ScriptPath -Text '圖示![icon](image.png)結束' -StripMarkdown
            $result | Should -Be '圖示結束'
        }

        It 'Should remove image with alt text' {
            $result = & $ScriptPath -Text '這是![替代文字](path/to/image.jpg)圖片' -StripMarkdown
            $result | Should -Be '這是圖片'
        }
    }

    Context 'HTML tags' {
        It 'Should remove br tag' {
            $result = & $ScriptPath -Text '第一行<br>第二行' -StripMarkdown
            $result | Should -Be '第一行第二行'
        }

        It 'Should remove div tags' {
            $result = & $ScriptPath -Text '開始<div class="test">內容</div>結束' -StripMarkdown
            $result | Should -Be '開始內容結束'
        }

        It 'Should remove self-closing tags' {
            $result = & $ScriptPath -Text '分隔<hr/>線' -StripMarkdown
            $result | Should -Be '分隔線'
        }
    }

    Context 'Nested syntax' {
        It 'Should handle bold link' {
            $result = & $ScriptPath -Text '這是**[粗體連結](url)**結束' -StripMarkdown
            $result | Should -Be '這是粗體連結結束'
        }

        It 'Should handle italic in bold' {
            $result = & $ScriptPath -Text '這是***粗斜體***文字' -StripMarkdown
            $result | Should -Be '這是粗斜體文字'
        }

        It 'Should handle code in bold' {
            $result = & $ScriptPath -Text '執行**`command`**指令' -StripMarkdown
            $result | Should -Be '執行 command 指令'
        }
    }

    Context 'Complex document' {
        It 'Should process a complex markdown document' {
            $text = @"
[[_TOC_]]

# 標題

這是**粗體**和*斜體*文字。

使用`npm install`安裝，參考[官方文件](https://example.com)。

``````javascript
const x = 1;
``````

<div>HTML內容</div>

![圖片](image.png)

結束
"@
            $expected = @"


# 標題

這是粗體和斜體文字。

使用 npm install 安裝，參考官方文件。

const x = 1;

HTML 內容



結束
"@
            $result = & $ScriptPath -Text $text -StripMarkdown
            $result | Should -Be $expected
        }
    }
}
