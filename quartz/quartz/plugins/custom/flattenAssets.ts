import { QuartzTransformerPlugin, QuartzEmitterPlugin } from "../types"
import { visit } from "unist-util-visit"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import { FilePath, joinSegments } from "../../util/path"
import { write } from "../emitters/helpers"

/**
 * 图片资产扁平化 —— 消解「图片 URL 把 slug 编码进去」的耦合。
 *
 * 问题:Quartz 原生按源目录结构 emit 图,于是上线 URL = /生活/image/十月的光/xxx.png,
 *       slug 进了图 URL。内容挪 folder / 改标题 / 迁 COS 都要图跟着动。
 * 解法:① transformer 把正文本地相对图改写成站点绝对扁平路径 /assets/<hash>.ext
 *          (hash = 图内容 sha256 前 12 位,内容不变 URL 不变、同图去重、与 slug 无关);
 *       ② emitter 按 hash 把物理图拷到 public/assets/<hash>.ext(扁平),
 *          并产出 static/assets-manifest.json(图片总体视图 db 的地基,pi-alt 往里填 alt)。
 * 迁 COS:只需把 /assets/ 这个 base 换成 CDN 域名,内容结构一个字不动。
 *
 * 只处理「相对路径的本地资源」:跳过 http(s)、已是 /assets/ 的、站点绝对路径。
 */

const ASSET_EXT = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm|mov|m4v)$/i

// transformer 与 emitter 共享:hash -> { absSrc, ext, refs:Set<slug>, bytes }
export interface AssetEntry {
  absSrc: string
  ext: string
  refs: Set<string>
  size: number
}
const REGISTRY = new Map<string, AssetEntry>()

// 已被扁平化接管的源文件绝对路径集合;Assets emitter 据此跳过,避免僵尸副本。
export const MANAGED_SRCS = new Set<string>()

function hashFile(absSrc: string): { hash: string; size: number } | null {
  try {
    const buf = fs.readFileSync(absSrc)
    const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12)
    return { hash, size: buf.length }
  } catch {
    return null
  }
}

export const FlattenLocalAssets: QuartzTransformerPlugin = () => ({
  name: "FlattenLocalAssets",
  markdownPlugins() {
    return [
      () => (tree, file) => {
        // 当前 md 的物理绝对目录(用于解析相对图)
        const mdFull = file.data.filePath
          ? (path.resolve(file.data.filePath) as string)
          : undefined
        const mdDir = mdFull ? path.dirname(mdFull) : undefined
        const slug = (file.data.slug as string) ?? ""
        if (!mdDir) return

        // 把一个相对 url 换成扁平 /assets/<hash>.ext,并登记进 REGISTRY;返回新 url 或 null
        const flatten = (url: string): string | null => {
          if (!url || /^https?:\/\//.test(url) || url.startsWith("/")) return null
          if (!ASSET_EXT.test(url)) return null
          const absSrc = path.resolve(mdDir, decodeURIComponent(url))
          const h = hashFile(absSrc)
          if (!h) return null
          const ext = path.extname(absSrc).toLowerCase()
          let entry = REGISTRY.get(h.hash)
          if (!entry) {
            entry = { absSrc, ext, refs: new Set(), size: h.size }
            REGISTRY.set(h.hash, entry)
          }
          entry.refs.add(slug)
          MANAGED_SRCS.add(absSrc)
          return `/assets/${h.hash}${ext}`
        }

        // frontmatter.cover(相对 content 根写,如 "生活/image/x.png"):扁平化回写
        const fm = file.data.frontmatter as Record<string, unknown> | undefined
        if (fm && typeof fm.cover === "string" && !/^https?:\/\//.test(fm.cover)) {
          // cover 相对 content 根,不是相对本 md —— 用 content 根拼绝对路径
          const contentRoot = mdDir.slice(0, mdDir.length - path.dirname(slug).length)
          const absCover = path.resolve(contentRoot, decodeURIComponent(fm.cover))
          const h = hashFile(absCover)
          if (h) {
            const ext = path.extname(absCover).toLowerCase()
            let e = REGISTRY.get(h.hash)
            if (!e) {
              e = { absSrc: absCover, ext, refs: new Set(), size: h.size }
              REGISTRY.set(h.hash, e)
            }
            e.refs.add(slug)
            MANAGED_SRCS.add(absCover)
            fm.cover = `/assets/${h.hash}${ext}` // 扁平、站点绝对
          }
        }

        // 标准图节点
        visit(tree, "image", (node: any) => {
          const n = flatten(node.url ?? "")
          if (n) node.url = n
        })
        // ofm 把 ![](x.mp4)/![[x.mp4]] 转成的 raw html <video>/<img> 节点
        visit(tree, "html", (node: any) => {
          node.value = (node.value ?? "").replace(
            /(src=")([^"]+)(")/g,
            (_m: string, a: string, url: string, b: string) => {
              const n = flatten(url)
              return n ? `${a}${n}${b}` : `${a}${url}${b}`
            },
          )
        })
      },
    ]
  },
})

export const AssetManifest: QuartzEmitterPlugin = () => ({
  name: "AssetManifest",
  async *emit({ argv }) {
    const manifest: Record<string, unknown> = {}
    for (const [hash, e] of REGISTRY) {
      const destRel = `assets/${hash}${e.ext}` as FilePath
      const dest = joinSegments(argv.output, destRel) as FilePath
      await fs.promises.mkdir(path.dirname(dest), { recursive: true })
      try {
        await fs.promises.copyFile(e.absSrc, dest)
      } catch {
        continue
      }
      yield dest
      manifest[hash] = {
        url: `/assets/${hash}${e.ext}`,
        src: e.absSrc,
        refs: [...e.refs],
        size: e.size,
        alt: null, // pi-alt 步骤回填
      }
    }
    const out = await write({
      ctx: { argv } as any,
      slug: "static/assets-manifest" as any,
      ext: ".json",
      content: JSON.stringify(manifest, null, 2),
    })
    yield out
  },
})
