import { QuartzComponentConstructor, QuartzComponentProps } from "../types"
import script from "../scripts/collapsibleHeaders.inline"
import { classNames } from "../../util/lang"

// collapsible headers(Dynalist 风格)——渲染一个空锚点占位,交互全在 afterDOMLoaded 脚本里
// (脚本给文章每个 heading 注入 toggle,点击折叠其下内容)。样式见下方 css。
function CollapsibleHeaders({ displayClass }: QuartzComponentProps) {
  return <div class={classNames(displayClass, "collapsible-headers-init")} aria-hidden="true"></div>
}

CollapsibleHeaders.afterDOMLoaded = script
CollapsibleHeaders.css = `
.ch-heading { position: relative; cursor: pointer; }
.ch-heading .ch-toggle {
  display: inline-block; width: 0.7em; margin-right: 0.35em; margin-left: -0.85em;
  text-align: center; color: var(--gray); opacity: 0.5;
  font-size: 0.85em; transition: transform 0.15s, opacity 0.15s;
  user-select: none;
}
.ch-heading .ch-toggle::before { content: "▾"; }
.ch-heading.ch-collapsed .ch-toggle { transform: rotate(-90deg); }
.ch-heading:hover .ch-toggle { opacity: 1; color: var(--secondary); }
.ch-hidden { display: none !important; }
@media (max-width: 800px) {
  .ch-heading .ch-toggle { margin-left: 0; width: 0.6em; }
}
`

export default (() => CollapsibleHeaders) satisfies QuartzComponentConstructor
