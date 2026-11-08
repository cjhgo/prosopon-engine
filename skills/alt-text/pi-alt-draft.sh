#!/usr/bin/env bash
# =============================================================================
# pi-alt-draft.sh — 用本地 pi(pi-coding-agent)为数字花园图片批量生成中文 alt
# =============================================================================
# 状态:草案(调研已实测通过,脚本逻辑已就绪,按需 review 后 run)
# 产出者:独立后台调研(2026-11-08),只写本文件,未碰 prosopon-engine/source 其他文件。
#
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║ 调研纪要:pi 的非交互 + 多模态(看图)调用                                ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# 结论:**pi 能非交互地接收一张本地图片 + 中文 prompt,返回纯文本 alt,国内直达。**
#        实测模型真的"看到"了图片内容(不是看到路径字符串)。
#
# 【pi 版本】 0.87.1  (/opt/homebrew/bin/pi → @earendil-works/pi-coding-agent)
#
# 【非交互入口】 `-p` / `--print`(print mode,一次性问答,结果打到 stdout)。
#     源码(bundle chunk-OJP47DM6.js)内:runPrintMode / processFileArguments。
#
# 【多模态关键 — 怎么传图】
#     用 `@<图片绝对路径>` 作为一个参数。pi 的 parseArgs 把 `@xxx` 收进 fileArgs,
#     processFileArguments() 对每个 fileArg:
#        detectSupportedImageMimeTypeFromFile() 识别出是图片 →
#        readFile + processImage(自动 resize)→ 作为真正的 {type:"image"} 附件
#        塞进发给模型的 message(**不是**把路径当字符串)。
#     => png / jpeg 均实测通过。
#
# 【★ 必须 --offline ★】
#     pi 启动默认会去 clone / npm-install 配置里的插件包(~/.pi/agent/settings.json
#     的 "packages",含一个 github.com/vvv850/pi-pretty-codeblocks)。github 被墙 →
#     clone 卡 ~75s 后 fatal,且**整个进程崩溃退出 1**(连 --help 都跑不出来)。
#     `--no-extensions` 不够(仍会尝试 clone 那个 git 包)。
#     `--offline`(或 env PI_OFFLINE=1)才真正跳过插件拉取与版本检查。
#     注意:--offline 只断"插件/注册表刷新"这类网络,**不**断模型推理请求本身
#     (推理照样打到 llm-center,实测成功)。
#
# 【★ --offline 的副作用:必须显式指定 --model ★】
#     settings.json 默认 model = gpt-5.6-sol(走 llm-center-responses),该 id 不在
#     本地静态 models.json 里、要联网注册表才认得 → offline 下报"模型不存在" exit 1。
#     解法:用 `--provider` + `--model` 指定一个**静态配置里就有、且支持 vision** 的模型。
#
# 【模型 / key / 国内可达性】
#     所有模型都走 modelbest llm-center:  base=https://llm-center.modelbest.co/llm
#     鉴权来自环境变量(当前 shell 已有):ANTHROPIC_AUTH_TOKEN=sk-... + ~/.pi/agent/modelbest.jwt
#     国内直达(modelbest 自家网关,非 github/anthropic 境外域名)。
#     支持 vision 的 provider/模型(models.json 实测可选):
#        - llm-center-anthropic : claude-haiku-4-5-20251001 (本脚本默认,便宜快,实测好)
#                                 claude-3-5-sonnet-20241022 / claude-opus-4-6 ...(21 个 vision)
#        - llm-center-google    : gemini-2.5-flash / gemini-2.5-pro ...(全 23 个都 vision)
#        - llm-center-openai    : gpt-4o-mini / MiniCPM-V-4.5 ...(76 个 vision)
#     注:deepseek-direct / deepseek-v4 系列是 **text-only**,不能用来看图。
#
# 【实测通过的确切命令行】(5.5s 返回,stdout 纯文本一行,stderr 空)
#
#   pi --offline \
#      --provider llm-center-anthropic \
#      --model claude-haiku-4-5-20251001 \
#      --system-prompt "你是图片 alt 文本生成器。只输出一句简洁中文描述图片内容,不要引号、不要前缀、不要解释、不要 markdown。" \
#      -p "为这张图片生成 alt 文本" \
#      "@/abs/path/to/image.png"
#
#   验证证据:对 .../今日意如何/1794125309993.png(面壁智能工牌照)返回
#     「面壁智能(ModelBest)的黑色工牌…印有 "AGI FOR LIVES" 标语…」
#   —— AGI FOR LIVES / 面壁 / ModelBest 都对上了,是真看图,不是胡诌。
#   (--system-prompt 覆盖整个系统提示,顺带避免 pi 加载 ~/.pi 的 APPEND_SYSTEM.md/
#    metame 等上下文导致跑题闲聊。)
#
# 【备选方案(若哪天 pi 这条路坏了)】
#   README 里提到的 Anthropic SDK 薄脚本依旧成立。轮廓:
#     import anthropic, base64, mimetypes
#     client = anthropic.Anthropic(
#         base_url=os.environ["ANTHROPIC_BASE_URL"],      # 复用 modelbest 网关
#         auth_token=os.environ["ANTHROPIC_AUTH_TOKEN"])  # 或 api_key=
#     msg = client.messages.create(
#         model="claude-haiku-4-5-20251001", max_tokens=200,
#         system="你是图片 alt 生成器,只输出一句简洁中文描述…",
#         messages=[{"role":"user","content":[
#             {"type":"image","source":{"type":"base64",
#                 "media_type":mime,"data":b64}},
#             {"type":"text","text":"为这张图片生成 alt 文本"}]}])
#     alt = msg.content[0].text.strip()
#   —— 跟 pi 走同一个 modelbest 网关/同一把 token,只是去掉 pi 这层 harness。
#      大图(>5MB)需自己 resize(pi 版 processImage 会自动 resize,SDK 版要手动)。
#
# ─────────────────────────────────────────────────────────────────────────────
# 用法:
#   ./pi-alt-draft.sh [--dry-run] [--limit N] [--model M] [--provider P] [--manifest PATH]
#   --dry-run  : 只打印生成结果,不写回 manifest
#   --limit N  : 最多处理 N 张(调试用)
# 行为:读 manifest → 对 alt==null 的条目调 pi 看 src 图生成中文 alt → 写回 manifest 的 alt 字段。
# 本步**只回填 manifest**,不改 md(将来另做)。
# =============================================================================
set -euo pipefail

