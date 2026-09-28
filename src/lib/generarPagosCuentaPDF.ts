/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type AnyRecord = Record<string, any>

// Paleta de colores oficial del sistema Comunikate
const COLOR_PRIMARY: [number, number, number] = [15, 23, 42] // Slate-900
const COLOR_SECONDARY: [number, number, number] = [51, 65, 85] // Slate-700
const COLOR_ACCENT: [number, number, number] = [253, 118, 26] // Naranja corporativo #fd761a
const COLOR_BORDER: [number, number, number] = [226, 232, 240] // Slate-200
const COLOR_MUTED: [number, number, number] = [100, 116, 139] // Slate-500
const COLOR_BG_SUBTLE: [number, number, number] = [248, 250, 252] // Slate-50
const COLOR_SUCCESS: [number, number, number] = [16, 185, 129] // Emerald-500
const COLOR_SUCCESS_BG: [number, number, number] = [236, 253, 245] // Emerald-50
const COLOR_SUCCESS_BORDER: [number, number, number] = [167, 243, 208] // Emerald-200
const COLOR_DANGER: [number, number, number] = [239, 68, 68] // Rose-500
const COLOR_DANGER_BG: [number, number, number] = [255, 241, 242] // Rose-50
const COLOR_DANGER_BORDER: [number, number, number] = [254, 205, 211] // Rose-200
const COLOR_AMBER: [number, number, number] = [245, 158, 11] // Amber-500
const COLOR_HEADER_BG: [number, number, number] = [30, 41, 59] // Slate-800

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

const safeName = (value: string) =>
  (value || "documento")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase()

const toArray = (val: any): any[] => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === "object") return Object.values(val)
  return []
}

/**
 * Encabezado corporativo horizontal para cursos y talleres
 */
function drawHeaderHorizontal(
  pdf: jsPDF,
  reportTitle: string,
  categoryLabel: string,
  entityName: string
) {
  // Barra superior naranja (297mm ancho)
  pdf.setFillColor(...COLOR_ACCENT)
  pdf.rect(0, 0, 297, 3.5, "F")

  // Emblema visual de marca COMUNIKATE
  pdf.setFillColor(...COLOR_ACCENT)
  pdf.roundedRect(14, 8, 10, 10, 2, 2, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.text("K", 19, 14.8, { align: "center" })

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(12.5)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("COMUNIKATE", 27, 13)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("SISTEMA DE GESTIÓN ACADÉMICA & FINANCIERA", 27, 17)

  // Bloque derecho de fecha
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("FECHA DE EMISIÓN:", 283, 11.5, { align: "right" })

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text(dateFull(), 283, 16, { align: "right" })

  // Línea separadora sutil
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(14, 21.5, 283, 21.5)

  // Título y categoría del reporte
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text(reportTitle.toUpperCase(), 14, 27)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...COLOR_ACCENT)
  const catText = `${categoryLabel.toUpperCase()}: `
  pdf.text(catText, 14, 31.5)

  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(...COLOR_SECONDARY)
  pdf.text(entityName, 14 + pdf.getTextWidth(catText), 31.5)
}

/**
 * Ficha de metadatos horizontal multi-columna
 */
