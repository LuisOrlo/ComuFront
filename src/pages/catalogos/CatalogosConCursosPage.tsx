import { useState, useEffect, useMemo } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { useIsMobile } from "@/hooks/useIsMobile"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon, GraduationCapIcon, BookOpen01Icon, ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { Plus, Trash2, Pencil, Users, Clock, MapPin } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cursosService, type CatalogoCurso, type Curso, type MatriculaDetallada } from "@/services/cursos.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { iconMap } from "./components/catalog-icons"

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
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {categoriaLabel[categoria as Categoria] || categoria}
    </span>
  )
}

// ============================================================================
// COMPONENTES DE COLUMNA
// ============================================================================

function ColumnHeader({ title, count, onBack, backLabel, children }: {
  title: string
  count?: number
  onBack?: () => void
  backLabel?: string
  children?: ReactNode
}) {
  return (
    <div className="shrink-0 mb-3">
      <div className="flex items-center gap-2 mb-3 px-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 hover:bg-black/5 transition-colors shrink-0"
            style={{ color: COLORS.CHARCOAL }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            {backLabel || "Volver"}
          </button>
        )}
        <h2 className="text-[11px] font-bold uppercase tracking-widest truncate" style={{ color: COLORS.TEXT_MUTED }}>
          {title}
        </h2>
        {count !== undefined && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/60 shrink-0" style={{ color: COLORS.TEXT_MUTED }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function ColumnSearch({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative mb-3">
      <HugeiconsIcon icon={SearchIcon} className="absolute left-3 top-1/2 -translate-y-1/2" size={14}
        style={{ color: COLORS.TEXT_MUTED }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white/70 text-sm outline-none transition-all focus:bg-white focus:ring-2"
        style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
      />
    </div>
  )
}

function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon}
      <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>{message}</p>
    </div>
  )
}

function ColumnLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="size-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: COLORS.ACCENT, borderTopColor: "transparent" }} />
    </div>
  )
}

interface CatalogoColumnProps {
  catalogos: CatalogoCurso[]
  selectedId: string | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string, nombre: string) => void
  isAdmin: boolean
}

function CatalogoColumn({ catalogos, selectedId, search, onSearchChange, onSelect, onEdit, onDelete, isAdmin }: CatalogoColumnProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 p-4">
      <ColumnHeader title="Catálogos" count={catalogos.length}>
        <ColumnSearch value={search} onChange={onSearchChange} placeholder="Buscar catálogo..." />
      </ColumnHeader>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {catalogos.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={BookOpen01Icon} size={32} style={{ color: COLORS.TEXT_MUTED }} />}
            message="No hay catálogos"
          />
        ) : catalogos.map((cat) => {
          const isSelected = selectedId === cat.id
          const icon = cat.imagen && iconMap[cat.imagen]
          return (
            <div
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(cat.id) }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all",
                isSelected ? "shadow-sm" : "hover:bg-gray-50"
              )}
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                borderLeftColor: isSelected ? (cat.color || COLORS.ACCENT) : COLORS.BORDER_SUBTLE,
                borderLeftWidth: isSelected ? 3 : 1,
                backgroundColor: isSelected && cat.color
                  ? `color-mix(in srgb, ${cat.color} 8%, transparent)`
                  : "transparent",
              }}
            >
              <div
                className="size-[30px] rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: cat.color
                    ? `color-mix(in srgb, ${cat.color} 15%, transparent)`
                    : "oklch(0.95 0 0)",
                  color: cat.color || COLORS.TEXT_MUTED,
                }}
              >
                {icon ? (
                  <HugeiconsIcon icon={icon} size={18} />
                ) : (
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: cat.color || COLORS.TEXT_MUTED }} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                  {cat.nombre}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <CategoriaBadge categoria={cat.categoria} />
                  {cat.descripcion && (
                    <span className="text-[10px] truncate" style={{ color: COLORS.TEXT_MUTED }}>
                      {cat.descripcion}
                    </span>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(cat.id) }}
                    className="size-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(cat.id, cat.nombre) }}
                    className="size-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface CursoColumnProps {
  cursos: Curso[]
  selectedId: string | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
  contextCatalogo?: CatalogoCurso
  loading: boolean
  onBack?: () => void
}

