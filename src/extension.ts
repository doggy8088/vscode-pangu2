import * as path from 'path';
import * as vscode from 'vscode';

import { pangu } from './Pangu.js';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkPangu from './remark-pangu.js';

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

function addSpace(
  e: vscode.TextEditor,
  d: vscode.TextDocument,
  sel: vscode.Selection[]
) {
  e.edit(function (edit: vscode.TextEditorEdit) {
    let parsed: string = '';
    for (var x = 0; x < sel.length; x++) {
      let txt: string = d.getText(new vscode.Range(sel[x].start, sel[x].end));
      switch (d.languageId) {
        case 'markdown':
          parsed = unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkFrontmatter, ['yaml', 'toml'])
            .use(remarkPangu(logger))
            .use(remarkStringify, {
              // https://github.com/remarkjs/remark/tree/main/packages/remark-stringify#options
              emphasis: '_',
              rule: '-',
            })
            .processSync(txt).toString();

          // TODO: 還不知道怎樣避免 remark 將 [[_TOC_]] 跳脫成 \[\[_TOC_]] 這種格式
          // https://github.com/orgs/remarkjs/discussions/1258
          // Support for AzureDevOpsWiki-specific syntax
          // https://learn.microsoft.com/en-us/azure/devops/project/wiki/wiki-markdown-guidance?view=azure-devops&WT.mc_id=DT-MVP-4015686#table-of-contents-toc-for-wiki-pages
          if (parsed.includes('\\[\\[_TOC_]]')) {
            parsed = parsed.replace('\\[\\[_TOC_]]', '[[_TOC_]]');
          }

          // TODO: 還不知道怎樣避免 remark 將 [[_TOSP_]] 跳脫成 \[\[_TOSP_]] 這種格式
          // https://github.com/orgs/remarkjs/discussions/1258
          // Support for AzureDevOpsWiki-specific syntax
          // https://learn.microsoft.com/en-us/azure/devops/project/wiki/wiki-markdown-guidance?view=azure-devops&WT.mc_id=DT-MVP-4015686#add-a-subpages-table
          if (parsed.includes('\\[\\[_TOSP_]]')) {
            parsed = parsed.replace('\\[\\[_TOSP_]]', '[[_TOSP_]]');
          }

          // TODO: 還不知道怎樣避免 remark 將 [[_TOC_]] 跳脫成 \[\[_TOC_]] 這種格式
          // https://github.com/orgs/remarkjs/discussions/1258
          // Support for HackMD-specific syntax
          // toc文章目錄生產
          // https://hackmd.io/@chiaoshin369/Shinbook/https%3A%2F%2Fhackmd.io%2F%40chiaoshin369%2Fhackmd#toc%E6%96%87%E7%AB%A0%E7%9B%AE%E9%8C%84%E7%94%9F%E7%94%A2
          if (parsed.toLowerCase().includes('\\[toc]')) {
            parsed = parsed.replace(/\\\[TOC\]/i, '[TOC]');
          }

          break;

        default:
          parsed = pangu.spacing(txt);
          break;
      }

      if (!!parsed && txt !== parsed) {
        // 如果 txt 結尾不是斷行符號，就把 parsed 的結尾斷行符號去掉
        if (txt.endsWith('\n') === false) {
          parsed = parsed.trimEnd();
        }

        edit.replace(sel[x], parsed);
      }
    }
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
    let sel = new vscode.Selection(
      new vscode.Position(0, 0),
      new vscode.Position(Number.MAX_VALUE, Number.MAX_VALUE)
    );
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
