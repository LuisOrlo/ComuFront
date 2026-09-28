/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { createRoot } from "react-dom/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Paleta de colores oficial del sistema Comunikate
const COLOR_PRIMARY: [number, number, number] = [15, 23, 42] // Slate-900
const COLOR_ACCENT: [number, number, number] = [253, 118, 26] // Naranja corporativo #fd761a
const COLOR_BORDER: [number, number, number] = [226, 232, 240] // Slate-200
const COLOR_MUTED: [number, number, number] = [100, 116, 139] // Slate-500
const COLOR_BG_SUBTLE: [number, number, number] = [248, 250, 252] // Slate-50

const safeName = (value: string) =>
  (value || "reporte")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase()
const COLOR_SUCCESS: [number, number, number] = [16, 185, 129] // Emerald-500
const COLOR_SUCCESS_BG: [number, number, number] = [236, 253, 245] // Emerald-50
const COLOR_SUCCESS_BORDER: [number, number, number] = [167, 243, 208] // Emerald-200
const COLOR_HEADER_BG: [number, number, number] = [30, 41, 59] // Slate-800

const CAT_COLORS: Record<string, string> = {
  "Cursos": "#fd761a",
  "Talleres": "#0891b2",
  "Podcast": "#2563eb",
  "Cursos personalizados": "#d97706",
  "Alquiler de Aulas": "#4f46e5",
  "Radio": "#db2777",
  "Edición de Video": "#ea580c",
  "Alquiler de Equipos": "#e11d48",
  "Streaming": "#0d9488",
  "Producción Audiovisual": "#65a30d",
  "Asesorías": "#ca8a04",
  "Otros": "#64748b",
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "")
  const v = parseInt(clean, 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

const money = (value: unknown) =>
  `$${Number(value || 0).toLocaleString("es-EC", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const dateFull = () =>
  new Date().toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const dateShort = () =>
  new Date().toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

function fmtDate(d?: string | null): string {
  if (!d) return "—"
  try {
    return new Date(d.includes("T") ? d : d + "T00:00:00").toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
}

function formatConcepto(item: any): string {
  if (item.concepto && !/^\s*[—–-]?\s*0\s*$/.test(String(item.concepto))) {
    return String(item.concepto)
  }
  return item.es_personalizado ? "Curso personalizado" : "—"
}

interface PDFOptions {
  includeChart: boolean
  chartType: string
  includeKPIs: boolean
  includeTable: boolean
}

/**
 * Cabecera corporativa y caja de metadatos de filtros
 */
function drawHeader(pdf: jsPDF, filtros: any, totalRegistros: number): number {
  // 1. Barra superior corporativa (210mm ancho en A4 vertical)
  pdf.setFillColor(...COLOR_ACCENT)
  pdf.rect(0, 0, 210, 3.5, "F")

  // 2. Emblema visual de marca
  pdf.setFillColor(...COLOR_ACCENT)
  pdf.roundedRect(14, 8, 10, 10, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.text("K", 19, 14.8, { align: "center" })

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(13)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("COMUNIKATE", 27, 13)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("SISTEMA DE GESTIÓN Y FINANZAS", 27, 17.5)

  // Título y fecha a la derecha
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("REPORTE DE INGRESOS", 196, 12.5, { align: "right" })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text(`Fecha: ${dateFull()}`, 196, 17.5, { align: "right" })

  // Línea divisoria
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(14, 22.5, 196, 22.5)

  // 3. Caja de Filtros / Metadatos del Reporte
  let periodo = "Histórico Completo"
  if (filtros.fecha_desde && filtros.fecha_hasta) {
    periodo = `${fmtDate(filtros.fecha_desde)} – ${fmtDate(filtros.fecha_hasta)}`
  } else if (filtros.fecha_desde) {
    periodo = `Desde ${fmtDate(filtros.fecha_desde)}`
  } else if (filtros.fecha_hasta) {
    periodo = `Hasta ${fmtDate(filtros.fecha_hasta)}`
  }

  const items = [
    { label: "Período", value: periodo },
    { label: "Categoría", value: filtros.categoria || "Todas" },
    { label: "Método de Pago", value: filtros.metodo_pago || "Todos" },
    { label: "Registros", value: `${totalRegistros} transacciones` },
  ]

  const y = 26
  const totalW = 182
  const boxH = 13.5
  const colW = totalW / items.length

  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(14, y, totalW, boxH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14, y, totalW, boxH, 2, 2, "S")

  items.forEach((item, index) => {
    const colX = 14 + index * colW + 3.5

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(item.label.toUpperCase(), colX, y + 5)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(7.5)
    pdf.setTextColor(...COLOR_PRIMARY)
    const valText = item.value || "—"
    const maxTextW = colW - 7
    let displayVal = valText
    while (displayVal.length > 3 && pdf.getTextWidth(displayVal) > maxTextW) {
      displayVal = displayVal.slice(0, -2) + "…"
    }
    pdf.text(displayVal, colX, y + 10)
  })

  return y + boxH + 4
}

/**
 * 4 Tarjetas de KPIs adaptadas al ancho vertical 182mm
 */
function drawKPICards(pdf: jsPDF, y: number, totales: any): number {
  const cardW = 43
  const cardH = 16
  const gap = 3.33
  const startX = 14

  const totalNum = Number(totales.total || 0)
  const cursosNum = Number(totales.cursos || 0)
  const serviciosNum = Number(totales.servicios || 0)
  const talleresNum = Number(totales.talleres || 0)

  const kpis = [
    {
      label: "TOTAL GENERAL",
      value: money(totalNum),
      sub: "100% ingresos",
      bg: COLOR_BG_SUBTLE,
      border: COLOR_BORDER,
      color: COLOR_PRIMARY,
    },
    {
      label: "CURSOS",
      value: money(cursosNum),
      sub: totalNum > 0 ? `${Math.round((cursosNum / totalNum) * 100)}% del total` : "",
      bg: [255, 247, 237] as [number, number, number],
      border: [254, 215, 170] as [number, number, number],
      color: COLOR_ACCENT,
    },
    {
      label: "SERVICIOS",
      value: money(serviciosNum),
      sub: totalNum > 0 ? `${Math.round((serviciosNum / totalNum) * 100)}% del total` : "",
      bg: COLOR_SUCCESS_BG,
      border: COLOR_SUCCESS_BORDER,
      color: COLOR_SUCCESS,
    },
    {
      label: "TALLERES",
      value: money(talleresNum),
      sub: totalNum > 0 ? `${Math.round((talleresNum / totalNum) * 100)}% del total` : "",
      bg: [236, 254, 255] as [number, number, number],
      border: [165, 243, 252] as [number, number, number],
      color: [8, 145, 178] as [number, number, number],
    },
  ]

  kpis.forEach((k, idx) => {
    const cx = startX + idx * (cardW + gap)

    pdf.setFillColor(...k.bg)
    pdf.roundedRect(cx, y, cardW, cardH, 2, 2, "F")
    pdf.setDrawColor(...k.border)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(cx, y, cardW, cardH, 2, 2, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(k.label, cx + 3.5, y + 4.8)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9.5)
    pdf.setTextColor(...k.color)
    pdf.text(k.value, cx + 3.5, y + 10.5)

    if (k.sub) {
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(6)
      pdf.setTextColor(...COLOR_MUTED)
      pdf.text(k.sub, cx + 3.5, y + 14.2)
    }
  })

  return y + cardH + 5
}

/**
 * Captura gráfica optimizada con paleta institucional
 */
async function captureChart(type: string, data: any[]): Promise<string | null> {
  if (!data?.length) return null
  const div = document.createElement("div")
  div.style.cssText =
    "position:fixed;left:-9999px;top:0;width:750px;height:280px;background:white;padding:12px;border-radius:12px;"
  document.body.appendChild(div)
  let root: ReturnType<typeof createRoot> | null = null

  try {
    const { default: html2canvas } = await import("html2canvas-pro")
    const PIE_COLORS = [
      "#fd761a",
      "#0891b2",
      "#10b981",
      "#d97706",
      "#2563eb",
      "#db2777",
      "#4f46e5",
      "#64748b",
    ]

    root = createRoot(div)
    await new Promise<void>((resolve) => {
      const chartEl = React.createElement(
        React.Fragment,
        null,
        React.createElement(
          ResponsiveContainer as any,
          { width: "100%", height: "100%" } as any,
          type === "pie" && data.some((d: any) => d.value)
            ? React.createElement(
                PieChart as any,
                null,
                React.createElement(
                  Pie as any,
                  {
                    data,
                    dataKey: "value",
                    nameKey: "name",
                    cx: "50%",
                    cy: "50%",
                    outerRadius: 95,
                    label: ({ name, value }: any) =>
                      `${name}: $${Number(value || 0).toLocaleString()}`,
                  } as any,
                  data.map((_: any, i: number) =>
                    React.createElement(Cell as any, {
                      key: i,
                      fill: PIE_COLORS[i % PIE_COLORS.length],
                    })
                  )
                ),
                React.createElement(Tooltip as any)
              )
            : React.createElement(
                BarChart as any,
                { data: data.map((d: any) => ({ ...d, mes: d.mes?.substring(5) })) } as any,
                React.createElement(XAxis as any, {
                  dataKey: type === "bar_h" ? "name" : "mes",
                  tick: { fontSize: 10, fill: "#64748b" },
                }),
                React.createElement(YAxis as any, {
                  type: type === "bar_h" ? "category" : "number",
                  tick: { fontSize: 10, fill: "#64748b" },
                  width: type === "bar_h" ? 80 : undefined,
                }),
                React.createElement(Tooltip as any),
                React.createElement(Bar as any, {
                  dataKey: type === "bar_h" ? "value" : "total",
                  fill: "#fd761a",
                  radius: [4, 4, 0, 0],
                })
              )
        )
      )
      root!.render(chartEl as any)
      resolve()
    })

    await new Promise((r) => setTimeout(r, 500))
    const canvas = await html2canvas(div.firstChild as HTMLElement, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    })
    return canvas.toDataURL("image/png")
  } catch {
    return null
  } finally {
    root?.unmount()
    document.body.removeChild(div)
  }
}

/**
 * Función principal generadora del Reporte de Ingresos en formato PDF
 */
export async function generarIngresosPDF(
  data: any[],
  totales: any,
  grafico: any[],
  graficoCategorias: any[],
  filtros: any,
  options: PDFOptions
) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  let currentY = drawHeader(pdf, filtros, data.length)

  // 1. Resumen de KPIs
  if (options.includeKPIs) {
    currentY = drawKPICards(pdf, currentY, totales)
  }

  // 2. Gráfico estadístico
  if (options.includeChart) {
    let chartData = grafico
    if (options.chartType === "pie" || options.chartType === "bar_h") {
      chartData = graficoCategorias?.length ? graficoCategorias : grafico
    }

    const img = await captureChart(options.chartType, chartData)
    if (img) {
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(8)
      pdf.setTextColor(...COLOR_PRIMARY)
      pdf.text("DISTRIBUCIÓN GRÁFICA DE INGRESOS", 14, currentY + 1)

      pdf.addImage(img, "PNG", 14, currentY + 3, 182, 58)
      currentY += 66
    }
  }

  // 3. Tabla detallada con jspdf-autotable
  if (options.includeTable && data.length > 0) {
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    pdf.setTextColor(...COLOR_PRIMARY)
    pdf.text("DETALLE DE TRANSACCIONES Y PAGOS", 14, currentY + 1.5)

    const rows = data.map((item: any, i: number) => {
      return [
        i + 1,
        fmtDate(item.fecha_pago),
        formatConcepto(item),
        item.estudiante_nombre || item.cliente_nombre || "—",
        item.categoria || "Servicio",
        item.metodo_pago || "Transferencia",
        money(item.monto),
      ]
    })

    const totalGeneral = data.reduce((s: number, r: any) => s + Number(r.monto || 0), 0)

    autoTable(pdf, {
      startY: currentY + 3.5,
      head: [
        [
          "N°",
          "Fecha",
          "Concepto",
          "Estudiante / Cliente",
          "Categoría",
          "Método",
          "Monto",
        ],
      ],
      body: rows,
      foot: [
        [
          "",
          "TOTAL INGRESOS REGISTRADOS",
          "",
          "",
          "",
          `${data.length} pagos`,
          money(totalGeneral),
        ],
      ],
      theme: "grid",
      margin: { left: 14, right: 14, top: 14, bottom: 22 },
      styles: {
        fontSize: 7.2,
        cellPadding: 2,
        textColor: COLOR_PRIMARY,
        lineColor: COLOR_BORDER,
        lineWidth: 0.15,
        font: "helvetica",
      },
      headStyles: {
        fillColor: COLOR_HEADER_BG,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.8,
        halign: "center",
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: COLOR_PRIMARY,
        fontStyle: "bold",
        fontSize: 8,
        lineColor: [203, 213, 225],
        lineWidth: 0.25,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: "auto", halign: "left" },
        3: { cellWidth: 38, halign: "left" },
        4: { cellWidth: 30, halign: "center" },
        5: { cellWidth: 26, halign: "center" },
        6: { cellWidth: 26, halign: "right" },
      },
      alternateRowStyles: {
        fillColor: COLOR_BG_SUBTLE,
      },
      didParseCell: (dataCell) => {
        // Formatear categoría y monto en el cuerpo
        if (dataCell.section === "body") {
          if (dataCell.column.index === 6) {
            dataCell.cell.styles.textColor = COLOR_SUCCESS
            dataCell.cell.styles.fontStyle = "bold"
          } else if (dataCell.column.index === 4) {
            const cat = String(dataCell.cell.raw || "")
            const hexColor = CAT_COLORS[cat] || "#64748b"
            dataCell.cell.styles.textColor = hexToRgb(hexColor)
            dataCell.cell.styles.fontStyle = "bold"
          }
        } else if (dataCell.section === "foot") {
          if (dataCell.column.index === 6) {
            dataCell.cell.styles.textColor = COLOR_SUCCESS
            dataCell.cell.styles.fontSize = 8.5
          }
        }
      },
    })
  }

  // 4. Pie de página en todas las páginas generadas
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(...COLOR_BORDER)
    pdf.setLineWidth(0.3)
    pdf.line(14, 285, 196, 285)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(
      `COMUNIKATE · Reporte de Ingresos Financieros · Confidencial · ${dateShort()}`,
      14,
      289.5
    )
    pdf.text(`Página ${page} de ${pages}`, 196, 289.5, { align: "right" })
  }

  pdf.save(`ingresos-${filtros.fecha_desde || safeName(dateShort())}.pdf`)
}
