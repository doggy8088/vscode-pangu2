import { pangu } from './Pangu';
import path = require('path');
import vscode = require('vscode');

export function activate(ctx: vscode.ExtensionContext) {
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
    for (var x = 0; x < sel.length; x++) {
      let txt: string = d.getText(new vscode.Range(sel[x].start, sel[x].end));
      let parsed: string = pangu.spacing(txt);
      if (txt !== parsed) {
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
