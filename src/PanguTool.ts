import * as vscode from 'vscode';
import { pangu } from './Pangu.js';
import { formatMarkdownContent, MarkdownLogger } from './MarkdownFormatter.js';

export interface IPanguToolParameters {
  text: string;
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
    const params = options.input as IPanguToolParameters | undefined;

    if (!params || typeof params.text !== 'string') {
      throw new Error('請提供有效的文本內容進行格式化。請確保使用正確的語法，例如：#pangu 要格式化的文字');
    }

    const { text } = params;
    const config = vscode.workspace.getConfiguration('pangu2');
    const enableLooseFormatting = config.get('enableLooseFormatting', false);

    const formatted = this.formatText(text, enableLooseFormatting);

    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(formatted),
    ]);
  }

  private formatText(text: string, enableLooseFormatting: boolean): string {
    if (this.isMarkdownContent(text)) {
      return this.formatMarkdown(text, enableLooseFormatting);
    }
    return pangu.spacing(text);
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
}