# FORK — prosopon CJK fallback

This is a vendored fork of `quartz-community/og-image` (MIT), pinned at v1.1.0.

## Why

Quartz 5's og-image renders with satori, which (unlike a browser) does **not**
fall back to CJK glyphs. With the site's Latin font (Inter), Chinese titles
render as tofu boxes.

## Patch

`src/emitter.tsx`:

1. In `getSatoriFonts`, after the Google fonts succeed, append a Noto Sans CJK SC
   fallback (`getCjkFallbackFont`) to the font array.
2. `getCjkFallbackFont` downloads the full OTF from jsDelivr once and caches it at
   `quartz/.quartz-cache/fonts/noto-sans-cjk-sc.otf`.

Satori picks fonts per glyph: Latin from Inter, CJK from Noto Sans CJK SC.

## Build

```bash
npm install
npm run build
```

`dist/` is committed so the site build needs no extra step. Rebuild after editing
`src/`.

## Upstream

Original: https://github.com/quartz-community/og-image (MIT).
