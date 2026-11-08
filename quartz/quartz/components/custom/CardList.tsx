import { resolveRelative } from "../../util/path"
import { Date, getDate } from "../Date"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

// 内容类型 → 中文徽章(双用 frontmatter 的 `type`;见 hypertext-数字花园.md §2.J)
const TYPE_LABEL: Record<string, string> = {
  article: "文章",
  note: "随记",
  link: "外链",
  excerpt: "摘录",
  book: "书",
}

interface Options {
  title?: string // 分区标题(省略=不显示标题)
  limit?: number
  types?: string[] // 仅显示这些 type
  exclude?: string[] // 排除这些 type
  folder?: string // 仅显示 slug 顶层在此大类下的(如 "生活")
}

// 卡片网格分区:读 allFiles,按 type/date/cover 渲染。样式在 styles/custom.scss。
export default ((opts?: Options) => {
  const CardList: QuartzComponent = ({ cfg, fileData, allFiles }: QuartzComponentProps) => {
    const curDepth = (fileData.slug ?? "").split("/").length - 1
    const assetPrefix = "../".repeat(curDepth)

    let pages = allFiles.filter((p) => {
      const slug = p.slug ?? ""
      if (slug === "index" || slug.endsWith("/index")) return false
      if (slug.startsWith("tags/")) return false
      if (opts?.folder && slug.split("/")[0] !== opts.folder) return false
      const t = ((p.frontmatter as Record<string, unknown>)?.type as string) ?? ""
      if (opts?.types && !opts.types.includes(t)) return false
      if (opts?.exclude && opts.exclude.includes(t)) return false
      return true
    })

    pages = pages.sort((a, b) =>
      a.dates && b.dates ? getDate(cfg, b)!.getTime() - getDate(cfg, a)!.getTime() : 0,
    )
    if (opts?.limit) pages = pages.slice(0, opts.limit)
    if (pages.length === 0) return null

    return (
      <section class="card-section">
        {opts?.title && <h2 class="card-section-title">{opts.title}</h2>}
        <ul class="card-grid">
          {pages.map((page) => {
            const fm = (page.frontmatter ?? {}) as Record<string, unknown>
            const title = (fm.title as string) ?? page.slug
            const type = fm.type as string | undefined
            const cover = fm.cover as string | undefined
            const desc = (fm.description as string) ?? page.description ?? ""
            const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
            const href = resolveRelative(fileData.slug!, page.slug!)
            const coverHref = cover ? assetPrefix + cover : undefined

            return (
              <li class={`card ${cover ? "" : "no-thumb"}`}>
                <a class="card-link" href={href}>
                  {coverHref && (
                    <img class="card-thumb" src={coverHref} alt={title} loading="lazy" />
                  )}
                  <div class="card-body">
                    {type && TYPE_LABEL[type] && (
                      <span class="card-badge">{TYPE_LABEL[type]}</span>
                    )}
                    <h3 class="card-title">{title}</h3>
                    {desc && <p class="card-desc">{desc}</p>}
                    <div class="card-meta">
                      {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                      {tags.length > 0 && <span>#{tags[0]}</span>}
                    </div>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }
  return CardList
}) satisfies QuartzComponentConstructor