function drawInfoBoxHorizontal(
  pdf: jsPDF,
  y: number,
  items: { label: string; value: string }[]
): number {
  const count = items.length
  if (count === 0) return y

  const totalW = 269
  const boxH = 13.5
  const colW = totalW / count

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
 * Tarjetas de métricas financieras horizontales (3 KPIs: Total Esperado, Abonado y Saldo)
 */
function drawFinancialSummaryHorizontal(
  pdf: jsPDF,
  y: number,
  total: number,
  abonado: number,
  saldo: number
): number {
  const cardW = 87
  const cardH = 15.5
  const gap = 4
  const startX = 14

  // Tarjeta 1: Total Esperado
  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(startX, y, cardW, cardH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(startX, y, cardW, cardH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("TOTAL ESPERADO", startX + 5, y + 5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text(money(total), startX + 5, y + 11.5)

  // Tarjeta 2: Total Abonado
  const x2 = startX + cardW + gap
  pdf.setFillColor(...COLOR_SUCCESS_BG)
  pdf.roundedRect(x2, y, cardW, cardH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_SUCCESS_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(x2, y, cardW, cardH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(5, 150, 105)
  pdf.text("TOTAL ABONADO", x2 + 5, y + 5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(4, 120, 87)
  pdf.text(money(abonado), x2 + 5, y + 11.5)

  // Tarjeta 3: Saldo Pendiente
  const x3 = x2 + cardW + gap
  pdf.setFillColor(...COLOR_DANGER_BG)
  pdf.roundedRect(x3, y, cardW, cardH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_DANGER_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(x3, y, cardW, cardH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(225, 29, 72)
  pdf.text("SALDO PENDIENTE", x3 + 5, y + 5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(190, 18, 60)
  pdf.text(money(saldo), x3 + 5, y + 11.5)

  return y + cardH + 5
}

/**
 * Pie de página en formato horizontal (210mm alto)
 */
function drawFooterHorizontal(pdf: jsPDF, title: string) {
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(...COLOR_BORDER)
    pdf.setLineWidth(0.3)
    pdf.line(14, 200, 283, 200)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(
      `COMUNIKATE · ${title} · Documento Oficial de Uso Confidencial · ${dateShort()}`,
      14,
      204.5
    )
    pdf.text(`Página ${page} de ${pages}`, 283, 204.5, { align: "right" })
  }
}

// ==========================================
// 1. REPORTE FINANCIERO DE CURSO (HORIZONTAL)
// ==========================================
export function generarCuentaCursoPDF(data: AnyRecord) {
  const curso = data?.curso || {}
  const estudiantes = Array.isArray(data?.estudiantes) ? data.estudiantes : []
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const nombreCurso = curso.nombre_instancia || curso.nombre || "Curso"

  // Cabecera
  drawHeaderHorizontal(pdf, "Estado Financiero de Curso", "Curso", nombreCurso)

  // Metadatos
  const metaItems = [
    { label: "Docente / Instructor", value: curso.instructor || "No asignado" },
    {
      label: "Fecha Inicio",
      value: curso.fecha_inicio
        ? new Date(curso.fecha_inicio).toLocaleDateString("es-EC")
        : "—",
    },
    {
      label: "Fecha Fin",
      value: curso.fecha_fin
        ? new Date(curso.fecha_fin).toLocaleDateString("es-EC")
        : "—",
    },
    { label: "Sede / Ciudad", value: curso.ciudad || curso.sede || "—" },
    { label: "Horario", value: curso.horario || "—" },
    { label: "Estudiantes", value: `${estudiantes.length} inscritos` },
  ]
  let currentY = drawInfoBoxHorizontal(pdf, 35.5, metaItems)

  // Detectar módulos del curso (para mostrar ambos módulos con Total, Abono y Saldo)
  let modulos: any[] = []
  if (Array.isArray(data?.modulos) && data.modulos.length > 0) {
    modulos = data.modulos
  } else if (Array.isArray(curso?.modulos) && curso.modulos.length > 0) {
    modulos = curso.modulos
  } else if (estudiantes.length > 0) {
    const mapMods = new Map()
    for (const est of estudiantes) {
      const sMods = toArray(est.modulos || est.lineas_pago_modulo)
      for (const sm of sMods) {
        const mid = sm.modulo_id || sm.id
        if (mid && !mapMods.has(mid)) {
          mapMods.set(mid, {
            id: mid,
            nombre: sm.modulo_nombre || sm.nombre || `Módulo ${sm.orden || mapMods.size + 1}`,
            orden: sm.orden || mapMods.size + 1,
          })
        }
      }
    }
    if (mapMods.size > 0) {
      modulos = Array.from(mapMods.values()).sort(
        (a: any, b: any) => (a.orden || 0) - (b.orden || 0)
      )
    }
  }

  // Totales generales para los 3 KPIs
  let sumEsperado = 0
  let sumAbonado = 0

  estudiantes.forEach((student: AnyRecord) => {
    const studentMods = toArray(student.modulos || student.lineas_pago_modulo)
    const inscription = student.inscripcion || {}

    const totalEst =
      studentMods.reduce(
        (sum, item) =>
          sum + Number(item.precio ?? item.monto_ajustado ?? item.monto_original ?? 0),
        0
      ) + Number(inscription.monto_ajustado || 0)

    const paidEst =
      studentMods.reduce(
        (sum, item) => sum + Number(item.abonado ?? item.monto_abonado ?? 0),
        0
      ) + Number(inscription.monto_abonado || 0)

    sumEsperado += totalEst
    sumAbonado += paidEst
  })

  const totals = {
    total: Number(data?.totales?.esperado_catalogo ?? sumEsperado),
    paid: Number(data?.totales?.recaudado_real ?? sumAbonado),
  }
  const saldoGeneral = Math.max(0, totals.total - totals.paid)

  // 3 KPIs (sin Avance de Recaudación)
  currentY = drawFinancialSummaryHorizontal(pdf, currentY, totals.total, totals.paid, saldoGeneral)

  const tieneModulos = modulos.length > 0
  let tableHead: any[]
  let tableBody: any[]
  let columnStyles: any

  if (tieneModulos) {
    const modsToShow = modulos.slice(0, 2)

    tableHead = [
      [
        { content: "N°", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Estudiante", rowSpan: 2, styles: { halign: "left", valign: "middle" } },
        { content: "Cédula", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        ...modsToShow.map((m: any) => ({
          content: (m.nombre || `Módulo ${m.orden || m.id}`).toUpperCase(),
          colSpan: 3,
          styles: { halign: "center", valign: "middle" },
        })),
        { content: "TOTAL CURSO", colSpan: 2, styles: { halign: "center", valign: "middle" } },
      ],
      [
        ...modsToShow.flatMap(() => [
          { content: "Total", styles: { halign: "right" } },
          { content: "Abono", styles: { halign: "right" } },
          { content: "Saldo", styles: { halign: "right" } },
        ]),
        { content: "Total", styles: { halign: "right" } },
        { content: "Saldo", styles: { halign: "right" } },
      ],
    ]

    tableBody = estudiantes.map((student: AnyRecord, index: number) => {
      const studentMods = toArray(student.modulos || student.lineas_pago_modulo)
      const inscription = student.inscripcion || {}

      const totalEst =
        studentMods.reduce(
          (sum, item) =>
            sum + Number(item.precio ?? item.monto_ajustado ?? item.monto_original ?? 0),
          0
        ) + Number(inscription.monto_ajustado || 0)

      const paidEst =
        studentMods.reduce(
          (sum, item) =>
            sum + Number(item.abonado ?? item.monto_abonado ?? 0),
          0
        ) + Number(inscription.monto_abonado || 0)

      const saldoEst = Math.max(0, totalEst - paidEst)

      const nombreEstudiante =
        student.nombre ||
        `${student.apellidos || ""} ${student.nombres || ""}`.trim() ||
        "—"
      const cedula = student.cedula || student.estudiante?.cedula || "—"

      const modCols: string[] = []
      modsToShow.forEach((m: any) => {
        const lm = studentMods.find(
          (x: any) => (x.modulo_id || x.id) == m.id || (x.orden && x.orden === m.orden)
        )
        const tM = lm ? Number(lm.precio || lm.monto_ajustado || lm.monto_original || 0) : 0
        const aM = lm ? Number(lm.abonado || lm.monto_abonado || 0) : 0
        const sM = lm ? Number(lm.saldo ?? lm.saldo_pendiente ?? Math.max(0, tM - aM)) : 0

        modCols.push(money(tM), money(aM), money(sM))
      })

      return [
        index + 1,
        nombreEstudiante,
        cedula,
        ...modCols,
        money(totalEst),
        money(saldoEst),
      ]
    })

    columnStyles = {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 55, halign: "left" },
      2: { cellWidth: 24, halign: "center" },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 22, halign: "right" },
      9: { cellWidth: 25, halign: "right" },
      10: { cellWidth: 25, halign: "right" },
    }
  } else {
    tableHead = [
      [
        "N°",
        "Estudiante",
        "Cédula",
        "Teléfono",
        "Total Esperado",
        "Monto Abonado",
        "Saldo Pendiente",
        "Estado",
      ],
    ]

    tableBody = estudiantes.map((student: AnyRecord, index: number) => {
      const studentMods = toArray(student.modulos || student.lineas_pago_modulo)
      const inscription = student.inscripcion || {}

      const totalEst =
        studentMods.reduce(
          (sum, item) =>
            sum + Number(item.precio ?? item.monto_ajustado ?? item.monto_original ?? 0),
          0
        ) + Number(inscription.monto_ajustado || 0)

      const paidEst =
        studentMods.reduce(
          (sum, item) => sum + Number(item.abonado ?? item.monto_abonado ?? 0),
          0
        ) + Number(inscription.monto_abonado || 0)

      const saldoEst = Math.max(0, totalEst - paidEst)

      const nombreEstudiante =
        student.nombre ||
        `${student.apellidos || ""} ${student.nombres || ""}`.trim() ||
        "—"
      const cedula = student.cedula || student.estudiante?.cedula || "—"
      const telefono = student.telefono || student.estudiante?.telefono || "—"

      return [
        index + 1,
        nombreEstudiante,
        cedula,
        telefono,
        money(totalEst),
        money(paidEst),
        money(saldoEst),
        saldoEst <= 0 ? "AL DÍA" : "CON SALDO",
      ]
    })

    columnStyles = {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 35, halign: "right" },
      5: { cellWidth: 35, halign: "right" },
      6: { cellWidth: 35, halign: "right" },
      7: { cellWidth: 28, halign: "center" },
    }
  }

  // Tabla con jspdf-autotable (sin fila de "TOTALES GENERALES")
  autoTable(pdf, {
    startY: currentY,
    head: tableHead,
    body:
      tableBody.length > 0
        ? tableBody
        : [["—", "No se registran estudiantes matriculados", "—", "—", "—", "—", "—", "—"]],
    theme: "grid",
    margin: { left: 14, right: 14, top: 14, bottom: 18 },
    styles: {
      fontSize: 7.5,
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
      fontSize: 8,
      halign: "center",
    },
    columnStyles,
    alternateRowStyles: {
      fillColor: COLOR_BG_SUBTLE,
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body") {
        if (tieneModulos) {
          if ([5, 8, 10].includes(dataCell.column.index)) {
            const rawVal = String(dataCell.cell.raw || "")
            if (rawVal !== "$0.00" && rawVal !== "$0,00" && rawVal !== "—") {
              dataCell.cell.styles.textColor = COLOR_DANGER
              dataCell.cell.styles.fontStyle = "bold"
            } else {
              dataCell.cell.styles.textColor = COLOR_SUCCESS
            }
          }
        } else {
          if (dataCell.column.index === 7) {
            if (dataCell.cell.raw === "AL DÍA") {
              dataCell.cell.styles.textColor = COLOR_SUCCESS
              dataCell.cell.styles.fontStyle = "bold"
            } else if (dataCell.cell.raw === "CON SALDO") {
              dataCell.cell.styles.textColor = COLOR_DANGER
              dataCell.cell.styles.fontStyle = "bold"
            }
          }
        }
      }
    },
  })

  drawFooterHorizontal(pdf, `Reporte Financiero · ${nombreCurso}`)
  pdf.save(`cuentas-curso-${safeName(nombreCurso)}.pdf`)
}

// ==========================================
// 2. REPORTE FINANCIERO DE TALLER (HORIZONTAL)
// ==========================================
export function generarCuentaTallerPDF(data: AnyRecord) {
  const taller = data?.taller || {}
  const participants = Array.isArray(data?.participantes) ? data.participantes : []
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const nombreTaller = taller.nombre || "Taller"

  // Cabecera
  drawHeaderHorizontal(pdf, "Estado Financiero de Taller", "Taller", nombreTaller)

  // Metadatos
  const metaItems = [
    { label: "Instructor / Tallerista", value: taller.instructor || "No asignado" },
    {
      label: "Fecha",
      value: taller.fecha_inicio
        ? `${new Date(taller.fecha_inicio).toLocaleDateString("es-EC")}${
            taller.fecha_fin ? ` – ${new Date(taller.fecha_fin).toLocaleDateString("es-EC")}` : ""
          }`
        : taller.fecha || "—",
    },
    { label: "Ciudad / Sede", value: taller.ciudad || taller.sede || "—" },
    { label: "Horario", value: taller.horario || "—" },
    { label: "Participantes", value: `${participants.length} registrados` },
  ]
  let currentY = drawInfoBoxHorizontal(pdf, 35.5, metaItems)

  // Totales
  const total = participants.reduce(
    (sum: number, p: AnyRecord) => sum + Number(p.monto_total || 0),
    0
  )
  const paid = participants.reduce(
    (sum: number, p: AnyRecord) => sum + Number(p.monto_abonado || 0),
    0
  )
  const saldo = Math.max(0, total - paid)

  // 3 KPIs (sin Avance de Recaudación)
  currentY = drawFinancialSummaryHorizontal(pdf, currentY, total, paid, saldo)

  const rows = participants.map((p: AnyRecord, index: number) => {
    const nombre =
      p.estudiante_nombre ||
      `${p.nombres || ""} ${p.apellidos || ""}`.trim() ||
      "—"
    const pTotal = Number(p.monto_total || 0)
    const pAbonado = Number(p.monto_abonado || 0)
    const pSaldo = Number(p.saldo_pendiente ?? Math.max(0, pTotal - pAbonado))
    const estaPagado = pSaldo <= 0

    return [
      index + 1,
      nombre,
      p.cedula || "—",
      money(pTotal),
      money(pAbonado),
      money(pSaldo),
      estaPagado ? "PAGADO" : "PENDIENTE",
    ]
  })

  // Tabla con jspdf-autotable (sin fila de "TOTALES GENERALES")
  autoTable(pdf, {
    startY: currentY,
    head: [
      [
        "N°",
        "Participante",
        "Cédula",
        "Total Esperado",
        "Abonado",
        "Saldo Pendiente",
        "Estado",
      ],
    ],
    body:
      rows.length > 0
        ? rows
        : [["—", "No se registran participantes en este taller", "—", "—", "—", "—", "—"]],
    theme: "grid",
    margin: { left: 14, right: 14, top: 14, bottom: 18 },
    styles: {
      fontSize: 7.5,
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
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 38, halign: "right" },
      4: { cellWidth: 38, halign: "right" },
      5: { cellWidth: 38, halign: "right" },
      6: { cellWidth: 30, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: COLOR_BG_SUBTLE,
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.index === 6) {
        if (dataCell.cell.raw === "PAGADO") {
          dataCell.cell.styles.textColor = COLOR_SUCCESS
          dataCell.cell.styles.fontStyle = "bold"
        } else if (dataCell.cell.raw === "PENDIENTE") {
          dataCell.cell.styles.textColor = COLOR_DANGER
          dataCell.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  drawFooterHorizontal(pdf, `Reporte Financiero · ${nombreTaller}`)
  pdf.save(`cuentas-taller-${safeName(nombreTaller)}.pdf`)
}

// =====================================================================
// 3. REPORTE FINANCIERO DE SERVICIO (VERTICAL / PORTRAIT - 1 CLIENTE)
// =====================================================================
export function generarCuentaServicioPDF(data: AnyRecord) {
  // Configurado en VERTICAL (portrait) para cliente individual
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const nombreServicio = data.nombre || data.tipo || "Servicio"
  const tipoServicio = data.tipo || "Servicio General"
  const nombreCliente = data.cliente || "Cliente Particular"
  const contacto = data.contacto || {}

  const total = Number(data.total || 0)
  const cobrado = Number(data.cobrado || 0)
  const saldo = Number(data.saldo ?? Math.max(0, total - cobrado))
  const pagado = saldo <= 0

  // 1. Barra superior corporativa (210mm ancho en vertical)
  pdf.setFillColor(...COLOR_ACCENT)
  pdf.rect(0, 0, 210, 3.5, "F")

  // 2. Encabezado principal
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

  // Lado derecho del encabezado
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("ESTADO DE CUENTA DE SERVICIO", 196, 12.5, { align: "right" })

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text(`Fecha: ${dateFull()}`, 196, 17.5, { align: "right" })

  // Línea separadora
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.line(14, 22.5, 196, 22.5)

  // 3. Ficha de Información: 2 Paneles (Detalles del Servicio y Datos del Cliente)
  const infoY = 27
  const boxH = 34
  const boxW = 89
  const leftX = 14
  const rightX = 107

  // Panel Izquierdo: Información del Servicio
  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(leftX, infoY, boxW, boxH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(leftX, infoY, boxW, boxH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(...COLOR_ACCENT)
  pdf.text("DATOS DEL SERVICIO", leftX + 4, infoY + 5.5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.setTextColor(...COLOR_PRIMARY)
  let dispNombre = nombreServicio
  if (pdf.getTextWidth(dispNombre) > boxW - 8) {
    dispNombre = dispNombre.slice(0, 32) + "…"
  }
  pdf.text(dispNombre, leftX + 4, infoY + 12)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("CATEGORÍA / TIPO:", leftX + 4, infoY + 18)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(...COLOR_SECONDARY)
  pdf.text(tipoServicio, leftX + 30, infoY + 18)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("ESTADO ACTUAL:", leftX + 4, infoY + 24)

  if (pagado) {
    pdf.setFillColor(...COLOR_SUCCESS_BG)
    pdf.roundedRect(leftX + 30, infoY + 20.5, 34, 5, 1, 1, "F")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_SUCCESS)
    pdf.text("TOTALMENTE PAGADO", leftX + 32, infoY + 24)
  } else if (cobrado > 0) {
    pdf.setFillColor(254, 243, 199) // amber-100
    pdf.roundedRect(leftX + 30, infoY + 20.5, 26, 5, 1, 1, "F")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(180, 83, 9)
    pdf.text("PAGO PARCIAL", leftX + 32, infoY + 24)
  } else {
    pdf.setFillColor(...COLOR_DANGER_BG)
    pdf.roundedRect(leftX + 30, infoY + 20.5, 34, 5, 1, 1, "F")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_DANGER)
    pdf.text("PENDIENTE DE PAGO", leftX + 32, infoY + 24)
  }

  // Panel Derecho: Datos del Cliente
  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(rightX, infoY, boxW, boxH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(rightX, infoY, boxW, boxH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(...COLOR_ACCENT)
  pdf.text("INFORMACIÓN DEL CLIENTE", rightX + 4, infoY + 5.5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.setTextColor(...COLOR_PRIMARY)
  let dispCliente = nombreCliente
  if (pdf.getTextWidth(dispCliente) > boxW - 8) {
    dispCliente = dispCliente.slice(0, 32) + "…"
  }
  pdf.text(dispCliente, rightX + 4, infoY + 12)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("CÉDULA / RUC:", rightX + 4, infoY + 17.5)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(...COLOR_SECONDARY)
  pdf.text(contacto.cedula || data.cedula || "No registrada", rightX + 26, infoY + 17.5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("TELÉFONO:", rightX + 4, infoY + 22.5)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(...COLOR_SECONDARY)
  pdf.text(contacto.telefono || data.telefono || "—", rightX + 26, infoY + 22.5)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("CORREO:", rightX + 4, infoY + 27.5)
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(...COLOR_SECONDARY)
  let dispEmail = contacto.email || data.email || "—"
  if (pdf.getTextWidth(dispEmail) > boxW - 30) {
    dispEmail = dispEmail.slice(0, 24) + "…"
  }
  pdf.text(dispEmail, rightX + 26, infoY + 27.5)

  // 4. Métricas Financieras (3 tarjetas adaptadas al ancho vertical 182mm)
  const cardsY = infoY + boxH + 4
  const cW = 58
  const cH = 15.5
  const gap = 4

  // Tarjeta 1: Total
  pdf.setFillColor(...COLOR_BG_SUBTLE)
  pdf.roundedRect(14, cardsY, cW, cH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14, cardsY, cW, cH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(...COLOR_MUTED)
  pdf.text("TOTAL ESPERADO", 18, cardsY + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text(money(total), 18, cardsY + 11.5)

  // Tarjeta 2: Abonado
  pdf.setFillColor(...COLOR_SUCCESS_BG)
  pdf.roundedRect(14 + cW + gap, cardsY, cW, cH, 2, 2, "F")
  pdf.setDrawColor(...COLOR_SUCCESS_BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14 + cW + gap, cardsY, cW, cH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(5, 150, 105)
  pdf.text("TOTAL ABONADO", 14 + cW + gap + 4, cardsY + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(4, 120, 87)
  pdf.text(money(cobrado), 14 + cW + gap + 4, cardsY + 11.5)

  // Tarjeta 3: Saldo
  pdf.setFillColor(...(pagado ? COLOR_SUCCESS_BG : COLOR_DANGER_BG))
  pdf.roundedRect(14 + (cW + gap) * 2, cardsY, cW, cH, 2, 2, "F")
  pdf.setDrawColor(...(pagado ? COLOR_SUCCESS_BORDER : COLOR_DANGER_BORDER))
  pdf.setLineWidth(0.3)
  pdf.roundedRect(14 + (cW + gap) * 2, cardsY, cW, cH, 2, 2, "S")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(pagado ? 5 : 225, pagado ? 150 : 29, pagado ? 105 : 72)
  pdf.text("SALDO PENDIENTE", 14 + (cW + gap) * 2 + 4, cardsY + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(11)
  pdf.setTextColor(pagado ? 4 : 190, pagado ? 120 : 18, pagado ? 87 : 60)
  pdf.text(money(saldo), 14 + (cW + gap) * 2 + 4, cardsY + 11.5)

  // 5. Tabla de Historial de Pagos (autoTable)
  const transactions = Array.isArray(data.transacciones) ? data.transacciones : []
  const tableStartY = cardsY + cH + 6

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(...COLOR_PRIMARY)
  pdf.text("HISTORIAL DE ABONOS Y PAGOS", 14, tableStartY - 1.5)

  const rows = transactions.map((t: AnyRecord, index: number) => {
    const monto = Number(t.monto || 0)
    const fecha = t.fecha_pago
      ? new Date(t.fecha_pago).toLocaleDateString("es-EC", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—"

    const estado =
      t.estado_verificacion === "aprobado"
        ? "VERIFICADO"
        : t.estado_verificacion === "rechazado"
        ? "RECHAZADO"
        : "PENDIENTE"

    return [
      index + 1,
      fecha,
      t.metodo_pago || "Efectivo / Transferencia",
      t.referencia || t.numero_comprobante || "—",
      estado,
      money(monto),
    ]
  })

  autoTable(pdf, {
    startY: tableStartY,
    head: [
      [
        "N°",
        "Fecha",
        "Método de Pago",
        "Referencia",
        "Estado",
        "Monto Abonado",
      ],
    ],
    body:
      rows.length > 0
        ? rows
        : [["—", "No se registran pagos en el historial para este servicio", "—", "—", "—", "—"]],
    theme: "grid",
    margin: { left: 14, right: 14, top: 14, bottom: 25 },
    styles: {
      fontSize: 7.5,
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
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: 42, halign: "left" },
      3: { cellWidth: "auto", halign: "left" },
      4: { cellWidth: 28, halign: "center" },
      5: { cellWidth: 30, halign: "right" },
    },
    alternateRowStyles: {
      fillColor: COLOR_BG_SUBTLE,
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.index === 4) {
        if (dataCell.cell.raw === "VERIFICADO") {
          dataCell.cell.styles.textColor = COLOR_SUCCESS
          dataCell.cell.styles.fontStyle = "bold"
        } else if (dataCell.cell.raw === "RECHAZADO") {
          dataCell.cell.styles.textColor = COLOR_DANGER
          dataCell.cell.styles.fontStyle = "bold"
        } else if (dataCell.cell.raw === "PENDIENTE") {
          dataCell.cell.styles.textColor = COLOR_AMBER
          dataCell.cell.styles.fontStyle = "bold"
        }
      }
    },
  })

  // 6. Bloque de Confirmación y Firmas (Estilo Comprobante / Recibo para cliente individual)
  const finalY = (pdf as any).lastAutoTable?.finalY || 140
  const signY = Math.max(finalY + 16, 235)

  if (signY < 270) {
    const lineW = 65
    const leftSignX = 24
    const rightSignX = 120

    pdf.setDrawColor(...COLOR_BORDER)
    pdf.setLineWidth(0.3)
    pdf.line(leftSignX, signY, leftSignX + lineW, signY)
    pdf.line(rightSignX, signY, rightSignX + lineW, signY)

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(7)
    pdf.setTextColor(...COLOR_PRIMARY)
    pdf.text("FIRMA AUTORIZADA", leftSignX + lineW / 2, signY + 4, { align: "center" })
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text("Comunikate · Administración Financiera", leftSignX + lineW / 2, signY + 7.5, { align: "center" })

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(7)
    pdf.setTextColor(...COLOR_PRIMARY)
    pdf.text("RECIBIDO / CONFORME CLIENTE", rightSignX + lineW / 2, signY + 4, { align: "center" })
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(6.5)
    pdf.setTextColor(...COLOR_MUTED)
    pdf.text(nombreCliente, rightSignX + lineW / 2, signY + 7.5, { align: "center" })
  }

  // 7. Pie de página en formato vertical (297mm alto)
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
      `COMUNIKATE · Estado de Cuenta: ${nombreServicio} · ${dateShort()}`,
      14,
      289.5
    )
    pdf.text(`Página ${page} de ${pages}`, 196, 289.5, { align: "right" })
  }

  pdf.save(`cuenta-servicio-${safeName(nombreServicio)}.pdf`)
}
