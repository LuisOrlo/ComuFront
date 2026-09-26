import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useParams } from "react-router"
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
import {
  UserPlus,
  Loader2,
  Mic,
  Tag,
  Users,
  X,
  FileText,
  Plus,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getCachedAvailability } from "@/lib/availabilityCache"
import {
  podcastService,
  type PaquetePodcast,
  type ReservaPodcast,
} from "@/services/podcast.service"
import { personasService, type Persona } from "@/services/personas.service"
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

interface Asignacion {
  persona_id: string
  rol: string
  persona?: { nombres: string; apellidos: string }
}

export function NuevaReservaIndividualPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const [paqueteId, setPaqueteId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [horaFin, setHoraFin] = useState("10:00")
  const [titulo, setTitulo] = useState("")
  const [notas, setNotas] = useState("")
  const [saving, setSaving] = useState(false)
  const [estadoOriginal, setEstadoOriginal] = useState<ReservaPodcast["estado"]>("pendiente")
  const [loadingReserva, setLoadingReserva] = useState(isEdit)
  const [horarioOriginal, setHorarioOriginal] = useState<{ fecha: string; horaInicio: string; horaFin: string } | null>(null)
  const [conflicto, setConflicto] = useState<ReservaPodcast | null>(null)
  const [verificandoConflicto, setVerificandoConflicto] = useState(false)
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loadingPaquetes, setLoadingPaquetes] = useState(true)

  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")

  // Descuentos
  const [descuentoTipo, setDescuentoTipo] = useState<"fijo" | "porcentaje">("fijo")
  const [descuentoValor, setDescuentoValor] = useState<string>("")
  const [motivoDescuento, setMotivoDescuento] = useState<string>("")
  const [showDescuento, setShowDescuento] = useState(false)
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  const [personas, setPersonas] = useState<Persona[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])

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

  const personalOperativo = useMemo(() => {
    return personas.filter((p) => {
      if (p.es_activo === false) return false
      const tipo = (p.tipo || "").toLowerCase()
      const cargo = (p.perfilStaff?.cargo || "").toLowerCase()
      if (["admin", "administrador", "secretaria", "secretario", "estudiante"].includes(tipo)) return false
      if (cargo.includes("admin") || cargo.includes("secretar")) return false
      return ["instructor", "staff", "pasante"].includes(tipo)
    })
  }, [personas])

  useEffect(() => {
    podcastService
      .getPaquetes()
      .then((data) => {
        setPaquetes(data)
        if (!isEdit) {
          setPaqueteId(data[0]?.id || "")
        }
      })
      .catch(() => toast.error("Error al cargar paquetes"))
      .finally(() => setLoadingPaquetes(false))
  }, [isEdit])

  // Cargar personal operativo (instructor, staff, pasante) - Excluyendo admin y secretaria
  useEffect(() => {
    personasService
      .getPersonas({ tipo: "instructor,staff,pasante", activos: "true", page: 1, per_page: 100 })
      .then((res) => setPersonas(res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    let active = true
    setLoadingReserva(true)
    podcastService
      .getReserva(id)
      .then((r) => {
        if (!active) return
        const f = r.fecha_reserva?.substring(0, 10) || new Date().toISOString().split("T")[0]
        const hi = r.hora_inicio?.substring(0, 5) || "08:00"
        const hf = r.hora_fin?.substring(0, 5) || "10:00"
        setPaqueteId(r.paquete_id || "")
        setFecha(f)
        setHoraInicio(hi)
        setHoraFin(hf)
        setHorarioOriginal({ fecha: f, horaInicio: hi, horaFin: hf })
        setTitulo(r.titulo || "")
        setNotas(r.notas || "")
        setEstadoOriginal(r.estado)

        if (r.persona_id && r.persona) {
          const opt: ClienteOption = {
            tipo: "persona",
            id: r.persona_id,
            nombres: r.persona.nombres || "",
            apellidos: r.persona.apellidos || "",
            cedula: r.persona.cedula,
            correo: r.persona.correo,
            personaTipo: r.persona.tipo,
          }
          setClienteId(r.persona_id)
          setClienteTipo("persona")
          setSelectedCliente(opt)
          setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
        } else if (r.cliente_externo_id && r.cliente_externo) {
          const opt: ClienteOption = {
            tipo: "cliente_externo",
            id: r.cliente_externo_id,
            nombres: r.cliente_externo.nombres || "",
            apellidos: r.cliente_externo.apellidos || "",
            cedula: r.cliente_externo.cedula,
            correo: r.cliente_externo.correo,
            celular: r.cliente_externo.celular,
          }
          setClienteId(r.cliente_externo_id)
          setClienteTipo("cliente_externo")
          setSelectedCliente(opt)
          setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
        }

        if (r.monto_descuento && Number(r.monto_descuento) > 0) {
          setShowDescuento(true)
          setDescuentoTipo("fijo")
          setDescuentoValor(r.monto_descuento.toString())
          setMotivoDescuento(r.motivo_descuento || "")
        }

        if (r.asignaciones && r.asignaciones.length > 0) {
          setAsignaciones(
            r.asignaciones.map((a) => ({
              persona_id: a.persona_id,
              rol: a.rol || "Técnico de audio",
              persona: a.persona
                ? { nombres: a.persona.nombres, apellidos: a.persona.apellidos }
                : undefined,
            }))
          )
        }
      })
      .catch(() => {
        toast.error("Error al cargar la reserva de podcast")
        navigate("/servicios/podcast")
      })
      .finally(() => {
        if (active) setLoadingReserva(false)
      })
    return () => {
      active = false
    }
  }, [id, isEdit, navigate])

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
        personasService.getPersonas({
          buscar: q,
          tipo: "estudiante,instructor,pasante,staff",
          per_page: 50,
          page: 1,
        }),
        clientesService.getClientes({ search: q, per_page: 50 }),
      ])
        .then(([personasRes, clientesRes]) => {
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
        .catch(() => setClientesDisponibles([]))
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
    if (loadingReserva) {
      setConflicto(null)
      return
    }

    if (!fecha || !horaInicio || !horaFin || horaFin <= horaInicio) {
      setConflicto(null)
      return
    }

    // Si estamos en edición y la fecha/horario no cambiaron respecto al original, no hay conflicto que reportar
    if (isEdit && horarioOriginal) {
      const sinCambios =
        fecha === horarioOriginal.fecha &&
        horaInicio === horarioOriginal.horaInicio &&
        horaFin === horarioOriginal.horaFin

      if (sinCambios) {
        setConflicto(null)
        return
      }
    }

    let active = true
    const timer = setTimeout(async () => {
      setVerificandoConflicto(true)
      try {
        const data = await getCachedAvailability(`podcast:${fecha}`, () =>
          podcastService.getReservas({ fecha })
        )
        if (!active) return
        const reservas = Array.isArray(data) ? data : []
        const conflictoEncontrado =
          reservas.find(
            (r: ReservaPodcast) =>
              String(r.id) !== String(id) &&
              r.fecha_reserva === fecha &&
              r.estado !== "cancelado" &&
              horaInicio < r.hora_fin &&
              horaFin > r.hora_inicio
          ) || null
        setConflicto(conflictoEncontrado)
      } catch {
        if (active) setConflicto(null)
      } finally {
        if (active) setVerificandoConflicto(false)
      }
    }, 400)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [fecha, horaInicio, horaFin, id, isEdit, loadingReserva, horarioOriginal])

  const selectCliente = (opt: ClienteOption) => {
    setClienteId(opt.id)
    setClienteTipo(opt.tipo)
    setSelectedCliente(opt)
    setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
    setShowClienteDropdown(false)
    setErrors((prev) => {
      const n = { ...prev }
      delete n.cliente
      return n
    })
  }

  const clearCliente = () => {
    setClienteId("")
    setClienteTipo("")
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

  const paqueteSeleccionado = useMemo(
    () => paquetes.find((p) => p.id === paqueteId),
    [paqueteId, paquetes]
  )

  const calcularHoras = () => {
    if (!horaInicio || !horaFin) return 0
    const [h1, m1] = horaInicio.split(":").map(Number)
    const [h2, m2] = horaFin.split(":").map(Number)
    const mins = h2 * 60 + m2 - (h1 * 60 + m1)
    if (mins <= 0) return 0
    return Math.round((mins / 60) * 100) / 100
  }

  const horas = calcularHoras()
  const precioOriginal =
    paqueteSeleccionado && horas > 0
      ? Math.round(horas * Number(paqueteSeleccionado.precio_por_hora) * 100) / 100
      : 0
  let montoDescuento = 0
  if (showDescuento && descuentoValor) {
    if (descuentoTipo === "fijo") {
      montoDescuento = Math.min(precioOriginal, Math.max(0, Number(descuentoValor) || 0))
    } else {
      montoDescuento =
        Math.round(((precioOriginal * (Number(descuentoValor) || 0)) / 100) * 100) / 100
    }
  }
  const precioTotal = Math.max(0, Math.round((precioOriginal - montoDescuento) * 100) / 100)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!paqueteId) newErrors.paquete = "Debe seleccionar un paquete de podcast"
    if (!fecha) newErrors.fecha = "La fecha es obligatoria"
    if (!horaInicio) newErrors.horaInicio = "La hora de inicio es obligatoria"
    if (!horaFin) newErrors.horaFin = "La hora de fin es obligatoria"
    if (horaInicio && horaFin && calcularHoras() <= 0)
      newErrors.horaFin = "Debe ser posterior a la hora de inicio"
    if (!clienteId) newErrors.cliente = "Debe seleccionar un cliente responsable"
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
        precio_original: showDescuento ? precioOriginal : null,
        monto_descuento: showDescuento ? montoDescuento : 0,
        motivo_descuento: showDescuento ? motivoDescuento : null,
        estado: isEdit ? estadoOriginal : "pendiente",
        asignaciones: asignaciones.map((a) => ({
          persona_id: a.persona_id,
          rol: a.rol?.trim() || null,
        })),
      }
      if (clienteTipo === "persona") {
        payload.persona_id = clienteId
        payload.cliente_externo_id = null
      } else {
        payload.persona_id = null
        payload.cliente_externo_id = clienteId
      }
      if (isEdit && id) {
        await podcastService.updateReserva(id, payload)
        toast.success("Reserva de podcast actualizada exitosamente")
      } else {
        await podcastService.createReserva(payload)
        toast.success("Reserva de podcast creada exitosamente")
      }
      navigate("/servicios/podcast")
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } }
        }
      )?.response?.data
      if (msg?.message) toast.error(msg.message)
      if (msg?.errors) Object.values(msg.errors).flat().forEach((m) => toast.error(m))
      else
        toast.error(
          isEdit ? "Error al actualizar la reserva" : "Error al guardar la reserva"
        )
    } finally {
      setSaving(false)
    }
  }

  if (loadingPaquetes || loadingReserva) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">
            {loadingReserva ? "Cargando reserva de podcast..." : "Cargando paquetes..."}
          </p>
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
              onClick={() => navigate("/servicios/podcast")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver a Reservas de Podcast"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {isEdit ? "Editar Reserva de Podcast" : "Nueva Reserva de Podcast"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? "Modifica los datos del episodio, paquete y asignación de la cabina"
                  : "Registra una sesión individual en el estudio de podcast"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              {isEdit ? "Modo Edición" : "Modo Individual"}
            </span>
          </div>
        </div>

        {/* Formulario en Grid Bento de 2 Columnas */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Cliente, Sesión, Staff y Descuentos (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Cliente / Responsable del Programa */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Cliente / Responsable del Programa
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna la persona o institución que contrata las sesiones de cabina
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

            {/* Card 2: Paquete y Horario de Cabina */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <Mic size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Paquete y Horario de Cabina
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecciona el plan contratado, fecha de grabación y horario
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Paquete */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Paquete de Podcast</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={paqueteId}
                  onChange={(e) => {
                    setPaqueteId(e.target.value)
                    setErrors((prev) => {
                      const n = { ...prev }
                      delete n.paquete
                      return n
                    })
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                >
                  <option value="">Seleccionar paquete...</option>
                  {paquetes
                    .filter((x) => x.activo || x.id === paqueteId)
                    .map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.nombre} • ${Number(pkg.precio_por_hora).toFixed(2)}/sesión
                      </option>
                    ))}
                </select>
                {paqueteSeleccionado && (
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Mic size={13} className="text-[#fd761a]" />
                    <span>
                      Paquete seleccionado: <b>{paqueteSeleccionado.nombre}</b>
                    </span>
                    <span>•</span>
                    <span>
                      Tarifa: <b>${Number(paqueteSeleccionado.precio_por_hora).toFixed(2)} / sesión</b>
                    </span>
                  </div>
                )}
                {touched.paquete && errors.paquete && (
                  <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                    <span>{errors.paquete}</span>
                  </p>
                )}
              </div>

              {/* Grid Fecha y Horarios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} size={13} className="text-slate-400" />
                    <span>Fecha de Grabación</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => {
                      setFecha(e.target.value)
                      setErrors((prev) => {
                        const n = { ...prev }
                        delete n.fecha
                        return n
                      })
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, fecha: true }))}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 outline-none transition-all",
                      touched.fecha && errors.fecha
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                  {touched.fecha && errors.fecha && (
                    <p className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.fecha}</span>
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
                      setErrors((prev) => {
                        const n = { ...prev }
                        delete n.horaInicio
                        return n
                      })
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
                      setErrors((prev) => {
                        const n = { ...prev }
                        delete n.horaFin
                        return n
                      })
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
                  <span>Verificando disponibilidad de horario en cabina...</span>
                </div>
              )}

              {conflicto && !verificandoConflicto && (
                <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/90 flex items-start gap-2.5 text-xs text-red-800">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold">Conflicto de horario detectado:</span>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Ya existe una reserva en este horario: {conflicto.hora_inicio?.substring(0, 5)} – {conflicto.hora_fin?.substring(0, 5)}
                      {conflicto.titulo
                        ? ` (${conflicto.titulo})`
                        : conflicto.paquete?.nombre
                        ? ` (${conflicto.paquete.nombre})`
                        : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Detalles de Grabación (Título y Notas) */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Detalles del Episodio y Producción
                  </h2>
                  <p className="text-xs text-slate-500">
                    Título temático y observaciones técnicas para la cabina
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} className="text-slate-400" />
                    <span>Título o Tema del Episodio</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Entrevista especial a emprendedores #12..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} className="text-slate-400" />
                    <span>Notas o Requerimientos Técnicos</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Número de micrófonos, grabación multipista, monitoreo especial..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Personal Asignado a Cabina (Staff) */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Personal Asignado en Cabina
                    </h2>
                    <p className="text-xs text-slate-500">
                      Técnicos de audio, productores o pasantes a cargo de la sesión
                    </p>
                  </div>
                </div>

                <div className="w-52 sm:w-64">
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      const p = personas.find((x) => x.id === e.target.value)
                      setAsignaciones((prev) => [
                        ...prev,
                        {
                          persona_id: e.target.value,
                          rol: "Técnico de audio",
                          persona: p ? { nombres: p.nombres, apellidos: p.apellidos } : undefined,
                        },
                      ])
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-[#fd761a] cursor-pointer shadow-2xs"
                  >
                    <option value="">+ Asignar personal...</option>
                    {personalOperativo
                      .filter((p) => !asignaciones.some((a) => a.persona_id === p.id))
                      .map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.nombres} {person.apellidos} ({person.tipo})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Lista de personal asignado */}
              {asignaciones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {asignaciones.map((asig, i) => {
                    const person =
                      personas.find((x) => x.id === asig.persona_id) || asig.persona
                    return (
                      <div
                        key={asig.persona_id}
                        className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {person?.nombres?.charAt(0) || "P"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {person ? `${person.nombres} ${person.apellidos}` : "Personal"}
                            </p>
                            <input
                              type="text"
                              value={asig.rol}
                              placeholder="Rol (ej. Técnico audio)"
                              onChange={(e) => {
                                const rol = e.target.value
                                setAsignaciones((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, rol } : item))
                                )
                              }}
                              className="text-[11px] text-slate-500 bg-transparent border-b border-dashed border-slate-300 focus:border-[#fd761a] outline-none mt-0.5"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setAsignaciones((prev) =>
                              prev.filter((item) => item.persona_id !== asig.persona_id)
                            )
                          }
                          className="size-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Remover asignación"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No hay personal técnico asignado a esta sesión de podcast todavía.
                </p>
              )}
            </div>

            {/* Card 5: Descuento / Ajuste de Tarifa */}
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
                        placeholder="Ej: Cliente frecuente, grabación continua..."
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Sin descuentos aplicados a esta sesión.
                </p>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Liquidación y Confirmación (4 cols sticky) */}
          <div className="lg:col-span-4 sticky top-6 flex flex-col gap-5">
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Liquidación de Cabina
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
                  Detalle del Paquete
                </span>
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">
                    {paqueteSeleccionado?.nombre || "Paquete de Podcast"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fecha} • {horas.toFixed(1)}h ({horaInicio} – {horaFin})
                    {titulo ? ` • ${titulo}` : ""}
                  </p>
                  {paqueteSeleccionado?.precio_por_hora && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      Tarifa: ${Number(paqueteSeleccionado.precio_por_hora).toFixed(2)}/sesión
                    </p>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Horas de cabina:</span>
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
                  <span className="text-2xl font-black text-[#fd761a] tracking-tight">
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
                  onClick={() => navigate("/servicios/podcast")}
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
  const { id } = useParams<{ id?: string }>()
  return id ? <NuevaReservaIndividualPage /> : <ReservaBatchForm />
}
