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

export interface DatosPagoEstudiantePDF {
  nombres: string
  apellidos: string
  ciudad: string
  totalPagar: number
  totalAbonado: number
}

export interface DatosPagosCursoInfo {
  nombre: string
  instructor?: string
  ciudad?: string
  horario?: string
  fecha_inicio?: string
  fecha_fin?: string
}

export interface DatosPagosCursoPDF {
  info: DatosPagosCursoInfo
  estudiantes: DatosPagoEstudiantePDF[]
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

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export async function generarReportePagosCursoPDF(data: DatosPagosCursoPDF) {
  const _doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = _doc as any
  const margin = 14
  const pageW = 210
  const pageH = 297
  const contentW = pageW - 2 * margin
  const fechaImpresion = formatDate(new Date())

  // Logo
  try {
    const logoImg = await loadImage("/Logo_PDF.png")
    doc.addImage(logoImg, "PNG", margin, 8, 22, 18)
  } catch {
    // logo opcional
  }

  // Encabezado
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(...PRIMARY_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 16, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_RGB)
  doc.text("REPORTE DE PAGOS DE ESTUDIANTES", pageW / 2, 22, { align: "center" })

  // Línea divisoria de acento
  doc.setDrawColor(...ACCENT_RGB)
  doc.setLineWidth(0.6)
  doc.line(margin, 27, pageW - margin, 27)

  // Caja de Datos Generales
  let y = 33
  const infoHeaderH = 6
  doc.setFillColor(...PRIMARY_RGB)
  doc.rect(margin, y, contentW, infoHeaderH, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...WHITE_RGB)
  doc.text("DATOS DEL CURSO", margin + 4, y + 4)
  y += infoHeaderH

  const infoRows = [
    [
      { label: "Curso:", val: data.info.nombre || "—" },
      { label: "Ciudad:", val: data.info.ciudad || "—" },
    ],
    [
      { label: "Instructor:", val: data.info.instructor || "—" },
      { label: "Horario:", val: data.info.horario || "—" },
    ],
    [
      { label: "Fecha Inicio:", val: formatDateShort(data.info.fecha_inicio) },
      { label: "Fecha Fin:", val: formatDateShort(data.info.fecha_fin) },
    ],
  ]

  const infoBoxH = infoRows.length * 5.5 + 2
  doc.setFillColor(...GRAY_ROW_RGB)
  doc.rect(margin, y, contentW, infoBoxH, "F")
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.2)
  doc.rect(margin, y - infoHeaderH, contentW, infoHeaderH + infoBoxH, "S")

  let iy = y + 4.5
  for (const r of infoRows) {
    const colW = contentW / 2
    let ix = margin + 4

    for (const c of r) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(...PRIMARY_RGB)
      doc.text(c.label, ix, iy)

      const labelW = doc.getTextWidth(c.label)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...TEXT_RGB)
      doc.text(c.val, ix + labelW + 2, iy)

      ix += colW
    }
    iy += 5.5
  }

  y += infoBoxH + 6

  // Tabla autotable
  const tableHead = [["N°", "Apellidos y Nombres", "Ciudad", "Total a pagar", "Total abonado", "Monto Registrado / Firma"]]

  const tableBody = data.estudiantes.map((est, idx) => {
    const apellidosNombres = `${est.apellidos || ""} ${est.nombres || ""}`.trim() || "—"
    return [
      (idx + 1).toString(),
      apellidosNombres,
      est.ciudad || "—",
      `$${(est.totalPagar || 0).toFixed(2)}`,
      `$${(est.totalAbonado || 0).toFixed(2)}`,
      "", // Columna en blanco para anotación manual
    ]
  })

  doc.autoTable({
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin, bottom: 16 },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: TEXT_RGB,
      lineColor: BORDER_RGB,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: PRIMARY_RGB,
      textColor: WHITE_RGB,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 55, halign: "left" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 39, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: GRAY_ROW_RGB,
    },
    didDrawPage: (hookData: { pageNumber: number }) => {
      // Pie de página
      const pageCount = doc.internal.getNumberOfPages()
      const currentPage = hookData.pageNumber

      doc.setDrawColor(...FOOTER_LINE_RGB)
      doc.setLineWidth(0.3)
      doc.line(margin, pageH - 12, pageW - margin, pageH - 12)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...FOOTER_TEXT_RGB)
      doc.text(`Impreso el ${fechaImpresion}`, margin, pageH - 7)
      doc.text(`Página ${currentPage} de ${pageCount}`, pageW - margin, pageH - 7, { align: "right" })
    },
  })

  const safeName = (data.info.nombre || "curso").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()
  doc.save(`reporte-pagos-${safeName}.pdf`)
}
