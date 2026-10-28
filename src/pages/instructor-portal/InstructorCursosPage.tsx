import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router"
import {
  Building2,
  Globe,
  MapPin,
  Clock,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Play,
  Calendar,
  CheckCircle2,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { instructorService, type InstructorCurso } from "@/services/instructor.service"
import { toast } from "sonner"

type TabModalidad = "todos" | "presencial" | "virtual"
type SubTabEstado = "todos" | "en_progreso" | "por_iniciar" | "completados"

const statusConfig: Record<string, { color: string; label: string; bg: string; border: string }> = {
  pendiente: { color: "#d97706", label: "Por iniciar", bg: "#fef3c7", border: "#fde68a" },
  por_iniciar: { color: "#d97706", label: "Por iniciar", bg: "#fef3c7", border: "#fde68a" },
  activo: { color: "#2563eb", label: "En progreso", bg: "#dbeafe", border: "#bfdbfe" },
  en_progreso: { color: "#2563eb", label: "En progreso", bg: "#dbeafe", border: "#bfdbfe" },
  completado: { color: "#059669", label: "Completado", bg: "#d1fae5", border: "#a7f3d0" },
  finalizado: { color: "#059669", label: "Completado", bg: "#d1fae5", border: "#a7f3d0" },
  aprobado: { color: "#059669", label: "Completado", bg: "#d1fae5", border: "#a7f3d0" },
}

function getStatusConfig(estado: string) {
  const norm = estado.toLowerCase().trim()
  return (
    statusConfig[norm] ?? {
      color: "#4b5563",
      label: estado,
      bg: "#f3f4f6",
      border: "#e5e7eb",
    }
  )
}

function inferModality(curso: InstructorCurso): "presencial" | "virtual" {
  if (curso.modalidad === "presencial" || curso.modalidad === "virtual") return curso.modalidad
  const ref = (curso.horario?.nombre_referencial ?? "").toLowerCase()
  if (ref.includes("virtual") || ref.includes("online") || ref.includes("zoom") || ref.includes("meet")) return "virtual"
  return "presencial"
}

function matchesSubTab(curso: InstructorCurso, subTab: SubTabEstado): boolean {
  if (subTab === "todos") return true
  const norm = curso.estado.toLowerCase().trim()

  if (subTab === "en_progreso") {
    return norm === "en_progreso" || norm === "activo"
  }
  if (subTab === "por_iniciar") {
    return norm === "pendiente" || norm === "por_iniciar"
  }
  if (subTab === "completados") {
    return norm === "completado" || norm === "finalizado" || norm === "aprobado"
  }
  return true
}

function CursoCard({ curso }: { curso: InstructorCurso }) {
  const status = getStatusConfig(curso.estado)
  const esVirtual = inferModality(curso) === "virtual"

  return (
    <Link
      to={`/instructor/cursos/${curso.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 p-5 transition-all duration-200 hover:border-orange-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.99] overflow-hidden"
    >
      {/* Indicador de acento superior sutil */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-0 group-hover:opacity-100"
        style={{ backgroundColor: COLORS.ACCENT }}
      />

      {/* Cabecera de la tarjeta: Icono modalidad + Estado */}
      <div className="flex items-start justify-between gap-2 mb-3.5">
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: esVirtual ? "oklch(0.96 0.03 280)" : "oklch(0.97 0.04 45)",
            borderColor: esVirtual ? "oklch(0.90 0.05 280)" : "oklch(0.90 0.06 45)",
            color: esVirtual ? "#7c3aed" : COLORS.ACCENT,
          }}
          title={esVirtual ? "Modalidad Virtual" : "Modalidad Presencial"}
        >
          {esVirtual ? <Globe size={20} /> : <Building2 size={20} />}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs"
            style={{
              backgroundColor: status.bg,
              borderColor: status.border,
              color: status.color,
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {status.label}
          </span>
        </div>
      </div>

      {/* Título y Catálogo */}
      <div className="mb-3.5">
        <h3
          className="text-base font-extrabold leading-snug tracking-tight text-slate-900 group-hover:text-[#fd761a] transition-colors line-clamp-2"
          title={curso.nombre_instancia}
        >
          {curso.nombre_instancia}
        </h3>
        <p className="text-xs mt-1 flex items-center gap-1.5 text-slate-500 font-medium">
          {curso.catalogo?.color ? (
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: curso.catalogo.color }}
            />
          ) : (
            <span className="size-2 rounded-full shrink-0 bg-slate-300" />
          )}
          <span className="truncate">{curso.catalogo?.nombre ?? "Sin catálogo"}</span>
        </p>
      </div>

      {/* Metadatos del curso */}
      <div className="space-y-2 flex-1 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <MapPin size={15} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {curso.ciudad?.nombre ? curso.ciudad.nombre : esVirtual ? "Plataforma Virtual" : "Sede no asignada"}
          </span>
          <span className="ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {esVirtual ? "Virtual" : "Presencial"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <Clock size={15} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {new Date(curso.fecha_inicio).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {" — "}
            {curso.fecha_fin
              ? new Date(curso.fecha_fin).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Sin fin"}
          </span>
        </div>
      </div>

      {/* Acción inferior */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-bold transition-all group-hover:translate-x-0.5"
          style={{ color: COLORS.ACCENT }}
        >
          <span>Gestionar clases y asistencias</span>
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  )
}

export function InstructorCursosPage() {
  const [cursos, setCursos] = useState<InstructorCurso[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [tabModalidad, setTabModalidad] = useState<TabModalidad>("todos")
  const [subTabEstado, setSubTabEstado] = useState<SubTabEstado>("todos")
  const [ciudadFilter, setCiudadFilter] = useState("todos")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const loadCursos = async () => {
    try {
      const data = await instructorService.getMisCursos()
      setCursos(data)
    } catch {
      toast.error("Error al cargar tus cursos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCursos()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 250)
    return () => clearTimeout(timer)
  }, [searchInput])

  const ciudades = useMemo(() => {
    const set = new Set(cursos.map((c) => c.ciudad?.nombre).filter(Boolean))
    return Array.from(set).sort() as string[]
  }, [cursos])

  // Contadores por modalidad
  const countsModalidad = useMemo(() => {
    const presenciales = cursos.filter((c) => inferModality(c) === "presencial").length
    const virtuales = cursos.filter((c) => inferModality(c) === "virtual").length
    return {
      todos: cursos.length,
      presencial: presenciales,
      virtual: virtuales,
    }
  }, [cursos])

  // Cursos filtrados por modalidad y ciudad para calcular los conteos de sub-tabs en contexto
  const cursosEnModalidadYCiudad = useMemo(() => {
    return cursos.filter((c) => {
      if (tabModalidad !== "todos" && inferModality(c) !== tabModalidad) return false
      if (ciudadFilter !== "todos" && c.ciudad?.nombre !== ciudadFilter) return false
      return true
    })
  }, [cursos, tabModalidad, ciudadFilter])

  // Contadores dinámicos para los sub-tabs según la modalidad activa
  const countsSubTabs = useMemo(() => {
    return {
      todos: cursosEnModalidadYCiudad.length,
      en_progreso: cursosEnModalidadYCiudad.filter((c) => matchesSubTab(c, "en_progreso")).length,
      por_iniciar: cursosEnModalidadYCiudad.filter((c) => matchesSubTab(c, "por_iniciar")).length,
      completados: cursosEnModalidadYCiudad.filter((c) => matchesSubTab(c, "completados")).length,
    }
  }, [cursosEnModalidadYCiudad])

  // Cursos finales que se muestran en el grid
  const cursosVisibles = useMemo(() => {
    return cursos.filter((c) => {
      // 1. Filtro de Modalidad
      if (tabModalidad !== "todos" && inferModality(c) !== tabModalidad) return false

      // 2. Filtro de Sub-tab de Estado
      if (!matchesSubTab(c, subTabEstado)) return false

      // 3. Filtro de Ciudad
      if (ciudadFilter !== "todos" && c.ciudad?.nombre !== ciudadFilter) return false

      // 4. Búsqueda por texto (nombre de instancia, catálogo o ciudad)
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const nameMatch = (c.nombre_instancia || "").toLowerCase().includes(q)
        const catMatch = (c.catalogo?.nombre || "").toLowerCase().includes(q)
        const ciudadMatch = (c.ciudad?.nombre || "").toLowerCase().includes(q)
        if (!nameMatch && !catMatch && !ciudadMatch) return false
      }

      return true
    })
  }, [cursos, tabModalidad, subTabEstado, ciudadFilter, search])

  // Conteo de filtros secundarios activos en móvil
  const activeFiltersCount = (tabModalidad !== "todos" ? 1 : 0) + (ciudadFilter !== "todos" ? 1 : 0)

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto animate-spin">
          <BookOpen size={20} />
        </div>
        <p className="text-sm font-bold text-slate-500">Cargando tus cursos asignados...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Mis Cursos Asignados
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta y gestiona las clases, asistencias y participantes de tus cursos.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
            {cursos.length} curso{cursos.length !== 1 ? "s" : ""} asignado{cursos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {cursos.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-slate-200/90 shadow-sm">
          <div
            className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "oklch(0.96 0.04 45)" }}
          >
            <BookOpen size={30} style={{ color: COLORS.ACCENT }} />
          </div>
          <h3 className="text-lg font-black text-slate-900">No tienes cursos asignados</h3>
          <p className="text-sm mt-1 text-slate-500 max-w-md mx-auto">
            Actualmente no figuras como instructor asignado a ningún curso activo. Contacta con coordinación académica si consideras que es un error.
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              VISTA MÓVIL (< md): ULTRA COMPACTA, 2 FILAS Y SIN SCROLL HORIZONTAL
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="md:hidden space-y-2.5">
            {/* Fila 1: Buscador + Botón Filtros */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar curso o catálogo..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-medium border rounded-xl outline-none bg-white text-slate-800 border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 shadow-2xs transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Botón Filtros (Abre Drawer con Modalidad y Ciudad) */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border shadow-2xs transition-all shrink-0 cursor-pointer ${
                  activeFiltersCount > 0
                    ? "bg-orange-50 border-orange-300 text-orange-600 font-extrabold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="size-4.5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Fila 2: Grid simétrico de 4 columnas para Estados (sin scroll horizontal) */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-center">
              <button
                type="button"
                onClick={() => setSubTabEstado("todos")}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  subTabEstado === "todos"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Todos</span>
                <span
                  className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                    subTabEstado === "todos" ? "bg-slate-900 text-white font-mono" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {countsSubTabs.todos}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabEstado("en_progreso")}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  subTabEstado === "en_progreso"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-blue-700 hover:bg-blue-50"
                }`}
              >
                <span>En curso</span>
                <span
                  className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                    subTabEstado === "en_progreso" ? "bg-white/20 text-white font-mono" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {countsSubTabs.en_progreso}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabEstado("por_iniciar")}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  subTabEstado === "por_iniciar"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                <span>Por iniciar</span>
                <span
                  className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                    subTabEstado === "por_iniciar" ? "bg-white/20 text-white font-mono" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {countsSubTabs.por_iniciar}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubTabEstado("completados")}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  subTabEstado === "completados"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                <span>Finalizados</span>
                <span
                  className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                    subTabEstado === "completados" ? "bg-white/20 text-white font-mono" : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {countsSubTabs.completados}
                </span>
              </button>
            </div>

            {/* Fila 3: Chips de filtros activos eliminables con 1 toque */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-500 font-medium">Filtros:</span>
                {tabModalidad !== "todos" && (
                  <button
                    type="button"
                    onClick={() => setTabModalidad("todos")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold cursor-pointer"
                  >
                    <span>{tabModalidad === "presencial" ? "Presencial" : "Virtual"}</span>
                    <X size={12} />
                  </button>
                )}
                {ciudadFilter !== "todos" && (
                  <button
                    type="button"
                    onClick={() => setCiudadFilter("todos")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    <span>{ciudadFilter}</span>
                    <X size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTabModalidad("todos")
                    setCiudadFilter("todos")
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1 cursor-pointer"
                >
                  Limpiar todo
                </button>
              </div>
            )}
          </div>

          {/* Modal / Bottom Sheet para Filtros Móviles */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div
                className="fixed inset-0"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
                {/* Header del modal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Filtros de Modalidad y Ciudad</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="size-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modalidad */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Modalidad
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "todos", label: "Todas", icon: GraduationCap, count: countsModalidad.todos },
                      { id: "presencial", label: "Presencial", icon: Building2, count: countsModalidad.presencial },
                      { id: "virtual", label: "Virtual", icon: Globe, count: countsModalidad.virtual },
                    ].map((item) => {
                      const Icon = item.icon
                      const active = tabModalidad === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTabModalidad(item.id as TabModalidad)}
                          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? "bg-orange-50 border-orange-300 text-orange-700 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Icon size={18} className={active ? "text-orange-600" : "text-slate-400"} />
                          <span>{item.label}</span>
                          <span className={`text-[10px] px-1.5 rounded-full ${active ? "bg-orange-200/60 text-orange-900" : "bg-slate-200 text-slate-600"}`}>
                            {item.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Ciudad */}
                {ciudades.length > 0 && tabModalidad !== "virtual" && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ciudad o Sede
                    </label>
                    <select
                      value={ciudadFilter}
                      onChange={(e) => setCiudadFilter(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-bold border rounded-xl bg-slate-50 text-slate-800 border-slate-200 outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="todos">Todas las ciudades</option>
                      {ciudades.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTabModalidad("todos")
                        setCiudadFilter("todos")
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      Restablecer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-xs cursor-pointer"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              VISTA ESCRITORIO (>= md): BARRA COMPLETA Y ELEGANTE
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="hidden md:block bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav className="inline-flex p-1 rounded-xl bg-slate-100/90 gap-1 border border-slate-200/70" aria-label="Modalidad">
                <button
                  type="button"
                  onClick={() => setTabModalidad("todos")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tabModalidad === "todos"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <GraduationCap size={15} />
                  <span>Todos los cursos</span>
                  <span
                    className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      tabModalidad === "todos" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {countsModalidad.todos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabModalidad("presencial")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tabModalidad === "presencial"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Building2 size={15} className="text-[#fd761a]" />
                  <span>Presenciales</span>
                  <span
                    className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      tabModalidad === "presencial" ? "bg-[#fd761a] text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {countsModalidad.presencial}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabModalidad("virtual")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tabModalidad === "virtual"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Globe size={15} className="text-violet-600" />
                  <span>Virtuales</span>
                  <span
                    className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      tabModalidad === "virtual" ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {countsModalidad.virtual}
                  </span>
                </button>
              </nav>

              {/* Selector de Ciudad */}
              {ciudades.length > 0 && tabModalidad !== "virtual" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Ciudad:</span>
                  <select
                    value={ciudadFilter}
                    onChange={(e) => setCiudadFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-bold border rounded-xl bg-white text-slate-700 border-slate-200 outline-none hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <option value="todos">Todas las ciudades</option>
                    {ciudades.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sub-tabs segmentados + Buscador en escritorio */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" role="tablist">
                <button
                  type="button"
                  onClick={() => setSubTabEstado("todos")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subTabEstado === "todos"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>Todos</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      subTabEstado === "todos" ? "bg-white/20 text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    {countsSubTabs.todos}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabEstado("en_progreso")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subTabEstado === "en_progreso"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                  }`}
                >
                  <Play size={13} />
                  <span>En curso / En progreso</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      subTabEstado === "en_progreso" ? "bg-white/20 text-white" : "bg-white text-blue-800"
                    }`}
                  >
                    {countsSubTabs.en_progreso}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabEstado("por_iniciar")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subTabEstado === "por_iniciar"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                  }`}
                >
                  <Calendar size={13} />
                  <span>Por iniciar</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      subTabEstado === "por_iniciar" ? "bg-white/20 text-white" : "bg-white text-amber-900"
                    }`}
                  >
                    {countsSubTabs.por_iniciar}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubTabEstado("completados")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subTabEstado === "completados"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>Completados</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      subTabEstado === "completados" ? "bg-white/20 text-white" : "bg-white text-emerald-900"
                    }`}
                  >
                    {countsSubTabs.completados}
                  </span>
                </button>
              </div>

              {/* Buscador de cursos en escritorio */}
              <div className="relative w-72 shrink-0">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar curso o catálogo..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs font-medium border rounded-xl outline-none bg-slate-50/70 text-slate-800 border-slate-200 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              GRID DE RESULTADOS
              ═══════════════════════════════════════════════════════════════════ */}
          {cursosVisibles.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
              <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No se encontraron cursos
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay cursos que coincidan con la modalidad, el estado o la búsqueda seleccionada.
              </p>
              {(search || subTabEstado !== "todos" || tabModalidad !== "todos" || ciudadFilter !== "todos") && (
                <button
                  type="button"
                  onClick={() => {
                    setTabModalidad("todos")
                    setSubTabEstado("todos")
                    setCiudadFilter("todos")
                    setSearchInput("")
                    setSearch("")
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#fd761a] text-xs font-bold transition-colors inline-block cursor-pointer"
                >
                  Restablecer todos los filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
                <span>
                  Mostrando <strong className="text-slate-800 font-bold">{cursosVisibles.length}</strong> curso
                  {cursosVisibles.length !== 1 ? "s" : ""}
                </span>
                {cursosVisibles.length < cursos.length && (
                  <span className="text-[11px] text-slate-400">
                    Filtrado de un total de {cursos.length}
                  </span>
                )}
              </div>

              <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                {cursosVisibles.map((curso) => (
                  <CursoCard key={curso.id} curso={curso} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
