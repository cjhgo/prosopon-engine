import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import type { SiteProfile } from "./sites/types"

/**
 * prosopon-engine — Quartz 5 通用 composition root.
 *
 * 本站定制不再写死在这个文件；每个站一个 SiteProfile：
 *   sites/prosopon/site.ts  —— 主花园（天青盘 / HomeSections / SiteFooter / Mouseion…）
 *   sites/aesvibe/site.ts   —— 独立小站（可自由加自己的插件/组件）
 *
 * 选择 profile: QUARTZ_SITE（默认 prosopon）
 * 选择 YAML:   QUARTZ_CONFIG（默认 cwd/quartz.config.yaml）
 * 两者正交；shared 定制靠 import，不靠 site-name if-else。
 */
const profileLoaders: Record<string, () => Promise<{ default: SiteProfile }>> = {
  prosopon: () => import("./sites/prosopon/site"),
  aesvibe: () => import("./sites/aesvibe/site"),
}

const site = process.env.QUARTZ_SITE ?? "prosopon"
const loadProfile = profileLoaders[site] ?? profileLoaders.prosopon
const profile = (await loadProfile()).default

await profile.setup?.()

const config = await loadQuartzConfig(profile.configOverrides)
await profile.configure?.(config)
export default config

const base = await loadQuartzLayout()
export const layout = (await profile.layout?.(base)) ?? base
