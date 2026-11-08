# prosopon-engine docs

按 **agentswe 四层**记录「定制 Quartz」这个 tool_use 交付的全部 ctx 知识。
目的:让无对话历史的 agent 能接手——知道为什么这样建、Quartz 有哪些坑、架构怎么落、怎么跑。

| 文件 | 层 | 谁 own | 内容 |
|---|---|---|---|
| [00-why.md](00-why.md) | why | 人 | 为什么有本仓、为什么 Quartz、为什么定制、边界 |
| [10-tool_use.md](10-tool_use.md) | tool_use | 外部事实 | 定制 Quartz 所需的 leaky 认知(构建模型 / tsx非React / 图片两端矛盾 / slug耦合 / date伪造 / wikilink非模糊 / 三正交零件) |
| [20-design.md](20-design.md) | design | **人** | owned 命名空间纪律 + 自定义件清单(实体→职责→治哪个leaky)+ 对 upstream 的一处侵入 |
| [30-runbook.md](30-runbook.md) | 运维台账 | — | 构建/预览/三仓关系/数据落点/部署/升级 upstream |
| [40-references.md](40-references.md) | backlog | 人 | 可借鉴的 Quartz 定制(turntrout/aarnphm 提炼,按中文花园性价比筛)——**将来可挑,非现状** |
| [50-v5-migration.md](50-v5-migration.md) | 迁移记录 | 人 | v4.5.2 → v5.0.0(拿 Bases)。路径裁决 / 逐件映射 / runbook / 风险 / **落地结果**。`v5` 分支已冒烟 |

## 上游指针(本仓之外)

- **立意与哲学全量**:`~/workspace/oikos/prosopon/hypertext-数字花园.md`(hypertext/图本链末/认知三态/folder正交/决策表)。本仓 docs 只记「定制 Quartz 怎么不出错」,不复述哲学。
- **内容源规则**:`prosopon-source/CLAUDE.md`(作者写作 + reviewer 补 frontmatter 的三层规则)。
- **云运维/部署**:`oikos/prosopon/skills/aliyun-ops/`。

## docs-code-loop 纪律

docs 是 truth,code 是投影。实现撞到 docs 的洞 → 停下改 docs,不在代码里私补。真机(serve/构建)是唯一裁判。
