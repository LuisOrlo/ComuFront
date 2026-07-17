import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useParams, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Search01Icon,
  Tick02Icon,
  Cancel01Icon,
  UserIcon,
  MatrixIcon,
  Calendar03Icon,
  Clock01Icon,
  Money01Icon,
  AlertCircleIcon,
  AddCircleIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { aulasService, type Aula } from "@/services/aulas.service"
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

export function NuevaReservaPage() {
  const navigate = useNavigate()
  const { aulaId } = useParams<{ aulaId: string }>()
  const location = useLocation()
  const state = location.state as { fecha_reserva?: string; hora_inicio?: string; hora_fin?: string } | null

  const [aula, setAula] = useState<Aula | null>(null)
  const [loading, setLoading] = useState(true)

  const [fechaReserva, setFechaReserva] = useState(state?.fecha_reserva || new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState(state?.hora_inicio || "08:00")
  const [horaFin, setHoraFin] = useState(state?.hora_fin || "10:00")

  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })

  const [saving, setSaving] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const allOptions = useMemo(() => {
    const q = clienteSearch.toLowerCase().trim()
    const personaOpts: ClienteOption[] = personas
      .filter(p => {
        if (!q) return true
        const name = `${p.nombres} ${p.apellidos}`.toLowerCase()
        return name.includes(q) || (p.cedula && p.cedula.includes(q))
      })
      .map(p => ({
        tipo: "persona" as const,
        id: p.id,
        nombres: p.nombres,
        apellidos: p.apellidos || "",
        cedula: p.cedula,
        correo: p.correo,
      }))
    return [...personaOpts, ...clientesDisponibles]
  }, [personas, clientesDisponibles, clienteSearch])

  useEffect(() => {
    if (!aulaId) { navigate("/servicios/aulas"); return }
    aulasService.getAula(aulaId)
      .then(setAula)
      .catch(() => { toast.error("Error al cargar aula"); navigate("/servicios/aulas") })
      .finally(() => setLoading(false))
  }, [aulaId, navigate])

  useEffect(() => {
    personasService.getPersonas({ page: 1 })
      .then(res => setPersonas(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchingCliente(true)
      clientesService.getClientes({ search: clienteSearch || undefined, per_page: 50 })
        .then(res => {
          const options: ClienteOption[] = (res.data as ClienteExterno[]).map(c => ({
            tipo: "cliente_externo" as const,
            id: c.id,
            nombres: c.nombres,
            apellidos: c.apellidos || "",
            cedula: c.cedula,
            correo: c.correo,
          }))
          setClientesDisponibles(options)
        })
        .catch(() => setClientesDisponibles([]))
        .finally(() => setSearchingCliente(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [clienteSearch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node))
        setShowClienteDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const calcularPrecio = () => {
    if (!aula || !horaInicio || !horaFin) return 0
    const [h1, m1] = horaInicio.split(":").map(Number)
    const [h2, m2] = horaFin.split(":").map(Number)
    const hours = (h2 + m2 / 60) - (h1 + m1 / 60)
    return hours > 0 ? Math.round(hours * Number(aula.precio_hora) * 100) / 100 : 0
  }

  const precioTotal = calcularPrecio()

  const selectCliente = (opt: ClienteOption) => {
    setSelectedCliente(opt)
    setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
    setShowClienteDropdown(false)
    setCreandoCliente(false)
    setErrors(prev => { const n = { ...prev }; delete n.cliente; return n })
  }

  const clearCliente = () => {
    setSelectedCliente(null)
    setClienteSearch("")
    setClientesDisponibles([])
  }

  const handleCreateCliente = async () => {
    if (!nuevoClienteForm.nombres.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      const nuevo = await clientesService.createCliente(nuevoClienteForm)
      toast.success("Cliente externo registrado")
      selectCliente({
        tipo: "cliente_externo",
        id: nuevo.id,
        nombres: nuevo.nombres,
        apellidos: nuevo.apellidos || "",
        cedula: nuevo.cedula,
        correo: nuevo.correo,
      })
      setNuevoClienteForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al crear cliente")
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!fechaReserva) newErrors.fechaReserva = "La fecha es obligatoria"
    if (!horaInicio) newErrors.horaInicio = "La hora de inicio es obligatoria"
    if (!horaFin) newErrors.horaFin = "La hora de fin es obligatoria"
    if (horaInicio && horaFin && horaFin <= horaInicio)
      newErrors.horaFin = "Debe ser posterior a la hora de inicio"
    if (!selectedCliente)
      newErrors.cliente = "Debe seleccionar un responsable"
    setErrors(newErrors)
    setTouched({ fechaReserva: true, horaInicio: true, horaFin: true, cliente: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !aula) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        aula_id: aula.id,
        fecha_reserva: fechaReserva,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        precio_total: precioTotal,
        estado: "reservado",
      }
      if (selectedCliente?.tipo === "persona") {
        payload.persona_id = selectedCliente.id
      } else {
        payload.cliente_externo_id = selectedCliente!.id
      }

      await aulasService.createReserva(payload)
      toast.success("Reserva creada exitosamente")
      navigate("/servicios/aulas")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al crear reserva"
      toast.error(msg)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-violet-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-violet-600 border-t-transparent rounded-full" />
          <p className="text-xs font-medium opacity-40">Cargando aula...</p>
        </div>
      </div>
    )
  }

  if (!aula) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-medium opacity-40">Aula no encontrada</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-violet-50/20">
      <header className="shrink-0 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/aulas")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                <HugeiconsIcon icon={MatrixIcon} size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  Nueva Reserva
                </h1>
                <p className="text-xs opacity-40 mt-0.5 truncate">
                  {aula.nombre} · ${Number(aula.precio_hora).toFixed(2)}/hora
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Sección: Fecha y horario */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.03 270)", color: "#7c3aed" }}>
                  <HugeiconsIcon icon={Calendar03Icon} size={14} />
                </span>
                Fecha y horario
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Calendar03Icon} size={12} className="opacity-40" />
                    Fecha
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={fechaReserva}
                    onChange={e => { setFechaReserva(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.fechaReserva; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, fechaReserva: true }))}
                    className={inputCls("fechaReserva")} />
                  {errMsg("fechaReserva")}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={12} className="opacity-40" />
                    Hora inicio
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="time" value={horaInicio}
                    onChange={e => { setHoraInicio(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.horaInicio; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, horaInicio: true }))}
                    className={inputCls("horaInicio")} />
                  {errMsg("horaInicio")}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={12} className="opacity-40" />
                    Hora fin
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="time" value={horaFin}
                    onChange={e => { setHoraFin(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.horaFin; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, horaFin: true }))}
                    className={inputCls("horaFin")} />
                  {errMsg("horaFin")}
                </div>
              </div>

              {precioTotal > 0 && (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-700 text-white">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <HugeiconsIcon icon={Money01Icon} size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Precio estimado</p>
                      <p className="text-sm font-medium opacity-90">
                        ${Number(aula.precio_hora).toFixed(2)}/hora
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Total</p>
                    <p className="text-3xl font-black tracking-tighter">${precioTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sección: Responsable unificado */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.04 160)", color: "#059669" }}>
                  <HugeiconsIcon icon={UserIcon} size={14} />
                </span>
                Responsable
              </h2>

              <div className="space-y-2">
                <div className="relative" ref={clienteRef}>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
                      <input type="text"
                        value={clienteSearch}
                        onChange={e => { setClienteSearch(e.target.value); setShowClienteDropdown(true); if (selectedCliente) clearCliente() }}
                        onFocus={() => { if (!selectedCliente || clienteSearch) setShowClienteDropdown(true) }}
                        placeholder="Buscar personal o cliente por nombre o cédula..."
                        className={cn(
                          "w-full pl-11 pr-10 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white",
                          touched.cliente && errors.cliente
                            ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                            : "border-gray-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                        )} />
                      {selectedCliente && (
                        <button type="button" onClick={clearCliente}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                          <HugeiconsIcon icon={Cancel01Icon} size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showClienteDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border-2 rounded-2xl shadow-xl max-h-72 overflow-y-auto"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        {searchingCliente ? (
                          <div className="p-5 text-center text-xs opacity-40 flex items-center justify-center gap-2">
                            <div className="animate-spin size-3.5 border-2 border-violet-500 border-t-transparent rounded-full" />
                            Buscando...
                          </div>
                        ) : allOptions.length === 0 ? (
                          <div className="p-5 text-center text-xs opacity-40">
                            {clienteSearch.trim() ? "Sin resultados" : "Escribe para buscar..."}
                          </div>
                        ) : (
                          <div>
                            {allOptions.map(opt => {
                              const sel = selectedCliente?.id === opt.id && selectedCliente?.tipo === opt.tipo
                              return (
                                <button key={`${opt.tipo}-${opt.id}`} type="button"
                                  onClick={() => selectCliente(opt)}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3",
                                    sel && "bg-violet-50/60"
                                  )}>
                                  <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 transition-all", sel ? "bg-violet-100 shadow-sm" : "bg-gray-100")}>
                                    <HugeiconsIcon icon={UserIcon} size={13} className={cn(!sel && "opacity-40")} style={{ color: sel ? "#7c3aed" : undefined }} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className={cn("font-semibold text-sm", sel && "text-violet-700")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>
                                      {opt.nombres} {opt.apellidos}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {opt.cedula && <span className="text-[10px] opacity-40">C.I. {opt.cedula}</span>}
                                      <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", opt.tipo === "persona" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600")}>
                                        {opt.tipo === "persona" ? "Staff" : "Externo"}
                                      </span>
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
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {errMsg("cliente")}

                {selectedCliente && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50/30 border border-violet-200">
                    <div className="size-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={UserIcon} size={15} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-violet-800 truncate">
                        {selectedCliente.nombres} {selectedCliente.apellidos}
                      </p>
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", selectedCliente.tipo === "persona" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600")}>
                        {selectedCliente.tipo === "persona" ? "Staff Interno" : "Cliente Externo"}
                      </span>
                    </div>
                    <HugeiconsIcon icon={Tick02Icon} size={16} className="text-violet-500 shrink-0" />
                  </div>
                )}
              </div>

              {!creandoCliente && !selectedCliente && (
                <button type="button" onClick={() => setCreandoCliente(true)}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  <UserPlus size={14} />
                  Registrar nuevo cliente externo
                </button>
              )}

              {creandoCliente && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold opacity-40 uppercase tracking-wider">Nuevo Cliente Externo</span>
                    <button type="button" onClick={() => setCreandoCliente(false)}
                      className="text-xs font-medium opacity-40 hover:opacity-100 transition-opacity">Cancelar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Nombres *</label>
                      <input type="text" value={nuevoClienteForm.nombres}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nombres: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Apellidos</label>
                      <input type="text" value={nuevoClienteForm.apellidos}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, apellidos: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Cédula</label>
                      <input type="text" value={nuevoClienteForm.cedula}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, cedula: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Celular</label>
                      <input type="text" value={nuevoClienteForm.celular}
                        onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, celular: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Correo</label>
                    <input type="email" value={nuevoClienteForm.correo}
                      onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, correo: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                  </div>
                  <button type="button" onClick={handleCreateCliente}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold tracking-wide hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <HugeiconsIcon icon={AddCircleIcon} size={14} />
                    Registrar Cliente
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 pb-4">
              <button type="button" onClick={() => navigate("/servicios/aulas")}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98]">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.98] shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #d946ef)" }}>
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
