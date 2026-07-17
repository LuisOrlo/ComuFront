import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useLocation, Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Search01Icon, Tick02Icon,
  Cancel01Icon, UserIcon, Microphone,
  Calendar03Icon, Clock01Icon, Money01Icon,
  Note03Icon, AlertCircleIcon, UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2, X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  podcastService,
  type PaquetePodcast,
} from "@/services/podcast.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

interface ClienteOption {
  tipo: "persona" | "cliente_externo"
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  personaTipo?: string
}

interface Asignacion {
  persona_id: string
  rol: string
  persona?: { nombres: string; apellidos: string }
}

function SectionHeader({ icon, title, color = "violet" }: { icon: typeof ArrowLeft01Icon; title: string; color?: string }) {
  const colors: Record<string, { bg: string; icon: string }> = {
    violet: { bg: "oklch(0.92 0.03 270)", icon: "#7c3aed" },
    emerald: { bg: "oklch(0.92 0.04 160)", icon: "#059669" },
    amber: { bg: "oklch(0.92 0.04 90)", icon: "#d97706" },
    purple: { bg: "oklch(0.9 0.04 290)", icon: "#9333ea" },
  }
  const c = colors[color] || colors.violet
  return (
    <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
      <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg, color: c.icon }}>
        <HugeiconsIcon icon={icon} size={14} />
      </span>
      {title}
    </h2>
  )
}

