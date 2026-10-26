import { useState, useRef, useEffect } from "react"
import { X, UploadCloud, FileText, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { DocumentoArchivo } from "@/services/documentos.service"

interface DocumentoFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  documentoAEditar?: DocumentoArchivo | null
  onSubmit: (payload: {
    nombre: string
    descripcion?: string
    es_publico: boolean
    archivo?: File
  }) => Promise<void>
}

export function DocumentoFormModal({
  isOpen,
  onClose,
  onSuccess,
  documentoAEditar,
  onSubmit,
}: DocumentoFormModalProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [esPublico, setEsPublico] = useState(true)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (documentoAEditar) {
      setNombre(documentoAEditar.nombre || "")
      setDescripcion(documentoAEditar.descripcion || "")
      setEsPublico(Boolean(documentoAEditar.es_publico))
      setArchivo(null)
    } else {
      setNombre("")
      setDescripcion("")
      setEsPublico(true)
      setArchivo(null)
    }
  }, [documentoAEditar, isOpen])

  if (!isOpen) return null

  const handleFileChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const selectedFile = fileList[0]

    // Validación estricta en cliente: solo tipo PDF
    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      toast.error("Formato inválido", {
        description: "Solo se permite subir archivos en formato PDF.",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setArchivo(selectedFile)

    // Si el nombre aún está vacío, sugerir automáticamente el nombre del archivo sin extensión
    if (!nombre.trim()) {
      const suggestedName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      setNombre(suggestedName.charAt(0).toUpperCase() + suggestedName.slice(1))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error("Campo requerido", { description: "Por favor ingresa un nombre para el documento." })
      return
    }

    if (!documentoAEditar && !archivo) {
      toast.error("Archivo requerido", { description: "Por favor selecciona un archivo PDF para subir." })
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        es_publico: esPublico,
        archivo: archivo || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      const errorMsg =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Ocurrió un error al guardar el documento."
          : "Ocurrió un error al guardar el documento."
      toast.error("Error", { description: errorMsg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {documentoAEditar ? "Editar Documento" : "Subir Nuevo Documento PDF"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {documentoAEditar
                ? "Modifica los datos del documento o reemplaza el archivo."
                : "Adjunta el archivo PDF y define sus datos informativos."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Selector / Dropzone de PDF */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Archivo PDF {!documentoAEditar && <span className="text-red-500">*</span>}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragging
                  ? "border-red-500 bg-red-50/50"
                  : archivo
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/40 hover:bg-gray-50"
              }`}
            >
              {archivo ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{archivo.name}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      {(archivo.size / (1024 * 1024)).toFixed(2)} MB · Listo para subir
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setArchivo(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                    title="Remover archivo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : documentoAEditar ? (
                <div className="text-center space-y-1">
                  <FileText className="mx-auto size-8 text-gray-400" />
                  <p className="text-xs font-medium text-gray-700">
                    Archivo actual:{" "}
                    <span className="font-semibold text-gray-900">{documentoAEditar.archivo_nombre_original}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Haz clic aquí o arrastra un nuevo archivo si deseas reemplazarlo.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <UploadCloud className="mx-auto size-8 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700">
                    Haz clic para seleccionar o arrastra el archivo aquí
                  </p>
                  <p className="text-[11px] text-gray-400">Solo archivos en formato .PDF</p>
                </div>
              )}
            </div>
          </div>

          {/* Nombre del Documento */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nombre del Documento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Reglamento General de Estudiantes 2026"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-gray-400"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Descripción / Notas <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve resumen o información relevante sobre el contenido de este documento..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Estado de Visibilidad */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/60">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex items-center justify-center size-8 rounded-lg ${
                    esPublico ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {esPublico ? <Eye size={16} /> : <EyeOff size={16} />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    {esPublico ? "Visible en la Página Pública" : "Oculto (Solo Administrativo)"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {esPublico
                      ? "Cualquier usuario podrá consultar y descargar este PDF en el portal público."
                      : "Este documento no aparecerá en la página pública."}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={esPublico}
                  onChange={(e) => setEsPublico(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{documentoAEditar ? "Guardar Cambios" : "Subir Documento"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
