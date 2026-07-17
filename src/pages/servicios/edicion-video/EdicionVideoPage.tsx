import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon, Edit01Icon, SearchIcon, Tick02Icon,
  Calendar03Icon, Alert02Icon, Clock01Icon,
} from "@hugeicons/core-free-icons"
import { Trash2, Plus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type EstadoTrabajo,
  ESTADO_TRABAJO_LABELS,
} from "@/services/edicion-video.service"
import { toast } from "sonner"

const KANBAN_COLUMNS: { key: EstadoTrabajo; label: string; color: string }[] = [
  { key: "recibido", label: "Recibido", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "en_proceso", label: "En proceso", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "revision", label: "Revisión", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "entregado", label: "Entregado", color: "bg-green-100 text-green-700 border-green-200" },
]

export function EdicionVideoPage() {
  const navigate = useNavigate()
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [vista, setVista] = useState<"lista" | "pizarra">("lista")

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadTrabajos = useCallback(async () => {
    try {
      const params: { search?: string; per_page?: number } = { per_page: 100 }
      if (debouncedSearch) params.search = debouncedSearch
      const res = await edicionVideoService.getTrabajos(params)
      setTrabajos(res.data)
    } catch {
      toast.error("Error al cargar trabajos")
    }
  }, [debouncedSearch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    loadTrabajos().finally(() => setLoading(false))
  }, [loadTrabajos])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<EstadoTrabajo, TrabajoEdicion[]> = {
      recibido: [], en_proceso: [], revision: [], entregado: [],
    }
    trabajos.forEach(t => {
      if (groups[t.estado]) groups[t.estado].push(t)
    })
    return groups
  }, [trabajos])

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await edicionVideoService.deleteTrabajo(deleteConfirm.id)
      toast.success("Trabajo eliminado")
      setDeleteConfirm(null)
      loadTrabajos()
    } catch {
      toast.error("Error al eliminar trabajo")
    } finally {
      setDeletingItem(false)
    }
  }

  const _changeEstado = async (id: string, estado: EstadoTrabajo) => {
    try {
      await edicionVideoService.updateTrabajo(id, { estado })
      toast.success(`Trabajo movido a ${ESTADO_TRABAJO_LABELS[estado]}`)
      loadTrabajos()
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  const handleRegistrarEntrega = async (id: string) => {
    try {
      await edicionVideoService.registrarEntrega(id, {
        fecha_entrega: new Date().toISOString(),
        precio_cobrado: undefined,
      })
      toast.success("Entrega registrada")
      loadTrabajos()
    } catch {
      toast.error("Error al registrar entrega")
    }
  }

  const handleRegistrarCobro = async (id: string) => {
    try {
      await edicionVideoService.registrarCobro(id)
      toast.success("Cobro registrado")
      loadTrabajos()
    } catch {
      toast.error("Error al registrar cobro")
    }
  }

  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Edición de Videos
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar trabajo..."
                className="w-52 pl-9 pr-4 py-2.5 rounded-xl border bg-gray-50 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            </div>
            <button
              onClick={() => navigate("/servicios/edicion-video/nuevo")}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-blue-500/20"
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
            >
              <Plus size={18} strokeWidth={2.5} color="white" />
              Nuevo Trabajo
            </button>
          </div>
        </div>
      </header>

      <div className="shrink-0 px-8 py-3 border-b bg-white/50 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
            {(["lista", "pizarra"] as const).map(k => (
              <button
                key={k}
                onClick={() => setVista(k)}
                className={cn(
                  "px-4 py-2 rounded-[10px] text-xs font-bold transition-all",
                  vista === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                )}
              >
                {k === "lista" ? "Lista" : "Pizarra"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold opacity-40 ml-4">
            <span>{trabajos.length} trabajo{trabajos.length !== 1 ? "s" : ""}</span>
            {KANBAN_COLUMNS.map(col => (
              <span key={col.key} className="hidden sm:flex items-center gap-1.5">
                <span className={cn("size-2 rounded-sm", col.color.split(" ")[0])} />
                {col.label}: {grouped[col.key].length}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-32"><p className="text-sm font-medium opacity-30 animate-pulse">Cargando trabajos...</p></div>
        ) : trabajos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
              <HugeiconsIcon icon={VideoIcon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
            </div>
            <p className="text-sm font-bold opacity-30">No hay trabajos de edición</p>
            <p className="text-xs opacity-20 max-w-[280px]">Registra un nuevo trabajo de edición para comenzar a gestionarlo.</p>
          </div>
        ) : vista === "lista" ? (
          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {["Título", "Estado", "Fecha Límite", "Editores", "Acciones"].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 last:text-right" style={{ color: COLORS.CHARCOAL }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <AnimatePresence mode="popLayout">
                    {trabajos.map((t, i) => {
                      const isVencido = t.fecha_limite < todayStr && t.estado !== "entregado"
                      const isProximo = !isVencido && t.fecha_limite === todayStr && t.estado !== "entregado"
                      const col = KANBAN_COLUMNS.find(c => c.key === t.estado)
                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.025, type: "spring", stiffness: 450, damping: 30 }}
                          onClick={() => navigate(`/servicios/edicion-video/${t.id}`)}
                          className={cn(
                            "cursor-pointer hover:bg-gray-50/80 transition-colors",
                            isVencido && "bg-red-50/40",
                            isProximo && "bg-amber-50/40",
                          )}
                        >
                          <td className="px-5 py-4">
                            <div className="min-w-0 max-w-[220px]">
                              <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{t.titulo}</p>
                              {t.descripcion && <p className="text-[10px] opacity-40 truncate mt-0.5">{t.descripcion}</p>}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", col?.color || "bg-gray-100")}>
                              {ESTADO_TRABAJO_LABELS[t.estado]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-bold", isVencido ? "text-red-600" : isProximo ? "text-amber-600" : "")} style={{ color: !isVencido && !isProximo ? COLORS.CHARCOAL : undefined }}>
                                {new Date(t.fecha_limite).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              {isVencido && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-700"><HugeiconsIcon icon={Alert02Icon} size={8} />Vencido</span>}
                              {isProximo && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700"><HugeiconsIcon icon={Clock01Icon} size={8} />Hoy</span>}
                              {t.cobro_registrado && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-700"><HugeiconsIcon icon={Tick02Icon} size={8} />Cobrado</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              {t.editores && t.editores.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  {t.editores.slice(0, 2).map(ed => (
                                    <span key={ed.id} className="text-xs font-medium" style={{ color: COLORS.CHARCOAL }}>
                                      {ed.nombres} {ed.apellidos}
                                    </span>
                                  ))}
                                  {t.editores.length > 2 && <span className="text-[10px] font-bold opacity-40">+{t.editores.length - 2}</span>}
                                </div>
                              ) : (
                                <span className="text-[10px] opacity-30 italic">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              {t.estado === "recibido" && (
                                <button onClick={() => _changeEstado(t.id, "en_proceso")} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Iniciar</button>
                              )}
                              {t.estado === "en_proceso" && (
                                <button onClick={() => _changeEstado(t.id, "revision")} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">Rev.</button>
                              )}
                              {t.estado === "revision" && (
                                <>
                                  <button onClick={() => _changeEstado(t.id, "en_proceso")} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Volver</button>
                                  <button onClick={() => handleRegistrarEntrega(t.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors">Entregar</button>
                                </>
                              )}
                              {t.estado === "entregado" && !t.cobro_registrado && (
                                <button onClick={() => handleRegistrarCobro(t.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">Cobrar</button>
                              )}
                              <div className="w-px h-5 bg-gray-200 mx-0.5" />
                              <button onClick={() => navigate(`/servicios/edicion-video/${t.id}/editar`)} className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><HugeiconsIcon icon={Edit01Icon} size={11} /></button>
                              <button onClick={() => handleDelete(t.id, t.titulo)} className="size-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100"><Trash2 size={11} className="text-red-500" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 h-full min-h-0">
            {KANBAN_COLUMNS.map(col => {
              const items = grouped[col.key]
              const isEntregado = col.key === "entregado"
              return (
                <div key={col.key} className="bg-gray-100/50 rounded-[2rem] border flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className={cn("shrink-0 px-5 py-4 border-b flex items-center justify-between rounded-t-[2rem]", col.color.split(" ")[0].replace("bg-", "bg-").replace("100", "50").replace("text-", "text-").replace("700", "800").replace("border-", "border-").replace("200", "100"))}
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("size-3 rounded", col.color.split(" ")[0])} />
                      <h3 className="text-sm font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>{col.label}</h3>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", col.color)}>{items.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="size-12 rounded-xl bg-white/60 flex items-center justify-center mb-2">
                          <Plus size={16} className="opacity-20" />
                        </div>
                        <p className="text-[10px] font-medium opacity-30">Arrastra o crea</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {items.map((t, i) => {
                          const isVencido = t.fecha_limite < todayStr && t.estado !== "entregado"
                          const isProximo = !isVencido && t.fecha_limite === todayStr && t.estado !== "entregado"
                          return (
                          <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
                            transition={{ delay: i * 0.03, type: "spring", stiffness: 450, damping: 30 }}
                            onClick={() => navigate(`/servicios/edicion-video/${t.id}`)}
                            className={cn(
                              "bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer",
                              isVencido && "border-red-300 bg-red-50/30",
                              isProximo && "border-amber-300 bg-amber-50/30",
                            )}
                            style={{ borderColor: isVencido ? undefined : isProximo ? undefined : COLORS.BORDER_SUBTLE }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{t.titulo}</h4>
                                {t.descripcion && <p className="text-[10px] opacity-40 mt-0.5 line-clamp-2">{t.descripcion}</p>}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/servicios/edicion-video/${t.id}/editar`) }} className="size-6 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><HugeiconsIcon icon={Edit01Icon} size={10} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.titulo) }} className="size-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100"><Trash2 size={10} className="text-red-500" /></button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {isVencido && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                                  <HugeiconsIcon icon={Alert02Icon} size={10} />
                                  Vencido
                                </span>
                              )}
                              {isProximo && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                                  <HugeiconsIcon icon={Clock01Icon} size={10} />
                                  Hoy vence
                                </span>
                              )}
                              {t.cobro_registrado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                                  <HugeiconsIcon icon={Tick02Icon} size={10} />
                                  Cobrado
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <HugeiconsIcon icon={Calendar03Icon} size={11} className="opacity-30" />
                                <span className={cn("text-[10px] font-medium", isVencido ? "text-red-600 font-bold" : isProximo ? "text-amber-600 font-bold" : "opacity-50")}>
                                  {new Date(t.fecha_limite).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <span className="text-[10px] opacity-40">
                                Recibido: {new Date(t.fecha_recibo).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                              </span>
                            </div>

                            {t.editores && t.editores.length > 0 && (
                              <div className="flex items-center gap-1.5 mb-3">
                                {t.editores.slice(0, 3).map(ed => (
                                  <div key={ed.id} className="size-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm shrink-0" title={`${ed.nombres} ${ed.apellidos}`}>
                                    {ed.nombres.charAt(0)}{ed.apellidos.charAt(0)}
                                  </div>
                                ))}
                                {t.editores.length > 3 && (
                                  <span className="text-[9px] font-bold opacity-40">+{t.editores.length - 3}</span>
                                )}
                              </div>
                            )}

                            {!isEntregado && (
                              <div className="flex gap-1.5 pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                {col.key === "recibido" && (
                                  <button onClick={(e) => { e.stopPropagation(); _changeEstado(t.id, "en_proceso") }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                                    Iniciar
                                  </button>
                                )}
                                {col.key === "en_proceso" && (
                                  <button onClick={(e) => { e.stopPropagation(); _changeEstado(t.id, "revision") }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                                    Enviar a Rev.
                                  </button>
                                )}
                                {col.key === "revision" && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); _changeEstado(t.id, "en_proceso") }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                                      Volver
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleRegistrarEntrega(t.id) }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                                      Entregar
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {isEntregado && !t.cobro_registrado && (
                              <div className="pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                <button onClick={(e) => { e.stopPropagation(); handleRegistrarCobro(t.id) }} className="w-full py-1.5 rounded-lg text-[9px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                                  Registrar Cobro
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Trabajo"
        message={`¿Eliminar el trabajo "${deleteConfirm?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deletingItem}
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
