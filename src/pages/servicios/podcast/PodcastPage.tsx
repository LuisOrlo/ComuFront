import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Microphone,
  Edit01Icon,
  SearchIcon,
  Money01Icon,
  InformationCircleIcon,
  UserIcon,
  Tick02Icon,
  Calendar03Icon,
  Clock01Icon,
  Mail01Icon,
  CallIcon,
  IdentificationIcon,
  AddCircleIcon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  MatrixIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { Trash2, X, Plus, Users, UserPlus, Search } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { podcastService, type PaquetePodcast, type ReservaPodcast } from "@/services/podcast.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200" },
  en_progreso: { label: "En progreso", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completado: { label: "Completado", color: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
}

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }
function fmtHora(h: string) { return h.substring(0, 5) }

function getWeekRange(date: Date) {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function getWeekDays(monday: Date) {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

export function PodcastPage() {
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPaquete, setSelectedPaquete] = useState<PaquetePodcast | null>(null)

  const [paqueteModalOpen, setPaqueteModalOpen] = useState(false)
  const [paqueteForm, setPaqueteForm] = useState<Partial<PaquetePodcast>>({
    nombre: "", descripcion: "", precio_por_hora: 0, items: [], activo: true,
  })
  const [nuevoItemNombre, setNuevoItemNombre] = useState("")

  const [reservas, setReservas] = useState<ReservaPodcast[]>([])
  const [reservaModalOpen, setReservaModalOpen] = useState(false)
  const [editingReservaId, setEditingReservaId] = useState<string | null>(null)
  const [reservaForm, setReservaForm] = useState<Partial<ReservaPodcast>>({
    paquete_id: "",
    fecha_reserva: fmtDate(new Date()),
    hora_inicio: "08:00",
    hora_fin: "10:00",
    precio_total: 0,
  })

  const [personas, setPersonas] = useState<Persona[]>([])
  const [clientes, setClientes] = useState<ClienteExterno[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clienteSearch, setClienteSearch] = useState("")
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({
    nombres: "", apellidos: "", cedula: "", correo: "", celular: "",
  })
  const [selectedClienteId, setSelectedClienteId] = useState("")

  const [tipoResponsable, setTipoResponsable] = useState<"externo" | "interno">("externo")
  const [staffSearch, setStaffSearch] = useState("")
  const [selectedPersonaId, setSelectedPersonaId] = useState("")

  const [asignaciones, setAsignaciones] = useState<{ persona_id: string; rol: string; persona?: { nombres: string; apellidos: string } }[]>([])
  const [asignacionStaffSearch, setAsignacionStaffSearch] = useState("")

  const [modoVista, setModoVista] = useState<"reservas" | "calendario">("reservas")
  const [vistaSub, setVistaSub] = useState<"lista" | "semanal">("lista")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const [detalleReserva, setDetalleReserva] = useState<ReservaPodcast | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const { monday: genMonday, sunday: genSunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const genWeekDays = useMemo(() => getWeekDays(genMonday), [genMonday])

  const [filtroEstado, setFiltroEstado] = useState("")

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "paquete" | "reserva"; id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadPaquetes = async () => {
    try {
      const data = await podcastService.getPaquetes()
      setPaquetes(data)
    } catch {
      toast.error("Error al cargar paquetes")
    }
  }

  const loadPersonas = async () => {
    try {
      const res = await personasService.getPersonas({ page: 1 })
      setPersonas(res.data)
    } catch { }
  }

  const loadClientes = async (search?: string) => {
    try {
      setLoadingClientes(true)
      const res = await clientesService.getClientes({ search, per_page: 50 })
      setClientes(res.data)
    } catch { }
    finally { setLoadingClientes(false) }
  }

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

  const loadReservas = async () => {
    try {
      const filters: Record<string, string> = {}
      if (filtroEstado) filters.estado = filtroEstado
      const data = await podcastService.getReservas(filters)
      setReservas(data)
    } catch {
      toast.error("Error al cargar reservas")
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadPaquetes(), loadPersonas(), loadClientes()]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadReservas()
  }, [filtroEstado])

  useEffect(() => {
    if (clienteSearch) {
      const timer = setTimeout(() => loadClientes(clienteSearch), 300)
      return () => clearTimeout(timer)
    } else {
      loadClientes()
    }
  }, [clienteSearch])

  const calcularPrecio = () => {
    const pkg = paquetes.find(p => p.id === reservaForm.paquete_id) || selectedPaquete
    if (!pkg || !reservaForm.hora_inicio || !reservaForm.hora_fin) return 0
    const [h1, m1] = reservaForm.hora_inicio.split(":").map(Number)
    const [h2, m2] = reservaForm.hora_fin.split(":").map(Number)
    const hours = (h2 + m2 / 60) - (h1 + m1 / 60)
    return hours > 0 ? (hours * pkg.precio_por_hora) : 0
  }

  const precioActual = calcularPrecio()

  const handleSavePaquete = async () => {
    try {
      if (paqueteForm.id) {
        await podcastService.updatePaquete(paqueteForm.id, paqueteForm)
        toast.success("Paquete actualizado")
      } else {
        await podcastService.createPaquete(paqueteForm)
        toast.success("Paquete creado")
      }
      setPaqueteModalOpen(false)
      loadPaquetes()
    } catch {
      toast.error("Error al guardar paquete")
    }
  }

  const handleDeletePaquete = (id: string, name: string) => {
    setDeleteConfirm({ type: "paquete", id, name })
  }

  const confirmDeletePaquete = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "paquete") return
    setDeletingItem(true)
    try {
      await podcastService.deletePaquete(deleteConfirm.id)
      toast.success("Paquete eliminado")
      if (selectedPaquete?.id === deleteConfirm.id) setSelectedPaquete(null)
      setDeleteConfirm(null)
      loadPaquetes()
    } catch {
      toast.error("Error al eliminar paquete")
    } finally {
      setDeletingItem(false)
    }
  }

  const addItemToForm = () => {
    if (!nuevoItemNombre.trim()) return
    setPaqueteForm({
      ...paqueteForm,
      items: [...(paqueteForm.items || []), { id: crypto.randomUUID(), nombre: nuevoItemNombre.trim(), incluido: true }],
    })
    setNuevoItemNombre("")
  }

  const removeItemFromForm = (itemId: string) => {
    setPaqueteForm({
      ...paqueteForm,
      items: (paqueteForm.items || []).filter(i => i.id !== itemId),
    })
  }

  const handleSaveReserva = async () => {
    try {
      if (!reservaForm.paquete_id) {
        toast.error("Debe seleccionar un paquete")
        return
      }

      const payload: Record<string, unknown> = {
        ...reservaForm,
        precio_total: precioActual,
        estado: "pendiente",
        asignaciones: asignaciones.map(a => ({ persona_id: a.persona_id, rol: a.rol || null })),
      }

      if (tipoResponsable === "interno") {
        if (!selectedPersonaId) {
          toast.error("Debe seleccionar un responsable interno")
          return
        }
        payload.persona_id = selectedPersonaId
        payload.cliente_externo_id = null
      } else {
        if (!selectedClienteId) {
          toast.error("Debe seleccionar o registrar un cliente")
          return
        }
        payload.cliente_externo_id = selectedClienteId
        payload.persona_id = null
      }

      delete payload.paquete

      if (editingReservaId) {
        await podcastService.updateReserva(editingReservaId, payload)
        toast.success("Reserva actualizada")
      } else {
        await podcastService.createReserva(payload)
        toast.success("Reserva creada")
      }

      setReservaModalOpen(false)
      setEditingReservaId(null)
      setCreandoCliente(false)
      setSelectedClienteId("")
      setSelectedPersonaId("")
      setTipoResponsable("externo")
      setAsignaciones([])
      loadReservas()
    } catch (_error: unknown) {
      const err = _error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg = err?.response?.data?.message
      const details = err?.response?.data?.errors
      if (msg) {
        toast.error(msg)
        if (details) Object.entries(details).forEach(([, msgs]) => msgs.forEach(m => toast.error(m)))
      } else {
        toast.error("Error al guardar reserva")
      }
    }
  }

  const handleDeleteReserva = (id: string, name: string) => {
    setDeleteConfirm({ type: "reserva", id, name })
  }

  const confirmDeleteReserva = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "reserva") return
    setDeletingItem(true)
    try {
      await podcastService.deleteReserva(deleteConfirm.id)
      toast.success("Reserva anulada")
      setDeleteConfirm(null)
      loadReservas()
    } catch {
      toast.error("Error al anular reserva")
    } finally {
      setDeletingItem(false)
    }
  }

  const handleRegistrarPago = async (id: string) => {
    try {
      await podcastService.registrarPago(id)
      toast.success("Pago registrado")
      loadReservas()
    } catch {
      toast.error("Error al registrar pago")
    }
  }

  const openEditReserva = (r: ReservaPodcast) => {
    setReservaForm({
      paquete_id: r.paquete_id,
      fecha_reserva: r.fecha_reserva,
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin,
      precio_total: r.precio_total,
      notas: r.notas,
    })
    setEditingReservaId(r.id)
    setSelectedClienteId(r.cliente_externo_id || "")
    setSelectedPersonaId(r.persona_id || "")
    setTipoResponsable(r.persona_id ? "interno" : "externo")
    setAsignaciones(
      (r.asignaciones || []).map(a => ({
        persona_id: a.persona_id,
        rol: a.rol || "",
        persona: a.persona ? { nombres: a.persona.nombres, apellidos: a.persona.apellidos } : undefined,
      }))
    )
    setCreandoCliente(false)
    setReservaModalOpen(true)
  }

  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Servicios
              <span className="size-1 rounded-full bg-current opacity-50" />
              Producción
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Reservas de Podcast
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPaqueteForm({ nombre: "", descripcion: "", precio_por_hora: 0, items: [], activo: true }); setPaqueteModalOpen(true) }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-black/5 hover:bg-black/10 transition-all active:scale-[0.97]"
              style={{ color: COLORS.CHARCOAL }}
            >
              <Plus size={16} />
              Nuevo Paquete
            </button>
            <button
              onClick={() => {
                setReservaForm({
                  paquete_id: "",
                  fecha_reserva: fmtDate(new Date()),
                  hora_inicio: "08:00", hora_fin: "10:00",
                  precio_total: 0,
                })
                setEditingReservaId(null)
                setCreandoCliente(false)
                setSelectedClienteId("")
                setSelectedPersonaId("")
                setTipoResponsable("externo")
                setAsignaciones([])
                setReservaModalOpen(true)
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-violet-500/20"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={18} strokeWidth={2.5} color="white" />
              Nueva Reserva
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-6">
        <section className="shrink-0 flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12 animate-pulse font-medium opacity-30">
              Cargando paquetes...
            </div>
          ) : paquetes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed text-center space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <HugeiconsIcon icon={InformationCircleIcon} className="size-12 opacity-20" style={{ color: COLORS.CHARCOAL }} />
              <p className="text-sm font-bold opacity-30" style={{ color: COLORS.CHARCOAL }}>No hay paquetes configurados aún.</p>
              <button
                onClick={() => { setPaqueteForm({ nombre: "", descripcion: "", precio_por_hora: 0, items: [], activo: true }); setPaqueteModalOpen(true) }}
                className="px-5 py-3 rounded-2xl text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Plus size={14} className="inline mr-1" /> Crear Paquete
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {paquetes.map((pkg, index) => {
                const isSelected = selectedPaquete?.id === pkg.id
                return (
                  <motion.div
                    key={pkg.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                    className={cn(
                      "relative p-5 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer group flex-shrink-0 w-[280px]",
                      isSelected
                        ? "bg-white shadow-2xl shadow-black/5 scale-[1.02]"
                        : "bg-white/40 hover:bg-white hover:border-black/10"
                    )}
                    style={{
                      borderColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                    }}
                    onClick={() => setSelectedPaquete(pkg)}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-pkg-glow"
                        className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-5 pointer-events-none rounded-full"
                        style={{ backgroundColor: COLORS.ACCENT }}
                      />
                    )}

                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h3 className="text-base font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>{pkg.nombre}</h3>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("size-2 rounded-full", pkg.activo ? "bg-emerald-500" : "bg-gray-300")} />
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                            {pkg.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPaqueteForm(pkg); setPaqueteModalOpen(true) }}
                          className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                          style={{ color: COLORS.CHARCOAL }}
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePaquete(pkg.id, pkg.nombre) }}
                          className="size-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <div className="size-7 rounded-lg bg-violet-100 flex items-center justify-center">
                          <HugeiconsIcon icon={Money01Icon} size={12} style={{ color: COLORS.ACCENT }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Tarifa</span>
                          <span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>${pkg.precio_por_hora}/hr</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-7 rounded-lg bg-amber-100 flex items-center justify-center">
                          <HugeiconsIcon icon={PackageIcon} size={12} className="text-amber-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Items</span>
                          <span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>{pkg.items?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {pkg.descripcion && (
                      <p className="mt-3 pt-3 border-t border-black/5 text-[9px] font-medium opacity-40 truncate leading-tight">{pkg.descripcion}</p>
                    )}

                    {pkg.items && pkg.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-black/5 space-y-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Incluye:</span>
                        <div className="flex flex-wrap gap-1">
                          {pkg.items.filter(i => i.incluido).slice(0, 4).map(item => (
                            <span key={item.id} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium truncate max-w-[100px]">
                              {item.nombre}
                            </span>
                          ))}
                          {pkg.items.filter(i => i.incluido).length > 4 && (
                            <span className="text-[9px] opacity-40">+{pkg.items.filter(i => i.incluido).length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </section>

        <main className="flex-1 bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="shrink-0 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
                {(["reservas", "calendario"] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setModoVista(k)}
                    className={cn(
                      "px-4 py-2 rounded-[10px] text-xs font-bold transition-all",
                      modoVista === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                    )}
                  >
                    {k === "reservas" ? "Reservas" : "Calendario"}
                  </button>
                ))}
              </div>

              {modoVista === "calendario" && (
                <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl ml-2">
                  {([
                    { k: "semanal", label: "Sem", icon: Calendar03Icon },
                    { k: "lista", label: "Lista", icon: MatrixIcon },
                  ] as const).map(({ k, label, icon }) => (
                    <button
                      key={k}
                      onClick={() => setVistaSub(k)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 rounded-[10px] text-[10px] font-bold transition-all",
                        vistaSub === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                      )}
                    >
                      <HugeiconsIcon icon={icon} size={12} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {modoVista === "calendario" && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() - 7); setFechaRef(d) }} className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                    <HugeiconsIcon icon={ArrowLeft02Icon} size={14} className="opacity-50" />
                  </button>
                  <span className="text-[11px] font-bold opacity-60 min-w-[120px] text-center">
                    {genMonday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – {genSunday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() + 7); setFechaRef(d) }} className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} className="opacity-50" />
                  </button>
                </div>
              )}
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 rounded-xl border bg-gray-50 text-[10px] font-medium outline-none"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <AnimatePresence mode="wait">
              {modoVista === "reservas" ? (
                <ReservasTable
                  key="reservas-table"
                  reservas={reservas}
                  onEdit={openEditReserva}
                  onDelete={handleDeleteReserva}
                  onRegistrarPago={handleRegistrarPago}
                  onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                />
              ) : vistaSub === "lista" ? (
                <ReservasTable
                  key="cal-list"
                  reservas={reservas}
                  onEdit={openEditReserva}
                  onDelete={handleDeleteReserva}
                  onRegistrarPago={handleRegistrarPago}
                  onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                />
              ) : (
                <SemanalView
                  key="cal-week"
                  weekDays={genWeekDays}
                  horas={hours}
                  reservas={reservas}
                  onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {paqueteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPaqueteModalOpen(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-7 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                    <HugeiconsIcon icon={PackageIcon} size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                      {paqueteForm.id ? "Editar Paquete" : "Nuevo Paquete"}
                    </h2>
                    <p className="text-xs font-medium opacity-40 mt-0.5">Configuración de paquete de podcast</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPaqueteForm({ ...paqueteForm, activo: !paqueteForm.activo })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider border-2 transition-all",
                      paqueteForm.activo
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                  >
                    <div className={cn("size-2 rounded-full", paqueteForm.activo ? "bg-emerald-500" : "bg-gray-300")} />
                    {paqueteForm.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button onClick={() => setPaqueteModalOpen(false)} className="size-10 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">

                {/* ─── INFORMACIÓN DEL PAQUETE ─── */}
                <div className="rounded-2xl border-2 bg-gradient-to-br from-violet-50/80 to-white overflow-hidden" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
                  <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(139, 92, 246, 0.1)" }}>
                    <div className="size-7 rounded-lg bg-violet-200/60 flex items-center justify-center">
                      <HugeiconsIcon icon={PackageIcon} size={14} style={{ color: "#7c3aed" }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-700/70">Información del Paquete</span>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Nombre del Paquete</label>
                      <input
                        type="text"
                        value={paqueteForm.nombre}
                        onChange={e => setPaqueteForm({ ...paqueteForm, nombre: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border-2 bg-white text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-violet-500/10"
                        style={{ borderColor: paqueteForm.nombre ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}
                        placeholder="Ej. Podcast Básico"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                          <HugeiconsIcon icon={Money01Icon} size={10} className="inline mr-1" />Precio por Hora
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30">$</span>
                          <input
                            type="number"
                            value={paqueteForm.precio_por_hora}
                            onChange={e => setPaqueteForm({ ...paqueteForm, precio_por_hora: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                          <HugeiconsIcon icon={InformationCircleIcon} size={10} className="inline mr-1" />Estado
                        </label>
                        <button
                          onClick={() => setPaqueteForm({ ...paqueteForm, activo: !paqueteForm.activo })}
                          className={cn(
                            "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all",
                            paqueteForm.activo
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-gray-50 border-gray-200 text-gray-400"
                          )}
                        >
                          <div className={cn("size-3 rounded-full", paqueteForm.activo ? "bg-emerald-500" : "bg-gray-300")} />
                          {paqueteForm.activo ? "Paquete Activo" : "Paquete Inactivo"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Descripción</label>
                      <textarea
                        value={paqueteForm.descripcion}
                        onChange={e => setPaqueteForm({ ...paqueteForm, descripcion: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border-2 bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 resize-none transition-all"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        rows={3}
                        placeholder="Describe lo que incluye este paquete..."
                      />
                    </div>
                  </div>
                </div>

                {/* ─── ÍTEMS INCLUIDOS ─── */}
                <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "rgba(5, 150, 105, 0.15)" }}>
                  <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(5, 150, 105, 0.1)", backgroundColor: "rgba(5, 150, 105, 0.03)" }}>
                    <div className="size-7 rounded-lg bg-emerald-200/60 flex items-center justify-center">
                      <HugeiconsIcon icon={Tick02Icon} size={14} style={{ color: "#059669" }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700/70">Ítems Incluidos</span>
                    <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
                      {(paqueteForm.items || []).length} ítem{(paqueteForm.items || []).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    {(paqueteForm.items || []).length > 0 && (
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                        {(paqueteForm.items || []).map(item => (
                          <div key={item.id} className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-100 transition-all hover:border-emerald-200">
                            <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={Tick02Icon} size={10} className="text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium flex-1" style={{ color: COLORS.CHARCOAL }}>{item.nombre}</span>
                            <button onClick={() => removeItemFromForm(item.id)} className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-full hover:bg-red-100 transition-all">
                              <Trash2 size={11} className="text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={nuevoItemNombre}
                        onChange={e => setNuevoItemNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItemToForm() } }}
                        className="flex-1 px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        placeholder="Nuevo ítem..."
                      />
                      <button
                        onClick={addItemToForm}
                        disabled={!nuevoItemNombre.trim()}
                        className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-gray-50/80 border-t flex justify-between items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="text-[10px] font-medium opacity-40">
                  {(paqueteForm.precio_por_hora ?? 0) > 0 && `$ ${(paqueteForm.precio_por_hora ?? 0).toFixed(2)} / hora`}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaqueteModalOpen(false)}
                    className="px-6 py-3 rounded-xl bg-black/5 text-sm font-semibold text-charcoal/60 hover:bg-black/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePaquete}
                    disabled={!paqueteForm.nombre?.trim()}
                    className="px-10 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-violet-500/20 active:scale-[0.97] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    {paqueteForm.id ? "Actualizar Paquete" : "Crear Paquete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reservaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReservaModalOpen(false)}
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
                      {editingReservaId ? "Editar Reserva" : "Nueva Reserva"}
                    </h2>
                    <p className="text-xs font-medium opacity-40 mt-0.5">Reserva de estudio de podcast</p>
                  </div>
                </div>
                <button onClick={() => setReservaModalOpen(false)} className="size-10 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-7 max-h-[68vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">

                {/* ─── PAQUETE Y HORARIO ─── */}
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

                    {/* Price summary inline */}
                    {reservaForm.paquete_id && precioActual > 0 && (
                      <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 text-white">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center">
                            <HugeiconsIcon icon={Money01Icon} size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Precio estimado</p>
                            <p className="text-sm font-medium opacity-90 flex items-center gap-1.5">
                              <span className="truncate max-w-[180px]">{paquetes.find(p => p.id === reservaForm.paquete_id)?.nombre || "Sin paquete"}</span>
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

                {/* ─── CLIENTE RESPONSABLE ─── */}
                <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.15)" : "rgba(99, 102, 241, 0.15)" }}>
                  <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.1)" : "rgba(99, 102, 241, 0.1)", backgroundColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.03)" : "rgba(99, 102, 241, 0.03)" }}>
                    <div className={cn("size-7 rounded-lg flex items-center justify-center", tipoResponsable === "externo" ? "bg-emerald-200/60" : "bg-indigo-200/60")}>
                      <HugeiconsIcon icon={UserIcon} size={14} style={{ color: tipoResponsable === "externo" ? "#059669" : "#6366f1" }} />
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-[0.15em]", tipoResponsable === "externo" ? "text-emerald-700/70" : "text-indigo-700/70")}>Cliente Responsable</span>

                    <div className="ml-auto flex p-0.5 rounded-lg" style={{ backgroundColor: tipoResponsable === "externo" ? "rgba(5, 150, 105, 0.08)" : "rgba(99, 102, 241, 0.08)" }}>
                      {[
                        { key: "externo", label: "Externo" },
                        { key: "interno", label: "Interno" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setTipoResponsable(key as "externo" | "interno"); setCreandoCliente(false) }}
                          className={cn(
                            "px-3 py-1.5 rounded-[6px] text-[9px] font-bold uppercase tracking-wider transition-all",
                            tipoResponsable === key
                              ? "bg-white text-charcoal shadow-sm"
                              : "text-charcoal/40 hover:text-charcoal/60"
                          )}
                        >
                          {label}
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
                                (key === "new") === creandoCliente
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-transparent text-charcoal/40 hover:bg-white/50"
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
                              <input
                                type="text"
                                value={clienteSearch}
                                onChange={e => setClienteSearch(e.target.value)}
                                placeholder="Buscar por nombre, cédula..."
                                className="w-full pl-9 pr-4 py-3 rounded-xl border bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/15 transition-all"
                                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                              />
                            </div>
                            <div className="max-h-[150px] overflow-y-auto rounded-xl border bg-white divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                              {loadingClientes ? (
                                <div className="p-4 text-center text-xs opacity-40 animate-pulse">Buscando...</div>
                              ) : clientes.length === 0 ? (
                                <div className="p-4 text-center text-xs opacity-40">No se encontraron clientes. Puedes registrar uno nuevo.</div>
                              ) : (
                                clientes.map(c => {
                                  const selected = selectedClienteId === c.id
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => { setSelectedClienteId(c.id); setClienteSearch("") }}
                                      className={cn(
                                        "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3",
                                        selected && "bg-emerald-50/60"
                                      )}
                                    >
                                      <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-emerald-100" : "bg-gray-100")}>
                                        <HugeiconsIcon icon={UserIcon} size={14} style={{ color: selected ? "#059669" : undefined }} className={cn(!selected && "opacity-40")} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className={cn("text-xs font-bold truncate", selected ? "text-emerald-700" : "")} style={{ color: selected ? undefined : COLORS.CHARCOAL }}>{c.nombres} {c.apellidos}</p>
                                        {c.cedula && <p className="text-[9px] opacity-40 truncate">C.I. {c.cedula}</p>}
                                      </div>
                                      {selected && (
                                        <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <HugeiconsIcon icon={Tick02Icon} size={12} className="text-emerald-600" />
                                        </div>
                                      )}
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
                          <input
                            type="text"
                            value={staffSearch}
                            onChange={e => setStaffSearch(e.target.value)}
                            placeholder="Buscar personal o alumno..."
                            className="w-full pl-9 pr-4 py-3 rounded-xl border bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                          />
                        </div>
                        <div className="max-h-[150px] overflow-y-auto rounded-xl border bg-white divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          {personas.length === 0 ? (
                            <div className="p-4 text-center text-xs opacity-40 animate-pulse">Cargando personal...</div>
                          ) : (
                            personas
                              .filter(p => !staffSearch || `${p.nombres} ${p.apellidos}`.toLowerCase().includes(staffSearch.toLowerCase()))
                              .map(p => {
                                const selected = selectedPersonaId === p.id
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => { setSelectedPersonaId(p.id); setStaffSearch("") }}
                                    className={cn(
                                      "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3",
                                      selected && "bg-indigo-50/60"
                                    )}
                                  >
                                    <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-indigo-100" : "bg-gray-100")}>
                                      <HugeiconsIcon icon={UserIcon} size={14} style={{ color: selected ? "#6366f1" : undefined }} className={cn(!selected && "opacity-40")} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={cn("text-xs font-bold truncate", selected && "text-indigo-700")} style={{ color: selected ? undefined : COLORS.CHARCOAL }}>{p.nombres} {p.apellidos}</p>
                                    </div>
                                    {selected && (
                                      <div className="size-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <HugeiconsIcon icon={Tick02Icon} size={12} className="text-indigo-600" />
                                      </div>
                                    )}
                                  </button>
                                )
                              })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── PERSONAL A CARGO ─── */}
                <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "rgba(124, 58, 237, 0.15)" }}>
                  <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(124, 58, 237, 0.1)", backgroundColor: "rgba(124, 58, 237, 0.03)" }}>
                    <div className="size-7 rounded-lg bg-purple-200/60 flex items-center justify-center">
                      <Users size={14} style={{ color: "#7c3aed" }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700/70">Personal a cargo</span>
                    {asignaciones.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700">
                        {asignaciones.length} asignado{asignaciones.length !== 1 ? "s" : ""}
                      </span>
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
                              <input
                                type="text"
                                value={a.rol}
                                onChange={e => {
                                  const next = [...asignaciones]
                                  next[i] = { ...next[i], rol: e.target.value }
                                  setAsignaciones(next)
                                }}
                                placeholder="Rol"
                                className="w-20 bg-transparent text-[10px] font-medium text-purple-600 outline-none placeholder:text-purple-300"
                              />
                              <button onClick={() => setAsignaciones(prev => prev.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 size-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-all">
                                <X size={10} className="text-red-400" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <HugeiconsIcon icon={SearchIcon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                        <input
                          type="text"
                          value={asignacionStaffSearch}
                          onChange={e => setAsignacionStaffSearch(e.target.value)}
                          placeholder="Buscar personal para asignar..."
                          className="w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        />
                      </div>
                    </div>

                    {asignacionStaffSearch && (
                      <div className="max-h-[140px] overflow-y-auto rounded-xl border-2 bg-white divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {(() => {
                          const filtered = personas.filter(p =>
                            !asignaciones.some(a => a.persona_id === p.id) &&
                            `${p.nombres} ${p.apellidos}`.toLowerCase().includes(asignacionStaffSearch.toLowerCase())
                          )
                          return filtered.length > 0 ? (
                            filtered.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setAsignaciones(prev => [...prev, { persona_id: p.id, rol: "", persona: { nombres: p.nombres, apellidos: p.apellidos } }])
                                  setAsignacionStaffSearch("")
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50/60 transition-colors flex items-center gap-3"
                              >
                                <div className="size-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                  <HugeiconsIcon icon={UserIcon} size={14} style={{ color: "#7c3aed" }} />
                                </div>
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

                {/* ─── NOTAS ─── */}
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
                  {precioActual > 0 && `${reservaForm.hora_inicio && reservaForm.hora_fin ? `${(() => { const [h1, m1]=reservaForm.hora_inicio.split(":").map(Number); const [h2, m2]=reservaForm.hora_fin.split(":").map(Number); return ((h2+m2/60)-(h1+m1/60)).toFixed(1) })()} hrs` : ""}`}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setReservaModalOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-semibold text-charcoal/60 hover:bg-black/10 transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleSaveReserva} className="px-10 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-violet-500/20 active:scale-[0.97] hover:opacity-90" style={{ backgroundColor: COLORS.ACCENT }}>
                    {editingReservaId ? "Actualizar" : "Confirmar Reserva"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detalleOpen && detalleReserva && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetalleOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Detalle de Reserva</h2>
                  <p className="text-xs font-medium opacity-40 mt-0.5">Información completa de la reserva</p>
                </div>
                <button onClick={() => setDetalleOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                {detalleReserva.paquete && (
                  <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <HugeiconsIcon icon={Microphone} size={22} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.paquete.nombre}</p>
                      <p className="text-[10px] font-medium opacity-50">${detalleReserva.paquete.precio_por_hora}/hr · {detalleReserva.paquete.items?.length || 0} ítems</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha</p>
                    <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(detalleReserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Horario</p>
                    <p className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}><HugeiconsIcon icon={Clock01Icon} size={14} className="opacity-40" />{fmtHora(detalleReserva.hora_inicio)} — {fmtHora(detalleReserva.hora_fin)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Tipo</p>
                    <div className="flex items-center gap-2">
                      {detalleReserva.persona_id ? (
                        <><HugeiconsIcon icon={UserIcon} size={16} className="text-indigo-500" /><span className="text-sm font-bold text-indigo-600">Uso Interno</span></>
                      ) : (
                        <><HugeiconsIcon icon={Money01Icon} size={16} className="text-emerald-500" /><span className="text-sm font-bold text-emerald-600">Cliente Externo</span></>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio</p>
                    <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>${Number(detalleReserva.precio_total).toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estado</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-block px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border", ESTADO_LABELS[detalleReserva.estado]?.color || "bg-gray-100")}>
                      {ESTADO_LABELS[detalleReserva.estado]?.label || detalleReserva.estado}
                    </span>
                    {detalleReserva.pago_registrado && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                        <HugeiconsIcon icon={Tick02Icon} size={10} /> Pagado
                      </span>
                    )}
                  </div>
                </div>
                {detalleReserva.notas && (
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Notas</p>
                    <p className="text-xs font-medium" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.notas}</p>
                  </div>
                )}
                <div className="p-4 rounded-2xl bg-gray-50 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Responsable</p>
                  {detalleReserva.persona ? (
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-indigo-600" /></div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.persona.nombres} {detalleReserva.persona.apellidos}</p>
                        {detalleReserva.persona.correo && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={10} />{detalleReserva.persona.correo}</p>}
                      </div>
                    </div>
                  ) : detalleReserva.cliente_externo ? (
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-emerald-600" /></div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.cliente_externo.nombres} {detalleReserva.cliente_externo.apellidos}</p>
                        <div className="flex flex-wrap gap-x-3">
                          {detalleReserva.cliente_externo.cedula && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={IdentificationIcon} size={10} />{detalleReserva.cliente_externo.cedula}</p>}
                          {detalleReserva.cliente_externo.correo && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={10} />{detalleReserva.cliente_externo.correo}</p>}
                          {detalleReserva.cliente_externo.celular && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={CallIcon} size={10} />{detalleReserva.cliente_externo.celular}</p>}
                        </div>
                      </div>
                    </div>
                  ) : <p className="text-xs opacity-30 italic">No especificado</p>}

                  {detalleReserva.asignaciones && detalleReserva.asignaciones.length > 0 && (
                    <div className="pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-2">Personal a cargo</p>
                      <div className="flex flex-wrap gap-2">
                        {detalleReserva.asignaciones.map(a => (
                          <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200">
                            <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                              {a.persona ? `${a.persona.nombres[0]}${a.persona.apellidos[0]}` : "?"}
                            </div>
                            <span className="text-[11px] font-bold text-violet-700">{a.persona?.nombres} {a.persona?.apellidos}</span>
                            {a.rol && <span className="text-[9px] font-medium text-violet-400 bg-violet-100/50 px-1.5 py-0.5 rounded">{a.rol}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-5 bg-gray-50 border-t flex justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setDetalleOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === "paquete" ? "Eliminar Paquete" : "Anular Reserva"}
        message={
          deleteConfirm?.type === "paquete"
            ? `¿Eliminar el paquete "${deleteConfirm?.name}"?`
            : `¿Anular la reserva de "${deleteConfirm?.name}"?`
        }
        confirmText={deleteConfirm?.type === "paquete" ? "Eliminar" : "Anular"}
        cancelText="Cancelar"
        isDangerous={true}
        isLoading={deletingItem}
        icon="trash"
        onConfirm={deleteConfirm?.type === "paquete" ? confirmDeletePaquete : confirmDeleteReserva}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

function ReservasTable({ reservas, onEdit, onDelete, onRegistrarPago, onSelect }: {
  reservas: ReservaPodcast[]
  onEdit: (r: ReservaPodcast) => void
  onDelete: (id: string, name: string) => void
  onRegistrarPago: (id: string) => void
  onSelect: (r: ReservaPodcast) => void
}) {
  const today = fmtDate(new Date())
  return (
    <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80">
                {["Fecha", "Hora", "Paquete", "Cliente", "Encargado", "Estado", "Pago", "Total", ""].map(h => (
                  <th key={h} className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 border-r last:border-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {reservas.length === 0 ? (
                <tr><td colSpan={9} className="p-12 text-center text-xs opacity-40">No hay reservas registradas</td></tr>
              ) : (
                reservas.map(r => {
                  const isToday = r.fecha_reserva === today
                  const vencido = new Date(r.fecha_reserva + "T" + (r.hora_fin || "23:59")) < new Date() && r.estado !== "completado" && r.estado !== "cancelado"
                  return (
                    <tr key={r.id} onClick={() => onSelect(r)} className={cn("cursor-pointer hover:bg-gray-50/80", isToday && "bg-amber-50/40")}>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <div className="flex items-center gap-2">
                          {isToday && <div className="size-1.5 rounded-full bg-amber-400" />}
                          {vencido && <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />}
                          <span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                            {new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-r text-xs font-mono opacity-60" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}</td>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span className="text-xs font-bold truncate max-w-[120px]" style={{ color: COLORS.CHARCOAL }}>{r.paquete?.nombre || "—"}</span>
                      </td>
                      <td className="p-3 border-r text-xs font-medium opacity-60 max-w-[100px] truncate" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {r.cliente_externo ? `${r.cliente_externo.nombres} ${r.cliente_externo.apellidos || ""}`.trim() : "—"}
                      </td>
                      <td className="p-3 border-r text-xs font-medium opacity-60 max-w-[100px] truncate" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : "—"}
                      </td>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_LABELS[r.estado]?.color || "bg-gray-100")}>
                          {ESTADO_LABELS[r.estado]?.label || r.estado}
                        </span>
                      </td>
                      <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {r.pago_registrado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-green-100 text-green-700"><HugeiconsIcon icon={Tick02Icon} size={10} /> Pagado</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onRegistrarPago(r.id) }}
                            className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                          >Pendiente</button>
                        )}
                      </td>
                      <td className="p-3 border-r text-xs font-bold text-right" style={{ borderColor: COLORS.BORDER_SUBTLE }}>${Number(r.precio_total).toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); onEdit(r) }} className="size-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10" title="Editar"><HugeiconsIcon icon={Edit01Icon} size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(r.id, r.paquete?.nombre || r.fecha_reserva) }} className="size-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100" title="Eliminar"><Trash2 size={12} className="text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

function SemanalView({ weekDays, horas, reservas, onSelect }: {
  weekDays: Date[]
  horas: number[]
  reservas: ReservaPodcast[]
  onSelect: (r: ReservaPodcast) => void
}) {
  const today = new Date()
  return (
    <motion.div key="sw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="grid grid-cols-8 border-b bg-gradient-to-b from-gray-50 to-gray-100/80" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="p-2.5 text-center border-r flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Hora</span>
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div key={i} className={cn("p-2.5 text-center border-r last:border-0 relative", isToday && "bg-amber-50/80")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {isToday && <div className="absolute -top-px left-1 right-1 h-[3px] bg-amber-400 rounded-b-full" />}
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-0.5">{day.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                <div className={cn("text-base font-bold", isToday && "text-amber-600")} style={{ color: isToday ? undefined : COLORS.CHARCOAL }}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>
        <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {horas.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[50px]">
              <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const r = reservas.find(rr => rr.fecha_reserva === dateStr && hour >= parseInt(rr.hora_inicio.split(":")[0]) && hour < parseInt(rr.hora_fin.split(":")[0]))
                const first = r && hour === parseInt(r.hora_inicio.split(":")[0])
                return (
                  <div key={di} className={cn("p-0.5 border-r last:border-0 relative", isPast && "bg-gray-100/40")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {first && (
                      <button
                        onClick={() => onSelect(r)}
                        className={cn(
                          "w-full rounded-xl p-1.5 text-left hover:brightness-110 cursor-pointer border",
                          r.persona_id ? "bg-indigo-50 border-indigo-200" : "bg-emerald-50 border-emerald-200"
                        )}
                        style={{ height: `${Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0])) * 50 - 6}px` }}
                      >
                        <p className={cn("text-[9px] font-bold leading-tight truncate", r.persona_id ? "text-indigo-600" : "text-emerald-600")}>
                          {fmtHora(r.hora_inicio)}–{fmtHora(r.hora_fin)}
                        </p>
                        <p className="text-[8px] font-medium opacity-50 truncate">{r.paquete?.nombre}</p>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
