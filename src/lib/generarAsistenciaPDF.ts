import { jsPDF } from "jspdf"
import { applyPlugin } from "jspdf-autotable"
applyPlugin(jsPDF)

const ACCENT_RGB: [number, number, number] = [232, 148, 0]
const PRIMARY_RGB: [number, number, number] = [31, 41, 55]
const TEXT_RGB: [number, number, number] = [55, 65, 81]
const BORDER_RGB: [number, number, number] = [229, 231, 235]
const GRAY_ROW_RGB: [number, number, number] = [249, 250, 251]
const MUTED_RGB: [number, number, number] = [156, 163, 175]
const FOOTER_LINE_RGB: [number, number, number] = [200, 200, 200]
const FOOTER_TEXT_RGB: [number, number, number] = [180, 180, 180]
const WHITE_RGB: [number, number, number] = [255, 255, 255]
const GREEN_RGB: [number, number, number] = [5, 150, 105]
const RED_RGB: [number, number, number] = [185, 28, 28]
const GREEN_BG_RGB: [number, number, number] = [220, 252, 231]
const RED_BG_RGB: [number, number, number] = [254, 226, 226]

// ============================================================================
// TIPOS COMPARTIDOS
// ============================================================================

export interface DatosAsistenciaInfo {
  nombre: string
  instructor: string
  ciudad: string
  horario: string
  fecha_inicio: string
  fecha_fin: string
}

export interface DatosAsistenciaModulo {
  nombre: string
  fechas: string[]
}

export interface DatosAsistenciaParticipante {
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  ciudad: string
  conteo_c: number
  conteo_f: number
  asistencias: (string | null)[]
}

export interface DatosAsistenciaPDF {
  info: DatosAsistenciaInfo
  modulos: DatosAsistenciaModulo[]
  participantes: DatosAsistenciaParticipante[]
  tipo?: "curso" | "taller"
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
  })
}

