import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon, GraduationCapIcon, BookOpen01Icon,
} from "@hugeicons/core-free-icons"
import { Plus, Trash2, X, Upload, Pencil, Users, Clock, MapPin } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cursosService, type CatalogoCurso, type Curso, type MatriculaDetallada } from "@/services/cursos.service"
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

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || ""

function getImageUrl(path?: string): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) return path
  return `${API_BASE}/storage/${path.replace(/^\/?/, "")}`
}

function getEstudianteData(m: MatriculaDetallada): { nombres: string; apellidos: string; cedula: string; correo: string } | null {
  if (m.estudiante) return m.estudiante
  if (m.solicitud_inscripcion?.estudiante) return m.solicitud_inscripcion.estudiante
  if (m.solicitud_inscripcion?.participante_externo) return m.solicitud_inscripcion.participante_externo
  return null
}

const categoriaLabel: Record<Categoria, string> = {
  regular: "Regular",
  taller: "Taller",
  personalizado: "Personalizado",
}

function CategoriaBadge({ categoria }: { categoria: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    regular: { bg: "#dbeafe", text: "#1e40af" },
    taller: { bg: "#fef3c7", text: "#92400e" },
    personalizado: { bg: "#ede9fe", text: "#5b21b6" },
  }
  const c = colors[categoria] || colors.regular
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {categoriaLabel[categoria as Categoria] || categoria}
    </span>
  )
}

