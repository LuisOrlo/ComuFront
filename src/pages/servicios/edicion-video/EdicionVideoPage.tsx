import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  Edit01Icon,
  SearchIcon,
  Tick02Icon,
  Calendar03Icon,
  Alert02Icon,
  Clock01Icon,
  ImageIcon,
  Layers02Icon,
  Diamond02Icon,
} from "@hugeicons/core-free-icons"
import { Trash2, X, Plus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import {
  edicionVideoService,
  type TrabajoEdicion,
  type NivelEdicion,
  type EstadoTrabajo,
  NIVEL_EDICION_LABELS,
  ESTADO_TRABAJO_LABELS,
} from "@/services/edicion-video.service"
import { personasService, type Persona } from "@/services/personas.service"
import { toast } from "sonner"

const KANBAN_COLUMNS: { key: EstadoTrabajo; label: string; color: string }[] = [
  { key: "recibido", label: "Recibido", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "en_proceso", label: "En proceso", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "revision", label: "Revisión", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "entregado", label: "Entregado", color: "bg-green-100 text-green-700 border-green-200" },
]

const NIVEL_COLORS: Record<NivelEdicion, string> = {
  basica: "bg-gray-100 text-gray-700 border-gray-200",
  estandar: "bg-blue-100 text-blue-700 border-blue-200",
  premium: "bg-amber-100 text-amber-700 border-amber-200",
}

const NIVEL_ICONS: Record<NivelEdicion, typeof ImageIcon> = {
  basica: ImageIcon,
  estandar: Layers02Icon,
  premium: Diamond02Icon,
}

export function EdicionVideoPage() {
  const [trabajos, setTrabajos] = useState<TrabajoEdicion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [vista, setVista] = useState<"lista" | "kanban">("lista")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<TrabajoEdicion>>({
    titulo: "",
    descripcion: "",
    fecha_recibo: new Date().toISOString().split("T")[0],
    fecha_limite: "",
    nivel: "basica",
    estado: "recibido",
    editor_ids: [],
    cobro_registrado: false,
  })

  const [personas, setPersonas] = useState<Persona[]>([])

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTrabajo, setSelectedTrabajo] = useState<TrabajoEdicion | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadTrabajos = async () => {
    try {
      const params: { search?: string } = {}
      if (search) params.search = search
      const data = await edicionVideoService.getTrabajos(params)
      setTrabajos(data)
    } catch {
      toast.error("Error al cargar trabajos")
    }
  }

  const loadPersonas = async () => {
    try {
      const res = await personasService.getPersonas({ page: 1 })
      setPersonas(res.data)
    } catch { /* empty */ }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([loadTrabajos(), loadPersonas()]).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTrabajos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSave = async () => {
    try {
      if (!form.titulo?.trim()) { toast.error("El título es obligatorio"); return }
      if (!form.fecha_limite) { toast.error("La fecha límite es obligatoria"); return }

      if (editingId) {
        await edicionVideoService.updateTrabajo(editingId, form)
        toast.success("Trabajo actualizado")
      } else {
        await edicionVideoService.createTrabajo(form)
        toast.success("Trabajo registrado")
      }
      setModalOpen(false)
      setEditingId(null)
      loadTrabajos()
    } catch (_error: unknown) {
      toast.error((_error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al guardar trabajo")
    }
  }

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

  const changeEstado = async (id: string, estado: EstadoTrabajo) => {
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

  const openEdit = (t: TrabajoEdicion) => {
    setForm({
      titulo: t.titulo,
      descripcion: t.descripcion,
      fecha_recibo: t.fecha_recibo,
      fecha_limite: t.fecha_limite,
      nivel: t.nivel,
      estado: t.estado,
      editor_ids: t.editor_ids,
      notas: t.notas,
      cobro_registrado: t.cobro_registrado,
    })
    setEditingId(t.id)
    setModalOpen(true)
  }

  const toggleEditor = (personaId: string) => {
    setForm(prev => {
      const current = prev.editor_ids || []
      const exists = current.includes(personaId)
      return {
        ...prev,
        editor_ids: exists ? current.filter(id => id !== personaId) : [...current, personaId],
      }
    })
  }

  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Servicios
              <span className="size-1 rounded-full bg-current opacity-50" />
              Post-Producción
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Edición de Video
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
              onClick={() => {
                setForm({
                  titulo: "", descripcion: "",
                  fecha_recibo: todayStr, fecha_limite: "",
                  nivel: "basica", estado: "recibido",
                  editor_ids: [], cobro_registrado: false,
                })
                setEditingId(null)
                setModalOpen(true)
              }}
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
            {(["lista", "kanban"] as const).map(k => (
              <button
                key={k}
                onClick={() => setVista(k)}
                className={cn(
                  "px-4 py-2 rounded-[10px] text-xs font-bold transition-all",
                  vista === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                )}
              >
                {k === "lista" ? "Lista" : "Kanban"}
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
                    {["Título", "Nivel", "Estado", "Fecha Límite", "Editores", "Acciones"].map(h => (
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
                          onClick={() => { setSelectedTrabajo(t); setDetailOpen(true) }}
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
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", NIVEL_COLORS[t.nivel])}>
                              <HugeiconsIcon icon={NIVEL_ICONS[t.nivel]} size={10} />
                              {NIVEL_EDICION_LABELS[t.nivel]}
                            </span>
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
                                <button onClick={() => changeEstado(t.id, "en_proceso")} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Iniciar</button>
                              )}
                              {t.estado === "en_proceso" && (
                                <button onClick={() => changeEstado(t.id, "revision")} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">Rev.</button>
                              )}
                              {t.estado === "revision" && (
                                <>
                                  <button onClick={() => changeEstado(t.id, "en_proceso")} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Volver</button>
                                  <button onClick={() => handleRegistrarEntrega(t.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors">Entregar</button>
                                </>
                              )}
                              {t.estado === "entregado" && !t.cobro_registrado && (
                                <button onClick={() => handleRegistrarCobro(t.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">Cobrar</button>
                              )}
                              <div className="w-px h-5 bg-gray-200 mx-0.5" />
                              <button onClick={() => openEdit(t)} className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><HugeiconsIcon icon={Edit01Icon} size={11} /></button>
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
                            onClick={() => { setSelectedTrabajo(t); setDetailOpen(true) }}
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
                                <button onClick={(e) => { e.stopPropagation(); openEdit(t) }} className="size-6 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><HugeiconsIcon icon={Edit01Icon} size={10} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.titulo) }} className="size-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100"><Trash2 size={10} className="text-red-500" /></button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border", NIVEL_COLORS[t.nivel])}>
                                <HugeiconsIcon icon={NIVEL_ICONS[t.nivel]} size={10} />
                                {NIVEL_EDICION_LABELS[t.nivel]}
                              </span>
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
                                  <button onClick={(e) => { e.stopPropagation(); changeEstado(t.id, "en_proceso") }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                                    Iniciar
                                  </button>
                                )}
                                {col.key === "en_proceso" && (
                                  <button onClick={(e) => { e.stopPropagation(); changeEstado(t.id, "revision") }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                                    Enviar a Rev.
                                  </button>
                                )}
                                {col.key === "revision" && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); changeEstado(t.id, "en_proceso") }} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
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

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>{editingId ? "Editar Trabajo" : "Nuevo Trabajo"}</h2>
                  <p className="text-xs font-medium opacity-50">Registro de trabajo de edición</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Título *</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={e => setForm({ ...form, titulo: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    placeholder="Ej. Edición video promocional"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Descripción / Especificaciones</label>
                  <textarea
                    value={form.descripcion || ""}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    rows={3}
                    placeholder="Describe el alcance del trabajo..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Fecha de Recibo</label>
                    <input
                      type="date"
                      value={form.fecha_recibo}
                      onChange={e => setForm({ ...form, fecha_recibo: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Fecha Límite *</label>
                    <input
                      type="date"
                      value={form.fecha_limite || ""}
                      onChange={e => setForm({ ...form, fecha_limite: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3.5 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4",
                        form.fecha_limite && form.fecha_limite < todayStr ? "focus:ring-red-500/10 border-red-300" : "focus:ring-blue-500/10"
                      )}
                      style={{ borderColor: form.fecha_limite && form.fecha_limite < todayStr ? undefined : COLORS.BORDER_SUBTLE }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Nivel de Edición</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                    {(["basica", "estandar", "premium"] as NivelEdicion[]).map(nivel => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => setForm({ ...form, nivel })}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                          form.nivel === nivel ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                        )}
                      >
                        <HugeiconsIcon icon={NIVEL_ICONS[nivel]} size={12} />
                        {NIVEL_EDICION_LABELS[nivel]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Editores Asignados</label>
                  <div className="flex flex-wrap gap-2">
                    {personas.length === 0 ? (
                      <p className="text-xs opacity-30 italic px-1">Cargando personal...</p>
                    ) : (
                      personas.map(p => {
                        const selected = (form.editor_ids || []).includes(p.id)
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleEditor(p.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                              selected ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm" : "bg-gray-50 hover:bg-gray-100"
                            )}
                            style={{ borderColor: selected ? undefined : COLORS.BORDER_SUBTLE }}
                          >
                            <div className={cn("size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white", selected ? "bg-blue-500" : "bg-gray-300")}>
                              {p.nombres.charAt(0)}{p.apellidos?.charAt(0) || ""}
                            </div>
                            {p.nombres} {p.apellidos}
                            {selected && <HugeiconsIcon icon={Tick02Icon} size={12} className="text-blue-500" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Notas</label>
                  <textarea
                    value={form.notas || ""}
                    onChange={e => setForm({ ...form, notas: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    rows={2}
                    placeholder="Notas internas..."
                  />
                </div>
              </div>
              <div className="px-6 py-5 bg-gray-50 border-t flex justify-end gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cancelar</button>
                <button onClick={handleSave} className="px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/20" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>{editingId ? "Actualizar" : "Registrar Trabajo"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailOpen && selectedTrabajo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>{selectedTrabajo.titulo}</h2>
                  <p className="text-xs font-medium opacity-40 mt-0.5">Detalle del trabajo de edición</p>
                </div>
                <button onClick={() => setDetailOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", KANBAN_COLUMNS.find(c => c.key === selectedTrabajo.estado)?.color || "bg-gray-100")}>
                    {ESTADO_TRABAJO_LABELS[selectedTrabajo.estado]}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", NIVEL_COLORS[selectedTrabajo.nivel])}>
                    <HugeiconsIcon icon={NIVEL_ICONS[selectedTrabajo.nivel]} size={10} />
                    {NIVEL_EDICION_LABELS[selectedTrabajo.nivel]}
                  </span>
                  {selectedTrabajo.cobro_registrado && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                      <HugeiconsIcon icon={Tick02Icon} size={10} /> Cobrado
                    </span>
                  )}
                </div>
                {selectedTrabajo.descripcion && (
                  <div className="p-4 rounded-2xl bg-gray-50">
                    <p className="text-xs font-medium" style={{ color: COLORS.CHARCOAL }}>{selectedTrabajo.descripcion}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Recibido</p>
                    <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(selectedTrabajo.fecha_recibo).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Límite</p>
                    <p className={cn("text-sm font-bold", selectedTrabajo.fecha_limite < todayStr && selectedTrabajo.estado !== "entregado" ? "text-red-600" : "")} style={{ color: selectedTrabajo.fecha_limite < todayStr && selectedTrabajo.estado !== "entregado" ? undefined : COLORS.CHARCOAL }}>
                      {new Date(selectedTrabajo.fecha_limite).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                </div>
                {selectedTrabajo.editores && selectedTrabajo.editores.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Editores Asignados</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTrabajo.editores.map(ed => (
                        <div key={ed.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                            {ed.nombres.charAt(0)}{ed.apellidos.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-blue-700">{ed.nombres} {ed.apellidos}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedTrabajo.notas && (
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Notas</p>
                    <p className="text-xs font-medium" style={{ color: COLORS.CHARCOAL }}>{selectedTrabajo.notas}</p>
                  </div>
                )}
              </div>
              <div className="px-6 py-5 bg-gray-50 border-t flex justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setDetailOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
