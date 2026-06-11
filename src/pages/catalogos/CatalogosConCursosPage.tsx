import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CalendarIcon,
  UserIcon,
  SearchIcon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { Plus, Trash2, X, Upload } from "lucide-react"
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
}

const emptyForm: CatalogoFormData = {
  nombre: "",
  descripcion: "",
  categoria: "regular",
  imagen: "",
  imagenFile: null,
}

/**
 * CatalogosConCursosPage
 * Página que muestra:
 * - Listado de catálogos de cursos
 * - Cursos abiertos por catálogo
 * - Estudiantes matriculados en cada curso
 * 
 * Antiguamente esta era la página principal de /matriculas
 * Ahora está en /catalogos para organizar mejor el flujo de trabajo
 */
export function CatalogosConCursosPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  // Estados de gestión de catálogos
  const [catalogoModal, setCatalogoModal] = useState<{ open: boolean; editingId: string | null }>({ open: false, editingId: null })
  const [catalogoForm, setCatalogoForm] = useState<CatalogoFormData>(emptyForm)
  const [catalogoTouched, setCatalogoTouched] = useState<Record<string, boolean>>({})
  const [catalogoFieldErrors, setCatalogoFieldErrors] = useState<Record<string, string>>({})
  const [catalogoSaving, setCatalogoSaving] = useState(false)
  const [catalogoUploading, setCatalogoUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [catalogoToDelete, setCatalogoToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingCatalogo, setDeletingCatalogo] = useState(false)

  // Estados de catálogos
  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [searchCatalogo, setSearchCatalogo] = useState("")
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // Estados de cursos abiertos del catálogo seleccionado
  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null)
  const [cursosAbiertos, setCursosAbiertos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)

  // Estados de horarios/matrículas del curso seleccionado
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  const [matriculas, setMatriculas] = useState<any[]>([])
  const [loadingMatriculas, setLoadingMatriculas] = useState(false)

  // Cargar catálogos
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

  // Al seleccionar catálogo, cargar sus cursos abiertos
  useEffect(() => {
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

  // Al seleccionar curso, cargar sus matrículas
  useEffect(() => {
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

  const selectedCatalogo = catalogos.find(c => c.id === selectedCatalogoId)
  const selectedCurso = cursosAbiertos.find(c => c.id === selectedCursoId)

  const handleSelectCatalogo = (id: string) => {
    setSelectedCatalogoId(id === selectedCatalogoId ? null : id)
    setSelectedCursoId(null)
    setMatriculas([])
  }

  const handleSelectCurso = (id: string) => {
    setSelectedCursoId(id === selectedCursoId ? null : id)
  }

  // Funciones de gestión de catálogos
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
    })
    setCatalogoModal({ open: true, editingId: cat.id })
  }

  const closeCatalogoModal = () => {
    setCatalogoModal({ open: false, editingId: null })
    setCatalogoForm(emptyForm)
    setCatalogoTouched({})
    setCatalogoFieldErrors({})
  }

  const handleCategoriaChange = (cat: Categoria) => {
    setCatalogoForm((prev) => ({ ...prev, categoria: cat }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCatalogoUploading(true)
    try {
      const url = await cursosService.uploadImagenCatalogo(file)
      setCatalogoForm((prev) => ({ ...prev, imagen: url, imagenFile: file }))
      toast.success("Imagen subida")
    } catch {
      toast.error("Error al subir la imagen")
    } finally {
      setCatalogoUploading(false)
    }
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
      const payload = {
        nombre: catalogoForm.nombre,
        descripcion: catalogoForm.descripcion || undefined,
        categoria: catalogoForm.categoria,
        imagen: catalogoForm.imagen || undefined,
      }

      if (catalogoModal.editingId) {
        await cursosService.actualizarCatalogo(catalogoModal.editingId, payload as any)
        toast.success("Catálogo actualizado")
      } else {
        await cursosService.crearCatalogo(payload)
        toast.success("Catálogo creado exitosamente")
      }

      closeCatalogoModal()
      cargarCatalogos()
    } catch (error: any) {
      const errors = error.response?.data?.errors
      if (errors) {
        const parsed: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(errors)) {
          parsed[key] = (msgs as string[])[0]
        }
        setCatalogoFieldErrors(parsed)
      } else {
        toast.error(error.response?.data?.mensaje || "Error al guardar el catálogo")
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
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1300px] mx-auto px-6 py-6 space-y-8">
          {/* SECCIÓN 1: GESTIÓN DE CATÁLOGOS */}
          <section className="space-y-6">
            <div className="flex justify-between items-end gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tighter leading-tight" style={{ color: COLORS.CHARCOAL }}>
                  Gestionar Catálogos
                </h2>
                
              </div>
              <button
                onClick={openCreateCatalogo}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-lg shadow-tomato/20"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Plus size={18} strokeWidth={2.5} color="white" />
                Nuevo Catálogo
              </button>
            </div>

            {/* Grid de catálogos de gestión - Uniform Layout */}
            {!loadingCatalogos && catalogos.length > 0 && (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {catalogos.map((cat, index) => {
                  return (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.04,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      className="group relative rounded-[2rem] border bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/5"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      {/* Image Layer - Fixed Height for consistency */}
                      <div className="relative h-48 z-0 overflow-hidden bg-gray-50">
                        {cat.imagen ? (
                          <img 
                            src={cat.imagen} 
                            alt={cat.nombre} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div 
                            className="w-full h-full bg-gradient-to-br opacity-[0.05]"
                            style={{ 
                              backgroundImage: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, transparent 100%)`,
                              backgroundColor: COLORS.CHARCOAL
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Floating Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-black/5 shadow-sm" style={{ color: COLORS.CHARCOAL }}>
                            {cat.categoria}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={() => openEditCatalogo(cat)}
                            className="size-8 flex items-center justify-center rounded-full bg-white shadow-xl hover:bg-gray-50 transition-colors"
                            style={{ color: COLORS.CHARCOAL }}
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalogo(cat.id, cat.nombre)}
                            className="size-8 flex items-center justify-center rounded-full bg-white shadow-xl hover:bg-red-50 transition-colors"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content Layer */}
                      <div className="p-5 space-y-3">
                        <p className="text-base font-bold tracking-tight leading-tight" style={{ color: COLORS.CHARCOAL }}>
                          {cat.nombre}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>
                            {cat.modulos_default || 0} MODULOS
                          </p>
                          <div className="size-1.5 rounded-full" style={{ backgroundColor: COLORS.ACCENT }} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </section>

          {/* Separador */}
          <div style={{ borderTop: `1px solid ${COLORS.BORDER_SUBTLE}` }} />

          {/* SECCIÓN 2: VISUALIZACIÓN DE CATÁLOGOS Y CURSOS */}
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>
                  Catalogo
                  {selectedCatalogo && (
                    <>
                      <span className="size-1 rounded-full bg-current opacity-50" />
                      <span style={{ color: COLORS.ACCENT }}>{selectedCatalogo.nombre}</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                  {selectedCurso ? "Asistencia Actual" : "Explorar Academia"}
                </h2>
              </div>
              
              
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Columna principal: Selección */}
              <div className="flex-1 min-w-0 space-y-8">
                {/* Buscador */}
                <div className="relative group max-w-xl">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <HugeiconsIcon 
                      icon={SearchIcon} 
                      size={18} 
                      className="transition-colors group-focus-within:text-tomato" 
                      style={{ color: COLORS.TEXT_MUTED }} 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Filtrar catálogos por nombre..."
                    value={searchCatalogo} 
                    onChange={e => setSearchCatalogo(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border bg-white/50 backdrop-blur-sm text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }} 
                  />
                </div>

                {/* Grid de Selección de Catálogo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingCatalogos ? (
                    <div className="col-span-full py-20 text-center animate-pulse font-medium opacity-30">Sincronizando catálogos...</div>
                  ) : (
                    catalogos.map(cat => (
                      <motion.button 
                        key={cat.id} 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectCatalogo(cat.id)}
                        className={cn(
                          "relative text-left p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden",
                          selectedCatalogoId === cat.id ? "bg-white shadow-xl shadow-black/5" : "bg-white/40 hover:bg-white"
                        )}
                        style={{
                          borderColor: selectedCatalogoId === cat.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                        }}
                      >
                        {selectedCatalogoId === cat.id && (
                          <motion.div 
                            layoutId="accent-glow"
                            className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none rounded-full"
                            style={{ backgroundColor: COLORS.ACCENT }}
                          />
                        )}
                        
                        <p className="text-base font-bold tracking-tight mb-1" style={{ color: COLORS.CHARCOAL }}>{cat.nombre}</p>
                        <p className="text-xs font-medium opacity-60 uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>{cat.categoria}</p>
                        
                        <div className="flex items-center justify-between mt-6">
                          <span className="text-[10px] font-mono font-bold opacity-40">
                            {cat.modulos_default || 0} MODS
                          </span>
                          <div className="size-1.5 rounded-full" style={{ backgroundColor: selectedCatalogoId === cat.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }} />
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>

                {/* Cursos Abiertos */}
                <AnimatePresence mode="wait">
                  {selectedCatalogoId && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="pt-10 border-t space-y-6"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      <h3 className="text-sm font-bold uppercase tracking-[0.15em] opacity-40 px-2" style={{ color: COLORS.CHARCOAL }}>
                        Cursos Activos: {selectedCatalogo?.nombre}
                      </h3>
                      
                      {loadingCursos ? (
                        <div className="py-12 text-center font-mono text-xs opacity-30">Cargando instancias de curso...</div>
                      ) : cursosAbiertos.length === 0 ? (
                        <div className="py-12 text-center rounded-[2.5rem] border-2 border-dashed opacity-40" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <p className="text-sm font-medium">No se han aperturado cursos para este catálogo</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cursosAbiertos.map(curso => (
                            <motion.button 
                              key={curso.id} 
                              whileHover={{ x: 8 }}
                              onClick={() => handleSelectCurso(curso.id)}
                              className={cn(
                                "group text-left p-6 rounded-[2.25rem] border transition-all duration-300",
                                selectedCursoId === curso.id ? "bg-white shadow-lg border-tomato" : "bg-white/20 hover:bg-white"
                              )}
                              style={{
                                borderColor: selectedCursoId === curso.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-lg font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>{curso.nombre}</p>
                                    <div className="flex items-center gap-2 mt-1 font-mono text-[10px] font-bold opacity-50">
                                      <HugeiconsIcon icon={CalendarIcon} size={12} />
                                      {curso.fechaInicio} — {curso.fechaFin}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                                      {curso.modalidad}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-1.5 w-12 rounded-full bg-black/5 overflow-hidden">
                                        <div className="h-full" style={{ backgroundColor: COLORS.ACCENT, width: `${(curso.estudiantes || 0) / curso.capacidad * 100}%` }} />
                                      </div>
                                      <span className="text-[10px] font-mono font-bold" style={{ color: COLORS.CHARCOAL }}>{curso.estudiantes || 0}/{curso.capacidad}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className={cn(
                                  "size-10 rounded-full flex items-center justify-center transition-all",
                                  selectedCursoId === curso.id ? "bg-tomato text-white scale-110 shadow-lg shadow-tomato/20" : "bg-black/5 group-hover:bg-black/10"
                                )}
                                  style={{ color: selectedCursoId === curso.id ? "white" : COLORS.CHARCOAL }}
                                >
                                  {selectedCursoId === curso.id ? "✓" : "→"}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Columna lateral: Listado de Estudiantes */}
              <div className="w-full xl:w-[420px] shrink-0 sticky top-6">
                <AnimatePresence mode="wait">
                  {selectedCursoId ? (
                    <motion.div
                      key="selected"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="rounded-[2.5rem] bg-white border overflow-hidden shadow-2xl shadow-black/5"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      <div className="p-8 border-b space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <h3 className="text-xl font-bold tracking-tighter text-center" style={{ color: COLORS.CHARCOAL }}>Estudiantes Registrados</h3>
                        <p className="text-sm font-medium opacity-50 truncate text-center" style={{ color: COLORS.TEXT_MUTED }}>
                          {selectedCurso?.nombre}
                        </p>
                      </div>
                      
                      {loadingMatriculas ? (
                        <div className="p-20 text-center animate-pulse text-xs font-mono opacity-30">Indexando registros...</div>
                      ) : matriculas.length === 0 ? (
                        <div className="p-16 text-center space-y-4">
                          <div className="size-16 rounded-3xl bg-black/5 mx-auto flex items-center justify-center opacity-30">
                            <HugeiconsIcon icon={UserIcon} size={32} style={{ color: COLORS.CHARCOAL }} />
                          </div>
                          <p className="text-sm font-semibold opacity-30">Sin registros activos</p>
                        </div>
                      ) : (
                        <div className="max-h-[600px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                          {matriculas.map((m: any, idx) => (
                            <motion.div 
                              key={m.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="p-6 flex items-center gap-4 group hover:bg-gray-50/50 transition-colors border-b last:border-0"
                              style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            >
                              <div className="size-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm shadow-sm transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `oklch(0.97 0 0)`, color: COLORS.CHARCOAL }}>
                                {(m.estudiante?.nombres?.[0] || "?")}{(m.estudiante?.apellidos?.[0] || "")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate leading-tight" style={{ color: COLORS.CHARCOAL }}>
                                  {m.estudiante?.nombres 
                                    ? `${m.estudiante.nombres} ${m.estudiante.apellidos || ""}`
                                    : (m.solicitud_inscripcion?.participante_externo?.nombres 
                                      ? `${m.solicitud_inscripcion.participante_externo.nombres} ${m.solicitud_inscripcion.participante_externo.apellidos || ""}`
                                      : "Identidad desconocida")}
                                </p>
                                <p className="text-xs font-mono font-medium opacity-40 truncate mt-0.5">
                                  {m.estudiante?.correo || m.solicitud_inscripcion?.participante_externo?.correo || "N/A"}
                                </p>
                              </div>
                              <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                                m.estado === "activa" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                              )}>
                                {m.estado}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      
                      <div className="p-6 bg-gray-50/50 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                         <button className="w-full py-3 rounded-2xl bg-white border border-black/5 text-xs font-bold uppercase tracking-widest hover:bg-white hover:shadow-md transition-all" style={{ color: COLORS.CHARCOAL }}>
                           Exportar Listado
                         </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-[3rem] border-4 border-dashed p-12 text-center flex flex-col items-center justify-center space-y-6"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                    >
                      <div className="size-24 rounded-[2rem] bg-black/5 flex items-center justify-center opacity-20">
                        <HugeiconsIcon icon={UserIcon} size={48} style={{ color: COLORS.CHARCOAL }} />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-lg font-bold tracking-tight text-center" style={{ color: COLORS.CHARCOAL }}>Estado de Espera</p>
                        <p className="text-xs font-medium leading-relaxed max-w-[200px] mx-auto text-center opacity-60">
                          Selecciona una cohorte para visualizar los registros de asistencia y estados de matrícula.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Modal de crear/editar catálogo */}
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
                  className="relative bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl"
                >
                  <div className="p-8 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                        {catalogoModal.editingId ? "Refinar Catálogo" : "Nuevo Catálogo"}
                      </h3>
                      <p className="text-xs font-medium opacity-50">Define los parámetros base de la oferta académica</p>
                    </div>
                    <button 
                      onClick={closeCatalogoModal} 
                      className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitCatalogo} className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                        Identificador Nominal
                      </label>
                      <input
                        type="text"
                        value={catalogoForm.nombre}
                        onChange={(e) => setCatalogoForm({ ...catalogoForm, nombre: e.target.value })}
                        placeholder="Ej: Master en Cinematografía"
                        className="w-full px-5 py-4 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
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
                        className="w-full px-5 py-4 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5 resize-none"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                        Clasificación Operativa
                      </label>
                      <div className="flex gap-2">
                        {(["regular", "taller", "personalizado"] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoriaChange(cat)}
                            className={cn(
                              "flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                              catalogoForm.categoria === cat 
                                ? "bg-tomato text-white shadow-lg shadow-tomato/20" 
                                : "bg-black/5 text-charcoal/60 hover:bg-black/10"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                        Identidad Visual
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={catalogoUploading}
                          className="flex-1 py-4 px-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 text-sm font-bold transition-all hover:bg-gray-50 active:scale-95"
                          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                        >
                          <Upload size={18} />
                          {catalogoUploading ? "Cargando..." : "Adjuntar Media"}
                        </button>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {catalogoForm.imagen && (
                          <div className="size-14 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                            <img src={catalogoForm.imagen} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={catalogoSaving}
                        className="flex-[2] py-4 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-tomato/20 active:scale-95"
                        style={{ backgroundColor: COLORS.ACCENT, opacity: catalogoSaving ? 0.6 : 1 }}
                      >
                        {catalogoSaving ? "Sincronizando..." : "Confirmar Cambios"}
                      </button>
                      <button
                        type="button"
                        onClick={closeCatalogoModal}
                        className="flex-1 py-4 rounded-2xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10 transition-all active:scale-95"
                      >
                        Descartar
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Modal de confirmación de eliminar */}
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
      </main>
    </div>
  )
}
