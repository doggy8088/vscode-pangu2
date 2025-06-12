import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';

// Test the issue with underscore and square brackets
const testCases = [
  'hello_world',
  '## [文字]',
  'some_variable_name',
  '# [Tutorial] How to use'
];

testCases.forEach(testText => {
  console.log('Input:', testText);
  
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkStringify, {
      emphasis: '_',
      bullet: '-',
      rule: '-',
    })
    .processSync(testText)
    .toString();
    
  console.log('Output:', result.trim());
  console.log('---');
});