import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkPangu from './remark-pangu.js';
import remarkAzureDevOpsWiki from './remark-azure-devops-wiki.js';

const DIRECTIVE_PLACEHOLDER_PREFIX = '。。PANGU。DIRECTIVE。BLOCK。。';
const DIRECTIVE_PLACEHOLDER_SUFFIX = '。。END。。';
const HTML_ENTITY_PLACEHOLDER_PREFIX = '。。PANGU。HTML。ENTITY。。';
const HTML_ENTITY_PLACEHOLDER_SUFFIX = '。。END。。';

export interface MarkdownLogger {
  appendLine(message: string): void;
}

const noopLogger: MarkdownLogger = {
  appendLine: () => {},
};

export interface MarkdownFormatOptions {
  enableLooseFormatting?: boolean;
  protectDirectives?: boolean;
  preserveWhitespace?: boolean;
  originalText?: string;
  originalEol?: '\n' | '\r\n';
  logger?: MarkdownLogger;
}

export interface MarkdownFormatMetadata {
  directiveBlocks: number;
  bracketReplacements: number;
  boldSpacingFixes: number;
  colonFixes: number;
  tocReplacements: number;
  whitespaceRestored: number;
  htmlEntitiesPreserved: number;
}

export interface MarkdownFormatResult {
  text: string;
  metadata: MarkdownFormatMetadata;
}

export function formatMarkdownContent(
  text: string,
  options: MarkdownFormatOptions = {}
): MarkdownFormatResult {
  const logger = options.logger ?? noopLogger;

  logger.appendLine('  📄 Markdown formatter started');

  let workingText = text;
  let directiveBlocks: string[] = [];

  if (options.protectDirectives) {
    const directiveResult = protectDirectiveBlocks(workingText, logger);
    workingText = directiveResult.text;
    directiveBlocks = directiveResult.blocks;
  }

  const preprocessing = preprocessMarkdown(workingText, logger);
  workingText = preprocessing.text;

  logger.appendLine('  🚀 Starting remark processing pipeline...');
  let parsed = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkAzureDevOpsWiki(logger))
    .use(remarkPangu(logger))
    .use(remarkStringify, {
      emphasis: '_',
      bullet: '-',
      rule: '-',
    })
    .processSync(workingText)
    .toString();
  logger.appendLine('  ✅ Remark processing completed');

  if (preprocessing.htmlEntities.length > 0) {
    parsed = restoreHtmlEntities(parsed, preprocessing.htmlEntities, logger);
  }

  if (options.protectDirectives && directiveBlocks.length > 0) {
    parsed = restoreDirectiveBlocks(parsed, directiveBlocks, logger);
  }

  const tocResult = fixSpecialSyntax(parsed, logger);
  parsed = tocResult.text;

  if (options.enableLooseFormatting) {
    logger.appendLine('  🎨 Applying loose formatting...');
    const beforeLoose = parsed;
    parsed = applyLooseFormatting(parsed);
    if (beforeLoose !== parsed) {
      logger.appendLine('  ✅ Loose formatting applied (changed)');
    } else {
      logger.appendLine('  ➡️  Loose formatting applied (no changes)');
    }
  } else {
    logger.appendLine('  ⏭️  Loose formatting disabled');
  }

  let whitespaceRestored = 0;
  if (options.preserveWhitespace && options.originalText) {
    const eol = options.originalEol ?? inferEol(options.originalText);
    const preserveResult = restoreWhitespaceOnlyLines(
      options.originalText,
      parsed,
      eol,
      logger
    );
    parsed = preserveResult.text;
    whitespaceRestored = preserveResult.restored;
  }

  logger.appendLine('  🏁 Markdown formatter completed');

  return {
    text: parsed,
    metadata: {
      directiveBlocks: directiveBlocks.length,
      bracketReplacements: preprocessing.bracketReplacements,
      boldSpacingFixes: preprocessing.boldSpacingFixes,
      colonFixes: preprocessing.colonFixes,
      tocReplacements: tocResult.replacements,
      whitespaceRestored,
      htmlEntitiesPreserved: preprocessing.htmlEntities.length,
    },
  };
}

interface DirectiveProtectionResult {
  text: string;
  blocks: string[];
}

function protectDirectiveBlocks(text: string, logger: MarkdownLogger): DirectiveProtectionResult {
  logger.appendLine('  🛡️ Protecting directive blocks before remark processing...');
  const directiveRegex = /^(:::[\s]*[a-zA-Z][a-zA-Z0-9-_]*(?:\s+.*)?)\n([\s\S]*?)^:::$/gm;
  const blocks: string[] = [];

  const replaced = text.replace(directiveRegex, (match) => {
    const blockIndex = blocks.length;
    blocks.push(match);
    logger.appendLine(`    📦 Stored directive block ${blockIndex}`);
    return `${DIRECTIVE_PLACEHOLDER_PREFIX}${blockIndex}${DIRECTIVE_PLACEHOLDER_SUFFIX}`;
  });

  if (blocks.length > 0) {
    logger.appendLine(`  ✅ Protected ${blocks.length} directive blocks`);
  } else {
    logger.appendLine('  ➡️  No directive blocks found');
  }

  return { text: replaced, blocks };
}

