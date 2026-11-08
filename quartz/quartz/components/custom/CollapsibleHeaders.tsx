import { QuartzComponentConstructor, QuartzComponentProps } from "../types"
// @ts-ignore — .inline.ts 由构建期 text loader 处理，不是普通 TS 模块
import script from "../scripts/collapsibleHeaders.inline"
import { classNames } from "../../util/lang"

// collapsible headers(Dynalist 风格)——渲染一个带配置的空占位,交互全在 afterDOMLoaded 脚本里。
// frontmatter 控制:
//  - collapseHeaders: false     → 本页关闭折叠(默认开启)
//  - collapseDefault: closed    → 本页标题默认折叠(默认 open)
//  - 标题文字末尾 `{-}`         → 该标题不折叠
function CollapsibleHeaders({ fileData, displayClass }: QuartzComponentProps) {
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  const enabled = fm.collapseHeaders !== false ? "1" : "0"
  const defaultState = fm.collapseDefault === "closed" ? "closed" : "open"
  return (
    <div
      class={classNames(displayClass, "collapsible-headers-init")}
      data-collapse-enabled={enabled}
      data-collapse-default={defaultState}
      hidden
      aria-hidden="true"
    ></div>
  )
}

CollapsibleHeaders.afterDOMLoaded = script
CollapsibleHeaders.css = `
.ch-heading { position: relative; cursor: pointer; }
.ch-heading .ch-toggle {
  display: inline-block; width: 0.7em; margin-right: 0.35em; margin-left: -0.85em;
  padding: 0; border: 0; background: none; font: inherit; line-height: 1;
  text-align: center; color: var(--gray); opacity: 0.5; cursor: pointer;
  transition: transform 0.15s, opacity 0.15s; user-select: none; vertical-align: baseline;
}
.ch-heading .ch-toggle::before { content: "▾"; }
.ch-heading.ch-collapsed .ch-toggle { transform: rotate(-90deg); }
.ch-heading:hover .ch-toggle, .ch-heading .ch-toggle:focus-visible { opacity: 1; color: var(--secondary); }
.ch-heading .ch-toggle:focus-visible { outline: 2px solid var(--secondary); outline-offset: 2px; border-radius: 3px; }
.ch-hidden { display: none !important; }
@media (max-width: 800px) {
  .ch-heading .ch-toggle { margin-left: 0; width: 0.6em; }
}
`

export default (() => CollapsibleHeaders) satisfies QuartzComponentConstructor
