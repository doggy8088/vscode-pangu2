import * as vscode from 'vscode';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkPangu from './remark-pangu.js';
import { pangu } from './Pangu.js';

export interface IPanguToolParameters {
  text: string;
  enableLooseFormatting?: boolean;
}

export class PanguTool implements vscode.LanguageModelTool<IPanguToolParameters> {
  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IPanguToolParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    try {
      const params = options.input as IPanguToolParameters;
      const { text, enableLooseFormatting = false } = params;

      if (!text || typeof text !== 'string') {
        throw new Error('請提供有效的文本內容進行格式化');
      }

      let formatted = this.formatText(text, enableLooseFormatting);

      // 如果原文本結尾不是斷行符號，就把格式化後的結尾斷行符號去掉
      if (text.endsWith('\n') === false) {
        formatted = formatted.trimEnd();
      }

      const result = new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`已完成盤古之白格式化：\n\n\`\`\`\n${formatted}\n\`\`\``)
      ]);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '格式化過程中發生未知錯誤';
      throw new Error(`盤古之白格式化失敗：${errorMessage}`);
    }
  }

  private formatText(text: string, enableLooseFormatting: boolean): string {
    // 檢測是否為 Markdown 內容
    const isMarkdown = this.isMarkdownContent(text);

    if (isMarkdown) {
      return this.formatMarkdown(text, enableLooseFormatting);
    } else {
      return pangu.spacing(text);
    }
  }

  private isMarkdownContent(text: string): boolean {
    // 簡單的 Markdown 內容檢測
    const markdownPatterns = [
      /^#{1,6}\s+/m,      // 標題
      /^\*\*.*\*\*$/m,    // 粗體
      /^\*.*\*$/m,        // 斜體
      /^\[.*\]\(.*\)$/m,  // 連結
      /^```/m,            // 程式碼區塊
      /^\|.*\|$/m,        // 表格
      /^>\s+/m,           // 引用
      /^[\-\*\+]\s+/m,    // 清單
      /^\d+\.\s+/m,       // 有序清單
      /^---/m,            // 分隔線
      /^```[\s\S]*```$/m  // 程式碼區塊
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  }

  private formatMarkdown(text: string, enableLooseFormatting: boolean): string {
    let formatted = text;

    //#region 處理 LLM 常見的輸出問題
    // 使用正則表達式逐一取代每一組對稱的左右括號，處理同一行中的多組括號情況
    const lines = formatted.split('\n');
    for (let i = 0; i < lines.length; i++) {
      lines[i] = lines[i].replace(/（([^）]+)）/g, (match, content) => {
        return '(' + content + ')';
      });
    }
    formatted = lines.join('\n');

    // 內容，**內容（Content）**內容
    if (/[\)）]\*\*[^\p{P}]/u.test(formatted)) {
      formatted = formatted.replace(/([\)）]\*\*)([^\p{P}])/gu, '$1 $2');
    }
    // 1. **標題：**內容
    if (/[:：]\*\*[^\p{P}]/u.test(formatted)) {
      formatted = formatted.replace(/([:：])(\*\*)([^\p{P}])/gu, '$2$1$3');
    }
    //#endregion

    const processed = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkFrontmatter, ['yaml', 'toml'])
      .use(remarkPangu(vscode.window.createOutputChannel('盤古之白')))
      .use(remarkStringify, {
        emphasis: '_',
        bullet: '-',
        rule: '-',
      })
      .processSync(formatted)
      .toString();

    let result = processed;

    // 處理 Azure DevOps Wiki 特殊語法
    if (result.includes('\\[\\[_TOC_]]')) {
      result = result.replace('\\[\\[_TOC_]]', '[[_TOC_]]');
    }
    if (result.includes('\\[\\[_TOSP_]]')) {
      result = result.replace('\\[\\[_TOSP_]]', '[[_TOSP_]]');
    }
    // 處理 HackMD 特殊語法
    if (result.toLowerCase().includes('\\[toc]')) {
      result = result.replace(/\\\[TOC\]/i, '[TOC]');
    }

    // 應用鬆散格式化（如果啟用）
    if (enableLooseFormatting) {
      result = this.applyLooseFormatting(result);
    }

    return result;
  }

  private applyLooseFormatting(text: string): string {
    let result = text;

    // 處理底線跳脫 - 更寬鬆的取消跳脫
    // 只保留明顯強調模式的跳脫（周圍有空白）
    result = result.replace(/\\(_)/g, (match, underscore, offset, string) => {
      const beforeChar = offset > 0 ? string[offset - 1] : '';
      const afterChar = offset + 2 < string.length ? string[offset + 2] : '';

      // 如果在識別符/檔案名稱環境中取消跳脫（兩邊都是字母數字）
      if (/[a-zA-Z0-9]/.test(beforeChar) && /[a-zA-Z0-9]/.test(afterChar)) {
        return underscore;
      }

      // 如果在字詞開始/結束處取消跳脫（不是兩邊都被非空白字元包圍）
      if (!/\S/.test(beforeChar) || !/\S/.test(afterChar)) {
        return underscore;
      }

      // 在鬆散模式下，其他情況也取消跳脫（寬鬆）
      return underscore;
    });

    // 處理方括號跳脫 - 標題和簡單情況下取消跳脫
    result = result.replace(/\\(\[)/g, (match, bracket, offset, string) => {
      // 在標題開始處總是取消跳脫方括號
      const beforeContext = string.substring(Math.max(0, offset - 10), offset + 2);
      if (/^#+ \\?\[/.test(beforeContext.trim())) {
        return bracket;
      }

      // 如果後面沒有閉合方括號和連結模式則取消跳脫
      const afterContext = string.substring(offset + 2, Math.min(string.length, offset + 50));
      if (!afterContext.match(/^[^\]]*\]\s*[\(\[]/)) {
        return bracket;
      }

      // 保留可能的連結模式的跳脫
      return match;
    });

    return result;
  }
}