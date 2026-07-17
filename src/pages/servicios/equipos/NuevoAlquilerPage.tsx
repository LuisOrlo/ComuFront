import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useParams, useLocation, Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Search01Icon, Tick02Icon,
  Cancel01Icon, UserIcon, Home02Icon,
  Calendar03Icon, Clock01Icon, Money01Icon,
  Note03Icon, AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { equiposService, type Equipo } from "@/services/equipos.service"
import { personasService } from "@/services/personas.service"
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

const MAX_FOTO_SIZE = 2 * 1024 * 1024

export function NuevoAlquilerPage() {
  const navigate = useNavigate()
  const { equipoId } = useParams<{ equipoId: string }>()
  const location = useLocation()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [loading, setLoading] = useState(true)

  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().slice(0, 16))
  const [fechaDevolucion, setFechaDevolucion] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const personasEnLista = useMemo(() => clientesDisponibles.filter(c => c.tipo === "persona"), [clientesDisponibles])
  const externosEnLista = useMemo(() => clientesDisponibles.filter(c => c.tipo === "cliente_externo"), [clientesDisponibles])

  useEffect(() => {
    if (!equipoId) { navigate("/servicios/equipos"); return }
    equiposService.getEquipo(equipoId)
      .then(setEquipo)
      .catch(() => { toast.error("Error al cargar equipo"); navigate("/servicios/equipos") })
      .finally(() => setLoading(false))
  }, [equipoId, navigate])

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

  const calcularDias = () => {
    if (!fechaEntrega || !fechaDevolucion) return 0
    const inicio = new Date(fechaEntrega)
    const fin = new Date(fechaDevolucion)
    return Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const dias = calcularDias()
  const precioTotal = equipo ? Math.round(dias * equipo.precio_diario * 100) / 100 : 0

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FOTO_SIZE) {
      toast.error("La imagen no debe superar los 2MB")
      e.target.value = ""
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!fechaEntrega) newErrors.fechaEntrega = "La fecha de entrega es obligatoria"
    if (!fechaDevolucion) newErrors.fechaDevolucion = "La fecha de devolución es obligatoria"
    if (fechaEntrega && fechaDevolucion && new Date(fechaDevolucion) <= new Date(fechaEntrega))
      newErrors.fechaDevolucion = "Debe ser posterior a la fecha de entrega"
    if (!clienteId) newErrors.cliente = "Debe seleccionar un cliente"
    setErrors(newErrors)
    setTouched({ fechaEntrega: true, fechaDevolucion: true, cliente: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !equipo) return
    setSaving(true)
    try {
      const form = new FormData()
      form.append("equipo_id", equipo.id)
      form.append("fecha_entrega", new Date(fechaEntrega).toISOString())
      form.append("fecha_devolucion_esperada", new Date(fechaDevolucion).toISOString())
      form.append("precio_total", String(precioTotal))
      if (observaciones.trim()) form.append("observaciones", observaciones.trim())
      if (fotoFile) form.append("foto_salida", fotoFile)
      if (clienteTipo === "persona") {
        form.append("persona_id", clienteId)
      } else {
        form.append("cliente_externo_id", clienteId)
      }

      await equiposService.createAlquiler(form)
      toast.success("Alquiler registrado exitosamente")
      navigate("/servicios/equipos")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al registrar alquiler"
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
        : "border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-amber-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-amber-600 border-t-transparent rounded-full" />
          <p className="text-xs font-medium opacity-40">Cargando equipo...</p>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-medium opacity-40">Equipo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-amber-50/20">
      <header className="shrink-0 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/equipos")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <HugeiconsIcon icon={Home02Icon} size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  Nuevo Alquiler
                </h1>
                <p className="text-xs opacity-40 mt-0.5 truncate">
                  {equipo.nombre} · ${Number(equipo.precio_diario).toFixed(2)}/día
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Sección: Fechas */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.04 90)", color: "#d97706" }}>
                  <HugeiconsIcon icon={Calendar03Icon} size={14} />
                </span>
                Fechas del alquiler
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Clock01Icon} size={12} className="opacity-40" />
                    Fecha entrega
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="datetime-local" value={fechaEntrega}
                    onChange={e => { setFechaEntrega(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.fechaEntrega; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, fechaEntrega: true }))}
                    className={inputCls("fechaEntrega")} />
                  {errMsg("fechaEntrega")}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Calendar03Icon} size={12} className="opacity-40" />
                    Devolución esperada
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="datetime-local" value={fechaDevolucion}
                    onChange={e => { setFechaDevolucion(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.fechaDevolucion; return n }) }}
                    onBlur={() => setTouched(prev => ({ ...prev, fechaDevolucion: true }))}
                    className={inputCls("fechaDevolucion")} />
                  {errMsg("fechaDevolucion")}
                </div>
              </div>

              {fechaEntrega && fechaDevolucion && precioTotal > 0 && (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 text-white">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <HugeiconsIcon icon={Money01Icon} size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Precio estimado</p>
                      <p className="text-sm font-medium opacity-90 flex items-center gap-1.5">
                        <span className="shrink-0">{dias} día{dias !== 1 ? "s" : ""}</span>
                        <span className="text-white/40">•</span>
                        <span className="shrink-0">${Number(equipo.precio_diario).toFixed(2)}/día</span>
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

            {/* Sección: Foto salida */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.03 270)", color: "#7c3aed" }}>
                  <HugeiconsIcon icon={Home02Icon} size={14} />
                </span>
                Foto del equipo (salida)
              </h2>

              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50/60 text-sm font-medium text-center outline-none hover:bg-gray-100 transition-colors">
                    {fotoFile ? fotoFile.name : "Seleccionar foto (máx. 2MB)"}
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" className="hidden" onChange={handleFotoChange} />
                </label>
                {fotoPreview && (
                  <div className="size-16 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <img src={fotoPreview} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[10px] opacity-30 px-1">Formatos: JPG, PNG, WEBP. Peso máximo: 2MB</p>
            </div>

            {/* Sección: Cliente */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.04 160)", color: "#059669" }}>
                  <HugeiconsIcon icon={UserIcon} size={14} />
                </span>
                Cliente
              </h2>

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
                          <div className="animate-spin size-3.5 border-2 border-amber-500 border-t-transparent rounded-full" />
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
                                  sel && "bg-amber-50/60"
                                )}
                              >
                                <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 transition-all", sel ? "bg-amber-100 shadow-sm" : "bg-gray-100")}>
                                  <HugeiconsIcon icon={UserIcon} size={13} className={cn(!sel && "opacity-40")} style={{ color: sel ? "#d97706" : undefined }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={cn("font-semibold text-sm", sel && "text-amber-700")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>
                                    {opt.nombres} {opt.apellidos}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {opt.cedula && <span className="text-[10px] opacity-40">C.I. {opt.cedula}</span>}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">{opt.personaTipo || "Externo"}</span>
                                  </div>
                                </div>
                                {sel && (
                                  <div className="size-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <HugeiconsIcon icon={Tick02Icon} size={11} className="text-amber-600" />
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

            {/* Sección: Observaciones */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.01 260)", color: "#3b82f6" }}>
                  <HugeiconsIcon icon={Note03Icon} size={14} />
                </span>
                Notas adicionales
              </h2>

              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white resize-none border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                rows={2} placeholder="Observaciones sobre el alquiler..." />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 pb-4">
              <button type="button" onClick={() => navigate("/servicios/equipos")}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98]">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.98] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={16} />
                    Registrar Alquiler
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
