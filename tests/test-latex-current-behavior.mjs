// Inline Pangu class for testing
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const ANY_CJK = new RegExp(`[${CJK}]`);
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\\u0370-\\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])`, 'g');
const ANS_CJK = new RegExp(`([A-Za-z\\u0370-\\u03ff0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])([${CJK}])`, 'g');

function spacing(text) {
  if (typeof text !== 'string' || text.length <= 1 || !ANY_CJK.test(text)) {
    return text;
  }
  
  let newText = text;
  // Basic CJK spacing (simplified for testing)
  newText = newText.replace(CJK_ANS, '$1 $2');
  newText = newText.replace(ANS_CJK, '$1 $2');
  
  return newText;
}

console.log('Testing current Pangu behavior with LaTeX:\n');

const testCases = [
  {
    name: 'LaTeX cite with tilde (issue example 1)',
    input: '自监督学习通过设计代理任务，如掩码建模~\\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）',
    expected: '自监督学习通过设计代理任务，如掩码建模~\\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）',
    // Current behavior adds space after tilde: ~\cite -> ~ \cite
    currentBehavior: '自监督学习通过设计代理任务，如掩码建模~ \\cite{Xie00LBYD022,HeCXLDG22}（Masked Image Modelling）'
  },
  {
    name: 'LaTeX begin with CJK (issue example 2)',
    input: '\\begin{figure}[htbp]',
    expected: '\\begin{figure}[htbp]',
    currentBehavior: '\\begin {figure}[htbp]' // Adds space after command
  },
  {
    name: 'LaTeX caption with CJK (issue example 2)',
    input: '    \\caption{视觉自注意力编码器内部结构}',
    expected: '    \\caption{视觉自注意力编码器内部结构}',
    currentBehavior: '    \\caption {视觉自注意力编码器内部结构}' // Adds space before {
  },
  {
    name: 'LaTeX label (issue example 2)',
    input: '    \\label{fig:2.7-inside-vit}',
    expected: '    \\label{fig:2.7-inside-vit}',
    currentBehavior: '    \\label {fig:2.7-inside-vit}' // Adds space before {
  },
  {
    name: 'LaTeX includegraphics (issue example 2)',
    input: '    \\includegraphics[width=0.78\\linewidth]{figures/chap2.7-inside-vit.png}',
    expected: '    \\includegraphics[width=0.78\\linewidth]{figures/chap2.7-inside-vit.png}',
    currentBehavior: '    \\includegraphics [width=0.78\\linewidth]{figures/chap2.7-inside-vit.png}' // Adds space before [
  }
];

testCases.forEach(({ name, input, expected }) => {
  const result = spacing(input);
  const pass = result === expected;
  
  console.log(`Test: ${name}`);
  console.log(`  Input:    "${input}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Got:      "${result}"`);
  console.log(`  Status:   ${pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});
