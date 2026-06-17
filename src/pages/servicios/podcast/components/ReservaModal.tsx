import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Microphone, SearchIcon, AddCircleIcon, UserIcon, Tick02Icon,
  Calendar03Icon, Clock01Icon, Money01Icon,
} from "@hugeicons/core-free-icons"
import { Users, X, UserPlus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { podcastService, type PaquetePodcast, type ReservaPodcast } from "@/services/podcast.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }

interface ReservaModalProps {
  isOpen: boolean
  onClose: () => void
  paquetes: PaquetePodcast[]
  editingReserva: ReservaPodcast | null
  onSaved: () => void
}

export function ReservaModal({ isOpen, onClose, paquetes, editingReserva, onSaved }: ReservaModalProps) {
  const [reservaForm, setReservaForm] = useState<Partial<ReservaPodcast>>(() => {
    if (editingReserva) {
      return {
        paquete_id: editingReserva.paquete_id,
        fecha_reserva: editingReserva.fecha_reserva,
        hora_inicio: editingReserva.hora_inicio,
        hora_fin: editingReserva.hora_fin,
        precio_total: editingReserva.precio_total,
        notas: editingReserva.notas,
      }
    }
    return { paquete_id: "", fecha_reserva: fmtDate(new Date()), hora_inicio: "08:00", hora_fin: "10:00", precio_total: 0 }
  })
  const [tipoResponsable, setTipoResponsable] = useState<"externo" | "interno">(
    editingReserva?.persona_id ? "interno" : "externo"
  )
  const [selectedClienteId, setSelectedClienteId] = useState(editingReserva?.cliente_externo_id || "")
  const [selectedPersonaId, setSelectedPersonaId] = useState(editingReserva?.persona_id || "")
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
  const [clienteSearch, setClienteSearch] = useState("")
  const [staffSearch, setStaffSearch] = useState("")
  const [personas, setPersonas] = useState<Persona[]>([])
  const [clientes, setClientes] = useState<ClienteExterno[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [asignaciones, setAsignaciones] = useState<{ persona_id: string; rol: string; persona?: { nombres: string; apellidos: string } }[]>(
    () => (editingReserva?.asignaciones || []).map(a => ({
      persona_id: a.persona_id,
      rol: a.rol || "",
      persona: a.persona ? { nombres: a.persona.nombres, apellidos: a.persona.apellidos } : undefined,
    }))
  )
  const [asignacionStaffSearch, setAsignacionStaffSearch] = useState("")
  const [saving, setSaving] = useState(false)

  const loadClientes = async (search?: string) => {
    try {
      setLoadingClientes(true)
      const res = await clientesService.getClientes({ search, per_page: 50 })
      setClientes(res.data)
    } catch { /* empty */ }
    finally { setLoadingClientes(false) }
  }

  useEffect(() => {
    personasService.getPersonas({ page: 1 })
      .then(res => setPersonas(res.data))
      .catch(() => {})
    clientesService.getClientes({ per_page: 50 })
      .then(res => setClientes(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadClientes(clienteSearch || undefined), clienteSearch ? 300 : 0)
    return () => clearTimeout(timer)
  }, [clienteSearch])

  const handleCreateCliente = async () => {
    try {
      if (!nuevoClienteForm.nombres.trim()) { toast.error("El nombre es obligatorio"); return }
      const nuevo = await clientesService.createCliente(nuevoClienteForm)
      toast.success("Cliente registrado")
      setClientes(prev => [nuevo, ...prev])
      setSelectedClienteId(nuevo.id)
      setCreandoCliente(false)
      setNuevoClienteForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
    } catch (_error: unknown) {
      toast.error((_error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al crear cliente")
    }
  }

  const calcularPrecio = () => {
    const pkg = paquetes.find(p => p.id === reservaForm.paquete_id)
    if (!pkg || !reservaForm.hora_inicio || !reservaForm.hora_fin) return 0
    const [h1, m1] = reservaForm.hora_inicio.split(":").map(Number)
    const [h2, m2] = reservaForm.hora_fin.split(":").map(Number)
    const hours = (h2 + m2 / 60) - (h1 + m1 / 60)
    return hours > 0 ? (hours * pkg.precio_por_hora) : 0
  }

  const precioActual = calcularPrecio()

  const handleSave = async () => {
    try {
      if (!reservaForm.paquete_id) { toast.error("Debe seleccionar un paquete"); return }
      setSaving(true)
      const payload: Record<string, unknown> = {
        ...reservaForm,
        precio_total: precioActual,
        estado: "pendiente",
        asignaciones: asignaciones.map(a => ({ persona_id: a.persona_id, rol: a.rol || null })),
      }
      if (tipoResponsable === "interno") {
        if (!selectedPersonaId) { toast.error("Debe seleccionar un responsable interno"); return }
        payload.persona_id = selectedPersonaId
        payload.cliente_externo_id = null
      } else {
        if (!selectedClienteId) { toast.error("Debe seleccionar o registrar un cliente"); return }
        payload.cliente_externo_id = selectedClienteId
        payload.persona_id = null
      }
      delete payload.paquete
      if (editingReserva) {
        await podcastService.updateReserva(editingReserva.id, payload)
        toast.success("Reserva actualizada")
      } else {
        await podcastService.createReserva(payload)
        toast.success("Reserva creada")
      }
      onSaved()
      onClose()
    } catch (_error: unknown) {
      const err = _error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg = err?.response?.data?.message
      const details = err?.response?.data?.errors
      if (msg) {
        toast.error(msg)
        if (details) Object.entries(details).forEach(([, msgs]) => msgs.forEach(m => toast.error(m)))
      } else { toast.error("Error al guardar reserva") }
    } finally { setSaving(false) }
  }

  const hoursInfo = useMemo(() => {
    if (!reservaForm.hora_inicio || !reservaForm.hora_fin) return null
    const [h1, m1] = reservaForm.hora_inicio.split(":").map(Number)
    const [h2, m2] = reservaForm.hora_fin.split(":").map(Number)
    return ((h2 + m2 / 60) - (h1 + m1 / 60)).toFixed(1)
  }, [reservaForm.hora_inicio, reservaForm.hora_fin])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-7 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                  <HugeiconsIcon icon={Microphone} size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                    {editingReserva ? "Editar Reserva" : "Nueva Reserva"}
                  </h2>
                  <p className="text-xs font-medium opacity-40 mt-0.5">Reserva de estudio de podcast</p>
                </div>
              </div>
              <button onClick={onClose} className="size-10 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-7 max-h-[68vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">

              <div className="rounded-2xl border-2 bg-gradient-to-br from-violet-50/80 to-white overflow-hidden" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
                <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(139, 92, 246, 0.1)" }}>
                  <div className="size-7 rounded-lg bg-violet-200/60 flex items-center justify-center">
                    <HugeiconsIcon icon={Microphone} size={14} style={{ color: "#7c3aed" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-700/70">Paquete y Horario</span>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Paquete</label>
                    <select
                      value={reservaForm.paquete_id || ""}
                      onChange={e => setReservaForm({ ...reservaForm, paquete_id: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border-2 bg-white text-sm font-bold outline-none appearance-none focus:ring-4 focus:ring-violet-500/10 transition-all"
                      style={{ borderColor: reservaForm.paquete_id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}
                    >
                      <option value="">Seleccionar paquete...</option>
                      {paquetes.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} — ${p.precio_por_hora}/hr</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                        <HugeiconsIcon icon={Calendar03Icon} size={10} className="inline mr-1" />Fecha
                      </label>
                      <input
                        type="date"
                        value={reservaForm.fecha_reserva}
                        onChange={e => setReservaForm({ ...reservaForm, fecha_reserva: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                        <HugeiconsIcon icon={Clock01Icon} size={10} className="inline mr-1" />Entrada
                      </label>
                      <input
                        type="time"
                        value={reservaForm.hora_inicio}
                        onChange={e => setReservaForm({ ...reservaForm, hora_inicio: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                        <HugeiconsIcon icon={Clock01Icon} size={10} className="inline mr-1" />Salida
                      </label>
                      <input
                        type="time"
                        value={reservaForm.hora_fin}
                        onChange={e => setReservaForm({ ...reservaForm, hora_fin: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      />
                    </div>
                  </div>

                  {reservaForm.paquete_id && precioActual > 0 && (
                    <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 text-white">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center">
                          <HugeiconsIcon icon={Money01Icon} size={16} />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Precio estimado</p>
                          <p className="text-sm font-medium opacity-90 flex items-center gap-1.5">
                            <span className="truncate max-w-[180px]">{paquetes.find(p => p.id === reservaForm.paquete_id)?.nombre || ""}</span>
                            <span className="text-white/40">•</span>
                            <span className="shrink-0 font-bold">${paquetes.find(p => p.id === reservaForm.paquete_id)?.precio_por_hora}/hr</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Total</p>
                        <p className="text-3xl font-black tracking-tighter">${precioActual.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.15)" : "rgba(99, 102, 241, 0.15)" }}>
                <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.1)" : "rgba(99, 102, 241, 0.1)", backgroundColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.03)" : "rgba(99, 102, 241, 0.03)" }}>
                  <div className={cn("size-7 rounded-lg flex items-center justify-center", tipoResponsable === "externo" ? "bg-emerald-200/60" : "bg-indigo-200/60")}>
                    <HugeiconsIcon icon={UserIcon} size={14} style={{ color: tipoResponsable === "externo" ? "#059669" : "#6366f1" }} />
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", tipoResponsable === "externo" ? "text-emerald-700/70" : "text-indigo-700/70")}>Cliente Responsable</span>
                  <div className="ml-auto flex p-0.5 rounded-lg" style={{ backgroundColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.08)" : "rgba(99, 102, 241, 0.08)" }}>
                    {(["externo", "interno"] as const).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setTipoResponsable(key); setCreandoCliente(false) }}
                        className={cn(
                          "px-3 py-1.5 rounded-[6px] text-[9px] font-bold uppercase tracking-wider transition-all",
                          tipoResponsable === key ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                        )}
                      >
                        {key === "externo" ? "Externo" : "Interno"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  {tipoResponsable === "externo" ? (
                    <div className="space-y-3">
                      <div className="flex gap-2 p-1 bg-gray-100/60 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {[
                          { key: "select", label: "Buscar Existente", icon: Search },
                          { key: "new", label: "Registrar Nuevo", icon: UserPlus },
                        ].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCreandoCliente(key === "new")}
                            className={cn(
                              "flex-1 py-2.5 rounded-[10px] text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                              (key === "new") === creandoCliente ? "bg-emerald-600 text-white shadow-sm" : "bg-transparent text-charcoal/40 hover:bg-white/50"
                            )}
                          >
                            <Icon size={13} />
                            {label}
                          </button>
                        ))}
                      </div>
                      {creandoCliente ? (
                        <div className="space-y-2.5 p-4 bg-gray-50 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <div className="grid grid-cols-2 gap-2.5">
                            <input type="text" value={nuevoClienteForm.nombres} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nombres: e.target.value })} placeholder="Nombres *" className="px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/15" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                            <input type="text" value={nuevoClienteForm.apellidos} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, apellidos: e.target.value })} placeholder="Apellidos" className="px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/15" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <input type="text" value={nuevoClienteForm.cedula} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, cedula: e.target.value })} placeholder="Cédula" className="px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/15" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                            <input type="text" value={nuevoClienteForm.celular} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, celular: e.target.value })} placeholder="Celular" className="px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/15" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                          </div>
                          <input type="email" value={nuevoClienteForm.correo} onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, correo: e.target.value })} placeholder="Correo electrónico" className="w-full px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/15" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                          <button onClick={handleCreateCliente} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                            <HugeiconsIcon icon={AddCircleIcon} size={14} /> Registrar Cliente
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="relative">
                            <HugeiconsIcon icon={SearchIcon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                            <input type="text" value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} placeholder="Buscar por nombre, cédula..." className="w-full pl-9 pr-4 py-3 rounded-xl border bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                          </div>
                          <div className="max-h-[150px] overflow-y-auto rounded-xl border bg-white divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            {loadingClientes ? (
                              <div className="p-4 text-center text-xs opacity-40 animate-pulse">Buscando...</div>
                            ) : clientes.length === 0 ? (
                              <div className="p-4 text-center text-xs opacity-40">No se encontraron clientes.</div>
                            ) : (
                              clientes.map(c => {
                                const sel = selectedClienteId === c.id
                                return (
                                  <button
                                    key={c.id} type="button"
                                    onClick={() => { setSelectedClienteId(c.id); setClienteSearch("") }}
                                    className={cn("w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3", sel && "bg-emerald-50/60")}
                                  >
                                    <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", sel ? "bg-emerald-100" : "bg-gray-100")}>
                                      <HugeiconsIcon icon={UserIcon} size={14} style={{ color: sel ? "#059669" : undefined }} className={cn(!sel && "opacity-40")} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={cn("text-xs font-bold truncate", sel ? "text-emerald-700" : "")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>{c.nombres} {c.apellidos}</p>
                                      {c.cedula && <p className="text-[9px] opacity-40 truncate">C.I. {c.cedula}</p>}
                                    </div>
                                    {sel && <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center"><HugeiconsIcon icon={Tick02Icon} size={12} className="text-emerald-600" /></div>}
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <HugeiconsIcon icon={SearchIcon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                        <input type="text" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} placeholder="Buscar personal o alumno..." className="w-full pl-9 pr-4 py-3 rounded-xl border bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                      </div>
                      <div className="max-h-[150px] overflow-y-auto rounded-xl border bg-white divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {personas.length === 0 ? (
                          <div className="p-4 text-center text-xs opacity-40 animate-pulse">Cargando personal...</div>
                        ) : (
                          personas
                            .filter(p => !staffSearch || `${p.nombres} ${p.apellidos}`.toLowerCase().includes(staffSearch.toLowerCase()))
                            .map(p => {
                              const sel = selectedPersonaId === p.id
                              return (
                                <button key={p.id} type="button" onClick={() => { setSelectedPersonaId(p.id); setStaffSearch("") }}
                                  className={cn("w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3", sel && "bg-indigo-50/60")}
                                >
                                  <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", sel ? "bg-indigo-100" : "bg-gray-100")}>
                                    <HugeiconsIcon icon={UserIcon} size={14} style={{ color: sel ? "#6366f1" : undefined }} className={cn(!sel && "opacity-40")} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={cn("text-xs font-bold truncate", sel && "text-indigo-700")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>{p.nombres} {p.apellidos}</p>
                                  </div>
                                  {sel && <div className="size-6 rounded-full bg-indigo-100 flex items-center justify-center"><HugeiconsIcon icon={Tick02Icon} size={12} className="text-indigo-600" /></div>}
                                </button>
                              )
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "rgba(124, 58, 237, 0.15)" }}>
                <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(124, 58, 237, 0.1)", backgroundColor: "rgba(124, 58, 237, 0.03)" }}>
                  <div className="size-7 rounded-lg bg-purple-200/60 flex items-center justify-center">
                    <Users size={14} style={{ color: "#7c3aed" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700/70">Personal a cargo</span>
                  {asignaciones.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700">{asignaciones.length} asignado{asignaciones.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  {asignaciones.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {asignaciones.map((a, i) => {
                        const p = personas.find(pp => pp.id === a.persona_id)
                        return (
                          <div key={a.persona_id} className="group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-purple-50/60 border border-purple-200 text-xs shadow-sm">
                            <div className="size-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                              {p?.nombres?.[0]}{p?.apellidos?.[0]}
                            </div>
                            <span className="font-bold text-purple-800 text-[11px]">{p?.nombres} {p?.apellidos}</span>
                            <div className="h-4 w-px bg-purple-200" />
                            <input type="text" value={a.rol} onChange={e => { const n = [...asignaciones]; n[i] = { ...n[i], rol: e.target.value }; setAsignaciones(n) }} placeholder="Rol" className="w-20 bg-transparent text-[10px] font-medium text-purple-600 outline-none placeholder:text-purple-300" />
                            <button onClick={() => setAsignaciones(prev => prev.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 size-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-all"><X size={10} className="text-red-400" /></button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <HugeiconsIcon icon={SearchIcon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                      <input type="text" value={asignacionStaffSearch} onChange={e => setAsignacionStaffSearch(e.target.value)} placeholder="Buscar personal para asignar..." className="w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                    </div>
                  </div>
                  {asignacionStaffSearch && (
                    <div className="max-h-[140px] overflow-y-auto rounded-xl border-2 bg-white divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      {(() => {
                        const filtered = personas.filter(p => !asignaciones.some(a => a.persona_id === p.id) && `${p.nombres} ${p.apellidos}`.toLowerCase().includes(asignacionStaffSearch.toLowerCase()))
                        return filtered.length > 0 ? (
                          filtered.map(p => (
                            <button key={p.id} type="button" onClick={() => { setAsignaciones(prev => [...prev, { persona_id: p.id, rol: "", persona: { nombres: p.nombres, apellidos: p.apellidos } }]); setAsignacionStaffSearch("") }}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50/60 transition-colors flex items-center gap-3"
                            >
                              <div className="size-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0"><HugeiconsIcon icon={UserIcon} size={14} style={{ color: "#7c3aed" }} /></div>
                              <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>{p.nombres} {p.apellidos}</p>
                              <span className="ml-auto text-[9px] font-medium text-purple-500 bg-purple-50 px-2 py-0.5 rounded-lg">Agregar</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs opacity-40">Sin resultados</div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-2 rounded-full bg-gray-300" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-40">Notas adicionales</span>
                </div>
                <textarea
                  value={reservaForm.notas || ""}
                  onChange={e => setReservaForm({ ...reservaForm, notas: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border-2 bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 resize-none transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="px-8 py-5 bg-gray-50/80 border-t flex items-center justify-between gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="text-[10px] font-medium opacity-40">
                {precioActual > 0 && hoursInfo && `${hoursInfo} hrs`}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-semibold text-charcoal/60 hover:bg-black/10 transition-all">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !reservaForm.paquete_id}
                  className="px-10 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-violet-500/20 active:scale-[0.97] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  {saving ? "Guardando..." : editingReserva ? "Actualizar" : "Confirmar Reserva"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
