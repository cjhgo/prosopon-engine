import type { GlobalConfiguration, QuartzConfig } from "../quartz/cfg"
import type { QuartzLayout } from "../quartz/plugins/loader/config-loader"

/**
 * A site profile is the composition policy for one Quartz site.
 *
 * The engine owns the generic build; a profile owns:
 *  - which YAML config it loads (via QUARTZ_CONFIG)
 *  - which extra transformers/emitters/views it composes
 *  - which layout components it appends
 *
 * No shared code should branch on a site name; differences live here.
 */
export interface SiteProfile {
  /** Merged over the YAML configuration (page title, ignore patterns, …). */
  configOverrides?: Partial<GlobalConfiguration>
  /** Side effects that must run before config/layout loading (e.g. view registry). */
  setup?(): void | Promise<void>
  /** Add/replace transformers, emitters, filters once the YAML config is loaded. */
  configure?(config: QuartzConfig): void | Promise<void>
  /** Customize the layout after the YAML layout is built. */
  layout?(base: QuartzLayout): QuartzLayout | Promise<QuartzLayout>
}
