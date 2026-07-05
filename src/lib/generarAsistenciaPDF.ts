import { jsPDF } from "jspdf"

const ACCENT_RGB: [number, number, number] = [232, 148, 0]
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

export async function generarListadoAsistenciaPDF(
  nombreCurso: string,
  horario: string,
  estudiantes: string[],
  instructor?: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 14
  const pageW = 210
  const contentW = pageW - 2 * margin
  const fechaImpresion = formatDate(new Date())

  // Column layout: N° | Nombre | P | A | T | Firma
  const colW = [14, 94, 12, 12, 12, 38]
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
    doc.setFillColor(...ACCENT_RGB)
    doc.rect(margin, y, tableW, headerH, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...WHITE_RGB)

    const hdrs = ["N°", "Nombre del participante", "P", "A", "T", "Firma"]
    for (let i = 0; i < hdrs.length; i++) {
      if (i === 1) {
        doc.text(hdrs[i], colX[i] + 2, y + 5)
      } else {
        doc.text(hdrs[i], colX[i] + colW[i] / 2, y + 5, { align: "center" })
      }
    }

    // Separators in header
    doc.setDrawColor(...WHITE_RGB)
    doc.setLineWidth(0.15)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + headerH)
    }
  }

  // ── Top orange band ──
  doc.setFillColor(...ACCENT_RGB)
  doc.rect(0, 0, pageW, 36, "F")

  try {
    const logoImg = await loadImage("/Logo_PDF.png")
    doc.addImage(logoImg, "PNG", margin, 7, 25, 20)
  } catch {
    // logo non-critical
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(...WHITE_RGB)
  doc.text("COMUNIKATE ACADEMY", pageW / 2, 16, { align: "center" })

  doc.setFontSize(11)
  doc.text("LISTADO DE ASISTENCIA", pageW / 2, 27, { align: "center" })

  // ── Info box (2 columns) ──
  let y = 42
  const infoBoxH = 24
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, infoBoxH)

  const colMid = contentW / 2
  const leftCol = [
    { label: "Curso:", value: nombreCurso },
    { label: "Horario:", value: horario },
  ]
  const rightCol = [
    { label: "Instructor:", value: instructor || "—" },
    { label: "Participantes:", value: `${estudiantes.length}` },
    { label: "Fecha:", value: fechaImpresion },
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

  // ── Table title ──
  y = y + infoBoxH + 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_RGB)
  doc.text("LISTADO DE PARTICIPANTES", margin, y)
  y += 3
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentW, y)
  y += 5

  // ── Table header ──
  drawTableHeader(y)
  y += headerH

  // ── Student rows ──
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...TEXT_RGB)

  estudiantes.forEach((nombre, idx) => {
    if (y + rowH > 268) {
      doc.addPage()
      y = 20
      drawTableHeader(y)
      y += headerH
    }

    const num = idx + 1

    if (idx % 2 === 0) {
      doc.setFillColor(...GRAY_ROW_RGB)
      doc.rect(margin, y, tableW, rowH, "F")
    }

    // N°
    doc.setTextColor(...TEXT_RGB)
    doc.text(`${num}`, colX[0] + colW[0] / 2, y + 5, { align: "center" })

    // Name
    doc.text(nombre, colX[1] + 2, y + 5)

    // Checkboxes for P, A, T
    doc.setDrawColor(...MUTED_RGB)
    doc.setLineWidth(0.3)
    const cbSize = 4
    for (let c = 2; c <= 4; c++) {
      const cbx = colX[c] + (colW[c] - cbSize) / 2
      const cby = y + (rowH - cbSize) / 2
      doc.rect(cbx, cby, cbSize, cbSize)
    }

    // Firma underline
    doc.setDrawColor(...BORDER_RGB)
    doc.setLineWidth(0.3)
    const fx = colX[5] + 2
    const fy = y + rowH / 2 + 0.5
    doc.line(fx, fy, colX[5] + colW[5] - 2, fy)

    // Column separators
    doc.setDrawColor(...BORDER_RGB)
    doc.setLineWidth(0.2)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + rowH)
    }

    // Bottom border
    doc.line(margin, y + rowH, margin + tableW, y + rowH)

    y += rowH
  })

  // ── Legend box ──
  y += 6
  const legendH = 18
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, legendH)

  doc.setFontSize(8)
  doc.setTextColor(...TEXT_RGB)
  const legendItems = [
    { label: "P", desc: "Presente" },
    { label: "A", desc: "Ausente" },
    { label: "T", desc: "Tardanza" },
  ]

  let ly = y + 5
  for (const item of legendItems) {
    doc.setDrawColor(...MUTED_RGB)
    doc.setLineWidth(0.3)
    doc.rect(margin + 5, ly - 2.5, 4, 4)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...TEXT_RGB)
    doc.text(item.label, margin + 12, ly + 0.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...TEXT_RGB)
    doc.text(item.desc, margin + 18, ly + 0.5)
    ly += 5.5
  }

  // ── Observations ──
  y = y + legendH + 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_RGB)
  doc.text("Observaciones", margin, y)
  y += 5

  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.2)
  for (let i = 0; i < 3; i++) {
    doc.line(margin, y, margin + contentW, y)
    y += 7
  }

  // ── Signature ──
  y += 4
  const sigX = margin + contentW - 50
  doc.setDrawColor(...BORDER_RGB)
  doc.setLineWidth(0.5)
  doc.line(sigX, y, sigX + 50, y)
  y += 3
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...MUTED_RGB)
  doc.text("Firma del Instructor", sigX + 25, y, { align: "center" })

  // ── Footer on each page (second pass) ──
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

  const safeName = nombreCurso.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "").trim()
  doc.save(`listado-asistencia-${safeName}.pdf`)
}
