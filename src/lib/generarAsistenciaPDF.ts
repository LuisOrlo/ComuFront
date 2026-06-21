import { jsPDF } from "jspdf"

const ACCENT_RGB = [214, 98, 0] // approximate COLORS.ACCENT in RGB

export function generarListadoAsistenciaPDF(
  nombreCurso: string,
  horario: string,
  estudiantes: string[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 14
  let y = 20

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...ACCENT_RGB as [number, number, number])
  doc.text(nombreCurso, margin, y)
  y += 9

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(horario, margin, y)
  y += 6
  doc.setTextColor(100, 100, 100)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })}`, margin, y)
  y += 12

  const colW = [116, 20, 20, 20]
  const colX = [margin, margin + colW[0], margin + colW[0] + colW[1], margin + colW[0] + colW[1] + colW[2]]
  const headers = ["Nombre y Apellido", "P", "A", "T"]
  const rowH = 8
  const headerH = 8

  // Header row with accent color
  doc.setFillColor(...ACCENT_RGB as [number, number, number])
  doc.rect(margin, y, colW.reduce((a, b) => a + b, 0), headerH, "F")
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  // Nombre y Apellido left-aligned
  doc.text(headers[0], colX[0] + 2, y + 5.5)
  // P, A, T centered
  for (let i = 1; i < headers.length; i++) {
    doc.text(headers[i], colX[i] + colW[i] / 2, y + 5.5, { align: "center" })
  }
  y += headerH

  // Student rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(40, 40, 40)
  estudiantes.forEach((nombre, idx) => {
    if (y + rowH > 272) {
      doc.addPage()
      y = 20
      doc.setFillColor(...ACCENT_RGB as [number, number, number])
      doc.rect(margin, y, colW.reduce((a, b) => a + b, 0), headerH, "F")
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text(headers[0], colX[0] + 2, y + 5.5)
      for (let i = 1; i < headers.length; i++) {
        doc.text(headers[i], colX[i] + colW[i] / 2, y + 5.5, { align: "center" })
      }
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      y += headerH
    }
    if (idx % 2 === 0) {
      doc.setFillColor(252, 248, 245)
      doc.rect(margin, y, colW.reduce((a, b) => a + b, 0), rowH, "F")
    }
    doc.text(nombre, colX[0] + 2, y + 6.2)
    // Draw separators
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.1)
    for (let c = 1; c < colX.length; c++) {
      doc.line(colX[c], y, colX[c], y + rowH)
    }
    doc.line(margin, y + rowH, margin + colW.reduce((a, b) => a + b, 0), y + rowH)
    y += rowH
  })

  // Legend
  y += 4
  doc.setFontSize(8)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(120, 120, 120)
  doc.text("P = Presente    A = Ausente    T = Tardanza", margin, y)

  const safeName = nombreCurso.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, "").trim()
  doc.save(`listado-asistencia-${safeName}.pdf`)
}
