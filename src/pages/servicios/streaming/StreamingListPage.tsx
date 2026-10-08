import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams, Link } from "react-router"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  CheckmarkCircle04Icon,
  Cancel01Icon,
  Search01Icon,
  Add01Icon,
  Layers01Icon,
  CameraVideoIcon,
  ArrowReloadHorizontalIcon,
  Edit01Icon,
  Location01Icon,
  UserGroupIcon,
  Money01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons"
import { cn, formatCalendarDate } from "@/lib/utils"
import {
  streamingService,
  type ServicioStreaming,
} from "@/services/streaming.service"
import { DetalleStreamingModal } from "./components/DetalleStreamingModal"
import { toast } from "sonner"

const ESTADO_CONFIG: Record<
  string,
  { label: string; bg: string; dot: string; text: string }
> = {
  reservado: {
    label: "Reservado",
    bg: "bg-blue-50 border-blue-200/70",
    dot: "bg-blue-600",
    text: "text-blue-800",
  },
  confirmado: {
    label: "Confirmado",
    bg: "bg-amber-50 border-amber-200/70",
    dot: "bg-amber-500",
    text: "text-amber-800",
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-indigo-50 border-indigo-200/70",
    dot: "bg-indigo-600",
    text: "text-indigo-800",
  },
  completado: {
    label: "Completado",
    bg: "bg-emerald-50 border-emerald-200/70",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
  },
  cancelado: {
    label: "Cancelado",
    bg: "bg-red-50 border-red-200/70",
    dot: "bg-red-500",
    text: "text-red-800",
  },
}

