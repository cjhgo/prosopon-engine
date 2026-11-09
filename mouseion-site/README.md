# mouseion-site — MOUSEION 独立子域站

由主站 build 产出的 `static/mouseion.json` 驱动；不依赖 Quartz 路由/布局。
内容本体仍在 `prosopon-source/content/mouseion/`；本目录只是第二个载体。

```bash
# 本地从 prod feed 生成并预览
python3 build.py ../quartz/public/static/mouseion.json dist
python3 -m http.server 8096 --directory dist

# 部署（通常由 prosopon-source/scripts/deploy.sh 自动执行）
../oikos/prosopon/skills/aliyun-ops/bin/vps deploy-dir dist --domain mouseion.junhangc.cn
```

- `style.css` / `app.js`：全屏暗色画廊的样式与极简脚本
- `dist/` 生成物，gitignore
- 条目链接全部指向 `https://prosopon.junhangc.cn/mouseion/<slug>`（主站 canonical note 页）
