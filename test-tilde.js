// Test script to understand tilde character handling
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
    '混合内容: 好开心~ ~~删除线~~ 结束'
];

console.log('Testing tilde character handling with remark:');
console.log('='.repeat(50));

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    
    try {
        const result = unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkStringify, {
                emphasis: '_',
                bullet: '-', 
                rule: '-',
            })
            .processSync(testCase)
            .toString()
            .trim();
            
        console.log(`Result:   "${result}"`);
        console.log(`Changed:  ${testCase !== result ? 'YES' : 'NO'}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
});

console.log('\n\nTesting with Pangu only:');
console.log('='.repeat(50));

// Test Pangu spacing function
try {
    const { pangu } = require('./out/main.js');
    
    testCases.forEach((testCase, index) => {
        console.log(`\nPangu Test ${index + 1}: "${testCase}"`);
        try {
            const result = pangu.spacing(testCase);
            console.log(`Result:        "${result}"`);
            console.log(`Changed:       ${testCase !== result ? 'YES' : 'NO'}`);
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    });
} catch (error) {
    console.log(`Could not load Pangu from main.js: ${error.message}`);
    console.log('Trying to compile TypeScript first...');
}