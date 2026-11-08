// collapsible headers(Dynalist 风格)——点击标题折叠其下内容到下一个同级/更高级标题。
// 纯前端:给文章里每个 h1-h6 注入一个 toggle,折叠状态存 localStorage(按 slug+heading)。

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
  return `collapse:${location.pathname}:${heading.id || heading.textContent?.slice(0, 40)}`
}

function setCollapsed(heading: Element, collapsed: boolean, persist = true) {
  const section = collectSection(heading)
  section.forEach((el) => el.classList.toggle("ch-hidden", collapsed))
  heading.classList.toggle("ch-collapsed", collapsed)
  if (persist) {
    try {
      if (collapsed) localStorage.setItem(storeKey(heading), "1")
      else localStorage.removeItem(storeKey(heading))
    } catch {}
  }
}

function setupCollapsibleHeaders() {
  const article = document.querySelector("article")
  if (!article) return
  const headings = article.querySelectorAll("h1, h2, h3, h4, h5, h6")
  headings.forEach((heading) => {
    if (heading.querySelector(".ch-toggle")) return // 已处理
    // 空标题(无内容可折叠)不加 toggle
    if (collectSection(heading).length === 0) return

    const toggle = document.createElement("span")
    toggle.className = "ch-toggle"
    toggle.setAttribute("aria-label", "折叠/展开")
    toggle.setAttribute("role", "button")
    heading.insertBefore(toggle, heading.firstChild)
    heading.classList.add("ch-heading")

    const onToggle = (e: Event) => {
      // 点标题里的锚点链接不触发折叠
      if ((e.target as Element).closest("a") && e.target !== toggle) return
      const nowCollapsed = !heading.classList.contains("ch-collapsed")
      setCollapsed(heading, nowCollapsed)
    }
    heading.addEventListener("click", onToggle)
    window.addCleanup?.(() => heading.removeEventListener("click", onToggle))

    // 恢复上次折叠状态
    try {
      if (localStorage.getItem(storeKey(heading)) === "1") setCollapsed(heading, true, false)
    } catch {}
  })
}

document.addEventListener("nav", setupCollapsibleHeaders)
