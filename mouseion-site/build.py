#!/usr/bin/env python3
"""Build the standalone MOUSEION subdomain from the main site's mouseion.json feed.

Outputs:
  index.html          2D landing (books / films / music walls)
  book|film|music/    full-screen 3D rooms (shared shelf.js engine)
  data/*.json         per-room item feed
  covers/<medium>/    same-origin, aspect-cropped cover textures
  vendor/             three.js module + addons (no CDN dependency)
  style.css app.js shelf.css shelf.js

Usage: build.py <mouseion.json> [outdir] [assets-manifest.json]
  assets-manifest.json defaults to the file next to mouseion.json.
"""
import json, html, os, re, shutil, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))

ROOMS = {
    "book": dict(title="Books", numeral="I",
                 kicker="Book room · spines, covers & printed matter",
                 css="books", aspect=(2, 3), cols=5, px=(480, 720), limit=None,
                 label="books"),
    "film": dict(title="Films", numeral="II",
                 kicker="Film room · posters, sleeves & sprockets",
                 css="films", aspect=(2, 3), cols=7, px=(480, 720), limit=None,
                 label="films"),
    "music": dict(title="Music", numeral="III",
                  kicker="Music room · the cover wall",
                  css="music", aspect=(1, 1), cols=12, px=(480, 480), limit=96,
                  label="records"),
}

def esc(x): return html.escape(str(x or ""))

def item_label(x):
    bits = [str(x.get("creator") or ""), str(x.get("year") or "")]
    return " · ".join(b for b in bits if b)

def book(x):
    return f'''<a class="book" href="{esc(x['href'])}" target="_blank" rel="noopener">
  <div class="book-cover"><img src="{esc(x['cover'])}" alt="{esc(x['title'])}" loading="lazy"></div>
  <div class="book-label"><b>{esc(x['title'])}</b><span>{esc(item_label(x))}</span></div>
</a>'''

def film(x):
    return f'''<a class="sleeve" href="{esc(x['href'])}" target="_blank" rel="noopener">
  <span class="perf"></span>
  <div class="poster"><img src="{esc(x['cover'])}" alt="{esc(x['title'])}" loading="lazy"></div>
  <div class="sleeve-label"><b>{esc(x['title'])}</b><span>{esc(item_label(x))}</span></div>
</a>'''

def album(x):
    tags = " · ".join(str(t) for t in (x.get("tags") or []) if str(t) not in ("音乐",))
    return f'''<a class="wall-item" href="{esc(x['href'])}" target="_blank" rel="noopener" title="{esc(x['title'])} — {esc(x.get('creator',''))}">
  <div class="wall-cover"><img src="{esc(x['cover'])}" alt="{esc(x['title'])}" loading="lazy"></div>
  <div class="wall-meta"><b>{esc(x['title'])}</b><span>{esc(x.get('creator',''))}</span>{f'<em>{esc(tags)}</em>' if tags else ''}</div>
</a>'''

def section(num, key, title, desc, body, room):
    return f'''<section class="realm {key}" id="{key}">
  <div class="section-head"><span class="num">{num}</span><h2>{title}</h2><span class="desc">{desc}</span><a class="enter" href="./{room}/">3D room ↗</a></div>
  {body}
</section>'''

# ---------------------------------------------------------------- 3D rooms

def cover_hash(url):
    m = re.search(r"/assets/([0-9a-fA-F]+)(?:\.[A-Za-z0-9]+)?$", url or "")
    return m.group(1) if m else None

def pick_items(items, limit):
    """Deduplicate by cover; keep the first occurrence. Sample `limit` evenly."""
    seen, uniq = set(), []
    for x in items:
        c = x.get("cover")
        if not c or c in seen:
            continue
        seen.add(c)
        uniq.append(x)
    if limit and len(uniq) > limit:
        n, k = len(uniq), limit
        idx = [round(i * (n - 1) / (k - 1)) for i in range(k)]
        uniq = [uniq[i] for i in idx]
    return uniq

def make_cover(src, dst, size):
    w, h = size
    tool = shutil.which("magick") or shutil.which("convert")
    if not tool:
        raise RuntimeError("ImageMagick not found (magick/convert)")
    subprocess.run(
        [tool, src, "-auto-orient", "-resize", f"{w}x{h}^",
         "-gravity", "center", "-extent", f"{w}x{h}",
         "-quality", "82", dst],
        check=True, capture_output=True,
    )

