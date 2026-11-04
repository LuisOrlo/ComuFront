import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Video,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  UserPlus,
  Search,
  X,
  Tag,
  Coins,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { setsService, type SetItem } from "@/services/sets.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { NuevoClienteModal } from "@/components/clientes/NuevoClienteModal"
import { toast } from "sonner"

interface ClienteOption {
  tipo: "persona" | "cliente_externo"
  id: string
  nombres?: string
  apellidos?: string
  nombre_empresa?: string
  tipo_cliente?: "persona" | "empresa"
  cedula?: string
  correo?: string
  celular?: string
  personaTipo?: string
}

const HORAS_OPCIONES = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
]

export function NuevaReservaSetPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const preselectedSetId = searchParams.get("set")

  const isEdit = Boolean(id)

  const [sets, setSets] = useState<SetItem[]>([])
  const [loadingSets, setLoadingSets] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cliente Selection State
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  // Form Fields
  const [selectedSetId, setSelectedSetId] = useState<string>(preselectedSetId || "")
  const [fechaReserva, setFechaReserva] = useState(() => new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState("09:00")
  const [horaFin, setHoraFin] = useState("11:00")

  // Descuentos y Recargos Toggles & Values
  const [showDescuento, setShowDescuento] = useState(false)
  const [descuento, setDescuento] = useState("")
  const [motivoDescuento, setMotivoDescuento] = useState("")

  const [showRecargo, setShowRecargo] = useState(false)
  const [recargo, setRecargo] = useState("")
  const [motivoRecargo, setMotivoRecargo] = useState("")

  const [observaciones, setObservaciones] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar catálogo de sets
  useEffect(() => {
    setsService
      .getSets()
      .then((data) => {
        setSets(data || [])
        if (data && data.length > 0) {
          setSelectedSetId((prev) => prev || data[0].id)
        }
      })
      .catch(() => toast.error("Error al cargar los sets"))
      .finally(() => setLoadingSets(false))
  }, [])

  // Cargar datos para edición si existe id
  useEffect(() => {
    if (!id) return
    setsService
      .getReserva(id)
      .then((r) => {
        setSelectedSetId(r.set_id)
        setFechaReserva(r.fecha_reserva)
        setHoraInicio(r.hora_inicio?.substring(0, 5) || "09:00")
        setHoraFin(r.hora_fin?.substring(0, 5) || "11:00")

        const descVal = Number(r.monto_descuento || 0)
        if (descVal > 0) {
          setShowDescuento(true)
          setDescuento(String(descVal))
          setMotivoDescuento(r.motivo_descuento || "")
        }

        const recVal = Number(r.monto_recargo || 0)
        if (recVal > 0) {
          setShowRecargo(true)
          setRecargo(String(recVal))
          setMotivoRecargo(r.motivo_recargo || "")
        }

        setObservaciones(r.observaciones || "")

        if (r.persona) {
          setCliente({
            tipo: "persona",
            id: r.persona.id || r.persona_id || "",
            nombres: r.persona.nombres || "",
            apellidos: r.persona.apellidos || "",
            cedula: r.persona.cedula,
            celular: r.persona.celular,
            correo: r.persona.correo,
            personaTipo: r.persona.tipo,
          })
        } else if (r.cliente_externo) {
          setCliente({
            tipo: "cliente_externo",
            id: r.cliente_externo.id || r.cliente_externo_id || "",
            nombres: r.cliente_externo.nombres || "",
            apellidos: r.cliente_externo.apellidos || "",
            nombre_empresa: r.cliente_externo.nombre_empresa,
            tipo_cliente: r.cliente_externo.tipo_cliente,
            cedula: r.cliente_externo.cedula || r.cliente_externo.ruc,
            celular: r.cliente_externo.celular,
            correo: r.cliente_externo.correo,
          })
        }
      })
      .catch(() => {
        toast.error("Error al cargar los datos de la reserva")
        navigate("/servicios/sets")
      })
  }, [id, navigate])

  // Búsqueda de clientes institucional / externo
  useEffect(() => {
    const q = clienteSearch.trim()
    if (q.length < 2) {
      setClientesDisponibles([])
      setSearchingCliente(false)
      return
    }

    setSearchingCliente(true)
    const timer = setTimeout(() => {
      Promise.allSettled([
        personasService.getPersonas({ buscar: q, tipo: "estudiante,instructor,pasante,staff", per_page: 50, page: 1 }),
        clientesService.getClientes({ search: q, per_page: 50 }),
      ])
        .then(([people, external]) => {
          const result: ClienteOption[] = []
          if (people.status === "fulfilled") {
            const val = people.value as unknown
            const data: Persona[] = Array.isArray(val)
              ? (val as Persona[])
              : ((val as { data?: Persona[] })?.data || [])
            if (Array.isArray(data)) {
              result.push(
                ...data.map((p) => ({
                  tipo: "persona" as const,
                  id: p.id,
                  nombres: p.nombres,
                  apellidos: p.apellidos || "",
                  cedula: p.cedula,
                  correo: p.correo,
                  celular: p.celular,
                  personaTipo: p.tipo,
                }))
              )
            }
          }
          if (external.status === "fulfilled") {
            const extVal = external.value as unknown
            const data: ClienteExterno[] = Array.isArray(extVal)
              ? (extVal as ClienteExterno[])
              : ((extVal as { data?: ClienteExterno[] })?.data || [])
            for (const c of data) {
              if (result.some((r) => r.tipo === "cliente_externo" && r.id === c.id)) continue
              result.push({
                tipo: "cliente_externo" as const,
                id: c.id,
                nombres: c.nombres || c.nombre_empresa || "Cliente",
                apellidos: c.apellidos || "",
                nombre_empresa: c.nombre_empresa,
                tipo_cliente: c.tipo_cliente,
                cedula: c.cedula || c.ruc,
                correo: c.correo,
                celular: c.celular,
              })
            }
          }
          setClientesDisponibles(result)
        })
        .finally(() => setSearchingCliente(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [clienteSearch])

  // Cerrar dropdown al hacer click fuera
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
    setCliente(opt)
    setClienteSearch("")
    setClientesDisponibles([])
    setShowClienteDropdown(false)
    if (errors.cliente) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.cliente
        return next
      })
    }
  }

  const clearCliente = () => {
    setCliente(null)
    setClienteSearch("")
    setClientesDisponibles([])
    setShowClienteDropdown(false)
  }

  const currentSet = useMemo(() => {
    return sets.find((s) => s.id === selectedSetId)
  }, [sets, selectedSetId])

  // Cálculo de horas y totales
  const horasCalculadas = useMemo(() => {
    const hIni = parseInt(horaInicio.split(":")[0], 10)
    const hFin = parseInt(horaFin.split(":")[0], 10)
    return Math.max(1, hFin - hIni)
  }, [horaInicio, horaFin])

  const precioBase = Number(currentSet?.precio_hora || 0)
  const subtotal = Math.round(precioBase * horasCalculadas * 100) / 100
  const numDescuento = showDescuento ? Math.min(subtotal, Math.max(0, Number(descuento) || 0)) : 0
  const numRecargo = showRecargo ? Math.max(0, Number(recargo) || 0) : 0
  const precioTotal = Math.max(0, Math.round((subtotal - numDescuento + numRecargo) * 100) / 100)

  const personasEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "persona"),
    [clientesDisponibles]
  )
  const externosEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "cliente_externo"),
    [clientesDisponibles]
  )

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!selectedSetId) nextErrors.set = "Debes seleccionar un set de grabación."
    if (!cliente) nextErrors.cliente = "Debes seleccionar el responsable del alquiler."
    if (!fechaReserva) nextErrors.fecha = "Indica la fecha de la reserva."

    const hIni = parseInt(horaInicio.split(":")[0], 10)
    const hFin = parseInt(horaFin.split(":")[0], 10)
    if (hFin <= hIni) {
      nextErrors.horaFin = "La hora de fin debe ser posterior a la de inicio."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !cliente) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        set_id: selectedSetId,
        fecha_reserva: fechaReserva,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        precio_total: precioTotal,
        precio_original: numDescuento > 0 || numRecargo > 0 ? subtotal : null,
        monto_descuento: numDescuento,
        motivo_descuento: numDescuento > 0 ? motivoDescuento.trim() : null,
        monto_recargo: numRecargo,
        motivo_recargo: numRecargo > 0 ? motivoRecargo.trim() : null,
        observaciones: observaciones.trim() || null,
        persona_id: cliente.tipo === "persona" ? cliente.id : null,
        cliente_externo_id: cliente.tipo === "cliente_externo" ? cliente.id : null,
      }

      if (isEdit && id) {
        await setsService.updateReserva(id, payload)
        toast.success("Reserva actualizada exitosamente")
      } else {
        await setsService.createReserva(payload)
        toast.success("Alquiler de set agendado exitosamente")
      }

      navigate("/servicios/sets")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "No se pudo registrar la reserva")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header Principal de la Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/servicios/sets")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver a Reservas de Sets"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {isEdit ? "Editar Reserva de Set" : "Reserva de Set de Grabación"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              {isEdit ? "Modo Edición" : "Nueva Reserva"}
            </span>
          </div>
        </div>

        {/* Formulario en Grid de 2 Columnas Bento */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Cliente, Set y Horarios (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Cliente / Responsable Asignado */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Cliente / Responsable
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna la persona o institución responsable del alquiler
                    </p>
                  </div>
                </div>

                {!cliente && (
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
              {cliente ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white border-2 border-emerald-500/80 shadow-xs transition-all animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="size-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-base shadow-sm">
                        {(cliente.nombre_empresa || cliente.nombres || "C").charAt(0).toUpperCase()}
                        {cliente.tipo_cliente === "empresa"
                          ? ""
                          : (cliente.apellidos?.charAt(0) || "")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                            <CheckCircle2 size={11} />
                            <span>
                              {cliente.tipo === "persona"
                                ? cliente.personaTipo || "Institucional"
                                : cliente.tipo_cliente === "empresa"
                                ? "Empresa"
                                : "Cliente Externo"}
                            </span>
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            Responsable asignado
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {cliente.nombre_empresa || `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim()}
                        </h3>
                        {cliente.tipo_cliente === "empresa" && cliente.nombres && cliente.nombres !== cliente.nombre_empresa && (
                          <p className="text-xs text-slate-500 font-medium">
                            Contacto: {cliente.nombres} {cliente.apellidos || ""}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                          {cliente.cedula && (
                            <span className="font-medium">
                              <span className="text-slate-400">
                                {cliente.tipo_cliente === "empresa" ? "RUC / ID:" : "C.I:"}
                              </span>{" "}
                              {cliente.cedula}
                            </span>
                          )}
                          {cliente.celular && (
                            <span className="font-medium">
                              <span className="text-slate-400">Tel:</span> {cliente.celular}
                            </span>
                          )}
                          {cliente.correo && (
                            <span className="font-medium">
                              <span className="text-slate-400">Email:</span> {cliente.correo}
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
                        title="Cambiar cliente responsable"
                      >
                        <X size={14} />
                        <span>Cambiar cliente</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Buscador de Clientes */
                <div className="relative" ref={clienteRef}>
                  <div className="relative">
                    <Search
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
                      placeholder="Ingresa al menos 2 letras para iniciar la búsqueda..."
                      className={cn(
                        "w-full h-11 pl-10 pr-10 rounded-xl border bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all",
                        errors.cliente
                          ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                          : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                      )}
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
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info size={13} className="text-slate-400 shrink-0" />
                    <span>Escribe al menos 2 letras para buscar estudiantes, docentes o clientes externos.</span>
                  </p>

                  {errors.cliente && (
                    <span className="text-[11px] text-red-500 font-semibold block mt-1">
                      {errors.cliente}
                    </span>
                  )}

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
                            <span>Buscando coincidencias para &quot;{clienteSearch}&quot;...</span>
                          </div>
                        ) : clientesDisponibles.length === 0 ? (
                          <div className="p-6 text-center space-y-2">
                            <p className="text-xs font-semibold text-slate-600">
                              No se encontraron coincidencias para &quot;{clienteSearch}&quot;
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Verifica la ortografía o registra al cliente como externo.
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
                              <span>Registrar &quot;{clienteSearch}&quot; como Nuevo Cliente</span>
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
                              <span className="text-[10px] text-slate-400">Haz clic para seleccionar</span>
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
                                      {(opt.nombres || "P").charAt(0)}
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
                                        {opt.cedula && <span><b>C.I:</b> {opt.cedula}</span>}
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
                                {externosEnLista.map((opt) => {
                                  const displayName =
                                    opt.nombre_empresa ||
                                    `${opt.nombres || ""} ${opt.apellidos || ""}`.trim() ||
                                    "Cliente Externo"
                                  const initial = (opt.nombre_empresa || opt.nombres || "E")
                                    .charAt(0)
                                    .toUpperCase()

                                  return (
                                    <button
                                      key={`externo-${opt.id}`}
                                      type="button"
                                      onClick={() => selectCliente(opt)}
                                      className="w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-emerald-50/60 border-l-4 border-l-transparent hover:border-l-emerald-500 flex items-center gap-3 cursor-pointer"
                                    >
                                      <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700 font-bold text-xs">
                                        {initial}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-bold text-slate-900 truncate">
                                            {displayName}
                                          </span>
                                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                            {opt.tipo_cliente === "empresa" ? "Empresa" : "Externo"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                          {opt.cedula && (
                                            <span>
                                              <b>{opt.tipo_cliente === "empresa" ? "RUC:" : "C.I:"}</b>{" "}
                                              {opt.cedula}
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
                                  )
                                })}
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

            {/* Card 2: Espacio y Set de Grabación */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Video size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Espacio y Set de Grabación
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecciona el set a utilizar para el alquiler
                    </p>
                  </div>
                </div>

                {currentSet && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                    ${Number(currentSet.precio_hora).toFixed(2)}/hora
                  </span>
                )}
              </div>

              {loadingSets ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#fd761a]" />
                  <span>Cargando sets disponibles...</span>
                </div>
              ) : sets.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-700">No hay sets registrados en el catálogo</p>
                  <button
                    type="button"
                    onClick={() => navigate("/servicios/sets/gestion")}
                    className="text-xs font-semibold text-[#fd761a] hover:underline cursor-pointer"
                  >
                    Ir a Gestión de Sets para crear uno
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {sets.map((s) => {
                    const isSelected = s.id === selectedSetId
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSetId(s.id)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative",
                          isSelected
                            ? "border-[#fd761a] bg-orange-50/40 ring-2 ring-[#fd761a]/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">{s.nombre}</span>
                            {isSelected && (
                              <div className="size-5 rounded-full bg-[#fd761a] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                                ✓
                              </div>
                            )}
                          </div>
                          {s.descripcion && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                              {s.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Tarifa</span>
                          <span className="text-xs font-black text-slate-900">
                            ${Number(s.precio_hora || 0).toFixed(2)}{" "}
                            <span className="text-[10px] font-medium text-slate-400">/hr</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {errors.set && (
                <span className="text-[11px] text-red-500 font-semibold block mt-1">
                  {errors.set}
                </span>
              )}
            </div>

            {/* Card 3: Fecha, Horario y Condiciones */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Programación y Horario
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configura la fecha y el rango de horas de uso
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#fd761a] bg-orange-50 border border-orange-100 px-3 py-1 rounded-xl">
                  {horasCalculadas} hr{horasCalculadas !== 1 ? "s" : ""} de duración
                </span>
              </div>

              {/* Grid Fecha y Horas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Fecha */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span>Fecha de Reserva <span className="text-[#fd761a]">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={fechaReserva}
                    onChange={(e) => setFechaReserva(e.target.value)}
                    className={cn(
                      "w-full h-10 px-3 rounded-xl border bg-white text-xs font-semibold text-slate-800 outline-none transition-all",
                      errors.fecha
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {errors.fecha && (
                    <span className="text-[10px] text-red-500 font-medium block">
                      {errors.fecha}
                    </span>
                  )}
                </div>

                {/* Hora Inicio */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>Hora Inicio <span className="text-[#fd761a]">*</span></span>
                  </label>
                  <select
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                  >
                    {HORAS_OPCIONES.slice(0, -1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hora Fin */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>Hora Fin <span className="text-[#fd761a]">*</span></span>
                  </label>
                  <select
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className={cn(
                      "w-full h-10 px-3 rounded-xl border bg-white text-xs font-bold text-slate-800 outline-none transition-all",
                      errors.horaFin
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  >
                    {HORAS_OPCIONES.slice(1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {errors.horaFin && (
                    <span className="text-[10px] text-red-500 font-medium block">
                      {errors.horaFin}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones para agregar Descuento o Recargo */}
              {(!showDescuento || !showRecargo) && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {!showDescuento && (
                    <button
                      type="button"
                      onClick={() => setShowDescuento(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#fd761a] hover:text-orange-700 bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200/70 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                      <Tag size={13} />
                      <span>+ Aplicar descuento a esta reserva</span>
                    </button>
                  )}
                  {!showRecargo && (
                    <button
                      type="button"
                      onClick={() => setShowRecargo(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/70 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                      <Tag size={13} />
                      <span>+ Aplicar recargo a esta reserva</span>
                    </button>
                  )}
                </div>
              )}

              {/* Sub-card Descuento Opcional */}
              {showDescuento && (
                <div className="rounded-xl border border-orange-200/80 bg-orange-50/40 p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-orange-200/50">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-orange-100 text-[#fd761a] flex items-center justify-center">
                        <Tag size={12} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Descuento Opcional
                      </span>
                      {subtotal > 0 && (
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          (Subtotal base: ${subtotal.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDescuento(false)
                        setDescuento("")
                        setMotivoDescuento("")
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Quitar descuento"
                    >
                      <X size={12} />
                      <span>Quitar descuento</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Coins size={12} className="text-slate-400" />
                        <span>Descuento ($)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={descuento}
                          onChange={(e) => setDescuento(e.target.value)}
                          className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Motivo del Descuento
                      </label>
                      <input
                        type="text"
                        maxLength={255}
                        placeholder="Ej. Convenio institucional, cliente frecuente, pronto pago..."
                        value={motivoDescuento}
                        onChange={(e) => setMotivoDescuento(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-card Recargo Opcional */}
              {showRecargo && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-200/50">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Tag size={12} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Recargo Adicional Opcional
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRecargo(false)
                        setRecargo("")
                        setMotivoRecargo("")
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Quitar recargo"
                    >
                      <X size={12} />
                      <span>Quitar recargo</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Coins size={12} className="text-slate-400" />
                        <span>Recargo ($)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={recargo}
                          onChange={(e) => setRecargo(e.target.value)}
                          className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Motivo del Recargo
                      </label>
                      <input
                        type="text"
                        maxLength={255}
                        placeholder="Ej. Horario nocturno, equipo de luces adicional, fin de semana..."
                        value={motivoRecargo}
                        onChange={(e) => setMotivoRecargo(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Observaciones o Notas Adicionales <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. El cliente traerá sus propias cámaras, requiere fondo croma o iluminación especial..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Liquidación de Alquiler Sticky (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Liquidación de Alquiler
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo consolidado del servicio
                  </p>
                </div>
              </div>

              {/* Badge de Cliente Vinculado */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Responsable
                </span>
                {cliente ? (
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {cliente.nombre_empresa || `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim()}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle size={13} />
                    <span>Selecciona un cliente para continuar</span>
                  </p>
                )}
              </div>

              {/* Desglose de Liquidación */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detalle del Servicio
                </span>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold">{currentSet?.nombre || "Set de grabación"}</span>
                    <span className="font-bold text-slate-900">${precioBase.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Fecha:</span>
                    <span className="font-medium text-slate-700">{fechaReserva}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Horario:</span>
                    <span className="font-medium text-slate-700">{horaInicio} – {horaFin}</span>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Horas calculadas:</span>
                  <span className="font-bold text-slate-900">{horasCalculadas} hr{horasCalculadas !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal base:</span>
                  <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                {numDescuento > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuento aplicado:</span>
                    <span>-${numDescuento.toFixed(2)}</span>
                  </div>
                )}
                {numRecargo > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Recargo adicional:</span>
                    <span>+${numRecargo.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Caja Oscura con Total Final a Facturar */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total a Facturar
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {horasCalculadas} hora{horasCalculadas !== 1 ? "s" : ""} de alquiler
                  </p>
                </div>
                <div className="text-right">
                  {(numDescuento > 0 || numRecargo > 0) && (
                    <span className="text-xs text-slate-400 line-through block">
                      ${subtotal.toFixed(2)}
                    </span>
                  )}
                  <span className="text-2xl font-black text-white tracking-tight">
                    ${precioTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={!cliente || saving}
                  className={cn(
                    "w-full h-11 px-5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2",
                    cliente && !saving
                      ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer shadow-orange-500/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando reserva...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{isEdit ? "Actualizar Reserva" : "Confirmar y Guardar Reserva"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/servicios/sets")}
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Modal de Registro de Nuevo Cliente Externo */}
        <NuevoClienteModal
          isOpen={showNuevoCliente}
          onClose={() => setShowNuevoCliente(false)}
          onCreated={(c) => {
            selectCliente({
              tipo: "cliente_externo",
              id: c.id,
              nombres: c.nombres || c.nombre_empresa || "Cliente",
              apellidos: c.apellidos || "",
              nombre_empresa: c.nombre_empresa,
              tipo_cliente: c.tipo_cliente,
              cedula: c.cedula || c.ruc,
              correo: c.correo,
              celular: c.celular,
            })
            setShowNuevoCliente(false)
          }}
        />
      </div>
    </div>
  )
}
