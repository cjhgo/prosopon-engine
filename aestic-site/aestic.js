// AESTIC — shuffle on every visit; hover shows the note the image came from.
// Tidy mode = CSS multicol. Chaos mode = skyline-packed absolute mosaic.
(() => {
  const grid = document.getElementById('aes-grid');
  if (!grid) return;

  // Fisher–Yates: the wall has no fixed order, every visit is a new arrangement.
  const items = Array.from(grid.children);
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const frag = document.createDocumentFragment();
  for (const el of items) frag.appendChild(el);
  grid.appendChild(frag);

  const caption = document.getElementById('aes-caption');
  const capTitle = caption && caption.querySelector('.t');
  const capNote = caption && caption.querySelector('.n');
  const toggle = document.getElementById('aes-mode-toggle');
  const KEY = 'aestic-mode';
  let mode = 'tidy';
  try { mode = localStorage.getItem(KEY) === 'chaos' ? 'chaos' : 'tidy'; } catch {}

  const dims = items.map((el) => {
    const img = el.querySelector('img');
    return {
      w: Number(img && img.getAttribute('width')) || 800,
      h: Number(img && img.getAttribute('height')) || 600,
    };
  });

  function clearChaos() {
    grid.removeAttribute('data-mode');
    grid.style.height = '';
    for (const el of items) {
      el.style.left = el.style.top = el.style.width = el.style.height = '';
    }
  }

  function addSkyline(sky, x, width, yNew) {
    const out = [];
    const x2 = x + width;
    for (const s of sky) {
      const s2 = s.x + s.w;
      if (s2 <= x || s.x >= x2) { out.push(s); continue; }
      if (s.x < x) out.push({ x: s.x, w: x - s.x, y: s.y });
      if (s2 > x2) out.push({ x: x2, w: s2 - x2, y: s.y });
    }
    out.push({ x, w: width, y: yNew });
    out.sort((a, b) => a.x - b.x);
    const merged = [];
    for (const s of out) {
      const last = merged[merged.length - 1];
      if (last && Math.abs(last.y - s.y) < .5 && Math.abs(last.x + last.w - s.x) < .5) {
        last.w += s.w;
      } else {
        merged.push({ ...s });
      }
    }
    return merged;
  }

  let packW = 0;
  let raf = 0;
  function pack() {
    const W = grid.clientWidth;
    if (W < 10) return;
    packW = W;
    const gap = 4;
    const base = Math.min(320, Math.max(120, W * .18));
    let sky = [{ x: 0, w: W, y: 0 }];
    let maxY = 0;

    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      const d = dims[i];
      const ratio = Math.max(.3, Math.min(3, d.w / d.h));
      let h = base * (.55 + Math.random() * .9);
      let w = h * ratio;
      if (w > W - gap) { w = W - gap; h = w / ratio; }
      const eff = w + gap;

      let best = null;
      for (let s = 0; s < sky.length; s++) {
        const seg = sky[s];
        if (seg.x + eff > W + .5) continue;
        let xx = seg.x, y = 0, j = s;
        while (xx < seg.x + eff - .5 && j < sky.length) {
          if (sky[j].x > xx + .5) break;
          y = Math.max(y, sky[j].y);
          xx = sky[j].x + sky[j].w;
          j++;
        }
        if (xx + .5 < seg.x + eff) continue;
        if (!best || y < best.y - .5 || (Math.abs(y - best.y) <= .5 && seg.x < best.x)) {
          best = { x: seg.x, y };
        }
      }
      if (!best) best = { x: 0, y: maxY + gap };

      el.style.left = best.x + 'px';
      el.style.top = best.y + 'px';
      el.style.width = w + 'px';
      el.style.height = h + 'px';

      sky = addSkyline(sky, best.x, eff, best.y + h + gap);
      maxY = Math.max(maxY, best.y + h + gap);
    }
    grid.style.height = (maxY + 2) + 'px';
  }

  function apply(next) {
    mode = next;
    try { localStorage.setItem(KEY, mode); } catch {}
    if (caption) caption.hidden = true;
    if (toggle) {
      toggle.setAttribute('aria-pressed', mode === 'chaos' ? 'true' : 'false');
      toggle.title = mode === 'chaos' ? 'Switch to tidy mode' : 'Switch to chaos mode';
    }
    if (mode === 'chaos') {
      grid.setAttribute('data-mode', 'chaos');
      pack();
    } else {
      clearChaos();
    }
  }

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => apply(mode === 'chaos' ? 'tidy' : 'chaos'));
  }

  const ro = new ResizeObserver(() => {
    if (mode !== 'chaos') return;
    if (Math.abs(grid.clientWidth - packW) > 1) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pack);
    }
  });
  ro.observe(grid);

  apply(mode);

  if (!caption) return;
  grid.addEventListener('pointerover', (e) => {
    const item = e.target.closest ? e.target.closest('.aes-item') : null;
    if (!item) return;
    capTitle.textContent = item.dataset.title || '';
    capNote.textContent = item.tagName === 'A' ? 'note ↗' : '';
    caption.hidden = false;
  });
  grid.addEventListener('pointerout', (e) => {
    const to = e.relatedTarget;
    if (!to || !to.closest || !to.closest('.aes-item')) caption.hidden = true;
  });
})();