export async function generarListadoAsistenciaPDF(
  data: DatosAsistenciaPDF,
) {
  try {
  const _doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const doc = _doc as any
  const margin = 14
  const pageW = 297
  const contentW = pageW - 2 * margin
  const fechaImpresion = formatDate(new Date())

  let modulosEfectivos = data.modulos
  if (data.tipo === "taller" && modulosEfectivos.length === 0 && data.info.fecha_inicio) {
    modulosEfectivos = [{
      nombre: "Taller",
      fechas: [data.info.fecha_inicio],
    }]
  }

  // -- Encabezado --
  try {
    const logoImg = await loadImage("/Logo_PDF.png")
    doc.addImage(logoImg, "PNG", margin, 8, 22, 18)
  } catch {
    // logo non-critical
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 17, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED_RGB)
  doc.text("LISTA DE ASISTENCIA", pageW / 2, 24, { align: "center" })

  doc.setDrawColor(...ACCENT_RGB)
  doc.setLineWidth(0.6)
  doc.line(margin, 29, pageW - margin, 29)

  // -- Info box (bordered table-like) --
  let y = 37
  const infoHeaderH = 6
  doc.setFillColor(...PRIMARY_RGB)
  doc.rect(margin, y, contentW, infoHeaderH, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...WHITE_RGB)
  doc.text("DATOS GENERALES", margin + 4, y + 4)
  y += infoHeaderH

  const infoRowH = 6.5
  const leftLabels = ["Instructor:", "Fecha de inicio:"]
  const rightLabels = ["Curso:", "Fecha de finalización:", "Ciudad:", "Horario:"]
  if (data.tipo === "taller") rightLabels[0] = "Taller:"
  const leftValues = [data.info.instructor || "—", data.info.fecha_inicio ? formatDateLong(data.info.fecha_inicio) : "—"]
  const rightValues = [data.info.nombre || "—", data.info.fecha_fin ? formatDateLong(data.info.fecha_fin) : "—", data.info.ciudad || "—", data.info.horario || "—"]
  const maxRows = Math.max(leftLabels.length, rightLabels.length)

  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)

  for (let r = 0; r < maxRows; r++) {
    const rowY = y + r * infoRowH
    doc.setFillColor(r % 2 === 0 ? 255 : 250, r % 2 === 0 ? 255 : 250, r % 2 === 0 ? 255 : 250)
    doc.rect(margin, rowY, contentW, infoRowH, "F")

    if (r < leftLabels.length) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(...TEXT_RGB)
      doc.text(leftLabels[r], margin + 4, rowY + 4.5)
      doc.setFont("helvetica", "normal")
      doc.text(leftValues[r], margin + 4 + doc.getTextWidth(leftLabels[r]) + 2, rowY + 4.5)
    }
    if (r < rightLabels.length) {
      const rx = margin + contentW * 0.45
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(...TEXT_RGB)
      doc.text(rightLabels[r], rx + 4, rowY + 4.5)
      doc.setFont("helvetica", "normal")
      doc.text(rightValues[r], rx + 4 + doc.getTextWidth(rightLabels[r]) + 2, rowY + 4.5)
    }
    doc.line(margin, rowY + infoRowH, margin + contentW, rowY + infoRowH)
  }

  // -- Leyenda --
  const legendX = pageW - margin - 72
  const legendY = 37 + 2
  doc.setFillColor(240, 253, 244)
  doc.rect(legendX, legendY, 72, 15, "F")
  doc.setDrawColor(...GREEN_RGB)
  doc.setLineWidth(0.3)
  doc.rect(legendX, legendY, 72, 15, "S")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...GREEN_RGB)
  doc.setFillColor(...GREEN_BG_RGB)
  doc.rect(legendX + 3, legendY + 2, 4, 4, "F")
  doc.text("X: ASISTIÓ", legendX + 9, legendY + 5)

  doc.setTextColor(...RED_RGB)
  doc.setFillColor(...RED_BG_RGB)
  doc.rect(legendX + 3, legendY + 8.5, 4, 4, "F")
  doc.text("F: FALTÓ", legendX + 9, legendY + 11.5)

  // -- Autotable table --
  y += maxRows * infoRowH + 6

  const fixedColHeaders = [
    "No.",
    "C",
    "F",
    "Nombres y Apellidos",
    "Cédula",
    "Teléfono",
    "Ciudad",
  ]
  const fixedColCount = fixedColHeaders.length
  const allDates = modulosEfectivos.flatMap((m) => m.fechas)

  const headRow1: { content: string; colSpan?: number; rowSpan?: number }[] = []
  const headRow2: { content: string; rowSpan?: number }[] = []

  for (const header of fixedColHeaders) {
    headRow1.push({ content: header, rowSpan: 2 })
  }
  for (const mod of modulosEfectivos) {
    if (mod.fechas.length > 0) {
      const isSingleModTaller = data.tipo === "taller" && modulosEfectivos.length === 1
      const displayName = isSingleModTaller ? formatDateShort(mod.fechas[0] ?? "") : mod.nombre
      headRow1.push({ content: displayName, colSpan: mod.fechas.length })
    }
  }

  for (const dateStr of allDates) {
    headRow2.push({ content: formatDateShort(dateStr) })
  }

  const body = data.participantes.map((p, idx) => {
    const nombreCompleto = [p.nombres, p.apellidos].filter(Boolean).join(" ")
    const row: (string | number)[] = [
      idx + 1,
      p.conteo_c,
      p.conteo_f,
      nombreCompleto,
      p.cedula,
      p.telefono,
      p.ciudad,
    ]
    for (const asis of p.asistencias) {
      row.push(asis ?? "")
    }
    return row
  })

  ;(doc as any).autoTable({
    startY: y,
    head: [headRow1, headRow2],
    body,
    theme: "grid",
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: WHITE_RGB,
      fontStyle: "bold",
      fontSize: 6.5,
      halign: "center",
      valign: "middle",
      lineColor: BORDER_RGB,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      lineColor: BORDER_RGB,
      lineWidth: 0.15,
      textColor: TEXT_RGB,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 7, halign: "center", fontStyle: "bold", textColor: GREEN_RGB },
      2: { cellWidth: 7, halign: "center", fontStyle: "bold", textColor: RED_RGB },
      3: { cellWidth: 68, halign: "left" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    didParseCell: (cellData: any) => {
      const colIndex = cellData.column.index
      if (cellData.section === "body" && colIndex >= fixedColCount) {
        const value = String(cellData.cell.raw ?? "")
        if (value === "X") {
          cellData.cell.styles.fillColor = [220, 252, 231]
          cellData.cell.styles.textColor = [5, 150, 105]
          cellData.cell.styles.fontStyle = "bold"
          cellData.cell.styles.halign = "center"
        } else if (value === "F") {
          cellData.cell.styles.fillColor = [254, 226, 226]
          cellData.cell.styles.textColor = [185, 28, 28]
          cellData.cell.styles.fontStyle = "bold"
          cellData.cell.styles.halign = "center"
        } else {
          cellData.cell.styles.halign = "center"
        }
      }
      if (cellData.section === "head" && colIndex >= fixedColCount) {
        cellData.cell.styles.halign = "center"
      }
    },
    didDrawPage: (data: any) => {
      const pageCount = doc.getNumberOfPages()
      doc.setDrawColor(...FOOTER_LINE_RGB)
      doc.setLineWidth(0.3)
      doc.line(margin, 196, pageW - margin, 196)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(6.5)
      doc.setTextColor(...FOOTER_TEXT_RGB)
      doc.text(
        `Comunikate  |  Página ${data.pageNumber} de ${pageCount}  |  Generado: ${fechaImpresion}`,
        margin,
        200,
      )
    },
  })

  // -- Observations and signature --
  const lastY = (doc as any).lastAutoTable?.finalY ?? y
  let afterY = lastY + 10

  if (afterY > 185) {
    doc.addPage()
    afterY = 20
  }

  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, afterY, contentW, 18)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_RGB)
  doc.text("Observaciones", margin + 4, afterY + 5)

  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.2)
  for (let i = 0; i < 2; i++) {
    doc.line(margin + 4, afterY + 9 + i * 5, margin + contentW - 4, afterY + 9 + i * 5)
  }

  const sigY = afterY + 22
  const sigX = margin + contentW - 55
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.5)
  doc.line(sigX, sigY, sigX + 55, sigY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED_RGB)
  doc.text("Firma del Instructor", sigX + 27.5, sigY + 4, { align: "center" })

  const safeName = data.info.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
  doc.save(`lista-asistencia-${safeName}.pdf`)
  } catch (e) {
    console.error("PDF generation error:", e)
    throw e
  }
}

