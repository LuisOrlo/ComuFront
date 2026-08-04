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
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

const DEBOUNCE_MS = 350
const COLORS_MAP: Record<string, string> = { efectivo: "#0891b2", transfer: "#4f46e5", deposito: "#7c3aed", tarjeta: "#059669" }
const ESTADO_CLASSES: Record<string, string> = { aprobado: "bg-green-100 text-green-700", rechazado: "bg-red-100 text-red-700" }

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
  const [estadoFilter, setEstadoFilter] = useState("todos")
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
  const [totalItems, setTotalItems] = useState(0)
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
        const res = await financeService.getHistorial(params)
        if (controller.signal.aborted) return
        
        setAllTransacciones(prev => page === 1 ? (res.data || []) : [...prev, ...(res.data || [])])
        setTotalPages(res.last_page || 1)
        setTotalItems(res.total || 0)
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
  }, [page, fechaDesde, fechaHasta, search])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1)
  }, [fechaDesde, fechaHasta, search])

  // Clear selections when multi-select mode is disabled
  useEffect(() => {
    if (!multiSelectMode) {
      setSelectedIds(new Set())
    }
  }, [multiSelectMode])

  const getNombreEstudiante = useCallback((t: any): string => {
    if (t.tipo_movimiento === "egreso") return t.estudiante_nombre || "—"
    if (t.modulo_nombre || t.linea_pago_modulo) return t.estudiante_nombre || "—"
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

  function esPagoPorModulo(t: any): boolean {
    return !!(t.modulo_nombre || t.linea_pago_modulo)
  }

  const esEgreso = (t: any) => t.tipo_movimiento === "egreso"

  // Local filtering based on all transacciones
  const clientFiltered = useMemo(() => {
    let list = allTransacciones

    if (search) {
      const q = search.toLowerCase().trim()
      list = list.filter((t) => {
        const nombre = getNombreEstudiante(t)
        const curso = getCursoNombre(t)
        const cedula = t.cedula || t.estudiante_cedula || ""
        return [nombre, curso, cedula, t.metodo_pago, t.estado_verificacion]
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

    if (estadoFilter !== "todos") {
      list = list.filter((t) => (t.estado_verificacion || "").toLowerCase() === estadoFilter.toLowerCase())
    }

    if (tipoFilter !== "todos") {
      list = list.filter((t) => t.tipo_movimiento === tipoFilter)
    }

    return list
  }, [allTransacciones, search, getNombreEstudiante, getCursoNombre, metodoFilter, estadoFilter, tipoFilter])

  // Group items by Date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {}
    clientFiltered.forEach((t) => {
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
  }, [clientFiltered])

  // Automatically expand the first group by default on load
  useEffect(() => {
    if (Object.keys(expandedGroups).length === 0 && groupedByDate.length > 0) {
      setExpandedGroups({ [groupedByDate[0][0]]: true })
    }
  }, [groupedByDate, expandedGroups])

  const getGroupTotal = (items: any[]) => {
    return items.reduce((sum, t) => {
      const val = Number(t.monto || 0)
      return sum + (t.tipo_movimiento === "egreso" ? -val : val)
    }, 0)
  }

  const methodColor = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    return Object.entries(COLORS_MAP).find(([k]) => lower === k || lower.includes(k))?.[1] || "#6b7280"
  }

  const badgeEstado = (estado: string) => ESTADO_CLASSES[estado] || "bg-amber-100 text-amber-700"

  const getInitials = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || "—"
  }

  const getMetodoIcon = (metodo: string) => {
    const lower = (metodo || "").toLowerCase()
    if (lower.includes("efectivo")) return CoinsDollarIcon
    if (lower.includes("transfer") || lower.includes("deposito")) return BanknoteArrowDownIcon
    if (lower.includes("tarjeta")) return CreditCardIcon
    return InvoiceIcon
  }

  const hasResults = clientFiltered.length > 0

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
    <div className="px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-white dark:bg-gray-900 overflow-hidden"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-800" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg font-black flex items-center gap-3 text-gray-850 dark:text-white">
              <HugeiconsIcon icon={InvoiceIcon} size={22} style={{ color: COLORS.ACCENT }} />
              Historial de Movimientos
              {hasResults && <span className="text-xs font-extrabold opacity-45 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">({totalItems})</span>}
            </h2>
            
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-[10px] font-bold w-[130px] outline-none focus:ring-2 focus:ring-violet-500/10 dark:text-white"
              />
              <span className="text-[10px] opacity-30 dark:text-gray-500">—</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-[10px] font-bold w-[130px] outline-none focus:ring-2 focus:ring-violet-500/10 dark:text-white"
              />
              <div className="relative w-48">
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Buscar por curso o persona..."
                  className="w-full pl-4 pr-9 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/10 dark:text-white"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(""); setSearch("") }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-35 hover:opacity-100 dark:text-white"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Filters Bar */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-3 bg-gray-50/[0.15]">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={metodoFilter}
              onChange={(e) => setMetodoFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none cursor-pointer dark:text-white"
            >
              <option value="todos">Todos los métodos</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none cursor-pointer dark:text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="aprobado">Aprobado</option>
              <option value="pendiente">Pendiente</option>
              <option value="rechazado">Rechazado</option>
            </select>

            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none cursor-pointer dark:text-white"
            >
              <option value="todos">Todos los tipos</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {multiSelectMode && selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-650 transition-colors border border-red-200"
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                {bulkDeleting ? "Eliminando..." : `Eliminar ${selectedIds.size} seleccionados`}
              </button>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={multiSelectMode}
                onChange={(e) => setMultiSelectMode(e.target.checked)}
                className="rounded border-gray-300 text-violet-650 focus:ring-violet-500/20"
              />
              Seleccionar varios
            </label>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className="p-20 text-center opacity-40 font-medium dark:text-white">
            Cargando historial...
          </div>
        ) : !hasResults ? (
          <div className="p-20 text-center">
            <p className="font-bold text-sm opacity-35 dark:text-white">
              {search ? `Sin resultados para "${search}"` : "No hay movimientos registrados"}
            </p>
            <p className="text-xs mt-1 opacity-25 dark:text-gray-400">
              Prueba modificando los filtros o rangos de fecha seleccionados
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {groupedByDate.map(([date, items]) => {
              const isOpen = !!expandedGroups[date]
              const dayTotal = getGroupTotal(items)

              return (
                <div
                  key={date}
                  className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/40 overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    onClick={() => toggleGroup(date)}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="text-gray-400 dark:text-gray-500" />
                      </motion.div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        {date}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold">
                        ({items.length} movimiento{items.length !== 1 ? "s" : ""})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-bold text-xs sm:text-sm shrink-0">
                      <span className={cn(dayTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                        Total: {dayTotal >= 0 ? "+" : "-"}${Math.abs(dayTotal).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Grouped Rows */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-white dark:bg-transparent"
                      >
                        <div className="divide-y divide-gray-100 dark:divide-gray-850 border-t border-gray-150 dark:border-gray-800">
                          {items.map((t) => {
                            const isChecked = selectedIds.has(t.id)
                            const MetodoIconComponent = getMetodoIcon(t.metodo_pago)

                            return (
                              <div
                                key={t.id}
                                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-black/[0.005] dark:hover:bg-white/[0.005] cursor-pointer"
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
                                      navigate(`/finanzas/pagos/historial/${t.id}`)
                                    }
                                  }
                                }}
                              >
                                {/* Multi select Checkbox */}
                                {multiSelectMode && (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => toggleSelect(t.id, e as any)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded border-gray-300 text-violet-650 focus:ring-violet-500/20 mr-1 shrink-0"
                                  />
                                )}

                                {/* Initials Circle Avatar */}
                                <div
                                  className="size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
                                  style={{ backgroundColor: methodColor(t.metodo_pago) }}
                                >
                                  {getInitials(getNombreEstudiante(t))}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 truncate">
                                    {getNombreEstudiante(t)}
                                  </p>
                                  <p className="text-[10px] opacity-45 dark:text-gray-400 font-bold truncate">
                                    {esEgreso(t)
                                      ? `${getCursoNombre(t) || t.metodo_pago}`
                                      : t.modulos_count > 1
                                        ? `${getCursoNombre(t) || t.metodo_pago} — ${t.modulos_count} módulos`
                                        : esPagoPorModulo(t) && t.modulo_nombre
                                          ? `${getCursoNombre(t) || t.metodo_pago} — ${t.modulo_nombre}`
                                          : (getCursoNombre(t) || t.metodo_pago)}
                                  </p>
                                </div>

                                {/* Method Icon & Status Badges */}
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  {/* Payment Method Icon */}
                                  <HugeiconsIcon
                                    icon={MetodoIconComponent}
                                    size={14}
                                    style={{ color: methodColor(t.metodo_pago) }}
                                    className="opacity-75 shrink-0"
                                  />

                                  {/* Non-default status badge */}
                                  {t.estado_verificacion !== "aprobado" && (
                                    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0", badgeEstado(t.estado_verificacion))}>
                                      {t.estado_verificacion}
                                    </span>
                                  )}

                                  {/* Comprobante status badge */}
                                  {t.comprobante_purgado && (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-red-400 bg-red-50/50 px-1.5 py-0.5 rounded-full border border-red-200 shrink-0">
                                      <HugeiconsIcon icon={ImageIcon} size={9} /> Eliminado
                                    </span>
                                  )}

                                  {/* Type tags */}
                                  {esEgreso(t) ? (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-red-100 text-red-700 shrink-0">
                                      Egreso
                                    </span>
                                  ) : t.modulos_count > 1 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-purple-100 text-purple-700 shrink-0">
                                      {t.modulos_count} módulos
                                    </span>
                                  ) : esPagoPorModulo(t) ? (
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-purple-100 text-purple-700 shrink-0">
                                      Módulo
                                    </span>
                                  ) : null}

                                  {/* Monto */}
                                  <span
                                    className={cn("text-xs font-black w-20 text-right shrink-0", esEgreso(t) ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400")}
                                  >
                                    {esEgreso(t) ? "-" : "+"}${Number(t.monto || 0).toLocaleString()}
                                  </span>

                                  {/* 3-dot dropdown Action Menu */}
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
                                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:text-gray-500 transition-colors"
                                    >
                                      <HugeiconsIcon icon={MoreHorizontalIcon} size={15} />
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
                </div>
              )
            })}

            {/* Load More Days pagination */}
            {page < totalPages && (
              <div className="flex justify-center pt-6 pb-2">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all text-gray-700 dark:text-white"
                >
                  {loading ? "Cargando..." : "Cargar más días"}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {activeMenuId && menuCoords && createPortal(
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setMenuCoords(null) }} />
          <div className="fixed z-40 w-36 bg-white rounded-xl shadow-lg border py-1 text-xs font-bold text-gray-700"
            style={{ top: menuCoords.top, right: menuCoords.right, borderColor: COLORS.BORDER_SUBTLE }}>
            <button
              onClick={() => {
                const t = clientFiltered.find(x => x.id === activeMenuId)
                setActiveMenuId(null); setMenuCoords(null)
                if (t) {
                  if (esEgreso(t)) navigate(`/finanzas/egresos/${t.id}`)
                  else navigate(`/finanzas/pagos/historial/${t.id}`)
                }
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Ver Detalle
            </button>
            {(() => {
              const t = clientFiltered.find(x => x.id === activeMenuId)
              if (t?.comprobante_url && !t?.comprobante_purgado) {
                return (
                  <button
                    onClick={(e) => {
                      setActiveMenuId(null); setMenuCoords(null)
                      if (t) handleDeleteSingleComprobante(t, e)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors text-red-500"
                  >
                    Eliminar Comprobante
                  </button>
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
