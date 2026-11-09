#!/usr/bin/env python3
"""Build the standalone MOUSEION subdomain from the main site's mouseion.json feed."""
import json, html, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))

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

def section(num, key, title, desc, body):
    return f'''<section class="realm {key}" id="{key}">
  <div class="section-head"><span class="num">{num}</span><h2>{title}</h2><span class="desc">{desc}</span></div>
  {body}
</section>'''

def main():
    if len(sys.argv) < 2:
        print("usage: build.py <mouseion.json> [outdir]", file=sys.stderr); sys.exit(2)
    feed = json.load(open(sys.argv[1], encoding="utf-8"))
    items = feed.get("items") or []
    groups = {"book": [], "film": [], "music": []}
    for x in items:
        groups.setdefault(x.get("medium", "book"), []).append(x)
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "dist")
    if os.path.isdir(out): shutil.rmtree(out)
    os.makedirs(out, exist_ok=True)
    counts = {k: len(v) for k, v in groups.items()}
    count_line = " · ".join(f"{n} {label}" for n, label in ((counts['book'],'books'),(counts['film'],'films'),(counts['music'],'records')) if n)
    sections = []
    if groups["book"]:
        sections.append(section("I", "books", "BOOKS", "The shelf · printed matter",
            '<div class="bookcase"><div class="book-grid">' + "".join(book(x) for x in groups["book"]) + '</div><div class="shelf"></div></div>'))
    if groups["film"]:
        sections.append(section("II", "films", "FILMS", "The film clip · sleeves & sprockets",
            '<div class="film-binder"><div class="film-head"><span>35 mm</span><span>CONTACT SHEET</span><span>ARCHIVE</span></div><div class="sleeve-grid">' + "".join(film(x) for x in groups["film"]) + '</div></div>'))
    if groups["music"]:
        sections.append(section("III", "music", "MUSIC", "The wall · covers, names & credits",
            '<div class="wall">' + "".join(album(x) for x in groups["music"]) + '</div>'))

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
  <div class="hero-bottom"><span>{esc(count_line)}</span><span class="scroll">scroll ↓</span></div>
  <div class="seal">三境居</div>
</header>
<main>{''.join(sections)}</main>
<footer class="foot"><span>MOUSEION</span><span>三境居 · 书影音</span><a href="https://prosopon.junhangc.cn/mouseion/" target="_blank" rel="noopener">content lives at prosopon.junhangc.cn ↗</a><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">豫ICP备2025138597号-1</a></footer>
<script src="./app.js"></script>
</body></html>'''
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
    for f in ("style.css", "app.js"):
        shutil.copyfile(os.path.join(HERE, f), os.path.join(out, f))
    json.dump(feed, open(os.path.join(out, "mouseion.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"built {out}: {len(items)} items ({counts})")

if __name__ == "__main__": main()
