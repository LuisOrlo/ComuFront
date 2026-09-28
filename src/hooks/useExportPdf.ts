/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EstadisticasResponse } from "@/types/estadisticas"

// Paleta de colores oficial del sistema Comunikate
const COLOR_PRIMARY: [number, number, number] = [15, 23, 42] // Slate-900
const COLOR_ACCENT: [number, number, number] = [253, 118, 26] // Naranja corporativo #fd761a
const COLOR_BORDER: [number, number, number] = [226, 232, 240] // Slate-200
const COLOR_MUTED: [number, number, number] = [100, 116, 139] // Slate-500
const COLOR_BG_SUBTLE: [number, number, number] = [248, 250, 252] // Slate-50
const COLOR_SUCCESS: [number, number, number] = [16, 185, 129] // Emerald-500
const COLOR_SUCCESS_BG: [number, number, number] = [236, 253, 245] // Emerald-50
const COLOR_SUCCESS_BORDER: [number, number, number] = [167, 243, 208] // Emerald-200
const COLOR_DANGER: [number, number, number] = [225, 29, 72] // Rose-600
const COLOR_DANGER_BG: [number, number, number] = [255, 241, 242] // Rose-50
const COLOR_DANGER_BORDER: [number, number, number] = [254, 205, 211] // Rose-200
const COLOR_HEADER_BG: [number, number, number] = [30, 41, 59] // Slate-800

const money = (value: number | string | null | undefined) =>
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

const getNextY = (pdf: any, fallback = 45): number => {
  return pdf.lastAutoTable?.finalY ?? fallback
}

/**
 * Genera el informe ejecutivo de estadísticas en formato PDF corporativo
 */
