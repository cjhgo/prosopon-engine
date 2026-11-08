import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "生活工作读书新知",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "zh-CN",
    baseUrl: "prosopon.junhangc.cn",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "JetBrains Mono",
      },
      colors: {
        // 天青·文人盘:冷白微青底 + 黛青字 + 天青强调(偏青,汝窑/宋瓷向)+ 克制暖赭点缀
        lightMode: {
          light: "#f4f8f8",
          lightgray: "#d7e3e3",
          gray: "#8ea7a7",
          darkgray: "#2e3f42",
          dark: "#162528",
          secondary: "#2f8296",
          tertiary: "#bc7a3e",
          highlight: "rgba(47, 130, 150, 0.09)",
          textHighlight: "#b6dce088",
        },
        darkMode: {
          light: "#0d1517",
          lightgray: "#213034",
          gray: "#49605f",
          darkgray: "#bccbcb",
          dark: "#e5efef",
          secondary: "#64b2c0",
          tertiary: "#d59a5e",
          highlight: "rgba(100, 178, 192, 0.12)",
          textHighlight: "#345a5f88",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      // 自定义:只认 frontmatter date(缺则不显示,绝不用 git/fs 伪造创作日期)
      Plugin.FrontmatterDate(),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      // 本地相对图 → 扁平 /assets/<hash>(解耦 slug + 迁 COS 只换 base);在 ofm 之后处理 image 节点
      Plugin.FlattenLocalAssets(),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.AssetManifest(), // 扁平图 → public/assets/<hash> + assets-manifest.json
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // og-image(中文由 util/og.tsx getSatoriFonts 追加 CJK 字体解决 NO GLYPH,见 docs)
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
