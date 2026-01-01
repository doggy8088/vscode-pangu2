// CJK is an acronym for Chinese, Japanese, and Korean.
//
// CJK includes the following Unicode blocks:
// \u2e80-\u2eff CJK Radicals Supplement
// \u2f00-\u2fdf Kangxi Radicals
// \u3040-\u309f Hiragana
// \u30a0-\u30ff Katakana
// \u3100-\u312f Bopomofo
// \u3200-\u32ff Enclosed CJK Letters and Months
// \u3400-\u4dbf CJK Unified Ideographs Extension A
// \u4e00-\u9fff CJK Unified Ideographs
// \uf900-\ufaff CJK Compatibility Ideographs
//
// For more information about Unicode blocks, see
// http://unicode-table.com/en/
// https://github.com/vinta/pangu
//
// all J below does not include \u30fb
const CJK =
  '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
// ANS is short for Alphabets, Numbers, and Symbols.
//
// A includes A-Za-z\u0370-\u03ff
// N includes 0-9
// S includes `~!@#$%^&*()-_=+[]{}\|;:'",<.>/?
//
// some S below does not include all symbols
const ANY_CJK = new RegExp(`[${CJK}]`);
// the symbol part only includes ~ ! ; : , . ? but . only matches one character
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK = new RegExp(
  `([${CJK}])[ ]*([\\:]+|\\.)[ ]*([${CJK}])`,
  'g'
);
const CONVERT_TO_FULLWIDTH_CJK_SYMBOLS = new RegExp(
  `([${CJK}])[ ]*([~\\!;,\\?]+)[ ]*`,
  'g'
);
const DOTS_CJK = new RegExp(`([\\.]{2,}|\u2026)([${CJK}])`, 'g');
const FIX_CJK_COLON_ANS = new RegExp(`([${CJK}])\\:([A-Z0-9\\(\\)])`, 'g');
// the symbol part does not include '
const CJK_QUOTE = new RegExp(`([${CJK}])([\`"\u05f4])`, 'g');
const QUOTE_CJK = new RegExp(`([\`"\u05f4])([${CJK}])`, 'g');
const FIX_QUOTE_ANY_QUOTE = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g;
const CJK_SINGLE_QUOTE_BUT_POSSESSIVE = new RegExp(`([${CJK}])('[^s])`, 'g');
const SINGLE_QUOTE_CJK = new RegExp(`(')([${CJK}])`, 'g');
const FIX_POSSESSIVE_SINGLE_QUOTE = new RegExp(
  `([A-Za-z0-9${CJK}])( )('s)`,
  'g'
);
const HASH_ANS_CJK_HASH = new RegExp(
  `([${CJK}])(#)([${CJK}]+)(#)([${CJK}])`,
  'g'
);
const CJK_HASH = new RegExp(`([${CJK}])(#([^ ]))`, 'g');
const HASH_CJK = new RegExp(`(([^ ])#)([${CJK}])`, 'g');
// the symbol part only includes + - * / = & | < >
const CJK_OPERATOR_ANS = new RegExp(
  `([${CJK}])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])`,
  'g'
);
const ANS_OPERATOR_CJK = new RegExp(
  `([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])([${CJK}])`,
  'g'
);
const FIX_SLASH_AS = /([/]) ([a-z\-_\./]+)/g;
const FIX_SLASH_AS_SLASH = /([/\.])([A-Za-z\-_\./]+) ([/])/g;
// the bracket part only includes ( ) [ ] { } < > “ ”
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201d])([${CJK}])`, 'g');
const FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET =
  /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/;
const ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET = new RegExp(
  `([A-Za-z0-9${CJK}])[ ]*([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])`,
  'g'
);
const LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK = new RegExp(
  `([\u201c])([A-Za-z0-9${CJK}\\-_ ]+)([\u201d])[ ]*([A-Za-z0-9${CJK}])`,
  'g'
);
// 修改：左括號前面是英文/數字時加空格，但排除右括號緊接左括號的情況（如函數調用的空括號）
const AN_LEFT_BRACKET = /([A-Za-z0-9])([\(\[\{])/g;
// 修改：右括號後面是英文/數字時加空格，但排除右括號緊接左括號的情況（如函數調用的空括號）
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;
const CJK_ANS = new RegExp(
  `([${CJK}])([A-Za-z\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`,
  'g'
);
const ANS_CJK = new RegExp(
  `([A-Za-z\u0370-\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])([${CJK}])`,
  'g'
);
const S_A = /(%)([A-Za-z])/g;
const MIDDLE_DOT = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g;

// Pattern source: https://uibakery.io/regex-library/url
const URL = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*)/ig;

// LaTeX command pattern: matches \command{...}, \command[...]{...}, ~\command{...}, etc.
// This pattern captures common LaTeX commands with their arguments to protect them from spacing
// It also captures the character immediately before and after to prevent spacing issues
const LATEX_COMMAND = /\\[a-zA-Z]+(?:\*)?(?:\[[^\]]*\])*(?:\{[^}]*\})*/g;

class Pangu {
  version: string;
  latexMode: boolean;
  constructor() {
    this.version = '4.0.7';
    this.latexMode = false;
  }

  convertToFullwidth(symbols: string) {
    return symbols
      .replace(/~/g, '～')
      .replace(/!/g, '！')
      .replace(/;/g, '；')
      .replace(/:/g, '：')
      .replace(/,/g, '，')
      .replace(/\./g, '。')
      .replace(/\?/g, '？');
  }

  spacing(text: string, options?: { latexMode?: boolean }): string {
    if (typeof text !== 'string') {
      console.warn(`spacing(text) only accepts string but got ${typeof text}`); // eslint-disable-line no-console
      return text;
    }

    // 如果沒有任何中文，就不處理了
    if (text.length <= 1 || !ANY_CJK.test(text)) {
      return text;
    }

    const self = this;
    const isLatexMode = options?.latexMode ?? this.latexMode;

    // DEBUG
    // String.prototype.rawReplace = String.prototype.replace;
    // String.prototype.replace = function(regexp, newSubstr) {
    //   const oldText = this;
    //   const newText = this.rawReplace(regexp, newSubstr);
    //   if (oldText !== newText) {
    //     console.log(`regexp: ${regexp}`);
    //     console.log(`oldText: ${oldText}`);
    //     console.log(`newText: ${newText}`);
    //   }
    //   return newText;
    // };
    let newText = text;

    // 將特定符號轉換為全形
    // https://stackoverflow.com/questions/4285472/multiple-regex-replace
    // newText = newText.replace(
    //   CONVERT_TO_FULLWIDTH_CJK_SYMBOLS_CJK,
    //   (match, leftCjk, symbols, rightCjk) => {
    //     const fullwidthSymbols = self.convertToFullwidth(symbols);
    //     return `${leftCjk}${fullwidthSymbols}${rightCjk}`;
    //   }
    // );

    // newText = newText.replace(
    //   CONVERT_TO_FULLWIDTH_CJK_SYMBOLS,
    //   (match, cjk, symbols) => {
    //     const fullwidthSymbols = self.convertToFullwidth(symbols);
    //     return `${cjk}${fullwidthSymbols}`;
    //   }
    // );

    // 為了避免「網址」被加入了盤古之白，所以要從轉換名單中剔除
    let index = 0;
    const matchUrls: string[] = []; // 存储原始网址
    newText = newText.replace(URL, (match) => {
      matchUrls.push(match); // 将匹配的网址存入数组
      return `{${index++}}`;
    });

    // 為了避免「LaTeX 命令」被加入了盤古之白，所以要從轉換名單中剔除
    // Use a different placeholder format for LaTeX commands to avoid conflicts
    const matchLatexCommands: string[] = [];
    if (isLatexMode) {
      newText = newText.replace(LATEX_COMMAND, (match) => {
        const latexIndex = matchLatexCommands.length;
        matchLatexCommands.push(match);
        return `〔LATEX${latexIndex}〕`;
      });
    }

    newText = newText.replace(DOTS_CJK, '$1 $2');
    newText = newText.replace(FIX_CJK_COLON_ANS, '$1：$2');

    newText = newText.replace(CJK_QUOTE, '$1 $2');
    newText = newText.replace(QUOTE_CJK, '$1 $2');
    newText = newText.replace(FIX_QUOTE_ANY_QUOTE, '$1$2$3');

    newText = newText.replace(CJK_SINGLE_QUOTE_BUT_POSSESSIVE, '$1 $2');
    newText = newText.replace(SINGLE_QUOTE_CJK, '$1 $2');
    newText = newText.replace(FIX_POSSESSIVE_SINGLE_QUOTE, "$1's"); // eslint-disable-line quotes

    newText = newText.replace(HASH_ANS_CJK_HASH, '$1 $2$3$4 $5');
    newText = newText.replace(CJK_HASH, '$1 $2');
    newText = newText.replace(HASH_CJK, '$1 $3');

    newText = newText.replace(CJK_OPERATOR_ANS, '$1 $2 $3');
    newText = newText.replace(ANS_OPERATOR_CJK, '$1 $2 $3');

    newText = newText.replace(FIX_SLASH_AS, '$1$2');
    newText = newText.replace(FIX_SLASH_AS_SLASH, '$1$2$3');

    newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
    newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
    newText = newText.replace(FIX_LEFT_BRACKET_ANY_RIGHT_BRACKET, '$1$2$3');
    newText = newText.replace(
      ANS_CJK_LEFT_BRACKET_ANY_RIGHT_BRACKET,
      '$1 $2$3$4'
    );
    newText = newText.replace(
      LEFT_BRACKET_ANY_RIGHT_BRACKET_ANS_CJK,
      '$1$2$3 $4'
    );

    // 先處理英數字與括號的間距，但要避免破壞空括號
    // 使用負向前瞻來排除空括號的情況
    newText = newText.replace(/([A-Za-z0-9])([\(\[\{])(?![\)\]\}])/g, '$1 $2');
    newText = newText.replace(/(?<![\(\[\{])([\)\]\}])([A-Za-z0-9])/g, '$1 $2');

    newText = newText.replace(CJK_ANS, '$1 $2');
    newText = newText.replace(ANS_CJK, '$1 $2');

    // 完全看不懂這行在幹嘛
    // newText = newText.replace(S_A, '$1 $2');

    newText = newText.replace(MIDDLE_DOT, '・');

    // 還原 LaTeX 命令 (需要在還原網址之前，因為使用不同的佔位符)
    if (isLatexMode && matchLatexCommands.length > 0) {
      newText = newText.replace(/〔LATEX(\d+)〕/g, (match, latexIndex) => {
        const idx = parseInt(latexIndex);
        if (idx < matchLatexCommands.length && matchLatexCommands[idx] !== undefined) {
          return matchLatexCommands[idx];
        }
        return match;
      });
    }

    // 還原網址
    const allProtectedItems = [...matchUrls, ...matchLatexCommands];
    newText = newText.replace(/{\d+}/g, (match) => {
      const number = parseInt(match.match(/\d+/)![0]);
      // Restore if this is a valid placeholder index
      if (number < allProtectedItems.length && allProtectedItems[number] !== undefined) {
        return allProtectedItems[number];
      }
      // Keep the original text if it's not a placeholder (e.g., LaTeX formulas)
      return match;
    });

    // DEBUG
    // String.prototype.replace = String.prototype.rawReplace;
    return newText;
  }

  spacingText(
    text: string,
    callback?: (err: Error | null, newText?: string | undefined) => void
  ) {
    let newText: string | undefined;
    try {
      newText = this.spacing(text);
    } catch (err: any) {
      if (callback) {
        callback(err);
      } else {
        console.error(err);
      }
      return;
    }
    if (callback) {
      callback(null, newText);
    } else {
      return newText;
    }
  }
}

export const pangu = new Pangu();
