export const mouseionStyles = `
.m-mouseion{--m-paper:#f3efe5;--m-paper2:#e9e2d2;--m-ink:#1e2a2b;--m-muted:#72756a;--m-line:#d3caba;--m-celadon:#2f8296;--m-ochre:#b3763a;--m-wood:#4a3527;margin:1.2rem 0 2.4rem;color:var(--m-ink)}
.m-mouseion *{box-sizing:border-box}
.m-masthead{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid var(--m-line);padding:0 0 12px;margin:0 0 10px}
.m-kicker{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--m-muted)}
.m-seal{writing-mode:vertical-rl;font-family:"Songti SC","Noto Serif CJK SC",serif;font-size:12px;letter-spacing:.3em;color:var(--m-celadon);border:1px solid var(--m-celadon);padding:7px 4px;line-height:1}
.m-realm{margin:2.2rem 0 1.8rem}
.m-head{display:flex;align-items:baseline;gap:14px;margin:0 0 14px}
.m-head .m-num{font-family:Georgia,"Times New Roman",serif;font-size:13px;letter-spacing:.12em;color:var(--m-ochre);min-width:26px}
.m-head h2{font-family:Georgia,"Times New Roman",serif;font-weight:500;font-size:24px;letter-spacing:.16em;margin:0;color:var(--m-ink)}
.m-head .m-desc{margin-left:auto;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--m-muted)}
.m-head .m-more{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--m-celadon);text-decoration:none;border-bottom:1px solid transparent;white-space:nowrap}
.m-head .m-more:hover{border-color:var(--m-celadon)}
.m-noimg{width:100%;height:100%;background:#e3dbcb;display:block}

/* books */
.m-books .m-bookcase{position:relative;padding:20px 22px 0;background:linear-gradient(180deg,#3a261b,#24170f);border:9px solid var(--m-wood);border-top-width:12px;border-bottom-width:15px;box-shadow:0 22px 40px -34px #0009,inset 0 0 40px #0007;overflow:hidden}
.m-books .m-bookcase::after{content:"";position:absolute;inset:0;background:linear-gradient(118deg,rgba(255,255,255,.10),transparent 34%,rgba(255,255,255,.03) 58%,transparent 72%);pointer-events:none;z-index:4}
.m-book-row{display:flex;align-items:flex-end;justify-content:center;gap:12px;min-height:214px;padding:0 4px;position:relative;z-index:2;flex-wrap:wrap}
.m-book{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit;transition:transform .16s ease;max-width:150px}
.m-book:hover{transform:translateY(-6px)}
.m-book-cover{height:182px;padding:5px;background:#f8f2e6;box-shadow:0 12px 18px -12px #000a,0 2px 3px #0004,inset 0 0 0 1px rgba(30,22,14,.08)}
.m-book-cover img{height:100%;width:auto;max-width:140px;display:block;object-fit:contain}
.m-book-title{font-family:"Songti SC","Noto Serif CJK SC",Georgia,serif;font-size:8px;font-weight:600;line-height:1.3;text-align:center;margin-top:5px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f3ecdc}
.m-book-meta{font-size:6.4px;color:#b9ae9c;margin-top:1px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-shelf{height:12px;margin:0 -10px;background:linear-gradient(180deg,#9b704f,#6a4932 45%,#4a3020 75%,#2f1e14),repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 1px,transparent 1px 7px);box-shadow:0 1px 0 rgba(255,255,255,.32) inset,0 8px 14px -7px #0009;position:relative;z-index:1}

/* films */
.m-films .m-film-binder{position:relative;padding:14px 16px 18px;background:linear-gradient(180deg,#1b1b1d,#0c0c0d);border:1px solid #2b2b2e;box-shadow:0 24px 44px -36px #000a,inset 0 0 36px #0006;overflow:hidden}
.m-film-head{display:flex;justify-content:space-between;font-size:7px;letter-spacing:.2em;color:#9c9486;border-bottom:1px solid #2c2c2e;padding-bottom:6px;margin-bottom:8px}
.m-film-row{display:flex;align-items:flex-end;justify-content:center;padding:8px 0 2px;flex-wrap:wrap}
.m-sleeve{position:relative;width:178px;height:270px;margin-left:-16px;background:#101011;padding:18px 8px 34px 22px;transform:rotate(-.7deg);box-shadow:0 16px 26px -14px #000c,0 2px 5px #0008;transition:transform .16s ease;text-decoration:none;color:inherit}
.m-sleeve:first-child{margin-left:0}
.m-sleeve:nth-child(even){transform:rotate(.6deg)}
.m-sleeve:hover{transform:rotate(0) translateY(-6px);z-index:3}
.m-perf{position:absolute;left:5px;top:6px;bottom:6px;width:10px;background-image:radial-gradient(circle,#d8d1c1 2px,transparent 2.4px);background-size:9px 14px;opacity:.72}
.m-poster{height:202px;background:#050506;display:grid;place-items:center;box-shadow:inset 0 0 0 1px #2a2a2c;overflow:hidden}
.m-poster img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block}
.m-flabel{position:absolute;left:22px;right:8px;bottom:7px;background:#f4eee1;color:#1e1a15;padding:4px 6px;display:flex;flex-direction:column;gap:1px}
.m-flabel b{font-family:"Songti SC","Noto Serif CJK SC",Georgia,serif;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-flabel span{font-size:6px;color:#7a7263;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-sleeve::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.16),transparent 30%,transparent 70%,rgba(255,255,255,.05));pointer-events:none}

/* music: dense cover wall — cover is texture, name/artist is truth */
.m-music .m-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
.m-wall-tile{display:flex;flex-direction:column;background:#f7f1e3;text-decoration:none;color:var(--m-ink);box-shadow:0 8px 16px -12px #0007,0 1px 2px #0003;transition:transform .15s ease;overflow:hidden}
.m-wall-tile:hover{transform:translateY(-3px)}
.m-wall-cover{aspect-ratio:1;background:#e3dbcb;overflow:hidden}
.m-wall-cover img{width:100%;height:100%;object-fit:cover;display:block}
.m-wall-meta{padding:4px 5px 5px;display:flex;flex-direction:column;gap:1px;min-height:27px}
.m-wall-meta b{font-family:"Songti SC","Noto Serif CJK SC",Georgia,serif;font-size:7.2px;line-height:1.2;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-wall-meta span{font-size:6px;color:#77705f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-empty{padding:2rem;text-align:center;color:var(--m-muted);font-size:12px}

/* dark mode: keep the same objects, only soften the page-level paper */
[saved-theme="dark"] .m-book-title,[saved-theme="dark"] .m-book-meta{color:#e8dfcf}
[saved-theme="dark"] .m-head h2,[saved-theme="dark"] .m-head .m-num{color:#e8dfcf}
[saved-theme="dark"] .m-head .m-desc{color:#9b9182}

@media (max-width:800px){
  .m-books .m-bookcase{padding:14px 12px 0}
  .m-book-cover{height:150px}
  .m-book-cover img{max-width:120px}
  .m-sleeve{width:150px;height:236px;margin-left:0}
  .m-poster{height:172px}
  .m-music .m-wall{grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px}
  .m-head .m-desc{display:none}
}
`
