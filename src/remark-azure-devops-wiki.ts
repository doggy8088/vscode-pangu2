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

      // STEP 1: 判斷 paragraph 節點是否包含有 [[_TOC_]] 語法
      visit(tree, 'paragraph', (node: any) => {

        if (node.children?.[0]?.value == '[['
         && node.children?.[1]?.type == 'emphasis'
         && (node.children?.[1]?.children?.[0]?.value == 'TOC' || node.children?.[1]?.children?.[0]?.value == 'TOSP')
         && node.children?.[2]?.value == ']]')
        {
          if (node.children?.[1]?.children?.[0]?.value == 'TOC') {
            TOC_type = 'toc';
          }
          if (node.children?.[1]?.children?.[0]?.value == 'TOSP') {
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