export interface EstudianteReporte {
  nombres: string
  apellidos: string
  cedula?: string
  ciudad?: string
  asistio: boolean
}

export async function generarReporteAsistenciaPDF(
  nombreCurso: string,
  fechaSesion: string,
  estudiantes: EstudianteReporte[],
  instructor?: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 14
  const pageW = 210
  const contentW = pageW - 2 * margin
  const fechaImpresion = formatDate(new Date())

  const presentCount = estudiantes.filter(e => e.asistio).length
  const totalCount = estudiantes.length
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  const colW = [10, 76, 34, 34, 34]
  const colX: number[] = []
  let cx = margin
  for (const w of colW) {
    colX.push(cx)
    cx += w
  }
  const tableW = colW.reduce((a, b) => a + b, 0)
  const rowH = 7
  const headerH = 8

  function drawTableHeader(y: number) {
    doc.setFillColor(...PRIMARY_RGB)
    doc.rect(margin, y, tableW, headerH, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...WHITE_RGB)

    const hdrs = ["N°", "Participante", "Cédula", "Ciudad", "Asistió"]
    for (let i = 0; i < hdrs.length; i++) {
      if (i === 1) {
        doc.text(hdrs[i], colX[i] + 2, y + 5)
      } else {
        doc.text(hdrs[i], colX[i] + colW[i] / 2, y + 5, { align: "center" })
      }
    }

    doc.setDrawColor(...WHITE_RGB)
    doc.setLineWidth(0.15)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + headerH)
    }
  }

  // -- Encabezado --
  try {
    const logoImg = await loadImage("/Logo_PDF.png")
    doc.addImage(logoImg, "PNG", margin, 8, 22, 18)
  } catch {
    // logo non-critical
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 17, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED_RGB)
  doc.text("REPORTE DE ASISTENCIA", pageW / 2, 24, { align: "center" })

  doc.setDrawColor(...ACCENT_RGB)
  doc.setLineWidth(0.6)
  doc.line(margin, 29, pageW - margin, 29)

  // -- Info box --
  let y = 42
  const infoBoxH = 28
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, infoBoxH)

  const colMid = contentW / 2
  const leftCol = [
    { label: "Curso:", value: nombreCurso },
    { label: "Fecha:", value: fechaSesion },
    { label: "Instructor:", value: instructor || "—" },
  ]
  const rightCol = [
    { label: "Asistieron:", value: `${presentCount} de ${totalCount}` },
    { label: "Porcentaje:", value: `${pct}%` },
  ]

  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_RGB)

  const maxRows = Math.max(leftCol.length, rightCol.length)
  let iy = y + 5.5
  for (let r = 0; r < maxRows; r++) {
    const leftItem = leftCol[r]
    if (leftItem) {
      doc.setFont("helvetica", "bold")
      doc.text(leftItem.label, margin + 4, iy)
      const labelW = doc.getTextWidth(leftItem.label)
      doc.setFont("helvetica", "normal")
      doc.text(leftItem.value, margin + 4 + labelW + 2, iy)
    }

    const rightItem = rightCol[r]
    if (rightItem) {
      const rx = margin + colMid
      doc.setFont("helvetica", "bold")
      doc.text(rightItem.label, rx + 4, iy)
      const labelW = doc.getTextWidth(rightItem.label)
      doc.setFont("helvetica", "normal")
      doc.text(rightItem.value, rx + 4 + labelW + 2, iy)
    }

    iy += 5
  }

  // -- Table title --
  y = y + infoBoxH + 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_RGB)
  doc.text("DETALLE DE ASISTENCIA", margin, y)
  y += 3
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentW, y)
  y += 5

  drawTableHeader(y)
  y += headerH

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_RGB)

  estudiantes.forEach((est, idx) => {
    if (y + rowH > 270) {
      doc.addPage()
      y = 20
      drawTableHeader(y)
      y += headerH
    }

    const num = idx + 1
    const nombreCompleto = `${est.nombres} ${est.apellidos}`

    if (idx % 2 === 0) {
      doc.setFillColor(...GRAY_ROW_RGB)
      doc.rect(margin, y, tableW, rowH, "F")
    }

    doc.setTextColor(...TEXT_RGB)
    doc.text(`${num}`, colX[0] + colW[0] / 2, y + 5, { align: "center" })

    doc.text(nombreCompleto, colX[1] + 2, y + 5)

    doc.text(est.cedula || "—", colX[2] + colW[2] / 2, y + 5, { align: "center" })

    doc.text(est.ciudad || "—", colX[3] + colW[3] / 2, y + 5, { align: "center" })

    if (est.asistio) {
      doc.setTextColor(...GREEN_RGB)
      doc.setFont("helvetica", "bold")
      doc.text("Sí", colX[4] + colW[4] / 2, y + 5, { align: "center" })
    } else {
      doc.setTextColor(...RED_RGB)
      doc.setFont("helvetica", "bold")
      doc.text("No", colX[4] + colW[4] / 2, y + 5, { align: "center" })
    }
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...TEXT_RGB)

    doc.setDrawColor(...BORDER_RGB)
    doc.setLineWidth(0.2)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + rowH)
    }
    doc.line(margin, y + rowH, margin + tableW, y + rowH)

    y += rowH
  })

  // -- Summary --
  y += 6
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, 14)

  doc.setFontSize(9)
  doc.setTextColor(...TEXT_RGB)
  doc.setFont("helvetica", "bold")
  doc.text(`Total: ${totalCount} estudiantes  |  Asistieron: ${presentCount}  |  Ausentes: ${totalCount - presentCount}  |  Porcentaje: ${pct}%`, margin + 4, y + 9)

  // -- Footer --
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...FOOTER_LINE_RGB)
    doc.setLineWidth(0.3)
    doc.line(margin, 285, pageW - margin, 285)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...FOOTER_TEXT_RGB)
    doc.text(
      `Comunikate  |  Página ${i} de ${totalPages}  |  Generado: ${fechaImpresion}`,
      margin,
      291,
    )
  }

  const safeName = nombreCurso.replace(/[^a-zA-Z0-9\s-]/g, "").trim()
  doc.save(`reporte-asistencia-${safeName}.pdf`)
}

