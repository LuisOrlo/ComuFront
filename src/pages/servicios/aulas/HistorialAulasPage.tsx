import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Clock04Icon,
  ArrowDown01Icon,
  UserIcon,
  LibraryIcon,
  CheckmarkCircle04Icon,
  Search01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  reservado: { bg: "bg-blue-50", color: "text-blue-700", label: "Reservado" },
  confirmado: { bg: "bg-emerald-50", color: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-amber-50", color: "text-amber-700", label: "En progreso" },
  completado: { bg: "bg-gray-100", color: "text-gray-600", label: "Completado" },
  cancelado: { bg: "bg-red-50", color: "text-red-600", label: "Cancelado" },
}

export function HistorialAulasPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaAula[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, auls] = await Promise.all([
        aulasService.getReservas(),
        aulasService.getAulas(),
      ])
      setReservas(Array.isArray(res) ? res : [])
      setAulas(auls || [])
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const getAulaNombre = useCallback((aulaId: string) => {
    const a = aulas.find(x => x.id === aulaId)
    return a?.nombre || "—"
  }, [aulas])

  const getClienteNombre = useCallback((r: ReservaAula) => {
    if (r.persona) return `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim()
    if (r.cliente_externo) return `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }, [])

  const filtered = useMemo(() => {
    let list = reservas

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => {
        const nombre = getClienteNombre(r).toLowerCase()
        const aula = getAulaNombre(r.aula_id).toLowerCase()
        return nombre.includes(q) || aula.includes(q)
      })
    }

    if (estadoFilter !== "todos") {
      list = list.filter(r => r.estado === estadoFilter)
    }

    if (tipoFilter !== "todos") {
      if (tipoFilter === "interno") list = list.filter(r => r.persona_id)
      else if (tipoFilter === "externo") list = list.filter(r => !r.persona_id)
    }

    return list.sort((a, b) =>
      new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime()
    )
  }, [reservas, search, estadoFilter, tipoFilter, getAulaNombre, getClienteNombre])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ReservaAula[]> = {}
    filtered.forEach(r => {
      const dateKey = new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(r)
    })
    return Object.entries(groups)
  }, [filtered])

  useEffect(() => {
    if (Object.keys(expandedGroups).length === 0 && groupedByDate.length > 0) {
      setExpandedGroups({ [groupedByDate[0][0]]: true })
    }
  }, [groupedByDate, expandedGroups])

  const getGroupTotal = (items: ReservaAula[]) => {
    return items.reduce((sum, r) => sum + Number(r.precio_total || 0), 0)
  }

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
  }

  const handlePago = (r: ReservaAula) => {
    const clienteNombre = getClienteNombre(r)
    const aulaNombre = getAulaNombre(r.aula_id)
    navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
      state: {
        tipo: "aula",
        servicioId: r.id,
        nombre: clienteNombre,
        montoTotal: Number(r.precio_total) || 0,
        montoSaldo: Number(r.precio_total) || 0,
        nombreServicio: `Alquiler de Aula ${aulaNombre}`,
      },
    })
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Cargando historial...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      <button onClick={() => navigate("/servicios/aulas")} className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4" style={{ color: COLORS.CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Aulas
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="p-6 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg font-black flex items-center gap-3" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={Clock04Icon} size={22} style={{ color: COLORS.ACCENT }} />
              Historial de Alquileres
              {filtered.length > 0 && <span className="text-xs font-extrabold opacity-45 bg-gray-100 px-2 py-0.5 rounded-full">({filtered.length})</span>}
            </h2>
            <div className="relative w-56">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar cliente o aula..."
                className="w-full pl-9 pr-9 py-2 rounded-xl border bg-gray-50/60 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/10"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch("") }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-35 hover:opacity-100">
                  <HugeiconsIcon icon={Cancel01Icon} size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50/[0.15]" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex flex-wrap items-center gap-2">
            <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold outline-none cursor-pointer"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <option value="todos">Todos los estados</option>
              {Object.entries(ESTADO_STYLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold outline-none cursor-pointer"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <option value="todos">Todos los tipos</option>
              <option value="interno">Interno</option>
              <option value="externo">Externo</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-20 text-center">
            <p className="font-bold text-sm opacity-35" style={{ color: COLORS.CHARCOAL }}>
              {search ? `Sin resultados para "${search}"` : "No hay reservas registradas"}
            </p>
            <p className="text-xs mt-1 opacity-25">Prueba modificando los filtros</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {groupedByDate.map(([date, items]) => {
              const isOpen = !!expandedGroups[date]
              const dayTotal = getGroupTotal(items)

              return (
                <div key={date} className="border rounded-2xl bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div
                    onClick={() => toggleGroup(date)}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-black/[0.01] transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="opacity-40" />
                      </motion.div>
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>
                        {date}
                      </h3>
                      <span className="text-[10px] sm:text-xs opacity-40 font-bold">
                        ({items.length} reserva{items.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-bold text-xs sm:text-sm shrink-0">
                      <span style={{ color: "oklch(0.55 0.15 150)" }}>
                        Total: ${dayTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          {items.map((r) => {
                            const estado = ESTADO_STYLES[r.estado] || ESTADO_STYLES.reservado
                            const clienteNombre = getClienteNombre(r)
                            const aulaNombre = getAulaNombre(r.aula_id)
                            return (
                              <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                <div className={cn(
                                  "size-9 rounded-xl flex items-center justify-center shrink-0",
                                  r.persona_id ? "bg-indigo-100" : "bg-emerald-100"
                                )}>
                                  <HugeiconsIcon icon={r.persona_id ? UserIcon : LibraryIcon} size={14}
                                    className={r.persona_id ? "text-indigo-600" : "text-emerald-600"} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-extrabold truncate" style={{ color: COLORS.CHARCOAL }}>
                                    {clienteNombre}
                                  </p>
                                  <p className="text-[10px] opacity-45 font-bold truncate">
                                    {aulaNombre}
                                    {" · "}
                                    {r.hora_inicio?.substring(0, 5)} – {r.hora_fin?.substring(0, 5)}
                                  </p>
                                </div>

                                <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0", estado.bg, estado.color)}>
                                  {estado.label}
                                </span>

                                <span className="text-xs font-bold w-20 text-right shrink-0" style={{ color: COLORS.CHARCOAL }}>
                                  ${Number(r.precio_total).toLocaleString()}
                                </span>

                                <button onClick={() => handlePago(r)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
                                  style={{ backgroundColor: COLORS.ACCENT }}>
                                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                                  Registrar pago
                                </button>
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
          </div>
        )}
      </motion.div>
    </div>
  )
}