export function CatalogosConCursosPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

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

  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)

  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [loadingMatriculas, setLoadingMatriculas] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await cursosService.getCatalogos(searchCatalogo || undefined)
        setCatalogos(res.data)
      } catch { toast.error("Error al cargar catálogos") }
    }
    load()
  }, [searchCatalogo])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedCatalogoId) { setCursos([]); return }
    const load = async () => {
      setLoadingCursos(true)
      try {
        const res = await cursosService.getCursos({ catalogo_curso_id: selectedCatalogoId })
        setCursos(res.data || [])
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
    try {
      const res = await cursosService.getCatalogos(searchCatalogo || undefined)
      setCatalogos(res.data)
    } catch { toast.error("Error al cargar catálogos") }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/30">
      <header className="px-6 py-4 bg-white/80 backdrop-blur-xl border-b flex items-center justify-between z-10 shrink-0"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
            Explorar la Academia
          </h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
            {catalogos.length} catálogos &middot; {cursos.length} cursos activos
          </p>
        </div>
        <button
          onClick={openCreateCatalogo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] shadow-lg"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <Plus size={16} />
          Nuevo Catálogo
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Col 1: Catálogos */}
        <div className="w-[28%] min-w-[260px] border-r overflow-y-auto p-4 space-y-2.5"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between px-2 mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.TEXT_MUTED }}>
              Catálogos
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60"
              style={{ color: COLORS.TEXT_MUTED }}>
              {catalogos.length}
            </span>
          </div>
          <div className="relative mb-3">
            <HugeiconsIcon icon={SearchIcon} className="absolute left-3 top-1/2 -translate-y-1/2" size={14}
              style={{ color: COLORS.TEXT_MUTED }} />
            <input
              type="text"
              placeholder="Buscar catálogo..."
              value={searchCatalogo}
              onChange={e => setSearchCatalogo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white/70 text-sm outline-none transition-all focus:bg-white focus:ring-2"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            />
          </div>
          {catalogos.length === 0 ? (
            <div className="text-center py-12">
              <HugeiconsIcon icon={BookOpen01Icon} size={32} style={{ color: COLORS.TEXT_MUTED }} />
              <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>No hay catálogos</p>
            </div>
          ) : catalogos.map((cat) => {
            const isSelected = selectedCatalogoId === cat.id
            const imgUrl = getImageUrl(cat.imagen)
            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCatalogo(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelectCatalogo(cat.id) }}
                className={cn(
                  "w-full text-left rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer",
                  isSelected ? "shadow-md" : "hover:shadow-sm"
                )}
                style={{
                  borderColor: isSelected ? (cat.color || COLORS.ACCENT) : COLORS.BORDER_SUBTLE,
                  borderWidth: isSelected ? 2 : 1,
                }}
              >
                <div className="relative h-20 overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt={cat.nombre} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: cat.color
                          ? `linear-gradient(135deg, ${cat.color}40, ${cat.color}80)`
                          : "linear-gradient(135deg, #e5e7eb, #d1d5db)"
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {cat.color && (
                        <span className="size-3 rounded-full shrink-0 ring-2 ring-white/60"
                          style={{ backgroundColor: cat.color }} />
                      )}
                      <span className="text-sm font-bold text-white truncate drop-shadow-sm">
                        {cat.nombre}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditCatalogo(cat) }}
                        className="size-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur text-white hover:bg-white/40 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCatalogo(cat.id, cat.nombre) }}
                        className="size-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur text-white hover:bg-red-400/60 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 flex items-center justify-between bg-white">
                  <CategoriaBadge categoria={cat.categoria} />
                  {cat.descripcion && (
                    <span className="text-[10px] truncate ml-2" style={{ color: COLORS.TEXT_MUTED }}>
                      {cat.descripcion}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Col 2: Cursos */}
        <div className="w-[36%] min-w-[280px] border-r overflow-y-auto p-4 space-y-2.5"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between px-2 mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.TEXT_MUTED }}>
              Cursos Activos
            </h2>
            {selectedCatalogoId && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60"
                style={{ color: COLORS.TEXT_MUTED }}>
                {cursos.length}
              </span>
            )}
          </div>
          {selectedCatalogoId ? (
            loadingCursos ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: COLORS.ACCENT, borderTopColor: "transparent" }} />
              </div>
            ) : cursos.length === 0 ? (
              <div className="text-center py-12">
                <HugeiconsIcon icon={GraduationCapIcon} size={32} style={{ color: COLORS.TEXT_MUTED }} />
                <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>No hay cursos en este catálogo</p>
              </div>
            ) : cursos.map((curso) => {
              const isSelected = selectedCursoId === curso.id
              return (
                <button
                  key={curso.id}
                  onClick={() => handleSelectCurso(curso.id)}
                  className={cn(
                    "w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden",
                    isSelected ? "shadow-md" : "hover:shadow-sm"
                  )}
                  style={{
                    borderColor: isSelected ? (curso.colorCatalogo || COLORS.ACCENT) : COLORS.BORDER_SUBTLE,
                    borderWidth: isSelected ? 2 : 1,
                    borderLeft: curso.colorCatalogo ? `3px solid ${curso.colorCatalogo}` : undefined,
                  }}
                >
                  <div className="px-4 py-3.5 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                          {curso.nombre}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                          {curso.instructor}
                        </p>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: COLORS.ACCENT }}>
                        ${curso.precioBase}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                        <MapPin size={10} />
                        {curso.ciudad}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                        <Users size={10} />
                        {curso.estudiantes}/{curso.capacidad}
                      </div>
                      {curso.fechaInicio && (
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                          <Clock size={10} />
                          {curso.fechaInicio}
                        </div>
                      )}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100"
                        style={{ color: COLORS.TEXT_MUTED }}>
                        Mód. {curso.moduloActual}/{curso.totalModulos}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="text-center py-12">
              <HugeiconsIcon icon={GraduationCapIcon} size={32} style={{ color: COLORS.TEXT_MUTED }} />
              <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>Selecciona un catálogo</p>
            </div>
          )}
        </div>

        {/* Col 3: Estudiantes */}
        <div className="flex-1 min-w-[260px] overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between px-2 mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLORS.TEXT_MUTED }}>
              Estudiantes
            </h2>
            {selectedCursoId && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60"
                style={{ color: COLORS.TEXT_MUTED }}>
                {matriculas.length}
              </span>
            )}
          </div>
          {selectedCursoId ? (
            loadingMatriculas ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: COLORS.ACCENT, borderTopColor: "transparent" }} />
              </div>
            ) : matriculas.length === 0 ? (
              <div className="text-center py-12">
                <Users size={32} style={{ color: COLORS.TEXT_MUTED }} />
                <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>Sin estudiantes inscritos</p>
              </div>
            ) : matriculas.map((m) => {
              const estudiante = getEstudianteData(m)
              const initial = estudiante
                ? (estudiante.nombres?.[0] || "?").toUpperCase()
                : "?"
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-sm"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div className="px-4 py-3.5 flex items-center gap-3">
                    <div
                      className="size-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`,
                        color: COLORS.ACCENT,
                      }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                        {estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : "N/A"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {estudiante?.cedula && (
                          <span className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                            {estudiante.cedula}
                          </span>
                        )}
                        {estudiante?.correo && (
                          <span className="text-[10px] truncate" style={{ color: COLORS.TEXT_MUTED }}>
                            {estudiante.correo}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: m.estado === "matricula_creada"
                          ? "#dcfce7"
                          : m.estado === "pendiente_validacion"
                          ? "#fef3c7"
                          : "#fee2e2",
                        color: m.estado === "matricula_creada"
                          ? "#166534"
                          : m.estado === "pendiente_validacion"
                          ? "#92400e"
                          : "#991b1b",
                      }}
                    >
                      {m.estado === "matricula_creada" ? "Activo"
                        : m.estado === "pendiente_validacion" ? "Pendiente"
                        : m.estado === "rechazada" ? "Rechazada"
                        : m.estado || "—"}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12">
              <Users size={32} style={{ color: COLORS.TEXT_MUTED }} />
              <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>Selecciona un curso</p>
            </div>
          )}
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
              className="relative bg-white rounded-[2.5rem] max-w-[95vw] lg:max-w-[1020px] xl:max-w-[1080px] w-full max-h-[92vh] overflow-hidden shadow-2xl"
            >
              <div className="p-5 sm:p-6 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div>
                  <h3 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                    {catalogoModal.editingId ? "Actualizar Catálogo" : "Nuevo Catálogo"}
                  </h3>
                  
                </div>
                <button onClick={closeCatalogoModal} className="size-9 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmitCatalogo} className="flex flex-col min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] overflow-y-auto lg:overflow-hidden max-h-[calc(92vh-100px)]">
                  {/* LEFT: Image */}
                  <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r flex flex-col justify-start lg:overflow-y-auto lg:max-h-[calc(92vh-100px)]" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 block">
                      Imagen representativa
                    </label>
                    <div className="w-full flex-1 min-h-0 flex items-center justify-center">
                      {catalogoForm.imagen ? (
                        <div className="relative rounded-2xl overflow-hidden border aspect-[4/3] max-h-[260px] w-full shadow-inner" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
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
                          className="w-full min-h-[200px] lg:min-h-[240px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all hover:bg-gray-50 active:scale-[0.98]"
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
                  <div className="p-5 sm:p-6 space-y-5 overflow-y-auto lg:max-h-[calc(92vh-100px)]">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 block">
                        Tipo de Curso
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
                        <button
                          type="button"
                          onClick={() => colorInputRef.current?.click()}
                          className="size-11 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
                          style={{ backgroundColor: catalogoForm.color, borderColor: COLORS.BORDER_SUBTLE }}
                        />
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={catalogoForm.color}
                          onChange={(e) => setCatalogoForm({ ...catalogoForm, color: e.target.value })}
                          className="hidden"
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCatalogoForm({ ...catalogoForm, color: c })}
                            className={cn(
                              "size-6 rounded-full border transition-all hover:scale-110 active:scale-90",
                              catalogoForm.color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-2 ring-black/40 scale-105" : "border-black/10"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                        Nombre
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
                        Descripción
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
