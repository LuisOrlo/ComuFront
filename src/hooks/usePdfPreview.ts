import { useCallback, useEffect, useRef, useState } from "react"
import type { PdfPreviewResult } from "@/lib/pdfPreview"

interface PdfPreviewState {
  isOpen: boolean
  url: string
  titulo: string
  nombreArchivo: string
}

const ESTADO_INICIAL: PdfPreviewState = {
  isOpen: false,
  url: "",
  titulo: "",
  nombreArchivo: "",
}

/**
 * Centraliza el estado del visor de PDF y libera la URL temporal (blob:)
 * al cerrar el modal o al desmontar el componente.
 */
export function usePdfPreview() {
  const [preview, setPreview] = useState<PdfPreviewState>(ESTADO_INICIAL)
  const urlRef = useRef<string | null>(null)

  const liberarUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  const abrirPreview = useCallback(
    (resultado: PdfPreviewResult, titulo: string) => {
      liberarUrl()
      urlRef.current = resultado.url
      setPreview({
        isOpen: true,
        url: resultado.url,
        titulo,
        nombreArchivo: resultado.nombreArchivo,
      })
    },
    [liberarUrl],
  )

  const cerrarPreview = useCallback(() => {
    setPreview(ESTADO_INICIAL)
    liberarUrl()
  }, [liberarUrl])

  useEffect(() => liberarUrl, [liberarUrl])

  return { preview, abrirPreview, cerrarPreview }
}
