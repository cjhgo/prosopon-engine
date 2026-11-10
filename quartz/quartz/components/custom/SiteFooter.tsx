import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

// 自定义页脚:替掉 Quartz 默认的「Created with Quartz · GitHub · Discord」,
// 换成站点自己的标语 + 备案号(部署后法定悬挂,见 oikos/prosopon/skills/aliyun-ops)。
export default (() => {
  const SiteFooter: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    return (
      <footer class={`site-footer ${displayClass ?? ""}`}>
        <p class="site-footer-tag">生活 · 工作 · 读书 · 新知 —— 一座思考的花园</p>
        <p class="site-footer-meta">
          © {year}
          <span class="sep">·</span>
          <a href="/aestic/">AESTIC</a>
          <span class="sep">·</span>
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
            豫ICP备2025138597号-1
          </a>
        </p>
      </footer>
    )
  }
  return SiteFooter
}) satisfies QuartzComponentConstructor
