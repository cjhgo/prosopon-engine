# mouseion-site — MOUSEION 独立子域站

由主站 build 产出的 `static/mouseion.json` 驱动；不依赖 Quartz 路由/布局。
内容本体仍在 `prosopon-source/content/mouseion/`；本目录只是第二个载体。

## 产出

```
dist/
├── index.html          2D 全屏画廊（书 / 影 / 音的标本墙）
├── book/  film/  music/  3D room（共享 shelf.js 引擎，全屏）
├── data/*.json         每个 room 的条目 feed（title/creator/year/href/cover）
├── covers/<medium>/    同源封面纹理（构建时按 medium 比例裁切）
├── vendor/             three.js module + addons（不依赖 CDN）
├── style.css app.js    2D landing
└── shelf.css shelf.js  3D room
```

- 3D room 条目全部链接回主站 `https://prosopon.junhangc.cn/mouseion/<slug>`。
- 封面**不能直接走 `assets.junhangc.cn`**（OSS 未配 CORS，TextureLoader 会炸）：
  `build.py` 用 `assets-manifest.json` 把 feed 的 cover hash 映射回本地源图，
  `magick` 裁成 book/film 2:3、music 1:1 后拷进 `dist/covers/`，3D 用同源路径。
- music 全量 350 条 / 312 个唯一封面；room 为可读性只展示 96 张（按封面去重后均匀抽样），
  页面标注 `350 tracks · 312 albums · showing 96`，2D landing 的 music 墙是全量入口。
- 缩略图/封面加载失败、WebGL 不可用时，页面降级到静态文字列表（`#fallback`）；
  JS 完全关闭时 `<noscript>` 也会展开同一份列表。

## 构建 / 预览

```bash
# 从 prod feed 生成（manifest 默认取 feed 同目录的 assets-manifest.json）
python3 build.py ../quartz/public/static/mouseion.json dist

python3 -m http.server 8096 --directory dist
# http://localhost:8096/  /book/  /film/  /music/

# 单独部署（通常由 prosopon-source/scripts/deploy.sh 自动执行）
../oikos/prosopon/skills/aliyun-ops/bin/vps deploy-dir dist --domain mouseion.junhangc.cn
```

`vendor/` 是提交进 repo 的 three.js r170（`three.module.min.js` + 三个 addon），
升级时替换即可；`dist/` 生成物 gitignore。
