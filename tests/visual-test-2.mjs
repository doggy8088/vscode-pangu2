/**
 * 簡單的測試程式 2: 視覺化比較測試
 */

import { createSimpleTestProcessor } from '../src/simple-test-utils.mjs';

console.log('👀 Azure DevOps Wiki Directive 視覺化比較測試');
console.log('='.repeat(55));

const processor = createSimpleTestProcessor();

// 複雜測試案例
const complexTest = `# Azure DevOps測試文件

這是一段中文text需要處理的內容。

::: mermaid
gantt
    title 專案timeline計畫
    專案啟動 :milestone, start, 2024-01-01, 0d
    需求分析 :active, req, 2024-01-02, 10d
:::

這段中文English混合text應該被正確處理。

::: warning 重要提醒
這是warning內容，包含中文text和English不應該被處理。
多行內容test123也要保持原樣。
:::

最後一段中文text測試內容。

::: note
簡短note內容
:::

結束text。`;

function printSection(title, content) {
  console.log(`\n${title}`);
  console.log('-'.repeat(40));
  console.log(content);
}

function highlightChanges(original, processed) {
  const originalLines = original.split('\n');
  const processedLines = processed.split('\n');
  
  let result = '';
  for (let i = 0; i < Math.max(originalLines.length, processedLines.length); i++) {
    const origLine = originalLines[i] || '';
    const procLine = processedLines[i] || '';
    
    if (origLine !== procLine) {
      result += `📝 第${i + 1}行: ${origLine} → ${procLine}\n`;
    } else if (origLine.trim()) {
      result += `✓ 第${i + 1}行: ${origLine}\n`;
    }
  }
  
  return result;
}

printSection('📄 原始內容', complexTest);

console.log('\n🔄 處理中...');
const result = processor.process(complexTest);

printSection('📄 處理結果', result.output);

// 分析差異
console.log('\n🔍 詳細分析:');
const analysis = processor.analyzeDirectives(complexTest);

console.log(`\n📊 統計資訊:`);
console.log(`- 總行數: ${analysis.totalLines}`);
console.log(`- Directive 區塊: ${analysis.directives.length} 個`);
console.log(`- 普通文字行: ${analysis.normalTextLines.length} 行`);

console.log(`\n📦 Directive 區塊列表:`);
analysis.directives.forEach((directive, index) => {
  console.log(`${index + 1}. ${directive.type} (第 ${directive.startLine}-${directive.endLine} 行)`);
  console.log(`   內容預覽: "${directive.content[1]?.trim() || '(空)'}"`);
});

console.log(`\n📝 需要處理的文字行:`);
analysis.normalTextLines.forEach((line, index) => {
  const hasChineseEnglish = /[\u4e00-\u9fff].*[a-zA-Z]|[a-zA-Z].*[\u4e00-\u9fff]/.test(line.content);
  const marker = hasChineseEnglish ? '🔤' : '📄';
  console.log(`${index + 1}. ${marker} 第${line.lineNumber}行: "${line.content.trim()}"`);
});

// 比較結果
const comparison = processor.compare(complexTest, result.output);
console.log(`\n✅ 功能驗證:`);
console.log(`- Directive 保留狀態: ${comparison.allDirectivesPreserved ? '✅ 全部保留' : '❌ 有損失'}`);
console.log(`- 文字處理狀態: ${comparison.allNormalTextProcessed ? '✅ 正確處理' : '❌ 處理異常'}`);

if (comparison.overallSuccess) {
  console.log('\n🎉 整體測試結果: ✅ 成功');
  console.log('Azure DevOps Wiki directive 功能運作正常！');
} else {
  console.log('\n⚠️  整體測試結果: ❌ 發現問題');
  console.log('需要檢查 directive 處理邏輯。');
}

// 簡化的差異顯示
console.log('\n📋 處理前後比較 (僅顯示變更的行):');
const changes = highlightChanges(complexTest, result.output);
if (changes.trim()) {
  console.log(changes);
} else {
  console.log('沒有發現變更 (這可能表示處理邏輯有問題)');
}