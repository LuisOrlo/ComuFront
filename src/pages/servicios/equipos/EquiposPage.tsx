import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Search01Icon,
  Cancel01Icon,
  Camera01Icon,
  MoreHorizontalIcon,
  Delete02Icon,
  Clock01Icon,
  Add01Icon,
  CheckmarkCircle04Icon,
  Layers01Icon,
  Edit01Icon,
  ArrowReloadHorizontalIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { cn, getStorageUrl } from "@/lib/utils"
import { equiposService, type Equipo } from "@/services/equipos.service"
import { toast } from "sonner"

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  disponible: {
    label: "Disponible",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  alquilado: {
    label: "Alquilado",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  mantenimiento: {
    label: "En mantenimiento",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
}

export function EquiposPage() {
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [estadoMenu, setEstadoMenu] = useState<string | null>(null)
  const [accionesMenu, setAccionesMenu] = useState<string | null>(null)

  const loadEquipos = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await equiposService.getEquipos()
      setEquipos(data)
    } catch {
      toast.error("Error al cargar catálogo de equipos")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEquipos()
  }, [loadEquipos])

  const confirmDeleteEquipo = async () => {
    const id = deleteConfirm
    if (!id) return
    setDeleteConfirm(null)
    try {
      await equiposService.deleteEquipo(id)
      toast.success("Equipo eliminado del catálogo")
      loadEquipos(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al eliminar equipo"
      toast.error(msg)
    }
  }

  const handleCambiarEstado = async (equipo: Equipo, nuevoEstado: Equipo["estado"]) => {
    if (nuevoEstado === equipo.estado) return
    try {
      setEquipos((prev) =>
        prev.map((e) => (e.id === equipo.id ? { ...e, estado: nuevoEstado } : e)),
      )
      await equiposService.updateEquipo(equipo.id, { estado: nuevoEstado })
      toast.success(`Estado actualizado a ${STATUS_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
      loadEquipos(true)
    } catch {
      toast.error("Error al cambiar estado")
      loadEquipos(true)
    }
  }

  const stats = useMemo(() => {
    const total = equipos.length
    const disponibles = equipos.filter((e) => e.estado === "disponible").length
    const alquilados = equipos.filter((e) => e.estado === "alquilado").length
    const mantenimiento = equipos.filter((e) => e.estado === "mantenimiento").length

    return { total, disponibles, alquilados, mantenimiento }
  }, [equipos])

  const statCards = [
    {
      key: "todos",
      label: "TOTAL EQUIPOS",
      value: stats.total,
      subtitle: "Inventario registrado",
      icon: Layers01Icon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      key: "disponible",
      label: "DISPONIBLES",
      value: stats.disponibles,
      subtitle: (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Listos para renta
        </span>
      ),
      icon: CheckmarkCircle04Icon,
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "alquilado",
      label: "ALQUILADOS",
      value: stats.alquilados,
      subtitle: (
        <span className="inline-flex items-center gap-1 text-[11px] text-[#9d4300] bg-[#ffdbca]/60 px-2 py-0.5 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]" />
          En uso / préstamo
        </span>
      ),
      icon: Clock01Icon,
      iconBg: "bg-[#ffdbca] text-[#9d4300]",
    },
    {
      key: "mantenimiento",
      label: "MANTENIMIENTO",
      value: stats.mantenimiento,
      subtitle: "Revisión técnica",
      icon: AlertCircleIcon,
      iconBg: "bg-red-50 text-red-600",
    },
  ]

  const filtered = useMemo(() => {
    let list = equipos
    if (filtroEstado !== "todos") {
      list = list.filter((e) => e.estado === filtroEstado)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((e) => {
        const nombre = (e.nombre || "").toLowerCase()
        const desc = (e.descripcion || "").toLowerCase()
        return nombre.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [equipos, filtroEstado, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando catálogo de equipos...</p>
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
              Catálogo de Equipos
            </h1>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate("/servicios/equipos/alquileres")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={17} className="text-slate-500" />
              <span>Ver Alquileres</span>
            </button>
            <button
              onClick={() => navigate("/servicios/equipos/nuevo")}
              className="h-10 px-5 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              type="button"
            >
              <HugeiconsIcon icon={Add01Icon} size={17} />
              <span>Registrar Equipo</span>
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

        {/* Workspace Toolbar */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Equipos Registrados</h2>
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
                  placeholder="Buscar por equipo o descripción…"
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
                onClick={() => loadEquipos(true)}
                className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs shrink-0 active:scale-95 cursor-pointer"
                title="Actualizar datos"
                type="button"
              >
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={16} />
              </button>
            </div>
          </div>

          {/* Grid of Equipment Cards */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-14 text-center space-y-3 shadow-xs">
              <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <HugeiconsIcon icon={Camera01Icon} size={28} />
              </div>
              <p className="font-bold text-sm text-slate-800">
                {search ? `Sin resultados para "${search}"` : "No hay equipos registrados"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prueba ajustando los filtros o registra un nuevo equipo audiovisual para comenzar a gestionar alquileres.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/servicios/equipos/nuevo")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <HugeiconsIcon icon={Add01Icon} size={15} />
                  Registrar Primer Equipo
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((eq, i) => {
                const statusCfg = STATUS_CONFIG[eq.estado] || STATUS_CONFIG.disponible

                return (
                  <motion.div
                    key={eq.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* Imagen y Badges */}
                      <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                        {eq.foto_url ? (
                          <img
                            src={getStorageUrl(eq.foto_url)}
                            alt={eq.nombre}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-300">
                            <HugeiconsIcon icon={Camera01Icon} size={38} />
                            <span className="text-[10px] font-semibold">Sin imagen</span>
                          </div>
                        )}

                        {/* Selector / Pill de Estado */}
                        <div className="absolute top-2.5 left-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEstadoMenu(estadoMenu === eq.id ? null : eq.id)
                            }}
                            className={cn(
                              "relative z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-xs backdrop-blur-md outline-none transition-all cursor-pointer hover:opacity-90 active:scale-95",
                              statusCfg.badge,
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full shrink-0", statusCfg.dot)} />
                            <span>{statusCfg.label}</span>
                          </button>

                          {estadoMenu === eq.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setEstadoMenu(null)}
                              />
                              <div className="absolute left-0 top-full mt-1.5 z-40 min-w-[155px] bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in-50 zoom-in-95">
                                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                      setEstadoMenu(null)
                                      handleCambiarEstado(eq, val as Equipo["estado"])
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-colors cursor-pointer",
                                      eq.estado === val
                                        ? "bg-slate-100 text-slate-900"
                                        : "hover:bg-slate-50 text-slate-600",
                                    )}
                                  >
                                    <span className={cn("size-2 rounded-full shrink-0", cfg.dot)} />
                                    <span>{cfg.label}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Menú de Acciones (Editar/Eliminar) */}
                        <div className="absolute top-2.5 right-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAccionesMenu(accionesMenu === eq.id ? null : eq.id)
                            }}
                            className="size-8 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xs hover:bg-white text-slate-600 transition-colors z-20 cursor-pointer"
                            title="Opciones"
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} size={15} />
                          </button>

                          {accionesMenu === eq.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setAccionesMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 z-40 min-w-[130px] bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in-50 zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccionesMenu(null)
                                    navigate(`/servicios/equipos/${eq.id}/editar`)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Edit01Icon} size={13} className="text-slate-400" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccionesMenu(null)
                                    setDeleteConfirm(eq.id)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Delete02Icon} size={13} />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Información de Equipo */}
                      <div className="p-4 space-y-2">
                        <div>
                          <h3
                            onClick={() => navigate(`/servicios/equipos/${eq.id}/historial`)}
                            className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors truncate cursor-pointer"
                            title={eq.nombre}
                          >
                            {eq.nombre}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed min-h-[32px]">
                            {eq.descripcion || "Sin descripción de accesorios registrada."}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-slate-900 tracking-tight">
                            ${Number(eq.precio_diario).toFixed(2)}
                            <span className="text-[11px] font-medium text-slate-400 ml-1">/ día</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/servicios/equipos/${eq.id}/historial`)}
                        className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group/btn"
                      >
                        <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400 group-hover/btn:text-white transition-colors" />
                        <span>Historial</span>
                      </button>

                      {eq.estado === "disponible" ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/servicios/equipos/nuevo-alquiler/${eq.id}`)}
                          className="h-9 px-3 rounded-lg bg-[#fd761a] hover:bg-[#d65700] text-white text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:shadow-md"
                        >
                          <span>Alquilar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="h-9 px-3 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200 flex items-center justify-center"
                        >
                          <span>No disponible</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Footnote */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-xs shadow-2xs mt-2">
              <span className="font-medium">
                Mostrando {filtered.length} de {equipos.length} equipos registrados en catálogo
              </span>
              <div className="flex items-center gap-1.5 font-medium">
                <span>Catálogo sincronizado</span>
                <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Equipo"
        message={`¿Eliminar el equipo "${
          deleteConfirm ? equipos.find((e) => e.id === deleteConfirm)?.nombre : ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={confirmDeleteEquipo}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
