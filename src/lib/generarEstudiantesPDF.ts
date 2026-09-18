import { jsPDF } from "jspdf"

const ACCENT_RGB: [number, number, number] = [232, 148, 0]
const PRIMARY_RGB: [number, number, number] = [31, 41, 55]
const TEXT_RGB: [number, number, number] = [55, 65, 81]
const BORDER_RGB: [number, number, number] = [229, 231, 235]
const GRAY_ROW_RGB: [number, number, number] = [249, 250, 251]
const MUTED_RGB: [number, number, number] = [156, 163, 175]
const FOOTER_LINE_RGB: [number, number, number] = [200, 200, 200]
const FOOTER_TEXT_RGB: [number, number, number] = [180, 180, 180]
const WHITE_RGB: [number, number, number] = [255, 255, 255]

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

export interface EstudiantePDF {
  nombres: string
  apellidos: string
  cedula: string
  correo?: string
  telefono?: string
  ciudad?: string
  direccion?: string
  ocupacion?: string
  estado_financiero?: string
  saldo?: number
  total_cursos?: number
  fecha_inscripcion?: string
}

export interface EntityInfoPDF {
  nombre: string
  instructor?: string
  fecha?: string
  ciudad?: string
  total: number
}

type Contexto = "curso" | "taller" | "ciudad" | "todos"

interface CampoDef {
  key: string
  label: string
  width: number
  value: (e: EstudiantePDF) => string
  align?: "left" | "center"
}

const ALL_CAMPOS: Record<string, CampoDef> = {
  nombres: {
    key: "nombres",
    label: "NOMBRES",
    width: 36,
    value: (e) => (e.nombres || "—").toUpperCase(),
    align: "left",
  },
  apellidos: {
    key: "apellidos",
    label: "APELLIDOS",
    width: 36,
    value: (e) => (e.apellidos || "—").toUpperCase(),
    align: "left",
  },
  cedula: {
    key: "cedula",
    label: "CÉDULA",
    width: 26,
    value: (e) => (e.cedula || "—").toUpperCase(),
    align: "center",
  },
  correo: {
    key: "correo",
    label: "CORREO",
    width: 48,
    value: (e) => (e.correo || "—").toLowerCase(),
    align: "left",
  },
  telefono: {
    key: "telefono",
    label: "TELÉFONO",
    width: 26,
    value: (e) => (e.telefono || "—").toUpperCase(),
    align: "center",
  },
  ciudad: {
    key: "ciudad",
    label: "CIUDAD",
    width: 30,
    value: (e) => (e.ciudad || "—").toUpperCase(),
    align: "center",
  },
  direccion: {
    key: "direccion",
    label: "DIRECCIÓN",
    width: 40,
    value: (e) => (e.direccion || "—").toUpperCase(),
    align: "left",
  },
  ocupacion: {
    key: "ocupacion",
    label: "OCUPACIÓN",
    width: 32,
    value: (e) => (e.ocupacion || "—").toUpperCase(),
    align: "center",
  },
  estado_financiero: {
    key: "estado_financiero",
    label: "ESTADO",
    width: 28,
    value: (e) => {
      const v = (e.estado_financiero || "").toLowerCase()
      if (v === "al_dia" || v === "al día") return "AL DÍA"
      if (v === "deudor" || v === "pendiente") return "PENDIENTE"
      if (v === "abonado") return "ABONADO"
      if (v === "ninguno" || v === "sin cursos") return "SIN CURSOS"
      return (e.estado_financiero || "—").toUpperCase()
    },
    align: "center",
  },
  saldo: {
    key: "saldo",
    label: "SALDO",
    width: 24,
    value: (e) => (e.saldo != null ? `$${Number(e.saldo).toFixed(2)}` : "—"),
    align: "center",
  },
  total_cursos: {
    key: "total_cursos",
    label: "TOTAL CURSOS",
    width: 26,
    value: (e) => (e.total_cursos != null ? String(e.total_cursos) : "—"),
    align: "center",
  },
  fecha_inscripcion: {
    key: "fecha_inscripcion",
    label: "FECHA INSCRIPCIÓN",
    width: 34,
    value: (e) => (e.fecha_inscripcion || "—").toUpperCase(),
    align: "center",
  },
}

