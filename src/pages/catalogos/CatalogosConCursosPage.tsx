import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon, GraduationCapIcon, BookOpen01Icon,
} from "@hugeicons/core-free-icons"
import { Plus, Trash2, Pencil, Users, Clock, MapPin } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn, getStorageUrl } from "@/lib/utils"
import { cursosService, type CatalogoCurso, type Curso, type MatriculaDetallada } from "@/services/cursos.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

type Categoria = "regular" | "taller" | "personalizado"

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
  const navigate = useNavigate()
  const { isAdmin } = usePermission()

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
        {isAdmin && (<button
          onClick={() => navigate("/catalogos/nuevo")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] shadow-lg"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <Plus size={16} />
          Nuevo Catálogo
        </button>)}
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
            <div className="flex flex-col items-center justify-center py-12">
  <HugeiconsIcon
    icon={BookOpen01Icon}
    size={32}
    style={{ color: COLORS.TEXT_MUTED }}
  />
  <p
    className="text-xs mt-2"
    style={{ color: COLORS.TEXT_MUTED }}
  >
    No hay catálogos
  </p>
</div>
          ) : catalogos.map((cat) => {
            const isSelected = selectedCatalogoId === cat.id
            const imgUrl = getStorageUrl(cat.imagen)
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
                      {isAdmin && (<button
                        onClick={(e) => { e.stopPropagation(); navigate(`/catalogos/${cat.id}/editar`) }}
                        className="size-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur text-white hover:bg-white/40 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>)}
                      {isAdmin && (<button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCatalogo(cat.id, cat.nombre) }}
                        className="size-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur text-white hover:bg-red-400/60 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>)}
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
                    borderLeftWidth: curso.colorCatalogo ? 3 : undefined,
                    borderLeftStyle: curso.colorCatalogo ? 'solid' : undefined,
                    borderLeftColor: curso.colorCatalogo ? curso.colorCatalogo : undefined,
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
            <div className="flex flex-col items-center justify-center py-12">
  <HugeiconsIcon
    icon={GraduationCapIcon}
    size={32}
    style={{ color: COLORS.TEXT_MUTED }}
  />
  <p
    className="text-xs mt-2"
    style={{ color: COLORS.TEXT_MUTED }}
  >
    Selecciona un catálogo
  </p>
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
            <div className="flex flex-col items-center justify-center py-12">
  <Users
    size={32}
    style={{ color: COLORS.TEXT_MUTED }}
  />
  <p
    className="text-xs mt-2"
    style={{ color: COLORS.TEXT_MUTED }}
  >
    Selecciona un curso
  </p>
</div>
          )}
        </div>
      </div>

      {/* Modales */}
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
