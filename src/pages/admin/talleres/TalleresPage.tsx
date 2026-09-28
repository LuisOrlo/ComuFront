/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, Link } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpenIcon,
  Add01Icon,
  Search01Icon,
  ViewIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock04Icon,
} from "@hugeicons/core-free-icons"
import { tallerService, type Taller } from "@/services/taller.service"
import { ModalidadBadge, EstadoBadge, CiudadBadge } from "@/pages/estudiantes/components/Badges"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const PAGE_SIZES = [10, 15, 25, 50]

export function TalleresPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"proximos" | "pasados" | "todos">("proximos")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const loadTalleres = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { per_page: 300 }
      if (tab !== "todos") params.tab = tab
      if (modalidadFilter) params.modalidad = modalidadFilter
      if (estadoFilter) params.estado = estadoFilter
      if (search.trim()) params.search = search.trim()

      const res = await tallerService.listar(params)
      const data = (res as any).data || (res as any).datos || res
      setTalleres(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar talleres")
    } finally {
      setLoading(false)
    }
  }, [tab, modalidadFilter, estadoFilter, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTalleres()
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadTalleres, search])

  // Resetear a primera página al cambiar filtros
  useEffect(() => {
    setPage(1)
  }, [tab, modalidadFilter, estadoFilter, search])

  // Estadísticas KPI
  const stats = useMemo(() => {
    const now = new Date(new Date().toDateString())
    const proximos = talleres.filter((t) => {
      if (!t.fecha || t.estado === "cancelado") return false
      const f = new Date(t.fecha.includes("T") ? t.fecha : t.fecha + "T00:00:00")
      return f >= now
    })
    const completados = talleres.filter((t) => t.estado === "completado")
    const totalInscritos = talleres.reduce((s, t) => s + (t.inscripciones_count || 0), 0)

    return {
      proximos: proximos.length,
      completados: completados.length,
      total_inscritos: totalInscritos,
      total: talleres.length,
    }
  }, [talleres])

  // Formato legible de fecha
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

  // Paginación de clientes
  const totalRows = talleres.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const paginatedTalleres = useMemo(() => {
    const fromIndex = (page - 1) * pageSize
    return talleres.slice(fromIndex, fromIndex + pageSize)
  }, [talleres, page, pageSize])

  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalRows)

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-[#f8f9ff]">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cabecera Principal y Acciones */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[#0b1c30]">
                Talleres
              </h1>
              <p className="text-xs sm:text-sm text-[#45464d]">
                Gestión y programación de talleres prácticos, control de cupos, inscritos y asistencia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

              {isAdmin && (
                <Link
                  to="/talleres/nuevo"
                  className="h-10 px-4 sm:px-5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(253,118,26,0.25)] select-none"
                >
                  <HugeiconsIcon icon={Add01Icon} size={16} />
                  <span>Nuevo taller</span>
                </Link>
              )}
            </div>
          </header>

          {/* Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            {/* KPI 1: Próximos */}
            <div
              onClick={() => setTab("proximos")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "proximos"
                  ? "border-amber-500 ring-2 ring-amber-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Próximos
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CalendarIcon} size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">
                {stats.proximos}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Por realizarse
              </span>
            </div>

            {/* KPI 2: Completados */}
            <div
              onClick={() => setTab("pasados")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "pasados"
                  ? "border-emerald-500 ring-2 ring-emerald-500/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Completados
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">
                {stats.completados}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Talleres finalizados
              </span>
            </div>

            {/* KPI 3: Inscritos */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white shadow-xs border border-[#c6c6cd]/25">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb]">
                  Inscritos
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#2563eb] flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0b1c30] mt-2">
                {stats.total_inscritos}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Total estudiantes
              </span>
            </div>

            {/* KPI 4: Total General */}
            <div
              onClick={() => setTab("todos")}
              className={`p-4 sm:p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer ${
                tab === "todos"
                  ? "border-[#fd761a] ring-2 ring-[#fd761a]/15"
                  : "border-[#c6c6cd]/25 hover:border-[#c6c6cd]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                  Total Talleres
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#0b1c30] flex items-center justify-center">
                  <HugeiconsIcon icon={BookOpenIcon} size={18} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0b1c30] mt-2">
                {stats.total}
              </div>
              <span className="text-[11px] text-[#45464d] mt-1 block">
                Catálogo histórico
              </span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white rounded-2xl border border-[#c6c6cd]/25 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Selector de Pestañas (Próximos / Pasados / Todos) */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100/70 rounded-xl border border-[#c6c6cd]/20 self-start">
                {[
                  { key: "proximos" as const, label: "Próximos", count: stats.proximos },
                  { key: "pasados" as const, label: "Pasados", count: stats.completados },
                  { key: "todos" as const, label: "Todos", count: stats.total },
                ].map((t) => {
                  const isSelected = tab === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white text-[#fd761a] shadow-2xs"
                          : "text-[#76777d] hover:text-[#0b1c30]"
                      }`}
                    >
                      <span>{t.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected
                            ? "bg-[#ffdbca] text-[#783200]"
                            : "bg-gray-200/70 text-[#76777d]"
                        }`}
                      >
                        {t.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Filtros de Búsqueda, Modalidad y Estado */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Input de Búsqueda */}
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por taller, instructor..."
                    className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-xl text-xs border border-[#c6c6cd]/40 bg-gray-50/50 hover:bg-white focus:bg-white text-[#0b1c30] font-medium outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all shadow-2xs"
                  />
                </div>

                {/* Filtro Modalidad */}
                <select
                  value={modalidadFilter}
                  onChange={(e) => setModalidadFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-[#c6c6cd]/40 bg-white text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#fd761a]/20 cursor-pointer shadow-2xs"
                >
                  <option value="">Todas las modalidades</option>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>

                {/* Filtro Estado */}
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-[#c6c6cd]/40 bg-white text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#fd761a]/20 cursor-pointer shadow-2xs"
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Tabla de Talleres */}
            <div className="rounded-2xl border border-[#c6c6cd]/25 overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-[#c6c6cd]/15"
                      >
                        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-44" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-4 w-32 hidden md:block" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-24 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : talleres.length === 0 ? (
                  <div className="py-20 px-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center mx-auto">
                      <HugeiconsIcon icon={BookOpenIcon} size={28} />
                    </div>
                    <h3 className="font-bold text-base text-[#0b1c30]">No se encontraron talleres</h3>
                    <p className="text-xs text-[#45464d] max-w-sm mx-auto">
                      {search || modalidadFilter || estadoFilter
                        ? "No hay talleres que coincidan con los filtros aplicados. Intenta restablecer los criterios de búsqueda."
                        : "No tienes talleres registrados en esta sección actualmente."}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => navigate("/talleres/nuevo")}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={15} />
                        <span>Crear nuevo taller</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#eff4ff] border-b border-[#c6c6cd]/30 text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
                        <th className="py-3.5 px-5">Taller / Programa</th>
                        <th className="py-3.5 px-4">Instructor</th>
                        <th className="py-3.5 px-4">Fecha y Horario</th>
                        <th className="py-3.5 px-4">Modalidad</th>
                        <th className="py-3.5 px-4">Precio</th>
                        <th className="py-3.5 px-4">Capacidad / Cupos</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5eeff]/60 text-xs text-[#0b1c30]">
                      {paginatedTalleres.map((t) => {
                        const inscritos = t.inscripciones_count || 0
                        const capacidad = t.capacidad_maxima || 0
                        const porcentajeOcupacion =
                          capacidad > 0 ? Math.min(100, Math.round((inscritos / capacidad) * 100)) : 0
                        const isFull = capacidad > 0 && inscritos >= capacidad

                        return (
                          <tr
                            key={t.id}
                            onClick={() => navigate(`/talleres/${t.id}`)}
                            className="hover:bg-[#eff4ff]/40 transition-colors cursor-pointer group"
                          >
                            {/* Columna: Taller */}
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                  <HugeiconsIcon icon={BookOpenIcon} size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs sm:text-sm text-[#0b1c30] group-hover:text-[#fd761a] transition-colors truncate">
                                    {t.nombre}
                                  </p>
                                  {t.descripcion ? (
                                    <p className="text-[11px] text-[#76777d] truncate max-w-xs mt-0.5">
                                      {t.descripcion}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-[#76777d]/60 mt-0.5">Sin descripción</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Columna: Instructor */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {t.instructor ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-[#45464d]">
                                    {t.instructor.nombres?.[0]}
                                    {t.instructor.apellidos?.[0]}
                                  </div>
                                  <span className="font-semibold text-xs text-[#0b1c30]">
                                    {t.instructor.nombres} {t.instructor.apellidos}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-[#76777d] italic">No asignado</span>
                              )}
                            </td>

                            {/* Columna: Fecha y Horario */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0b1c30]">
                                  <HugeiconsIcon
                                    icon={CalendarIcon}
                                    size={13}
                                    className="text-[#76777d] shrink-0"
                                  />
                                  <span>{t.fecha ? formatFecha(t.fecha) : "Sin fecha"}</span>
                                  {t.fecha_fin && <span> - {formatFecha(t.fecha_fin)}</span>}
                                </div>
                                {(t.hora_inicio || t.hora_fin) && (
                                  <div className="flex items-center gap-1 text-[11px] text-[#76777d]">
                                    <HugeiconsIcon icon={Clock04Icon} size={11} className="shrink-0" />
                                    <span>
                                      {t.hora_inicio?.slice(0, 5)}
                                      {t.hora_fin ? ` a ${t.hora_fin.slice(0, 5)}` : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Columna: Modalidad y Ciudad */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <ModalidadBadge modalidad={t.modalidad} />
                                {t.ciudad?.nombre && <CiudadBadge ciudad={t.ciudad.nombre} />}
                              </div>
                            </td>

                            {/* Columna: Precio */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-bold text-xs sm:text-sm text-[#0b1c30]">
                                ${Number(t.precio || 0).toFixed(2)}
                              </span>
                            </td>

                            {/* Columna: Capacidad y Ocupación */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1 min-w-[110px]">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span
                                    className={cn(
                                      "font-bold",
                                      isFull ? "text-red-600" : "text-[#0b1c30]"
                                    )}
                                  >
                                    {inscritos} / {capacidad || "∞"} cupos
                                  </span>
                                  {capacidad > 0 && (
                                    <span className="text-[10px] text-[#76777d] font-semibold">
                                      {porcentajeOcupacion}%
                                    </span>
                                  )}
                                </div>
                                {capacidad > 0 && (
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        isFull
                                          ? "bg-red-500"
                                          : porcentajeOcupacion >= 80
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      )}
                                      style={{ width: `${porcentajeOcupacion}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Columna: Estado */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <EstadoBadge estado={t.estado} />
                            </td>

                            {/* Columna: Acciones */}
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <div
                                className="flex items-center justify-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => navigate(`/talleres/${t.id}`)}
                                  className="h-8 px-3 rounded-xl border border-[#c6c6cd]/40 bg-white text-[#0b1c30] hover:bg-[#eff4ff] hover:border-[#fd761a]/40 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="Ver detalle del taller"
                                >
                                  <HugeiconsIcon
                                    icon={ViewIcon}
                                    size={14}
                                    className="text-[#fd761a]"
                                  />
                                  <span>Ver detalle</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer de Paginación Integrado */}
              {!loading && totalRows > 0 && (
                <div className="p-3.5 px-5 bg-[#eff4ff]/80 border-t border-[#c6c6cd]/25 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  {/* Lado izquierdo: Filas por página y conteo */}
                  <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                    <div className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="text-[#45464d] font-medium">Filas por página:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value))
                          setPage(1)
                        }}
                        className="h-8 px-2.5 rounded-lg border border-[#c6c6cd]/40 bg-white text-xs font-bold text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#fd761a]/20 cursor-pointer shadow-2xs"
                      >
                        {PAGE_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[#c6c6cd] hidden sm:inline">|</span>
                    <span className="text-[#45464d] whitespace-nowrap">
                      Mostrando <strong className="text-[#0b1c30]">{from}–{to}</strong> de{" "}
                      <strong className="text-[#0b1c30]">{totalRows}</strong> talleres
                    </span>
                  </div>

                  {/* Lado derecho: Botones de navegación Anterior / Páginas / Siguiente */}
                  <div className="inline-flex items-center gap-1.5 flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-8 px-3 rounded-lg border border-[#c6c6cd]/30 bg-white text-[#0b1c30] text-xs font-semibold shadow-2xs hover:bg-[#eff4ff] hover:border-[#fd761a]/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <div className="inline-flex items-center gap-1 flex-nowrap">
                      {Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1
                        const isActive = page === pageNum

                        if (
                          totalPages > 7 &&
                          pageNum !== 1 &&
                          pageNum !== totalPages &&
                          Math.abs(pageNum - page) > 1
                        ) {
                          if (Math.abs(pageNum - page) === 2) {
                            return (
                              <span key={pageNum} className="px-1 text-[#76777d]">
                                ...
                              </span>
                            )
                          }
                          return null
                        }

                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setPage(pageNum)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? "bg-[#fd761a] text-white shadow-xs"
                                : "bg-white border border-[#c6c6cd]/30 text-[#0b1c30] hover:bg-[#eff4ff] hover:border-[#fd761a]/30"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="h-8 px-3 rounded-lg border border-[#c6c6cd]/30 bg-white text-[#0b1c30] text-xs font-semibold shadow-2xs hover:bg-[#eff4ff] hover:border-[#fd761a]/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
