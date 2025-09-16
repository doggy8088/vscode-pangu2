import { visit } from 'unist-util-visit';
import { pangu } from './Pangu';
import { Node } from 'unified/lib';

/**
 * 專門用來處理 Pangu 的 remark plugin
 *
 * @export
 * @param {*} logger
 * @return {*}
 *
 * @remark https://unifiedjs.com/learn/guide/create-a-plugin/
 */
export default function remarkPangu(logger: any) {
  let enableDebug = false;

  if (!enableDebug) {
    logger = {
      appendLine: (text: string) => {},
    };
  }

  return () => {
    return (tree: Node) => {
      // STEP 1: 先處理所有 text 節點
      visit(tree, 'text', (node: any, index: number, parent: any) => {
        // 跳過被 Azure DevOps Wiki 標記的節點
        if (parent && parent._azureDevOpsDirective) {
          logger.appendLine(`Skipping text node in Azure DevOps directive: ${parent._directiveType}`);
          return;
        }
        
        // 檢查父節點的父節點是否被標記（處理嵌套情況）
        let currentParent = parent;
        while (currentParent) {
          if (currentParent._azureDevOpsDirective) {
            logger.appendLine(`Skipping text node in nested Azure DevOps directive: ${currentParent._directiveType}`);
            return;
          }
          currentParent = currentParent.parent;
        }
        
        node.value = pangu.spacing(node.value);
      });

      // STEP 2: 再處理所有 paragraph 節點 (混合 text 與其他 inline 節點的情況)
      visit(tree, 'paragraph', (node: any) => {
        // 跳過被 Azure DevOps Wiki 標記的節點
        if (node._azureDevOpsDirective) {
          logger.appendLine(`Skipping paragraph node in Azure DevOps directive: ${node._directiveType}`);
          return;
        }
        node.children.forEach((child: any, index: number) => {
          logger.appendLine('---');
          logger.appendLine(JSON.stringify(child));
          logger.appendLine('---');

          let currNode = node.children[index];
          let nextNode = node.children[index + 1];

          if (!nextNode) return;

          if (currNode.type === 'text' && isInlineType(nextNode.type)) {
            logger.appendLine(
              `nextNode.type: ${nextNode.type}, nextNode.value: ${nextNode.value}`
            );
            let combineText = currNode.value + nextNode.value[0];
            let pangu_rized = pangu.spacing(combineText);
            logger.appendLine('--> ' + combineText);
            logger.appendLine('==> ' + pangu_rized);
            if (combineText !== pangu_rized) {
              currNode.value = currNode.value + ' ';
            }
          } else if (isInlineType(currNode.type) && nextNode.type === 'text') {
            logger.appendLine(
              `currNode.type: ${currNode.type}, currNode.value: ${currNode.value}`
            );
            let lastCharacter = currNode.value[currNode.value.length - 1];
            let combineText = lastCharacter + nextNode.value;
            let pangu_rized = pangu.spacing(combineText);
            logger.appendLine('--> ' + combineText);
            logger.appendLine('==> ' + pangu_rized);
            if (combineText !== pangu_rized) {
              nextNode.value = ' ' + nextNode.value;
            }
          }

          if (
            currNode.type === 'text' &&
            isInlineTypeWithChildren(nextNode.type)
          ) {
            logger.appendLine(
              `nextNode.type: ${nextNode.type}, nextNode.value: ${nextNode.children[0].value}`
            );
            let combineText = currNode.value + nextNode.children[0].value;
            let pangu_rized = pangu.spacing(combineText);
            if (combineText !== pangu_rized) {
              currNode.value = currNode.value + ' ';
            }
          } else if (
            isInlineTypeWithChildren(currNode.type) &&
            nextNode.type === 'text'
          ) {
            logger.appendLine(
              `currNode.type: ${currNode.type}, currNode.value: ${currNode.children[0].value}`
            );
            let combineText = currNode.children[0].value + nextNode.value;
            let pangu_rized = pangu.spacing(combineText);
            if (combineText !== pangu_rized) {
              nextNode.value = ' ' + nextNode.value;
            }
          }
        });
      });
    };
  };
}

// 沒有 children 的 Inline 文字節點
function isInlineType(type: string) {
  switch (type) {
    case 'inlineCode':
      return true;
      break;

    default:
      return false;
      break;
  }
}

// 含有 children 的 Inline 文字節點
function isInlineTypeWithChildren(type: string) {
  switch (type) {
    case 'link':
    case 'strong':
    case 'emphasis':
    case 'delete':
      return true;
      break;

    default:
      return false;
      break;
  }
}
