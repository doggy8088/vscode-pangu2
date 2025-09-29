/**
 * 測試 Markdown 粗體語法修復功能
 * 
 * 此測試確保 Pangu 間距演算法不會錯誤地在 markdown 粗體語法 **text** 周圍添加空格。
 * 
 * 問題描述：
 * 輸入："# 介紹好用工具：**使用 LinkChecker 檢查網站連結有效性**"
 * 錯誤輸出："# 介紹好用工具 \*\*：使用 LinkChecker 檢查網站連結有效性 \*\*"
 * 正確輸出："# 介紹好用工具：**使用 LinkChecker 檢查網站連結有效性**"
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkPangu from '../src/remark-pangu.js';

interface TestCase {
  name: string;
  input: string;
  expected: string;
}

function createTestProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkPangu, { appendLine: () => {} })
    .use(remarkStringify);
}

function runMarkdownBoldTests() {
  console.log('🧪 測試 Markdown 粗體語法保護功能');
  console.log('='.repeat(60));

  const testCases: TestCase[] = [
    {
      name: "原始問題案例",
      input: "# 介紹好用工具：**使用 LinkChecker 檢查網站連結有效性**",
      expected: "# 介紹好用工具：**使用 LinkChecker 檢查網站連結有效性**"
    },
    {
      name: "中英文混合但無粗體",
      input: "這是簡單的test案例",
      expected: "這是簡單的 test 案例"
    },
    {
      name: "粗體內含中英文混合",
      input: "這是**中文和English混合的粗體**測試",
      expected: "這是**中文和English混合的粗體**測試"
    },
    {
      name: "多個粗體語法",
      input: "第一個**粗體text**和第二個**bold文字**在這裡",
      expected: "第一個**粗體text**和第二個**bold文字**在這裡"
    },
    {
      name: "粗體前後有中文",
      input: "中文**Bold**中文",
      expected: "中文**Bold**中文"
    },
    {
      name: "URL和粗體混合",
      input: "請查看 https://example.com 了解**詳細說明**",
      expected: "請查看 https://example.com 了解**詳細說明**"
    }
  ];

  const processor = createTestProcessor();
  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`\n📝 測試 ${index + 1}: ${testCase.name}`);
    console.log('輸入:', testCase.input);
    
    try {
      const result = processor.processSync(testCase.input).toString().trim();
      console.log('輸出:', result);
      console.log('預期:', testCase.expected);
      
      const passed = result === testCase.expected;
      console.log('結果:', passed ? '✅ 通過' : '❌ 失敗');
      
      if (passed) {
        passedTests++;
      } else {
        console.log('分析: 輸出與預期不符');
        console.log('  實際:', JSON.stringify(result));
        console.log('  預期:', JSON.stringify(testCase.expected));
      }
    } catch (error) {
      console.log('❌ 測試失敗:', error);
    }
  });

  console.log(`\n🎯 測試總結: ${passedTests}/${totalTests} 通過 (${Math.round(passedTests/totalTests*100)}%)`);

  if (passedTests === totalTests) {
    console.log('🎉 所有測試通過！Markdown 粗體語法保護功能正常！');
  } else {
    console.log('⚠️  部分測試失敗，Markdown 粗體語法保護可能有問題。');
  }

  return passedTests === totalTests;
}

if (require.main === module) {
  runMarkdownBoldTests();
}

export { runMarkdownBoldTests };