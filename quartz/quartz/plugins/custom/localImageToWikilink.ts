import { QuartzTransformerPlugin } from "../types"

/**
 * 本地图片/视频(标准相对路径)→ wikilink,交给 Quartz 的 slug resolver。
 *
 * 为什么存在(隐藏两端矛盾,见 prosopon-source/CLAUDE.md):
 *  - Quartz emit flat html(`生活/十月的光.html`)+ href 无 trailing slash,
 *    于是标准相对图 `![](image/x.png)` 的 src 被算错一层(`../image/` 指向站点根)而碎;
 *  - 而 wikilink `![[x.png]]` 走 shortest 全局 slug 解析,Quartz 生成正确相对 src(不碎)。
 *  - 但 wikilink 普通预览器(VSCode/cweijan)不认,标准相对才认。两端最优写法相反。
 * 解法:作者写标准相对(本地普通预览完整),本插件在 transform 时统一转成 wikilink
 *       (线上完整)。源 md 不变,矛盾被 transform 吃掉。
 *
 * 只转「相对路径的本地资源」:排除 http(s)、站点绝对路径(/...)。
 * 依赖 basename 全局唯一(cweijan 用时间戳;集中 assets 用自定义名)——撞名需加 alias/改名。
 * 注册在 ObsidianFlavoredMarkdown 之前,使其产出的 `![[...]]` 被 ofm 正常处理。
 */
export const LocalImageToWikilink: QuartzTransformerPlugin = () => ({
  name: "LocalImageToWikilink",
  textTransform(_ctx, src) {
    return src.replace(
      /!\[([^\]]*)\]\((?!https?:\/\/|\/)([^)]+?\.(?:png|jpe?g|gif|webp|svg|avif|mp4|webm|mov|m4v))\)/gi,
      (_full, _alt, relpath) => {
        const basename = relpath.split("/").pop()
        return `![[${basename}]]`
      },
    )
  },
})
