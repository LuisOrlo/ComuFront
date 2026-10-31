import type { jsPDF } from "jspdf"

export interface PdfPreviewResult {
  /** URL temporal (blob:) para mostrar el PDF en el visor. */
  url: string
  nombreArchivo: string
}

export interface PdfGeneracionOpciones {
  /** Si es true no descarga: devuelve la URL para previsualizar el PDF. */
  preview?: boolean
}

/**
 * Cierra la generación de un PDF: lo descarga (comportamiento por defecto)
 * o devuelve una URL temporal para previsualizarlo antes de descargar.
 */
export function finalizarPDF(
  doc: jsPDF,
  nombreArchivo: string,
  opciones?: PdfGeneracionOpciones,
): PdfPreviewResult | void {
  if (opciones?.preview) {
    return { url: String(doc.output("bloburl")), nombreArchivo }
  }
  doc.save(nombreArchivo)
}
