import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
} from "@hugeicons/core-free-icons"
import { Plus, Trash2, X, Upload, Pencil } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cursosService, type CatalogoCurso, type Curso } from "@/services/cursos.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

type Categoria = "regular" | "taller" | "personalizado"

interface CatalogoFormData {
  nombre: string
  descripcion: string
  categoria: Categoria
  imagen: string
  imagenFile: File | null
  color: string
}

const emptyForm: CatalogoFormData = {
  nombre: "",
  descripcion: "",
  categoria: "regular",
  imagen: "",
  imagenFile: null,
  color: "#3B82F6",
}

export function CatalogosConCursosPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  const [catalogoModal, setCatalogoModal] = useState<{ open: boolean; editingId: string | null }>({ open: false, editingId: null })
  const [catalogoForm, setCatalogoForm] = useState<CatalogoFormData>(emptyForm)
  const [catalogoTouched, setCatalogoTouched] = useState<Record<string, boolean>>({})
  const [catalogoFieldErrors, setCatalogoFieldErrors] = useState<Record<string, string>>({})
  const [catalogoSaving, setCatalogoSaving] = useState(false)
  const [catalogoUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [catalogoToDelete, setCatalogoToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingCatalogo, setDeletingCatalogo] = useState(false)

  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [searchCatalogo, setSearchCatalogo] = useState("")
  const [, setLoadingCatalogos] = useState(true)

  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null)
  const [cursosAbiertos, setCursosAbiertos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)

  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matriculas, setMatriculas] = useState<any[]>([])
  const [loadingMatriculas, setLoadingMatriculas] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoadingCatalogos(true)
      try {
        const res = await cursosService.getCatalogos(searchCatalogo || undefined)
        setCatalogos(res.data)
      } catch { toast.error("Error al cargar catálogos") }
      finally { setLoadingCatalogos(false) }
    }
    load()
  }, [searchCatalogo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedCatalogoId) { setCursosAbiertos([]); return }
    const load = async () => {
      setLoadingCursos(true)
      try {
        const res = await cursosService.getCursos({ catalogo_curso_id: selectedCatalogoId })
        setCursosAbiertos(res.data || [])
      } catch { toast.error("Error al cargar cursos") }
      finally { setLoadingCursos(false) }
    }
    load()
  }, [selectedCatalogoId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedCursoId) { setMatriculas([]); return }
    const load = async () => {
      setLoadingMatriculas(true)
      try {
        const mats = await cursosService.getMatriculasCurso(selectedCursoId)
        setMatriculas(mats)
      } catch { toast.error("Error al cargar matrículas") }
      finally { setLoadingMatriculas(false) }
    }
    load()
  }, [selectedCursoId])

  const handleSelectCatalogo = (id: string) => {
    setSelectedCatalogoId(id === selectedCatalogoId ? null : id)
    setSelectedCursoId(null)
    setMatriculas([])
  }

  const handleSelectCurso = (id: string) => {
    setSelectedCursoId(id === selectedCursoId ? null : id)
  }

  const openCreateCatalogo = () => {
    setCatalogoForm(emptyForm)
    setCatalogoModal({ open: true, editingId: null })
  }

  const openEditCatalogo = (cat: CatalogoCurso) => {
    setCatalogoForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion || "",
      categoria: cat.categoria as Categoria,
      imagen: cat.imagen || "",
      imagenFile: null,
      color: cat.color || "#3B82F6",
    })
    setCatalogoModal({ open: true, editingId: cat.id })
  }

  const closeCatalogoModal = () => {
    if (catalogoForm.imagen?.startsWith("blob:")) {
      URL.revokeObjectURL(catalogoForm.imagen)
    }
    setCatalogoModal({ open: false, editingId: null })
    setCatalogoForm(emptyForm)
    setCatalogoTouched({})
    setCatalogoFieldErrors({})
  }

  const handleCategoriaChange = (cat: Categoria) => {
    setCatalogoForm((prev) => ({ ...prev, categoria: cat }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (catalogoForm.imagen?.startsWith("blob:")) {
      URL.revokeObjectURL(catalogoForm.imagen)
    }

    const previewUrl = URL.createObjectURL(file)
    setCatalogoForm((prev) => ({ ...prev, imagen: previewUrl, imagenFile: file }))
  }

  const handleSubmitCatalogo = async (e: React.FormEvent) => {
    e.preventDefault()
    setCatalogoFieldErrors({})
    
    if (!catalogoForm.nombre.trim()) {
      setCatalogoFieldErrors({ nombre: "El nombre del catálogo es obligatorio" })
      setCatalogoTouched({ ...catalogoTouched, nombre: true })
      return
    }

    setCatalogoSaving(true)
    try {
      let imagenUrl = catalogoForm.imagen

      if (catalogoForm.imagenFile) {
        imagenUrl = await cursosService.uploadImagenCatalogo(catalogoForm.imagenFile)
      }

      const payload = {
        nombre: catalogoForm.nombre,
        descripcion: catalogoForm.descripcion || undefined,
        categoria: catalogoForm.categoria,
        imagen: imagenUrl?.startsWith("blob:") ? undefined : imagenUrl || undefined,
        color: catalogoForm.color || undefined,
      }

      if (catalogoModal.editingId) {
        await cursosService.actualizarCatalogo(catalogoModal.editingId, payload as Record<string, unknown>)
        toast.success("Catálogo actualizado")
      } else {
        await cursosService.crearCatalogo(payload)
        toast.success("Catálogo creado exitosamente")
      }

      closeCatalogoModal()
      cargarCatalogos()
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { errors?: Record<string, string[]>; mensaje?: string } } }
      const errors = axiosError.response?.data?.errors
      if (errors) {
        const parsed: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(errors)) {
          parsed[key] = (msgs as string[])[0]
        }
        setCatalogoFieldErrors(parsed)
      } else {
        toast.error(axiosError.response?.data?.mensaje || "Error al guardar el catálogo")
      }
    } finally {
      setCatalogoSaving(false)
    }
  }

  const handleDeleteCatalogo = (id: string, nombre: string) => {
    setCatalogoToDelete({ id, nombre })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteCatalogo = async () => {
    if (!catalogoToDelete) return
    setDeletingCatalogo(true)
    try {
      await cursosService.eliminarCatalogo(catalogoToDelete.id)
      toast.success("Catálogo eliminado exitosamente")
      setShowDeleteConfirm(false)
      setCatalogoToDelete(null)
      cargarCatalogos()
    } catch {
      toast.error("Error al eliminar el catálogo")
    } finally {
      setDeletingCatalogo(false)
    }
  }

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true)
    try {
      const res = await cursosService.getCatalogos(searchCatalogo || undefined)
      setCatalogos(res.data)
    } catch { toast.error("Error al cargar catálogos") }
    finally { setLoadingCatalogos(false) }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="px-6 py-4 bg-white border-b flex items-center justify-between z-10">
        <h1 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Explorador Académico</h1>
        <button
          onClick={openCreateCatalogo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <Plus size={16} />
          Nuevo Catálogo
        </button>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {/* Col 1: Catálogos */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 px-2">Catálogos</h2>
          <div className="relative">
            <HugeiconsIcon icon={SearchIcon} className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={searchCatalogo} 
              onChange={e => setSearchCatalogo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {catalogos.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => handleSelectCatalogo(cat.id)}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all",
                selectedCatalogoId === cat.id ? "bg-white border-blue-500 shadow-md" : "bg-white/50 border-gray-200 hover:bg-white"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">{cat.nombre}</span>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); openEditCatalogo(cat); }}><Pencil size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCatalogo(cat.id, cat.nombre); }} className="text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            </button>
          ))}
        </div>
        {/* Col 2: Cursos */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 px-2">Cursos Activos</h2>
          {selectedCatalogoId ? (
            loadingCursos ? <p className="text-sm text-gray-400 p-4">Cargando...</p> :
            cursosAbiertos.map(curso => (
              <button 
                key={curso.id} 
                onClick={() => handleSelectCurso(curso.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all",
                  selectedCursoId === curso.id ? "bg-white border-blue-500 shadow-md" : "bg-white/50 border-gray-200 hover:bg-white"
                )}
              >
                <p className="font-bold">{curso.nombre}</p>
                <p className="text-xs text-gray-500">{curso.fechaInicio} - {curso.fechaFin}</p>
              </button>
            ))
          ) : <p className="text-sm text-gray-400 p-4">Selecciona un catálogo</p>}
        </div>
        {/* Col 3: Estudiantes */}
        <div className="w-1/3 overflow-y-auto p-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 px-2">Estudiantes</h2>
          {selectedCursoId ? (
            loadingMatriculas ? <p className="text-sm text-gray-400 p-4">Cargando...</p> :
            matriculas.map(m => (
              <div key={m.id} className="p-4 rounded-2xl bg-white border border-gray-200">
                <p className="font-bold text-sm">
                  {m.estudiante?.nombres ? `${m.estudiante.nombres} ${m.estudiante.apellidos}` : "N/A"}
                </p>
                <p className="text-xs text-gray-500">{m.estudiante?.correo || "N/A"}</p>
              </div>
            ))
          ) : <p className="text-sm text-gray-400 p-4">Selecciona un curso</p>}
        </div>
      </div>
      {/* Modales */}
      <AnimatePresence>
        {catalogoModal.open && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeCatalogoModal}
                  className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-white rounded-[2.5rem] max-w-[90vw] xl:max-w-[960px] w-full max-h-[90vh] overflow-hidden shadow-2xl"
                >
                  <div className="p-5 sm:p-6 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div>
                      <h3 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                        {catalogoModal.editingId ? "Refinar Catálogo" : "Nuevo Catálogo"}
                      </h3>
                      <p className="text-xs font-medium opacity-50 mt-0.5">Define los parámetros base de la oferta académica</p>
                    </div>
                    <button onClick={closeCatalogoModal} className="size-9 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitCatalogo}>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] min-h-[360px] max-h-[70vh]">
                      {/* LEFT: Image */}
                      <div className="p-5 sm:p-6 border-r flex flex-col" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 block">
                          Identidad Visual
                        </label>
                        <div className="flex-1 min-h-0">
                          {catalogoForm.imagen ? (
                            <div className="relative rounded-2xl overflow-hidden border aspect-[4/3]" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                              <img src={catalogoForm.imagen} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent" />
                              <button
                                type="button"
                                onClick={() => {
                                  if (catalogoForm.imagen?.startsWith("blob:")) URL.revokeObjectURL(catalogoForm.imagen)
                                  setCatalogoForm({ ...catalogoForm, imagen: "", imagenFile: null })
                                }}
                                className="absolute top-3 right-3 size-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              disabled={catalogoUploading}
                              className="w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all hover:bg-gray-50 active:scale-[0.98]"
                              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                            >
                              <div className="size-14 rounded-2xl flex items-center justify-center bg-black/5">
                                <Upload size={24} />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Subir imagen de portada</p>
                                <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>PNG, JPG o WebP</p>
                              </div>
                            </button>
                          )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </div>
                      {/* RIGHT: Form */}
                      <div className="p-5 sm:p-6 space-y-5">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">
                            Clasificación Operativa
                          </label>
                          <div className="flex gap-1.5">
                            {(["regular", "taller", "personalizado"] as const).map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoriaChange(cat)}
                                className={cn(
                                  "flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.97]",
                                  catalogoForm.categoria === cat 
                                    ? "text-white shadow-lg" 
                                    : "bg-black/5 text-charcoal/60 hover:bg-black/10"
                                )}
                                style={catalogoForm.categoria === cat ? { backgroundColor: COLORS.ACCENT } : {}}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                            Color Identificador
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={catalogoForm.color}
                              onChange={(e) => setCatalogoForm({ ...catalogoForm, color: e.target.value })}
                              className="w-12 h-10 rounded-lg border cursor-pointer"
                              style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            />
                            <input
                              type="text"
                              value={catalogoForm.color}
                              onChange={(e) => setCatalogoForm({ ...catalogoForm, color: e.target.value })}
                              placeholder="#3B82F6"
                              className="flex-1 px-3 py-2.5 rounded-xl border bg-gray-50/50 text-sm font-mono font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
                              style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                            Identificador Nominal
                          </label>
                          <input
                            type="text"
                            value={catalogoForm.nombre}
                            onChange={(e) => setCatalogoForm({ ...catalogoForm, nombre: e.target.value })}
                            placeholder="Ej: Master en Cinematografía"
                            className="w-full px-4 py-3 rounded-xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
                            style={{ borderColor: catalogoFieldErrors.nombre ? "#ef4444" : COLORS.BORDER_SUBTLE }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                            Narrativa del Curso
                          </label>
                          <textarea
                            value={catalogoForm.descripcion}
                            onChange={(e) => setCatalogoForm({ ...catalogoForm, descripcion: e.target.value })}
                            placeholder="Describe el impacto y alcance de este catálogo..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5 resize-none"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={catalogoSaving}
                            className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                            style={{ backgroundColor: COLORS.ACCENT, opacity: catalogoSaving ? 0.6 : 1 }}
                          >
                            {catalogoSaving ? "Sincronizando..." : "Confirmar Cambios"}
                          </button>
                          <button
                            type="button"
                            onClick={closeCatalogoModal}
                            className="flex-1 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10 transition-all active:scale-95"
                          >
                            Descartar
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {showDeleteConfirm && catalogoToDelete && (
            <ConfirmationModal
              isOpen={showDeleteConfirm}
              title="Eliminar Catálogo"
              message={`¿Estás seguro de que deseas eliminar el catálogo "${catalogoToDelete.nombre}"?`}
              onConfirm={confirmDeleteCatalogo}
              onCancel={() => setShowDeleteConfirm(false)}
              isLoading={deletingCatalogo}
              confirmText="Eliminar"
              isDangerous={true}
              icon="trash"
            />
          )}
    </div>
  )
}
