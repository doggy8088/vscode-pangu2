import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';

// 模擬 logger
const logger = {
  appendLine: (text) => console.log(`[LOG] ${text}`)
};

// 簡化版的 addSpace 函數來測試 directive 保護功能
function testDirectiveProtection(txt) {
  console.log('[LOG] 🛡️ Protecting directive blocks before remark processing...');

  // 使用特殊標記來保護 directive 區塊
  const DIRECTIVE_PLACEHOLDER = '___DIRECTIVE_BLOCK_';
  const directiveBlocks = [];
  let protectedText = txt;

  // 找出所有的 directive 區塊並替換為佔位符
  const directiveRegex = /^(:::[\s]*[a-zA-Z][a-zA-Z0-9-_]*(?:\s+.*)?)\n([\s\S]*?)^:::$/gm;
  protectedText = protectedText.replace(directiveRegex, (match, start, content) => {
    const blockIndex = directiveBlocks.length;
    directiveBlocks.push(match); // 保存完整的原始區塊
    console.log(`[LOG]     📦 Stored directive block ${blockIndex}: ${start.trim()}`);
    console.log(`[LOG]     📄 Block content preview: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
    return `${DIRECTIVE_PLACEHOLDER}${blockIndex}___`;
  });

  if (directiveBlocks.length > 0) {
    console.log(`[LOG]   ✅ Protected ${directiveBlocks.length} directive blocks`);
  } else {
    console.log(`[LOG]   ➡️  No directive blocks found`);
  }

  // 處理 LLM 輸出問題（全形括號轉換）
  console.log('[LOG] 🔧 Pre-processing LLM output issues...');
  let bracketReplacements = 0;
  const lines = protectedText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const before = lines[i];
    lines[i] = lines[i].replace(/（([^）]+)）/g, (match, content) => {
      bracketReplacements++;
      return '(' + content + ')';
    });
    if (before !== lines[i]) {
      console.log(`[LOG]     Line ${i + 1}: 全形括號替換 "${before}" → "${lines[i]}"`);
    }
  }
  protectedText = lines.join('\n');

  if (bracketReplacements > 0) {
    console.log(`[LOG]   ✅ Applied ${bracketReplacements} bracket replacements`);
  }

  // 模擬 remark 處理（這裡我們簡化，只是添加一些空格）
  console.log('[LOG] 🚀 Starting remark processing...');
  let parsed = protectedText;

  // 簡單的中英文空格處理（只對非佔位符行進行）
  const processedLines = parsed.split('\n').map(line => {
    if (line.includes(DIRECTIVE_PLACEHOLDER)) {
      return line; // 保護佔位符行
    }
    // 添加中英文間的空格
    return line.replace(/([一-龯])([a-zA-Z])/g, '$1 $2').replace(/([a-zA-Z])([一-龯])/g, '$1 $2');
  });
  parsed = processedLines.join('\n');

  console.log('[LOG] ✅ Remark processing completed');

  // 還原 directive 區塊
  if (directiveBlocks.length > 0) {
    console.log('[LOG] 🔄 Restoring directive blocks...');

    parsed = parsed.replace(new RegExp(`${DIRECTIVE_PLACEHOLDER}(\\d+)___`, 'g'), (match, index) => {
      const blockIndex = parseInt(index);
      if (blockIndex < directiveBlocks.length) {
        console.log(`[LOG]     📦 Restored directive block ${blockIndex}`);
        return directiveBlocks[blockIndex];
      }
      return match;
    });

    console.log(`[LOG]   ✅ Restored ${directiveBlocks.length} directive blocks`);
  }

  return parsed;
}

console.log('🧪 測試 Directive 佔位符保護功能');
console.log('==================================================');

// 測試案例：包含全形括號和縮排的 mermaid directive
const testInput = `# 測試文件

這是directive外的文字，應該被處理（第一階段）。

::: mermaid
gantt
    title 文件交付時程（第一階段）
    dateFormat  YYYY-MM-DD
    section 文件交付
    專案計畫書           :done,  des1, 2024-01-01, 2024-01-31
    系統分析/設計說明書   :active, des2, 2024-02-01, 2024-02-29
:::

這是另一段directive外的文字，應該被處理（第二階段）。`;

console.log('\n📝 輸入內容:');
console.log('----------------------------------------');
console.log(testInput);

console.log('\n🔄 處理中...');
const result = testDirectiveProtection(testInput);

console.log('\n📄 處理結果:');
console.log('----------------------------------------');
console.log(result);

console.log('\n🔍 驗證結果:');
console.log('----------------------------------------');

// 檢查 directive 外的文字是否被正確處理
const hasSpacingOutside1 = result.includes('（第一階段）') && result.includes('（第二階段）');
const hasSpacingOutside2 = result.includes('這是 directive 外的文字') || result.includes('應該被處理 （');

// 檢查 directive 內的格式是否被保護
const directiveContent = result.match(/::: mermaid\n([\s\S]*?):::/);
if (directiveContent) {
  const content = directiveContent[1];
  const hasPreservedParentheses = content.includes('（第一階段）');
  const hasPreservedIndentation = content.includes('    title') && content.includes('    專案計畫書');

  console.log(`✅ Directive 內全形括號保護: ${hasPreservedParentheses ? '成功' : '失敗'}`);
  console.log(`✅ Directive 內縮排保護: ${hasPreservedIndentation ? '成功' : '失敗'}`);

  if (hasPreservedParentheses && hasPreservedIndentation) {
    console.log('🎉 佔位符保護功能測試通過！');
  } else {
    console.log('❌ 佔位符保護功能測試失敗！');
    console.log('\nDirective 內容詳細:');
    console.log(content);
  }
} else {
  console.log('❌ 找不到 directive 區塊！');
}

// 檢查 directive 外文字是否被正確處理
const outsideTextProcessed = result.includes('文字，應該被處理 （第一階段）') ||
                             result.includes('文字， 應該被處理（第一階段）');
console.log(`✅ Directive 外文字處理: ${outsideTextProcessed ? '成功' : '需檢查'}`);

console.log('\n📊 測試總結:');
if (directiveContent) {
  const content = directiveContent[1];
  const success = content.includes('（第一階段）') && content.includes('    title');
  console.log(`整體測試結果: ${success ? '✅ 通過' : '❌ 失敗'}`);
} else {
  console.log('整體測試結果: ❌ 失敗（找不到 directive）');
}