import * as path from 'path';
import * as vscode from 'vscode';

import { pangu } from './Pangu.js';
import { PanguTool } from './PanguTool.js';
import { formatMarkdownContent } from './MarkdownFormatter.js';

let logger: vscode.OutputChannel;

export function activate(ctx: vscode.ExtensionContext) {
  logger = vscode.window.createOutputChannel('盤古之白');
  logger.appendLine('盤古之白已啟動');

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'pangu2.add_space_selection',
      addSpaceSelection
    )
  );
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'pangu2.add_space_whole',
      addSpaceWholeDocument
    )
  );

  try {
    ctx.subscriptions.push(
      vscode.lm.registerTool('pangu2_format_text', new PanguTool(logger))
    );
    logger.appendLine('盤古之白 Language Model Tool 已註冊');
  } catch (error) {
    logger.appendLine(`註冊 Language Model Tool 失敗: ${error}`);
  }

  ctx.subscriptions.push(new Watcher());
}

export function deactivate() {}

function addSpace(
  e: vscode.TextEditor,
  d: vscode.TextDocument,
  sel: vscode.Selection[]
) {
  e.edit((edit: vscode.TextEditorEdit) => {
    let parsed = '';

    for (let x = 0; x < sel.length; x++) {
      const range = new vscode.Range(sel[x].start, sel[x].end);
      const txt = d.getText(range);

      logger.appendLine(`\n🔍 Selection ${x + 1}/${sel.length}:`);
      logger.appendLine(`  Range: (${sel[x].start.line},${sel[x].start.character}) → (${sel[x].end.line},${sel[x].end.character})`);
      logger.appendLine(`  Language: ${d.languageId}`);
      logger.appendLine(`  Input length: ${txt.length} chars, ${txt.split('\n').length} lines`);
      logger.appendLine(`  Input preview: ${JSON.stringify(txt.substring(0, 100))}${txt.length > 100 ? '...' : ''}`);

      switch (d.languageId) {
        case 'markdown': {
          const config = vscode.workspace.getConfiguration('pangu2');
          const enableLooseFormatting = config.get('enableLooseFormatting', false);

          logger.appendLine('  📄 Markdown processing mode');
          logger.appendLine(`  ⚙️  Loose formatting enabled: ${enableLooseFormatting}`);

          const formatResult = formatMarkdownContent(txt, {
            enableLooseFormatting,
            protectDirectives: true,
            preserveWhitespace: true,
            originalText: txt,
            originalEol: d.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n',
            logger,
          });

          parsed = formatResult.text;

          const metadata = formatResult.metadata;
          logger.appendLine(
            `  📊 Formatter summary → directives:${metadata.directiveBlocks}, brackets:${metadata.bracketReplacements}, boldSpacing:${metadata.boldSpacingFixes}, colon:${metadata.colonFixes}, toc:${metadata.tocReplacements}, whitespace:${metadata.whitespaceRestored}`
          );
          break;
        }

        case 'latex':
        case 'tex': {
          logger.appendLine('  📐 LaTeX processing mode');
          parsed = pangu.spacing(txt, { latexMode: true });
          logger.appendLine('  ✅ Pangu spacing applied with LaTeX protection');
          logger.appendLine(`  📊 Result: ${parsed.length} chars, ${parsed.split('\n').length} lines`);
          break;
        }

        default:
          logger.appendLine('  📝 Plain text processing mode');
          parsed = pangu.spacing(txt);
          logger.appendLine('  ✅ Pangu spacing applied');
          logger.appendLine(`  📊 Result: ${parsed.length} chars, ${parsed.split('\n').length} lines`);
          break;
      }

      logger.appendLine('  🔍 Final comparison:');
      logger.appendLine(`  📥 Input changed: ${txt !== d.getText(range)}`);
      logger.appendLine(`  📤 Output different from input: ${!!parsed && txt !== parsed}`);

      if (!!parsed && txt !== parsed) {
        if (!txt.endsWith('\n')) {
          const beforeTrim = parsed;
          parsed = parsed.trimEnd();
          if (beforeTrim !== parsed) {
            logger.appendLine('  ✂️  Trimmed ending newline (original had no ending newline)');
          }
        }

        logger.appendLine(`  ✅ Applying replacement to selection ${x + 1}`);
        logger.appendLine(`  📊 Final result: ${parsed.length} chars, ${parsed.split('\n').length} lines`);
        edit.replace(sel[x], parsed);
      } else {
        logger.appendLine(`  ➡️  No changes needed for selection ${x + 1}`);
      }
    }

    logger.appendLine(`\n🏁 Processing completed for ${sel.length} selection(s)`);
  });
}

function addSpaceSelection() {
  const e = vscode.window.activeTextEditor;
  if (e) {
    const d = e.document;
    const sels = e.selections;
    addSpace(e, d, [...sels]);
  }
}

function addSpaceWholeDocument() {
  const e = vscode.window.activeTextEditor;
  if (e) {
    const d = e.document;
    const end = d.lineCount > 0
      ? d.lineAt(d.lineCount - 1).range.end
      : new vscode.Position(0, 0);
    const sel = new vscode.Selection(new vscode.Position(0, 0), end);
    addSpace(e, d, [sel]);
  }
}

class Watcher {
  private _disposable!: vscode.Disposable;
  private _config!: vscode.WorkspaceConfiguration;
  private _whitelist: Array<string> = [];

  public getConfig() {
    this._config = vscode.workspace.getConfiguration('pangu2');
  }

  constructor() {
    this.getConfig();

    const subscriptions: vscode.Disposable[] = [];
    this._disposable = vscode.Disposable.from(...subscriptions);
    vscode.workspace.onDidSaveTextDocument(
      this._onDidSaveDoc,
      this,
      subscriptions
    );

    vscode.workspace.onDidChangeConfiguration((event) => {
      const affected = event.affectsConfiguration('pangu2');
      if (affected) {
        this.getConfig();
      }
    });
  }

  dispose() {
    this._disposable.dispose();
  }

  _onDidSaveDoc(e: vscode.TextDocument) {
    if (this._config.get('autoAddSpaceOnSave', false)) {
      const ext = path.extname(e.fileName).toLowerCase();
      const extWithoutDot = ext.startsWith('.') ? ext.substring(1) : ext;

      this._whitelist = this._config.get('autoAddSpaceOnSaveFileExtensions', [
        '.txt',
      ]);
      this._whitelist = this._whitelist.map((i) => i.toLowerCase());

      if (
        this._whitelist.includes('*') ||
        this._whitelist.includes(ext) ||
        this._whitelist.includes(extWithoutDot)
      ) {
        addSpaceWholeDocument();
      }
    }
  }
}
