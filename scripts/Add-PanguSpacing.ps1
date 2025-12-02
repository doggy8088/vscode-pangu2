<#
.SYNOPSIS
    為中英文之間自動加入空白（盤古之白）

.DESCRIPTION
    此腳本會自動在中文（CJK）字符與英文、數字、符號之間加入適當的空白，
    提升中英文混排的可讀性。支援字串處理、檔案輸入輸出、就地編輯等模式。

    基於 pangu.js 4.0.7 版本的邏輯移植而成。
    需要 PowerShell 7+ 才能正常運作（使用負向後瞻等進階正則功能）。

.PARAMETER Text
    要處理的文字字串。支援從 Pipeline 輸入。

.PARAMETER InFile
    輸入檔案的路徑。

.PARAMETER OutFile
    輸出檔案的路徑。與 -InFile 搭配使用。

.PARAMETER InPlaceEdit
    就地編輯模式，處理後寫回原檔案。與 -InFile 搭配使用。
    別名：-i

.PARAMETER Encoding
    檔案編碼。預設為 utf8NoBOM。
    可用值：utf8, utf8NoBOM, utf8BOM, ascii, unicode, utf32, etc.

.EXAMPLE
    Add-PanguSpacing -Text "中文text混合English"
    # 輸出：中文 text 混合 English

.EXAMPLE
    "中文text" | Add-PanguSpacing
    # 輸出：中文 text

.EXAMPLE
    Add-PanguSpacing -InFile input.md -OutFile output.md
    # 讀取 input.md，處理後寫入 output.md

.EXAMPLE
    Add-PanguSpacing -InFile input.md -i
    # 讀取 input.md，處理後寫回 input.md

.EXAMPLE
    Add-PanguSpacing -InFile input.md -i -Encoding utf8BOM
    # 使用 UTF-8 with BOM 編碼處理檔案

.NOTES
    Version: 4.0.7
    Based on: https://github.com/vinta/pangu.js
    Requires: PowerShell 7+
    Author: Will 保哥
#>

#Requires -Version 7.0

[CmdletBinding(DefaultParameterSetName = 'TextSet')]
param(
    [Parameter(ParameterSetName = 'TextSet', Position = 0, ValueFromPipeline = $true)]
    [string]$Text,

    [Parameter(ParameterSetName = 'FileOutSet', Mandatory = $true)]
    [Parameter(ParameterSetName = 'InPlaceSet', Mandatory = $true)]
    [ValidateScript({ Test-Path $_ -PathType Leaf })]
    [string]$InFile,

    [Parameter(ParameterSetName = 'FileOutSet', Mandatory = $true)]
    [string]$OutFile,

    [Parameter(ParameterSetName = 'InPlaceSet')]
    [Alias('i')]
    [switch]$InPlaceEdit,

    [Parameter(ParameterSetName = 'FileOutSet')]
    [Parameter(ParameterSetName = 'InPlaceSet')]
    [ValidateSet('ascii', 'utf8', 'utf8NoBOM', 'utf8BOM', 'unicode', 'utf32', 'bigendianunicode')]
    [string]$Encoding = 'utf8NoBOM',

    [Parameter(ParameterSetName = 'TextSet')]
    [Parameter(ParameterSetName = 'FileOutSet')]
    [Parameter(ParameterSetName = 'InPlaceSet')]
    [switch]$StripMarkdown
)

