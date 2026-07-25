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
    key: "nombres", label: "NOMBRES", width: 38,
    value: (e) => e.nombres.toUpperCase(),
    align: "left",
  },
  apellidos: {
    key: "apellidos", label: "APELLIDOS", width: 38,
    value: (e) => e.apellidos.toUpperCase(),
    align: "left",
  },
  cedula: {
    key: "cedula", label: "CÉDULA", width: 28,
    value: (e) => (e.cedula || "—").toUpperCase(),
    align: "center",
  },
  correo: {
    key: "correo", label: "CORREO", width: 50,
    value: (e) => (e.correo || "—").toUpperCase(),
    align: "left",
  },
  telefono: {
    key: "telefono", label: "TELÉFONO", width: 26,
    value: (e) => (e.telefono || "—").toUpperCase(),
    align: "center",
  },
  ciudad: {
    key: "ciudad", label: "CIUDAD", width: 36,
    value: (e) => (e.ciudad || "—").toUpperCase(),
    align: "center",
  },
  direccion: {
    key: "direccion", label: "DIRECCIÓN", width: 40,
    value: (e) => (e.direccion || "—").toUpperCase(),
    align: "left",
  },
  ocupacion: {
    key: "ocupacion", label: "OCUPACIÓN", width: 36,
    value: (e) => (e.ocupacion || "—").toUpperCase(),
    align: "center",
  },
  estado_financiero: {
    key: "estado_financiero", label: "ESTADO FINANCIERO", width: 36,
    value: (e) => {
      const map: Record<string, string> = { deudor: "DEUDOR", abonado: "ABONADO", al_dia: "AL DÍA", ninguno: "—" }
      return (map[e.estado_financiero ?? ""] ?? "—").toUpperCase()
    },
    align: "center",
  },
  saldo: {
    key: "saldo", label: "SALDO", width: 26,
    value: (e) => e.saldo != null ? `$${Number(e.saldo).toFixed(2)}` : "—",
    align: "center",
  },
  total_cursos: {
    key: "total_cursos", label: "TOTAL CURSOS", width: 26,
    value: (e) => e.total_cursos != null ? String(e.total_cursos) : "—",
    align: "center",
  },
  fecha_inscripcion: {
    key: "fecha_inscripcion", label: "FECHA INSCRIPCIÓN", width: 44,
    value: (e) => (e.fecha_inscripcion || "—").toUpperCase(),
    align: "center",
  },
}

const CAMPOS_POR_CONTEXTO: Record<Contexto, string[]> = {
  todos: ["nombres", "apellidos", "cedula", "correo", "telefono", "direccion", "ocupacion", "estado_financiero", "saldo", "total_cursos"],
  curso: ["nombres", "apellidos", "cedula", "correo", "telefono", "estado_financiero", "saldo", "total_cursos"],
  taller: ["nombres", "apellidos", "cedula", "telefono", "ciudad", "ocupacion", "fecha_inscripcion"],
  ciudad: ["nombres", "apellidos", "cedula", "correo", "telefono", "direccion", "ocupacion", "estado_financiero", "total_cursos"],
}

function getContextLabel(contexto: Contexto): { entityLabel: string; subtitle: string; tableTitle: string } {
  switch (contexto) {
    case "curso":
      return { entityLabel: "CURSO:", subtitle: "LISTADO DE ESTUDIANTES", tableTitle: "ESTUDIANTES MATRICULADOS" }
    case "taller":
      return { entityLabel: "TALLER:", subtitle: "LISTADO DE PARTICIPANTES", tableTitle: "PARTICIPANTES INSCRITOS" }
    case "ciudad":
      return { entityLabel: "CIUDAD:", subtitle: "LISTADO DE ESTUDIANTES", tableTitle: "ESTUDIANTES POR CIUDAD" }
    case "todos":
    default:
      return { entityLabel: "FILTRO:", subtitle: "LISTADO DE ESTUDIANTES", tableTitle: "ESTUDIANTES" }
  }
}

export function getCamposPorContexto(contexto: Contexto): string[] {
  return CAMPOS_POR_CONTEXTO[contexto]
}

