// Test with just markdown processing to understand tilde escaping

const { unified } = require('unified');
const remarkParse = require('remark-parse');
const remarkGfm = require('remark-gfm');
const remarkStringify = require('remark-stringify');

// Test cases for tilde character handling
const testCases = [
    '好开心~',
    '好开心~~不开心~~',
    '好开心~今天天气不错~',
    '这是&#126;一个HTML实体',
    '单个~波浪号',
    '双个~~删除线~~波浪号',
    '混合内容: 好开心~ ~~删除线~~ 结束',
    'H~2~O',  // GitHub example from comments
    '~text~',  // Simple case
    'text~',   // Trailing tilde
    '~text',   // Leading tilde  
];

console.log('Testing remark tilde handling:');
console.log('='.repeat(50));

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    
    try {
        const processor = unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkStringify, {
                emphasis: '_',
                bullet: '-', 
                rule: '-',
            });
            
        const result = processor
            .processSync(testCase)
            .toString()
            .trim();
            
        console.log(`Result:   "${result}"`);
        console.log(`Changed:  ${testCase !== result ? 'YES' : 'NO'}`);
        
        // Also test the AST to understand what's happening
        const ast = processor.parse(testCase);
        console.log(`AST:      ${JSON.stringify(ast, null, 2).substring(0, 200)}...`);
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
});