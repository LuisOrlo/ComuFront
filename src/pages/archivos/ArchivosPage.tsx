import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileText,
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Lock,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import {
  documentosService,
  type DocumentoArchivo,
  type DocumentosAdminResponse,
} from "@/services/documentos.service"
import { DocumentoFormModal } from "@/components/archivos/DocumentoFormModal"
import { PdfViewerModal } from "@/components/archivos/PdfViewerModal"

export function ArchivosPage() {
  const queryClient = useQueryClient()
  const [buscar, setBuscar] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | "publicos" | "ocultos">("todos")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [documentoAEditar, setDocumentoAEditar] = useState<DocumentoArchivo | null>(null)
  const [documentoAEliminar, setDocumentoAEliminar] = useState<DocumentoArchivo | null>(null)
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

  // Consulta de documentos
  const { data, isLoading, isError, refetch } = useQuery<DocumentosAdminResponse | undefined>({
    queryKey: ["documentos-admin", buscar, estadoFiltro],
    queryFn: () =>
      documentosService.listar({
        buscar: buscar.trim() || undefined,
        estado: estadoFiltro,
        per_page: -1, // Trae todos los filtrados para vista reactiva fluida
      }),
  })

  // Lista normalizada de documentos
  const documentos = useMemo<DocumentoArchivo[]>(() => {
    if (!data?.documentos) return []
    if (Array.isArray(data.documentos)) return data.documentos
    if ("data" in data.documentos && Array.isArray(data.documentos.data)) {
      return data.documentos.data
    }
    return []
  }, [data])

  const kpis = data?.kpis ?? {
    total: documentos.length,
    publicos: documentos.filter((d) => d.es_publico).length,
    ocultos: documentos.filter((d) => !d.es_publico).length,
    total_descargas: documentos.reduce((acc, d) => acc + (d.descargas_count || 0), 0),
  }

  // Mutación para alternar visibilidad con 1 clic
  const toggleMutation = useMutation({
    mutationFn: (id: string) => documentosService.toggleVisibilidad(id),
    onMutate: async (id: string) => {
      // Cancelar refetchs en vuelo
      await queryClient.cancelQueries({ queryKey: ["documentos-admin"] })

      // Snapshot del estado previo
      const previousData = queryClient.getQueryData<DocumentosAdminResponse>(["documentos-admin", buscar, estadoFiltro])

      // Actualización optimista inmediata
      if (previousData) {
        let nuevosDocs: DocumentoArchivo[] = []
        if (Array.isArray(previousData.documentos)) {
          nuevosDocs = previousData.documentos.map((d) =>
            d.id === id ? { ...d, es_publico: !d.es_publico } : d
          )
        } else if ("data" in previousData.documentos && Array.isArray(previousData.documentos.data)) {
          nuevosDocs = previousData.documentos.data.map((d) =>
            d.id === id ? { ...d, es_publico: !d.es_publico } : d
          )
        }

        const nuevoTotalPublicos = nuevosDocs.filter((d) => d.es_publico).length
        const nuevoTotalOcultos = nuevosDocs.filter((d) => !d.es_publico).length

        queryClient.setQueryData(["documentos-admin", buscar, estadoFiltro], {
          ...previousData,
          documentos: nuevosDocs,
          kpis: {
            ...previousData.kpis,
            publicos: nuevoTotalPublicos,
            ocultos: nuevoTotalOcultos,
          },
        })
      }

      return { previousData }
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["documentos-admin", buscar, estadoFiltro], context.previousData)
      }
      toast.error("Error al actualizar visibilidad")
    },
    onSuccess: (res) => {
      toast.success(res.message)
      queryClient.invalidateQueries({ queryKey: ["documentos-admin"] })
    },
  })

  // Mutación para guardar (crear / editar)
  const guardarMutation = useMutation({
    mutationFn: async (payload: {
      nombre: string
      descripcion?: string
      es_publico: boolean
      archivo?: File
    }) => {
      if (documentoAEditar) {
        return documentosService.actualizar(documentoAEditar.id, payload)
      }
      if (!payload.archivo) throw new Error("Archivo requerido")
      return documentosService.subir({
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        es_publico: payload.es_publico,
        archivo: payload.archivo,
      })
    },
    onSuccess: () => {
      toast.success(
        documentoAEditar
          ? "Documento actualizado correctamente"
          : "Documento PDF subido exitosamente"
      )
      queryClient.invalidateQueries({ queryKey: ["documentos-admin"] })
      setModalAbierto(false)
      setDocumentoAEditar(null)
    },
    onError: (err: unknown) => {
      const msg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Error al procesar el archivo"
          : "Error al procesar el archivo"
      toast.error(msg)
    },
  })

  // Mutación para eliminar
  const eliminarMutation = useMutation({
    mutationFn: (id: string) => documentosService.eliminar(id),
    onSuccess: () => {
      toast.success("Documento eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: ["documentos-admin"] })
      setDocumentoAEliminar(null)
    },
    onError: () => {
      toast.error("Error al eliminar el documento")
    },
  })

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return "—"
    try {
      const date = new Date(fechaStr)
      return date.toLocaleDateString("es-EC", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return fechaStr
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Gestión de Archivos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              Solo PDF
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Administra, organiza y controla qué documentos son visibles para el público.
          </p>
        </div>

        <button
          onClick={() => {
            setDocumentoAEditar(null)
            setModalAbierto(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm shrink-0"
        >
          <Plus size={16} />
          <span>Subir Archivo PDF</span>
        </button>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Archivos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-100 text-gray-700">
            <Layers size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600">Visibles al Público</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{kpis.publicos}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Ocultos / Privados</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">{kpis.ocultos}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-100 text-gray-500">
            <Lock size={22} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600">Total Descargas</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{kpis.total_descargas ?? 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Download size={22} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-gray-400"
          />
          {buscar && (
            <button
              onClick={() => setBuscar("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setEstadoFiltro("todos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              estadoFiltro === "todos"
                ? "bg-white text-gray-900 shadow-xs font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Todos ({kpis.total})
          </button>
          <button
            onClick={() => setEstadoFiltro("publicos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              estadoFiltro === "publicos"
                ? "bg-white text-emerald-700 shadow-xs font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Públicos ({kpis.publicos})
          </button>
          <button
            onClick={() => setEstadoFiltro("ocultos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              estadoFiltro === "ocultos"
                ? "bg-white text-gray-700 shadow-xs font-semibold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Ocultos ({kpis.ocultos})
          </button>
        </div>
      </div>

      {/* Contenido / Listado */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="size-8 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500">Cargando archivos...</p>
          </div>
        ) : isError ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 px-4">
            <AlertCircle className="size-10 text-red-500" />
            <p className="text-sm font-semibold text-gray-800">Error al cargar los documentos</p>
            <p className="text-xs text-gray-500 max-w-sm">
              No se pudo conectar con el servidor. Por favor intenta recargar la página.
            </p>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : documentos.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 px-4">
            <div className="p-4 rounded-2xl bg-gray-50 text-gray-400">
              <FileText size={32} />
            </div>
            <p className="text-sm font-semibold text-gray-800">No se encontraron documentos</p>
            <p className="text-xs text-gray-500 max-w-sm">
              {buscar || estadoFiltro !== "todos"
                ? "No hay resultados para los filtros aplicados. Prueba con otros términos de búsqueda."
                : "Aún no se ha subido ningún documento. Haz clic en el botón superior para subir el primer archivo PDF."}
            </p>
            {(!buscar && estadoFiltro === "todos") && (
              <button
                onClick={() => {
                  setDocumentoAEditar(null)
                  setModalAbierto(true)
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-xs"
              >
                <Plus size={14} />
                <span>Subir Primer PDF</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vista Tabla para pantallas medianas y grandes */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Documento</th>
                    <th scope="col" className="px-6 py-3.5">Fecha</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Visibilidad Pública</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Descargas</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors group">
                      {/* Documento (Nombre y Descripción) */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center size-9 rounded-xl bg-red-50 text-red-600 font-bold text-xs shrink-0 mt-0.5 border border-red-100">
                            PDF
                          </div>
                          <div className="min-w-0 max-w-md">
                            <p className="font-semibold text-gray-900 text-sm truncate" title={doc.nombre}>
                              {doc.nombre}
                            </p>
                            {doc.descripcion ? (
                              <p className="text-xs text-gray-500 line-clamp-2 mt-0.5" title={doc.descripcion}>
                                {doc.descripcion}
                              </p>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Sin descripción</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{formatearFecha(doc.created_at)}</span>
                        </div>
                      </td>

                      {/* Botón de 1 Clic para alternar visibilidad */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleMutation.mutate(doc.id)}
                          disabled={toggleMutation.isPending}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            doc.es_publico
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                          }`}
                          title="Haz clic para alternar si este archivo es visible o no en la página pública"
                        >
                          {doc.es_publico ? (
                            <>
                              <Eye size={13} className="text-emerald-600" />
                              <span>Público</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={13} className="text-gray-500" />
                              <span>Oculto</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Contador de Descargas */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                          <Download size={12} className="text-blue-500" />
                          <span>{doc.descargas_count ?? 0}</span>
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver PDF */}
                          <button
                            onClick={() =>
                              setVisorModal({
                                isOpen: true,
                                titulo: doc.nombre,
                                url: doc.archivo_url,
                                documentoId: doc.id,
                                nombreArchivo: doc.archivo_nombre_original,
                              })
                            }
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Ver en visor integrado"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Abrir enlace en pestaña nueva */}
                          <a
                            href={doc.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Abrir en pestaña nueva"
                          >
                            <ExternalLink size={16} />
                          </a>

                          {/* Descargar */}
                          <button
                            onClick={() => documentosService.forzarDescarga(doc.id, doc.archivo_nombre_original)}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Descargar archivo"
                          >
                            <Download size={16} />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setDocumentoAEditar(doc)
                              setModalAbierto(true)
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar documento"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => setDocumentoAEliminar(doc)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar documento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Tarjetas para pantallas móviles */}
            <div className="md:hidden divide-y divide-gray-100">
              {documentos.map((doc) => (
                <div key={doc.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-red-100 text-red-600 font-bold text-xs shrink-0 mt-0.5">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">
                          {doc.nombre}
                        </p>
                        {doc.descripcion && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {doc.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botón rápido toggle visibilidad */}
                    <button
                      onClick={() => toggleMutation.mutate(doc.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
                        doc.es_publico
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {doc.es_publico ? (
                        <>
                          <Eye size={12} className="text-emerald-600" />
                          <span>Público</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} className="text-gray-500" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      <Download size={11} className="text-blue-500" />
                      <span>{doc.descargas_count ?? 0} descargas</span>
                    </span>
                    <span>{formatearFecha(doc.created_at)}</span>
                  </div>

                  {/* Acciones móviles */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() =>
                        setVisorModal({
                          isOpen: true,
                          titulo: doc.nombre,
                          url: doc.archivo_url,
                          documentoId: doc.id,
                          nombreArchivo: doc.archivo_nombre_original,
                        })
                      }
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      <span>Ver</span>
                    </button>
                    <button
                      onClick={() => documentosService.forzarDescarga(doc.id, doc.archivo_nombre_original)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Descargar</span>
                    </button>
                    <button
                      onClick={() => {
                        setDocumentoAEditar(doc)
                        setModalAbierto(true)
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDocumentoAEliminar(doc)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <DocumentoFormModal
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false)
          setDocumentoAEditar(null)
        }}
        documentoAEditar={documentoAEditar}
        onSubmit={async (payload) => {
          await guardarMutation.mutateAsync(payload)
        }}
        onSuccess={() => refetch()}
      />

      {/* Modal de Visor PDF */}
      <PdfViewerModal
        isOpen={visorModal.isOpen}
        onClose={() => setVisorModal({ isOpen: false, titulo: "", url: "" })}
        titulo={visorModal.titulo}
        url={visorModal.url}
        documentoId={visorModal.documentoId}
        nombreArchivo={visorModal.nombreArchivo}
      />

      {/* Modal de Confirmación de Eliminación */}
      {documentoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100 text-red-600 shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">¿Eliminar este documento?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
              Se eliminará permanentemente el registro de{" "}
              <strong className="text-gray-900">"{documentoAEliminar.nombre}"</strong> y se borrará su archivo PDF físico del almacenamiento.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDocumentoAEliminar(null)}
                disabled={eliminarMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarMutation.mutate(documentoAEliminar.id)}
                disabled={eliminarMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {eliminarMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
