import { promises as fs } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { pangu } from './Pangu.js';
import { formatMarkdownContent, MarkdownLogger } from './MarkdownFormatter.js';

export interface IPanguToolParameters {
  text?: string;
  file?: string;
}

const noopLogger: MarkdownLogger = {
  appendLine: () => {},
};

export class PanguTool implements vscode.LanguageModelTool<IPanguToolParameters> {
  private readonly logger: MarkdownLogger;

  constructor(logger?: MarkdownLogger) {
    this.logger = logger ?? noopLogger;
  }

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<IPanguToolParameters>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const params = this.getInputParameters(options);

    const textParam = typeof params?.text === 'string' ? params.text : undefined;
    const fileParam = typeof params?.file === 'string' ? params.file : undefined;

    if ((!textParam && !fileParam) || (textParam && fileParam)) {
      throw new Error('請僅提供 text 或 file 其中一種參數進行格式化。例如：#pangu 要格式化的文字，或是指定 file 的絕對路徑。');
    }

    const config = vscode.workspace.getConfiguration('pangu2');
    const enableLooseFormatting = config.get('enableLooseFormatting', false);

    if (fileParam) {
      const formattedFromFile = await this.formatFile(fileParam, enableLooseFormatting);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(formattedFromFile),
      ]);
    }

    const formatted = this.formatText(textParam!, enableLooseFormatting);

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(formatted),
    ]);
  }

  private getInputParameters(
    options: vscode.LanguageModelToolInvocationOptions<IPanguToolParameters>
  ): IPanguToolParameters | undefined {
    if (options.input) {
      return options.input as IPanguToolParameters;
    }

    // 向後相容舊版測試程式中使用的 parameters 欄位
    const legacyOptions = options as unknown as { parameters?: IPanguToolParameters };
    return legacyOptions.parameters;
  }

  private formatText(text: string, enableLooseFormatting: boolean): string {
    if (this.isMarkdownContent(text)) {
      return this.formatMarkdown(text, enableLooseFormatting);
    }
    return pangu.spacing(text);
  }

  private async formatFile(filePath: string, enableLooseFormatting: boolean): Promise<string> {
    if (!path.isAbsolute(filePath)) {
      throw new Error('file 參數必須是檔案的絕對路徑。');
    }

    let originalText: string;
    try {
      originalText = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`無法讀取檔案：${this.getErrorMessage(error)}`);
    }

    const formatted = this.formatContentForFile(filePath, originalText, enableLooseFormatting);

    if (formatted !== originalText) {
      try {
        await fs.writeFile(filePath, formatted, 'utf8');
      } catch (error) {
        throw new Error(`無法寫入檔案：${this.getErrorMessage(error)}`);
      }
    }

    return formatted;
  }

  private formatContentForFile(
    filePath: string,
    text: string,
    enableLooseFormatting: boolean
  ): string {
    if (this.isMarkdownFile(filePath)) {
      return this.formatMarkdown(text, enableLooseFormatting);
    }

    return this.formatText(text, enableLooseFormatting);
  }

  private isMarkdownFile(filePath: string): boolean {
    const markdownExtensions = new Set([
      '.md',
      '.markdown',
      '.mdown',
      '.mkdn',
      '.mkd',
      '.mdx',
    ]);

    return markdownExtensions.has(path.extname(filePath).toLowerCase());
  }

  private isMarkdownContent(text: string): boolean {
    const markdownPatterns = [
      /^#{1,6}\s+/m,
      /^\*\*.*\*\*$/m,
      /^\*.*\*$/m,
      /^\[.*\]\(.*\)$/m,
      /^```/m,
      /^\|.*\|$/m,
      /^>\s+/m,
      /^[\-\*\+]\s+/m,
      /^\d+\.\s+/m,
      /^---/m,
      /^```[\s\S]*```$/m,
    ];

    return markdownPatterns.some((pattern) => pattern.test(text));
  }

  private formatMarkdown(text: string, enableLooseFormatting: boolean): string {
    const eol = /\r\n/.test(text) ? '\r\n' : '\n';

    const result = formatMarkdownContent(text, {
      enableLooseFormatting,
      protectDirectives: true,
      preserveWhitespace: false,
      originalText: text,
      originalEol: eol,
      logger: this.logger,
    });

    const metadata = result.metadata;
    this.logger.appendLine(
      `LM Tool formatter summary → directives:${metadata.directiveBlocks}, brackets:${metadata.bracketReplacements}, boldSpacing:${metadata.boldSpacingFixes}, colon:${metadata.colonFixes}, toc:${metadata.tocReplacements}, whitespace:${metadata.whitespaceRestored}`
    );

    return result.text;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}