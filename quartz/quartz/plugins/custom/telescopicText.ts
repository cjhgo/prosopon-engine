import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"

/**
 * TelescopicText(transform 侧)——把 ```telescopic 代码块标记成客户端可渲染的源。
 *
 * 用法(markdown 里):
 *   ```telescopic
 *   * 我
 *     * 打着哈欠,我
 *   * 泡了茶
 *   ```
 * 缩进层级 = 展开层级(见 jackyzha0/telescopic-text)。
 *
 * 实现:保留 code 节点(源码不丢),清掉 lang(不做语法高亮),打上 className `telescopic-source`;
 * 客户端脚本(components/custom/TelescopicText.tsx)找 `code.telescopic-source`,
 * 读 textContent 调 createTelescopicTextFromBulletedList 替换成可展开文本。
 */
export const TelescopicText: QuartzTransformerPlugin = () => ({
  name: "TelescopicText",
  markdownPlugins() {
    return [
      () => (tree) => {
        visit(tree, "code", (node: any) => {
          if (node.lang !== "telescopic") return
          node.lang = null
          node.meta = null
          node.data = node.data ?? {}
          node.data.hProperties = node.data.hProperties ?? {}
          const cls = (node.data.hProperties.className as string[] | undefined) ?? []
          node.data.hProperties.className = [...cls, "telescopic-source"]
        })
      },
    ]
  },
})
