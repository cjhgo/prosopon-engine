import { QuartzEmitterPlugin } from "../types"
import { write } from "../emitters/helpers"
import { FullSlug } from "../../util/path"

/**
 * MouseionFeed — 把书影音笔记投影成独立子域站消费的 JSON。
 *
 * 主站仍是 SoT: 这里只读已解析/已扁平化的 frontmatter(cover 已是 OSS URL)。
 * 输出 public/static/mouseion.json;MOUSEION 子域静态站读它生成全屏页。
 */
export const MouseionFeed: QuartzEmitterPlugin = () => ({
  name: "MouseionFeed",
  async *emit(ctx, content) {
    const cfg = ctx.cfg.configuration
    const base = cfg.baseUrl ?? ""
    const origin = /^https?:\/\//.test(base) ? base : `https://${base}`
    const items: Record<string, unknown>[] = []

    for (const [, file] of content) {
      const data = file.data
      const slug = data.slug as FullSlug | undefined
      const fm = data.frontmatter as Record<string, unknown> | undefined
      if (!slug || !slug.startsWith("mouseion/") || !fm) continue
      if (slug.endsWith("/index")) continue
      const cover = typeof fm.cover === "string" ? fm.cover : ""
      if (!cover) continue

      const medium =
        fm.medium === "book" || fm.medium === "film" || fm.medium === "music"
          ? fm.medium
          : slug.includes("/books/")
            ? "book"
            : slug.includes("/film/")
              ? "film"
              : "music"
      const tags = Array.isArray(fm.tags)
        ? fm.tags.map((t) => String(t))
        : typeof fm.tags === "string"
          ? [fm.tags]
          : []
      const creator =
        (fm.creator as string) ||
        (fm.director as string) ||
        (Array.isArray(fm.author) ? String(fm.author[0] ?? "") : "") ||
        (Array.isArray(fm.artist) ? String(fm.artist[0] ?? "") : "")
      const year = String(fm.year ?? fm.release_date ?? "").slice(0, 4)
      items.push({
        slug,
        href: `${origin}/${slug}`,
        title: String(fm.title ?? slug.split("/").pop() ?? ""),
        medium,
        creator,
        year,
        cover,
        tags,
      })
    }

    const order: Record<string, number> = { book: 0, film: 1, music: 2 }
    items.sort((a, b) => {
      const ma = order[String(a.medium)] ?? 9
      const mb = order[String(b.medium)] ?? 9
      if (ma !== mb) return ma - mb
      return String(b.year).localeCompare(String(a.year))
    })

    yield write({
      ctx,
      slug: "static/mouseion" as FullSlug,
      ext: ".json",
      content: JSON.stringify(
        {
          generated: new Date().toISOString(),
          site: origin,
          items,
        },
        null,
        2,
      ),
    })
  },
})
