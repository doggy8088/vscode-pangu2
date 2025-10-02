// 擴展測試案例
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
  // 空括號測試
  { input: '預存程序使用 GETDATE()', expected: '預存程序使用 GETDATE()', desc: '已有空格的空括號' },
  { input: '使用GETDATE()函數', expected: '使用 GETDATE() 函數', desc: '中文+空括號+中文' },
  { input: 'function()', expected: 'function()', desc: '純英文空括號' },
  
  // 有參數的括號測試
  { input: 'array(1, 2, 3)', expected: 'array (1, 2, 3)', desc: '有參數的括號' },
  { input: '使用array(1, 2, 3)方法', expected: '使用 array (1, 2, 3) 方法', desc: '中文+有參數括號+中文' },
  { input: 'function(x)回傳值', expected: 'function (x) 回傳值', desc: '有參數括號+中文' },
  
  // 陣列括號測試
  { input: 'array[]索引', expected: 'array[] 索引', desc: '空陣列括號+中文' },
  { input: 'array[0]元素', expected: 'array [0] 元素', desc: '有索引括號+中文' },
  
  // 大括號測試
  { input: 'obj{}物件', expected: 'obj{} 物件', desc: '空物件括號+中文' },
  { input: 'obj{a:1}物件', expected: 'obj {a:1} 物件', desc: '有內容括號+中文' },
  
  // 連續括號測試
  { input: 'func()()', expected: 'func()()', desc: '連續空括號' },
  { input: 'func()()執行', expected: 'func()() 執行', desc: '連續空括號+中文' },
];

console.log('擴展測試結果：\n');

let passCount = 0;
let failCount = 0;

testCases.forEach(({ input, expected, desc }, index) => {
  const result = spacing(input);
  const pass = result === expected;
  
  if (pass) {
    passCount++;
    console.log(`✅ 測試 ${index + 1}: ${desc}`);
  } else {
    failCount++;
    console.log(`❌ 測試 ${index + 1}: ${desc}`);
    console.log(`   輸入: ${input}`);
    console.log(`   預期: ${expected}`);
    console.log(`   實際: ${result}`);
  }
});

console.log(`\n總結: ${passCount} 通過, ${failCount} 失敗`);
