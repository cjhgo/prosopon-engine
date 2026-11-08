// collapsible headers(Dynalist 风格)——点击标题折叠其下内容到下一个同级/更高级标题。
// 纯前端:给文章里每个 h1-h6 注入一个 <button class="ch-toggle">(原生可聚焦/键盘无障碍),
// 折叠状态存 localStorage。支持:
//  - frontmatter `collapseHeaders: false` → 本页整体关闭折叠
//  - frontmatter `collapseDefault: closed` → 本页标题默认折叠
//  - 标题文字末尾加 `{-}` → 该标题不折叠(且 `{-}` 不显示)

const NO_FOLD_MARK = "{-}" // 该节不折叠(总是展开,无 toggle)
const FOLD_MARK = "{+}" // 该节默认折叠(点开才展开)

function headingLevel(el: Element): number {
  return parseInt(el.tagName[1], 10)
}

// 收集一个 heading 之下、直到遇到同级或更高级 heading 为止的所有兄弟元素
function collectSection(heading: Element): Element[] {
  const level = headingLevel(heading)
  const out: Element[] = []
  let node = heading.nextElementSibling
  while (node) {
    if (/^H[1-6]$/.test(node.tagName) && headingLevel(node) <= level) break
    out.push(node)
    node = node.nextElementSibling
  }
  return out
}

function storeKey(heading: Element): string {
  const slug = (document.body.dataset.slug as string) || location.pathname
  return `collapse:${slug}:${heading.id || heading.textContent?.slice(0, 40)}`
}

function setCollapsed(heading: Element, collapsed: boolean, persist = true) {
  const section = collectSection(heading)
  section.forEach((el) => el.classList.toggle("ch-hidden", collapsed))
  heading.classList.toggle("ch-collapsed", collapsed)
  const toggle = heading.querySelector(".ch-toggle")
  if (toggle) toggle.setAttribute("aria-expanded", collapsed ? "false" : "true")
  if (persist) {
    try {
      if (collapsed) localStorage.setItem(storeKey(heading), "1")
      else localStorage.removeItem(storeKey(heading))
    } catch {}
  }
}

function setupCollapsibleHeaders() {
  const init = document.querySelector(".collapsible-headers-init") as HTMLElement | null
  if (!init) return
  if (init.dataset.collapseEnabled === "0") return // 本页关闭
  const defaultClosed = init.dataset.collapseDefault === "closed"

  const article = document.querySelector("article")
  if (!article) return
  const headings = article.querySelectorAll("h1, h2, h3, h4, h5, h6")
  headings.forEach((heading) => {
    if (heading.querySelector(".ch-toggle")) return // 已处理
    // 逐节标记:`{-}` 不折叠(去掉 toggle),`{+}` 默认折叠
    const text = heading.textContent ?? ""
    if (text.includes(NO_FOLD_MARK)) {
      heading.textContent = text.replace(NO_FOLD_MARK, "").trim()
      return
    }
    const foldByMark = text.includes(FOLD_MARK)
    if (foldByMark) heading.textContent = text.replace(FOLD_MARK, "").trim()
    // 空标题(无内容可折叠)不加 toggle
    if (collectSection(heading).length === 0) return

    // 真正的 <button>:原生可聚焦、Enter/Space 触发 click、屏幕阅读器友好
    const toggle = document.createElement("button")
    toggle.type = "button"
    toggle.className = "ch-toggle"
    toggle.setAttribute("aria-label", "折叠/展开本节")
    toggle.setAttribute("aria-expanded", "true")
    heading.insertBefore(toggle, heading.firstChild)
    heading.classList.add("ch-heading")

    const onToggle = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      setCollapsed(heading, !heading.classList.contains("ch-collapsed"))
    }
    toggle.addEventListener("click", onToggle)
    // 点标题其余部分(非链接/非按钮)也能折叠,方便鼠标
    const onHeadingClick = (e: Event) => {
      const t = e.target as Element
      if (t.closest("a") || t === toggle || toggle.contains(t)) return
      setCollapsed(heading, !heading.classList.contains("ch-collapsed"))
    }
    heading.addEventListener("click", onHeadingClick)
    window.addCleanup?.(() => {
      toggle.removeEventListener("click", onToggle)
      heading.removeEventListener("click", onHeadingClick)
    })

    // 初始态:优先 localStorage,其次逐节 {+} 标记,其次页面默认
    const initialCollapsed = foldByMark || defaultClosed
    try {
      const stored = localStorage.getItem(storeKey(heading))
      const collapsed = stored === "1" || (stored === null && initialCollapsed)
      if (collapsed) setCollapsed(heading, true, false)
    } catch {
      if (initialCollapsed) setCollapsed(heading, true, false)
    }
  })
}

document.addEventListener("nav", setupCollapsibleHeaders)
