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

      let TOC_node: any;
      let TOC_type: string = '';

      // STEP 1: 處理 ::: type 語法區塊，將其標記為不處理
      const nodesToReplace: any[] = [];
      let directiveStartIndex = -1;
      let directiveType = '';
      
      tree.children?.forEach((node: any, index: number) => {
        if (node.type === 'paragraph' && node.children?.[0]?.type === 'text') {
          const textValue = node.children[0].value;
          
          // 檢查是否為 ::: type 開始
          const directiveStart = textValue.match(/^:::[\s]*([a-zA-Z][a-zA-Z0-9-_]*)/);
          if (directiveStart) {
            directiveStartIndex = index;
            directiveType = directiveStart[1];
            logger.appendLine(`Found directive start: ${directiveType} at index ${index}`);
            return;
          }
          
          // 檢查是否為 ::: 結束
          if (textValue.trim() === ':::' && directiveStartIndex !== -1) {
            logger.appendLine(`Found directive end at index ${index}, marking nodes ${directiveStartIndex}-${index} as literal`);
            
            // 將整個區塊標記為 literal，防止 pangu 處理
            for (let i = directiveStartIndex; i <= index; i++) {
              const nodeToMark = tree.children[i];
              if (nodeToMark) {
                // 添加一個標記，讓 pangu plugin 跳過這些節點
                nodeToMark._azureDevOpsDirective = true;
                nodeToMark._directiveType = directiveType;
              }
            }
            
            // 重置狀態
            directiveStartIndex = -1;
            directiveType = '';
            return;
          }
          
          // 如果在 directive 區塊內，標記此節點
          if (directiveStartIndex !== -1) {
            node._azureDevOpsDirective = true;
            node._directiveType = directiveType;
          }
        }
      });

      // STEP 2: 判斷 paragraph 節點是否包含有 [[_TOC_]] 語法
      visit(tree, 'paragraph', (node: any) => {
        // 跳過已被標記為 directive 的節點
        if (node._azureDevOpsDirective) {
          return;
        }

        if (node.children?.[0]?.value === '[['
         && node.children?.[1]?.type === 'emphasis'
         && (node.children?.[1]?.children?.[0]?.value === 'TOC' || node.children?.[1]?.children?.[0]?.value === 'TOSP')
         && node.children?.[2]?.value === ']]')
        {
          if (node.children?.[1]?.children?.[0]?.value === 'TOC') {
            TOC_type = 'toc';
          }
          if (node.children?.[1]?.children?.[0]?.value === 'TOSP') {
            TOC_type = 'tosp';
          }
          TOC_node = node;
        }

      });

      if (!!TOC_node && !!TOC_type) {

        switch (TOC_type) {
          case 'toc':
            // TOC_node.type = 'literal';
            TOC_node.children[0].value = '[[_TOC_]]';
            TOC_node.children[0].raw = TOC_node.children[0].value;
            TOC_node.children[0].position.end.column += 7;
            TOC_node.children[0].position.end.offset += 7;
            break;

          case 'tosp':
            // TOC_node.type = 'literal';
            TOC_node.children[0].value = '[[_TOSP_]]';
            TOC_node.children[0].raw = TOC_node.children[0].value;
            TOC_node.children[0].position.end.column += 8;
            TOC_node.children[0].position.end.offset += 8;
            break;

          default:
            break;
        }

        // 徹底刪除 _TOC_ 與 ]] 節點
        TOC_node.children.splice(1, 2);
      }

      logger.appendLine('---');
      logger.appendLine(JSON.stringify(tree));
      logger.appendLine('---');

    };
  };

}
