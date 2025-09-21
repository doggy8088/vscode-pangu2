/**
 * 測試用的 Azure DevOps Wiki 處理器
 * 提供簡化的 API 來測試 directive 語法處理
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkPangu from './remark-pangu.js';
import remarkAzureDevOpsWiki from './remark-azure-devops-wiki.js';

// 簡化的 logger 介面
export interface SimpleLogger {
  messages: string[];
  appendLine(message: string): void;
  clear(): void;
  getMessages(): string[];
}

export function createTestLogger(): SimpleLogger {
  const messages: string[] = [];
  return {
    messages,
    appendLine(message: string) {
      messages.push(message);
    },
    clear() {
      messages.length = 0;
    },
    getMessages() {
      return [...messages];
    }
  };
}

/**
 * 測試用的文本處理器
 */
export class AzureDevOpsTestProcessor {
  private logger: SimpleLogger;
  
  constructor(enableDebug = false) {
    this.logger = enableDebug ? createTestLogger() : {
      messages: [],
      appendLine: () => {},
      clear: () => {},
      getMessages: () => []
    };
  }

  /**
   * 處理文本並返回結果與日誌
   */
  process(input: string): ProcessResult {
    this.logger.clear();
    
    try {
      const result = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkFrontmatter, ['yaml', 'toml'])
        .use(remarkAzureDevOpsWiki(this.logger))
        .use(remarkPangu(this.logger))
        .use(remarkStringify, {
          emphasis: '_',
          bullet: '-',
          rule: '-',
        })
        .processSync(input)
        .toString();

      return {
        input,
        output: result,
        success: true,
        logs: this.logger.getMessages(),
        error: null
      };
    } catch (error) {
      return {
        input,
        output: '',
        success: false,
        logs: this.logger.getMessages(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 檢查文本中的 directive 區塊
   */
  analyzeDirectives(input: string): DirectiveAnalysis {
    const lines = input.split('\n');
    const directives: DirectiveBlock[] = [];
    const normalTextLines: TextLine[] = [];
    
    let inDirective = false;
    let directiveType = '';
    let directiveStartLine = 0;

    lines.forEach((line, index) => {
      const directiveStart = line.match(/^:::[\s]*([a-zA-Z][a-zA-Z0-9-_]*)/);
      
      if (directiveStart) {
        inDirective = true;
        directiveType = directiveStart[1];
        directiveStartLine = index + 1;
      } else if (line.trim() === ':::' && inDirective) {
        directives.push({
          type: directiveType,
          startLine: directiveStartLine,
          endLine: index + 1,
          content: lines.slice(directiveStartLine - 1, index + 1)
        });
        inDirective = false;
        directiveType = '';
      } else if (!inDirective && line.trim() && !line.startsWith('#')) {
        // 檢查是否包含中文或英文，可能需要處理
        if (line.includes('text') || /[\u4e00-\u9fff]/.test(line) || /[a-zA-Z]/.test(line)) {
          normalTextLines.push({
            lineNumber: index + 1,
            content: line,
            shouldBeProcessed: true
          });
        }
      }
    });

    return {
      directives,
      normalTextLines,
      totalLines: lines.length
    };
  }

  /**
   * 比較處理前後的差異
   */
  compare(input: string, output: string): ComparisonResult {
    const analysis = this.analyzeDirectives(input);
    const preservedBlocks: boolean[] = [];
    const processedLines: boolean[] = [];

    // 檢查 directive 區塊是否被保留
    analysis.directives.forEach(directive => {
      const directiveContent = directive.content.join('\n');
      const isPreserved = output.includes(directiveContent);
      preservedBlocks.push(isPreserved);
    });

    // 檢查普通文本是否被處理（簡化檢查：看是否有空格被加入）
    analysis.normalTextLines.forEach(textLine => {
      const hasChineseEnglish = /[\u4e00-\u9fff].*[a-zA-Z]|[a-zA-Z].*[\u4e00-\u9fff]/.test(textLine.content);
      if (hasChineseEnglish) {
        // 檢查是否在輸出中有相應的空格
        const outputLines = output.split('\n');
        const correspondingLine = outputLines.find(line => 
          line.includes(textLine.content.replace(/([^\u4e00-\u9fff])([a-zA-Z])/g, '$1 $2'))
          || line.includes(textLine.content.replace(/([a-zA-Z])([^\u4e00-\u9fff])/g, '$1 $2'))
        );
        processedLines.push(!!correspondingLine);
      } else {
        processedLines.push(true); // 不需要處理的行認為是正確的
      }
    });

    return {
      directivesPreserved: preservedBlocks,
      normalTextProcessed: processedLines,
      allDirectivesPreserved: preservedBlocks.every(preserved => preserved),
      allNormalTextProcessed: processedLines.every(processed => processed),
      overallSuccess: preservedBlocks.every(preserved => preserved) && 
                      processedLines.every(processed => processed)
    };
  }
}

// 型別定義
export interface ProcessResult {
  input: string;
  output: string;
  success: boolean;
  logs: string[];
  error: string | null;
}

export interface DirectiveBlock {
  type: string;
  startLine: number;
  endLine: number;
  content: string[];
}

export interface TextLine {
  lineNumber: number;
  content: string;
  shouldBeProcessed: boolean;
}

export interface DirectiveAnalysis {
  directives: DirectiveBlock[];
  normalTextLines: TextLine[];
  totalLines: number;
}

export interface ComparisonResult {
  directivesPreserved: boolean[];
  normalTextProcessed: boolean[];
  allDirectivesPreserved: boolean;
  allNormalTextProcessed: boolean;
  overallSuccess: boolean;
}