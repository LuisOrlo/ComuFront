/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpenIcon,
  Search01Icon,
  UserGroupIcon,
  CalendarIcon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock04Icon,
} from "@hugeicons/core-free-icons"
import { tallerService, type Taller } from "@/services/taller.service"
import { authService } from "@/services/auth.service"
import { ModalidadBadge, EstadoBadge, CiudadBadge } from "@/pages/estudiantes/components/Badges"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [10, 15, 25, 50]

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getCiudadNombre(t?: Taller | null): string {
  if (!t) return ""
  if (typeof t.ciudad === "object" && t.ciudad !== null) {
    return t.ciudad.nombre || ""
  }
  if (typeof t.ciudad === "string") {
    return t.ciudad
  }
  return ""
}

export function InstructorTalleresPage() {
  const navigate = useNavigate()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"hoy" | "proximos" | "completados" | "todos">("proximos")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [ciudadFilter, setCiudadFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const loadTalleres = useCallback(async () => {
    setLoading(true)
    try {
      let personaId = localStorage.getItem("user_persona_id")
      if (!personaId) {
        try {
          const perfil = await authService.getProfile()
          personaId = (perfil as any).datos?.persona?.id
          if (personaId) localStorage.setItem("user_persona_id", personaId)
        } catch {
          return
        }
      }
      if (!personaId) return

      const params: Record<string, unknown> = {
        per_page: 300,
        instructor_id: personaId,
      }
      const res = await tallerService.listar(params)
      const data = (res as any).data || (res as any).datos || res
      setTalleres(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar talleres")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTalleres()
  }, [loadTalleres])

  const hoyLocal = todayLocal()

  // Estadísticas KPI calculadas
  const stats = useMemo(() => {
    const now = new Date(new Date().toDateString())

    const hoyList = talleres.filter((t) => {
      if (!t.fecha || t.estado === "cancelado") return false
      const fStr = t.fecha.substring(0, 10)
      return fStr === hoyLocal
    })

    const proximos = talleres.filter((t) => {
      if (!t.fecha || t.estado === "cancelado") return false
      const f = new Date(t.fecha.includes("T") ? t.fecha : t.fecha + "T00:00:00")
      return f >= now && t.estado !== "completado"
    })

    const completados = talleres.filter((t) => t.estado === "completado")
    const totalInscritos = talleres.reduce((s, t) => s + (t.inscripciones_count || 0), 0)

    return {
      hoy: hoyList.length,
      proximos: proximos.length,
      completados: completados.length,
      total_inscritos: totalInscritos,
      total: talleres.length,
    }
  }, [talleres, hoyLocal])

  // Lista de ciudades disponibles para filtro
  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>()
    talleres.forEach((t) => {
      const c = getCiudadNombre(t)
      if (c) set.add(c.trim())
    })
    return Array.from(set).sort()
  }, [talleres])

  // Filtrado de talleres
  const filteredTalleres = useMemo(() => {
    const now = new Date(new Date().toDateString())

    return talleres.filter((t) => {
      // Filtro de pestaña
      if (tab === "hoy") {
        const fStr = t.fecha?.substring(0, 10)
        if (fStr !== hoyLocal) return false
      } else if (tab === "proximos") {
        if (!t.fecha || t.estado === "cancelado") return false
        const f = new Date(t.fecha.includes("T") ? t.fecha : t.fecha + "T00:00:00")
        if (f < now || t.estado === "completado") return false
      } else if (tab === "completados") {
        if (t.estado !== "completado") return false
      }

      // Filtro de modalidad
      if (modalidadFilter && t.modalidad !== modalidadFilter) {
        return false
      }

      // Filtro de ciudad
      if (ciudadFilter) {
        const c = getCiudadNombre(t)
        if (c.toLowerCase() !== ciudadFilter.toLowerCase()) return false
      }

      // Buscador
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchNombre = t.nombre?.toLowerCase().includes(q)
        const matchCiudad = getCiudadNombre(t).toLowerCase().includes(q)
        if (!matchNombre && !matchCiudad) return false
      }

      return true
    })
  }, [talleres, tab, modalidadFilter, ciudadFilter, search, hoyLocal])

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPage(1)
  }, [tab, modalidadFilter, ciudadFilter, search])

  // Paginación
  const totalRows = filteredTalleres.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const paginatedTalleres = useMemo(() => {
    const fromIndex = (page - 1) * pageSize
    return filteredTalleres.slice(fromIndex, fromIndex + pageSize)
  }, [filteredTalleres, page, pageSize])

  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalRows)

  const formatFecha = (f?: string) => {
    if (!f) return "—"
    try {
      const d = new Date(f.includes("T") ? f : f + "T00:00:00")
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch {
      return f
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-[#f8f9ff]">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cabecera Principal y Acciones */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[#0b1c30]">
                Mis Talleres
              </h1>
              <p className="text-xs sm:text-sm text-[#45464d]">
                Consulta y gestiona las sesiones prácticas y talleres donde eres el instructor asignado.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadTalleres}
                disabled={loading}
                className="h-10 px-3.5 rounded-xl bg-white text-[#0b1c30] text-xs font-semibold shadow-xs hover:bg-[#eff4ff] transition-all flex items-center gap-2 cursor-pointer border border-[#c6c6cd]/30 disabled:opacity-60"
                title="Actualizar talleres"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={16}
                  className={loading ? "animate-spin text-[#fd761a]" : "text-[#76777d]"}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </header>

          {/* Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* KPI 1: Próximos */}
            <div
              onClick={() => setTab("proximos")}
              className={`p-3 sm:p-3.5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "proximos"
                  ? "border-[#fd761a] ring-2 ring-[#fd761a]/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Próximos
                </span>
                <div className="size-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CalendarIcon} size={14} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1.5 font-mono">
                {stats.proximos}
              </div>
              <span className="text-[10px] text-[#45464d] mt-0.5 block">
                Por realizarse
              </span>
            </div>

            {/* KPI 2: Hoy */}
            <div
              onClick={() => setTab("hoy")}
              className={`p-3 sm:p-3.5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "hoy"
                  ? "border-emerald-500 ring-2 ring-emerald-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Para Hoy
                </span>
                <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Clock04Icon} size={14} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1.5 font-mono">
                {stats.hoy}
              </div>
              <span className="text-[10px] text-[#45464d] mt-0.5 block">
                Jornada activa hoy
              </span>
            </div>

            {/* KPI 3: Completados */}
            <div
              onClick={() => setTab("completados")}
              className={`p-3 sm:p-3.5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "completados"
                  ? "border-blue-500 ring-2 ring-blue-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Completados
                </span>
                <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1.5 font-mono">
                {stats.completados}
              </div>
              <span className="text-[10px] text-[#45464d] mt-0.5 block">
                Talleres finalizados
              </span>
            </div>

            {/* KPI 4: Total Alumnos Asignados */}
            <div
              onClick={() => setTab("todos")}
              className={`p-3 sm:p-3.5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "todos"
                  ? "border-slate-800 ring-2 ring-slate-800/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#76777d]">
                  Total Alumnos
                </span>
                <div className="size-7 rounded-lg bg-[#eff4ff] text-[#0b1c30] flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={14} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#0b1c30] mt-1.5 font-mono">
                {stats.total_inscritos}
              </div>
              <span className="text-[10px] text-[#45464d] mt-0.5 block">
                En {stats.total} talleres asignados
              </span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#c6c6cd]/25 shadow-xs">
            {/* Tabs de Filtro de Estado */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {(
                [
                  { key: "proximos", label: "Próximos", count: stats.proximos },
                  { key: "hoy", label: "Hoy", count: stats.hoy },
                  { key: "completados", label: "Completados", count: stats.completados },
                  { key: "todos", label: "Todos", count: stats.total },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    tab === item.key
                      ? "bg-[#fd761a] text-white shadow-xs"
                      : "text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      tab === item.key
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Buscador y Selectores */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Buscador */}
              <div className="relative flex-1 sm:w-60 min-w-[180px]">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d] pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar taller o ciudad..."
                  className="w-full pl-9 pr-3 py-2 bg-[#f8f9ff] hover:bg-white focus:bg-white rounded-xl text-xs text-[#0b1c30] border border-[#c6c6cd]/30 placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all shadow-2xs"
                />
              </div>

              {/* Selector Modalidad */}
              <select
                value={modalidadFilter}
                onChange={(e) => setModalidadFilter(e.target.value)}
                className="h-9 px-3 py-1.5 bg-[#f8f9ff] hover:bg-white focus:bg-white rounded-xl text-xs font-medium text-[#0b1c30] border border-[#c6c6cd]/30 focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all cursor-pointer shadow-2xs"
              >
                <option value="">Todas las modalidades</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrida">Híbrida</option>
              </select>

              {/* Selector Ciudad (si hay opciones) */}
              {ciudadesDisponibles.length > 0 && (
                <select
                  value={ciudadFilter}
                  onChange={(e) => setCiudadFilter(e.target.value)}
                  className="h-9 px-3 py-1.5 bg-[#f8f9ff] hover:bg-white focus:bg-white rounded-xl text-xs font-medium text-[#0b1c30] border border-[#c6c6cd]/30 focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all cursor-pointer shadow-2xs"
                >
                  <option value="">Todas las ciudades</option>
                  {ciudadesDisponibles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tabla de Talleres */}
          <div className="bg-white rounded-2xl border border-[#c6c6cd]/25 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={24}
                  className="animate-spin text-[#fd761a] mx-auto mb-2"
                />
                Cargando talleres asignados...
              </div>
            ) : filteredTalleres.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-orange-50 text-[#fd761a] mx-auto flex items-center justify-center">
                  <HugeiconsIcon icon={BookOpenIcon} size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0b1c30]">No se encontraron talleres</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {search || modalidadFilter || ciudadFilter
                      ? "No hay resultados para los filtros seleccionados. Intenta restablecer los filtros."
                      : tab === "hoy"
                      ? "No tienes sesiones programadas para hoy."
                      : "No tienes talleres registrados en esta categoría."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e5eeff] bg-[#f8faff] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-5">Taller</th>
                      <th className="py-3 px-4">Fecha & Horario</th>
                      <th className="py-3 px-4">Ciudad</th>
                      <th className="py-3 px-4">Inscritos</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeff]">
                    {paginatedTalleres.map((t) => {
                      const esHoy = t.fecha?.substring(0, 10) === hoyLocal
                      const inscritos = t.inscripciones_count || 0
                      const capacidad = t.capacidad_maxima || 0
                      const cupoLleno = capacidad > 0 && inscritos >= capacidad
                      const ciudadNombre = getCiudadNombre(t)

                      return (
                        <tr
                          key={t.id}
                          onClick={() => navigate(`/instructor/talleres/${t.id}`)}
                          className="hover:bg-[#eff4ff]/40 transition-colors cursor-pointer group"
                        >
                          {/* Columna Taller */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-start gap-3">
                              <div className="size-9 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                <HugeiconsIcon icon={BookOpenIcon} size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[#0b1c30] group-hover:text-[#fd761a] transition-colors line-clamp-1">
                                  {t.nombre}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <ModalidadBadge modalidad={t.modalidad} />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna Fecha & Horario */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <HugeiconsIcon icon={CalendarIcon} size={13} className="text-slate-400 shrink-0" />
                              <span>{formatFecha(t.fecha)}</span>
                              {esHoy && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                  HOY
                                </span>
                              )}
                            </div>
                            {(t.hora_inicio || t.hora_fin) && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                                <HugeiconsIcon icon={Clock04Icon} size={12} />
                                <span>
                                  {t.hora_inicio?.substring(0, 5)} - {t.hora_fin?.substring(0, 5)}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Columna Ciudad */}
                          <td className="py-3.5 px-4">
                            <CiudadBadge ciudad={ciudadNombre || "Presencial"} />
                          </td>

                          {/* Columna Cupos / Inscritos */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {inscritos}
                              </span>
                              <span className="text-slate-400 font-mono text-xs">
                                / {capacidad || "—"}
                              </span>
                              {cupoLleno && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700">
                                  Lleno
                                </span>
                              )}
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  cupoLleno ? "bg-rose-500" : "bg-[#fd761a]"
                                )}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    capacidad > 0 ? (inscritos / capacidad) * 100 : 0
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>

                          {/* Columna Estado */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <EstadoBadge estado={t.estado} />
                          </td>

                          {/* Columna Acción */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/instructor/talleres/${t.id}`)
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#fd761a] hover:text-white bg-orange-50 hover:bg-[#fd761a] transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                            >
                              <span>Ver Taller</span>
                              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Barra de Paginación */}
            {filteredTalleres.length > 0 && (
              <div className="p-4 border-t border-[#c6c6cd]/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#45464d] bg-[#f8faff]">
                <div className="flex items-center gap-2">
                  <span>Mostrar</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-8 px-2.5 rounded-lg border border-[#c6c6cd]/40 bg-white font-medium text-[#0b1c30] outline-none focus:ring-1 focus:ring-[#fd761a] cursor-pointer"
                  >
                    {PAGE_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                  <span>filas por página</span>
                  <span className="text-slate-300 mx-1">|</span>
                  <span>
                    Mostrando <strong>{from}</strong> a <strong>{to}</strong> de{" "}
                    <strong>{totalRows}</strong> talleres
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-[#c6c6cd]/40 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Página anterior"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
                  </button>

                  <span className="px-3 font-mono text-xs font-bold text-slate-800">
                    Página {page} de {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-[#c6c6cd]/40 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Página siguiente"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