function restoreDirectiveBlocks(text: string, blocks: string[], logger: MarkdownLogger): string {
  logger.appendLine('  🧩 Restoring directive blocks...');

  let restored = text;
  let restoredCount = 0;

  blocks.forEach((block, index) => {
    const token = `${DIRECTIVE_PLACEHOLDER_PREFIX}${index}${DIRECTIVE_PLACEHOLDER_SUFFIX}`;
    if (restored.includes(token)) {
      restored = restored.split(token).join(block);
      logger.appendLine(`    🔁 Restored directive block ${index}`);
      restoredCount++;
    } else {
      logger.appendLine(`    ⚠️  Placeholder not found for directive block ${index}`);
    }
  });

  logger.appendLine(`  ✅ Restored ${restoredCount}/${blocks.length} directive blocks`);
  return restored;
}

interface PreprocessResult {
  text: string;
  bracketReplacements: number;
  boldSpacingFixes: number;
  colonFixes: number;
  htmlEntities: string[];
}

interface HtmlEntityProtectionResult {
  text: string;
  entities: string[];
}

function preprocessMarkdown(text: string, logger: MarkdownLogger): PreprocessResult {
  logger.appendLine('  🔧 Pre-processing LLM output issues...');

  const entityProtection = protectHtmlEntities(text, logger);
  let workingText = entityProtection.text;

  let bracketReplacements = 0;
  const bracketLines = workingText.split('\n').map((line, index) => {
    const replaced = line.replace(/（([^）]+)）/g, (_match, content) => {
      bracketReplacements++;
      return '(' + content + ')';
    });
    if (replaced !== line) {
      logger.appendLine(`    Line ${index + 1}: 全形括號替換 "${line}" → "${replaced}"`);
    }
    return replaced;
  });

  if (bracketReplacements > 0) {
    logger.appendLine(`  ✅ Bracket replacements: ${bracketReplacements}`);
  } else {
    logger.appendLine('  ➡️  No bracket replacements needed');
  }

  const boldSpacing = applyRegexWithCount(
    bracketLines.join('\n'),
    /([\)）]\*\*)([^\p{P}])/gu,
    '$1 $2'
  );

  if (boldSpacing.count > 0) {
    logger.appendLine('    ✅ Applied bold spacing fixes');
  }

  const boldColon = applyRegexWithCount(
    boldSpacing.text,
    /([:：])(\*\*)([^\p{P}])/gu,
    '$2$1$3'
  );

  if (boldColon.count > 0) {
    logger.appendLine('    ✅ Applied bold colon fixes');
  }

  if (bracketReplacements === 0 && boldSpacing.count === 0 && boldColon.count === 0) {
    logger.appendLine('  ➡️  No pre-processing changes needed');
  }

  return {
    text: boldColon.text,
    bracketReplacements,
    boldSpacingFixes: boldSpacing.count,
    colonFixes: boldColon.count,
    htmlEntities: entityProtection.entities,
  };
}

