import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import {
  Search,
  Eye,
  Download,
  Calendar,
  RefreshCw,
  FolderOpen,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import {
  documentosService,
  type DocumentoArchivo,
  type DocumentosPublicosResponse,
} from "@/services/documentos.service"
import { PdfViewerModal } from "@/components/archivos/PdfViewerModal"

export function DocumentosPublicosPage() {
  const [buscar, setBuscar] = useState("")
  const [visorModal, setVisorModal] = useState<{
    isOpen: boolean
    titulo: string
    url: string
    documentoId?: string
    nombreArchivo?: string
  }>({
    isOpen: false,
    titulo: "",
    url: "",
  })

  // Consulta al endpoint público
  const { data, isLoading, isError, refetch } = useQuery<DocumentosPublicosResponse | DocumentoArchivo[] | undefined>({
    queryKey: ["documentos-publicos", buscar],
    queryFn: () =>
      documentosService.listarPublicos({
        buscar: buscar.trim() || undefined,
        per_page: -1,
      }),
  })

  // Normalizar array de documentos
  const documentos = useMemo<DocumentoArchivo[]>(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if ("data" in data && Array.isArray(data.data)) {
      return data.data
    }
    return []
  }, [data])

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return ""
    try {
      const date = new Date(fechaStr)
      return date.toLocaleDateString("es-EC", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return fechaStr
    }
  }

  return (
    <div className="min-h-dvh bg-gray-50/60 flex flex-col selection:bg-red-500/20 selection:text-red-900">
      {/* Header Institucional */}
      <header
        className="w-full bg-white border-b sticky top-0 z-30 shadow-2xs"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo_PDF.png" alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700 tracking-tight hidden sm:block">
              Portal Institucional
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
            <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
            Documentos Oficiales
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-10 sm:py-14 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Repositorio de Documentos Públicos
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-xl mx-auto">
              Accede a los archivos, reglamentos y guías oficiales en formato PDF. Visualízalos en línea o descárgalos libremente.
            </p>
          </motion.div>

          {/* Buscador Dinámico */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="pt-2 max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por título o contenido del documento..."
                className="w-full pl-11 pr-24 py-3 text-sm rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-xs placeholder:text-gray-400"
              />
              {buscar && (
                <button
                  onClick={() => setBuscar("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-700 bg-gray-200/60 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contenido Principal / Grilla de Documentos */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="size-8 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500">Cargando documentos disponibles...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center space-y-3 max-w-md mx-auto">
            <p className="text-sm font-semibold text-gray-800">No se pudieron cargar los documentos</p>
            <p className="text-xs text-gray-500">
              Ocurrió un inconveniente al conectar con el servidor. Por favor, reintenta en unos instantes.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              Recargar
            </button>
          </div>
        ) : documentos.length === 0 ? (
          <div className="py-20 text-center space-y-3 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gray-100 text-gray-400">
              <FolderOpen size={30} />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {buscar ? "No se encontraron coincidencias" : "No hay documentos públicos por el momento"}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {buscar
                ? `No encontramos ningún archivo que coincida con "${buscar}". Prueba buscando con otras palabras.`
                : "Actualmente no existen documentos marcados como públicos en esta sección."}
            </p>
            {buscar && (
              <button
                onClick={() => setBuscar("")}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 underline underline-offset-4"
              >
                Ver todos los documentos
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>
                Mostrando <strong className="text-gray-800">{documentos.length}</strong> documento
                {documentos.length === 1 ? "" : "s"} disponible{documentos.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Grilla Responsiva */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {documentos.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.4) }}
                  className="group flex flex-col justify-between bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="space-y-3">
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-red-50 text-red-600 font-bold text-xs border border-red-100/80 shrink-0">
                        PDF
                      </div>
                      {doc.created_at && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <Calendar size={12} />
                          <span>{formatearFecha(doc.created_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Título */}
                    <div>
                      <h2
                        className="font-bold text-gray-900 text-base leading-snug group-hover:text-red-600 transition-colors line-clamp-2"
                        title={doc.nombre}
                      >
                        {doc.nombre}
                      </h2>

                      {/* Descripción */}
                      {doc.descripcion ? (
                        <p className="text-xs text-gray-500 line-clamp-3 mt-1.5 leading-relaxed">
                          {doc.descripcion}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-1.5">
                          Documento oficial institucional.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer de la tarjeta con botones de acción */}
                  <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Botón Ver PDF (abre visor integrado) */}
                      <button
                        type="button"
                        onClick={() =>
                          setVisorModal({
                            isOpen: true,
                            titulo: doc.nombre,
                            url: doc.archivo_url,
                            documentoId: doc.id,
                            nombreArchivo: doc.archivo_nombre_original,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Ver PDF</span>
                      </button>

                      {/* Botón Descargar directo sin redirecciones */}
                      <button
                        type="button"
                        onClick={() =>
                          documentosService.forzarDescarga(
                            doc.id,
                            doc.archivo_nombre_original || `${doc.nombre}.pdf`
                          )
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Descargar</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-auto">
        <p>© {new Date().getFullYear()} Plataforma Institucional. Todos los derechos reservados.</p>
      </footer>

      {/* Visor PDF integrado */}
      <PdfViewerModal
        isOpen={visorModal.isOpen}
        onClose={() => setVisorModal({ isOpen: false, titulo: "", url: "" })}
        titulo={visorModal.titulo}
        url={visorModal.url}
        documentoId={visorModal.documentoId}
        nombreArchivo={visorModal.nombreArchivo}
      />
    </div>
  )
}
