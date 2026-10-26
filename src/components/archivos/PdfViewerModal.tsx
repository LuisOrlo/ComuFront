import { X, Download, ExternalLink } from "lucide-react"
import { documentosService } from "@/services/documentos.service"

interface PdfViewerModalProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  url: string
  documentoId?: string
  nombreArchivo?: string
}

export function PdfViewerModal({
  isOpen,
  onClose,
  titulo,
  url,
  documentoId,
  nombreArchivo,
}: PdfViewerModalProps) {
  if (!isOpen || !url) return null

  const handleDescargar = () => {
    if (documentoId) {
      documentosService.forzarDescarga(documentoId, nombreArchivo || `${titulo}.pdf`)
    } else {
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", nombreArchivo || `${titulo}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Cabecera del visor */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <span className="flex items-center justify-center size-8 rounded-lg bg-red-100 text-red-600 font-bold text-xs shrink-0">
              PDF
            </span>
            <h3 className="font-semibold text-gray-800 text-sm truncate" title={titulo}>
              {titulo}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-xs"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Pestaña nueva</span>
            </a>
            <button
              type="button"
              onClick={handleDescargar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
            >
              <Download size={14} />
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors ml-1"
              aria-label="Cerrar visor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenedor del PDF */}
        <div className="flex-1 w-full h-full bg-gray-100 relative">
          <iframe
            src={`${url}#toolbar=1`}
            title={titulo}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  )
}
