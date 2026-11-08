# why — 为什么有 prosopon-engine 这个定制

> agentswe 四层之 **why**(人 own)。立意、需求来源、必要性。

## 它是什么

prosopon-engine = junhang 数字花园「生活工作读书新知」的**定制代码 monorepo**:
一个 vendored 的 **Quartz v5.0.0** fork(`quartz/`,upstream jackyzha0/quartz `v5` 分支)+ 发布/工具 skill(`skills/`)。选择 v5 的直接收益是官方 **Obsidian Bases**（数据库视图）与插件生态；迁移记录见 [50-v5-migration.md](50-v5-migration.md)。
内容不在这里——在 sibling 仓 **prosopon-source**(md + 随文图)。本仓是**可换的载体**,内容是本体。

## 为什么是 Quartz,不是别的

决策链完整论证在上游(**不在本 repo**):`~/workspace/oikos/prosopon/hypertext-数字花园.md`。
一句话:认知是网(图),Quartz 把同一份 markdown 物化成「链(文章)+树(folder/tag)+网(wikilink/backlink/graph)」三投影,与认知三态同构;且它静态优先、数据主权在 markdown 本体、载体可换。留 Quartz 不换 Astro 的理由见那篇 §2.B。

## 为什么要定制(而非用默认)

默认 Quartz 是「通用数字花园」,对 junhang 有三类不满足,构成本仓存在的必要性:

1. **审美**:默认配色/字体无个性(「没花心思」)。→ 天青·文人盘 + 卡片首页 + 自定义页脚(去 Quartz 推广 + 备案号)。
2. **中文 + 本地写作工作流**:junhang 用 VSCode + cweijan 插件写 md、粘图。默认 Quartz 在「本地普通预览」与「上线」之间对图片路径有矛盾,且把 slug 编进图 URL(迁 COS 受阻)。→ 几个自定义 transformer 把这些矛盾在构建时吃掉,让作者写**标准 md**、零格式负担。
3. **数据主权落地**:junhang 的承重墙是 carrier≠本体、迁 COS 不被锁。→ 图片资产扁平化(`/assets/<hash>`,与内容位置解耦)。

## 必要性判据(为什么这些坑非治不可)

这些不是外观打磨,是把 junhang 的承重墙信念(reproducibility、数据主权、形是实的门)**做进管线**。几个坑(flat-url 碎图、slug 耦合、date 伪造)是任何人用 Quartz 迟早踩、且难自行诊断的——一次做对,作者此后写 md + 粘图不再需要想这些。详见 [10-tool_use.md](10-tool_use.md) 的 leaky 认知。

## 边界(不做什么)

- 不做 turntrout 式测试/CI 军备(个人花园过度工程)。
- 不自建 CDN 管线(junhang 自有 ECS/OSS)。
- 不引英文专用排版(smallcaps/智能引号/序数——中文 N/A)。
- 内容决策(选哪篇、脱敏、写门面)不在 engine,属 prosopon-source + 人。
