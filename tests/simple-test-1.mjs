/**
 * 簡單的測試程式 1: 基本 directive 功能測試
 */

import { createSimpleTestProcessor } from '../src/simple-test-utils.mjs';

console.log('🧪 Azure DevOps Wiki Directive 基本功能測試');
console.log('='.repeat(50));

const processor = createSimpleTestProcessor();

// 測試案例 1: 基本的 mermaid directive
const test1 = `這是中文text測試。

::: mermaid
graph TD
    A[開始] --> B[結束]
:::

這是另一段中文text。`;

console.log('\n📝 測試案例 1: 基本 mermaid directive');
console.log('輸入:');
console.log(test1);

const result1 = processor.process(test1);
console.log('\n輸出:');
console.log(result1.output);

const analysis1 = processor.analyzeDirectives(test1);
console.log('\n分析結果:');
console.log(`- 找到 ${analysis1.directives.length} 個 directive 區塊`);
console.log(`- 找到 ${analysis1.normalTextLines.length} 行普通文字`);

analysis1.directives.forEach(d => {
  console.log(`  * ${d.type} directive (第 ${d.startLine}-${d.endLine} 行)`);
});

const comparison1 = processor.compare(test1, result1.output);
console.log('\n✅ 比較結果:');
console.log(`- Directive 保留: ${comparison1.allDirectivesPreserved ? '成功' : '失敗'}`);
console.log(`- 普通文字處理: ${comparison1.allNormalTextProcessed ? '成功' : '失敗'}`);
console.log(`- 整體測試: ${comparison1.overallSuccess ? '✅ 通過' : '❌ 失敗'}`);

// 測試案例 2: 多種 directive 類型
const test2 = `標題text內容。

::: warning
警告內容test123不應該處理
:::

中間text應該處理。

::: note
筆記content保持原樣
:::

結尾text測試。`;

console.log('\n📝 測試案例 2: 多種 directive 類型');
console.log('輸入:');
console.log(test2);

const result2 = processor.process(test2);
console.log('\n輸出:');
console.log(result2.output);

const analysis2 = processor.analyzeDirectives(test2);
const comparison2 = processor.compare(test2, result2.output);

console.log('\n✅ 比較結果:');
console.log(`- 找到 ${analysis2.directives.length} 個 directive 區塊`);
analysis2.directives.forEach(d => {
  console.log(`  * ${d.type} directive`);
});
console.log(`- 整體測試: ${comparison2.overallSuccess ? '✅ 通過' : '❌ 失敗'}`);

// 測試案例 3: 邊界情況
const test3 = `開始text。

:::invalid123
特殊directive名稱test
:::

結束text。`;

console.log('\n📝 測試案例 3: 邊界情況');
const result3 = processor.process(test3);
const analysis3 = processor.analyzeDirectives(test3);

console.log(`找到 ${analysis3.directives.length} 個 directive 區塊`);
console.log(`整體功能: ${processor.compare(test3, result3.output).overallSuccess ? '✅ 正常' : '❌ 異常'}`);

console.log('\n🎯 測試總結:');
console.log('基本功能測試完成，可以透過以上結果快速驗證 Azure DevOps Wiki directive 功能是否正常運作。');