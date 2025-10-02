// 測試每一步的變化
const CJK = '\u2e80-\u2eff\u2f00-\u2fdf\u3040-\u309f\u30a0-\u30fa\u30fc-\u30ff\u3100-\u312f\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff';
const AN_LEFT_BRACKET = /([A-Za-z0-9])([\(\[\{])/g;
const RIGHT_BRACKET_AN = /([\)\]\}])([A-Za-z0-9])/g;
const CJK_ANS = new RegExp(`([${CJK}])([A-Za-z\u0370-\u03ff0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/\u00a1-\u00ff\u2150-\u218f\u2700—\u27bf])`, 'g');

const text = '預存程序使用 GETDATE()';

console.log('原始文字:', text);
console.log();

let step1 = text.replace(AN_LEFT_BRACKET, '$1 $2');
console.log('步驟1 - AN_LEFT_BRACKET:', step1);
console.log('  規則: /([A-Za-z0-9])([\\(\\[\\{])/g -> "$1 $2"');

let step2 = step1.replace(RIGHT_BRACKET_AN, '$1 $2');
console.log('步驟2 - RIGHT_BRACKET_AN:', step2);
console.log('  規則: /([\\)\\]\\}])([A-Za-z0-9])/g -> "$1 $2"');

let step3 = step2.replace(CJK_ANS, '$1 $2');
console.log('步驟3 - CJK_ANS:', step3);
console.log('  規則: CJK + ANS -> "CJK ANS"');

console.log();
console.log('===== 測試空括號情況 =====');
const text2 = 'ABC()';
console.log('原始:', text2);
console.log('AN_LEFT_BRACKET:', text2.replace(AN_LEFT_BRACKET, '$1 $2'));
console.log('RIGHT_BRACKET_AN:', text2.replace(AN_LEFT_BRACKET, '$1 $2').replace(RIGHT_BRACKET_AN, '$1 $2'));
