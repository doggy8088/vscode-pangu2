/**
 * 測試盤古之白 Language Model Tool 功能
 */

import { PanguTool, IPanguToolParameters } from '../src/PanguTool';

async function testPanguTool() {
  console.log('Testing Pangu Tool...');
  
  const tool = new PanguTool();
  
  // 測試案例 1: 基本中英文混合文本
  const testCase1 = {
    text: '這是一個test測試，包含123數字和English單詞。',
    enableLooseFormatting: false
  };
  
  // 測試案例 2: Markdown 文本
  const testCase2 = {
    text: '# 標題Test\n\n這是**粗體test**和*斜體text*的例子。\n\n- 清單項目1\n- 清單項目test\n\n```javascript\nconsole.log("Hello world");\n```',
    enableLooseFormatting: true
  };
  
  try {
    // 模擬 Language Model Tool 調用參數
    const options1 = {
      toolInvocationToken: undefined,
      parameters: testCase1 as any
    };
    
    const options2 = {
      toolInvocationToken: undefined,
      parameters: testCase2 as any
    };
    
    const mockCancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    } as any;
    
    const result1 = await tool.invoke(options1, mockCancellationToken);
    console.log('Test Case 1 Result:', result1.toString());
    
    const result2 = await tool.invoke(options2, mockCancellationToken);
    console.log('Test Case 2 Result:', result2.toString());
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// 如果是直接執行這個檔案，則運行測試
if (require.main === module) {
  testPanguTool();
}

export { testPanguTool };