begin {
    # ========================================
    # CJK 字符範圍定義
    # ========================================
    # CJK is an acronym for Chinese, Japanese, and Korean.
    #
    # CJK includes the following Unicode blocks:
    # \u2e80-\u2eff CJK Radicals Supplement
    # \u2f00-\u2fdf Kangxi Radicals
    # \u3040-\u309f Hiragana
    # \u30a0-\u30fa Katakana (不含 \u30fb 中間點)
    # \u30fc-\u30ff Katakana
    # \u3100-\u312f Bopomofo
    # \u3200-\u32ff Enclosed CJK Letters and Months
    # \u3400-\u4dbf CJK Unified Ideographs Extension A
    # \u4e00-\u9fff CJK Unified Ideographs
    # \uf900-\ufaff CJK Compatibility Ideographs

    $CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff'

    # ========================================
    # 正則表達式定義
    # ========================================

    # 檢測是否包含 CJK 字符
    $ANY_CJK = [regex]::new("[$CJK]")

    # URL 模式 (用於保護 URL 不被處理)
    $URL_PATTERN = [regex]::new(
        "https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=$CJK]*)",
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    # 點號處理
    $DOTS_CJK = [regex]::new("(\.{2,}|\u2026)([$CJK])")
    $FIX_CJK_COLON_ANS = [regex]::new("([$CJK]):([A-Z0-9\(\)])")

    # 引號處理 (` " ״)
    $CJK_QUOTE = [regex]::new('([' + $CJK + '])([`"\u05f4])')
    $QUOTE_CJK = [regex]::new('([`"\u05f4])([' + $CJK + '])')
    $FIX_QUOTE_ANY_QUOTE = [regex]::new('([`"\u05f4]+)\s*(.+?)\s*([`"\u05f4]+)')

    # 單引號處理
    $CJK_SINGLE_QUOTE_BUT_POSSESSIVE = [regex]::new("([$CJK])('[^s])")
    $SINGLE_QUOTE_CJK = [regex]::new("(')([$CJK])")
    $FIX_POSSESSIVE_SINGLE_QUOTE = [regex]::new("([A-Za-z0-9$CJK])( )('s)")

    # 井號處理
    $HASH_ANS_CJK_HASH = [regex]::new("([$CJK])(#)([$CJK]+)(#)([$CJK])")
    $CJK_HASH = [regex]::new("([$CJK])(#([^ ]))")
    $HASH_CJK = [regex]::new("(([^ ])#)([$CJK])")

    # 運算符處理 (+ - * / = & | < >)
    $CJK_OPERATOR_ANS = [regex]::new("([$CJK])([\+\-\*/=&\|<>])([A-Za-z0-9])")
    $ANS_OPERATOR_CJK = [regex]::new("([A-Za-z0-9])([\+\-\*/=&\|<>])([$CJK])")

    # 斜線修復
    $FIX_SLASH_AS = [regex]::new("([/]) ([a-z\-_\./]+)")
    $FIX_SLASH_AS_SLASH = [regex]::new("([/\.])([A-Za-z\-_\./]+) ([/])")

    # 括號處理
    $CJK_LEFT_BRACKET = [regex]::new("([$CJK])([\(\[\{<>\u201c])")
    $RIGHT_BRACKET_CJK = [regex]::new("([\)\]\}<>\u201d])([$CJK])")
    $FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET = [regex]::new("([\(\[\{<\u201c]+)\s*(.+?)\s*([\)\]\}>\u201d]+)")
    $ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = [regex]::new("([A-Za-z0-9$CJK])\s*([\u201c])([A-Za-z0-9$CJK\-_ ]+)([\u201d])")
    $LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = [regex]::new("([\u201c])([A-Za-z0-9$CJK\-_ ]+)([\u201d])\s*([A-Za-z0-9$CJK])")

    # 英數字與括號處理 (避免破壞空括號)
    $AN_LEFT_BRACKET_NOT_EMPTY = [regex]::new("([A-Za-z0-9])([\(\[\{])(?![\)\]\}])")
    $RIGHT_BRACKET_AN_NOT_EMPTY = [regex]::new("(?<![\(\[\{])([\)\]\}])([A-Za-z0-9])")

    # 核心 CJK-ANS 間距處理
    $CJK_ANS = [regex]::new("([$CJK])([A-Za-z\u0370-\u03ff0-9@\$%\^&\*\-\+\\=\|/\u00a1-\u00ff\u2150-\u218f\u2700-\u27bf])")
    $ANS_CJK = [regex]::new("([A-Za-z\u0370-\u03ff0-9~\$%\^&\*\-\+\\=\|/!;:,\.\?\u00a1-\u00ff\u2150-\u218f\u2700-\u27bf])([$CJK])")

    # 中間點統一
    $MIDDLE_DOT = [regex]::new("(\s*)([\u00b7\u2022\u2027])(\s*)")

    # ========================================
    # Markdown 語法移除定義
    # ========================================
    # TOC 標記
    $MD_TOC = [regex]::new('\[\[_TOC_\]\]|\[\[_TOSP_\]\]|\[TOC\]', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    # 程式碼區塊 (```...```)
    $MD_CODE_BLOCK = [regex]::new('```[a-zA-Z]*\r?\n([\s\S]*?)```', [System.Text.RegularExpressions.RegexOptions]::None)

    # 行內程式碼 (`code`)
    $MD_INLINE_CODE = [regex]::new('`([^`]+)`')

    # 粗體 (**text** 或 __text__)
    $MD_BOLD = [regex]::new('\*\*(.+?)\*\*|__(.+?)__')

    # 斜體 (*text*) - 僅支援星號格式
    $MD_ITALIC = [regex]::new('(?<!\*)\*([^*]+)\*(?!\*)')

    # 圖片 ![alt](url)
    $MD_IMAGE = [regex]::new('!\[[^\]]*\]\([^)]+\)')

    # 連結 [text](url)
    $MD_LINK = [regex]::new('\[([^\]]+)\]\([^)]+\)')

    # HTML 標籤
    $MD_HTML = [regex]::new('<[^>]+>')

    # ========================================
    # Markdown 移除函數
    # ========================================
    function Remove-MarkdownSyntax {
        param([string]$InputText)

        $result = $InputText

        # 1. 移除 TOC 標記
        $result = $MD_TOC.Replace($result, '')

        # 2. 程式碼區塊：移除 ``` 標記，保留內容
        $result = $MD_CODE_BLOCK.Replace($result, '$1')

        # 3. 移除圖片語法（完全移除）
        $result = $MD_IMAGE.Replace($result, '')

        # 4. 連結：保留文字
        $result = $MD_LINK.Replace($result, '$1')

        # 5. 粗體：移除 ** 或 __，保留內容
        $result = $MD_BOLD.Replace($result, { param($m) if ($m.Groups[1].Value) { $m.Groups[1].Value } else { $m.Groups[2].Value } })

        # 6. 斜體：移除 *，保留內容（在粗體處理後）
        $result = $MD_ITALIC.Replace($result, '$1')

        # 7. 行內程式碼：移除反引號，保留內容
        $result = $MD_INLINE_CODE.Replace($result, '$1')

        # 8. 移除 HTML 標籤
        $result = $MD_HTML.Replace($result, '')

        return $result
    }

    # ========================================
    # 核心處理函數
    # ========================================
    function Invoke-PanguSpacing {
        param([string]$InputText)

        # Markdown 語法移除（如果啟用）
        if ($script:StripMarkdown) {
            $InputText = Remove-MarkdownSyntax -InputText $InputText
        }

        # 前置檢查：如果沒有 CJK 字符或長度太短，直接返回
        if ($InputText.Length -le 1 -or -not $ANY_CJK.IsMatch($InputText)) {
            return $InputText
        }

        $newText = $InputText

        # URL 保護：將 URL 替換為佔位符
        $matchUrls = [System.Collections.Generic.List[string]]::new()
        $urlIndex = 0
        $newText = $URL_PATTERN.Replace($newText, {
            param($match)
            $matchUrls.Add($match.Value)
            $placeholder = "{$urlIndex}"
            $script:urlIndex++
            return $placeholder
        })

        # 點號處理
        $newText = $DOTS_CJK.Replace($newText, '$1 $2')
        $newText = $FIX_CJK_COLON_ANS.Replace($newText, '$1：$2')

        # 引號處理
        $newText = $CJK_QUOTE.Replace($newText, '$1 $2')
        $newText = $QUOTE_CJK.Replace($newText, '$1 $2')
        $newText = $FIX_QUOTE_ANY_QUOTE.Replace($newText, '$1$2$3')

        # 單引號處理
        $newText = $CJK_SINGLE_QUOTE_BUT_POSSESSIVE.Replace($newText, '$1 $2')
        $newText = $SINGLE_QUOTE_CJK.Replace($newText, '$1 $2')
        $newText = $FIX_POSSESSIVE_SINGLE_QUOTE.Replace($newText, "`$1's")

        # 井號處理
        $newText = $HASH_ANS_CJK_HASH.Replace($newText, '$1 $2$3$4 $5')
        $newText = $CJK_HASH.Replace($newText, '$1 $2')
        $newText = $HASH_CJK.Replace($newText, '$1 $3')

        # 運算符處理
        $newText = $CJK_OPERATOR_ANS.Replace($newText, '$1 $2 $3')
        $newText = $ANS_OPERATOR_CJK.Replace($newText, '$1 $2 $3')

        # 斜線修復
        $newText = $FIX_SLASH_AS.Replace($newText, '$1$2')
        $newText = $FIX_SLASH_AS_SLASH.Replace($newText, '$1$2$3')

        # 括號處理
        $newText = $CJK_LEFT_BRACKET.Replace($newText, '$1 $2')
        $newText = $RIGHT_BRACKET_CJK.Replace($newText, '$1 $2')
        $newText = $FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET.Replace($newText, '$1$2$3')
        $newText = $ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET.Replace($newText, '$1 $2$3$4')
        $newText = $LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK.Replace($newText, '$1$2$3 $4')

        # 英數字與括號處理 (避免破壞空括號如 func())
        $newText = $AN_LEFT_BRACKET_NOT_EMPTY.Replace($newText, '$1 $2')
        $newText = $RIGHT_BRACKET_AN_NOT_EMPTY.Replace($newText, '$1 $2')

        # 核心 CJK-ANS 間距處理
        $newText = $CJK_ANS.Replace($newText, '$1 $2')
        $newText = $ANS_CJK.Replace($newText, '$1 $2')

        # 中間點統一為片假名中間點
        $newText = $MIDDLE_DOT.Replace($newText, '・')

        # URL 還原
        $newText = [regex]::Replace($newText, '\{\d+\}', {
            param($match)
            $numMatch = [regex]::Match($match.Value, '\d+')
            if ($numMatch.Success) {
                $number = [int]$numMatch.Value
                if ($number -lt $matchUrls.Count -and $null -ne $matchUrls[$number]) {
                    return $matchUrls[$number]
                }
            }
            # 保留原始文字（例如 LaTeX 公式中的 {0}）
            return $match.Value
        })

        return $newText
    }
}

process {
    switch ($PSCmdlet.ParameterSetName) {
        'TextSet' {
            if ($Text) {
                Invoke-PanguSpacing -InputText $Text
            }
        }
        'FileOutSet' {
            $content = Get-Content -Path $InFile -Raw -Encoding $Encoding
            $result = Invoke-PanguSpacing -InputText $content
            Set-Content -Path $OutFile -Value $result -NoNewline -Encoding $Encoding
            Write-Verbose "已處理 '$InFile' 並寫入 '$OutFile'"
        }
        'InPlaceSet' {
            $content = Get-Content -Path $InFile -Raw -Encoding $Encoding
            $result = Invoke-PanguSpacing -InputText $content
            Set-Content -Path $InFile -Value $result -NoNewline -Encoding $Encoding
            Write-Verbose "已就地編輯 '$InFile'"
        }
    }
}

end {
    # 清理資源（如果需要）
}
