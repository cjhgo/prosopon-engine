import { transformLink } from "@quartz-community/bases-page"
import type { BasesEntry, ViewRendererProps } from "@quartz-community/bases-page"

type Medium = "book" | "film" | "music"

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value)
}

function mediumOf(entry: BasesEntry): Medium {
  const m = str(entry.properties.medium)
  if (m === "book" || m === "film" || m === "music") return m
  const folder = entry.fileProperties?.folder ?? ""
  if (folder.includes("/books") || folder.endsWith("books")) return "book"
  if (folder.includes("/film") || folder.endsWith("film")) return "film"
  if (folder.includes("/music") || folder.endsWith("music")) return "music"
  return "book"
}

function titleOf(entry: BasesEntry): string {
  return entry.title || str(entry.properties.title) || entry.fileProperties?.name || ""
}

function creatorOf(entry: BasesEntry): string {
  const p = entry.properties
  return (
    str(p.creator) ||
    str(p.director) ||
    str(p.author) ||
    str(p.artist) ||
    str(p.added_by) ||
    ""
  )
}

function yearOf(entry: BasesEntry): string {
  const p = entry.properties
  const y = str(p.year) || str(p.release_date).slice(0, 4)
  return y
}

function coverSrc(entry: BasesEntry): string {
  let src = str(entry.properties.cover)
  if (!src) return ""
  if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return src
  return "/" + src
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function Cover({ entry }: { entry: BasesEntry }) {
  const src = coverSrc(entry)
  if (!src) return <div class="m-noimg" />
  const title = titleOf(entry)
  return <img src={src} alt={title} loading="lazy" decoding="async" />
}

function Book({ entry, href }: { entry: BasesEntry; href: string }) {
  return (
    <a class="m-book" href={href}>
      <div class="m-book-cover">
        <Cover entry={entry} />
      </div>
      <span class="m-book-title">{titleOf(entry)}</span>
      <span class="m-book-meta">
        {[creatorOf(entry), yearOf(entry)].filter(Boolean).join(" · ")}
      </span>
    </a>
  )
}

function Sleeve({ entry, href }: { entry: BasesEntry; href: string }) {
  return (
    <a class="m-sleeve" href={href}>
      <span class="m-perf" />
      <div class="m-poster">
        <Cover entry={entry} />
      </div>
      <div class="m-flabel">
        <b>{titleOf(entry)}</b>
        <span>{[yearOf(entry), creatorOf(entry)].filter(Boolean).join(" · ")}</span>
      </div>
    </a>
  )
}

function WallTile({ entry, href }: { entry: BasesEntry; href: string }) {
  return (
    <a class="m-wall-tile" href={href} title={`${titleOf(entry)} — ${creatorOf(entry)}`}>
      <div class="m-wall-cover">
        <Cover entry={entry} />
      </div>
      <div class="m-wall-meta">
        <b>{titleOf(entry)}</b>
        <span>{creatorOf(entry)}</span>
      </div>
    </a>
  )
}

const MAX_PER_REALM = 12

const MouseionView = (props: ViewRendererProps) => {
  const { entries, slug, allSlugs, linkResolution } = props
  const groups: Record<Medium, BasesEntry[]> = { book: [], film: [], music: [] }
  for (const entry of entries) groups[mediumOf(entry)].push(entry)

  const hrefOf = (entry: BasesEntry) =>
    String(
      transformLink(slug as any, entry.slug as any, {
        strategy: linkResolution,
        allSlugs: allSlugs as any,
      }),
    )

  const sections: Array<{
    key: Medium
    num: string
    title: string
    desc: string
  }> = [
    { key: "book", num: "I", title: "BOOKS", desc: "The shelf · printed matter" },
    { key: "film", num: "II", title: "FILMS", desc: "The film clip · sleeves & sprockets" },
    { key: "music", num: "III", title: "MUSIC", desc: "The wall · covers, names & credits" },
  ]

  const rendered = sections
    .filter((section) => groups[section.key].length > 0)
    .map((section) => {
      const fullList = groups[section.key]
      const cap = section.key === "music" ? fullList.length : MAX_PER_REALM
      const list = fullList.slice(0, cap)
      const moreHref = section.key === "book" ? "books/" : section.key === "film" ? "film/" : "music/"
      const heading = (
        <div class="m-head">
          <span class="m-num">{section.num}</span>
          <h2>{section.title}</h2>
          <span class="m-desc">{section.desc}</span>
          {fullList.length > cap && (
            <a class="m-more" href={moreHref}>
              All {fullList.length} →
            </a>
          )}
        </div>
      )

      if (section.key === "book") {
        return (
          <section class="m-realm m-books" key={section.key}>
            {heading}
            <div class="m-bookcase">
              {chunks(list, 4).map((row, rowIndex) => (
                <>
                  <div class="m-book-row" key={`row-${rowIndex}`}>
                    {row.map((entry) => (
                      <Book key={entry.slug} entry={entry} href={hrefOf(entry)} />
                    ))}
                  </div>
                  <div class="m-shelf" />
                </>
              ))}
            </div>
          </section>
        )
      }

      if (section.key === "film") {
        return (
          <section class="m-realm m-films" key={section.key}>
            {heading}
            <div class="m-film-binder">
              <div class="m-film-head">
                <span>35 mm</span>
                <span>CONTACT SHEET</span>
                <span>ARCHIVE</span>
              </div>
              {chunks(list, 4).map((row, rowIndex) => (
                <div class="m-film-row" key={`row-${rowIndex}`}>
                  {row.map((entry) => (
                    <Sleeve key={entry.slug} entry={entry} href={hrefOf(entry)} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )
      }

      return (
        <section class="m-realm m-music" key={section.key}>
          {heading}
          <div class="m-wall">
            {list.map((entry) => (
              <WallTile key={entry.slug} entry={entry} href={hrefOf(entry)} />
            ))}
          </div>
        </section>
      )
    })

  if (rendered.length === 0) {
    return <div class="m-empty">No books, films or records yet.</div>
  }

  return (
    <div class="m-mouseion">
      <div class="m-masthead">
        <div class="m-kicker">A private collection of books, films &amp; records</div>
        <div class="m-seal">三境居</div>
      </div>
      {rendered}
    </div>
  )
}

export default MouseionView
