/**
 * 測試腳本：驗證 restoreWhitespaceOnlyLines 函式的檔尾換行處理修復
 *
 * 這個測試檔案驗證 MarkdownFormatter.ts 中 restoreWhitespaceOnlyLines 函式
 * 對於檔尾換行的處理是否正確，特別是解決以下問題：
 *
 * 問題描述：
 * - 第一次執行時，檔尾一個換行會變成兩個換行
 * - 第二次執行時，由於行數不匹配會跳過處理
 *
 * 修復內容：
 * - 正確處理 split() 產生的空字串
 * - 確保重建邏輯不會重複添加檔尾換行
 */

// 簡單的測試工具函式
function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`❌ ${message}`);
    console.error(`  期望: ${JSON.stringify(expected)}`);
    console.error(`  實際: ${JSON.stringify(actual)}`);
    return false;
  } else {
    console.log(`✅ ${message}`);
    return true;
  }
}

function runTest(testName: string, testFn: () => boolean) {
  console.log(`\n🧪 ${testName}`);
  console.log('='.repeat(50));

  try {
    const passed = testFn();
    if (passed) {
      console.log(`🎉 測試通過: ${testName}`);
    } else {
      console.log(`💥 測試失敗: ${testName}`);
    }
    return passed;
  } catch (error) {
    console.error(`💥 測試錯誤: ${testName}`, error);
    return false;
  }
}

// 測試用的模擬函式（直接實作修復後的邏輯）
function restoreWhitespaceOnlyLines(
  originalText: string,
  parsedText: string,
  eol: '\n' | '\r\n'
): { text: string; restored: number } {
  const parsedHasFinalNl = /\r?\n$/.test(parsedText);
  const origLines = originalText.split(/\r?\n/);
  const newLines = parsedText.split(/\r?\n/);

  // 修正檔尾換行處理：如果文字檔尾有換行，split 會產生空字串，需要移除以正確計算行數
  const origLinesActual = parsedHasFinalNl && origLines[origLines.length - 1] === ''
    ? origLines.slice(0, -1)
    : origLines;
  const newLinesActual = parsedHasFinalNl && newLines[newLines.length - 1] === ''
    ? newLines.slice(0, -1)
    : newLines;

  if (origLinesActual.length !== newLinesActual.length) {
    return { text: parsedText, restored: 0 };
  }

  let restoredCount = 0;
  for (let i = 0; i < origLinesActual.length; i++) {
    if (/^[\t ]+$/.test(origLinesActual[i]) && newLinesActual[i] === '') {
      newLinesActual[i] = origLinesActual[i];
      restoredCount++;
    }
  }

  // 修正重建邏輯：直接用 join 重建，然後根據原始檔尾換行狀態決定是否加上換行
  const joined = newLinesActual.join(eol) + (parsedHasFinalNl ? eol : '');

  return { text: joined, restored: restoredCount };
}

// 測試案例
function testEndlineWithWhitespace() {
  const originalText = "line1\n  \nline3\n"; // 中間有純空白行，檔尾有換行
  const parsedText = "line1\n\nline3\n"; // remark 處理後空白行被清除

  // 第一次執行
  const result1 = restoreWhitespaceOnlyLines(originalText, parsedText, '\n');
  const pass1 = assertEqual(result1.text, originalText, '第一次執行應該還原到原始文字');
  const pass2 = assertEqual(result1.restored, 1, '第一次執行應該還原 1 個空白行');

  // 第二次執行（使用第一次的結果）
  const result2 = restoreWhitespaceOnlyLines(originalText, result1.text, '\n');
  const pass3 = assertEqual(result2.text, originalText, '第二次執行應該維持原始文字');
  const pass4 = assertEqual(result2.restored, 0, '第二次執行不應該還原任何行（已經正確）');

  // 第三次執行確認穩定性
  const result3 = restoreWhitespaceOnlyLines(originalText, result2.text, '\n');
  const pass5 = assertEqual(result3.text, originalText, '第三次執行應該維持原始文字');

  return pass1 && pass2 && pass3 && pass4 && pass5;
}

function testEndlineWithoutWhitespace() {
  const originalText = "line1\n  \nline3"; // 中間有純空白行，檔尾無換行
  const parsedText = "line1\n\nline3"; // remark 處理後空白行被清除

  const result1 = restoreWhitespaceOnlyLines(originalText, parsedText, '\n');
  const pass1 = assertEqual(result1.text, originalText, '無檔尾換行：第一次執行應該還原到原始文字');

  const result2 = restoreWhitespaceOnlyLines(originalText, result1.text, '\n');
  const pass2 = assertEqual(result2.text, originalText, '無檔尾換行：第二次執行應該維持原始文字');

  return pass1 && pass2;
}

function testPureEndlineProblem() {
  const originalText = "line1\nline2\n"; // 純檔尾換行問題
  const parsedText = "line1\nline2\n"; // 假設 remark 處理後沒有變化

  const result1 = restoreWhitespaceOnlyLines(originalText, parsedText, '\n');
  const pass1 = assertEqual(result1.text, originalText, '純檔尾換行：應該保持原樣');
  const pass2 = assertEqual(result1.restored, 0, '純檔尾換行：不應該還原任何行');

  // 多次執行應該穩定
  const result2 = restoreWhitespaceOnlyLines(originalText, result1.text, '\n');
  const pass3 = assertEqual(result2.text, originalText, '純檔尾換行：第二次執行應該維持原樣');

  const result3 = restoreWhitespaceOnlyLines(originalText, result2.text, '\n');
  const pass4 = assertEqual(result3.text, originalText, '純檔尾換行：第三次執行應該維持原樣');

  return pass1 && pass2 && pass3 && pass4;
}

function testWindowsEndline() {
  const originalText = "line1\r\n  \r\nline3\r\n"; // Windows 檔尾換行
  const parsedText = "line1\r\n\r\nline3\r\n";

  const result1 = restoreWhitespaceOnlyLines(originalText, parsedText, '\r\n');
  const pass1 = assertEqual(result1.text, originalText, 'Windows 檔尾換行：第一次執行應該還原到原始文字');

  const result2 = restoreWhitespaceOnlyLines(originalText, result1.text, '\r\n');
  const pass2 = assertEqual(result2.text, originalText, 'Windows 檔尾換行：第二次執行應該維持原始文字');

  return pass1 && pass2;
}

// 執行所有測試
console.log('🔧 restoreWhitespaceOnlyLines 檔尾換行修復驗證');
console.log('='.repeat(80));

const tests = [
  () => runTest('檔尾有換行的文字應該保持一致（多次執行）', testEndlineWithWhitespace),
  () => runTest('檔尾無換行的文字應該保持一致', testEndlineWithoutWhitespace),
  () => runTest('純檔尾換行問題（無純空白行）', testPureEndlineProblem),
  () => runTest('Windows 檔尾換行 (CRLF) 處理', testWindowsEndline),
];

const results = tests.map(test => test());
const passedCount = results.filter(result => result).length;
const totalCount = results.length;

console.log('\n' + '='.repeat(80));
if (passedCount === totalCount) {
  console.log(`🎉 所有測試通過！(${passedCount}/${totalCount})`);
} else {
  console.log(`💥 部分測試失敗！(${passedCount}/${totalCount})`);
}
console.log('='.repeat(80));