function CursoColumn({ cursos, selectedId, search, onSearchChange, onSelect, contextCatalogo, loading, onBack }: CursoColumnProps) {
  const title = contextCatalogo ? `Cursos de "${contextCatalogo.nombre}"` : "Cursos Activos"

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 p-4">
      <ColumnHeader title={title} count={cursos.length} onBack={onBack} backLabel="Catálogos">
        {contextCatalogo && <ColumnSearch value={search} onChange={onSearchChange} placeholder="Buscar curso..." />}
      </ColumnHeader>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {!contextCatalogo ? (
          <EmptyState
            icon={<HugeiconsIcon icon={GraduationCapIcon} size={32} style={{ color: COLORS.TEXT_MUTED }} />}
            message="Selecciona un catálogo"
          />
        ) : loading ? (
          <ColumnLoader />
        ) : cursos.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={GraduationCapIcon} size={32} style={{ color: COLORS.TEXT_MUTED }} />}
            message={search ? "Sin resultados" : "No hay cursos en este catálogo"}
          />
        ) : cursos.map((curso) => {
          const isSelected = selectedId === curso.id
          return (
            <button
              key={curso.id}
              onClick={() => onSelect(curso.id)}
              className={cn(
                "w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden",
                isSelected ? "shadow-sm" : "hover:shadow-sm"
              )}
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                borderLeftColor: isSelected ? (curso.colorCatalogo || COLORS.ACCENT) : COLORS.BORDER_SUBTLE,
                borderLeftWidth: isSelected ? 3 : 1,
              }}
            >
              <div
                className="px-4 py-3.5"
                style={{
                  backgroundColor: isSelected && curso.colorCatalogo
                    ? `color-mix(in srgb, ${curso.colorCatalogo} 8%, transparent)`
                    : "white",
                }}
              >
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
        })}
      </div>
    </div>
  )
}

interface EstudianteColumnProps {
  matriculas: MatriculaDetallada[]
  totalCount: number
  selectedCurso?: Curso
  search: string
  onSearchChange: (v: string) => void
  loading: boolean
  onBack?: () => void
}

function EstudianteColumn({ matriculas, totalCount, selectedCurso, search, onSearchChange, loading, onBack }: EstudianteColumnProps) {
  const title = selectedCurso ? `Estudiantes de "${selectedCurso.nombre}"` : "Estudiantes"

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 p-4">
      <ColumnHeader title={title} count={matriculas.length} onBack={onBack} backLabel="Cursos">
        {selectedCurso && <ColumnSearch value={search} onChange={onSearchChange} placeholder="Buscar estudiante..." />}
      </ColumnHeader>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {!selectedCurso ? (
          <EmptyState icon={<Users size={32} style={{ color: COLORS.TEXT_MUTED }} />} message="Selecciona un curso" />
        ) : loading ? (
          <ColumnLoader />
        ) : matriculas.length === 0 ? (
          <EmptyState
            icon={<Users size={32} style={{ color: COLORS.TEXT_MUTED }} />}
            message={totalCount > 0 ? "Sin resultados" : "Sin estudiantes inscritos"}
          />
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
        })}
      </div>
    </div>
  )
}

// ============================================================================
// PÁGINA
// ============================================================================

