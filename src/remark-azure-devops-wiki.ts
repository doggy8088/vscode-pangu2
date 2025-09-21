// https://github.com/orgs/remarkjs/discussions/1258

import { visit } from 'unist-util-visit';
import { Node } from 'unified/lib';

/**
 * 專門用來處理 Azure DevOps 的 Wikis 語法 (remark plugin)
 *
 * @export
 * @param {*} logger
 * @return {*}
 *
 * @remark https://unifiedjs.com/learn/guide/create-a-plugin/
 */
export default function remarkAzureDevOpsWiki(logger: any) {
  let enableDebug = true;

  if (!enableDebug) {
    logger = {
      appendLine: (text: string) => {},
    };
  }

  return () => {
    return (tree: Node) => {
      logger.appendLine(`\n🔧 Azure DevOps Wiki plugin started`);
      const treeWithChildren = tree as any; // Type assertion for children access
      logger.appendLine(`📊 Tree has ${treeWithChildren.children?.length || 0} root children`);

      let TOC_node: any;
      let TOC_type: string = '';

      // STEP 1: 處理 ::: type 語法區塊，將其標記為不處理
      logger.appendLine(`\n📝 STEP 1: Processing directive blocks (::: type syntax)`);
      const nodesToReplace: any[] = [];
      let directiveStartIndex = -1;
      let directiveType = '';
      let directivesFound = 0;

      treeWithChildren.children?.forEach((node: any, index: number) => {
        logger.appendLine(`  🔍 Examining node ${index}: type=${node.type}`);

        if (node.type === 'paragraph' && node.children?.[0]?.type === 'text') {
          const textValue = node.children[0].value;
          logger.appendLine(`    📄 Paragraph text: "${textValue}"`);

          // 檢查是否為 ::: type 開始
          const directiveStart = textValue.match(/^:::[\s]*([a-zA-Z][a-zA-Z0-9-_]*)/);
          if (directiveStart) {
            directiveStartIndex = index;
            directiveType = directiveStart[1];
            directivesFound++;
            logger.appendLine(`    🚀 Found directive start: "${directiveType}" at index ${index}`);
            return;
          }

          // 檢查是否為 ::: 結束
          if (textValue.trim() === ':::' && directiveStartIndex !== -1) {
            logger.appendLine(`    🏁 Found directive end at index ${index}, marking nodes ${directiveStartIndex}-${index} as literal`);

            // 將整個區塊標記為 literal，防止 pangu 處理
            let markedCount = 0;
            for (let i = directiveStartIndex; i <= index; i++) {
              const nodeToMark = treeWithChildren.children[i];
              if (nodeToMark) {
                // 添加一個標記，讓 pangu plugin 跳過這些節點
                nodeToMark._azureDevOpsDirective = true;
                nodeToMark._directiveType = directiveType;
                markedCount++;
                logger.appendLine(`      🏷️  Marked node ${i} (type: ${nodeToMark.type}) with directive: ${directiveType}`);
              }
            }
            logger.appendLine(`    ✅ Successfully marked ${markedCount} nodes for directive: ${directiveType}`);

            // 重置狀態
            directiveStartIndex = -1;
            directiveType = '';
            return;
          }

          // 如果在 directive 區塊內，標記此節點
          if (directiveStartIndex !== -1) {
            node._azureDevOpsDirective = true;
            node._directiveType = directiveType;
            logger.appendLine(`    🔖 Marked intermediate node ${index} in directive: ${directiveType}`);
          }
        } else {
          logger.appendLine(`    ⏭️  Skipping node ${index}: not a text paragraph (type: ${node.type})`);
        }
      });

      logger.appendLine(`📊 STEP 1 Summary: Found ${directivesFound} directive blocks`);
      if (directiveStartIndex !== -1) {
        logger.appendLine(`⚠️  Warning: Unclosed directive "${directiveType}" starting at index ${directiveStartIndex}`);
      }

      // STEP 2: 判斷 paragraph 節點是否包含有 [[_TOC_]] 語法
      logger.appendLine(`\n📝 STEP 2: Processing TOC syntax ([[_TOC_]], [[_TOSP_]])`);
      let tocNodesChecked = 0;
      let tocNodesSkipped = 0;

      visit(tree, 'paragraph', (node: any) => {
        tocNodesChecked++;

        // 跳過已被標記為 directive 的節點
        if (node._azureDevOpsDirective) {
          tocNodesSkipped++;
          logger.appendLine(`  ⏭️  Skipping paragraph node (marked as directive: ${node._directiveType})`);
          return;
        }

        logger.appendLine(`  🔍 Checking paragraph node for TOC syntax`);
        logger.appendLine(`    Children count: ${node.children?.length || 0}`);

        if (node.children?.length >= 3) {
          logger.appendLine(`    Child[0]: type=${node.children[0]?.type}, value="${node.children[0]?.value}"`);
          logger.appendLine(`    Child[1]: type=${node.children[1]?.type}`);
          logger.appendLine(`    Child[2]: type=${node.children[2]?.type}, value="${node.children[2]?.value}"`);

          if (node.children[1]?.type === 'emphasis' && node.children[1]?.children?.[0]) {
            logger.appendLine(`    Emphasis child: value="${node.children[1].children[0].value}"`);
          }
        }

        if (node.children?.[0]?.value === '[['
         && node.children?.[1]?.type === 'emphasis'
         && (node.children?.[1]?.children?.[0]?.value === 'TOC' || node.children?.[1]?.children?.[0]?.value === 'TOSP')
         && node.children?.[2]?.value === ']]')
        {
          const tocValue = node.children[1].children[0].value;
          logger.appendLine(`    ✅ Found TOC syntax: [[_${tocValue}_]]`);

          if (tocValue === 'TOC') {
            TOC_type = 'toc';
            logger.appendLine(`    🎯 Identified as Azure DevOps TOC`);
          }
          if (tocValue === 'TOSP') {
            TOC_type = 'tosp';
            logger.appendLine(`    🎯 Identified as Azure DevOps TOSP`);
          }
          TOC_node = node;
        } else {
          logger.appendLine(`    ➡️  Not a TOC syntax pattern`);
        }
      });

      logger.appendLine(`📊 STEP 2 Summary: Checked ${tocNodesChecked} paragraph nodes, skipped ${tocNodesSkipped} directive nodes`);

      if (!!TOC_node && !!TOC_type) {
        logger.appendLine(`\n🔧 STEP 3: Processing found TOC node (type: ${TOC_type})`);
        logger.appendLine(`  📋 Original node structure:`);
        logger.appendLine(`    Children count: ${TOC_node.children?.length}`);
        TOC_node.children?.forEach((child: any, idx: number) => {
          logger.appendLine(`    Child[${idx}]: type=${child.type}, value="${child.value || 'N/A'}"`);
        });

        switch (TOC_type) {
          case 'toc':
            logger.appendLine(`  🔄 Converting to [[_TOC_]] format`);
            logger.appendLine(`    Before: value="${TOC_node.children[0].value}"`);
            // TOC_node.type = 'literal';
            TOC_node.children[0].value = '[[_TOC_]]';
            TOC_node.children[0].raw = TOC_node.children[0].value;
            logger.appendLine(`    After: value="${TOC_node.children[0].value}"`);

            // Update position info
            const originalEndColumn = TOC_node.children[0].position?.end?.column || 0;
            const originalEndOffset = TOC_node.children[0].position?.end?.offset || 0;
            if (TOC_node.children[0].position?.end) {
              TOC_node.children[0].position.end.column += 7;
              TOC_node.children[0].position.end.offset += 7;
              logger.appendLine(`    Position updated: column ${originalEndColumn} → ${TOC_node.children[0].position.end.column}, offset ${originalEndOffset} → ${TOC_node.children[0].position.end.offset}`);
            }
            break;

          case 'tosp':
            logger.appendLine(`  🔄 Converting to [[_TOSP_]] format`);
            logger.appendLine(`    Before: value="${TOC_node.children[0].value}"`);
            // TOC_node.type = 'literal';
            TOC_node.children[0].value = '[[_TOSP_]]';
            TOC_node.children[0].raw = TOC_node.children[0].value;
            logger.appendLine(`    After: value="${TOC_node.children[0].value}"`);

            // Update position info
            const originalEndColumn2 = TOC_node.children[0].position?.end?.column || 0;
            const originalEndOffset2 = TOC_node.children[0].position?.end?.offset || 0;
            if (TOC_node.children[0].position?.end) {
              TOC_node.children[0].position.end.column += 8;
              TOC_node.children[0].position.end.offset += 8;
              logger.appendLine(`    Position updated: column ${originalEndColumn2} → ${TOC_node.children[0].position.end.column}, offset ${originalEndOffset2} → ${TOC_node.children[0].position.end.offset}`);
            }
            break;

          default:
            logger.appendLine(`  ❌ Unknown TOC type: ${TOC_type}`);
            break;
        }

        // 徹底刪除 _TOC_ 與 ]] 節點
        logger.appendLine(`  🗑️  Removing emphasis and closing bracket nodes`);
        logger.appendLine(`    Children before splice: ${TOC_node.children.length}`);
        TOC_node.children.splice(1, 2);
        logger.appendLine(`    Children after splice: ${TOC_node.children.length}`);
        logger.appendLine(`  ✅ TOC processing completed`);
      } else {
        if (!TOC_node && !TOC_type) {
          logger.appendLine(`\n➡️  STEP 3: No TOC syntax found, skipping TOC processing`);
        } else {
          logger.appendLine(`\n⚠️  STEP 3: TOC processing issue - node: ${!!TOC_node}, type: "${TOC_type}"`);
        }
      }

      logger.appendLine(`\n🔍 Final tree structure debug:`);
      logger.appendLine('---');
      logger.appendLine(JSON.stringify(tree, null, 2));
      logger.appendLine('---');

      logger.appendLine(`🏁 Azure DevOps Wiki plugin completed`);
      logger.appendLine(`📊 Final summary:`);
      logger.appendLine(`  - Directive blocks found: ${directivesFound}`);
      logger.appendLine(`  - TOC syntax processed: ${!!TOC_node ? `Yes (${TOC_type})` : 'No'}`);
      logger.appendLine(`  - Paragraph nodes checked: ${tocNodesChecked}`);
      logger.appendLine(`  - Directive nodes skipped: ${tocNodesSkipped}`);

    };
  };

}
