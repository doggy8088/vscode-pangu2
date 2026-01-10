/**
 * Test to reproduce the bug with {0} being replaced by URL
 */

const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\\u0370-\\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\\u0370-\\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])([${CJK}])`, 'g');
const URL = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*)/ig;
const LATEX_COMMAND = /\\[a-zA-Z]+(?:\*)?(?:\[[^\]]*\])*(?:\{[^}]*\})*/g;

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
  newText = newText.replace(CJK_ANS, '$1 $2');
  newText = newText.replace(ANS_CJK, '$1 $2');
  
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

console.log('🐛 Bug Reproduction Test\n');
console.log('='.repeat(80));

const bugInput = `\\SetAlgoNlRelativeSize{0}

% 设置交叉引用标签名称
% https://bithesis.bitnp.net/faq/autoref-name.html`;

const expected = `\\SetAlgoNlRelativeSize{0}

% 设置交叉引用标签名称
% https://bithesis.bitnp.net/faq/autoref-name.html`;

console.log('\n📝 Input:');
console.log(bugInput);

const result = spacing(bugInput, { latexMode: true });

console.log('\n📤 Output:');
console.log(result);

console.log('\n✅ Expected:');
console.log(expected);

console.log('\n🔍 Analysis:');
console.log(`  Input contains {0}: ${bugInput.includes('{0}')}`);
console.log(`  Output contains {0}: ${result.includes('{0}')}`);
console.log(`  Bug reproduced: ${result !== expected ? 'YES ❌' : 'NO ✅'}`);

if (result !== expected) {
  console.log('\n💥 BUG CONFIRMED!');
  console.log('  The {0} in \\SetAlgoNlRelativeSize{0} is being replaced by the URL!');
  console.log('\n  Root cause:');
  console.log('    1. URL is protected and stored as {0}');
  console.log('    2. LaTeX command contains literal {0}');
  console.log('    3. URL restoration replaces ALL {0} including the one in LaTeX command');
}