export function CatalogosConCursosPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const isMobile = useIsMobile()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [catalogoToDelete, setCatalogoToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingCatalogo, setDeletingCatalogo] = useState(false)

  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [searchCatalogo, setSearchCatalogo] = useState("")

  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [searchCurso, setSearchCurso] = useState("")
  const [loadingCursos, setLoadingCursos] = useState(false)

  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [searchEstudiante, setSearchEstudiante] = useState("")
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
    if (!selectedCatalogoId) {
      setCursos([])
      setSearchCurso("")
      return
    }
    const load = async () => {
      setLoadingCursos(true)
      try {
        const res = await cursosService.getCursos({
          catalogo_curso_id: selectedCatalogoId,
          search: searchCurso || undefined,
        })
        setCursos(res.data || [])
      } catch { toast.error("Error al cargar cursos") }
      finally { setLoadingCursos(false) }
    }
    load()
  }, [selectedCatalogoId, searchCurso])

  useEffect(() => {
    if (!selectedCursoId) {
      setMatriculas([])
      setSearchEstudiante("")
      return
    }
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
  const selectedCurso = cursos.find(c => c.id === selectedCursoId)

  const filteredMatriculas = useMemo(() => {
    const q = searchEstudiante.trim().toLowerCase()
    if (!q) return matriculas
    return matriculas.filter((m) => {
      const e = getEstudianteData(m)
      if (!e) return false
      return `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q)
        || e.cedula.toLowerCase().includes(q)
        || (e.correo || "").toLowerCase().includes(q)
    })
  }, [matriculas, searchEstudiante])

  const handleSelectCatalogo = (id: string) => {
    setSelectedCatalogoId(id === selectedCatalogoId ? null : id)
    setSelectedCursoId(null)
    setMatriculas([])
  }

  const handleSelectCurso = (id: string) => {
    setSelectedCursoId(id === selectedCursoId ? null : id)
  }

  const handleBackFromCursos = () => {
    setSelectedCatalogoId(null)
    setSelectedCursoId(null)
    setMatriculas([])
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

  const mobileStage = selectedCursoId ? 2 : selectedCatalogoId ? 1 : 0

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
        {isMobile ? (
          <>
            {mobileStage === 0 && (
              <CatalogoColumn
                catalogos={catalogos}
                selectedId={selectedCatalogoId}
                search={searchCatalogo}
                onSearchChange={setSearchCatalogo}
                onSelect={handleSelectCatalogo}
                onEdit={(id) => navigate(`/catalogos/${id}/editar`)}
                onDelete={handleDeleteCatalogo}
                isAdmin={isAdmin}
              />
            )}
            {mobileStage === 1 && (
              <CursoColumn
                cursos={cursos}
                selectedId={selectedCursoId}
                search={searchCurso}
                onSearchChange={setSearchCurso}
                onSelect={handleSelectCurso}
                contextCatalogo={selectedCatalogo}
                loading={loadingCursos}
                onBack={handleBackFromCursos}
              />
            )}
            {mobileStage === 2 && (
              <EstudianteColumn
                matriculas={filteredMatriculas}
                totalCount={matriculas.length}
                selectedCurso={selectedCurso}
                search={searchEstudiante}
                onSearchChange={setSearchEstudiante}
                loading={loadingMatriculas}
                onBack={() => setSelectedCursoId(null)}
              />
            )}
          </>
        ) : (
          <>
            <div className="w-[28%] min-w-[260px] border-r flex flex-col min-h-0"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <CatalogoColumn
                catalogos={catalogos}
                selectedId={selectedCatalogoId}
                search={searchCatalogo}
                onSearchChange={setSearchCatalogo}
                onSelect={handleSelectCatalogo}
                onEdit={(id) => navigate(`/catalogos/${id}/editar`)}
                onDelete={handleDeleteCatalogo}
                isAdmin={isAdmin}
              />
            </div>
            <div className="w-[36%] min-w-[280px] border-r flex flex-col min-h-0"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <CursoColumn
                cursos={cursos}
                selectedId={selectedCursoId}
                search={searchCurso}
                onSearchChange={setSearchCurso}
                onSelect={handleSelectCurso}
                contextCatalogo={selectedCatalogo}
                loading={loadingCursos}
              />
            </div>
            <div className="flex-1 min-w-[260px] flex flex-col min-h-0">
              <EstudianteColumn
                matriculas={filteredMatriculas}
                totalCount={matriculas.length}
                selectedCurso={selectedCurso}
                search={searchEstudiante}
                onSearchChange={setSearchEstudiante}
                loading={loadingMatriculas}
              />
            </div>
          </>
        )}
      </div>

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
