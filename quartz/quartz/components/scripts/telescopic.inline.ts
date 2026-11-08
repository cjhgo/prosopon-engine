// 客户端:把 code.telescopic-source 渲染成可展开的 telescopic text。
// lib 是全局声明的经典脚本(无 export),放 /static/telescopic/,首次用到时动态加载一次。
let libPromise: Promise<void> | undefined

function loadLib(): Promise<void> {
  if (libPromise) return libPromise
  libPromise = new Promise<void>((resolve) => {
    if ((window as any).createTelescopicTextFromBulletedList) return resolve()
    // 样式(一次)
    if (!document.querySelector('link[data-telescopic-css]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "/static/telescopic/telescopic.css"
      link.setAttribute("data-telescopic-css", "1")
      document.head.appendChild(link)
    }
    // 库(一次)
    const s = document.createElement("script")
    s.src = "/static/telescopic/telescopic.js"
    s.onload = () => resolve()
    s.onerror = () => resolve()
    document.head.appendChild(s)
  })
  return libPromise
}

async function setupTelescopic() {
  const codes = document.querySelectorAll(
    "code.telescopic-source",
  ) as NodeListOf<HTMLElement>
  if (codes.length === 0) return
  await loadLib()
  const create = (window as any).createTelescopicTextFromBulletedList
  if (typeof create !== "function") return
  codes.forEach((code) => {
    if (code.dataset.ttDone === "1") return
    code.dataset.ttDone = "1"
    const pre = code.closest("pre") ?? code
    try {
      const node = create(code.textContent ?? "")
      pre.replaceWith(node)
    } catch (e) {
      console.error("[telescopic] render failed", e)
    }
  })
}

document.addEventListener("nav", setupTelescopic)
