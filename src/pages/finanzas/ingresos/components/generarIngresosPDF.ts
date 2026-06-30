/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas-pro"
import { COLORS } from "@/lib/constants"

const ACCENT = COLORS.ACCENT || "#7c3aed"
const LIGHT_GRAY: [number, number, number] = [245, 245, 245]
const ACCENT_RGB = hexToRgb(ACCENT)

const CAT_COLORS: Record<string, string> = {
  "Cursos": "#059669", "Talleres": "#0891b2", "Podcast": "#4f46e5",
  "Alquiler de Aulas": "#7c3aed", "Radio": "#a21caf", "Edición de Video": "#d97706",
  "Alquiler de Equipos": "#dc2626", "Streaming": "#0d9488",
  "Producción Audiovisual": "#65a30d", "Asesorías": "#ca8a04", "Otros": "#6b7280",
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace("#", ""), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}

interface PDFOptions {
  includeChart: boolean
  chartType: string
  includeKPIs: boolean
  includeTable: boolean
}

function drawHeader(pdf: jsPDF, filtros: any) {
  const [r, g, b] = ACCENT_RGB
  pdf.setFillColor(r, g, b)
  pdf.rect(0, 0, 210, 28, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.text("COMUNIKATE ACADEMY", 14, 12)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  pdf.text("Sistema de Gestión Académica", 14, 19)

  const hoy = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" })
  const tim = Date.now().toString(36).toUpperCase()
  pdf.setFillColor(240, 240, 240)
  pdf.rect(0, 28, 210, 14, "F")
  pdf.setTextColor(60, 60, 60)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")

  let periodo = "Sin filtro de fecha"
  if (filtros.fecha_desde && filtros.fecha_hasta) {
    periodo = `${fmtDate(filtros.fecha_desde)} — ${fmtDate(filtros.fecha_hasta)}`
  } else if (filtros.fecha_desde) {
    periodo = `Desde ${fmtDate(filtros.fecha_desde)}`
  }

  pdf.text(`REPORTE DE INGRESOS`, 14, 35)
  pdf.setFont("helvetica", "normal")
  pdf.text(`Período: ${periodo}`, 80, 35)
  pdf.text(`#ING-${tim}`, 14, 42)
  pdf.text(`Generado: ${hoy}`, 80, 42)

  if (filtros.categoria) pdf.text(`Categoría: ${filtros.categoria}`, 130, 35)
  if (filtros.metodo_pago) pdf.text(`Método: ${filtros.metodo_pago}`, 130, 42)
}

function drawKPIBox(pdf: jsPDF, x: number, y: number, w: number, label: string, value: string, color: string, pct?: string) {
  const [cr, cg, cb] = hexToRgb(color)
  pdf.setDrawColor(cr, cg, cb)
  pdf.setLineWidth(1.5)
  pdf.line(x, y, x, y + 18)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(x + 2, y, w - 2, 18, 2, 2, "F")

  pdf.setTextColor(cr, cg, cb)
  pdf.setFontSize(7)
  pdf.setFont("helvetica", "bold")
  pdf.text(label.toUpperCase(), x + 6, y + 5)
  pdf.setFontSize(14)
  pdf.setTextColor(30, 30, 30)
  pdf.text(value, x + 6, y + 14)
  if (pct) {
    pdf.setFontSize(8)
    pdf.setTextColor(cr, cg, cb)
    pdf.text(pct, x + 6 + pdf.getTextWidth(value) + 3, y + 14)
  }
}

async function captureChart(type: string, data: any[]): Promise<string | null> {
  if (!data?.length) return null
  const div = document.createElement("div")
  div.style.cssText = "position:fixed;left:-9999px;top:0;width:700px;height:300px;background:white;padding:10px"
  document.body.appendChild(div)

  try {
    const { default: React } = await import("react")
    const { createRoot } = await import("react-dom/client")
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } = await import("recharts")
    const PIE_COLORS = ["#059669", "#4f46e5", "#0891b2", "#d97706", "#dc2626"]

    const root = createRoot(div)
    await new Promise<void>(resolve => {
      const chartEl = React.createElement(
        React.Fragment, null,
        React.createElement(ResponsiveContainer as any, { width: "100%", height: "100%" } as any,
          type === "pie" && data.some((d: any) => d.value)
            ? React.createElement(PieChart as any, null,
                React.createElement(Pie as any, { data, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 100, label: ({ name, value }: any) => `${name}: $${value}` } as any,
                  data.map((_: any, i: number) => React.createElement(Cell as any, { key: i, fill: PIE_COLORS[i % PIE_COLORS.length] }))),
                React.createElement(Tooltip as any))
            : React.createElement(BarChart as any, { data: data.map((d: any) => ({ ...d, mes: d.mes?.substring(5) })) } as any,
                React.createElement(XAxis as any, { dataKey: type === "bar_h" ? "name" : "mes", tick: { fontSize: 10 } }),
                React.createElement(YAxis as any, { type: type === "bar_h" ? "category" : "number", tick: { fontSize: 10 }, width: type === "bar_h" ? 80 : undefined }),
                React.createElement(Tooltip as any),
                React.createElement(Bar as any, { dataKey: type === "bar_h" ? "value" : "total", fill: ACCENT, radius: [4, 4, 0, 0] }))))
      root.render(chartEl as any)
      resolve()
    })

    await new Promise(r => setTimeout(r, 500))
    const canvas = await html2canvas(div.firstChild as HTMLElement, { scale: 2, backgroundColor: "#ffffff", logging: false })
    return canvas.toDataURL("image/png")
  } catch { return null }
  finally { document.body.removeChild(div) }
}

