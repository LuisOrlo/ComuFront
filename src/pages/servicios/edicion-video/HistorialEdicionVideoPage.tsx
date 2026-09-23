import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  Calendar03Icon,
  UserIcon,
  Clock01Icon,
  CheckmarkCircle04Icon,
  Add01Icon,
  MatrixIcon,
  Search01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  Layers01Icon,
  ArrowReloadHorizontalIcon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { cn, formatCalendarDate } from "@/lib/utils"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type EstadoTrabajo,
} from "@/services/edicion-video.service"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  EstadoTrabajo,
  { label: string; bg: string; dot: string; text: string }
> = {
  recibido: {
    label: "Recibido",
    bg: "bg-blue-50 border-blue-200/70",
    dot: "bg-blue-600",
    text: "text-blue-800",
  },
  en_proceso: {
    label: "En proceso",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  revision: {
    label: "Revisión",
    bg: "bg-purple-50 border-purple-200/70",
    dot: "bg-purple-600",
    text: "text-purple-800",
  },
  entregado: {
    label: "Entregado",
    bg: "bg-emerald-50 border-emerald-200/70",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
  },
}

export function HistorialEdicionVideoPage() {
  const navigate = useNavigate()
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [search, setSearch] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await edicionVideoService.getTrabajos()
      setTrabajos(res.data)
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const changeEstado = async (id: string, nuevoEstado: EstadoTrabajo) => {
    try {
      setTrabajos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t)),
      )
      await edicionVideoService.updateTrabajo(id, { estado: nuevoEstado })
      toast.success(`Trabajo movido a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
    } catch {
      toast.error("Error al actualizar estado")
      loadData()
    }
  }

  const filtered = useMemo(() => {
    let list = trabajos
    if (filtroEstado === "activos") {
      list = list.filter((t) => t.estado === "recibido" || t.estado === "en_proceso" || t.estado === "revision")
    } else if (filtroEstado !== "todos") {
      list = list.filter((t) => t.estado === filtroEstado)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => {
        const cliente = t.cliente
          ? `${t.cliente.nombres} ${t.cliente.apellidos}`.toLowerCase()
          : t.cliente_externo
            ? `${t.cliente_externo.nombres} ${t.cliente_externo.apellidos || ""}`.toLowerCase()
            : ""
        const titulo = (t.titulo || "").toLowerCase()
        return cliente.includes(q) || titulo.includes(q)
      })
    }

    return list.sort((a, b) => {
      const dateDiff = (b.fecha_recibo || "").localeCompare(a.fecha_recibo || "")
      if (dateDiff !== 0) return dateDiff
      return (b.created_at || "").localeCompare(a.created_at || "")
    })
  }, [trabajos, filtroEstado, search])

  const getCliente = (t: TrabajoEdicion) => {
    if (t.cliente) return `${t.cliente.nombres} ${t.cliente.apellidos}`.trim()
    if (t.cliente_externo) return `${t.cliente_externo.nombres} ${t.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }

  const stats = useMemo(() => {
    return {
      total: trabajos.length,
      recibidos: trabajos.filter((t) => t.estado === "recibido").length,
      en_proceso: trabajos.filter(
        (t) => t.estado === "en_proceso" || t.estado === "revision",
      ).length,
      entregados: trabajos.filter((t) => t.estado === "entregado").length,
    }
  }, [trabajos])

  const statCards = [
    {
      key: "todos",
      label: "TOTAL TRABAJOS",
      value: stats.total,
      subtitle: "Periodo actual",
      icon: Layers01Icon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      key: "recibido",
      label: "RECIBIDOS",
      value: stats.recibidos,
      subtitle: "Por iniciar",
      icon: Clock01Icon,
      iconBg: "bg-blue-50 text-blue-700",
    },
    {
      key: "activos",
      label: "EN PRODUCCIÓN",
      value: stats.en_proceso,
      subtitle: (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#9d4300] bg-[#ffdbca]/60 px-2 py-0.5 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]" />
          En proceso
        </span>
      ),
      icon: VideoIcon,
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      key: "entregado",
      label: "ENTREGADOS",
      value: stats.entregados,
      subtitle: "Finalizados",
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ]

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TrabajoEdicion[]> = {}
    filtered.forEach((t) => {
      const dateKey = formatCalendarDate(t.fecha_recibo, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).toUpperCase()
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.entries(groups)
  }, [filtered])

  useEffect(() => {
    if (Object.keys(expandedGroups).length === 0 && groupedByDate.length > 0) {
      const initial: Record<string, boolean> = {}
      groupedByDate.forEach(([date]) => {
        initial[date] = true
      })
      setExpandedGroups(initial)
    }
  }, [groupedByDate, expandedGroups])

  const toggleGroup = (date: string) => {
    setExpandedGroups((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  const getGroupTotal = (items: TrabajoEdicion[]) => {
    return items.reduce((sum, t) => sum + Number(t.precio_cobrado || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando historial de edición...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              SERVICIOS
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
              Edición de Video
            </h1>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/servicios/edicion-video/nuevo")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={17} className="text-slate-500" />
              <span>Nuevo Trabajo</span>
            </button>
            <button
              onClick={() => navigate("/servicios/edicion-video/agenda")}
              className="h-10 px-5 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={MatrixIcon} size={17} />
              <span>Tablero de Producción</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics (4-Column Bento Card Array) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const isActive = filtroEstado === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setFiltroEstado(isActive ? "todos" : card.key)}
                className={cn(
                  "p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between h-[108px] text-left transition-all hover:shadow-md cursor-pointer active:scale-[0.99]",
                  isActive ? "ring-2 ring-[#fd761a]/30 border-[#fd761a]" : "",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    {card.label}
                  </span>
                  <div
                    className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0",
                      card.iconBg,
                    )}
                  >
                    <HugeiconsIcon icon={card.icon} size={16} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  {typeof card.subtitle === "string" ? (
                    <span className="text-xs text-slate-500 font-medium">{card.subtitle}</span>
                  ) : (
                    card.subtitle
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* History Workspace Module */}
        <div className="flex flex-col gap-4 mt-2">
          {/* History Section Header & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Historial de Trabajos</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-xs font-semibold">
                {filtered.length}
              </span>
            </div>

            {/* Filter Controls (40px Height) */}
            <div className="flex items-center gap-2.5">
              <div className="h-10 bg-white border border-slate-200 rounded-xl px-3.5 flex items-center gap-2 shadow-xs w-full sm:w-72 focus-within:ring-2 focus-within:ring-[#fd761a]/25 focus-within:border-[#fd761a] transition-all">
                <HugeiconsIcon icon={Search01Icon} size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente o título…"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                    title="Limpiar búsqueda"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
              </div>

              <button
                onClick={loadData}
                className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs shrink-0 active:scale-95 cursor-pointer"
                title="Actualizar datos"
                type="button"
              >
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={16} />
              </button>
            </div>
          </div>

          {/* Group by Date Card Assembly */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-14 text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <HugeiconsIcon icon={VideoIcon} size={28} />
              </div>
              <p className="font-bold text-sm text-slate-800">
                {search ? `Sin resultados para "${search}"` : "Sin trabajos registrados"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba ajustando la búsqueda o crea un nuevo trabajo de edición.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByDate.map(([date, items]) => {
                const isOpen = expandedGroups[date] !== false
                const dayTotal = getGroupTotal(items)

                return (
                  <div
                    key={date}
                    className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90"
                  >
                    {/* Date Group Header Bar */}
                    <div
                      onClick={() => toggleGroup(date)}
                      className="bg-slate-50/80 px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none border-b border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                          <HugeiconsIcon icon={ArrowDown01Icon} size={15} className="text-slate-400" />
                        </motion.div>
                        <div className="size-6 rounded-md bg-slate-200/70 flex items-center justify-center text-slate-600">
                          <HugeiconsIcon icon={Calendar03Icon} size={14} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-slate-900 font-bold">
                          {date}
                        </span>
                        <span className="inline-block size-1 rounded-full bg-slate-300" />
                        <span className="text-xs text-slate-500">
                          {items.length} {items.length === 1 ? "trabajo" : "trabajos"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-white px-3 py-1 rounded-md shadow-2xs border border-slate-200/70 flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">Total día:</span>
                          <span className="text-xs text-slate-900 font-bold">
                            ${dayTotal.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reservation Rows Container */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col divide-y divide-slate-100">
                            {items.map((t) => {
                              const estado = ESTADO_CONFIG[t.estado] || ESTADO_CONFIG.recibido
                              const cliente = getCliente(t)
                              const precio = Number(t.precio_cobrado || 0)

                              const cuenta = t.cuenta_por_cobrar
                              const saldo = cuenta
                                ? Number(cuenta.saldo_pendiente)
                                : precio
                              const isPagado =
                                cuenta?.estado === "pagado" ||
                                saldo <= 0 ||
                                (cuenta && Number(cuenta.monto_abonado) >= precio)
                              const isAbonado =
                                !isPagado && cuenta && Number(cuenta.monto_abonado) > 0

                              return (
                                <div
                                  key={t.id}
                                  className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors duration-150 group"
                                >
                                  {/* Left Column */}
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="size-11 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#fd761a] group-hover:text-white transition-colors">
                                      <HugeiconsIcon icon={VideoIcon} size={20} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/servicios/edicion-video/${t.id}`)}
                                          className="text-[15px] leading-snug font-semibold text-slate-900 group-hover:text-[#fd761a] truncate transition-colors text-left cursor-pointer"
                                        >
                                          {t.titulo || "Sin título"}
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                          <HugeiconsIcon
                                            icon={UserIcon}
                                            size={14}
                                            className="text-[#fd761a]"
                                          />
                                          <strong className="font-medium text-slate-800">
                                            {cliente}
                                          </strong>
                                        </span>
                                        {t.fecha_limite && (
                                          <>
                                            <span className="inline-block size-1 rounded-full bg-slate-300" />
                                            <span className="inline-flex items-center gap-1">
                                              <HugeiconsIcon
                                                icon={Clock01Icon}
                                                size={14}
                                                className="text-slate-400"
                                              />
                                              Límite: {formatCalendarDate(t.fecha_limite, { day: "numeric", month: "short" })}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Middle Column */}
                                  <div className="flex items-center gap-6 self-start lg:self-center shrink-0">
                                    <div className="flex flex-col items-start lg:items-end gap-1">
                                      <div className="flex items-center gap-1.5">
                                        <select
                                          value={t.estado}
                                          onChange={(e) => {
                                            e.stopPropagation()
                                            changeEstado(t.id, e.target.value as EstadoTrabajo)
                                          }}
                                          className={cn(
                                            "px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border outline-none cursor-pointer transition-opacity",
                                            estado.bg,
                                            estado.text,
                                          )}
                                        >
                                          {Object.entries(ESTADO_CONFIG).map(([val, cfg]) => (
                                            <option key={val} value={val}>
                                              {cfg.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <span
                                        className={cn(
                                          "text-[11px] font-medium",
                                          isPagado
                                            ? "text-emerald-700"
                                            : isAbonado
                                              ? "text-amber-700"
                                              : "text-slate-500",
                                        )}
                                      >
                                        {isPagado
                                          ? "Pagado"
                                          : isAbonado
                                            ? `Abono $${Number(cuenta?.monto_abonado).toFixed(2)} · Saldo $${saldo.toFixed(2)}`
                                            : "Pago pendiente"}
                                      </span>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0 pl-2">
                                      <span className="text-base font-bold text-slate-900 tracking-tight">
                                        ${precio.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      {t.monto_descuento && Number(t.monto_descuento) > 0 ? (
                                        <span className="text-[10px] text-slate-400 line-through">
                                          ${(Number(t.precio_original || precio + Number(t.monto_descuento))).toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 font-medium">
                                          Tarifa fijada
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right Column */}
                                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                                    <button
                                      onClick={() => navigate(`/servicios/edicion-video/${t.id}`)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                      type="button"
                                    >
                                      Detalles
                                    </button>
                                    <button
                                      onClick={() => navigate(`/servicios/edicion-video/${t.id}/editar`)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                                      type="button"
                                    >
                                      <HugeiconsIcon icon={Edit01Icon} size={14} />
                                      <span>Editar</span>
                                    </button>
                                    {isPagado ? (
                                      <button
                                        onClick={() =>
                                          navigate(`/finanzas/pagos/cuentas/servicios/pago/${t.id}`, {
                                            state: {
                                              tipo: "edicion",
                                              servicioId: t.id,
                                              cuentaId: t.cuenta_por_cobrar?.id,
                                              nombre: cliente,
                                              montoTotal: precio,
                                              montoSaldo: saldo,
                                              nombreServicio: t.titulo || "Edición de Video",
                                            },
                                          })
                                        }
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                        type="button"
                                      >
                                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                        <span>Ver pagos</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          navigate(`/finanzas/pagos/cuentas/servicios/pago/${t.id}`, {
                                            state: {
                                              tipo: "edicion",
                                              servicioId: t.id,
                                              cuentaId: t.cuenta_por_cobrar?.id,
                                              nombre: cliente,
                                              montoTotal: precio,
                                              montoSaldo: saldo,
                                              nombreServicio: t.titulo || "Edición de Video",
                                            },
                                          })
                                        }
                                        className="px-3.5 py-1.5 rounded-lg bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                        type="button"
                                      >
                                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} />
                                        <span>Registrar pago</span>
                                      </button>
                                    )}
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

              {/* Footnote */}
              <div className="px-5 py-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-xs shadow-2xs">
                <span className="font-medium">
                  Mostrando {filtered.length} de {trabajos.length} trabajos de edición
                </span>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>Datos sincronizados</span>
                  <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
