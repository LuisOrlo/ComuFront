import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useParams, useLocation, Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Search01Icon, Tick02Icon,
  Cancel01Icon, UserIcon,
  VideoIcon, Edit01Icon, Note03Icon, Calendar03Icon,
  Calendar01Icon, Money01Icon, UserGroupIcon,
  SettingsIcon, AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  edicionVideoService,
  type TrabajoEdicion,
} from "@/services/edicion-video.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

interface FormErrors {
  titulo?: string
  fecha_limite?: string
  fecha_recibo?: string
}

interface ClienteOption {
  tipo: "persona" | "cliente_externo"
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  personaTipo?: string
}

function SectionHeader({ icon, title }: { icon: typeof ArrowLeft01Icon; title: string }) {
  return (
    <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
      <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.01 260)", color: "#3b82f6" }}>
        <HugeiconsIcon icon={icon} size={14} />
      </span>
      {title}
    </h2>
  )
}

export function EdicionVideoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaRecibo, setFechaRecibo] = useState(new Date().toISOString().split("T")[0])
  const [fechaLimite, setFechaLimite] = useState("")
  const [precioCobrado, setPrecioCobrado] = useState("")
  const [notas, setNotas] = useState("")
  const [editorIds, setEditorIds] = useState<string[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const location = useLocation()

  // Client search (unified, matching radio pattern)
  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const clienteRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const personasEnLista = useMemo(() => clientesDisponibles.filter(c => c.tipo === "persona"), [clientesDisponibles])
  const externosEnLista = useMemo(() => clientesDisponibles.filter(c => c.tipo === "cliente_externo"), [clientesDisponibles])

  useEffect(() => {
    if (!id) return
    edicionVideoService.getTrabajo(id).then((t: TrabajoEdicion) => {
      setTitulo(t.titulo)
      setDescripcion(t.descripcion || "")
      setFechaRecibo(t.fecha_recibo)
      setFechaLimite(t.fecha_limite)
      setPrecioCobrado(t.precio_cobrado != null ? String(t.precio_cobrado) : "")
      setNotas(t.notas || "")
      setEditorIds(t.editor_ids || [])
      if (t.persona_id) {
        setClienteId(t.persona_id)
        setClienteTipo("persona")
        setSelectedCliente({ tipo: "persona", id: t.persona_id, nombres: t.cliente?.nombres || "", apellidos: t.cliente?.apellidos || "" })
        setClienteSearch(`${t.cliente?.nombres || ""} ${t.cliente?.apellidos || ""}`.trim())
      } else if (t.cliente_externo_id) {
        setClienteId(t.cliente_externo_id)
        setClienteTipo("cliente_externo")
        setSelectedCliente({ tipo: "cliente_externo", id: t.cliente_externo_id, nombres: t.cliente_externo?.nombres || "", apellidos: t.cliente_externo?.apellidos || "", cedula: t.cliente_externo?.cedula })
        setClienteSearch(`${t.cliente_externo?.nombres || ""} ${t.cliente_externo?.apellidos || ""}`.trim())
      }
    }).catch(() => {
      toast.error("Error al cargar datos del trabajo")
      navigate("/servicios/edicion-video")
    }).finally(() => setLoading(false))
  }, [id, navigate])

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
        personasService.getPersonas({ buscar: clienteSearch || undefined, tipo: "estudiante,instructor,pasante", page: 1 }),
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

  // Detect return from NuevoClientePage
  useEffect(() => {
    const state = location.state as { nuevoCliente?: ClienteExterno } | null
    if (state?.nuevoCliente && !clienteId) {
      const c = state.nuevoCliente
      queueMicrotask(() => {
        setClienteId(c.id)
        setClienteTipo("cliente_externo")
        setSelectedCliente({ tipo: "cliente_externo", id: c.id, nombres: c.nombres, apellidos: c.apellidos || "", cedula: c.cedula })
        setClienteSearch(`${c.nombres} ${c.apellidos || ""}`.trim())
        window.history.replaceState({}, "")
      })
    }
  }, [location.state, clienteId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false)
      }
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
  }

  const clearCliente = () => {
    setClienteId("")
    setClienteTipo("")
    setSelectedCliente(null)
    setClienteSearch("")
    setClientesDisponibles([])
  }

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "titulo":
        if (!value.trim()) return "El título es obligatorio"
        if (value.trim().length < 2) return "Mínimo 2 caracteres"
        return null
      case "fecha_limite":
        if (!value) return "La fecha límite es obligatoria"
        if (value < fechaRecibo) return "Debe ser posterior a la fecha de recibo"
        return null
      case "fecha_recibo":
        if (!value) return "La fecha de recibo es obligatoria"
        return null
      default:
        return null
    }
  }

  const updateField = (field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      titulo: setTitulo, fecha_limite: setFechaLimite, fecha_recibo: setFechaRecibo,
    }
    setters[field]?.(value)
    if (touched[field]) {
      const err = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: err || undefined }))
    }
  }

  const blurField = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const val = { titulo, fecha_limite: fechaLimite, fecha_recibo: fechaRecibo }[field] || ""
    const err = validateField(field, val)
    setErrors(prev => ({ ...prev, [field]: err || undefined }))
  }

  const validateAll = (): boolean => {
    const fields: (keyof FormErrors)[] = ["titulo", "fecha_limite", "fecha_recibo"]
    const newErrors: FormErrors = {}
    let valid = true
    for (const f of fields) {
      const val = { titulo, fecha_limite: fechaLimite, fecha_recibo: fechaRecibo }[f] || ""
      const err = validateField(f, val)
      if (err) { newErrors[f] = err; valid = false }
    }
    setErrors(newErrors)
    setTouched(prev => {
      const t = { ...prev }
      for (const f of fields) t[f] = true
      return t
    })
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return
    setSaving(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        fecha_recibo: fechaRecibo,
        fecha_limite: fechaLimite,
        persona_id: clienteTipo === "persona" ? clienteId : undefined,
        cliente_externo_id: clienteTipo === "cliente_externo" ? clienteId : undefined,
        editor_ids: editorIds,
        precio_cobrado: precioCobrado ? Number(precioCobrado) : null,
        notas: notas.trim() || undefined,
      }

      if (isEdit && id) {
        await edicionVideoService.updateTrabajo(id, payload)
        toast.success("Trabajo actualizado")
        navigate(`/servicios/edicion-video/${id}`)
      } else {
        const created = await edicionVideoService.createTrabajo(payload)
        toast.success("Trabajo registrado")
        navigate(`/servicios/edicion-video/${created.id}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al guardar trabajo"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleEditor = (personaId: string) => {
    setEditorIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    )
  }

  const inputCls = (field: string) => {
    const hasErr = touched[field] && errors[field as keyof FormErrors]
    return `w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white ${hasErr ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10" : "border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"}`
  }

  const errMsg = (field: string) => {
    if (!touched[field]) return null
    const msg = errors[field as keyof FormErrors]
    return msg ? (
      <p className="flex items-center gap-1.5 text-[11px] mt-1.5 text-red-500 font-medium">
        <HugeiconsIcon icon={AlertCircleIcon} size={11} />
        {msg}
      </p>
    ) : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-blue-600 border-t-transparent rounded-full" />
          <p className="text-xs font-medium opacity-40">Cargando datos del trabajo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50/20">
      <header className="shrink-0 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/edicion-video")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <HugeiconsIcon icon={VideoIcon} size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  {isEdit ? "Editar Trabajo" : "Nuevo Trabajo"}
                </h1>
                <p className="text-xs opacity-40 mt-0.5">
                  {isEdit ? "Actualiza los datos del trabajo de edición" : "Registra un nuevo trabajo de edición de video"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Sección: Información del trabajo */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={Edit01Icon} title="Información del trabajo" />

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                  Título del proyecto
                  <span className="text-red-500">*</span>
                </label>
                <input value={titulo} onChange={e => updateField("titulo", e.target.value)} onBlur={() => blurField("titulo")}
                  className={inputCls("titulo")}
                  placeholder="Ej. Edición video promocional Q1" />
                {errMsg("titulo")}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                  Descripción / Especificaciones
                </label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white resize-none border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  rows={3} placeholder="Describe el alcance del trabajo, duración esperada, estilo de edición, etc..." />
              </div>
            </div>

            {/* Sección: Cliente */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={UserIcon} title="Cliente" />

              <div className="relative" ref={clienteRef}>
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
                    <input type="text"
                      value={clienteSearch}
                      onChange={e => { setClienteSearch(e.target.value); setShowClienteDropdown(true) }}
                      onFocus={() => { if (!clienteId || clienteSearch) setShowClienteDropdown(true) }}
                      placeholder="Buscar persona o cliente por nombre o cédula..."
                      className="w-full pl-11 pr-10 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
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
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border-2 rounded-2xl shadow-xl max-h-72 overflow-y-auto" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      {searchingCliente ? (
                        <div className="p-5 text-center text-xs opacity-40 flex items-center justify-center gap-2">
                          <div className="animate-spin size-3.5 border-2 border-blue-500 border-t-transparent rounded-full" />
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
                                className={cn("w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3", sel && "bg-blue-50/60")}>
                                <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 transition-all", sel ? "bg-blue-100 shadow-sm" : "bg-gray-100")}>
                                  <HugeiconsIcon icon={UserIcon} size={13} className={cn(!sel && "opacity-40")} style={{ color: sel ? "#3b82f6" : undefined }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className={cn("font-semibold text-sm", sel && "text-blue-700")} style={{ color: sel ? undefined : COLORS.CHARCOAL }}>
                                    {opt.nombres} {opt.apellidos}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {opt.cedula && <span className="text-[10px] opacity-40">C.I. {opt.cedula}</span>}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{opt.personaTipo}</span>
                                  </div>
                                </div>
                                {sel && (
                                  <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <HugeiconsIcon icon={Tick02Icon} size={11} className="text-blue-600" />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                          {externosEnLista.length > 0 && (
                            <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest opacity-30 border-t">Clientes Externos</div>
                          )}
                          {externosEnLista.map(opt => {
                            const sel = clienteId === opt.id && clienteTipo === "cliente_externo"
                            return (
                              <button key={`externo-${opt.id}`} type="button"
                                onClick={() => selectCliente(opt)}
                                className={cn("w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3", sel && "bg-emerald-50/60")}>
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

            {/* Sección: Fechas */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={Calendar03Icon} title="Fechas del proyecto" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Calendar01Icon} size={12} className="opacity-40" />
                    Fecha de Recibo
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={fechaRecibo}
                    onChange={e => updateField("fecha_recibo", e.target.value)}
                    onBlur={() => blurField("fecha_recibo")}
                    className={inputCls("fecha_recibo")} />
                  {errMsg("fecha_recibo")}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Calendar03Icon} size={12} className="opacity-40" />
                    Fecha Límite
                    <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={fechaLimite}
                    onChange={e => updateField("fecha_limite", e.target.value)}
                    onBlur={() => blurField("fecha_limite")}
                    className={inputCls("fecha_limite")} />
                  {errMsg("fecha_limite")}
                </div>
              </div>
            </div>

            {/* Sección: Configuración */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={SettingsIcon} title="Configuración del trabajo" />

              <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Money01Icon} size={12} className="opacity-40" />
                    Precio Acordado
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                      <span className="text-sm font-bold opacity-30">$</span>
                      <div className="w-px h-5 bg-gray-200 ml-1.5" />
                    </div>
                    <input type="number" min="0" step="0.01" value={precioCobrado}
                      onChange={e => setPrecioCobrado(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-14 pr-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" />
                  </div>
                  <p className="text-[10px] opacity-30 px-1">Precio acordado por el servicio de edición</p>
              </div>
            </div>

            {/* Sección: Equipo de edición */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={UserGroupIcon} title="Equipo de edición" />

              {personas.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-xs opacity-30 italic">
                  <div className="animate-spin size-3.5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  Cargando personal...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {personas.map(p => {
                    const selected = editorIds.includes(p.id)
                    return (
                      <button key={p.id} type="button" onClick={() => toggleEditor(p.id)}
                        style={{
                          borderColor: selected ? "#3b82f6" : COLORS.BORDER_SUBTLE,
                          backgroundColor: selected ? "#eff6ff" : "white",
                        }}
                        className={cn(
                          "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all active:scale-[0.97] hover:shadow-sm",
                          selected ? "shadow-sm" : "hover:bg-gray-50"
                        )}>
                        <div className={cn("size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 transition-all", selected ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm" : "bg-gray-200 text-gray-500")}>
                          {p.nombres.charAt(0)}{p.apellidos?.charAt(0) || ""}
                        </div>
                        <div className="text-left min-w-0">
                          <span className={cn("block truncate max-w-[100px]", selected ? "text-blue-700" : "text-charcoal/70")}>
                            {p.nombres} {p.apellidos}
                          </span>
                          <span className="text-[9px] opacity-30 block truncate">{p.tipo}</span>
                        </div>
                        {selected && (
                          <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Tick02Icon} size={10} className="text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {editorIds.length > 0 && (
                <p className="text-[10px] font-medium text-blue-600 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Tick02Icon} size={12} />
                  {editorIds.length} editor{editorIds.length !== 1 ? "es" : ""} asignado{editorIds.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Sección: Notas */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <SectionHeader icon={Note03Icon} title="Notas adicionales" />

              <textarea value={notas} onChange={e => setNotas(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white resize-none border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                rows={2} placeholder="Notas internas, instrucciones especiales, referencias..." />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 pb-4">
              <button type="button" onClick={() => navigate("/servicios/edicion-video")}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98]">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={16} />
                    {isEdit ? "Actualizar Trabajo" : "Registrar Trabajo"}
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
