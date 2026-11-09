import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

import { AssetManifest, FlattenLocalAssets } from "./quartz/plugins/custom/flattenAssets"
import { FrontmatterDate } from "./quartz/plugins/custom/frontmatterDate"
import { MarkdownAlternate } from "./quartz/plugins/custom/headAlternate"
import { RawMarkdown } from "./quartz/plugins/custom/rawMarkdown"
import { MouseionFeed } from "./quartz/plugins/custom/mouseionFeed"
import { TelescopicText } from "./quartz/plugins/custom/telescopicText"

import CollapsibleHeaders from "./quartz/components/custom/CollapsibleHeaders"
import MouseionView from "./quartz/components/custom/MouseionView"
import { mouseionStyles } from "./quartz/components/custom/mouseionStyles"
import { viewRegistry } from "@quartz-community/bases-page"
import HomeSections from "./quartz/components/custom/HomeSections"
import MarkdownSourceLink from "./quartz/components/custom/MarkdownSourceLink"
import SiteFooter from "./quartz/components/custom/SiteFooter"
import TelescopicTextUI from "./quartz/components/custom/TelescopicText"

/**
 * prosopon-engine — Quartz 5 配置入口（owned 文件）。
 *
 * v5 的官方扩展点是外部插件包；本仓的定制件很小且在 fork 内演化，
 * 因此走 TS override：load 完 YAML 配置后把自有 transformer/emitter 注入，
 * 再把自有组件 append 进布局。这样不侵入任何 upstream 文件。
 * 详见 docs/50-v5-migration.md。
 */
// Register the MOUSEION custom Bases view before the page dispatcher renders.
viewRegistry.register({
  id: "mouseion",
  name: "Mouseion",
  icon: "library",
  render: MouseionView,
  css: mouseionStyles,
})

const config = await loadQuartzConfig({
  // 生产(deploy 设 QUARTZ_PROD=1)忽略 _refer(示例/参考区)；本地预览可见。
  ignorePatterns: [
    "private",
    "templates",
    ".obsidian",
    ...(process.env.QUARTZ_PROD ? ["_refer/**"] : []),
  ],
})

config.plugins.transformers.push(
  FrontmatterDate(), // 只认 frontmatter date；缺则留白，不伪造
  MarkdownAlternate(), // <link rel=alternate type=text/markdown>
  TelescopicText(), // ```telescopic 代码块 → 客户端可展开文本
  FlattenLocalAssets(), // 本地相对图 → /assets/<hash>（须在 OFM 之后）
)
config.plugins.emitters.push(
  AssetManifest(), // 扁平图 → public/assets/<hash> + assets-manifest.json
  RawMarkdown(), // 每页 <slug>.md 原文 + llms.txt / llms-full.txt
  MouseionFeed(), // 书影音 → static/mouseion.json(独立子域站的数据投影)
)

export default config

// 先取 YAML 生成的基准布局，再在其上追加自有组件。
const base = await loadQuartzLayout()
export const layout = await loadQuartzLayout({
  defaults: {
    ...base.defaults,
    afterBody: [
      ...(base.defaults.afterBody ?? []),
      HomeSections(), // 首页按 folder 分段卡片（仅 index 渲染）
      CollapsibleHeaders(), // 可折叠标题（空占位 + afterDOMLoaded 脚本）
      TelescopicTextUI(), // telescopic 客户端渲染占位
    ],
    footer: [SiteFooter()],
  },
  byPageType: {
    ...base.byPageType,
    content: {
      ...(base.byPageType.content ?? {}),
      // 只在 content 页显示「Markdown 源码 ↗」；folder/tag 页不显示。
      beforeBody: [...(base.defaults.beforeBody ?? []), MarkdownSourceLink()],
    },
  },
})
