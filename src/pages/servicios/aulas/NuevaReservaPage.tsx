import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useParams, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Search01Icon,
  Cancel01Icon,
  UserIcon,
  Calendar03Icon,
  Clock01Icon,
  Money01Icon,
  AlertCircleIcon,
  CheckmarkCircle04Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2, Building2, Tag, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCachedAvailability } from "@/lib/availabilityCache"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { personasService } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { NuevoClienteModal } from "@/components/clientes/NuevoClienteModal"
import { toast } from "sonner"
import { ReservaBatchForm } from "./components/ReservaBatchForm"

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

export function NuevaReservaIndividualPage() {
  const navigate = useNavigate()
  const { aulaId, id } = useParams<{ aulaId?: string; id?: string }>()
  const isEdit = !!id
  const location = useLocation()
  const state = location.state as { fecha_reserva?: string; hora_inicio?: string; hora_fin?: string } | null

  const [aula, setAula] = useState<Aula | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [selectedAulaId, setSelectedAulaId] = useState<string>(aulaId || "")
  const [loading, setLoading] = useState(true)
  const [estadoOriginal, setEstadoOriginal] = useState<string>("reservado")

  const [fechaReserva, setFechaReserva] = useState(state?.fecha_reserva || new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState(state?.hora_inicio || "08:00")
  const [horaFin, setHoraFin] = useState(state?.hora_fin || "10:00")

  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  const [saving, setSaving] = useState(false)

  // Descuentos
  const [descuentoTipo, setDescuentoTipo] = useState<"fijo" | "porcentaje">("fijo")
  const [descuentoValor, setDescuentoValor] = useState<string>("")
  const [motivoDescuento, setMotivoDescuento] = useState<string>("")
  const [showDescuento, setShowDescuento] = useState(false)

  const [conflicto, setConflicto] = useState<ReservaAula | null>(null)
  const [verificandoConflicto, setVerificandoConflicto] = useState(false)
  const [horarioOriginal, setHorarioOriginal] = useState<{ fecha: string; horaInicio: string; horaFin: string; aulaId?: string } | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const personasEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "persona"),
    [clientesDisponibles]
  )
  const externosEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "cliente_externo"),
    [clientesDisponibles]
  )

  useEffect(() => {
    const init = async () => {
      try {
        const todas = await aulasService.getAulas()
        setAulas(todas)

        if (isEdit) {
          if (!id) { navigate("/servicios/aulas"); return }
          const r = await aulasService.getReserva(id)
          const f = r.fecha_reserva?.substring(0, 10) || new Date().toISOString().split("T")[0]
          const hi = r.hora_inicio?.substring(0, 5) || "08:00"
          const hf = r.hora_fin?.substring(0, 5) || "10:00"
          setEstadoOriginal(r.estado)
          setFechaReserva(f)
          setHoraInicio(hi)
          setHoraFin(hf)
          setHorarioOriginal({ fecha: f, horaInicio: hi, horaFin: hf, aulaId: r.aula_id })
          if (r.persona_id) {
            const opt: ClienteOption = {
              tipo: "persona",
              id: r.persona_id,
              nombres: r.persona?.nombres || "",
              apellidos: r.persona?.apellidos || "",
              personaTipo: r.persona?.tipo,
              cedula: r.persona?.cedula,
              correo: r.persona?.correo,
            }
            setSelectedCliente(opt)
            setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
          } else if (r.cliente_externo_id) {
            const opt: ClienteOption = {
              tipo: "cliente_externo",
              id: r.cliente_externo_id,
              nombres: r.cliente_externo?.nombres || "",
              apellidos: r.cliente_externo?.apellidos || "",
              cedula: r.cliente_externo?.cedula,
              correo: r.cliente_externo?.correo,
              celular: r.cliente_externo?.celular,
            }
            setSelectedCliente(opt)
            setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
          }
          if (r.monto_descuento && r.monto_descuento > 0) {
            setShowDescuento(true)
            setDescuentoTipo("fijo")
            setDescuentoValor(r.monto_descuento.toString())
            setMotivoDescuento(r.motivo_descuento || "")
          }
          const aulaReserva = todas.find(a => a.id === r.aula_id) || null
          setAula(aulaReserva)
          setSelectedAulaId(r.aula_id)
        } else {
          if (aulaId) {
            setSelectedAulaId(aulaId)
            const aulaSel = todas.find(a => a.id === aulaId) || null
            setAula(aulaSel)
          } else if (todas.length > 0) {
            setSelectedAulaId(todas[0].id)
            setAula(todas[0])
          }
        }
      } catch {
        toast.error("Error al cargar datos de la reserva")
        navigate("/servicios/aulas")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [isEdit, id, aulaId, navigate])

  useEffect(() => {
    const q = clienteSearch.trim()
    if (q.length < 2) {
      setClientesDisponibles([])
      setSearchingCliente(false)
      return
    }
    const timer = setTimeout(() => {
      setSearchingCliente(true)
      Promise.allSettled([
        personasService.getPersonas({ buscar: q, tipo: "estudiante,instructor,pasante,staff", per_page: 50, page: 1 }),
        clientesService.getClientes({ search: q, per_page: 50 }),
      ]).then(([personasRes, clientesRes]) => {
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
              personaTipo: p.tipo,
            })
          }
        }
        if (clientesRes.status === "fulfilled") {
          for (const c of (clientesRes.value.data as ClienteExterno[])) {
            if (results.some(r => r.tipo === "cliente_externo" && r.id === c.id)) continue
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
      }).catch(() => setClientesDisponibles([]))
        .finally(() => setSearchingCliente(false))
    }, 250)
    return () => clearTimeout(timer)
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

  useEffect(() => {
    if (loading) {
      setConflicto(null)
      return
    }

    const aulaActual = aula?.id
    if (!aulaActual || !fechaReserva || !horaInicio || !horaFin || horaFin <= horaInicio) {
      setConflicto(null)
      return
    }

    // Si estamos editando y el horario/fecha/aula no ha cambiado respecto al original, no hay conflicto
    if (isEdit && horarioOriginal) {
      const sinCambios =
        fechaReserva === horarioOriginal.fecha &&
        horaInicio === horarioOriginal.horaInicio &&
        horaFin === horarioOriginal.horaFin &&
        aulaActual === horarioOriginal.aulaId

      if (sinCambios) {
        setConflicto(null)
        return
      }
    }

    let active = true
    const timer = setTimeout(async () => {
      setVerificandoConflicto(true)
      try {
        const reservas = await getCachedAvailability(
          `aula:${aulaActual}:${fechaReserva}`,
          () => aulasService.getReservas({ aula_id: aulaActual, fecha_inicio: fechaReserva, fecha_fin: fechaReserva })
        )
        if (!active) return
        const conflictoEncontrado = (Array.isArray(reservas) ? reservas : []).find(r =>
          String(r.id) !== String(id) &&
          r.fecha_reserva === fechaReserva &&
          r.estado !== "cancelado" &&
          horaInicio < r.hora_fin && horaFin > r.hora_inicio
        ) || null
        setConflicto(conflictoEncontrado)
      } catch {
        if (active) setConflicto(null)
      } finally {
        if (active) setVerificandoConflicto(false)
      }
    }, 400)
    return () => { active = false; clearTimeout(timer) }
  }, [isEdit, aula, fechaReserva, horaInicio, horaFin, id, loading, horarioOriginal])

  const handleAulaChange = (newAulaId: string) => {
    const nuevaAula = aulas.find(a => a.id === newAulaId) || null
    setSelectedAulaId(newAulaId)
    setAula(nuevaAula)
  }

  const calcularHoras = () => {
    if (!horaInicio || !horaFin) return 0
    const [h1, m1] = horaInicio.split(":").map(Number)
    const [h2, m2] = horaFin.split(":").map(Number)
    const mins = h2 * 60 + m2 - (h1 * 60 + m1)
    if (mins <= 0) return 0
    return Math.round((mins / 60) * 100) / 100
  }

  const horas = calcularHoras()
  const precioOriginal = aula && horas > 0 ? Math.round(horas * Number(aula.precio_hora) * 100) / 100 : 0
  let montoDescuento = 0
  if (showDescuento && descuentoValor) {
    if (descuentoTipo === "fijo") {
      montoDescuento = Math.min(precioOriginal, Math.max(0, Number(descuentoValor) || 0))
    } else {
      montoDescuento = Math.round((precioOriginal * (Number(descuentoValor) || 0) / 100) * 100) / 100
    }
  }
  const precioTotal = Math.max(0, Math.round((precioOriginal - montoDescuento) * 100) / 100)

  const selectCliente = (opt: ClienteOption) => {
    setSelectedCliente(opt)
    setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
    setShowClienteDropdown(false)
    setErrors(prev => { const n = { ...prev }; delete n.cliente; return n })
  }

  const clearCliente = () => {
    setSelectedCliente(null)
    setClienteSearch("")
    setClientesDisponibles([])
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
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!fechaReserva) newErrors.fechaReserva = "La fecha es obligatoria"
    if (!horaInicio) newErrors.horaInicio = "La hora de inicio es obligatoria"
    if (!horaFin) newErrors.horaFin = "La hora de fin es obligatoria"
    if (horaInicio && horaFin && horaFin <= horaInicio)
      newErrors.horaFin = "Debe ser posterior a la hora de inicio"
    if (!selectedCliente)
      newErrors.cliente = "Debe seleccionar un cliente responsable"
    if (!selectedAulaId)
      newErrors.aula = "Debe seleccionar un aula"
    setErrors(newErrors)
    setTouched({ fechaReserva: true, horaInicio: true, horaFin: true, cliente: true, aula: true })
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
        precio_original: showDescuento ? precioOriginal : null,
        monto_descuento: showDescuento ? montoDescuento : 0,
        motivo_descuento: showDescuento ? motivoDescuento : null,
      }
      if (isEdit) {
        payload.estado = estadoOriginal
      } else {
        payload.estado = "reservado"
      }
      if (selectedCliente?.tipo === "persona") {
        payload.persona_id = selectedCliente.id
        payload.cliente_externo_id = null
      } else {
        payload.persona_id = null
        payload.cliente_externo_id = selectedCliente!.id
      }

      if (isEdit && id) {
        await aulasService.updateReserva(id, payload)
        toast.success("Reserva actualizada exitosamente")
      } else {
        await aulasService.createReserva(payload)
        toast.success("Reserva creada exitosamente")
      }
      navigate("/servicios/aulas")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (isEdit ? "Error al actualizar reserva" : "Error al crear reserva")
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando reserva de aula...</p>
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
              onClick={() => navigate("/servicios/aulas")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver a Gestión de Aulas"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {isEdit ? "Editar Reserva de Aula" : "Nueva Reserva de Aula"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? "Modifica los datos y asignación de la reserva seleccionada"
                  : "Registra una reserva para un aula del instituto"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              {isEdit ? "Modo Edición" : "Modo Individual"}
            </span>
          </div>
        </div>

        {/* Formulario en Grid de 2 Columnas Bento */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Cliente, Aula y Horarios (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Cliente / Responsable Asignado */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Cliente / Responsable
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna la persona o institución responsable de la reserva
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
                            Responsable asignado
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
                        title="Cambiar cliente responsable"
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
                      placeholder="Ingresa al menos 2 letras para iniciar la búsqueda..."
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
                    <span>Escribe al menos 2 letras para buscar estudiantes, instructores o clientes externos.</span>
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
                                {externosEnLista.map((opt) => (
                                  <button
                                    key={`ext-${opt.id}`}
                                    type="button"
                                    onClick={() => selectCliente(opt)}
                                    className="w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-emerald-50/60 border-l-4 border-l-transparent hover:border-l-emerald-600 flex items-center gap-3 cursor-pointer"
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
                                        {opt.cedula && <span><b>C.I:</b> {opt.cedula}</span>}
                                        {opt.celular && <span><b>Tel:</b> {opt.celular}</span>}
                                        {opt.correo && (
                                          <span className="truncate max-w-[200px]">{opt.correo}</span>
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

                  {touched.cliente && errors.cliente && (
                    <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1.5">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.cliente}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Card 2: Espacio y Horario de Reserva */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Calendar03Icon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Espacio y Horario de Reserva
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecciona el aula disponible, fecha y rango de horas
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Aula */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Aula a reservar</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAulaId}
                  onChange={(e) => handleAulaChange(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                >
                  <option value="">Seleccionar aula...</option>
                  {aulas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} • Capacidad: {a.capacidad} PAX • ${Number(a.precio_hora).toFixed(2)}/sesión
                    </option>
                  ))}
                </select>
                {aula && (
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Building2 size={13} className="text-[#fd761a]" />
                    <span>Capacidad: <b>{aula.capacidad} personas</b></span>
                    <span>•</span>
                    <span>Tarifa: <b>${Number(aula.precio_hora).toFixed(2)} / sesión</b></span>
                  </div>
                )}
                {touched.aula && errors.aula && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                    <span>{errors.aula}</span>
                  </p>
                )}
              </div>

              {/* Grid Fecha y Horarios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} size={13} className="text-slate-400" />
                    <span>Fecha</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaReserva}
                    onChange={(e) => {
                      setFechaReserva(e.target.value)
                      setErrors((prev) => { const n = { ...prev }; delete n.fechaReserva; return n })
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, fechaReserva: true }))}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 outline-none transition-all",
                      touched.fechaReserva && errors.fechaReserva
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.fechaReserva && errors.fechaReserva && (
                    <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.fechaReserva}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                    <span>Hora Inicio</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => {
                      setHoraInicio(e.target.value)
                      setErrors((prev) => { const n = { ...prev }; delete n.horaInicio; return n })
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, horaInicio: true }))}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 outline-none transition-all",
                      touched.horaInicio && errors.horaInicio
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.horaInicio && errors.horaInicio && (
                    <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.horaInicio}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                    <span>Hora Fin</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => {
                      setHoraFin(e.target.value)
                      setErrors((prev) => { const n = { ...prev }; delete n.horaFin; return n })
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, horaFin: true }))}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 outline-none transition-all",
                      touched.horaFin && errors.horaFin
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.horaFin && errors.horaFin && (
                    <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.horaFin}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Indicador de verificación y conflicto */}
              {verificandoConflicto && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin text-[#fd761a]" />
                  <span>Verificando disponibilidad de horario...</span>
                </div>
              )}

              {conflicto && !verificandoConflicto && (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/90 flex items-start gap-2.5 text-xs text-red-800">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold">Conflicto de horario detectado:</span>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Ya existe una reserva en este horario: {conflicto.hora_inicio?.substring(0, 5)} – {conflicto.hora_fin?.substring(0, 5)}
                      {conflicto.persona
                        ? ` (${conflicto.persona.nombres} ${conflicto.persona.apellidos || ""}`.trim() + ")"
                        : conflicto.cliente_externo
                        ? ` (${conflicto.cliente_externo.nombres} ${conflicto.cliente_externo.apellidos || ""}`.trim() + ")"
                        : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Descuento / Ajuste de Tarifa */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                    <Tag size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Descuento y Ajustes de Tarifa
                    </h2>
                    <p className="text-xs text-slate-500">
                      Aplica rebajas especiales o motivos de descuento institucional
                    </p>
                  </div>
                </div>

                {!showDescuento && (
                  <button
                    type="button"
                    onClick={() => setShowDescuento(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#fd761a] hover:bg-orange-100 border border-orange-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus size={13} />
                    <span>Agregar Descuento</span>
                  </button>
                )}
              </div>

              {showDescuento ? (
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950">Configurar Descuento</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDescuento(false)
                        setDescuentoValor("")
                        setMotivoDescuento("")
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer flex items-center gap-1"
                    >
                      <X size={13} />
                      <span>Quitar descuento</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Tipo
                      </label>
                      <select
                        value={descuentoTipo}
                        onChange={(e) => setDescuentoTipo(e.target.value as "fijo" | "porcentaje")}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a]"
                      >
                        <option value="fijo">Monto Fijo ($)</option>
                        <option value="porcentaje">Porcentaje (%)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Valor del Descuento
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={descuentoValor}
                          onChange={(e) => setDescuentoValor(e.target.value)}
                          placeholder={descuentoTipo === "fijo" ? "0.00" : "0"}
                          className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a]"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {descuentoTipo === "fijo" ? "$" : "%"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Motivo / Razón
                      </label>
                      <input
                        type="text"
                        value={motivoDescuento}
                        onChange={(e) => setMotivoDescuento(e.target.value)}
                        placeholder="Ej: Convenio institucional"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Sin descuentos aplicados a esta reserva.
                </p>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Reserva y Confirmación (4 cols sticky) */}
          <div className="lg:col-span-4 sticky top-6 flex flex-col gap-5">
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resumen de Reserva
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo estimado de la sesión
                  </p>
                </div>
              </div>

              {/* Badge de Cliente Vinculado */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Responsable
                </span>
                {selectedCliente ? (
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedCliente.nombres} {selectedCliente.apellidos}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={13} />
                    <span>Selecciona un cliente para continuar</span>
                  </p>
                )}
              </div>

              {/* Desglose de la Sesión */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detalle del Espacio
                </span>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">
                    {aula?.nombre || "Aula no seleccionada"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fechaReserva} • {horas.toFixed(1)}h ({horaInicio} – {horaFin})
                  </p>
                  {aula?.precio_hora && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      Tarifa: ${Number(aula.precio_hora).toFixed(2)}/sesión
                    </p>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Horas reservadas:</span>
                  <span className="font-bold text-slate-900">{horas.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal bruto:</span>
                  <span className="font-bold text-slate-900">${precioOriginal.toFixed(2)}</span>
                </div>
                {showDescuento && montoDescuento > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuento aplicado:</span>
                    <span>-${montoDescuento.toFixed(2)}</span>
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
                    1 sesión {isEdit ? "en edición" : "reservada"}
                  </p>
                </div>
                <div className="text-right">
                  {showDescuento && montoDescuento > 0 && (
                    <span className="text-xs text-slate-400 line-through block">
                      ${precioOriginal.toFixed(2)}
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
                  disabled={!selectedCliente || saving || !!conflicto}
                  className={cn(
                    "w-full h-11 px-5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2",
                    selectedCliente && !saving && !conflicto
                      ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer shadow-orange-500/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando cambios...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                      <span>{isEdit ? "Guardar Cambios" : "Confirmar Reserva"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/servicios/aulas")}
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
          onCreated={handleNewClienteCreated}
        />
      </div>
    </div>
  )
}

export function NuevaReservaPage() {
  const { id, aulaId } = useParams<{ id?: string; aulaId?: string }>()
  const location = useLocation()
  const state = location.state as { fecha_reserva?: string; hora_inicio?: string; hora_fin?: string } | null
  return id ? <NuevaReservaIndividualPage /> : (
    <ReservaBatchForm
      initialAulaId={aulaId}
      initialDate={state?.fecha_reserva}
      initialStart={state?.hora_inicio}
      initialEnd={state?.hora_fin}
    />
  )
}
