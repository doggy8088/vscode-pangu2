/**
 * Test LaTeX command protection functionality
 */

// Inline version of Pangu with LaTeX support for testing
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\\u0370-\\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\\u0370-\\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])([${CJK}])`, 'g');
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<>\\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}<>\\u201d])([${CJK}])`, 'g');
const URL = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*)/ig;
const LATEX_COMMAND = /\\[a-zA-Z]+(?:\*)?(?:\[[^\]]*\])*(?:\{[^}]*\})*/g;

function spacing(text, options = {}) {
  if (typeof text !== 'string' || text.length <= 1 || !ANY_CJK.test(text)) {
    return text;
  }
  
  const isLatexMode = options.latexMode || false;
  let newText = text;
  
  // Protect URLs
  let index = 0;
  const matchUrls = [];
  newText = newText.replace(URL, (match) => {
    matchUrls.push(match);
    return `{${index++}}`;
  });
  
  // Protect LaTeX commands if in LaTeX mode
  const matchLatexCommands = [];
  if (isLatexMode) {
    newText = newText.replace(LATEX_COMMAND, (match) => {
      const latexIndex = matchLatexCommands.length;
      matchLatexCommands.push(match);
      return `〔LATEX${latexIndex}〕`;
    });
  }
  
  // Apply spacing rules
  newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
  newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
  newText = newText.replace(CJK_ANS, '$1 $2');
  newText = newText.replace(ANS_CJK, '$1 $2');
  
  // Restore LaTeX commands (before restoring URLs, since they use different placeholders)
  if (isLatexMode && matchLatexCommands.length > 0) {
    newText = newText.replace(/〔LATEX(\d+)〕/g, (match, latexIndex) => {
      const idx = parseInt(latexIndex);
      if (idx < matchLatexCommands.length && matchLatexCommands[idx] !== undefined) {
        return matchLatexCommands[idx];
      }
      return match;
    });
  }
  
  // Restore protected items
  const allProtectedItems = [...matchUrls, ...matchLatexCommands];
  newText = newText.replace(/{\d+}/g, (match) => {
    const number = parseInt(match.match(/\d+/)[0]);
    if (number < allProtectedItems.length && allProtectedItems[number] !== undefined) {
      return allProtectedItems[number];
    }
    return match;
  });
  
  return newText;
}

console.log('🧪 Testing LaTeX Command Protection\n');
console.log('='.repeat(60));

const testCases = [
  {
    name: 'Issue Example 1: LaTeX cite with tilde',
    input: '自监督学习通过设计代理任务，如掩码建模~\\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）',
    expected: '自监督学习通过设计代理任务，如掩码建模~\\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）',
    latexMode: true
  },
  {
    name: 'Issue Example 1: Multiple LaTeX cite commands',
    input: '和对比学习~\\cite{CaronTMJMBJ21,OquabDMVSKFHMEA24,Simeoni25}（Contrastive Learning），',
    expected: '和对比学习~\\cite{CaronTMJMBJ21,OquabDMVSKFHMEA24,Simeoni25}（Contrastive Learning），',
    latexMode: true
  },
  {
    name: 'Issue Example 2: LaTeX begin command',
    input: '\\begin{figure}[htbp]',
    expected: '\\begin{figure}[htbp]',
    latexMode: true
  },
  {
    name: 'Issue Example 2: LaTeX includegraphics',
    input: '    \\includegraphics[width=0.78\\linewidth]{figures/chap2.7-inside-vit.png}',
    expected: '    \\includegraphics[width=0.78\\linewidth]{figures/chap2.7-inside-vit.png}',
    latexMode: true
  },
  {
    name: 'Issue Example 2: LaTeX caption with CJK',
    input: '    \\caption{视觉自注意力编码器内部结构}',
    expected: '    \\caption{视觉自注意力编码器内部结构}',
    latexMode: true
  },
  {
    name: 'Issue Example 2: LaTeX label',
    input: '    \\label{fig:2.7-inside-vit}',
    expected: '    \\label{fig:2.7-inside-vit}',
    latexMode: true
  },
  {
    name: 'LaTeX with Chinese text spacing',
    input: '这是中文text混合LaTeX命令\\textbf{粗体文字}的测试',
    expected: '这是中文 text 混合 LaTeX 命令\\textbf{粗体文字}的测试',
    latexMode: true
  },
  {
    name: 'Without LaTeX mode (should add spaces between commands and CJK)',
    input: '\\begin{figure}中文测试',
    expected: '\\begin{figure} 中文测试', // Space added after the closing brace before CJK
    latexMode: false
  },
  {
    name: 'With LaTeX mode (should NOT add spaces to commands)',
    input: '\\begin{figure}中文测试',
    expected: '\\begin{figure}中文测试',
    latexMode: true
  },
  {
    name: 'Complex LaTeX with multiple commands',
    input: '图像分类任务使用\\cite{He2016}提出的ResNet模型，效果很好。',
    expected: '图像分类任务使用\\cite{He2016}提出的 ResNet 模型，效果很好。',
    latexMode: true
  }
];

let passCount = 0;
let failCount = 0;

testCases.forEach(({ name, input, expected, latexMode }, index) => {
  const result = spacing(input, { latexMode });
  const pass = result === expected;
  
  if (pass) {
    passCount++;
  } else {
    failCount++;
  }
  
  console.log(`\nTest ${index + 1}: ${name}`);
  console.log(`  LaTeX Mode: ${latexMode ? 'ON' : 'OFF'}`);
  console.log(`  Input:    "${input}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log(`  Status:   ${pass ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!pass) {
    console.log(`  Diff:`);
    console.log(`    Expected length: ${expected.length}, Got length: ${result.length}`);
    // Show character-by-character diff
    for (let i = 0; i < Math.max(expected.length, result.length); i++) {
      if (expected[i] !== result[i]) {
        console.log(`    Position ${i}: expected '${expected[i]}' (code: ${expected.charCodeAt(i)}), got '${result[i]}' (code: ${result.charCodeAt(i)})`);
      }
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Summary: ${passCount}/${testCases.length} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log('✅ All tests passed! LaTeX support is working correctly.');
} else {
  console.log(`❌ ${failCount} test(s) failed. Please review the implementation.`);
  process.exit(1);
}