def fallback_list(items):
    lis = "".join(
        f'<li><a href="{esc(x["href"])}" target="_blank" rel="noopener">{esc(x["title"])}</a>'
        f'<span>{esc(item_label(x))}</span></li>'
        for x in items
    )
    return f'<ul>{lis}</ul>'

def room_nav(medium):
    parts = []
    for m in ("book", "film", "music"):
        cls = ' class="on"' if m == medium else ""
        parts.append(f'<a href="../{m}/"{cls}>{ROOMS[m]["title"]}</a>')
    return (f'<nav class="room-nav"><a class="brandmark" href="../">MOUSEION</a>'
            f'<div class="links">{"".join(parts)}'
            f'<a class="ext" href="https://prosopon.junhangc.cn/mouseion/" target="_blank" rel="noopener">Index ↗</a>'
            f'</div></nav>')

def room_page(medium, meta):
    cfg = ROOMS[medium]
    total, unique, showing = meta["total"], meta["unique"], meta["showing"]
    if medium == "music":
        counts = f'<b>{total}</b> tracks · {unique} albums · showing {showing}'
    else:
        counts = f'<b>{total}</b> {cfg["label"]}'
    return f'''<!doctype html>
<html lang="zh" data-room="{medium}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>MOUSEION · {cfg["title"]}</title>
<meta name="description" content="MOUSEION {cfg["title"]} room — 三境居 · 书 · 影 · 音。">
<link rel="canonical" href="https://mouseion.junhangc.cn/{medium}/">
<meta name="theme-color" content="{'#e9e2d3' if medium == 'book' else '#0b0c0d'}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../shelf.css">
<script type="importmap">{{"imports":{{"three":"../vendor/three.module.min.js","three/addons/":"../vendor/addons/"}}}}</script>
</head><body>
<div id="app" data-medium="{medium}" data-src="../data/{medium}.json"><div id="loading">MOUSEION</div></div>
{room_nav(medium)}
<div class="ui">
  <div class="kicker">{cfg["kicker"]}</div>
  <div class="seal">三境居</div>
  <div class="bottom"><span id="counts">{counts}</span></div>
  <div class="hint">drag to look · scroll to zoom · click a cover</div>
</div>
<div id="fallback" hidden>
  <h2>{cfg["title"]}</h2>
  <p>3D unavailable — browse the collection below.</p>
  {fallback_list(meta["items"])}
</div>
<noscript><style>#fallback[hidden]{{display:block!important}}</style></noscript>
<script type="module" src="../shelf.js"></script>
</body></html>'''

