import { AssetManifest, FlattenLocalAssets } from "../../quartz/plugins/custom/flattenAssets"
import { FrontmatterDate } from "../../quartz/plugins/custom/frontmatterDate"
import type { SiteProfile } from "../types"

/**
 * aesvibe.fun —— 独立小站，和主花园共用 engine，但有自己的 composition。
 *
 * 图片策略:
 *  - 预览(FLATTEN_ASSETS 未设): 不装 flatten，Quartz 默认资产管线，
 *    md 里的相对图按 per-md 原路径复制到 public/。
 *  - 生产(FLATTEN_ASSETS=1): 装 FlattenLocalAssets + AssetManifest，
 *    ASSET_BASE_URL 留空 → 图写 public/assets/<hash>，HTML 引用 /assets/<hash>；
 *    因为站点和图片同桶（aesvibe-fun / www.aesvibe.fun），一次 sync-site 全上去。
 *
 * 以后 aesvibe 要自己的 transformer/emitter/component/view，直接在这里加；
 * 共享件从 quartz/plugins|custom import，不需要动 engine，也不需要 if-else。
 */
const profile: SiteProfile = {
  configure(config) {
    config.plugins.transformers.push(FrontmatterDate())

    if (process.env.FLATTEN_ASSETS === "1") {
      config.plugins.transformers.push(FlattenLocalAssets())
      config.plugins.emitters.push(AssetManifest())
    }
  },
}

export default profile
