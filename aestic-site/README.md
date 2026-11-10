# aestic-site — 主站 /aestic/ 派生页

一面由「所有写过的东西里出现过的图」组成的洗牌墙。不是 MOUSEION 的第四个 room：
它属于主站 `prosopon.junhangc.cn/aestic/`（`junhangc.cn/aestic` 由根域 301 过来）。

## 数据

构建发生在 Quartz build 之后，输入全部来自主站产物：

- `quartz/public/static/assets-manifest.json`：扁平图台账（每张图含 `refs` → 引用它的 note）
- `quartz/public/static/contentIndex.json`：slug → title，用于 hover 显示来源
- `alt`：manifest 里 pi-alt 写入的真 alt；为空时退回 note 标题

输出 `quartz/public/aestic/`，随主站一起 deploy。

## 页面

- 默认 `column-width: clamp(8.5rem,18vw,16rem)` 的多列瀑布（CSS native masonry）
- 右下角 toggle 切 **chaos mode**：skyline 装箱把图随机大小、绝对定位成不规则拼贴；
  状态存 `localStorage["aestic-mode"]`，宽度变化重排（只看宽度，避免高度自触发死循环）
- 每次访问 Fisher–Yates 洗牌；hover 左下角显示来源 note，点击整图回 note
- 每张 `<img>` 带构建期读出的 `width/height` + `aspect-ratio`，无 CLS；`loading="lazy"`
- 无图可跳时降级为纯图（不显示 note 链接）

## 构建 / 预览

```bash
# quartz build 之后（deploy.sh 自动执行）
python3 aestic-site/build.py \
  quartz/public/static/assets-manifest.json \
  quartz/public/static/contentIndex.json \
  quartz/public/aestic

python3 -m http.server 8098 --directory quartz/public
# http://localhost:8098/aestic/
```
