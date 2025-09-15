// Simple test for markdown processing
const { remark } = require('remark');
const remarkGfm = require('remark-gfm');

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

console.log('Testing remark tilde handling (fixed):');
console.log('='.repeat(50));

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    
    try {
        const result = remark()
            .use(remarkGfm)
            .processSync(testCase)
            .toString()
            .trim();
            
        console.log(`Result:   "${result}"`);
        console.log(`Changed:  ${testCase !== result ? 'YES' : 'NO'}`);
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
});