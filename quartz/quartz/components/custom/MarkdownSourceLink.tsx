import { QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { joinSegments, pathToRoot } from "../../util/path"
import { classNames } from "../../util/lang"

// 可见的 markdown 源入口:在标题/标签下显示「Markdown 源码 ↗」,指向本页 <slug>.md
// (由 RawMarkdown emitter 生成)。配合 head 里的 rel=alternate 做双层可发现。
function MarkdownSourceLink({ fileData, displayClass }: QuartzComponentProps) {
  const slug = fileData.slug
  if (!slug || slug === "index" || slug === "404") return <></>
  const href = joinSegments(pathToRoot(slug), `${slug}.md`)
  return (
    <div class={classNames(displayClass, "md-source")}>
      <a href={href} title="查看本页 Markdown 源">
        Markdown 源码 ↗
      </a>
    </div>
  )
}

MarkdownSourceLink.css = `
.md-source { margin: 0.5rem 0 1.1rem; font-size: 0.82rem; }
.md-source a {
  color: var(--gray);
  text-decoration: none;
  border-bottom: 1px dashed var(--lightgray);
  padding-bottom: 1px;
}
.md-source a:hover { color: var(--secondary); border-bottom-color: var(--secondary); }
`

export default (() => MarkdownSourceLink) satisfies QuartzComponentConstructor