export interface ParticipanteReporte {
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  montoPagado: number
  saldoPendiente: number
}

export async function generarListadoParticipantesPDF(
  nombreTaller: string,
  participantes: ParticipanteReporte[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 14
  const pageW = 210
  const contentW = pageW - 2 * margin
  const fechaImpresion = formatDate(new Date())

  const colW = [8, 62, 28, 24, 30, 30]
  const colX: number[] = []
  let cx = margin
  for (const w of colW) {
    colX.push(cx)
    cx += w
  }
  const tableW = colW.reduce((a, b) => a + b, 0)
  const rowH = 7
  const headerH = 8

  function drawTableHeader(y: number) {
    doc.setFillColor(...PRIMARY_RGB)
    doc.rect(margin, y, tableW, headerH, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...WHITE_RGB)

    const hdrs = ["N°", "Participante", "Cédula", "Teléfono", "Pagado", "Saldo"]
    for (let i = 0; i < hdrs.length; i++) {
      if (i === 1) {
        doc.text(hdrs[i], colX[i] + 2, y + 5)
      } else {
        doc.text(hdrs[i], colX[i] + colW[i] / 2, y + 5, { align: "center" })
      }
    }

    doc.setDrawColor(...WHITE_RGB)
    doc.setLineWidth(0.15)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + headerH)
    }
  }

  // -- Encabezado --
  try {
    const logoImg = await loadImage("/Logo_PDF.png")
    doc.addImage(logoImg, "PNG", margin, 8, 22, 18)
  } catch {
    // logo non-critical
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 17, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED_RGB)
  doc.text("LISTADO DE PARTICIPANTES", pageW / 2, 24, { align: "center" })

  doc.setDrawColor(...ACCENT_RGB)
  doc.setLineWidth(0.6)
  doc.line(margin, 29, pageW - margin, 29)

  // -- Info box --
  let y = 42
  const infoBoxH = 18
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, infoBoxH)

  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_RGB)

  doc.setFont("helvetica", "bold")
  doc.text("Taller:", margin + 4, y + 7)
  const labelW = doc.getTextWidth("Taller:")
  doc.setFont("helvetica", "normal")
  doc.text(nombreTaller, margin + 4 + labelW + 2, y + 7)

  doc.setFont("helvetica", "bold")
  doc.text("Participantes:", margin + 4, y + 14)
  doc.setFont("helvetica", "normal")
  doc.text(`${participantes.length}`, margin + 4 + doc.getTextWidth("Participantes:") + 2, y + 14)

  doc.setFont("helvetica", "bold")
  const fechaLabel = "Fecha:"
  doc.text(fechaLabel, margin + contentW / 2 + 4, y + 7)
  doc.setFont("helvetica", "normal")
  doc.text(fechaImpresion, margin + contentW / 2 + 4 + doc.getTextWidth(fechaLabel) + 2, y + 7)

  // -- Table title --
  y = y + infoBoxH + 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_RGB)
  doc.text("PARTICIPANTES INSCRITOS", margin, y)
  y += 3
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentW, y)
  y += 5

  drawTableHeader(y)
  y += headerH

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_RGB)

  let totalPagado = 0
  let totalSaldo = 0

  participantes.forEach((p, idx) => {
    if (y + rowH > 270) {
      doc.addPage()
      y = 20
      drawTableHeader(y)
      y += headerH
    }

    const num = idx + 1
    const nombreCompleto = `${p.nombres} ${p.apellidos}`

    if (idx % 2 === 0) {
      doc.setFillColor(...GRAY_ROW_RGB)
      doc.rect(margin, y, tableW, rowH, "F")
    }

    doc.setTextColor(...TEXT_RGB)
    doc.text(`${num}`, colX[0] + colW[0] / 2, y + 5, { align: "center" })
    doc.text(nombreCompleto, colX[1] + 2, y + 5)
    doc.text(p.cedula || "�", colX[2] + colW[2] / 2, y + 5, { align: "center" })
    doc.text(p.telefono || "�", colX[3] + colW[3] / 2, y + 5, { align: "center" })
    doc.text(`$${Number(p.montoPagado).toFixed(2)}`, colX[4] + colW[4] / 2, y + 5, { align: "center" })
    doc.text(`$${Number(p.saldoPendiente).toFixed(2)}`, colX[5] + colW[5] / 2, y + 5, { align: "center" })

    totalPagado += p.montoPagado
    totalSaldo += p.saldoPendiente

    doc.setDrawColor(...BORDER_RGB)
    doc.setLineWidth(0.2)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + rowH)
    }
    doc.line(margin, y + rowH, margin + tableW, y + rowH)

    y += rowH
  })

  // -- Totals --
  y += 4
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, 10)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_RGB)
  const totalText = `Total participantes: ${participantes.length}  |  Total pagado: $${Number(totalPagado).toFixed(2)}  |  Total pendiente: $${Number(totalSaldo).toFixed(2)}`
  doc.text(totalText, margin + 4, y + 7)

  // -- Footer --
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...FOOTER_LINE_RGB)
    doc.setLineWidth(0.3)
    doc.line(margin, 285, pageW - margin, 285)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...FOOTER_TEXT_RGB)
    doc.text(
      `Comunikate  |  Página ${i} de ${totalPages}  |  Generado: ${fechaImpresion}`,
      margin,
      291,
    )
  }

  const safeName = nombreTaller.replace(/[^a-zA-Z0-9\s-]/g, "").trim()
  doc.save(`listado-participantes-${safeName}.pdf`)
}

