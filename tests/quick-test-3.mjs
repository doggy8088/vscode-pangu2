/**
 * 簡單的測試程式 3: 快速驗證測試
 */

import { createSimpleTestProcessor } from '../src/simple-test-utils.mjs';

console.log('⚡ Azure DevOps Wiki Directive 快速驗證測試');
console.log('='.repeat(50));

const processor = createSimpleTestProcessor();

// 定義測試案例
const testCases = [
  {
    name: '基本功能',
    input: `中文text測試。
::: mermaid
保持原樣
:::
結尾text。`,
    expectedDirectives: 1,
    shouldPass: true
  },
  {
    name: '多個 directive',
    input: `開始text。
::: warning
警告內容
:::
中間text。
::: note  
筆記內容
:::
結束text。`,
    expectedDirectives: 2,
    shouldPass: true
  },
  {
    name: '無 directive',
    input: `純文字content測試。
這裡有中文text和English。
沒有directive區塊。`,
    expectedDirectives: 0,
    shouldPass: true
  },
  {
    name: '空白 directive',
    input: `開始text。
:::
:::
結束text。`,
    expectedDirectives: 0, // 空的 directive 應該不被識別
    shouldPass: true
  },
  {
    name: '巢狀內容',
    input: `標題text。
::: details
詳細說明content
    code block
    更多text內容
:::
結尾text。`,
    expectedDirectives: 1,
    shouldPass: true
  }
];

// 執行快速測試
console.log('🏃‍♂️ 執行快速測試...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`📋 測試 ${index + 1}: ${testCase.name}`);
  
  // 處理文本
  const result = processor.process(testCase.input);
  const analysis = processor.analyzeDirectives(testCase.input);
  const comparison = processor.compare(testCase.input, result.output);
  
  // 檢查結果
  const directiveCountCorrect = analysis.directives.length === testCase.expectedDirectives;
  const processingCorrect = result.success && comparison.overallSuccess;
  const testPassed = directiveCountCorrect && processingCorrect;
  
  if (testPassed) {
    passedTests++;
    console.log(`   ✅ 通過`);
  } else {
    console.log(`   ❌ 失敗`);
    if (!directiveCountCorrect) {
      console.log(`      預期 ${testCase.expectedDirectives} 個 directive，實際找到 ${analysis.directives.length} 個`);
    }
    if (!processingCorrect) {
      console.log(`      處理過程出錯: ${result.error || '未知錯誤'}`);
    }
  }
  
  // 顯示簡要統計
  console.log(`   📊 Directive: ${analysis.directives.length} 個，文字行: ${analysis.normalTextLines.length} 行`);
  
  if (analysis.directives.length > 0) {
    const types = analysis.directives.map(d => d.type).join(', ');
    console.log(`   📦 類型: ${types}`);
  }
  
  console.log('');
});

// 測試總結
console.log('📈 測試總結');
console.log('='.repeat(20));
console.log(`總計: ${totalTests} 個測試`);
console.log(`通過: ${passedTests} 個`);
console.log(`失敗: ${totalTests - passedTests} 個`);
console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 所有測試通過！Azure DevOps Wiki directive 功能運作正常。');
} else {
  console.log('\n⚠️  發現測試失敗，請檢查實作。');
}

// 效能測試
console.log('\n⏱️  效能測試');
console.log('-'.repeat(20));

const perfTest = `測試text內容。
::: mermaid
複雜的圖表content
包含多行內容
:::
更多text測試。`.repeat(10); // 重複 10 次

const startTime = Date.now();
for (let i = 0; i < 100; i++) {
  processor.process(perfTest);
}
const endTime = Date.now();

console.log(`處理 100 次大型文件用時: ${endTime - startTime}ms`);
console.log(`平均每次處理時間: ${((endTime - startTime) / 100).toFixed(2)}ms`);

console.log('\n✨ 快速驗證測試完成！');