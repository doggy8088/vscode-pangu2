/**
 * 測試程式: CJK 字元偵測功能測試
 * 
 * 此測試用於驗證 containsCJK 函數能正確偵測文字中是否包含中日韓文字，
 * 以解決純英文 Markdown 檔案自動儲存時無限循環的問題。
 */

// CJK (Chinese, Japanese, Korean) character ranges
// NOTE: This is intentionally duplicated from Pangu.ts for standalone testing
// without requiring TypeScript compilation. If the CJK range changes in Pangu.ts,
// this should be updated accordingly.
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);

/**
 * Check if text contains any CJK characters.
 * This mirrors the implementation in Pangu.ts
 */
function containsCJK(text) {
  return ANY_CJK.test(text);
}

console.log('🧪 CJK 字元偵測功能測試');
console.log('='.repeat(50));
console.log('');

const testCases = [
  // Pure English - should NOT contain CJK
  {
    name: '純英文文字',
    input: 'Hello World! This is a test.',
    expected: false,
    desc: 'Pure English text without any CJK characters'
  },
  {
    name: '純英文 Markdown',
    input: `# Title

This is a paragraph with **bold** and _italic_ text.

- List item 1
- List item 2

\`code block\`
`,
    expected: false,
    desc: 'English Markdown document'
  },
  {
    name: '帶符號的英文',
    input: 'const func = () => { return "Hello @#$%"; };',
    expected: false,
    desc: 'English with symbols and special characters'
  },
  {
    name: '帶數字的英文',
    input: 'The answer is 42. The price is $99.99.',
    expected: false,
    desc: 'English with numbers'
  },
  {
    name: '帶 URL 的英文',
    input: 'Visit https://example.com/path?param=value for more info.',
    expected: false,
    desc: 'English with URLs'
  },
  
  // Chinese - should contain CJK
  {
    name: '純中文',
    input: '這是中文測試',
    expected: true,
    desc: 'Pure Chinese text'
  },
  {
    name: '中英混合',
    input: '這是中文text測試',
    expected: true,
    desc: 'Mixed Chinese and English'
  },
  {
    name: '繁體中文',
    input: '繁體中文測試',
    expected: true,
    desc: 'Traditional Chinese'
  },
  {
    name: '簡體中文',
    input: '简体中文测试',
    expected: true,
    desc: 'Simplified Chinese'
  },
  
  // Japanese - should contain CJK
  {
    name: '日文平假名',
    input: 'これはテストです',
    expected: true,
    desc: 'Japanese Hiragana'
  },
  {
    name: '日文片假名',
    input: 'コレハテストデス',
    expected: true,
    desc: 'Japanese Katakana'
  },
  {
    name: '日文漢字',
    input: '日本語テスト',
    expected: true,
    desc: 'Japanese with Kanji'
  },
  
  // Korean - NOTE: Pure Korean Hangul is NOT included in the CJK regex used by Pangu
  // This is the original design of the library. Pangu is primarily designed for Chinese.
  // Korean Hangul syllables (\uAC00-\uD7AF) are not included in the CJK character range.
  {
    name: '韓文（純諺文）',
    input: '한국어 테스트',
    expected: false,  // Pure Korean Hangul is NOT included in CJK regex
    desc: 'Pure Korean Hangul - not included in CJK range'
  },
  
  // Mixed CJK - should contain CJK
  {
    name: '中日韓混合',
    input: '中文한국어日本語',
    expected: true,
    desc: 'Mixed CJK languages'
  },
  
  // Edge cases
  {
    name: '空字串',
    input: '',
    expected: false,
    desc: 'Empty string'
  },
  {
    name: '僅空白字元',
    input: '   \t\n   ',
    expected: false,
    desc: 'Whitespace only'
  },
  {
    name: '單一中文字元',
    input: '中',
    expected: true,
    desc: 'Single Chinese character'
  },
  {
    name: '帶 BOM 的文字',
    input: '\uFEFFHello World',
    expected: false,
    desc: 'UTF-8 BOM marker should not trigger CJK detection'
  },
  {
    name: '帶全形標點的英文',
    input: 'Hello，World！',
    expected: false,
    desc: 'English with fullwidth punctuation (U+FF00-U+FFEF range, not CJK)'
  },
  {
    name: '中文標點',
    input: '「測試」',
    expected: true,
    desc: 'Chinese quotes with Chinese character'
  },
  {
    name: '長英文文件',
    input: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100),
    expected: false,
    desc: 'Long English document'
  },
  {
    name: '英文中夾雜一個中文字',
    input: 'This is a long English text with one 中 character hidden inside.',
    expected: true,
    desc: 'Single Chinese character hidden in English text'
  },
];

// Run tests
console.log('🏃‍♂️ 執行測試...\n');

let passedCount = 0;
let failedCount = 0;
const failures = [];

testCases.forEach((testCase, index) => {
  const result = containsCJK(testCase.input);
  const passed = result === testCase.expected;
  
  if (passed) {
    passedCount++;
    console.log(`✅ ${index + 1}. ${testCase.name}`);
    console.log(`   輸入預覽: "${testCase.input.substring(0, 40)}${testCase.input.length > 40 ? '...' : ''}"`);
    console.log(`   預期: ${testCase.expected}, 結果: ${result}`);
  } else {
    failedCount++;
    failures.push(testCase);
    console.log(`❌ ${index + 1}. ${testCase.name}`);
    console.log(`   輸入: "${testCase.input.substring(0, 40)}${testCase.input.length > 40 ? '...' : ''}"`);
    console.log(`   預期: ${testCase.expected}, 結果: ${result}`);
    console.log(`   描述: ${testCase.desc}`);
  }
  console.log('');
});

// Summary
console.log('='.repeat(50));
console.log('📊 測試結果總結');
console.log('='.repeat(50));
console.log(`總測試數: ${testCases.length}`);
console.log(`✅ 通過: ${passedCount}`);
console.log(`❌ 失敗: ${failedCount}`);
console.log(`成功率: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);

if (failedCount === 0) {
  console.log('\n🎉 所有測試都通過了！');
  console.log('CJK 字元偵測功能運作正常，可以正確識別純英文文件。');
  process.exit(0);
} else {
  console.log('\n⚠️  有測試失敗，請檢查以下測試案例：');
  failures.forEach(f => {
    console.log(`  - ${f.name}: ${f.desc}`);
  });
  process.exit(1);
}