export interface ParticipanteCursoReporte {
  nombres: string
  apellidos: string
  ciudad: string
  ocupacion: string
  fechaInscripcion: string
}

export async function generarListadoParticipantesCursoPDF(
  cursoNombre: string,
  participantes: ParticipanteCursoReporte[],
  cursoId: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 14
  const pageW = 210
  const contentW = pageW - 2 * margin

  const colW = [8, 65, 28, 55, 26]
  const colX: number[] = []
  let cx = margin
  for (const w of colW) { colX.push(cx); cx += w }
  const tableW = colW.reduce((a, b) => a + b, 0)

  // -- Encabezado --
  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 17, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED_RGB)
  doc.text("LISTADO DE PARTICIPANTES", pageW / 2, 24, { align: "center" })
  doc.setDrawColor(...ACCENT_RGB)
  doc.setLineWidth(0.6)
  doc.line(margin, 29, pageW - margin, 29)

  let y = 42
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, 16)
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_RGB)
  doc.setFont("helvetica", "bold")
  const lw = doc.getTextWidth("Curso:")
  doc.text("Curso:", margin + 4, y + 7)
  doc.setFont("helvetica", "normal")
  doc.text(cursoNombre, margin + 4 + lw + 2, y + 7)
  doc.setFont("helvetica", "bold")
  const lw2 = doc.getTextWidth("Total:")
  doc.text("Total:", margin + 4, y + 13)
  doc.setFont("helvetica", "normal")
  doc.text(`${participantes.length} estudiante${participantes.length !== 1 ? "s" : ""}`, margin + 4 + lw2 + 2, y + 13)

  y += 16 + 6

  doc.setFillColor(...PRIMARY_RGB)
  doc.rect(margin, y, tableW, 8, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...WHITE_RGB)
  const hdrs = ["N°", "Estudiante", "Ciudad", "Ocupación", "Inscripción"]
  for (let i = 0; i < hdrs.length; i++) {
    const align = i === 1 ? ("left" as const) : ("center" as const)
    const xOff = i === 1 ? 2 : colW[i] / 2
    doc.text(hdrs[i], colX[i] + xOff, y + 5, { align })
  }
  y += 8

  const rowH = 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_RGB)
  participantes.forEach((p, i) => {
    if (y + rowH > 287) {
      doc.addPage()
      y = margin
      doc.setFillColor(...PRIMARY_RGB)
      doc.rect(margin, y, tableW, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(...WHITE_RGB)
      for (let j = 0; j < hdrs.length; j++) {
        const a2 = j === 1 ? "left" as const : "center" as const
        const xo2 = j === 1 ? 2 : colW[j] / 2
        doc.text(hdrs[j], colX[j] + xo2, y + 5, { align: a2 })
      }
      y += 8
    }
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y, tableW, rowH, "F")
    }
    const nombre = [p.nombres, p.apellidos].filter(Boolean).join(" ") || "�"
    doc.text(String(i + 1), colX[0] + colW[0] / 2, y + 5, { align: "center" })
    doc.text(nombre, colX[1] + 2, y + 5)
    doc.text(p.ciudad, colX[2] + colW[2] / 2, y + 5, { align: "center" })
    doc.text(p.ocupacion, colX[3] + colW[3] / 2, y + 5, { align: "center" })
    doc.text(p.fechaInscripcion, colX[4] + colW[4] / 2, y + 5, { align: "center" })
    y += rowH
  })

  doc.save(`participantes_${cursoId}.pdf`)
}