const CAMPOS_POR_CONTEXTO: Record<Contexto, string[]> = {
  todos: [
    "nombres",
    "apellidos",
    "cedula",
    "correo",
    "telefono",
    "ciudad",
    "direccion",
    "ocupacion",
    "estado_financiero",
    "saldo",
    "total_cursos",
  ],
  curso: [
    "nombres",
    "apellidos",
    "cedula",
    "correo",
    "telefono",
    "ciudad",
    "estado_financiero",
    "saldo",
    "fecha_inscripcion",
  ],
  taller: [
    "nombres",
    "apellidos",
    "cedula",
    "correo",
    "telefono",
    "ciudad",
    "ocupacion",
    "estado_financiero",
    "fecha_inscripcion",
  ],
  ciudad: [
    "nombres",
    "apellidos",
    "cedula",
    "correo",
    "telefono",
    "ciudad",
    "estado_financiero",
    "saldo",
    "total_cursos",
  ],
}

function getContextLabel(contexto: Contexto): { entityLabel: string; subtitle: string; tableTitle: string } {
  switch (contexto) {
    case "curso":
      return { entityLabel: "CURSO:", subtitle: "LISTADO OFICIAL DE ESTUDIANTES", tableTitle: "ALUMNOS MATRICULADOS" }
    case "taller":
      return { entityLabel: "TALLER:", subtitle: "LISTADO OFICIAL DE PARTICIPANTES", tableTitle: "PARTICIPANTES INSCRITOS" }
    case "ciudad":
      return { entityLabel: "CIUDAD:", subtitle: "LISTADO DE ESTUDIANTES POR SEDE", tableTitle: "ESTUDIANTES REGISTRADOS" }
    case "todos":
    default:
      return { entityLabel: "REPORTE:", subtitle: "LISTADO GENERAL DE ESTUDIANTES", tableTitle: "ESTUDIANTES REGISTRADOS" }
  }
}

export function getCamposPorContexto(contexto: Contexto): string[] {
  return CAMPOS_POR_CONTEXTO[contexto] || CAMPOS_POR_CONTEXTO.todos
}

