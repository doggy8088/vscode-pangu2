// 直接從源碼複製 Pangu 類別進行測試
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\u201d])([${CJK}])`, 'g');
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\u0370-\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])([${CJK}])`, 'g');

function spacing(text) {
  if (!ANY_CJK.test(text)) return text;
  
  let newText = text;
  newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
  newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
  
  // 使用新的規則：避免破壞空括號
  newText = newText.replace(/([A-Za-z0-9])([\(\[\{])(?![\)\]\}])/g, '$1 $2');
  newText = newText.replace(/(?<![\(\[\{])([\)\]\}])([A-Za-z0-9])/g, '$1 $2');
  
  newText = newText.replace(CJK_ANS, '$1 $2');
  newText = newText.replace(ANS_CJK, '$1 $2');
  
  return newText;
}

const testCases = [
  '預存程序使用 GETDATE()',
  '使用 NOW() 取得時間',
  '呼叫 max() 函數',
  'SELECT COUNT(*) FROM table',
  '這是 JavaScript 的 console.log() 方法',
  '在 Python 中使用 print() 函數',
  '使用GETDATE()函數',
  '呼叫MAX()取得最大值',
];

console.log('測試 Pangu.spacing() 函數對括號的處理：\n');

testCases.forEach((text, index) => {
  const result = spacing(text);
  const changed = text !== result ? '❌ 已變更' : '✅ 未變更';
  console.log(`測試 ${index + 1}: ${changed}`);
  console.log(`  原始: ${text}`);
  console.log(`  結果: ${result}`);
  console.log();
});
