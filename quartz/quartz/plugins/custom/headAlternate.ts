import { h } from "preact"
import type { QuartzTransformerPlugin } from "../types"
import { joinSegments, pathToRoot } from "../../util/path"

/**
 * headAlternate —— 每页 <link rel="alternate" type="text/markdown">，指向 RawMarkdown
 * emitter 产出的 `<slug>.md`。替代 v4 对 components/Head.tsx 的 patch。
 *
 * v5 的 StaticResources.additionalHead 允许插件按页注入 <head> 元素：
 * 函数收到当前页的 QuartzPluginData，可条件渲染。
 */
export const MarkdownAlternate: QuartzTransformerPlugin = () => ({
  name: "MarkdownAlternate",
  externalResources(): any {
    return {
      additionalHead: [
        (pageData: Record<string, any>) => {
          const slug = pageData?.slug as string | undefined
          if (!slug || slug === "index" || slug === "404") return null
          const href = joinSegments(pathToRoot(slug as any), `${slug}.md`)
          return h("link", { rel: "alternate", type: "text/markdown", href })
        },
      ],
    }
  },
})
