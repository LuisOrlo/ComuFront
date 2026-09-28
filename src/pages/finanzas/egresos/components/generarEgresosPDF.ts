/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type AnyRecord = Record<string, any>

// Paleta de colores corporativa Comunikate
const COLOR_PRIMARY: [number, number, number] = [15, 23, 42] // Slate-900
const COLOR_ACCENT: [number, number, number] = [253, 118, 26] // Naranja corporativo #fd761a
const COLOR_BORDER: [number, number, number] = [226, 232, 240] // Slate-200
const COLOR_MUTED: [number, number, number] = [100, 116, 139] // Slate-500
const COLOR_BG_SUBTLE: [number, number, number] = [248, 250, 252] // Slate-50
const COLOR_DANGER: [number, number, number] = [225, 29, 72] // Rose-600
const COLOR_DANGER_BG: [number, number, number] = [255, 241, 242] // Rose-50
const COLOR_DANGER_BORDER: [number, number, number] = [254, 205, 211] // Rose-200
const COLOR_HEADER_BG: [number, number, number] = [30, 41, 59] // Slate-800

const CAT_COLORS: Record<string, string> = {
  "Personal": "#0284c7",
  "Nómina": "#0284c7",
  "Servicios": "#d97706",
  "Servicios Básicos": "#d97706",
  "Alquiler": "#6366f1",
  "Mantenimiento": "#0d9488",
  "Publicidad": "#ea580c",
  "Marketing": "#ea580c",
  "Equipos": "#e11d48",
  "Materiales": "#16a34a",
  "Suministros": "#16a34a",
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

export interface GenerarEgresosPDFProps {
  data: AnyRecord[]
  totales?: AnyRecord
  filtros?: AnyRecord
  categorias?: AnyRecord[]
}

/**
 * Genera el documento PDF corporativo para el módulo de Egresos
 */
export function generarEgresosPDF({
  data,
  totales = {},
  filtros = {},
}: GenerarEgresosPDFProps) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  // 1. Barra superior corporativa (210mm ancho)
  pdf.setFillColor(...COLOR_ACCENT)
  pdf.rect(0, 0, 210, 3.5, "F")

  // 2. Emblema visual de marca COMUNIKATE
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

  // Lado derecho: Título y fecha
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(10)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("REPORTE DE EGRESOS Y GASTOS", 196, 12.5, { align: "right" })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text(`Fecha: ${dateFull()}`, 196, 17.5, { align: "right" })

  // Línea divisoria
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(14, 22.5, 196, 22.5)

  // 3. Ficha de Metadatos y Filtros Aplicados
  let periodo = "Histórico Completo"
  if (filtros.fecha_desde && filtros.fecha_hasta) {
    periodo = `${fmtDate(filtros.fecha_desde)} – ${fmtDate(filtros.fecha_hasta)}`
  } else if (filtros.fecha_desde) {
    periodo = `Desde ${fmtDate(filtros.fecha_desde)}`
  } else if (filtros.fecha_hasta) {
    periodo = `Hasta ${fmtDate(filtros.fecha_hasta)}`
  }

  const metaItems = [
    { label: "Período", value: periodo },
    { label: "Categoría", value: filtros.categoria || "Todas" },
    { label: "Búsqueda", value: filtros.search || "Sin filtro" },
    { label: "Registros", value: `${data.length} egresos` },
  ]

  const infoY = 26
  const totalW = 182
  const boxH = 13.5
  const colW = totalW / metaItems.length

  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(14, infoY, totalW, boxH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14, infoY, totalW, boxH, 2, 2, "S")

  metaItems.forEach((item, index) => {
    const colX = 14 + index * colW + 3.5

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(item.label.toUpperCase(), colX, infoY + 5)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(7.5)
    pdf.setTextColor(...COLOR_PRIMARY)
    const valText = item.value || "—"
    const maxTextW = colW - 7
    let displayVal = valText
    while (displayVal.length > 3 && pdf.getTextWidth(displayVal) > maxTextW) {
      displayVal = displayVal.slice(0, -2) + "…"
    }
    pdf.text(displayVal, colX, infoY + 10)
  })

  // 4. Tarjetas de Resumen Financiero (KPIs)
  const cardsY = infoY + boxH + 4
  const cW = 58
  const cH = 15.5
  const gap = 4

  const totalNum = Number(
    totales.total ?? data.reduce((s: number, r: any) => s + Number(r.monto || 0), 0)
  )
  const personalNum = Number(totales.personal || 0)
  const serviciosNum = Number(totales.servicios || 0)

  // Tarjeta 1: Total Egresos
  pdf.setFillColor(...COLOR_DANGER_BG)
  pdf.roundedRect(14, cardsY, cW, cH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_DANGER_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14, cardsY, cW, cH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_DANGER)
  pdf.text("TOTAL EGRESOS", 18, cardsY + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(190, 18, 60)
  pdf.text(money(totalNum), 18, cardsY + 11.5)

  // Tarjeta 2: Gastos de Personal
  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(14 + cW + gap, cardsY, cW, cH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14 + cW + gap, cardsY, cW, cH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("PERSONAL / NÓMINA", 14 + cW + gap + 4, cardsY + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text(money(personalNum), 14 + cW + gap + 4, cardsY + 11.5)

  // Tarjeta 3: Servicios y Operativo
  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(14 + (cW + gap) * 2, cardsY, cW, cH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14 + (cW + gap) * 2, cardsY, cW, cH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("SERVICIOS Y OPERACIÓN", 14 + (cW + gap) * 2 + 4, cardsY + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text(money(serviciosNum), 14 + (cW + gap) * 2 + 4, cardsY + 11.5)

  // 5. Tabla Detallada con jspdf-autotable
  const tableStartY = cardsY + cH + 6

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("DETALLE DE EGRESOS REGISTRADOS", 14, tableStartY - 1.5)

  const rows = data.map((item: any, i: number) => {
    return [
      i + 1,
      fmtDate(item.fecha_pago),
      item.descripcion || "Sin descripción",
      item.categoria_nombre || item.categoria || "General",
      item.proveedor_beneficiario || "—",
      money(item.monto),
    ]
  })

  autoTable(pdf, {
    startY: tableStartY,
    head: [
      [
        "N°",
        "Fecha",
        "Descripción / Concepto",
        "Categoría",
        "Proveedor / Beneficiario",
        "Monto",
      ],
    ],
    body:
      rows.length > 0
        ? rows
        : [["—", "No se registran egresos con los filtros aplicados", "—", "—", "—", "—"]],
    foot: [
      [
        "",
        "TOTAL DE EGRESOS",
        "",
        "",
        `${data.length} egreso${data.length !== 1 ? "s" : ""}`,
        money(totalNum),
      ],
    ],
    theme: "grid",
    margin: { left: 14, right: 14, top: 14, bottom: 22 },
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
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
      1: { cellWidth: 24, halign: "center" },
      2: { cellWidth: "auto", halign: "left" },
      3: { cellWidth: 32, halign: "center" },
      4: { cellWidth: 38, halign: "left" },
      5: { cellWidth: 28, halign: "right" },
    },
    alternateRowStyles: {
      fillColor: COLOR_BG_SUBTLE,
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body") {
        if (dataCell.column.index === 5) {
          dataCell.cell.styles.textColor = COLOR_DANGER
          dataCell.cell.styles.fontStyle = "bold"
        } else if (dataCell.column.index === 3) {
          const cat = String(dataCell.cell.raw || "")
          const hex = CAT_COLORS[cat] || "#64748b"
          dataCell.cell.styles.textColor = hexToRgb(hex)
          dataCell.cell.styles.fontStyle = "bold"
        }
      } else if (dataCell.section === "foot") {
        if (dataCell.column.index === 5) {
          dataCell.cell.styles.textColor = COLOR_DANGER
          dataCell.cell.styles.fontSize = 8.5
        }
      }
    },
  })

  // 6. Pie de página en todas las páginas generadas
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
      `COMUNIKATE · Reporte de Egresos Contables · Confidencial · ${dateShort()}`,
      14,
      289.5
    )
    pdf.text(`Página ${page} de ${pages}`, 196, 289.5, { align: "right" })
  }

  const fileName = filtros.fecha_desde
    ? `egresos-${filtros.fecha_desde}.pdf`
    : `egresos-reporte.pdf`
  pdf.save(fileName)
}
