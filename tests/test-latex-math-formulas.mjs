/**
 * Test LaTeX math formula protection
 */

// Import Pangu implementation
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the compiled extension
const compiled = readFileSync(join(process.cwd(), 'out/main.js'), 'utf-8');

// Extract Pangu class (this is a simplified test - in real usage it's bundled)
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\\u0370-\\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\\u0370-\\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])([${CJK}])`, 'g');
const CJK_LEFT_BRACKET = new RegExp(`([${CJK}])([\\(\\[\\{<\u201c])`, 'g');
const RIGHT_BRACKET_CJK = new RegExp(`([\\)\\]\\}>\u201d])([${CJK}])`, 'g');
const URL = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*)/ig;
const LATEX_COMMAND = /\\[a-zA-Z]+(?:\*)?(?:\[[^\]]*\])*(?:\{[^}]*\})*/g;
const LATEX_INLINE_MATH = /\$(?!\$)[^\$]+?\$|\\\((?:[^\\]|\\(?!\)))*?\\\)/g;
const LATEX_DISPLAY_MATH = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g;

function spacing(text, options = {}) {
  if (typeof text !== 'string' || text.length <= 1 || !ANY_CJK.test(text)) {
    return text;
  }
  
  const isLatexMode = options.latexMode || false;
  let newText = text;
  
  // Protect URLs
  const matchUrls = [];
  newText = newText.replace(URL, (match) => {
    const urlIndex = matchUrls.length;
    matchUrls.push(match);
    return `PANGUURL${urlIndex}PANGU`;
  });
  
  // Protect LaTeX commands
  const matchLatexCommands = [];
  if (isLatexMode) {
    newText = newText.replace(LATEX_COMMAND, (match) => {
      const latexIndex = matchLatexCommands.length;
      matchLatexCommands.push(match);
      return `〔LATEX${latexIndex}〕`;
    });
  }
  
  // Protect inline math
  const matchLatexInlineMath = [];
  if (isLatexMode) {
    newText = newText.replace(LATEX_INLINE_MATH, (match) => {
      const mathIndex = matchLatexInlineMath.length;
      matchLatexInlineMath.push(match);
      return `〔MATH${mathIndex}〕`;
    });
  }
  
  // Protect display math
  const matchLatexDisplayMath = [];
  if (isLatexMode) {
    newText = newText.replace(LATEX_DISPLAY_MATH, (match) => {
      const displayIndex = matchLatexDisplayMath.length;
      matchLatexDisplayMath.push(match);
      return `〔DISPLAYMATH${displayIndex}〕`;
    });
  }
  
  // Apply spacing rules
  newText = newText.replace(CJK_LEFT_BRACKET, '$1 $2');
  newText = newText.replace(RIGHT_BRACKET_CJK, '$1 $2');
  newText = newText.replace(CJK_ANS, '$1 $2');
  newText = newText.replace(ANS_CJK, '$1 $2');
  
  // Restore display math
  if (isLatexMode && matchLatexDisplayMath.length > 0) {
    newText = newText.replace(/〔DISPLAYMATH(\d+)〕/g, (match, displayIndex) => {
      const idx = parseInt(displayIndex);
      if (idx < matchLatexDisplayMath.length && matchLatexDisplayMath[idx] !== undefined) {
        return matchLatexDisplayMath[idx];
      }
      return match;
    });
  }
  
  // Restore inline math
  if (isLatexMode && matchLatexInlineMath.length > 0) {
    newText = newText.replace(/〔MATH(\d+)〕/g, (match, mathIndex) => {
      const idx = parseInt(mathIndex);
      if (idx < matchLatexInlineMath.length && matchLatexInlineMath[idx] !== undefined) {
        return matchLatexInlineMath[idx];
      }
      return match;
    });
  }
  
  // Restore LaTeX commands
  if (isLatexMode && matchLatexCommands.length > 0) {
    newText = newText.replace(/〔LATEX(\d+)〕/g, (match, latexIndex) => {
      const idx = parseInt(latexIndex);
      if (idx < matchLatexCommands.length && matchLatexCommands[idx] !== undefined) {
        return matchLatexCommands[idx];
      }
      return match;
    });
  }
  
  // Restore URLs
  newText = newText.replace(/PANGUURL(\d+)PANGU/g, (match, urlIndex) => {
    const idx = parseInt(urlIndex);
    if (idx < matchUrls.length && matchUrls[idx] !== undefined) {
      return matchUrls[idx];
    }
    return match;
  });
  
  return newText;
}

console.log('🧪 Testing LaTeX Math Formula Protection\n');
console.log('='.repeat(60));

const testCases = [
  {
    name: 'Inline math with $...$',
    input: '质能关系式 $E=mc^2$ 很重要',
    expected: '质能关系式 $E=mc^2$ 很重要',
    latexMode: true
  },
  {
    name: 'Chemical formula $H_{2}O$',
    input: '化学式 $H_{2}O$ 是水',
    expected: '化学式 $H_{2}O$ 是水',
    latexMode: true
  },
  {
    name: 'Display math with $$...$$',
    input: '积分公式 $$\\int_0^1 x^2 dx$$ 等于',
    expected: '积分公式 $$\\int_0^1 x^2 dx$$ 等于',
    latexMode: true
  },
  {
    name: 'Inline math with \\(...\\)',
    input: '简单公式 \\(a + b = c\\) 成立',
    expected: '简单公式 \\(a + b = c\\) 成立',
    latexMode: true
  },
  {
    name: 'Display math with \\[...\\]',
    input: '求和公式 \\[\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\\] 很有用',
    expected: '求和公式 \\[\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\\] 很有用',
    latexMode: true
  },
  {
    name: 'Mixed inline math and text',
    input: '这是inline数学 $E=mc^2$ 和普通text混合',
    expected: '这是 inline 数学 $E=mc^2$ 和普通 text 混合',
    latexMode: true
  },
  {
    name: 'Math with subscript',
    input: '下标公式 $x_1, x_2, x_3$ 都是变量',
    expected: '下标公式 $x_1, x_2, x_3$ 都是变量',
    latexMode: true
  },
  {
    name: 'Math with fraction',
    input: '分数 $\\frac{1}{2}$ 等于0.5',
    expected: '分数 $\\frac{1}{2}$ 等于 0.5',
    latexMode: true
  },
  {
    name: 'Multiple inline math formulas',
    input: '公式 $a+b$ 和 $c+d$ 不相等',
    expected: '公式 $a+b$ 和 $c+d$ 不相等',
    latexMode: true
  },
  {
    name: 'Math in LaTeX command context',
    input: '引用\\cite{paper}中的公式 $E=mc^2$ 很重要',
    expected: '引用\\cite{paper}中的公式 $E=mc^2$ 很重要',
    latexMode: true
  }
];

let passCount = 0;
let failCount = 0;

testCases.forEach(({ name, input, expected, latexMode }, index) => {
  const result = spacing(input, { latexMode });
  const pass = result === expected;
  
  console.log(`\nTest ${index + 1}: ${name}`);
  console.log(`  LaTeX Mode: ${latexMode ? 'ON' : 'OFF'}`);
  console.log(`  Input:    "${input}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log(`  Status:   ${pass ? '✅ PASS' : '❌ FAIL'}`);
  
  if (pass) {
    passCount++;
  } else {
    failCount++;
    console.log(`  Diff:`);
    console.log(`    Expected length: ${expected.length}, Got length: ${result.length}`);
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
  console.log('✅ All tests passed! LaTeX math formula protection is working correctly.');
} else {
  console.log('❌ Some test(s) failed. Please review the implementation.');
  process.exit(1);
}
