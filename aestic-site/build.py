#!/usr/bin/env python3
"""Build /aestic/ — every image referenced by the garden's notes, as a shuffled wall.

Usage: build.py <assets-manifest.json> <contentIndex.json> <outdir>

- images: flattened content assets (assets-manifest.json), one entry per unique image
- backlinks: each image's refs[] → first note → title + href
- alt: manifest.alt when pi-alt has filled it, else the note title
- output is written into prosopon-engine/quartz/public/aestic, deployed with the main site
"""
import html, json, os, shutil, subprocess, sys
from urllib.parse import quote

HERE = os.path.dirname(os.path.abspath(__file__))

def esc(x): return html.escape(str(x or ""))

def image_sizes(paths):
    if not paths:
        return {}
    magick = shutil.which("magick")
    if magick:
        cmd = [magick, "identify", "-format", "%w %h\n"] + paths
    else:
        ident = shutil.which("identify")
        if not ident:
            return {p: (800, 600) for p in paths}
        cmd = [ident, "-format", "%w %h\n"] + paths
    try:
        out = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.split()
        dims = [(int(out[i]), int(out[i + 1])) for i in range(0, len(out) - 1, 2)]
        if len(dims) == len(paths):
            return dict(zip(paths, dims))
    except Exception:
        pass
    dims = {}
    for p in paths:
        try:
            r = subprocess.run(cmd[:3] + [p], check=True, capture_output=True, text=True)
            w, h = map(int, r.stdout.split())
            dims[p] = (w, h)
        except Exception:
            dims[p] = (800, 600)
    return dims

def item_html(x):
    inner = (f'<img src="{esc(x["src"])}" alt="{esc(x["alt"])}" '
             f'width="{x["width"]}" height="{x["height"]}" '
             f'style="aspect-ratio:{x["width"]} / {x["height"]}" loading="lazy" decoding="async">')
    if x["href"]:
        return (f'<a class="aes-item" href="{esc(x["href"])}" target="_blank" rel="noopener" '
                f'data-title="{esc(x["title"])}">{inner}</a>')
    return f'<span class="aes-item" data-title="{esc(x["alt"])}">{inner}</span>'

def page(items):
    return f'''<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>AESTIC · 生活工作读书新知</title>
<meta name="description" content="αἴσθησις — 所有写过的内容里出现过的图像，洗牌成一面墙。">
<link rel="canonical" href="https://prosopon.junhangc.cn/aestic/">
<meta name="theme-color" content="#08090a">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./aestic.css">
</head><body>
<button type="button" class="aes-mode-toggle" id="aes-mode-toggle" hidden
  aria-label="Chaos mode" aria-pressed="false" title="Switch to chaos mode">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g class="mode-tidy">
      <circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/>
      <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
      <circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/>
    </g>
    <g class="mode-chaos">
      <circle cx="4" cy="6" r="1.5"/><circle cx="12" cy="3" r="2"/><circle cx="20" cy="7" r="1.5"/>
      <circle cx="8" cy="13" r="2"/><circle cx="18" cy="14" r="1"/><circle cx="3" cy="20" r="1"/>
      <circle cx="13" cy="21" r="1.5"/><circle cx="22" cy="21" r="1.5"/>
    </g>
  </svg>
</button>
<nav class="aes-nav">
  <a class="brandmark" href="https://prosopon.junhangc.cn/">生活工作读书新知</a>
  <div class="links"><a href="https://mouseion.junhangc.cn/">MOUSEION ↗</a><a class="ext" href="https://prosopon.junhangc.cn/mouseion/">INDEX ↗</a></div>
</nav>
<main class="aes-grid" id="aes-grid">{"".join(item_html(x) for x in items)}</main>
<div class="aes-caption" id="aes-caption" hidden><span class="t"></span><span class="n"></span></div>
<footer class="aes-foot"><span>AESTIC · images link back to their notes</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">豫ICP备2025138597号-1</a></footer>
<script src="./aestic.js" defer></script>
</body></html>'''

def main():
    if len(sys.argv) < 4:
        print("usage: build.py <assets-manifest.json> <contentIndex.json> <outdir>", file=sys.stderr)
        sys.exit(2)
    manifest = json.load(open(sys.argv[1], encoding="utf-8"))
    index = json.load(open(sys.argv[2], encoding="utf-8"))
    out = sys.argv[3]
    asset_base = os.environ.get("ASSET_BASE_URL") or "https://assets.junhangc.cn"

    entries = [(h, v) for h, v in manifest.items()
               if v.get("url") and v.get("src") and os.path.exists(v["src"])]
    sizes = image_sizes([v["src"] for _, v in entries])

    items = []
    for h, v in entries:
        w, ht = sizes.get(v["src"], (800, 600))
        refs = list(v.get("refs") or [])
        title, href = "", ""
        if refs:
            first = refs[0]
            note = index.get(first)
            title = (note or {}).get("title") or first.split("/")[-1]
            href = "https://prosopon.junhangc.cn/" + quote(first, safe="/")
            if len(refs) > 1:
                title = f"{title} +{len(refs) - 1}"
        alt = v.get("alt") or title or os.path.basename(v["src"]).rsplit(".", 1)[0]
        items.append(dict(src=asset_base.rstrip("/") + v["url"], title=title, href=href,
                          alt=alt, width=w, height=ht))

    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(os.path.join(out, "data"), exist_ok=True)
    json.dump(dict(total=len(items), items=items),
              open(os.path.join(out, "data", "aestic.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page(items))
    for f in ("aestic.css", "aestic.js"):
        shutil.copyfile(os.path.join(HERE, f), os.path.join(out, f))
    print(f"built {out}: {len(items)} images")

if __name__ == "__main__": main()