export async function generarListadoEstudiantesPDF(
  contexto: Contexto,
  entityInfo: EntityInfoPDF,
  estudiantes: EstudiantePDF[],
  selectedKeys: string[],
) {
  const campos = selectedKeys
    .map(key => ALL_CAMPOS[key])
    .filter(Boolean)

  if (campos.length === 0) return

  const ITEMS_PER_PAGE = 28
  const numCol = 1 + campos.length // N° + data columns

  const colWidths: number[] = [10]
  for (const c of campos) colWidths.push(c.width)

  const orientation = numCol <= 6 ? "portrait" : "landscape"
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" })
  const pageW = orientation === "portrait" ? 210 : 297
  const margin = 14
  const contentW = pageW - 2 * margin

  const colX: number[] = []
  let cx = margin
  for (const w of colWidths) { colX.push(cx); cx += w }
  const tableW = colWidths.reduce((a, b) => a + b, 0)
  const rowH = 7
  const headerH = 8

  const ctxLabels = getContextLabel(contexto)
  const fechaImpresion = formatDate(new Date())

  function drawTableHeader(y: number) {
    doc.setFillColor(...PRIMARY_RGB)
    doc.rect(margin, y, tableW, headerH, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...WHITE_RGB)

    doc.text("N°", colX[0] + colWidths[0] / 2, y + 5, { align: "center" })

    for (let i = 0; i < campos.length; i++) {
      const ci = i + 1
      const lbl = campos[i].label.toUpperCase()
      if (campos[i].align === "left") {
        doc.text(lbl, colX[ci] + 2, y + 5)
      } else {
        doc.text(lbl, colX[ci] + colWidths[ci] / 2, y + 5, { align: "center" })
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
  } catch { /* non-critical */ }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 17, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED_RGB)
  doc.text(ctxLabels.subtitle, pageW / 2, 24, { align: "center" })

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
  doc.text(ctxLabels.entityLabel, margin + 4, y + 7)
  const lw = doc.getTextWidth(ctxLabels.entityLabel)
  doc.setFont("helvetica", "normal")
  doc.text(entityInfo.nombre.toUpperCase(), margin + 4 + lw + 2, y + 7)

  doc.setFont("helvetica", "bold")
  const totalLabel = "TOTAL:"
  doc.text(totalLabel, margin + 4, y + 14)
  doc.setFont("helvetica", "normal")
  doc.text(`${entityInfo.total}`, margin + 4 + doc.getTextWidth(totalLabel) + 2, y + 14)

  if (entityInfo.instructor) {
    doc.setFont("helvetica", "bold")
    const insLabel = "INSTRUCTOR:"
    const rx = margin + contentW / 2 + 4
    doc.text(insLabel, rx, y + 7)
    doc.setFont("helvetica", "normal")
    doc.text(entityInfo.instructor.toUpperCase(), rx + doc.getTextWidth(insLabel) + 2, y + 7)
  }

  if (entityInfo.fecha) {
    const rx = margin + contentW / 2 + 4
    doc.setFont("helvetica", "bold")
    const fechaLabel = "FECHA:"
    doc.text(fechaLabel, rx, y + 14)
    doc.setFont("helvetica", "normal")
    doc.text(entityInfo.fecha.toUpperCase(), rx + doc.getTextWidth(fechaLabel) + 2, y + 14)
  }

  // -- Table title --
  y = y + infoBoxH + 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_RGB)
  doc.text(ctxLabels.tableTitle, margin, y)
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

  const totalPages = Math.ceil(estudiantes.length / ITEMS_PER_PAGE)
  let itemIndex = 0

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage()
      y = 20
      drawTableHeader(y)
      y += headerH
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_RGB)
    }

    const start = page * ITEMS_PER_PAGE
    const end = Math.min(start + ITEMS_PER_PAGE, estudiantes.length)

    for (let i = start; i < end; i++) {
      const maxY = orientation === "portrait" ? 278 : 190
      if (y + rowH > maxY) {
        doc.addPage()
        y = 20
        drawTableHeader(y)
        y += headerH
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(...TEXT_RGB)
      }

      const e = estudiantes[i]
      const num = itemIndex + 1

      if (i % 2 === 0) {
        doc.setFillColor(...GRAY_ROW_RGB)
        doc.rect(margin, y, tableW, rowH, "F")
      }

      doc.setTextColor(...TEXT_RGB)
      doc.text(`${num}`, colX[0] + colWidths[0] / 2, y + 5, { align: "center" })

      for (let j = 0; j < campos.length; j++) {
        const ci = j + 1
        const val = campos[j].value(e)
        if (campos[j].align === "left") {
          doc.text(val, colX[ci] + 2, y + 5)
        } else {
          doc.text(val, colX[ci] + colWidths[ci] / 2, y + 5, { align: "center" })
        }
      }

      doc.setDrawColor(...BORDER_RGB)
      doc.setLineWidth(0.2)
      for (let c = 1; c < colX.length; c++) {
        doc.line(colX[c], y, colX[c], y + rowH)
      }
      doc.line(margin, y + rowH, margin + tableW, y + rowH)

      y += rowH
      itemIndex++
    }
  }

  // -- Footer on all pages --
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i)
    const footerY = orientation === "portrait" ? 285 : 200
    doc.setDrawColor(...FOOTER_LINE_RGB)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY, pageW - margin, footerY)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...FOOTER_TEXT_RGB)
    doc.text(
      `Comunikate  |  Página ${i} de ${doc.getNumberOfPages()}  |  Generado: ${fechaImpresion}`,
      margin,
      footerY + 6,
    )
  }

  const safeName = entityInfo.nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
  doc.save(`listado-${contexto}-${safeName}.pdf`)
}
