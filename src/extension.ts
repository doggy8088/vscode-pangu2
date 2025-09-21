import * as path from 'path';
import * as vscode from 'vscode';

import { pangu } from './Pangu.js';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkPangu from './remark-pangu.js';
import remarkAzureDevOpsWiki from './remark-azure-devops-wiki.js';

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
  ctx.subscriptions.push(new Watcher());
}

export function deactivate() {}

/**
 * Apply loose formatting to reduce unnecessary escaping
 * @param text The markdown text processed by remark
 * @returns Text with reduced escaping
 */
function applyLooseFormatting(text: string): string {
  let result = text;

  // Handle underscore escaping - be more permissive about unescaping
  // Only keep escaping for obvious emphasis patterns with surrounding whitespace
  result = result.replace(/\\(_)/g, (match, underscore, offset, string) => {
    const beforeChar = offset > 0 ? string[offset - 1] : '';
    const afterChar = offset + 2 < string.length ? string[offset + 2] : '';

    // Unescape if it's clearly in identifier/filename context (alphanumeric on both sides)
    if (/[a-zA-Z0-9]/.test(beforeChar) && /[a-zA-Z0-9]/.test(afterChar)) {
      return underscore;
    }

    // Unescape if it's at the start/end of a word (not surrounded by non-whitespace on both sides)
    if (!/\S/.test(beforeChar) || !/\S/.test(afterChar)) {
      return underscore;
    }

    // For everything else in loose mode, also unescape (be permissive)
    return underscore;
  });

  // Handle square bracket escaping - unescape for headings and simple cases
  result = result.replace(/\\(\[)/g, (match, bracket, offset, string) => {
    // Always unescape brackets at the start of headings
    const beforeContext = string.substring(Math.max(0, offset - 10), offset + 2);
    if (/^#+ \\?\[/.test(beforeContext.trim())) {
      return bracket;
    }

    // Unescape if not followed by a closing bracket and link pattern
    const afterContext = string.substring(offset + 2, Math.min(string.length, offset + 50));
    if (!afterContext.match(/^[^\]]*\]\s*[\(\[]/)) {
      return bracket;
    }

    // Keep escaping for potential link patterns
    return match;
  });

  // Handle tilde escaping - only unescape single tildes, preserve double tildes for strikethrough
  result = result.replace(/\\(~)/g, (match, tilde, offset, string) => {
    // Look for the pattern of escaped tildes: \~\~ at the start and \~\~ at the end
    // We need to preserve these for strikethrough syntax

    // Check if this is the start of a double tilde (\~\~)
    const nextChars = string.substring(offset + 2, offset + 4);
    if (nextChars === '\\~') {
      // This is the first tilde in \~\~ - keep it escaped if there's a matching \~\~ later
      const restOfString = string.substring(offset + 4);
      if (restOfString.includes('\\~\\~')) {
        return match; // Keep escaped, this is strikethrough syntax
      }
    }

    // Check if this is the second tilde in a starting double tilde (\~\~)
    const prevChars = string.substring(offset - 2, offset);
    if (prevChars === '\\~') {
      // This is the second tilde in \~\~ - keep it escaped if there's a matching \~\~ later
      const restOfString = string.substring(offset + 2);
      if (restOfString.includes('\\~\\~')) {
        return match; // Keep escaped, this is strikethrough syntax
      }
    }

    // Check if this is part of a closing double tilde
    const afterChars = string.substring(offset + 2, offset + 4);
    const beforeTwoChars = string.substring(offset - 2, offset);
    if (afterChars === '\\~' || beforeTwoChars === '\\~') {
      // Look backwards to see if there's an opening \~\~
      const textBefore = string.substring(0, offset - 2);
      if (textBefore.includes('\\~\\~')) {
        return match; // Keep escaped, this is part of strikethrough syntax
      }
    }

    // For single tildes that are not part of strikethrough, unescape them
    return tilde;
  });

  return result;
}

function addSpace(
  e: vscode.TextEditor,
  d: vscode.TextDocument,
  sel: vscode.Selection[]
) {
  e.edit(function (edit: vscode.TextEditorEdit) {
    let parsed: string = '';
    for (var x = 0; x < sel.length; x++) {
      let txt: string = d.getText(new vscode.Range(sel[x].start, sel[x].end));

      // Debug log: Selection info
      logger.appendLine(`\n🔍 Selection ${x + 1}/${sel.length}:`);
      logger.appendLine(`  Range: (${sel[x].start.line},${sel[x].start.character}) → (${sel[x].end.line},${sel[x].end.character})`);
      logger.appendLine(`  Language: ${d.languageId}`);
      logger.appendLine(`  Input length: ${txt.length} chars, ${txt.split('\n').length} lines`);
      logger.appendLine(`  Input preview: ${JSON.stringify(txt.substring(0, 100))}${txt.length > 100 ? '...' : ''}`);

      switch (d.languageId) {
        case 'markdown':
          // Get configuration for loose formatting
          const config = vscode.workspace.getConfiguration('pangu2');
          const enableLooseFormatting = config.get('enableLooseFormatting', false);

          logger.appendLine(`  📄 Markdown processing mode`);
          logger.appendLine(`  ⚙️  Loose formatting enabled: ${enableLooseFormatting}`);

          //#region 保護 directive 區塊（在 remark 處理之前）

          logger.appendLine(`  �️ Protecting directive blocks before remark processing...`);

          // 使用特殊標記來保護 directive 區塊
          const DIRECTIVE_PLACEHOLDER = '。。。DIRECTIVE。BLOCK。';
          const directiveBlocks: string[] = [];
          let protectedText = txt;

          // 找出所有的 directive 區塊並替換為佔位符
          const directiveRegex = /^(:::[\s]*[a-zA-Z][a-zA-Z0-9-_]*(?:\s+.*)?)\n([\s\S]*?)^:::$/gm;
          protectedText = protectedText.replace(directiveRegex, (match, start, content) => {
            const blockIndex = directiveBlocks.length;
            directiveBlocks.push(match); // 保存完整的原始區塊
            logger.appendLine(`    📦 Stored directive block ${blockIndex}: ${start.trim()}`);
            logger.appendLine(`    � Block content preview: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
            return `${DIRECTIVE_PLACEHOLDER}${blockIndex}。。。`;
          });

          if (directiveBlocks.length > 0) {
            logger.appendLine(`  ✅ Protected ${directiveBlocks.length} directive blocks`);
          } else {
            logger.appendLine(`  ➡️  No directive blocks found`);
          }

          //#endregion

          //#region 處理 LLM 常見的輸出問題

          logger.appendLine(`  🔧 Pre-processing LLM output issues...`);
          const originalTxt = protectedText;

          // 使用正則表達式逐一取代每一組對稱的左右括號，處理同一行中的多組括號情況
          let bracketReplacements = 0;
          const lines = protectedText.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const before = lines[i];
            lines[i] = lines[i].replace(/（([^）]+)）/g, (match, content) => {
              bracketReplacements++;
              return '(' + content + ')';
            });
            if (before !== lines[i]) {
              logger.appendLine(`    Line ${i + 1}: 全形括號替換 "${before}" → "${lines[i]}"`);
            }
          }
          protectedText = lines.join('\n');

          // 內容，**內容（Content）**內容
          let boldSpacingFixes = 0;
          if (/[\)）]\*\*[^\p{P}]/u.test(protectedText)) {
            const before = protectedText;
            protectedText = protectedText.replace(/([\)）]\*\*)([^\p{P}])/gu, '$1 $2');
            if (before !== protectedText) {
              boldSpacingFixes++;
              logger.appendLine(`    ✅ Applied bold spacing fixes`);
            }
          }

          // 1. **標題：**內容
          let colonFixes = 0;
          if (/[:：]\*\*[^\p{P}]/u.test(protectedText)) {
            const before = protectedText;
            protectedText = protectedText.replace(/([:：])(\*\*)([^\p{P}])/gu, '$2$1$3');
            if (before !== protectedText) {
              colonFixes++;
              logger.appendLine(`    ✅ Applied bold colon fixes`);
            }
          }

          if (originalTxt !== protectedText) {
            logger.appendLine(`  ✅ Pre-processing completed:`);
            logger.appendLine(`    - Bracket replacements: ${bracketReplacements}`);
            logger.appendLine(`    - Bold spacing fixes: ${boldSpacingFixes}`);
            logger.appendLine(`    - Colon fixes: ${colonFixes}`);
          } else {
            logger.appendLine(`  ➡️  No pre-processing changes needed`);
          }

          // 更新處理文字為保護後的版本
          txt = protectedText;

          //#endregion

          logger.appendLine(`  🚀 Starting remark processing pipeline...`);
          const beforeRemarkTxt = txt;

          parsed = unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkFrontmatter, ['yaml', 'toml'])
            .use(remarkAzureDevOpsWiki(logger))  // Enable Azure DevOps Wiki plugin BEFORE pangu
            .use(remarkPangu(logger))
            .use(remarkStringify, {
              // https://github.com/remarkjs/remark/tree/main/packages/remark-stringify#options
              emphasis: '_',
              bullet: '-',
              rule: '-',
            })
            .processSync(txt)
            .toString();

          logger.appendLine(`  ✅ Remark processing completed`);

          //#region 還原 directive 區塊

          if (directiveBlocks.length > 0) {
            logger.appendLine(`  � Restoring directive blocks...`);

            // 還原所有的 directive 區塊
            parsed = parsed.replace(new RegExp(`${DIRECTIVE_PLACEHOLDER}(\\d+)。。。`, 'g'), (match, index) => {
              const blockIndex = parseInt(index);
              if (blockIndex < directiveBlocks.length) {
                logger.appendLine(`    � Restored directive block ${blockIndex}`);
                return directiveBlocks[blockIndex];
              }
              return match;
            });

            logger.appendLine(`  ✅ Restored ${directiveBlocks.length} directive blocks`);
          }

          //#endregion

          // Apply loose formatting if enabled

          // TODO: 還不知道怎樣避免 remark 將 [[_TOC_]] 跳脫成 \[\[_TOC_]] 這種格式
          // https://github.com/orgs/remarkjs/discussions/1258
          // Support for AzureDevOpsWiki-specific syntax
          // https://learn.microsoft.com/en-us/azure-devops/project/wiki/wiki-markdown-guidance?view=azure-devops&WT.mc_id=DT-MVP-4015686#table-of-contents-toc-for-wiki-pages
          let tocReplacements = 0;
          if (parsed.includes('\\[\\[_TOC_]]')) {
            parsed = parsed.replace('\\[\\[_TOC_]]', '[[_TOC_]]');
            tocReplacements++;
            logger.appendLine(`  🔧 Fixed Azure DevOps TOC syntax escaping`);
          }

          // TODO: 還不知道怎樣避免 remark 將 [[_TOSP_]] 跳脫成 \[\[_TOSP_]] 這種格式
          // https://github.com/orgs/remarkjs/discussions/1258
          // Support for AzureDevOpsWiki-specific syntax
          // https://learn.microsoft.com/en-us/azure-devops/project/wiki/wiki-markdown-guidance?view=azure-devops&WT.mc_id=DT-MVP-4015686#add-a-subpages-table
          if (parsed.includes('\\[\\[_TOSP_]]')) {
            parsed = parsed.replace('\\[\\[_TOSP_]]', '[[_TOSP_]]');
            tocReplacements++;
            logger.appendLine(`  🔧 Fixed Azure DevOps TOSP syntax escaping`);
          }

          // TODO: 還不知道怎樣避免 remark 將 [[_TOC_]] 跳脫成 \[\[_TOC_]] 這種格式
          // https://github.com/orgs/remarkjs/discussions/1258
          // Support for HackMD-specific syntax
          // toc文章目錄生產
          // https://hackmd.io/@chiaoshin369/Shinbook/https%3A%2F%2Fhackmd.io%2F%40chiaoshin369%2Fhackmd#toc%E6%96%87%E7%AB%A0%E7%9B%AE%E9%8C%84%E7%94%9F%E7%94%A2
          if (parsed.toLowerCase().includes('\\[toc]')) {
            parsed = parsed.replace(/\\\[TOC\]/i, '[TOC]');
            tocReplacements++;
            logger.appendLine(`  🔧 Fixed HackMD TOC syntax escaping`);
          }

          if (tocReplacements === 0) {
            logger.appendLine(`  ➡️  No TOC syntax fixes needed`);
          }

          // Apply loose formatting if enabled
          if (enableLooseFormatting) {
            logger.appendLine(`  🎨 Applying loose formatting...`);
            const beforeLoose = parsed;
            parsed = applyLooseFormatting(parsed);
            if (beforeLoose !== parsed) {
              logger.appendLine(`  ✅ Loose formatting applied (changed)`);
            } else {
              logger.appendLine(`  ➡️  Loose formatting applied (no changes)`);
            }
          } else {
            logger.appendLine(`  ⏭️  Loose formatting disabled`);
          }

          // Preserve indentation on whitespace-only lines
          // When processing the whole document, remark-stringify normalizes blank lines
          // and removes leading spaces on lines that contain only whitespace. For users
          // who intentionally keep indentation on blank lines (visual alignment), we
          // restore those prefix spaces when the line mapping stays 1:1.
          logger.appendLine(`  🔧 Checking whitespace-only line preservation...`);
          try {
            const origEol = d.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const parsedHasFinalNl = /\r?\n$/.test(parsed);
            const origLines = txt.split(/\r?\n/);
            let newLines = parsed.split(/\r?\n/);

            logger.appendLine(`  📐 Original EOL: ${origEol === '\r\n' ? 'CRLF' : 'LF'}`);
            logger.appendLine(`  📐 Original lines: ${origLines.length}, New lines: ${newLines.length}`);
            logger.appendLine(`  📐 Parsed has final newline: ${parsedHasFinalNl}`);

            if (origLines.length === newLines.length) {
              let restoredCount = 0;
              for (let i = 0; i < origLines.length; i++) {
                // If original line is whitespace-only (contains at least one space or tab)
                // and the new line became an empty string, restore original whitespace.
                if (/^[\t ]+$/.test(origLines[i]) && newLines[i] === '') {
                  logger.appendLine(`  🔄 Line ${i + 1}: Restoring whitespace "${origLines[i]}" (length: ${origLines[i].length})`);
                  newLines[i] = origLines[i];
                  restoredCount++;
                }
              }

              if (restoredCount > 0) {
                parsed = newLines.join(origEol) + (parsedHasFinalNl ? origEol : '');
                logger.appendLine(`  ✅ Restored ${restoredCount} whitespace-only lines`);
              } else {
                logger.appendLine(`  ➡️  No whitespace-only lines needed restoration`);
              }
            } else {
              logger.appendLine(`  ⚠️  Line count mismatch - skipping whitespace preservation`);
            }
          } catch (error) {
            // Best-effort preservation; ignore if anything goes wrong
            logger.appendLine(`  ❌ Error in whitespace preservation: ${error}`);
          }

          break;

        default:
          logger.appendLine(`  📝 Plain text processing mode`);
          parsed = pangu.spacing(txt);
          logger.appendLine(`  ✅ Pangu spacing applied`);
          logger.appendLine(`  📊 Result: ${parsed.length} chars, ${parsed.split('\n').length} lines`);
          break;
      }

      logger.appendLine(`  🔍 Final comparison:`);
      logger.appendLine(`  📥 Input changed: ${txt !== d.getText(new vscode.Range(sel[x].start, sel[x].end))}`);
      logger.appendLine(`  📤 Output different from input: ${!!parsed && txt !== parsed}`);

      if (!!parsed && txt !== parsed) {
        // 如果 txt 結尾不是斷行符號，就把 parsed 的結尾斷行符號去掉
        const hadEndingNewline = txt.endsWith('\n');
        if (!hadEndingNewline) {
          const beforeTrim = parsed;
          parsed = parsed.trimEnd();
          if (beforeTrim !== parsed) {
            logger.appendLine(`  ✂️  Trimmed ending newline (original had no ending newline)`);
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
  let e = vscode.window.activeTextEditor;
  if (e) {
    let d = e.document;
    let sels = e.selections;
    addSpace(e, d, [...sels]);
  }
}

function addSpaceWholeDocument() {
  let e = vscode.window.activeTextEditor;
  if (e) {
    let d = e.document;
    const end = d.lineCount > 0
      ? d.lineAt(d.lineCount - 1).range.end
      : new vscode.Position(0, 0);
    let sel = new vscode.Selection(new vscode.Position(0, 0), end);
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

    let subscriptions: vscode.Disposable[] = [];
    this._disposable = vscode.Disposable.from(...subscriptions);
    vscode.workspace.onDidSaveTextDocument(
      this._onDidSaveDoc,
      this,
      subscriptions
    );

    vscode.workspace.onDidChangeConfiguration((event) => {
      let affected = event.affectsConfiguration('pangu2');
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
      var ext = path.extname(e.fileName).toLowerCase();
      var ext_without_dot = ext.startsWith('.') ? ext.substring(1) : ext;

      this._whitelist = this._config.get('autoAddSpaceOnSaveFileExtensions', [
        '.txt',
      ]);
      this._whitelist = this._whitelist.map((i) => i.toLowerCase());

      if (
        this._whitelist.includes('*') ||
        this._whitelist.includes(ext) ||
        this._whitelist.includes(ext_without_dot)
      ) {
        addSpaceWholeDocument();
      }
    }
  }
}