def write_room(out, medium, feed_items, manifest):
    cfg = ROOMS[medium]
    group = [x for x in feed_items if x.get("medium") == medium]
    chosen = pick_items(group, cfg["limit"])
    covdir = os.path.join(out, "covers", medium)
    os.makedirs(covdir, exist_ok=True)

    jobs, items, skipped = [], [], []
    for x in chosen:
        h = cover_hash(x.get("cover"))
        rec = manifest.get(h) if h else None
        src = rec.get("src") if rec else None
        if not src or not os.path.exists(src):
            skipped.append(x.get("title"))
            continue
        dst = os.path.join(covdir, f"{h}.webp")
        if not os.path.exists(dst):
            jobs.append((src, dst))
        items.append(dict(
            title=x.get("title") or "",
            creator=x.get("creator") or "",
            year=x.get("year") or "",
            href=x.get("href") or "",
            cover=f"../covers/{medium}/{h}.webp",
        ))

    if jobs:
        with ThreadPoolExecutor(max_workers=8) as ex:
            list(ex.map(lambda a: make_cover(a[0], a[1], cfg["px"]), jobs))

    meta = dict(medium=medium, total=len(group), unique=len({x.get("cover") for x in group if x.get("cover")}),
                showing=len(items), items=items)
    os.makedirs(os.path.join(out, "data"), exist_ok=True)
    json.dump(meta, open(os.path.join(out, "data", f"{medium}.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    os.makedirs(os.path.join(out, medium), exist_ok=True)
    open(os.path.join(out, medium, "index.html"), "w", encoding="utf-8").write(room_page(medium, meta))
    if skipped:
        print(f"  ! {medium}: {len(skipped)} items skipped (no local cover): {skipped[:3]}", file=sys.stderr)
    return meta

def main():
    if len(sys.argv) < 2:
        print("usage: build.py <mouseion.json> [outdir] [assets-manifest.json]", file=sys.stderr); sys.exit(2)
    feed_path = sys.argv[1]
    feed = json.load(open(feed_path, encoding="utf-8"))
    items = feed.get("items") or []
    groups = {"book": [], "film": [], "music": []}
    for x in items:
        groups.setdefault(x.get("medium", "book"), []).append(x)
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "dist")
    manifest_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(feed_path), "assets-manifest.json")
    manifest = json.load(open(manifest_path, encoding="utf-8")) if os.path.exists(manifest_path) else {}
    if os.path.isdir(out): shutil.rmtree(out)
    os.makedirs(out, exist_ok=True)
    counts = {k: len(v) for k, v in groups.items()}
    count_line = " · ".join(f"{n} {label}" for n, label in ((counts['book'],'books'),(counts['film'],'films'),(counts['music'],'records')) if n)
    sections = []
    if groups["book"]:
        sections.append(section("I", "books", "BOOKS", "The shelf · printed matter",
            '<div class="bookcase"><div class="book-grid">' + "".join(book(x) for x in groups["book"]) + '</div><div class="shelf"></div></div>', "book"))
    if groups["film"]:
        sections.append(section("II", "films", "FILMS", "The film clip · sleeves & sprockets",
            '<div class="film-binder"><div class="film-head"><span>35 mm</span><span>CONTACT SHEET</span><span>ARCHIVE</span></div><div class="sleeve-grid">' + "".join(film(x) for x in groups["film"]) + '</div></div>', "film"))
    if groups["music"]:
        sections.append(section("III", "music", "MUSIC", "The wall · covers, names & credits",
            '<div class="wall">' + "".join(album(x) for x in groups["music"]) + '</div>', "music"))

    page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MOUSEION · 三境居</title>
<meta name="description" content="A private collection of books, films & records. 三境居：书 · 影 · 音。">
<link rel="canonical" href="https://mouseion.junhangc.cn/">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./style.css">
</head><body>
<nav class="nav"><a class="brand" href="#top">MOUSEION</a><div class="links"><a href="#books">Books</a><a href="#films">Films</a><a href="#music">Music</a><a class="ext" href="https://prosopon.junhangc.cn/mouseion/" target="_blank" rel="noopener">Index ↗</a></div></nav>
<header class="hero" id="top">
  <div class="hero-kicker">A private collection of books, films &amp; records</div>
  <h1 class="mark">MOUSEION</h1>
  <div class="hero-bottom"><span>{esc(count_line)}</span><span class="rooms">3D rooms: <a href="./book/">Books</a> · <a href="./film/">Films</a> · <a href="./music/">Music</a></span><span class="scroll">scroll ↓</span></div>
  <div class="seal">三境居</div>
</header>
<main>{''.join(sections)}</main>
<footer class="foot"><span>MOUSEION</span><span>三境居 · 书影音</span><a href="https://prosopon.junhangc.cn/mouseion/" target="_blank" rel="noopener">content lives at prosopon.junhangc.cn ↗</a><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">豫ICP备2025138597号-1</a></footer>
<script src="./app.js"></script>
</body></html>'''
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
    for f in ("style.css", "app.js", "shelf.css", "shelf.js"):
        shutil.copyfile(os.path.join(HERE, f), os.path.join(out, f))
    vendor_src, vendor_dst = os.path.join(HERE, "vendor"), os.path.join(out, "vendor")
    if os.path.isdir(vendor_src):
        shutil.copytree(vendor_src, vendor_dst)
    else:
        print("  ! vendor/ missing: 3D rooms will fail to load three.js", file=sys.stderr)
    json.dump(feed, open(os.path.join(out, "mouseion.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print("▶ 3D rooms")
    metas = {}
    for medium in ("book", "film", "music"):
        if groups.get(medium):
            metas[medium] = write_room(out, medium, items, manifest)
            m = metas[medium]
            print(f"  ✓ /{medium}/  {m['showing']} covers (of {m['total']} items / {m['unique']} unique)")

    print(f"built {out}: {len(items)} items ({counts})")

if __name__ == "__main__": main()
