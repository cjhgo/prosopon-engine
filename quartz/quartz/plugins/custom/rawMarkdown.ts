import { QuartzEmitterPlugin } from "../types"
import { write } from "../emitters/helpers"
import { FullSlug } from "../../util/path"
import fs from "fs"
import path from "path"

/**
 * RawMarkdown —— 每页的 markdown 原文可直取(URL 加 `.md`)+ 全站聚合 `llms-full.txt`。
 *
 * 动机(见 40-references):aarnphm/turntrout 都把「给 AI/爬虫/读者喂 markdown 原文」当一等公民。
 * 访问 `/随笔/x` 的 HTML,访问 `/随笔/x.md` 得原始 markdown;`/llms-full.txt` 是全站聚合。
 * 实现:从磁盘读 file.data.filePath 的原文(含 frontmatter),按 slug 写成 <slug>.md。
 */
export const RawMarkdown: QuartzEmitterPlugin = () => ({
  name: "RawMarkdown",
  async *emit(ctx, content) {
    const parts: string[] = []
    const indexLines: string[] = [] // llms.txt 索引
    for (const [_tree, file] of content) {
      const slug = file.data.slug as FullSlug
      const fp = file.data.filePath as string | undefined
      if (!slug || !fp) continue
      let raw: string
      try {
        raw = await fs.promises.readFile(path.resolve(fp), "utf-8")
      } catch {
        continue
      }
      const title = file.data.frontmatter?.title ?? slug
      const desc = file.data.frontmatter?.description ?? ""
      // 每页 <slug>.md
      yield write({ ctx, slug, ext: ".md", content: raw })
      // 聚合
      parts.push(`# ${title}\nsource: /${slug}\n\n${raw}`)
      // llms.txt 索引行(llmstxt.org 标准:- [标题](url): 说明)
      indexLines.push(`- [${title}](/${slug}.md)${desc ? `: ${desc}` : ""}`)
    }
    // 全站聚合 llms-full.txt
    yield write({
      ctx,
      slug: "llms-full" as FullSlug,
      ext: ".txt",
      content: parts.join("\n\n---\n\n"),
    })
    // llms.txt —— 标准索引(入口指向每页 .md;llmstxt.org)
    const site = ctx.cfg.configuration.pageTitle
    const llms = [
      `# ${site}`,
      "",
      `> ${site} 的 markdown 源索引。每页原文:URL 后加 .md;全站聚合:/llms-full.txt`,
      "",
      "## 页面",
      "",
      ...indexLines,
      "",
    ].join("\n")
    yield write({ ctx, slug: "llms" as FullSlug, ext: ".txt", content: llms })
  },
})
