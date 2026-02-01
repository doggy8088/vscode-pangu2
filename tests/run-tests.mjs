/**
 * 測試執行器 - 一鍵執行所有測試
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Azure DevOps Wiki Directive 測試套件');
console.log('='.repeat(50));

const testFiles = [
  'simple-test-1.mjs',
  'visual-test-2.mjs', 
  'quick-test-3.mjs',
  'test-cjk-detection.mjs'
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  執行 ${testFile}...`);
    console.log('─'.repeat(30));
    
    const testPath = join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: join(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} 執行完成`);
        resolve(code);
      } else {
        console.log(`❌ ${testFile} 執行失敗 (退出碼: ${code})`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`💥 ${testFile} 執行錯誤:`, error.message);
      reject(error);
    });
  });
}

async function runAllTests() {
  let passedTests = 0;
  let failedTests = 0;
  
  console.log(`📝 準備執行 ${testFiles.length} 個測試程式...\n`);
  
  for (const testFile of testFiles) {
    try {
      await runTest(testFile);
      passedTests++;
    } catch (error) {
      failedTests++;
      console.log(`錯誤詳情: ${error.message}`);
    }
  }
  
  console.log('\n🏁 所有測試執行完成');
  console.log('='.repeat(30));
  console.log(`✅ 成功: ${passedTests} 個`);
  console.log(`❌ 失敗: ${failedTests} 個`);
  console.log(`📊 成功率: ${((passedTests / testFiles.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 所有測試都通過了！');
    console.log('Azure DevOps Wiki directive 功能運作正常。');
  } else {
    console.log('\n⚠️  有測試失敗，請檢查上述錯誤訊息。');
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// 檢查是否有命令行參數指定特定測試
const args = process.argv.slice(2);
if (args.length > 0) {
  const specificTest = args[0];
  if (testFiles.includes(specificTest)) {
    console.log(`🎯 執行指定測試: ${specificTest}`);
    runTest(specificTest).catch(error => {
      console.error('測試執行失敗:', error.message);
      process.exit(1);
    });
  } else {
    console.log(`❌ 找不到測試檔案: ${specificTest}`);
    console.log(`可用的測試檔案: ${testFiles.join(', ')}`);
    process.exit(1);
  }
} else {
  // 執行所有測試
  runAllTests();
}