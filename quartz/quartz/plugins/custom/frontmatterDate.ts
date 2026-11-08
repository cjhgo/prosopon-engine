import { QuartzTransformerPlugin } from "../types"

/**
 * 只认 frontmatter 的 `date`(或 created/modified/published)字段设置日期。
 * 替掉内置 CreatedModifiedDate —— 后者在无日期时用 `new Date()`(构建时刻)兜底,
 * 导致没写 date 的老 crystal 显示「今天」这种假创作日期。本插件:没写就不设 dates,
 * ContentMeta/CardList 便不显示日期(留白),绝不伪造。
 *
 * 读取优先:frontmatter.date > created;modified 取 frontmatter.modified ?? date。
 * date 格式 YYYY-MM-DD(当本地午夜)或任意 Date 可解析串。
 */
const dateOnly = /^\d{4}-\d{2}-\d{2}$/

function parse(v: unknown): Date | undefined {
  if (v == null) return undefined
  let s = String(v)
  if (dateOnly.test(s)) s = `${s}T00:00:00`
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

export const FrontmatterDate: QuartzTransformerPlugin = () => ({
  name: "FrontmatterDate",
  markdownPlugins() {
    return [
      () => (_tree, file) => {
        const fm = (file.data.frontmatter ?? {}) as Record<string, unknown>
        const created = parse(fm.date) ?? parse(fm.created)
        const modified = parse(fm.modified) ?? created
        const published = parse(fm.published) ?? created
        if (created || modified || published) {
          file.data.dates = {
            created: created ?? modified ?? published!,
            modified: modified ?? created ?? published!,
            published: published ?? created ?? modified!,
          }
        } else {
          delete (file.data as Record<string, unknown>).dates // 无日期:不设,留白
        }
      },
    ]
  },
})
