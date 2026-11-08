import { QuartzComponentConstructor, QuartzComponentProps } from "../types"
import script from "../scripts/telescopic.inline"
import { classNames } from "../../util/lang"

// TelescopicText(组件侧)——渲染空占位,脚本把 code.telescopic-source 渲染成可展开文本。
// 实际内容由 transformer(plugins/custom/telescopicText.ts)标记的代码块产生。
function TelescopicText({ displayClass }: QuartzComponentProps) {
  return <div class={classNames(displayClass, "telescopic-init")} aria-hidden="true"></div>
}

TelescopicText.afterDOMLoaded = script
TelescopicText.css = `
.telescope-node { cursor: pointer; }
.telescope-node:hover { text-decoration: underline; text-decoration-color: var(--telescope-highlight-hover, var(--secondary)); }
`

export default (() => TelescopicText) satisfies QuartzComponentConstructor