export function StreamingListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [servicios, setServicios] = useState<ServicioStreaming[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "todos")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})

  // Modales
  const [modalStreaming, setModalStreaming] = useState<ServicioStreaming | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await streamingService.getAll()
      setServicios(data)
    } catch {
      toast.error("Error al cargar la lista de streaming")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFiltroEstado = (estado: string) => {
    setFiltroEstado(estado)
    const p = new URLSearchParams(searchParams)
    if (estado === "todos") p.delete("estado")
    else p.set("estado", estado)
    setSearchParams(p, { replace: true })
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    const p = new URLSearchParams(searchParams)
    if (!val) p.delete("search")
    else p.set("search", val)
    setSearchParams(p, { replace: true })
  }

  const filtered = useMemo(() => {
    let list = servicios
    if (filtroEstado === "activos") {
      list = list.filter(
        (s) => s.estado === "reservado" || s.estado === "confirmado" || s.estado === "en_progreso"
      )
    } else if (filtroEstado !== "todos") {
      list = list.filter((s) => s.estado === filtroEstado)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => {
        const cliente = s.cliente_externo
          ? `${s.cliente_externo.nombres} ${s.cliente_externo.apellidos || ""}`.toLowerCase()
          : s.persona
            ? `${s.persona.nombres} ${s.persona.apellidos}`.toLowerCase()
            : ""
        const titulo = (s.titulo || "").toLowerCase()
        const lugar = (s.lugar || "").toLowerCase()
        const direccion = (s.direccion || "").toLowerCase()
        return cliente.includes(q) || titulo.includes(q) || lugar.includes(q) || direccion.includes(q)
      })
    }

    return list.sort((a, b) => {
      const dateDiff = (b.fecha_evento || "").localeCompare(a.fecha_evento || "")
      if (dateDiff !== 0) return dateDiff
      return (b.hora_inicio || "").localeCompare(a.hora_inicio || "")
    })
  }, [servicios, filtroEstado, search])

  const stats = useMemo(() => {
    return {
      total: servicios.length,
      activos: servicios.filter(
        (s) => s.estado === "reservado" || s.estado === "confirmado" || s.estado === "en_progreso"
      ).length,
      completados: servicios.filter((s) => s.estado === "completado").length,
      cancelados: servicios.filter((s) => s.estado === "cancelado").length,
    }
  }, [servicios])

  const statCards = [
    {
      key: "todos",
      label: "TOTAL COBERTURAS",
      value: stats.total,
      subtitle: "Eventos registrados",
      icon: Layers01Icon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      key: "activos",
      label: "ACTIVAS / EN CURSO",
      value: stats.activos,
      subtitle: (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#9d4300] bg-[#ffdbca]/60 px-2 py-0.5 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]" />
          En seguimiento
        </span>
      ),
      icon: Clock01Icon,
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      key: "completado",
      label: "COMPLETADAS",
      value: stats.completados,
      subtitle: "Finalizadas con éxito",
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "cancelado",
      label: "CANCELADAS",
      value: stats.cancelados,
      subtitle: "Eventos cancelados",
      icon: Cancel01Icon,
      iconBg: "bg-red-50 text-red-600",
    },
  ]

  const handleCambiarEstado = async (id: string, nuevoEstado: ServicioStreaming["estado"]) => {
    setSavingMap((prev) => ({ ...prev, [id]: true }))
    try {
      const updated = await streamingService.cambiarEstado(id, nuevoEstado)
      toast.success(`Estado actualizado a ${ESTADO_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
      setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, estado: updated.estado } : s)))
    } catch {
      toast.error("Error al cambiar estado")
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }))
    }
  }

  const getClienteNombre = (s: ServicioStreaming) => {
    if (s.cliente_externo) return `${s.cliente_externo.nombres} ${s.cliente_externo.apellidos || ""}`.trim()
    if (s.persona) return `${s.persona.nombres} ${s.persona.apellidos}`.trim()
    return "—"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando servicios de streaming...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Streaming
          </h1>
          
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            title="Recargar datos"
            className="size-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
          >
            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/servicios/streaming/nuevo")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fd761a] text-white font-bold text-sm shadow-md shadow-orange-500/25 hover:bg-[#e06310] active:scale-[0.98] transition-all"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} />
            Nueva Cobertura
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const isSelected = filtroEstado === card.key
          return (
            <motion.div
              key={card.key}
              whileHover={{ y: -2 }}
              onClick={() => handleFiltroEstado(card.key)}
              className={cn(
                "cursor-pointer p-4 rounded-2xl bg-white border shadow-xs transition-all relative overflow-hidden",
                isSelected
                  ? "border-[#fd761a] ring-2 ring-[#fd761a]/20 shadow-md"
                  : "border-slate-200/80 hover:border-slate-300"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {card.label}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                    {card.value}
                  </span>
                  <div className="mt-1 text-xs text-slate-500 font-medium">
                    {card.subtitle}
                  </div>
                </div>
                <div className={cn("size-10 rounded-xl flex items-center justify-center", card.iconBg)}>
                  <HugeiconsIcon icon={card.icon} size={20} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Chips de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "todos", label: "Todos" },
            { id: "activos", label: "Activos" },
            { id: "reservado", label: "Reservado" },
            { id: "confirmado", label: "Confirmado" },
            { id: "en_progreso", label: "En progreso" },
            { id: "completado", label: "Completado" },
            { id: "cancelado", label: "Cancelado" },
          ].map((chip) => {
            const active = filtroEstado === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleFiltroEstado(chip.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  active
                    ? "bg-[#fd761a] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                )}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por evento, cliente, lugar..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Coberturas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="size-16 rounded-3xl bg-orange-50 text-[#fd761a] flex items-center justify-center mx-auto mb-3">
              <HugeiconsIcon icon={CameraVideoIcon} size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron coberturas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No hay servicios registrados que coincidan con los filtros o la búsqueda actual.
            </p>
            {(search || filtroEstado !== "todos") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  handleFiltroEstado("todos")
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-[#fd761a] bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Evento / Servicio</th>
                  <th className="py-3.5 px-4">Fecha & Horario</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Personal Staff</th>
                  <th className="py-3.5 px-4">Finanzas</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filtered.map((item) => {
                  const est = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.reservado
                  const isSaving = savingMap[item.id]

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Evento & Cliente */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 text-sm group-hover:text-[#fd761a] transition-colors">
                          {item.titulo || "Streaming / Cobertura Externa"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {getClienteNombre(item)}
                        </div>
                      </td>

                      {/* Fecha y Rango */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-400" />
                          {formatCalendarDate(item.fecha_evento, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                          {item.hora_inicio?.slice(0, 5)} - {item.hora_fin?.slice(0, 5)}
                        </div>
                      </td>

                      {/* Locación */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 line-clamp-1 max-w-[200px] flex items-center gap-1">
                          <HugeiconsIcon icon={Location01Icon} size={14} className="text-slate-400 shrink-0" />
                          <span>{item.lugar}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px] mt-0.5">
                          {item.direccion || item.ciudad?.nombre || "—"}
                        </div>
                      </td>

                      {/* Staff */}
                      <td className="py-4 px-4">
                        {item.asignaciones && item.asignaciones.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                              <HugeiconsIcon icon={UserGroupIcon} size={13} className="text-slate-500" />
                              {item.asignaciones.length} asignado{item.asignaciones.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sin staff</span>
                        )}
                      </td>

                      {/* Finanzas */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">
                          ${Number(item.precio_total).toFixed(2)}
                        </div>
                        <div className="mt-0.5">
                          {item.pago_registrado ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block">
                              Pagado
                            </span>
                          ) : item.pago_abonado ? (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full inline-block">
                              Abonado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full inline-block">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <select
                          disabled={isSaving}
                          value={item.estado}
                          onChange={(e) =>
                            handleCambiarEstado(
                              item.id,
                              e.target.value as ServicioStreaming["estado"]
                            )
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30",
                            est.bg,
                            est.text
                          )}
                        >
                          <option value="reservado">Reservado</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="en_progreso">En progreso</option>
                          <option value="completado">Completado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botón Pago rápido si tiene saldo */}
                          {!item.pago_registrado && (
                            <Link
                              to={`/servicios/streaming/${item.id}/pago`}
                              title="Registrar pago / abono"
                              className="size-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                            >
                              <HugeiconsIcon icon={Money01Icon} size={16} />
                            </Link>
                          )}

                          {/* Quick view modal */}
                          <button
                            type="button"
                            onClick={() => setModalStreaming(item)}
                            title="Vista rápida"
                            className="size-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                          >
                            <HugeiconsIcon icon={EyeIcon} size={16} />
                          </button>

                          {/* Editar */}
                          <Link
                            to={`/servicios/streaming/${item.id}/editar`}
                            title="Editar cobertura"
                            className="size-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={16} />
                          </Link>

                          {/* Ver Ficha Detalle */}
                          <Link
                            to={`/servicios/streaming/${item.id}`}
                            title="Ficha completa"
                            className="px-2.5 py-1 rounded-lg bg-[#fd761a]/10 text-[#fd761a] hover:bg-[#fd761a] hover:text-white font-bold text-xs transition-colors"
                          >
                            Detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ficha Rápida */}
      <DetalleStreamingModal
        isOpen={Boolean(modalStreaming)}
        onClose={() => setModalStreaming(null)}
        streaming={modalStreaming}
        onStatusChanged={(updated) => {
          setServicios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
          setModalStreaming(updated)
        }}
      />
    </div>
  )
}
