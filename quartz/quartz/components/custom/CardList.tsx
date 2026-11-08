import { resolveRelative } from "../../util/path"
import { Date, getDate } from "../Date"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

interface Options {
  title?: string // 分区标题(省略=不显示标题)
  limit?: number
  folder?: string // 仅显示 slug 顶层在此大类下的(如 "生活"、"随笔")
}

// 卡片网格分区:读 allFiles,按 folder/date/cover 渲染。内容分类只用 folder,不用 type。
// 样式在 styles/custom.scss。
export default ((opts?: Options) => {
  const CardList: QuartzComponent = ({ cfg, fileData, allFiles }: QuartzComponentProps) => {
    const curDepth = (fileData.slug ?? "").split("/").length - 1
    const assetPrefix = "../".repeat(curDepth)

    let pages = allFiles.filter((p) => {
      const slug = p.slug ?? ""
      if (slug === "index" || slug.endsWith("/index")) return false
      if (slug.startsWith("tags/")) return false
      if (opts?.folder && slug.split("/")[0] !== opts.folder) return false
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
            const cover = fm.cover as string | undefined
            const desc = (fm.description as string) ?? page.description ?? ""
            const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
            const href = resolveRelative(fileData.slug!, page.slug!)
            // cover 经 flattenAssets 后为站点绝对 /assets/<hash>(直接用);
            // 兼容未被扁平化的相对路径(加当前页深度前缀)
            const coverHref = cover
              ? cover.startsWith("/")
                ? cover
                : assetPrefix + cover
              : undefined

            return (
              <li class={`card ${cover ? "" : "no-thumb"}`}>
                <a class="card-link" href={href}>
                  {coverHref && (
                    <img class="card-thumb" src={coverHref} alt={title} loading="lazy" />
                  )}
                  <div class="card-body">
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
