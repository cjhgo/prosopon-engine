import { resolveRelative } from "../../util/path"
import type {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../components/types"

// 首页卡片 feed：按大类 folder 分段渲染，仅 index 输出。
// 内容分类只有 folder 一个轴（生活/工作/读书/新知/随笔）；空 folder 自动不渲染。
const FOLDERS = ["生活", "工作", "读书", "新知", "随笔"] as const

function formatDate(d: unknown): string | null {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

const HomeSections = (() => {
  const HomeSections: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    // 只在首页渲染
    if (fileData.slug !== "index") return null

    const curDepth = (fileData.slug ?? "").split("/").length - 1
    const assetPrefix = "../".repeat(curDepth)

    const sections = FOLDERS.map((folder) => {
      let pages = allFiles.filter((p) => {
        const slug = (p.slug as string) ?? ""
        if (slug === "index" || slug.endsWith("/index")) return false
        if (slug.startsWith("tags/")) return false
        if (slug.split("/")[0] !== folder) return false
        return true
      })

      pages = pages.sort((a, b) => {
        const da = (a as Record<string, any>).dates?.created
        const db = (b as Record<string, any>).dates?.created
        if (da && db) return new Date(db).getTime() - new Date(da).getTime()
        return 0
      })
      if (pages.length === 0) return null

      return (
        <section class="card-section">
          <h2 class="card-section-title">{folder}</h2>
          <ul class="card-grid">
            {pages.map((page) => {
              const fm = (page.frontmatter ?? {}) as Record<string, unknown>
              const title = (fm.title as string) ?? (page.slug as string)
              const cover = fm.cover as string | undefined
              const desc = ((fm.description as string) ?? (page as any).description ?? "") as string
              const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
              const href = resolveRelative(fileData.slug!, page.slug!)
              // cover 经 flattenAssets 后为站点绝对 /assets/<hash>；兼容未扁平化的相对路径。
              const coverHref = cover
                ? cover.startsWith("/")
                  ? cover
                  : assetPrefix + cover
                : undefined
              const dateStr = formatDate((page as Record<string, any>).dates?.created)

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
                        {dateStr && <span>{dateStr}</span>}
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
    })

    return <>{sections}</>
  }
  return HomeSections
}) satisfies QuartzComponentConstructor

export default HomeSections
