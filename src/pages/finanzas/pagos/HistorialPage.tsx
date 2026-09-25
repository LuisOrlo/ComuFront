/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  InvoiceIcon,
  Cancel01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  CoinsDollarIcon,
  CreditCardIcon,
  BanknoteArrowDownIcon,
  ArrowDown01Icon,
  ImageIcon,
  Calendar03Icon,
  Calendar01Icon,
  Search01Icon,
  CheckListIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

const DEBOUNCE_MS = 350

const COLORS_MAP: Record<string, string> = {
  efectivo: "#0891b2",
  transfer: "#4f46e5",
  deposito: "#7c3aed",
  tarjeta: "#059669",
}

const ESTADO_CLASSES: Record<string, string> = {
  aprobado: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60",
  rechazado: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60",
  pendiente: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60",
}

const AVATAR_PALETTES = [
  "bg-[#ffdbca] text-[#783200] dark:bg-[#783200]/40 dark:text-[#ffdbca]",
  "bg-[#e5eeff] text-[#0b1c30] dark:bg-[#0b1c30]/50 dark:text-[#d3e4fe]",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
]

function getAvatarPalette(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

export function HistorialPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allTransacciones, setAllTransacciones] = useState<any[]>([])

  // Filters
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [metodoFilter, setMetodoFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")

  // Multi select
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Collapsible Groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Dropdown menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PER_PAGE = 50

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const params: Record<string, any> = { per_page: PER_PAGE, page }
        if (fechaDesde) params.fecha_desde = fechaDesde
        if (fechaHasta) params.fecha_hasta = fechaHasta
        if (search) params.search = search
        if (metodoFilter !== "todos") params.metodo_pago = metodoFilter
        if (tipoFilter !== "todos") params.tipo_movimiento = tipoFilter
        const res = await financeService.getHistorial(params)
        if (controller.signal.aborted) return

        setAllTransacciones(prev => page === 1 ? (res.data || []) : [...prev, ...(res.data || [])])
        setTotalPages(res.last_page || 1)
      } catch (err: any) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          toast.error("Error al cargar historial")
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [page, fechaDesde, fechaHasta, search, metodoFilter, tipoFilter])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1)
  }, [fechaDesde, fechaHasta, search, metodoFilter, tipoFilter])

  // Clear selections when multi-select mode is disabled
  useEffect(() => {
    if (!multiSelectMode) {
      setSelectedIds(new Set())
    }
  }, [multiSelectMode])

  const getNombreEstudiante = useCallback((t: any): string => {
    if (t.estudiante_nombre && t.estudiante_nombre !== "—") return t.estudiante_nombre
    const cp = t.cuenta_por_cobrar
    if (!cp) return t.estudiante_nombre || "—"
    const candidates = [
      cp.matricula?.estudiante, cp.solicitud_inscripcion?.estudiante,
      cp.solicitud_inscripcion?.participante_externo, cp.inscripcion_taller,
      cp.reserva_podcast?.persona, cp.reserva_podcast?.cliente_externo,
      cp.reserva_aula?.persona, cp.reserva_aula?.cliente_externo,
      cp.alquiler_equipo?.persona, cp.alquiler_equipo?.cliente_externo,
      cp.reserva_radio?.persona, cp.reserva_radio?.cliente_externo,
      cp.edicion_video?.cliente, cp.edicion_video?.cliente_externo,
    ]
    for (const c of candidates) {
      if (c?.nombres || c?.apellidos) return `${c.nombres || ""} ${c.apellidos || ""}`.trim()
    }
    return t.estudiante_nombre || "—"
  }, [])

  const getCursoNombre = useCallback((t: any): string => {
    if (t.tipo_movimiento === "egreso") return t.categoria_nombre || t.curso_nombre || ""
    if (t.modulo_nombre || t.linea_pago_modulo) return t.curso_nombre || ""
    const cp = t.cuenta_por_cobrar
    if (!cp) return t.curso_nombre || ""
    return nombreDesdeCuentaCobrar(cp) || t.curso_nombre || ""
  }, [])

  const esEgreso = (t: any) => t.tipo_movimiento === "egreso"

  // Local filtering based on all transacciones
  const clientFiltered = useMemo(() => {
    let list = allTransacciones

    if (search) {
      const q = search.toLowerCase().trim()
      list = list.filter((t) => {
        const nombre = getNombreEstudiante(t)
        const curso = getCursoNombre(t)
        const cedula = t.estudiante_cedula || t.cedula || ""
        const metodo = t.metodo_pago || ""
        const ref = t.referencia_pago || ""
        return [nombre, curso, cedula, metodo, ref, t.estudiante_nombre]
          .some(f => f?.toLowerCase().includes(q))
      })
    }

    if (metodoFilter !== "todos") {
      const q = metodoFilter.toLowerCase()
      list = list.filter((t) => {
        const mp = (t.metodo_pago || "").toLowerCase()
        if (q === "transferencia") return mp.includes("transfer") || mp.includes("deposito")
        return mp.includes(q)
      })
    }

    if (tipoFilter !== "todos") {
      list = list.filter((t) => t.tipo_movimiento === tipoFilter)
    }

    return list
  }, [allTransacciones, search, getNombreEstudiante, getCursoNombre, metodoFilter, tipoFilter])

  const groupedForDisplay = clientFiltered

  // Group items by Date (sorted by time within each group)
  const groupedByDate = useMemo(() => {
    const sorted = [...groupedForDisplay].sort((a, b) => {
      const createdDiff = new Date(b.created_at || b.fecha_pago || 0).getTime() - new Date(a.created_at || a.fecha_pago || 0).getTime()
      if (createdDiff !== 0) return createdDiff
      const dateDiff = new Date(b.fecha_pago || 0).getTime() - new Date(a.fecha_pago || 0).getTime()
      if (dateDiff !== 0) return dateDiff
      return String(b.id).localeCompare(String(a.id))
    })
    const groups: Record<string, any[]> = {}
    sorted.forEach((t) => {
      const dateKey = new Date(t.fecha_pago || t.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.entries(groups)
  }, [groupedForDisplay])

  const hasActiveFilters = Boolean(
    fechaDesde || fechaHasta || search || searchInput || metodoFilter !== "todos" || tipoFilter !== "todos"
  )

  // Auto-expand groups: when filtering, expand all matching groups; otherwise expand the first group
  useEffect(() => {
    if (groupedByDate.length > 0) {
      const next: Record<string, boolean> = {}
      if (hasActiveFilters) {
        groupedByDate.forEach(([date]) => {
          next[date] = true
        })
      } else {
        next[groupedByDate[0][0]] = true
      }
      setExpandedGroups(next)
    }
  }, [groupedByDate, hasActiveFilters])

  const getGroupTotal = (items: any[]) => {
    return items.reduce((sum, t) => {
      const val = Number(t.monto || 0)
      return sum + (t.tipo_movimiento === "egreso" ? -val : val)
    }, 0)
  }

  const methodColor = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    return Object.entries(COLORS_MAP).find(([k]) => lower === k || lower.includes(k))?.[1] || "#64748b"
  }

  const badgeEstado = (estado: string) => ESTADO_CLASSES[estado] || "bg-amber-50 text-amber-700 border border-amber-200"

  const getInitials = (name: string) => {
    if (!name || name === "—") return "—"
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0]?.slice(0, 2).toUpperCase() || "—"
  }

  const getMetodoIcon = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    if (lower.includes("efectivo")) return CoinsDollarIcon
    if (lower.includes("transfer") || lower.includes("deposito")) return BanknoteArrowDownIcon
    if (lower.includes("tarjeta")) return CreditCardIcon
    return InvoiceIcon
  }

  const hasResults = groupedForDisplay.length > 0

  const handleClearFilters = () => {
    setFechaDesde("")
    setFechaHasta("")
    setSearch("")
    setSearchInput("")
    setMetodoFilter("todos")
    setTipoFilter("todos")
  }

  // Bulk Delete
  const handleBulkDelete = async () => {
    const list = clientFiltered.filter(t => selectedIds.has(t.id) && t.comprobante_url && !t.comprobante_purgado)
    if (list.length === 0) {
      toast.error("No hay comprobantes válidos seleccionados para eliminar")
      return
    }
    if (!confirm(`¿Eliminar ${list.length} comprobante(s) del almacenamiento? Los registros históricos se conservarán.`)) {
      return
    }
    setBulkDeleting(true)
    try {
      await Promise.all(list.map(t =>
        financeService.deleteComprobante(t.id, t.tipo_movimiento === "egreso" ? "egreso" : "ingreso")
      ))
      toast.success(`${list.length} comprobante(s) eliminado(s)`)
      setAllTransacciones(prev => prev.map(t => {
        if (list.find(c => c.id === t.id)) return { ...t, comprobante_url: null, comprobante_purgado: true }
        return t
      }))
      setSelectedIds(new Set())
      setMultiSelectMode(false)
    } catch {
      toast.error("Error al eliminar comprobantes seleccionados")
    } finally {
      setBulkDeleting(false)
    }
  }

  // Single Delete
  const handleDeleteSingleComprobante = async (t: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar este comprobante del almacenamiento? Esta acción es irreversible.")) return
    try {
      await financeService.deleteComprobante(t.id, t.tipo_movimiento === "egreso" ? "egreso" : "ingreso")
      toast.success("Comprobante eliminado")
      setAllTransacciones(prev => prev.map(item =>
        item.id === t.id ? { ...item, comprobante_url: null, comprobante_purgado: true } : item
      ))
    } catch {
      toast.error("Error al eliminar comprobante")
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [date]: !prev[date]
    }))
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* 1. PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Historial de Movimientos
            </h1>
            
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-xs">
              <span className="size-2 rounded-full bg-[#fd761a] animate-pulse" />
              {groupedForDisplay.length} {groupedForDisplay.length === 1 ? "movimiento" : "movimientos"}
            </span>
          </div>
        </div>

        {/* 2. FILTER TOOLBAR CARD */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
          {/* ROW 1: Dates & Free Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Date: Desde */}
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="fecha-desde">
                Desde
              </label>
              <div className="relative flex items-center">
                <HugeiconsIcon icon={Calendar03Icon} size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  id="fecha-desde"
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all"
                />
                {fechaDesde && (
                  <button
                    onClick={() => setFechaDesde("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                    type="button"
                    title="Limpiar fecha desde"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Date: Hasta */}
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="fecha-hasta">
                Hasta
              </label>
              <div className="relative flex items-center">
                <HugeiconsIcon icon={Calendar01Icon} size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  id="fecha-hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all"
                />
                {fechaHasta && (
                  <button
                    onClick={() => setFechaHasta("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                    type="button"
                    title="Limpiar fecha hasta"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Free Search */}
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" htmlFor="search-input">
                Búsqueda rápida
              </label>
              <div className="relative flex items-center">
                <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  id="search-input"
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Buscar por cédula o nombre del cliente..."
                  className="w-full h-10 pl-9 pr-9 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(""); setSearch("") }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                    type="button"
                    title="Limpiar búsqueda"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Categorical Dropdowns, Clear Filters & Multi-select Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Método Dropdown */}
              <div className="relative w-full sm:w-52">
                <select
                  value={metodoFilter}
                  onChange={(e) => setMetodoFilter(e.target.value)}
                  aria-label="Filtrar por método de pago"
                  className="w-full h-10 pl-3.5 pr-8 appearance-none text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all cursor-pointer"
                >
                  <option value="todos">Todos los métodos</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Tipo Dropdown */}
              <div className="relative w-full sm:w-52">
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  aria-label="Filtrar por tipo"
                  className="w-full h-10 pl-3.5 pr-8 appearance-none text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all cursor-pointer"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                </select>
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Botón Limpiar Filtros */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  type="button"
                  className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 transition-colors shadow-2xs"
                  title="Restablecer todos los filtros"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>

            {/* Multi-select Action Buttons */}
            <div className="flex items-center justify-start sm:justify-end gap-2 shrink-0">
              {multiSelectMode && selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors shadow-xs"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={15} />
                  <span>{bulkDeleting ? "Eliminando..." : `Eliminar (${selectedIds.size})`}</span>
                </button>
              )}

              <button
                onClick={() => setMultiSelectMode(!multiSelectMode)}
                type="button"
                className={cn(
                  "h-10 px-4 inline-flex items-center gap-2 rounded-xl text-xs font-bold transition-all border",
                  multiSelectMode
                    ? "bg-[#fd761a]/10 text-[#fd761a] border-[#fd761a]/30 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                )}
              >
                <HugeiconsIcon icon={CheckListIcon} size={16} className={multiSelectMode ? "text-[#fd761a]" : "text-slate-500"} />
                <span>Seleccionar varios</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. MOVEMENTS STATEMENT CONTAINER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading && page === 1 ? (
            <div className="py-24 text-center space-y-3">
              <div className="size-8 border-3 border-[#fd761a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Cargando movimientos...</p>
            </div>
          ) : !hasResults ? (
            <div className="py-24 text-center px-4">
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {search ? `Sin resultados para "${search}"` : "No hay movimientos registrados"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Prueba modificando los filtros o el rango de fechas seleccionado.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  type="button"
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  <span>Restablecer todos los filtros</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              {groupedByDate.map(([date, items], idx) => {
                const isOpen = !!expandedGroups[date]
                const dayTotal = getGroupTotal(items)

                return (
                  <section key={date} className={cn(idx > 0 && "border-t border-slate-200/80 dark:border-slate-800")}>
                    {/* Date Header Strip */}
                    <header
                      onClick={() => toggleGroup(date)}
                      className="bg-slate-50/90 dark:bg-slate-800/60 px-5 py-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                          <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="text-slate-400" />
                        </motion.div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          {date}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                          · {items.length} {items.length === 1 ? "movimiento" : "movimientos"}
                        </span>
                      </div>

                      <div>
                        <span className={cn(
                          "font-mono text-xs font-bold px-2.5 py-1 rounded-md [font-variant-numeric:tabular-nums] border",
                          dayTotal >= 0
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                            : "text-rose-700 bg-rose-50 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
                        )}>
                          Total: {dayTotal >= 0 ? "+" : "-"}${Math.abs(dayTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </header>

                    {/* Group Rows */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-white dark:bg-transparent"
                        >
                          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                            {items.map((t) => {
                              const isChecked = selectedIds.has(t.id)
                              const MetodoIconComponent = getMetodoIcon(t.metodo_pago)
                              const nombreEstudiante = getNombreEstudiante(t)
                              const avatarColor = getAvatarPalette(nombreEstudiante)
                              const tipoBadge = getTipoPago(t)

                              return (
                                <div
                                  key={t.id}
                                  className="group relative flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                  onClick={() => {
                                    if (multiSelectMode) {
                                      setSelectedIds(prev => {
                                        const next = new Set(prev)
                                        if (next.has(t.id)) next.delete(t.id)
                                        else next.add(t.id)
                                        return next
                                      })
                                    } else {
                                      if (esEgreso(t)) {
                                        navigate(`/finanzas/egresos/${t.id}`)
                                      } else {
                                        navigate(`/finanzas/movimientos/${t.id}`)
                                      }
                                    }
                                  }}
                                >
                                  {/* Left: Checkbox + Avatar + Name & Concept */}
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                                    {/* Multi-select Checkbox */}
                                    {multiSelectMode && (
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => toggleSelect(t.id, e as any)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded border-slate-300 text-[#fd761a] focus:ring-[#fd761a]/20 mr-1 shrink-0 size-4 cursor-pointer"
                                      />
                                    )}

                                    {/* Initials Circle Avatar */}
                                    <div
                                      className={cn(
                                        "size-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs",
                                        avatarColor
                                      )}
                                    >
                                      {getInitials(nombreEstudiante)}
                                    </div>

                                    {/* Name and Concept */}
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#fd761a] transition-colors">
                                        {nombreEstudiante}
                                      </span>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                        {getCursoNombre(t) || t.metodo_pago || "Movimiento registrado"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Method icon, Status, Type Tag, Amount, Context Menu */}
                                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                    {/* Payment Method Icon */}
                                    <div
                                      title={t.metodo_pago}
                                      className="hidden sm:flex items-center justify-center size-7 rounded-lg bg-slate-50 dark:bg-slate-800"
                                    >
                                      <HugeiconsIcon
                                        icon={MetodoIconComponent}
                                        size={15}
                                        style={{ color: methodColor(t.metodo_pago) }}
                                        className="opacity-80 shrink-0"
                                      />
                                    </div>

                                    {/* Non-default status badge */}
                                    {t.estado_verificacion && t.estado_verificacion !== "aprobado" && (
                                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0", badgeEstado(t.estado_verificacion))}>
                                        {t.estado_verificacion}
                                      </span>
                                    )}

                                    {/* Comprobante purgado badge */}
                                    {t.comprobante_purgado && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/80 shrink-0">
                                        <HugeiconsIcon icon={ImageIcon} size={11} /> Eliminado
                                      </span>
                                    )}

                                    {/* Type Tag with preserved distinctive color */}
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-2xs", tipoBadge.color)}>
                                      {tipoBadge.tipo}
                                    </span>

                                    {/* Monto */}
                                    <span
                                      className={cn(
                                        "w-20 sm:w-24 text-right font-mono font-bold text-xs sm:text-sm shrink-0 [font-variant-numeric:tabular-nums]",
                                        esEgreso(t) ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                      )}
                                    >
                                      {esEgreso(t) ? "-" : "+"}${Number(t.monto || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>

                                    {/* 3-dot dropdown Action Button */}
                                    <div className="shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (activeMenuId === t.id) {
                                            setActiveMenuId(null)
                                            setMenuCoords(null)
                                          } else {
                                            const rect = e.currentTarget.getBoundingClientRect()
                                            setMenuCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                                            setActiveMenuId(t.id)
                                          }
                                        }}
                                        aria-label="Más opciones"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      >
                                        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )
              })}
            </div>
          )}

          {/* 4. STATEMENT FOOTER & PAGINATION */}
          <footer className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Mostrando <span className="font-bold text-slate-900 dark:text-white">{groupedForDisplay.length}</span> de <span className="font-bold text-slate-900 dark:text-white">{allTransacciones.length}</span> movimientos cargados
            </span>

            {page < totalPages && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all text-slate-700 dark:text-slate-200 shadow-xs"
                >
                  {loading ? "Cargando..." : `Cargar más movimientos (Página ${page} de ${totalPages})`}
                </button>
              </div>
            )}
          </footer>
        </div>
      </motion.div>

      {/* Popover Action Menu */}
      {activeMenuId && menuCoords && createPortal(
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation()
              setActiveMenuId(null)
              setMenuCoords(null)
            }}
          />
          <div
            className="fixed z-40 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
            style={{ top: menuCoords.top, right: menuCoords.right }}
          >
            <button
              onClick={() => {
                const t = clientFiltered.find(x => x.id === activeMenuId)
                setActiveMenuId(null)
                setMenuCoords(null)
                if (t) {
                  if (esEgreso(t)) navigate(`/finanzas/egresos/${t.id}`)
                  else navigate(`/finanzas/movimientos/${t.id}`)
                }
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <HugeiconsIcon icon={ViewIcon} size={15} className="text-slate-400" />
              <span>Ver detalle</span>
            </button>
            {(() => {
              const t = clientFiltered.find(x => x.id === activeMenuId)
              if (t?.comprobante_url && !t?.comprobante_purgado) {
                return (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                    <button
                      onClick={(e) => {
                        setActiveMenuId(null)
                        setMenuCoords(null)
                        if (t) handleDeleteSingleComprobante(t, e)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-2"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                      <span>Eliminar comprobante</span>
                    </button>
                  </>
                )
              }
              return null
            })()}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function getTipoPago(t: any): { tipo: string; color: string } {
  if (t.tipo_movimiento === "egreso") {
    return { tipo: "Egreso", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60" }
  }

  const cursoPersonalizado = t.es_personalizado === true
    || t.categoria_nombre === "Cursos personalizados"
    || t.cuenta_por_cobrar?.matricula?.curso_abierto?.es_personalizado === true
    || t.cuenta_por_cobrar?.solicitud_inscripcion?.curso_abierto?.es_personalizado === true
  if (cursoPersonalizado) {
    return { tipo: "Curso pers.", color: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60" }
  }

  const cp = t.cuenta_por_cobrar
  if (!cp) {
    if (t.modulo_nombre || t.linea_pago_modulo || t.curso_nombre) {
      return { tipo: "Curso", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60" }
    }
    return { tipo: "Servicio", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60" }
  }

  if (cp.inscripcion_taller) return { tipo: "Taller", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60" }
  if (cp.matricula || cp.solicitud_inscripcion) return { tipo: "Curso", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60" }

  if (cp.reserva_aula_id) return { tipo: "Aula", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60" }
  if (cp.reserva_podcast_id) return { tipo: "Podcast", color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 border border-fuchsia-200/60" }
  if (cp.alquiler_equipo_id) return { tipo: "Equipo", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60" }
  if (cp.reserva_radio_id) return { tipo: "Radio", color: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/60" }
  if (cp.edicion_video_id) return { tipo: "Video", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200/60" }

  return { tipo: "—", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60" }
}

function nombreServicio(cp: any): string {
  const servicio: Array<[string, string]> = [
    ["reserva_podcast_id", cp.reserva_podcast?.titulo || cp.reserva_podcast?.paquete?.nombre || "Podcast"],
    ["reserva_aula_id", cp.reserva_aula?.aula?.nombre || "Aula"],
    ["alquiler_equipo_id", cp.alquiler_equipo?.equipo?.nombre || "Equipo"],
    ["edicion_video_id", cp.edicion_video?.titulo || "Edición de Video"],
    ["reserva_radio_id", cp.reserva_radio?.tarifa?.nombre || cp.reserva_radio?.fecha_reserva || cp.reserva_radio?.hora_inicio || "Radio"],
  ]
  for (const [idField, label] of servicio) {
    if (cp[idField]) return label
  }
  return ""
}

function nombreDesdeCuentaCobrar(cp: any): string {
  const academia = cp.matricula?.curso_abierto?.nombre_instancia
    || cp.matricula?.curso_abierto?.catalogo?.nombre
    || cp.solicitud_inscripcion?.curso_abierto?.nombre_instancia
    || cp.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre
    || cp.inscripcion_taller?.taller?.nombre
  if (academia) return academia
  return nombreServicio(cp)
}