export function NuevaReservaPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [paqueteId, setPaqueteId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [horaFin, setHoraFin] = useState("10:00")
  const [titulo, setTitulo] = useState("")
  const [notas, setNotas] = useState("")
  const [saving, setSaving] = useState(false)
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loadingPaquetes, setLoadingPaquetes] = useState(true)

  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [personas, setPersonas] = useState<Persona[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [asignacionStaffSearch, setAsignacionStaffSearch] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const personasEnLista = useMemo(() => clientesDisponibles.filter(c => c.tipo === "persona"), [clientesDisponibles])
  const externosEnLista = useMemo(() => clientesDisponibles.filter(c => c.tipo === "cliente_externo"), [clientesDisponibles])

  useEffect(() => {
    podcastService.getPaquetes()
      .then(data => { setPaquetes(data); setPaqueteId(data[0]?.id || "") })
      .catch(() => toast.error("Error al cargar paquetes"))
      .finally(() => setLoadingPaquetes(false))
  }, [])

  useEffect(() => {
    personasService.getPersonas({ page: 1 })
      .then(res => setPersonas(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setSearchingCliente(true)
      Promise.allSettled([
        personasService.getPersonas({ buscar: clienteSearch || undefined, tipo: "estudiante,instructor", page: 1 }),
        clientesService.getClientes({ search: clienteSearch || undefined, per_page: 50 }),
      ]).then(([personasRes, clientesRes]) => {
        if (controller.signal.aborted) return
        const results: ClienteOption[] = []
        if (personasRes.status === "fulfilled") {
          for (const p of personasRes.value.data) {
            results.push({ tipo: "persona", id: p.id, nombres: p.nombres, apellidos: p.apellidos, cedula: p.cedula, correo: p.correo, personaTipo: p.tipo })
          }
        }
        if (clientesRes.status === "fulfilled") {
          const data = (clientesRes.value as { data: ClienteExterno[] }).data || (clientesRes.value as ClienteExterno[])
          for (const c of (Array.isArray(data) ? data : [])) {
            if (results.some(r => r.tipo === "cliente_externo" && r.id === c.id)) continue
            results.push({ tipo: "cliente_externo", id: c.id, nombres: c.nombres, apellidos: c.apellidos || "", cedula: c.cedula, correo: c.correo })
          }
        }
        setClientesDisponibles(results)
      }).catch(() => {
        if (!controller.signal.aborted) setClientesDisponibles([])
      }).finally(() => {
        if (!controller.signal.aborted) setSearchingCliente(false)
      })
    }, 300)
    return () => { clearTimeout(timer); if (abortRef.current) abortRef.current.abort() }
  }, [clienteSearch])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const state = location.state as { nuevoCliente?: ClienteExterno } | null
    if (state?.nuevoCliente && !clienteId) {
      const c = state.nuevoCliente
      setClienteId(c.id)
      setClienteTipo("cliente_externo")
      setSelectedCliente({ tipo: "cliente_externo", id: c.id, nombres: c.nombres, apellidos: c.apellidos || "", cedula: c.cedula })
      setClienteSearch(`${c.nombres} ${c.apellidos || ""}`.trim())
      window.history.replaceState({}, "")
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [location.state, clienteId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node))
        setShowClienteDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectCliente = (opt: ClienteOption) => {
    setClienteId(opt.id)
    setClienteTipo(opt.tipo)
    setSelectedCliente(opt)
    setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
    setShowClienteDropdown(false)
    setErrors(prev => { const n = { ...prev }; delete n.cliente; return n })
  }

  const clearCliente = () => {
    setClienteId("")
    setClienteTipo("")
    setSelectedCliente(null)
    setClienteSearch("")
    setClientesDisponibles([])
  }

  const paqueteSeleccionado = useMemo(() => paquetes.find(p => p.id === paqueteId), [paqueteId, paquetes])

  const calcularHoras = () => {
    if (!horaInicio || !horaFin) return 0
    const [h1, m1] = horaInicio.split(":").map(Number)
    const [h2, m2] = horaFin.split(":").map(Number)
    return ((h2 + m2 / 60) - (h1 + m1 / 60))
  }

  const horas = calcularHoras()
  const precioTotal = paqueteSeleccionado && horas > 0 ? Math.round(horas * paqueteSeleccionado.precio_por_hora * 100) / 100 : 0

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!paqueteId) newErrors.paquete = "Debe seleccionar un paquete"
    if (!fecha) newErrors.fecha = "La fecha es obligatoria"
    if (!horaInicio) newErrors.horaInicio = "La hora de inicio es obligatoria"
    if (!horaFin) newErrors.horaFin = "La hora de fin es obligatoria"
    if (horaInicio && horaFin && calcularHoras() <= 0) newErrors.horaFin = "Debe ser posterior a la hora de inicio"
    if (!clienteId) newErrors.cliente = "Debe seleccionar un cliente"
    setErrors(newErrors)
    setTouched({ paquete: true, fecha: true, horaInicio: true, horaFin: true, cliente: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        paquete_id: paqueteId,
        fecha_reserva: fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        titulo: titulo.trim() || undefined,
        notas: notas.trim() || undefined,
        precio_total: precioTotal,
        estado: "pendiente",
        asignaciones: asignaciones.map(a => ({ persona_id: a.persona_id, rol: a.rol || null })),
      }
      if (clienteTipo === "persona") {
        payload.persona_id = clienteId
        payload.cliente_externo_id = null
      } else {
        payload.persona_id = null
        payload.cliente_externo_id = clienteId
      }
      await podcastService.createReserva(payload)
      toast.success("Reserva creada exitosamente")
      navigate("/servicios/podcast")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      if (msg?.message) toast.error(msg.message)
      if (msg?.errors) Object.values(msg.errors).flat().forEach(m => toast.error(m))
      else toast.error("Error al guardar la reserva")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (field: string) => {
    const hasErr = touched[field] && errors[field]
    return `w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white ${
      hasErr
        ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        : "border-gray-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
    }`
  }

  const errMsg = (field: string) => {
    if (!touched[field]) return null
    const msg = errors[field]
    return msg ? (
      <p className="flex items-center gap-1.5 text-[11px] mt-1.5 text-red-500 font-medium">
        <HugeiconsIcon icon={AlertCircleIcon} size={11} />
        {msg}
      </p>
    ) : null
  }

  if (loadingPaquetes) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-violet-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-violet-600 border-t-transparent rounded-full" />
          <p className="text-xs font-medium opacity-40">Cargando paquetes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-violet-50/20">
      <header className="shrink-0 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/podcast")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                <HugeiconsIcon icon={Microphone} size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  Nueva Reserva de Podcast
                </h1>
                <p className="text-xs opacity-40 mt-0.5">
                  Registra una nueva reserva en el estudio de podcast
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Sección: Paquete y Horario */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={Microphone} title="Paquete y Horario" color="violet" />

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                  Paquete
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={paqueteId}
                  onChange={e => { setPaqueteId(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.paquete; return n }) }}
                  onBlur={() => setTouched(prev => ({ ...prev, paquete: true }))}
                  className={inputCls("paquete") + " appearance-none"}
                  style={touched.paquete && errors.paquete ? undefined : paqueteId ? { borderColor: COLORS.ACCENT } : undefined}
                >
                  <option value="">Seleccionar paquete...</option>
                  {paquetes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} — ${p.precio_por_hora.toFixed(2)}/hr</option>
                  ))}
                </select>
                {errMsg("paquete")}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Calendar03Icon} size={12} className="opacity-40" />
                    Fecha
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={fecha}
                    onChange={e => { setFecha(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.fecha; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, fecha: true }))}
                    className={inputCls("fecha")} />
                  {errMsg("fecha")}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={12} className="opacity-40" />
                    Entrada
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="time" value={horaInicio}
                    onChange={e => { setHoraInicio(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.horaInicio; delete n.horaFin; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, horaInicio: true }))}
                    className={inputCls("horaInicio")} />
                  {errMsg("horaInicio")}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={12} className="opacity-40" />
                    Salida
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="time" value={horaFin}
                    onChange={e => { setHoraFin(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.horaFin; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, horaFin: true }))}
                    className={inputCls("horaFin")} />
                  {errMsg("horaFin")}
                </div>
              </div>

              {paqueteSeleccionado && precioTotal > 0 && (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <HugeiconsIcon icon={Money01Icon} size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Precio estimado</p>
                      <p className="text-sm font-medium opacity-90 flex items-center gap-1.5">
                        <span className="truncate max-w-[180px]">{paqueteSeleccionado.nombre}</span>
                        <span className="text-white/40">•</span>
                        <span className="shrink-0">${paqueteSeleccionado.precio_por_hora.toFixed(2)}/hr</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{horas.toFixed(1)} hrs</p>
                    <p className="text-3xl font-black tracking-tighter">${precioTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sección: Título */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={Microphone} title="Título del episodio" color="amber" />

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                  Título
                </label>
                <input type="text" value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                  placeholder="Ej: Entrevista con invitado especial..." />
              </div>
            </div>

            {/* Sección: Cliente */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={UserIcon} title="Cliente" color="emerald" />

              <div className="relative" ref={clienteRef}>
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
                    <input type="text"
                      value={clienteSearch}
                      onChange={e => { setClienteSearch(e.target.value); setShowClienteDropdown(true) }}
                      onFocus={() => { if (!clienteId || clienteSearch) setShowClienteDropdown(true) }}
                      placeholder="Buscar persona o cliente por nombre o cédula..."
                      className={cn(
                        "w-full pl-11 pr-10 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white",
                        touched.cliente && errors.cliente
                          ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                          : "border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                      )} />
                    {clienteId && (
                      <button type="button" onClick={clearCliente}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                        <HugeiconsIcon icon={Cancel01Icon} size={15} />
                      </button>
                    )}
                  </div>
                  <Link
                    to={`/clientes/nuevo?returnTo=${encodeURIComponent(location.pathname)}`}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shrink-0 shadow-lg shadow-emerald-500/20"
                    style={{ backgroundColor: "oklch(0.55 0.18 160)" }}>
                    <UserPlus size={16} strokeWidth={2.5} />
                    Nuevo
                  </Link>
                </div>

                <AnimatePresence>
                  {showClienteDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border-2 rounded-2xl shadow-xl max-h-72 overflow-y-auto"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      {searchingCliente ? (
                        <div className="p-5 text-center text-xs opacity-40 flex items-center justify-center gap-2">
                          <div className="animate-spin size-3.5 border-2 border-violet-500 border-t-transparent rounded-full" />
                          Buscando...
                        </div>
                      ) : clientesDisponibles.length === 0 ? (
                        <div className="p-5 text-center text-xs opacity-40">
                          {clienteSearch.trim() ? "Sin resultados para esta búsqueda" : "Escribe para buscar..."}
                        </div>
                      ) : (
                        <>
                          {personasEnLista.length > 0 && (
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest opacity-30">Personas</div>
                          )}
                          {personasEnLista.map(opt => {
                            const sel = clienteId === opt.id && clienteTipo === "persona"
                            return (
                              <button key={`persona-${opt.id}`} type="button"
                                onClick={() => selectCliente(opt)}
                                className={cn(
                                  "w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3",
                                  sel && "bg-violet-50/60"
                                )}
                              >
                                <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 transition-all", sel ? "bg-violet-100 shadow-sm" : "bg-gray-100")}>
                                  <HugeiconsIcon icon={UserIcon} size={13} className={cn(!sel && "opacity-40")} style={{ color: sel ? "#7c3aed" : undefined }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={cn("font-semibold text-sm", sel && "text-violet-700")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>
                                    {opt.nombres} {opt.apellidos}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {opt.cedula && <span className="text-[10px] opacity-40">C.I. {opt.cedula}</span>}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">{opt.personaTipo || "Externo"}</span>
                                  </div>
                                </div>
                                {sel && (
                                  <div className="size-6 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                    <HugeiconsIcon icon={Tick02Icon} size={11} className="text-violet-600" />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                          {externosEnLista.length > 0 && (
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest opacity-30 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Clientes Externos</div>
                          )}
                          {externosEnLista.map(opt => {
                            const sel = clienteId === opt.id && clienteTipo === "cliente_externo"
                            return (
                              <button key={`externo-${opt.id}`} type="button"
                                onClick={() => selectCliente(opt)}
                                className={cn(
                                  "w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3",
                                  sel && "bg-emerald-50/60"
                                )}
                              >
                                <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 transition-all", sel ? "bg-emerald-100 shadow-sm" : "bg-gray-100")}>
                                  <HugeiconsIcon icon={UserIcon} size={13} className={cn(!sel && "opacity-40")} style={{ color: sel ? "#059669" : undefined }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={cn("font-semibold text-sm", sel && "text-emerald-700")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>
                                    {opt.nombres} {opt.apellidos}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {opt.cedula && <span className="text-[10px] opacity-40">C.I. {opt.cedula}</span>}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">Externo</span>
                                  </div>
                                </div>
                                {sel && (
                                  <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <HugeiconsIcon icon={Tick02Icon} size={11} className="text-emerald-600" />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {errMsg("cliente")}

              {selectedCliente && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50/30 border border-emerald-200">
                  <div className="size-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserIcon} size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-800 truncate">
                      {selectedCliente.nombres} {selectedCliente.apellidos}
                    </p>
                    <p className="text-[10px] text-emerald-600/60">
                      {selectedCliente.cedula ? `C.I. ${selectedCliente.cedula}` : selectedCliente.personaTipo ? selectedCliente.personaTipo.charAt(0).toUpperCase() + selectedCliente.personaTipo.slice(1) : "Cliente externo"}
                    </p>
                  </div>
                  <HugeiconsIcon icon={Tick02Icon} size={16} className="text-emerald-500 shrink-0" />
                </div>
              )}
            </div>

            {/* Sección: Personal asignado */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={UserGroupIcon} title="Personal a cargo" color="purple" />

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
                        <input type="text" value={a.rol}
                          onChange={e => { const n = [...asignaciones]; n[i] = { ...n[i], rol: e.target.value }; setAsignaciones(n) }}
                          placeholder="Rol" className="w-20 bg-transparent text-[10px] font-medium text-purple-600 outline-none placeholder:text-purple-300" />
                        <button type="button" onClick={() => setAsignaciones(prev => prev.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 size-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-all">
                          <X size={10} className="text-red-400" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <HugeiconsIcon icon={Search01Icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                  <input type="text" value={asignacionStaffSearch}
                    onChange={e => setAsignacionStaffSearch(e.target.value)}
                    placeholder="Buscar personal para asignar..."
                    className="w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-gray-50/60 text-xs font-medium outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }} />
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
                        <button key={p.id} type="button"
                          onClick={() => { setAsignaciones(prev => [...prev, { persona_id: p.id, rol: "", persona: { nombres: p.nombres, apellidos: p.apellidos } }]); setAsignacionStaffSearch("") }}
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

            {/* Sección: Notas */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={Note03Icon} title="Notas adicionales" color="violet" />

              <textarea value={notas} onChange={e => setNotas(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white resize-none border-gray-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                rows={2} placeholder="Notas adicionales sobre la reserva..." />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 pb-4">
              <button type="button" onClick={() => navigate("/servicios/podcast")}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98]">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.98] shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={16} />
                    Confirmar Reserva
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
