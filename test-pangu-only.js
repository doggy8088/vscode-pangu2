// Simple test for Pangu functionality 
// First compile the TypeScript to JavaScript in out/ directory

const fs = require('fs');
const path = require('path');

// Check if compiled JS exists
const compiledPath = path.join(__dirname, 'out', 'main.js');
if (!fs.existsSync(compiledPath)) {
    console.log('Compiled JS not found. Compiling TypeScript first...');
    process.exit(1);
}

// Read the Pangu.ts file content and create a standalone version for testing
const panguSource = fs.readFileSync(path.join(__dirname, 'src', 'Pangu.ts'), 'utf8');

// Extract the class content (simplified version for testing)
const testCode = `
// Extracted Pangu class for testing
const CJK = '\\u2e80-\\u2eff\\u2f00-\\u2fdf\\u3040-\\u309f\\u30a0-\\u30fa\\u30fc-\\u30ff\\u3100-\\u312f\\u3200-\\u32ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const ANY_CJK = new RegExp(\`[\${CJK}]\`);
const CJK_ANS = new RegExp(\`([\${CJK}])([A-Za-z\\u0370-\\u03ff0-9@\\\\$%\\\\^&\\\\*\\\\-\\\\+\\\\\\\\=\\\\|/\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])\`, 'g');
const ANS_CJK = new RegExp(\`([A-Za-z\\u0370-\\u03ff0-9~\\\\$%\\\\^&\\\\*\\\\-\\\\+\\\\\\\\=\\\\|/!;:,\\\\\\.\\\\?\\u00a1-\\u00ff\\u2150-\\u218f\\u2700—\\u27bf])([\${CJK}])\`, 'g');
const URL = /https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=\\u2e80-\\u2eff\\u2f00-\\u2fdf\\u3040-\\u309f\\u30a0-\\u30fa\\u30fc-\\u30ff\\u3100-\\u312f\\u3200-\\u32ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff]*)/ig;

class Pangu {
    spacing(text) {
        if (typeof text !== 'string') {
            console.warn(\`spacing(text) only accepts string but got \${typeof text}\`);
            return text;
        }

        if (text.length <= 1 || !ANY_CJK.test(text)) {
            return text;
        }

        let newText = text;

        // 為了避免「網址」被加入了盤古之白，所以要從轉換名單中剔除
        let index = 0;
        const matchUrls = [];
        newText = newText.replace(URL, (match) => {
            matchUrls.push(match);
            return \`{\${index++}}\`;
        });

        newText = newText.replace(CJK_ANS, '$1 $2');
        newText = newText.replace(ANS_CJK, '$1 $2');

        // 還原網址
        newText = newText.replace(/{\\d+}/g, (match) => {
            const number = parseInt(match.match(/\\d+/)[0]);
            return matchUrls[number];
        });

        return newText;
    }
}

const pangu = new Pangu();

// Test cases for tilde character handling
const testCases = [
    '好开心~',
    '好开心~~不开心~~',
    '好开心~今天天气不错~',
    '这是&#126;一个HTML实体',
    '单个~波浪号',
    '双个~~删除线~~波浪号',
    '混合内容: 好开心~ ~~删除线~~ 结束'
];

console.log('Testing Pangu spacing with tilde characters:');
console.log('='.repeat(50));

testCases.forEach((testCase, index) => {
    console.log(\`\\nTest \${index + 1}: "\${testCase}"\`);
    try {
        const result = pangu.spacing(testCase);
        console.log(\`Result:   "\${result}"\`);
        console.log(\`Changed:  \${testCase !== result ? 'YES' : 'NO'}\`);
    } catch (error) {
        console.log(\`Error: \${error.message}\`);
    }
});
`;

eval(testCode);