export async function generarIngresosPDF(
  data: any[], totales: any, grafico: any[], graficoCategorias: any[],
  filtros: any, options: PDFOptions
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  let page = 1

  const addFooter = () => {
    pdf.setTextColor(160, 160, 160)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Generado por Sistema Comunikate — Página ${page}`, 105, 290, { align: "center" })
  }

  drawHeader(pdf, filtros)

  let y = 48

  if (options.includeKPIs) {
    const kpiData = [
      { label: "Total", value: `$${(totales.total || 0).toLocaleString()}`, color: ACCENT, pct: "" },
      { label: "Cursos", value: `$${(totales.cursos || 0).toLocaleString()}`, color: "#059669", pct: totales.total ? `${Math.round(totales.cursos / totales.total * 100)}%` : "" },
      { label: "Servicios", value: `$${(totales.servicios || 0).toLocaleString()}`, color: "#7c3aed", pct: totales.total ? `${Math.round(totales.servicios / totales.total * 100)}%` : "" },
      { label: "Talleres", value: `$${(totales.talleres || 0).toLocaleString()}`, color: "#0891b2", pct: totales.total ? `${Math.round((totales.talleres || 0) / totales.total * 100)}%` : "" },
    ]
    const w = 42
    kpiData.forEach((k, i) => drawKPIBox(pdf, 14 + i * (w + 3), y, w, k.label, k.value, k.color, k.pct))
    y += 24
  }

  if (options.includeChart) {
    let chartData = grafico
    if (options.chartType === "pie") chartData = graficoCategorias?.length ? graficoCategorias : grafico
    else if (options.chartType === "bar_h") chartData = graficoCategorias?.length ? graficoCategorias : grafico

    const img = await captureChart(options.chartType, chartData)
    if (img) {
      pdf.addImage(img, "PNG", 14, y, 182, 70)
      y += 76
    }
  }

  if (options.includeTable && data.length > 0) {
    const cols = [
      { h: "Fecha", w: 22, a: "left" as const },
      { h: "Concepto", w: 40, a: "left" as const },
      { h: "Estudiante", w: 40, a: "left" as const },
      { h: "Categoría", w: 32, a: "left" as const },
      { h: "Método", w: 20, a: "left" as const },
      { h: "Monto", w: 28, a: "right" as const },
    ]
    const thY = y
    const rowH = 6

    pdf.setFillColor(40, 40, 40)
    pdf.rect(14, thY - 4, 182, rowH + 4, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(7)
    pdf.setFont("helvetica", "bold")
    let cx = 16
    cols.forEach(c => { pdf.text(c.h, c.a === "right" ? cx + c.w - 2 : cx, thY); cx += c.w })
    y = thY + rowH + 2

    const pageH = 270

    data.forEach((item, i) => {
      if (y + rowH > pageH) { addFooter(); pdf.addPage(); page++; drawHeader(pdf, filtros); y = 48 }
      const isEven = i % 2 === 0
      pdf.setFillColor(...(isEven ? [255, 255, 255] as [number, number, number] : LIGHT_GRAY))
      pdf.rect(14, y - 3, 182, rowH + 2, "F")
      pdf.setTextColor(30, 30, 30)
      pdf.setFontSize(6.5)
      pdf.setFont("helvetica", "normal")

      const rowData = [
        fmtDate(item.fecha_pago),
        (item.concepto || "—").substring(0, 25),
        (item.estudiante_nombre || "—").substring(0, 25),
        item.categoria || "—",
        item.metodo_pago || "—",
        `$${Number(item.monto || 0).toLocaleString()}`,
      ]

      cx = 16
      rowData.forEach((val, ci) => {
        if (ci === 3) {
          const catColor = CAT_COLORS[item.categoria] || ACCENT
          const [cr, cg, cb] = hexToRgb(catColor)
          pdf.setFillColor(cr, cg, cb)
          pdf.roundedRect(cx, y - 2, Math.min(pdf.getTextWidth(val) + 6, cols[ci].w - 2), rowH, 2, 2, "F")
          pdf.setTextColor(255, 255, 255)
          pdf.text(val.substring(0, 14), cx + 3, y + 2)
        } else if (ci === 5) {
          pdf.setTextColor(5, 150, 105)
          pdf.text(val, cx + cols[ci].w - 2, y + 2, { align: "right" })
        } else {
          pdf.setTextColor(30, 30, 30)
          pdf.text(val, cx, y + 2)
        }
        cx += cols[ci].w
      })
      y += rowH + 1
    })

    const total = data.reduce((s: number, r: any) => s + Number(r.monto || 0), 0)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(14, y - 1, 182, rowH + 2, "F")
    pdf.setTextColor(30, 30, 30)
    pdf.setFontSize(8)
    pdf.setFont("helvetica", "bold")
    pdf.text(`TOTAL (${data.length} registros)`, 16, y + 3.5)
    pdf.setTextColor(5, 150, 105)
    pdf.text(`$${total.toLocaleString()}`, 196, y + 3.5, { align: "right" })
    y += rowH + 4
  }

  addFooter()
  pdf.save(`ingresos-${filtros.fecha_desde || "reporte"}.pdf`)
}