# ---- 可配置项 --------------------------------------------------------------
MANIFEST="/Users/junhangc/workspace/prosopon-engine/quartz/public/static/assets-manifest.json"
PROVIDER="llm-center-anthropic"
MODEL="claude-haiku-4-5-20251001"
SYSTEM_PROMPT="你是图片 alt 文本生成器。只输出一句简洁、准确的中文描述图片内容，用于无障碍阅读与 SEO。不要引号、不要前缀、不要解释、不要 markdown、不要换行。"
USER_PROMPT="为这张图片生成简洁中文 alt 文本"
DRY_RUN=0
LIMIT=0   # 0 = 不限

# ---- 解析参数 --------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=1; shift ;;
    --limit)    LIMIT="$2"; shift 2 ;;
    --model)    MODEL="$2"; shift 2 ;;
    --provider) PROVIDER="$2"; shift 2 ;;
    --manifest) MANIFEST="$2"; shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

command -v pi  >/dev/null || { echo "找不到 pi" >&2; exit 1; }
[[ -f "$MANIFEST" ]] || { echo "manifest 不存在: $MANIFEST" >&2; exit 1; }

# ---- 取出所有 alt==null 的 (hash \t src) --------------------------------------
# 用 python3 -I(隔离模式,防 cwd 里被植入同名模块)读 json。
# 不用 mapfile(macOS 自带 bash 3.2 没有),用 while-read 填数组,兼容老 bash。
ENTRIES=()
while IFS= read -r _line; do
  ENTRIES+=("$_line")
done < <(python3 -I -c '
import json, sys
m = json.load(open(sys.argv[1], encoding="utf-8"))
for h, v in m.items():
    if v.get("alt") is None:
        print(h + "\t" + v.get("src", ""))
' "$MANIFEST")

total=${#ENTRIES[@]}
echo ">> manifest 共 $total 个待生成(alt==null)条目"
[[ $total -eq 0 ]] && { echo ">> 没有待处理条目,退出。"; exit 0; }

# ---- 逐张生成 + 回填 --------------------------------------------------------
# 回填用一个小 python 原子更新:读→改一个 key→写临时文件→rename。
# (逐条写回,保证中断后已生成的不丢失。)
update_manifest() {
  local hash="$1" alt="$2"
  ALT_TEXT="$alt" python3 -I -c '
import json, os, sys, tempfile
path, h = sys.argv[1], sys.argv[2]
alt = os.environ["ALT_TEXT"]
m = json.load(open(path, encoding="utf-8"))
if h in m:
    m[h]["alt"] = alt
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
with os.fdopen(fd, "w", encoding="utf-8") as f:
    json.dump(m, f, ensure_ascii=False, indent=2)
os.replace(tmp, path)
' "$MANIFEST" "$hash"
}

count=0; ok=0; fail=0
for line in "${ENTRIES[@]}"; do
  hash="${line%%$'\t'*}"
  src="${line#*$'\t'}"
  count=$((count+1))
  [[ $LIMIT -gt 0 && $count -gt $LIMIT ]] && { echo ">> 到达 --limit $LIMIT,停。"; break; }

  if [[ ! -f "$src" ]]; then
    echo "[$count/$total] [$hash] 跳过:源图不存在 $src" >&2
    fail=$((fail+1)); continue
  fi

  echo "[$count/$total] [$hash] 看图: $src"

  # ★ 核心调用:--offline(跳插件 clone)+ 显式 provider/model(offline 下必须)
  #   stdout = 纯 alt 文本;stderr 分离丢弃。timeout 兜底防卡死。
  alt="$(timeout 120 pi \
            --offline \
            --provider "$PROVIDER" \
            --model "$MODEL" \
            --system-prompt "$SYSTEM_PROMPT" \
            -p "$USER_PROMPT" \
            "@$src" 2>/dev/null || true)"

  # 清洗:去首尾空白、去可能的包裹引号、压成单行。
  alt="$(printf '%s' "$alt" | tr '\n' ' ' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/^"(.*)"$/\1/; s/^“(.*)”$/\1/')"

  if [[ -z "$alt" ]]; then
    echo "            ✗ 生成失败(空输出),保留 alt=null" >&2
    fail=$((fail+1)); continue
  fi

  echo "            → $alt"
  if [[ $DRY_RUN -eq 1 ]]; then
    ok=$((ok+1))
  else
    update_manifest "$hash" "$alt"
    ok=$((ok+1))
  fi
done

echo ">> 完成:成功 $ok,失败/跳过 $fail  (dry-run=$DRY_RUN)"
[[ $DRY_RUN -eq 1 ]] && echo ">> dry-run 未写回 manifest。"
