# prosopon-engine

junhang 数字花园的**定制代码 monorepo**(载体,非本体;内容在 prosopon-source)。

## 布局
- `quartz/` — Quartz v4 fork(在此 build)。
- `skills/` — 发布/工具 skill(如 `xhs-publish/`)。

## 构建(内容来自 sibling 的 prosopon-source)
```
cd quartz && npx quartz build -d ../../prosopon-source/content --serve
```

## upstream Quartz 基线
vendored from jackyzha0/quartz @ `d25a6eabf96751ffca56f8a8139272def7a65041`(已剥离其 .git)。更新:git-subtree 或手动 diff(个人站罕见)。
