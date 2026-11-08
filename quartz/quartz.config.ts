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
    baseUrl: "quartz.junhangc.cn",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
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
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      // 本地图片标准相对路径 → wikilink(隐藏「本地预览 vs Quartz flat-url」矛盾,须在 ofm 之前)
      Plugin.LocalImageToWikilink(),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
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
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
