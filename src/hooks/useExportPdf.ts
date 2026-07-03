import jsPDF from "jspdf"
import "jspdf-autotable"
import html2canvas from "html2canvas"

async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })
}

export async function exportarEstadisticasPDF(
  seccionesRef: React.MutableRefObject<Map<string, HTMLDivElement>>
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2
  let y = margin

  const titulo = "Estadísticas Financieras"
  pdf.setFontSize(16)
  pdf.setTextColor(30, 41, 59)
  pdf.text(titulo, margin, y + 6)
  pdf.setFontSize(8)
  pdf.setTextColor(120, 120, 140)
  pdf.text(new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }), margin, y + 12)
  y += 22

  const secciones = [
    { key: "resumen", title: "Resumen Ejecutivo" },
    { key: "flujo", title: "Flujo Financiero" },
    { key: "composicion", title: "Composición de Ingresos" },
    { key: "catalogo", title: "Rendimiento por Catálogo" },
    { key: "geografica", title: "Distribución Geográfica" },
    { key: "modalidad", title: "Comparativa por Modalidad" },
    { key: "retencion", title: "Retención y Fidelización" },
    { key: "cobranza", title: "Estado de Cobranza" },
    { key: "servicios", title: "Actividad de Servicios" },
  ]

  for (const seccion of secciones) {
    const el = seccionesRef.current.get(seccion.key)
    if (!el) continue

    if (y + 20 > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }

    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 100)
    pdf.text(seccion.title, margin, y + 5)
    y += 8

    try {
      const canvas = await captureElement(el)
      const imgData = canvas.toDataURL("image/png")
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (y + imgHeight > pageHeight - margin) {
        pdf.addPage()
        y = margin
        pdf.setFontSize(10)
        pdf.setTextColor(80, 80, 100)
        pdf.text(seccion.title + " (cont.)", margin, y + 5)
        y += 8
      }

      let sliceImgHeight = imgHeight
      if (y + imgHeight > pageHeight - margin) {
        sliceImgHeight = usableHeight - y
      }
      if (sliceImgHeight < 10) {
        pdf.addPage()
        y = margin
        sliceImgHeight = Math.min(imgHeight, usableHeight)
      }

      pdf.addImage({
        imageData: imgData,
        format: "PNG",
        x: margin,
        y,
        width: imgWidth,
        height: sliceImgHeight,
      })
      y += sliceImgHeight + 5
    } catch {
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 160)
      pdf.text("(No se pudo renderizar esta sección)", margin, y + 4)
      y += 10
    }
  }

  pdf.save(`estadisticas-${new Date().toISOString().split("T")[0]}.pdf`)
}