export async function exportarEstadisticasPDF(
  data: EstadisticasResponse
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const periodStr = `${data.periodo.desde} al ${data.periodo.hasta}`

  // 1. Barra superior corporativa (210mm ancho en vertical)
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

  // Título a la derecha
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("INFORME EJECUTIVO DE ESTADÍSTICAS", 196, 12.5, { align: "right" })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text(`Fecha: ${dateFull()}`, 196, 17.5, { align: "right" })

  // Línea divisoria
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(14, 22.5, 196, 22.5)

  // 3. Ficha de Metadatos y Período
  const infoY = 26
  const totalW = 182
  const boxH = 13.5
  const metaItems = [
    { label: "Período Analizado", value: periodStr },
    {
      label: "Matrículas del Período",
      value: `${data.metricas.estudiantes_matriculados} alumnos`,
    },
    { label: "Margen Neto", value: `${data.metricas.margen_neto}%` },
    {
      label: "Estado Financiero",
      value: data.metricas.balance >= 0 ? "Superávit Positivo" : "Déficit Contable",
    },
  ]
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

  // 4. Tarjetas de Resumen Bento KPIs
  const cardsY = infoY + boxH + 4
  const cardW = 43
  const cardH = 16
  const gap = 3.33
  const startX = 14

  const isPositivo = data.metricas.balance >= 0

  const kpis = [
    {
      label: "INGRESOS COBRADOS",
      value: money(data.metricas.ingresos),
      sub: "Total recaudado",
      bg: COLOR_SUCCESS_BG,
      border: COLOR_SUCCESS_BORDER,
      color: COLOR_SUCCESS,
    },
    {
      label: "EGRESOS REGISTRADOS",
      value: money(data.metricas.egresos),
      sub: "Gastos operativos",
      bg: COLOR_DANGER_BG,
      border: COLOR_DANGER_BORDER,
      color: COLOR_DANGER,
    },
    {
      label: "RESULTADO NETO",
      value: money(data.metricas.balance),
      sub: isPositivo ? "Ganancia neta" : "Déficit",
      bg: isPositivo ? COLOR_BG_SUBTLE : COLOR_DANGER_BG,
      border: isPositivo ? COLOR_BORDER : COLOR_DANGER_BORDER,
      color: isPositivo ? COLOR_PRIMARY : COLOR_DANGER,
    },
    {
      label: "MARGEN NETO",
      value: `${data.metricas.margen_neto}%`,
      sub: `${data.metricas.estudiantes_matriculados} matrículas`,
      bg: [255, 247, 237] as [number, number, number],
      border: [254, 215, 170] as [number, number, number],
      color: COLOR_ACCENT,
    },
  ]

  kpis.forEach((k, idx) => {
    const cx = startX + idx * (cardW + gap)

    pdf.setFillColor(...k.bg)
    pdf.roundedRect(cx, cardsY, cardW, cardH, 2, 2, "F")
    pdf.setDrawColor(...k.border)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(cx, cardsY, cardW, cardH, 2, 2, "S")

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(k.label, cx + 3.5, cardsY + 4.8)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.setTextColor(...k.color)
    pdf.text(k.value, cx + 3.5, cardsY + 10.5)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(6)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(k.sub, cx + 3.5, cardsY + 14.2)
  })

  // Función para títulos de sección con gestión de salto de página
  const drawSection = (title: string, description?: string): number => {
    const lastY = getNextY(pdf, cardsY + cardH + 4)
    let top = lastY + 8

    // Si queda poco espacio para la tabla, saltar de página
    if (top > 245) {
      pdf.addPage()
      top = 16
    }

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8.5)
    pdf.setTextColor(...COLOR_PRIMARY)
    pdf.text(title.toUpperCase(), 14, top)

    if (description) {
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(6.8)
      pdf.setTextColor(...COLOR_MUTED)
      pdf.text(description, 14, top + 4)
      return top + 6.5
    }
    return top + 3.5
  }

  const tableBaseStyles = {
    theme: "grid" as const,
    margin: { left: 14, right: 14, top: 14, bottom: 20 },
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
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold" as const,
      fontSize: 7.5,
      halign: "center" as const,
    },
    alternateRowStyles: {
      fillColor: COLOR_BG_SUBTLE,
    },
  }

  // 5. SECCIÓN: Evolución de Ingresos y Egresos (Mes a Mes)
  if (data.ingresos_vs_egresos.length > 0) {
    const sY = drawSection(
      "Evolución Mensual: Ingresos vs Egresos",
      "Movimientos financieros consolidados mes a mes durante el período analizado."
    )
    autoTable(pdf, {
      ...tableBaseStyles,
      startY: sY,
      head: [["Mes", "Ingresos Cobrados", "Egresos Registrados", "Resultado Neto"]],
      body: data.ingresos_vs_egresos.map((item) => {
        const neto = item.ingresos - item.egresos
        return [
          item.mes,
          money(item.ingresos),
          money(item.egresos),
          money(neto),
        ]
      }),
      columnStyles: {
        0: { cellWidth: 32, halign: "center" },
        1: { cellWidth: 50, halign: "right" },
        2: { cellWidth: 50, halign: "right" },
        3: { cellWidth: 50, halign: "right" },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === "body" && dataCell.column.index === 3) {
          const raw = String(dataCell.cell.raw || "")
          if (raw.startsWith("$-") || raw.startsWith("-")) {
            dataCell.cell.styles.textColor = COLOR_DANGER
            dataCell.cell.styles.fontStyle = "bold"
          } else {
            dataCell.cell.styles.textColor = COLOR_SUCCESS
            dataCell.cell.styles.fontStyle = "bold"
          }
        }
      },
    })
  }

  // 6. SECCIÓN: Origen de los Ingresos por Categoría / Línea de Negocio
  if (data.distribucion_categorias.length > 0) {
    const sY = drawSection(
      "Distribución de Ingresos por Línea de Negocio",
      "Participación porcentual y volumen cobrado por cada área comercial."
    )
    autoTable(pdf, {
      ...tableBaseStyles,
      startY: sY,
      head: [["Línea de Negocio", "Ingreso Cobrado", "Participación %"]],
      body: data.distribucion_categorias.map((item) => [
        item.name,
        money(item.value),
        `${item.porcentaje}%`,
      ]),
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 55, halign: "right" },
        2: { cellWidth: 40, halign: "center" },
      },
      didParseCell: (dataCell) => {
        if (dataCell.section === "body" && dataCell.column.index === 2) {
          dataCell.cell.styles.fontStyle = "bold"
          dataCell.cell.styles.textColor = COLOR_ACCENT
        }
      },
    })
  }

  // 7. SECCIÓN: Rendimiento Académico por Catálogo
  if (data.catalogos_top.length > 0) {
    const sY = drawSection(
      "Rendimiento Académico por Catálogo",
      "Desempeño de ofertas, matrículas, ocupación de aulas e ingresos generados."
    )
    autoTable(pdf, {
      ...tableBaseStyles,
      startY: sY,
      head: [["Catálogo", "Ofertas", "Estudiantes", "Ocupación", "Aprobación", "Ingresos"]],
      body: data.catalogos_top.map((item) => [
        item.nombre,
        item.ofertas,
        item.estudiantes,
        `${item.ocupacion_pct}%`,
        `${item.aprobacion_pct}%`,
        money(item.ingreso),
      ]),
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 24, halign: "center" },
        3: { cellWidth: 24, halign: "center" },
        4: { cellWidth: 24, halign: "center" },
        5: { cellWidth: 32, halign: "right" },
      },
    })
  }

  // 8. SECCIÓN: Métodos de Pago
  if (data.metodo_pago.length > 0) {
    const sY = drawSection(
      "Canales y Métodos de Pago Utilizados",
      "Distribución de transacciones recibidas según la forma de pago."
    )
    autoTable(pdf, {
      ...tableBaseStyles,
      startY: sY,
      head: [["Método de Pago", "Total Recaudado"]],
      body: data.metodo_pago.map((item) => [
        item.name.charAt(0).toUpperCase() + item.name.slice(1),
        money(item.value),
      ]),
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 60, halign: "right" },
      },
    })
  }

  // 9. SECCIÓN: Actividad y Facturación de Servicios
  if (data.actividad_servicios.length > 0) {
    const sY = drawSection(
      "Actividad Comercial de Servicios Especiales",
      "Volumen de reservas atendidas e ingresos generados por alquileres y servicios."
    )
    autoTable(pdf, {
      ...tableBaseStyles,
      startY: sY,
      head: [["Servicio", "Servicios Registrados", "Ingresos Cobrados"]],
      body: data.actividad_servicios.map((item) => [
        item.tipo,
        item.cantidad > 0 ? `${item.cantidad} servicios` : "Sin actividad en el período",
        money(item.ingresos),
      ]),
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 55, halign: "center" },
        2: { cellWidth: 50, halign: "right" },
      },
    })
  }

  // 10. SECCIÓN: Estado de Cartera y Cobranza
  const sY = drawSection(
    "Monitoreo de Cobranza y Cartera Vencida",
    "Estado de morosidad y cuentas pendientes de cobro a estudiantes."
  )
  autoTable(pdf, {
    ...tableBaseStyles,
    startY: sY,
    head: [["Estado de Cartera", "Estudiantes"]],
    body: [
      ["Estudiantes con al menos un módulo/pago pendiente", `${data.cobranza.deben_al_menos_un_pago} estudiantes`],
      ["Estudiantes con la totalidad de pagos pendientes", `${data.cobranza.deben_todos_los_pagos} estudiantes`],
    ],
    columnStyles: {
      0: { cellWidth: "auto", halign: "left" },
      1: { cellWidth: 55, halign: "center" },
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.index === 1) {
        dataCell.cell.styles.fontStyle = "bold"
        dataCell.cell.styles.textColor = COLOR_DANGER
      }
    },
  })

  // 11. Pie de página en todas las páginas generadas
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
      `COMUNIKATE · Informe Ejecutivo de Estadísticas · Período: ${periodStr} · ${dateShort()}`,
      14,
      289.5
    )
    pdf.text(`Página ${page} de ${pages}`, 196, 289.5, { align: "right" })
  }

  pdf.save(`estadisticas_${data.periodo.desde}_a_${data.periodo.hasta}.pdf`)
}
