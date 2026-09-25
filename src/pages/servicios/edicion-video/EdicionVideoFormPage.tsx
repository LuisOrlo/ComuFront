import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Search01Icon,
  Cancel01Icon,
  UserIcon,
  VideoIcon,
  Edit01Icon,
  Note03Icon,
  Calendar03Icon,
  Money01Icon,
  UserGroupIcon,
  AlertCircleIcon,
  CheckmarkCircle04Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2, Tag, X, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  edicionVideoService,
  type TrabajoEdicion,
} from "@/services/edicion-video.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { NuevoClienteModal } from "@/components/clientes/NuevoClienteModal"
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
  celular?: string
  personaTipo?: string
}

function formatDateDisplay(d: string) {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
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

  // Descuentos
  const [descuentoTipo, setDescuentoTipo] = useState<"fijo" | "porcentaje">("fijo")
  const [descuentoValor, setDescuentoValor] = useState<string>("")
  const [motivoDescuento, setMotivoDescuento] = useState<string>("")
  const [showDescuento, setShowDescuento] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Búsqueda de clientes unificada
  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const clienteRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const personasEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "persona"),
    [clientesDisponibles]
  )
  const externosEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "cliente_externo"),
    [clientesDisponibles]
  )

  useEffect(() => {
    if (!id) return
    edicionVideoService
      .getTrabajo(id)
      .then((t: TrabajoEdicion) => {
        setTitulo(t.titulo)
        setDescripcion(t.descripcion || "")
        setFechaRecibo(t.fecha_recibo)
        setFechaLimite(t.fecha_limite)
        setPrecioCobrado(t.precio_cobrado != null ? String(t.precio_cobrado) : "")
        if (t.monto_descuento && t.monto_descuento > 0) {
          setShowDescuento(true)
          setDescuentoTipo("fijo")
          setDescuentoValor(t.monto_descuento.toString())
          setMotivoDescuento(t.motivo_descuento || "")
        }
        setNotas(t.notas || "")
        setEditorIds(t.editor_ids || [])
        if (t.persona_id) {
          setClienteId(t.persona_id)
          setClienteTipo("persona")
          setSelectedCliente({
            tipo: "persona",
            id: t.persona_id,
            nombres: t.cliente?.nombres || "",
            apellidos: t.cliente?.apellidos || "",
            correo: t.cliente?.correo,
          })
          setClienteSearch(`${t.cliente?.nombres || ""} ${t.cliente?.apellidos || ""}`.trim())
        } else if (t.cliente_externo_id) {
          setClienteId(t.cliente_externo_id)
          setClienteTipo("cliente_externo")
          setSelectedCliente({
            tipo: "cliente_externo",
            id: t.cliente_externo_id,
            nombres: t.cliente_externo?.nombres || "",
            apellidos: t.cliente_externo?.apellidos || "",
            cedula: t.cliente_externo?.cedula,
            celular: t.cliente_externo?.celular,
            correo: t.cliente_externo?.correo,
          })
          setClienteSearch(
            `${t.cliente_externo?.nombres || ""} ${t.cliente_externo?.apellidos || ""}`.trim()
          )
        }
      })
      .catch(() => {
        toast.error("Error al cargar datos del trabajo")
        navigate("/servicios/edicion-video")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    personasService
      .getPersonas({ page: 1, per_page: 100 })
      .then((res) => setPersonas(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = clienteSearch.trim()
    if (q.length < 2) {
      setClientesDisponibles([])
      setSearchingCliente(false)
      return
    }

    const timer = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setSearchingCliente(true)
      Promise.allSettled([
        personasService.getPersonas({
          buscar: q || undefined,
          tipo: "estudiante,instructor,pasante,staff",
          page: 1,
          per_page: 50,
        }),
        clientesService.getClientes({ search: q || undefined, per_page: 50 }),
      ])
        .then(([personasRes, clientesRes]) => {
          if (controller.signal.aborted) return

          const results: ClienteOption[] = []

          if (personasRes.status === "fulfilled") {
            for (const p of personasRes.value.data) {
              results.push({
                tipo: "persona",
                id: p.id,
                nombres: p.nombres,
                apellidos: p.apellidos || "",
                cedula: p.cedula,
                correo: p.correo,
                celular: p.celular,
                personaTipo: p.tipo,
              })
            }
          }

          if (clientesRes.status === "fulfilled") {
            const data =
              (clientesRes.value as { data: ClienteExterno[] }).data ||
              (clientesRes.value as ClienteExterno[])
            for (const c of Array.isArray(data) ? data : []) {
              if (results.some((r) => r.tipo === "cliente_externo" && r.id === c.id)) continue
              results.push({
                tipo: "cliente_externo",
                id: c.id,
                nombres: c.nombres,
                apellidos: c.apellidos || "",
                cedula: c.cedula,
                correo: c.correo,
                celular: c.celular,
              })
            }
          }

          setClientesDisponibles(results)
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchingCliente(false)
        })
    }, 250)

    return () => {
      clearTimeout(timer)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [clienteSearch])

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
    setClienteSearch("")
    setShowClienteDropdown(false)
    setClientesDisponibles([])
  }

  const clearCliente = () => {
    setClienteId("")
    setClienteTipo("")
    setSelectedCliente(null)
    setClienteSearch("")
    setClientesDisponibles([])
    setShowClienteDropdown(false)
  }

  const handleNewClienteCreated = (nuevo: ClienteExterno) => {
    selectCliente({
      tipo: "cliente_externo",
      id: nuevo.id,
      nombres: nuevo.nombres,
      apellidos: nuevo.apellidos || "",
      cedula: nuevo.cedula,
      correo: nuevo.correo,
      celular: nuevo.celular,
    })
    setShowNuevoCliente(false)
    toast.success("Cliente externo creado y asignado al trabajo")
  }

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "titulo":
        if (!value.trim()) return "El título es obligatorio"
        if (value.trim().length < 2) return "Mínimo 2 caracteres"
        return null
      case "fecha_limite":
        if (!value) return "La fecha límite es obligatoria"
        if (value < fechaRecibo) return "Debe ser posterior o igual a la fecha de recibo"
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
      titulo: setTitulo,
      fecha_limite: setFechaLimite,
      fecha_recibo: setFechaRecibo,
    }
    setters[field]?.(value)
    if (touched[field]) {
      const err = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: err || undefined }))
    }
  }

  const blurField = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const val = { titulo, fecha_limite: fechaLimite, fecha_recibo: fechaRecibo }[field] || ""
    const err = validateField(field, val)
    setErrors((prev) => ({ ...prev, [field]: err || undefined }))
  }

  const validateAll = (): boolean => {
    const fields: (keyof FormErrors)[] = ["titulo", "fecha_limite", "fecha_recibo"]
    const newErrors: FormErrors = {}
    let valid = true
    for (const f of fields) {
      const val = { titulo, fecha_limite: fechaLimite, fecha_recibo: fechaRecibo }[f] || ""
      const err = validateField(f, val)
      if (err) {
        newErrors[f] = err
        valid = false
      }
    }
    setErrors(newErrors)
    setTouched((prev) => {
      const t = { ...prev }
      for (const f of fields) t[f] = true
      return t
    })
    return valid
  }

  const precioOriginalNum = precioCobrado ? Number(precioCobrado) : 0
  let montoDescuentoCalculado = 0
  if (showDescuento && descuentoValor) {
    if (descuentoTipo === "fijo") {
      montoDescuentoCalculado = Number(descuentoValor) || 0
    } else {
      montoDescuentoCalculado = (precioOriginalNum * (Number(descuentoValor) || 0)) / 100
    }
  }
  const precioCobradoFinal = Math.max(0, precioOriginalNum - montoDescuentoCalculado)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) {
      toast.error("Por favor completa los campos requeridos del formulario")
      return
    }
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
        precio_cobrado: precioCobrado ? precioCobradoFinal : null,
        precio_original: showDescuento && montoDescuentoCalculado > 0 ? precioOriginalNum : null,
        monto_descuento: showDescuento && montoDescuentoCalculado > 0 ? montoDescuentoCalculado : 0,
        motivo_descuento:
          showDescuento && montoDescuentoCalculado > 0 && motivoDescuento.trim()
            ? motivoDescuento.trim()
            : null,
        notas: notas.trim() || undefined,
      }

      if (isEdit && id) {
        await edicionVideoService.updateTrabajo(id, payload)
        toast.success("Trabajo de edición actualizado exitosamente")
        navigate(`/servicios/edicion-video/${id}`)
      } else {
        const created = await edicionVideoService.createTrabajo(payload)
        toast.success("Trabajo de edición registrado exitosamente")
        navigate(`/servicios/edicion-video/${created.id}`)
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al guardar el trabajo de edición"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleEditor = (personaId: string) => {
    setEditorIds((prev) =>
      prev.includes(personaId) ? prev.filter((i) => i !== personaId) : [...prev, personaId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-[#fd761a] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Cargando datos del trabajo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header Principal de la Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/servicios/edicion-video")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver a Edición de Video"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
             
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {isEdit ? "Editar Trabajo de Edición" : "Registrar Trabajo de Edición"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              {isEdit ? "Modo de Modificación" : "Nuevo Registro"}
            </span>
          </div>
        </div>

        {/* Formulario en Grid Bento de 2 Columnas */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Formulario (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* CARD 1: Cliente / Solicitante */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Cliente / Solicitante
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna la persona o institución que contrata el trabajo de edición
                    </p>
                  </div>
                </div>

                {!selectedCliente && (
                  <button
                    type="button"
                    onClick={() => setShowNuevoCliente(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <UserPlus size={14} />
                    <span>Nuevo Cliente</span>
                  </button>
                )}
              </div>

              {/* Ficha Destacada del Cliente Seleccionado */}
              {selectedCliente ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white border-2 border-emerald-500/80 shadow-xs transition-all animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="size-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-base shadow-sm">
                        {selectedCliente.nombres.charAt(0)}
                        {selectedCliente.apellidos?.charAt(0) || ""}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={11} />
                            <span>
                              {selectedCliente.tipo === "persona"
                                ? selectedCliente.personaTipo || "Institucional"
                                : "Cliente Externo"}
                            </span>
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            Cliente asignado
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {selectedCliente.nombres} {selectedCliente.apellidos}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                          {selectedCliente.cedula && (
                            <span className="font-medium">
                              <span className="text-slate-400">C.I:</span> {selectedCliente.cedula}
                            </span>
                          )}
                          {selectedCliente.celular && (
                            <span className="font-medium">
                              <span className="text-slate-400">Tel:</span> {selectedCliente.celular}
                            </span>
                          )}
                          {selectedCliente.correo && (
                            <span className="font-medium">
                              <span className="text-slate-400">Email:</span> {selectedCliente.correo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={clearCliente}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-red-600 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        title="Cambiar cliente solicitante"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        <span>Cambiar cliente</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Buscador de Clientes */
                <div className="relative" ref={clienteRef}>
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={clienteSearch}
                      onChange={(e) => {
                        setClienteSearch(e.target.value)
                        setShowClienteDropdown(true)
                      }}
                      onFocus={() => {
                        if (clienteSearch.trim().length >= 2) setShowClienteDropdown(true)
                      }}
                      placeholder="Buscar cliente institucional o externo por nombre o cédula..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                    />
                    {clienteSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setClienteSearch("")
                          setClientesDisponibles([])
                          setShowClienteDropdown(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={15} />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={13}
                      className="text-slate-400 shrink-0"
                    />
                    <span>Escribe al menos 2 letras para iniciar la búsqueda en el catálogo.</span>
                  </p>

                  {/* Dropdown de Coincidencias */}
                  <AnimatePresence>
                    {showClienteDropdown && clienteSearch.trim().length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.99 }}
                        className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100"
                      >
                        {searchingCliente ? (
                          <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-[#fd761a]" />
                            <span>Buscando coincidencias para "{clienteSearch}"...</span>
                          </div>
                        ) : clientesDisponibles.length === 0 ? (
                          <div className="p-6 text-center space-y-2">
                            <p className="text-xs font-semibold text-slate-600">
                              No se encontraron coincidencias para "{clienteSearch}"
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Verifica los datos o registra al cliente directamente.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setShowClienteDropdown(false)
                                setShowNuevoCliente(true)
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer mt-2"
                            >
                              <UserPlus size={13} />
                              <span>Registrar "{clienteSearch}" como Nuevo Cliente</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="font-bold text-slate-700">
                                {clientesDisponibles.length} coincidencia
                                {clientesDisponibles.length > 1 ? "s" : ""} encontrada
                                {clientesDisponibles.length > 1 ? "s" : ""}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Haz clic para seleccionar
                              </span>
                            </div>

                            {personasEnLista.length > 0 && (
                              <div>
                                <div className="px-4 py-1.5 bg-orange-50/60 text-[10px] font-bold uppercase tracking-wider text-orange-800 flex items-center justify-between">
                                  <span>Personas Institucionales</span>
                                  <span>{personasEnLista.length}</span>
                                </div>
                                {personasEnLista.map((opt) => (
                                  <button
                                    key={`persona-${opt.id}`}
                                    type="button"
                                    onClick={() => selectCliente(opt)}
                                    className="w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-orange-50/60 border-l-4 border-l-transparent hover:border-l-[#fd761a] flex items-center gap-3 cursor-pointer"
                                  >
                                    <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-[#fd761a] font-bold text-xs">
                                      {opt.nombres.charAt(0)}
                                      {opt.apellidos?.charAt(0) || ""}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-900 truncate">
                                          {opt.nombres} {opt.apellidos}
                                        </span>
                                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                                          {opt.personaTipo || "Institucional"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                        {opt.cedula && (
                                          <span>
                                            <b>C.I:</b> {opt.cedula}
                                          </span>
                                        )}
                                        {opt.correo && (
                                          <span className="truncate max-w-[200px]">{opt.correo}</span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {externosEnLista.length > 0 && (
                              <div>
                                <div className="px-4 py-1.5 bg-emerald-50/60 text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                                  <span>Clientes Externos</span>
                                  <span>{externosEnLista.length}</span>
                                </div>
                                {externosEnLista.map((opt) => (
                                  <button
                                    key={`externo-${opt.id}`}
                                    type="button"
                                    onClick={() => selectCliente(opt)}
                                    className="w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-emerald-50/60 border-l-4 border-l-transparent hover:border-l-emerald-500 flex items-center gap-3 cursor-pointer"
                                  >
                                    <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700 font-bold text-xs">
                                      {opt.nombres.charAt(0)}
                                      {opt.apellidos?.charAt(0) || ""}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-900 truncate">
                                          {opt.nombres} {opt.apellidos}
                                        </span>
                                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                          Externo
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                        {opt.cedula && (
                                          <span>
                                            <b>C.I:</b> {opt.cedula}
                                          </span>
                                        )}
                                        {opt.celular && (
                                          <span>
                                            <b>Tel:</b> {opt.celular}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* CARD 2: Información del Proyecto */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Edit01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Información del Proyecto
                  </h2>
                  <p className="text-xs text-slate-500">
                    Título principal y especificaciones de la edición requerida
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Título del proyecto <span className="text-[#fd761a]">*</span>
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => updateField("titulo", e.target.value)}
                    onBlur={() => blurField("titulo")}
                    placeholder="Ej. Edición video promocional Q1, Reel institucional..."
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs sm:text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400",
                      touched.titulo && errors.titulo
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.titulo && errors.titulo && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium mt-1">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      {errors.titulo}
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    Descripción / Especificaciones
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    placeholder="Describe el alcance del trabajo, duración esperada, estilo de edición, formato de entrega, etc..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Fechas del Proyecto */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Calendar03Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Cronograma de Entrega
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fecha de recepción de material y plazo límite comprometido
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha Recibo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Fecha de solicitud / recibo <span className="text-[#fd761a]">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaRecibo}
                    onChange={(e) => updateField("fecha_recibo", e.target.value)}
                    onBlur={() => blurField("fecha_recibo")}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs sm:text-sm font-semibold text-slate-800 outline-none transition-all",
                      touched.fecha_recibo && errors.fecha_recibo
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.fecha_recibo && errors.fecha_recibo && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium mt-1">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      {errors.fecha_recibo}
                    </p>
                  )}
                </div>

                {/* Fecha Límite */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Fecha Límite de Entrega <span className="text-[#fd761a]">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => updateField("fecha_limite", e.target.value)}
                    onBlur={() => blurField("fecha_limite")}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs sm:text-sm font-semibold text-slate-800 outline-none transition-all",
                      touched.fecha_limite && errors.fecha_limite
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.fecha_limite && errors.fecha_limite && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium mt-1">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      {errors.fecha_limite}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 4: Presupuesto y Descuentos */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Presupuesto y Tarifa
                  </h2>
                  <p className="text-xs text-slate-500">
                    Establece el precio pactado por el servicio de edición
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    Precio Acordado ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioCobrado}
                      onChange={(e) => setPrecioCobrado(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 pl-8 pr-14 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all placeholder:text-slate-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 uppercase">
                      USD
                    </span>
                  </div>

                  {precioOriginalNum > 0 && showDescuento && montoDescuentoCalculado > 0 && (
                    <div className="flex items-center justify-between text-xs px-1 pt-1">
                      <span className="text-slate-400">
                        Base: <span className="line-through">${precioOriginalNum.toFixed(2)}</span>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Neto con descuento: ${precioCobradoFinal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sección de Descuento */}
                {!showDescuento ? (
                  <button
                    type="button"
                    onClick={() => setShowDescuento(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-100/60 px-3 py-1.5 text-xs font-semibold text-[#fd761a] transition-all cursor-pointer"
                  >
                    <Tag size={13} />
                    <span>+ Aplicar descuento al trabajo</span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-orange-200/80 bg-orange-50/30 p-4 space-y-3 mt-2">
                    <div className="flex items-center justify-between border-b border-orange-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-orange-100 text-[#fd761a] shadow-xs">
                          <Tag size={13} />
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Descuento al trabajo
                        </span>
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#fd761a]">
                          Monto fijo
                        </span>
                        {montoDescuentoCalculado > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            -${montoDescuentoCalculado.toFixed(2)} USD
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDescuento(false)
                          setDescuentoValor("")
                          setMotivoDescuento("")
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Quitar descuento"
                      >
                        <X size={14} />
                        <span>Quitar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-0.5">
                      {/* Monto fijo */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Monto fijo ($ USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={descuentoValor}
                            onChange={(e) => setDescuentoValor(e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                          />
                        </div>
                      </div>

                      {/* Motivo */}
                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Motivo o justificación
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Descuento cliente frecuente, convenio institucional..."
                          value={motivoDescuento}
                          onChange={(e) => setMotivoDescuento(e.target.value)}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 5: Equipo de Edición */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Equipo de Editores Asignados
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecciona uno o más editores responsables de la postproducción
                  </p>
                </div>
              </div>

              {personas.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-xs text-slate-400 italic">
                  <Loader2 size={16} className="animate-spin text-[#fd761a]" />
                  <span>Cargando lista de personal...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {personas.map((p) => {
                    const selected = editorIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleEditor(p.id)}
                        className={cn(
                          "flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer active:scale-[0.98]",
                          selected
                            ? "border-[#fd761a] bg-orange-50/50 shadow-2xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <div
                          className={cn(
                            "size-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                            selected ? "bg-[#fd761a]" : "bg-slate-300 text-slate-700"
                          )}
                        >
                          {p.nombres.charAt(0)}
                          {p.apellidos?.charAt(0) || ""}
                        </div>
                        <div className="text-left min-w-0">
                          <span
                            className={cn(
                              "block truncate max-w-[120px] font-bold",
                              selected ? "text-slate-900" : "text-slate-700"
                            )}
                          >
                            {p.nombres} {p.apellidos}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate capitalize">
                            {p.tipo}
                          </span>
                        </div>
                        {selected && (
                          <div className="size-4 rounded-full bg-[#fd761a] text-white flex items-center justify-center shrink-0">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {editorIds.length > 0 && (
                <p className="text-[11px] font-semibold text-[#fd761a] flex items-center gap-1.5 pt-1">
                  <Check size={13} strokeWidth={2.5} />
                  <span>
                    {editorIds.length} editor{editorIds.length !== 1 ? "es" : ""} asignado
                    {editorIds.length !== 1 ? "s" : ""}
                  </span>
                </p>
              )}
            </div>

            {/* CARD 6: Notas Adicionales */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Note03Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Notas y Observaciones
                  </h2>
                  <p className="text-xs text-slate-500">
                    Instrucciones internas, referencias de material o enlaces a carpetas de almacenamiento
                  </p>
                </div>
              </div>

              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Notas internas, carpetas de Google Drive, enlaces a referencias..."
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Columna Derecha: Resumen Sticky de Liquidación (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={VideoIcon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resumen del Proyecto
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verificación contable y cronograma
                  </p>
                </div>
              </div>

              {/* Responsable */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cliente Solicitante
                </span>
                {selectedCliente ? (
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedCliente.nombres} {selectedCliente.apellidos}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={13} />
                    <span>Sin cliente seleccionado</span>
                  </p>
                )}
              </div>

              {/* Datos Clave del Proyecto */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400 font-medium">Título:</span>
                  <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">
                    {titulo.trim() || "Sin título aún"}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-medium">Recepción:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateDisplay(fechaRecibo)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-medium">Entrega límite:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    {fechaLimite ? formatDateDisplay(fechaLimite) : "Por definir"}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-medium">Editores:</span>
                  <span className="font-bold text-slate-900">
                    {editorIds.length > 0
                      ? `${editorIds.length} asignado${editorIds.length !== 1 ? "s" : ""}`
                      : "Sin asignar"}
                  </span>
                </div>
              </div>

              {/* Totales y Liquidación */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Precio bruto convenido:</span>
                  <span className="font-bold text-slate-900">
                    ${precioOriginalNum.toFixed(2)}
                  </span>
                </div>

                {showDescuento && montoDescuentoCalculado > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuento aplicado:</span>
                    <span>-${montoDescuentoCalculado.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/80 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Total a Facturar:</span>
                  <span className="text-2xl font-black text-[#fd761a] tabular-nums">
                    ${(precioCobrado ? precioCobradoFinal : 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-11 rounded-xl bg-[#fd761a] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isEdit ? "Guardando cambios..." : "Registrando trabajo..."}</span>
                    </>
                  ) : (
                    <span>{isEdit ? "Actualizar Trabajo" : "Registrar Trabajo"}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/servicios/edicion-video")}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Modal para Crear Nuevo Cliente Externo */}
        <NuevoClienteModal
          isOpen={showNuevoCliente}
          onClose={() => setShowNuevoCliente(false)}
          onCreated={handleNewClienteCreated}
        />
      </div>
    </div>
  )
}
