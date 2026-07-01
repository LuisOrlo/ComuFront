import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

export interface PDFOptions {
  title?: string
  subtitle?: string
  titleColor?: string
  viewType?: string
}

function oklchToRgb(oklch: string): string {
  const el = document.createElement('div')
  el.style.display = 'none'
  el.style.color = oklch
  document.body.appendChild(el)
  const rgb = getComputedStyle(el).color
  document.body.removeChild(el)
  return rgb
}

function parseRgb(rgbStr: string): [number, number, number] {
  const m = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
  return [0, 0, 0]
}

function resolveColor(color: string): [number, number, number] {
  const c = color.includes('oklch') ? oklchToRgb(color) : color
  return parseRgb(c)
}

function replaceOklchInElement(
  el: HTMLElement
): { el: HTMLElement; prop: string; old: string; priority: string }[] {
  const restore: { el: HTMLElement; prop: string; old: string; priority: string }[] = []
  const cs = getComputedStyle(el)

  const colorProps = [
    'color', 'background-color', 'background', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-top-color', 'border-right-color', 'border-bottom-color',
    'border-left-color', 'outline-color', 'outline',
    'text-decoration-color', 'text-decoration', 'column-rule-color',
    'box-shadow', 'text-shadow',
  ]

  for (const prop of colorProps) {
    const val = cs.getPropertyValue(prop)
    if (!val.includes('oklch')) continue

    const priority = cs.getPropertyPriority(prop)
    const old = el.style.getPropertyValue(prop)
    const oldPriority = el.style.getPropertyPriority(prop)

    const newVal = val.replace(/oklch\([^)]+\)/g, m => oklchToRgb(m))
    el.style.setProperty(prop, newVal, priority || undefined)
    restore.push({ el, prop, old, priority: oldPriority })
  }

  return restore
}

export const exportToPDF = async (
  elementId: string,
  fileName: string,
  options?: PDFOptions
) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const allRestore: { el: HTMLElement; prop: string; old: string; priority: string }[] = []
  const walker = document.createNodeIterator(element, NodeFilter.SHOW_ELEMENT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const htmlEl = node as HTMLElement
    const r = replaceOklchInElement(htmlEl)
    allRestore.push(...r)
  }

  const nowIndicatorStyle = document.createElement('style')
  nowIndicatorStyle.id = 'pdf-now-indicator-hide'
  nowIndicatorStyle.textContent = '.fc-now-indicator, .fc-now-indicator-arrow, .fc-now-indicator-line { display: none !important; }'
  document.head.appendChild(nowIndicatorStyle)

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4')

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 6
    let cursorY = margin

    const centerX = pageW / 2

    if (options?.title) {
      const [r, g, b] = options.titleColor
        ? resolveColor(options.titleColor)
        : [0, 0, 0]

      pdf.setFontSize(14)
      pdf.setTextColor(r, g, b)
      pdf.text(options.title, centerX, cursorY + 6, { align: 'center' })
      cursorY += 9
    }

    if (options?.subtitle) {
      const [r, g, b] = options.titleColor
        ? resolveColor(options.titleColor)
        : [80, 80, 80]

      pdf.setFontSize(9)
      pdf.setTextColor(r, g, b)
      pdf.text(options.subtitle, centerX, cursorY + 4, { align: 'center' })
      cursorY += 6
    }

    cursorY += 2

    const availableW = pageW - margin * 2
    const availableH = pageH - cursorY - margin

    const scale = options?.viewType === 'dayGridMonth'
      ? Math.min(availableW / canvas.width, availableH / canvas.height)
      : availableW / canvas.width

    const finalW = canvas.width * scale
    const finalH = canvas.height * scale
    const xOff = margin + (availableW - finalW) / 2
    const yOff = cursorY + (availableH - finalH) / 2

    pdf.addImage(imgData, 'PNG', xOff, Math.max(cursorY, yOff), finalW, finalH)
    pdf.save(`${fileName}.pdf`)
  } finally {
    nowIndicatorStyle.remove()
    for (const { el, prop, old, priority } of allRestore) {
      if (old === '') {
        el.style.removeProperty(prop)
      } else {
        el.style.setProperty(prop, old, priority || undefined)
      }
    }
  }
}