function protectHtmlEntities(text: string, logger: MarkdownLogger): HtmlEntityProtectionResult {
  logger.appendLine('  🛡️ Protecting HTML entities before remark processing...');

  const htmlEntityRegex = /&(#[0-9]+;|#[xX][0-9a-fA-F]+;|[a-zA-Z][a-zA-Z0-9:-]*;)/g;
  const entities: string[] = [];

  const replaced = text.replace(htmlEntityRegex, (match) => {
    const entityIndex = entities.length;
    entities.push(match);
    return `${HTML_ENTITY_PLACEHOLDER_PREFIX}${entityIndex}${HTML_ENTITY_PLACEHOLDER_SUFFIX}`;
  });

  if (entities.length > 0) {
    logger.appendLine(`  ✅ Protected ${entities.length} HTML entities`);
  } else {
    logger.appendLine('  ➡️  No HTML entities found');
  }

  return { text: replaced, entities };
}

function restoreHtmlEntities(text: string, entities: string[], logger: MarkdownLogger): string {
  logger.appendLine('  🧩 Restoring HTML entities...');

  let restored = text;
  let restoredCount = 0;

  entities.forEach((entity, index) => {
    const token = `${HTML_ENTITY_PLACEHOLDER_PREFIX}${index}${HTML_ENTITY_PLACEHOLDER_SUFFIX}`;
    if (restored.includes(token)) {
      restored = restored.split(token).join(entity);
      logger.appendLine(`    🔁 Restored HTML entity ${index}`);
      restoredCount++;
    } else {
      logger.appendLine(`    ⚠️  Placeholder not found for HTML entity ${index}`);
    }
  });

  logger.appendLine(`  ✅ Restored ${restoredCount}/${entities.length} HTML entities`);
  return restored;
}

interface RegexReplaceResult {
  text: string;
  count: number;
}

function applyRegexWithCount(text: string, regex: RegExp, replacement: string): RegexReplaceResult {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const globalRegex = new RegExp(regex.source, flags);

  const matches = text.match(globalRegex);
  const count = matches ? matches.length : 0;

  globalRegex.lastIndex = 0;
  const replaced = count > 0 ? text.replace(globalRegex, replacement) : text;

  return { text: replaced, count };
}

interface TocFixResult {
  text: string;
  replacements: number;
}

function fixSpecialSyntax(text: string, logger: MarkdownLogger): TocFixResult {
  let replacements = 0;
  let result = text;

  if (result.includes('\\[\\[_TOC_]]')) {
    result = result.replace('\\[\\[_TOC_]]', '[[_TOC_]]');
    replacements++;
    logger.appendLine('  🔧 Fixed Azure DevOps TOC syntax escaping');
  }

  if (result.includes('\\[\\[_TOSP_]]')) {
    result = result.replace('\\[\\[_TOSP_]]', '[[_TOSP_]]');
    replacements++;
    logger.appendLine('  🔧 Fixed Azure DevOps TOSP syntax escaping');
  }

  if (result.toLowerCase().includes('\\[toc]')) {
    const replaced = result.replace(/\\\[TOC\]/i, '[TOC]');
    if (replaced !== result) {
      result = replaced;
      replacements++;
      logger.appendLine('  🔧 Fixed HackMD TOC syntax escaping');
    }
  }

  if (replacements === 0) {
    logger.appendLine('  ➡️  No TOC syntax fixes needed');
  }

  return { text: result, replacements };
}

function applyLooseFormatting(text: string): string {
  let result = text;

  result = result.replace(/\\(_)/g, (match, underscore, offset, string) => {
    const beforeChar = offset > 0 ? string[offset - 1] : '';
    const afterChar = offset + 2 < string.length ? string[offset + 2] : '';

    if (/[a-zA-Z0-9]/.test(beforeChar) && /[a-zA-Z0-9]/.test(afterChar)) {
      return underscore;
    }

    if (!/\S/.test(beforeChar) || !/\S/.test(afterChar)) {
      return underscore;
    }

    return underscore;
  });

  result = result.replace(/\\(\[)/g, (match, bracket, offset, string) => {
    const beforeContext = string.substring(Math.max(0, offset - 10), offset + 2);
    if (/^#+ \\?\[/.test(beforeContext.trim())) {
      return bracket;
    }

    const afterContext = string.substring(offset + 2, Math.min(string.length, offset + 50));
    if (!afterContext.match(/^[^\]]*\]\s*[\(\[]/)) {
      return bracket;
    }

    return match;
  });

  result = result.replace(/\\(~)/g, (match, tilde, offset, string) => {
    const nextChars = string.substring(offset + 2, offset + 4);
    if (nextChars === '\\~') {
      const restOfString = string.substring(offset + 4);
      if (restOfString.includes('\\~\\~')) {
        return match;
      }
    }

    const prevChars = string.substring(offset - 2, offset);
    if (prevChars === '\\~') {
      const restOfString = string.substring(offset + 2);
      if (restOfString.includes('\\~\\~')) {
        return match;
      }
    }

    const afterChars = string.substring(offset + 2, offset + 4);
    const beforeTwoChars = string.substring(offset - 2, offset);
    if (afterChars === '\\~' || beforeTwoChars === '\\~') {
      const textBefore = string.substring(0, offset - 2);
      if (textBefore.includes('\\~\\~')) {
        return match;
      }
    }

    return tilde;
  });

  return result;
}

interface WhitespaceRestoreResult {
  text: string;
  restored: number;
}

function restoreWhitespaceOnlyLines(
  originalText: string,
  parsedText: string,
  eol: '\n' | '\r\n',
  logger: MarkdownLogger
): WhitespaceRestoreResult {
  logger.appendLine('  🔧 Checking whitespace-only line preservation...');

  try {
    const parsedHasFinalNl = /\r?\n$/.test(parsedText);
    const origLines = originalText.split(/\r?\n/);
    const newLines = parsedText.split(/\r?\n/);

    logger.appendLine(`  📐 Original lines: ${origLines.length}, New lines: ${newLines.length}`);

    if (origLines.length !== newLines.length) {
      logger.appendLine('  ⚠️  Line count mismatch - skipping whitespace preservation');
      return { text: parsedText, restored: 0 };
    }

    let restoredCount = 0;
    for (let i = 0; i < origLines.length; i++) {
      if (/^[\t ]+$/.test(origLines[i]) && newLines[i] === '') {
        newLines[i] = origLines[i];
        restoredCount++;
      }
    }

    const joined = newLines.join(eol) + (parsedHasFinalNl ? eol : '');

    if (restoredCount > 0) {
      logger.appendLine(`  ✅ Restored ${restoredCount} whitespace-only lines`);
    } else {
      logger.appendLine('  ➡️  No whitespace-only lines needed restoration');
    }

    return { text: joined, restored: restoredCount };
  } catch (error) {
    logger.appendLine(`  ❌ Error in whitespace preservation: ${error}`);
    return { text: parsedText, restored: 0 };
  }
}

function inferEol(text: string): '\n' | '\r\n' {
  return /\r\n/.test(text) ? '\r\n' : '\n';
}