export async function generarListadoEstudiantesPDF(
  contexto: Contexto,
  entityInfo: EntityInfoPDF,
  estudiantes: EstudiantePDF[],
  selectedKeys: string[]
) {
  const campos = selectedKeys.map((key) => ALL_CAMPOS[key]).filter(Boolean)
  if (campos.length === 0) return

  const numCol = 1 + campos.length // N° + data columns
  const orientation = numCol <= 6 ? "portrait" : "landscape"
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" })
  const pageW = orientation === "portrait" ? 210 : 297
  const margin = 12
  const contentW = pageW - 2 * margin

  // Calculate proportional column widths to fit contentW perfectly
  const rawWidths: number[] = [9] // N° column
  for (const c of campos) {
    rawWidths.push(c.width)
  }
  const totalRawW = rawWidths.reduce((a, b) => a + b, 0)
  const factor = contentW / totalRawW
  const colWidths = rawWidths.map((w) => w * factor)
  const tableW = contentW

  const colX: number[] = []
  let cx = margin
  for (const w of colWidths) {
    colX.push(cx)
    cx += w
  }

  const rowH = 6.8
  const headerH = 7.5
  const ctxLabels = getContextLabel(contexto)
  const fechaImpresion = formatDate(new Date())

  function drawTableHeader(y: number) {
    doc.setFillColor(...PRIMARY_RGB)
    doc.rect(margin, y, tableW, headerH, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...WHITE_RGB)

    doc.text("N°", colX[0] + colWidths[0] / 2, y + 4.8, { align: "center" })

    for (let i = 0; i < campos.length; i++) {
      const ci = i + 1
      const lbl = campos[i].label.toUpperCase()
      if (campos[i].align === "left") {
        doc.text(lbl, colX[ci] + 2, y + 4.8)
      } else {
        doc.text(lbl, colX[ci] + colWidths[ci] / 2, y + 4.8, { align: "center" })
      }
    }

    doc.setDrawColor(...WHITE_RGB)
    doc.setLineWidth(0.15)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + headerH)
    }
  }

  // Header banner
  try {
    const logoImg = await loadImage("/Logo_PDF.png")
    doc.addImage(logoImg, "PNG", margin, 7, 20, 16)
  } catch {
    /* non-critical */
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 14, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_RGB)
  doc.text(ctxLabels.subtitle, pageW / 2, 21, { align: "center" })

  doc.setDrawColor(...ACCENT_RGB)
  doc.setLineWidth(0.6)
  doc.line(margin, 25, pageW - margin, 25)

  // Info box
  let y = 30
  const infoBoxH = 15
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, infoBoxH)

  doc.setFontSize(8)
  doc.setTextColor(...TEXT_RGB)

  doc.setFont("helvetica", "bold")
  doc.text(ctxLabels.entityLabel, margin + 4, y + 6)
  const lw = doc.getTextWidth(ctxLabels.entityLabel)
  doc.setFont("helvetica", "normal")
  doc.text(entityInfo.nombre.toUpperCase(), margin + 4 + lw + 2, y + 6)

  doc.setFont("helvetica", "bold")
  const totalLabel = "TOTAL REGISTROS:"
  doc.text(totalLabel, margin + 4, y + 11.5)
  doc.setFont("helvetica", "normal")
  doc.text(`${entityInfo.total}`, margin + 4 + doc.getTextWidth(totalLabel) + 2, y + 11.5)

  if (entityInfo.instructor) {
    doc.setFont("helvetica", "bold")
    const insLabel = "DOCENTE / INSTRUCTOR:"
    const rx = margin + contentW / 2 + 4
    doc.text(insLabel, rx, y + 6)
    doc.setFont("helvetica", "normal")
    doc.text(entityInfo.instructor.toUpperCase(), rx + doc.getTextWidth(insLabel) + 2, y + 6)
  }

  if (entityInfo.fecha) {
    const rx = margin + contentW / 2 + 4
    doc.setFont("helvetica", "bold")
    const fechaLabel = "FECHA:"
    doc.text(fechaLabel, rx, y + 11.5)
    doc.setFont("helvetica", "normal")
    doc.text(entityInfo.fecha.toUpperCase(), rx + doc.getTextWidth(fechaLabel) + 2, y + 11.5)
  }

  // Table title
  y = y + infoBoxH + 5
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_RGB)
  doc.text(ctxLabels.tableTitle, margin, y)
  y += 2.5
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.4)
  doc.line(margin, y, margin + contentW, y)
  y += 4

  drawTableHeader(y)
  y += headerH

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(...TEXT_RGB)

  if (estudiantes.length === 0) {
    doc.setFillColor(...GRAY_ROW_RGB)
    doc.rect(margin, y, tableW, rowH * 2, "F")
    doc.setDrawColor(...BORDER_RGB)
    doc.rect(margin, y, tableW, rowH * 2, "S")
    doc.setFont("helvetica", "italic")
    doc.setTextColor(...MUTED_RGB)
    doc.text("No se encontraron registros para exportar.", margin + tableW / 2, y + rowH + 1, {
      align: "center",
    })
  } else {
    for (let i = 0; i < estudiantes.length; i++) {
      const maxY = orientation === "portrait" ? 275 : 188
      if (y + rowH > maxY) {
        doc.addPage()
        y = 15
        drawTableHeader(y)
        y += headerH
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.5)
        doc.setTextColor(...TEXT_RGB)
      }

      const e = estudiantes[i]
      const num = i + 1

      if (i % 2 === 0) {
        doc.setFillColor(...GRAY_ROW_RGB)
        doc.rect(margin, y, tableW, rowH, "F")
      }

      doc.setTextColor(...TEXT_RGB)
      doc.text(`${num}`, colX[0] + colWidths[0] / 2, y + 4.6, { align: "center" })

      for (let j = 0; j < campos.length; j++) {
        const ci = j + 1
        const maxCellW = colWidths[ci] - 3
        let val = campos[j].value(e) || "—"

        // Ellipsis truncation for wide text
        if (doc.getTextWidth(val) > maxCellW) {
          while (val.length > 2 && doc.getTextWidth(val + "…") > maxCellW) {
            val = val.slice(0, -1)
          }
          val = val + "…"
        }

        if (campos[j].align === "left") {
          doc.text(val, colX[ci] + 2, y + 4.6)
        } else {
          doc.text(val, colX[ci] + colWidths[ci] / 2, y + 4.6, { align: "center" })
        }
      }

      doc.setDrawColor(...BORDER_RGB)
      doc.setLineWidth(0.15)
      for (let c = 1; c < colX.length; c++) {
        doc.line(colX[c], y, colX[c], y + rowH)
      }
      doc.line(margin, y + rowH, margin + tableW, y + rowH)

      y += rowH
    }
  }

  // Footer on all pages
  const totalPagesCount = doc.getNumberOfPages()
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i)
    const footerY = orientation === "portrait" ? 284 : 198
    doc.setDrawColor(...FOOTER_LINE_RGB)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY, pageW - margin, footerY)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...FOOTER_TEXT_RGB)
    doc.text(
      `Comunikate Academy  |  Página ${i} de ${totalPagesCount}  |  Generado: ${fechaImpresion}`,
      margin,
      footerY + 5
    )
  }

  const safeName = (entityInfo.nombre || contexto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
  doc.save(`listado_${contexto}_${safeName}.pdf`)
}
