# alt-text — turntrout `alt-text-llm` 接入(脚手架,未运行)

turntrout 的 alt 方案是独立 **MIT** 包 `alt-text-llm`:扫 markdown 里缺 `alt` 的图 → 调 LLM 生成 → 写回。
对我们是标准的 agentic tool-use(扫→生成→写回),也是「发布的手(efferent)」的一个具体例子。

## 安装
```
pip install alt-text-llm        # 依赖 imagemagick、ffmpeg、imgcat
export OPENROUTER_API_KEY=sk-or-...   # 它默认走 OpenRouter
```

## 跑(对内容仓 prosopon-source)
```
alt-text-llm scan     --dir ../../../../prosopon-source/content    # 找缺 alt 的图
alt-text-llm generate --model <支持中文的模型>                      # ★ 默认出英文 alt!要在 prompt/model 层指定中文
alt-text-llm apply                                                  # 写回 md
```

## 状态(2026-11-09)
**pi-alt 路径已跑通**。`pi-alt-draft.sh` 默认 `llm-center` / `deepseek-v4.1-flash-mb`（已注册到 `~/.pi/agent/models.json`；`claude-haiku`/`gemini` 当前额度耗尽 402）。dry-run 3 张封面均生成中文 alt。
**尚未全量运行，也尚未把 alt 写回 md/HTML**：脚本目前只回填 `public/static/assets-manifest.json`，且该文件每次 build 会重生成（`alt` 归 null）。真正接入前需要做 alt 持久化 + 回写。

## 备选(更贴我们的栈)
junhang 有 Makers / Anthropic 通道。若不想引 OpenRouter,可写一个薄脚本直接调 Anthropic messages API
(image block + 中文 prompt)生成 alt 再写回 md——放到本目录,成为一个自管的 alt skill。
**发布后再做**(得先有真实图;现在 mock 图不值当)。
