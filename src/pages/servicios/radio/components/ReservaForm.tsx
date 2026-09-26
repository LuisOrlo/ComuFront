import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  Clock01Icon,
  UserIcon,
  Search01Icon,
  Cancel01Icon,
  CheckmarkCircle04Icon,
  AlertCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import {
  UserPlus,
  Loader2,
  Tag,
  Radio,
  X,
  RadioTower,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { radioService, type TarifaRadio, type ReservaRadio } from "@/services/radio.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { NuevoClienteModal } from "@/components/clientes/NuevoClienteModal"
import { OperadorSelector, type OperadorOption } from "./OperadorSelector"
import { toast } from "sonner"

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

const calculateEndTime = (horaInicio: string, duracionMinutos: string) => {
  const [h, m] = (horaInicio || "08:00").split(":").map(Number)
  const duration = Math.max(15, Math.min(480, Number(duracionMinutos) || 60))
  const total = h * 60 + m + duration
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

export function ReservaForm({
  isOpen,
  onClose,
  tarifas: propTarifas,
  editingReserva,
  fechaPreseleccionada,
  horaPreseleccionada,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  tarifas: TarifaRadio[]
  editingReserva?: ReservaRadio | null
  fechaPreseleccionada?: string
  horaPreseleccionada?: string
  onSaved: () => void
}) {
  const [tarifas, setTarifas] = useState<TarifaRadio[]>(propTarifas || [])
  const [tarifaId, setTarifaId] = useState("")
  const [fecha, setFecha] = useState("")
  const [horaInicio, setHoraInicio] = useState("08:00")
  const [duracionInput, setDuracionInput] = useState("60")
  const [incluyeOperador, setIncluyeOperador] = useState(false)
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState("")
  const [saving, setSaving] = useState(false)

  // Descuento
  const [descuentoTipo] = useState<"fijo" | "porcentaje">("fijo")
  const [descuentoValor, setDescuentoValor] = useState<string>("")
  const [motivoDescuento, setMotivoDescuento] = useState<string>("")
  const [showDescuento, setShowDescuento] = useState(false)

  // Cliente
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  // Operadores
  const [personas, setPersonas] = useState<Persona[]>([])

  // Horario original para evitar falsos positivos de conflicto
  const horarioOriginal = useRef<{ fecha: string; hora_inicio: string; hora_fin: string } | null>(null)
  const [conflicto, setConflicto] = useState<string | null>(null)
  const [checkingConflict, setCheckingConflict] = useState(false)

  // Cargar tarifas si faltan
  useEffect(() => {
    if (propTarifas && propTarifas.length > 0) {
      setTarifas(propTarifas)
    } else {
      radioService.getTarifas().then(setTarifas).catch(() => {})
    }
  }, [propTarifas])

  // Cargar operadores operativos (instructor, staff, pasante) - Excluyendo administradores y secretaría
  useEffect(() => {
    personasService
      .getPersonas({ tipo: "instructor,staff,pasante", activos: "true", per_page: 100 })
      .then((res) => setPersonas(res.data || []))
      .catch(() => setPersonas([]))
  }, [])

  const operadores: OperadorOption[] = useMemo(() => {
    return personas
      .filter((p) => {
        if (p.es_activo === false) return false
        const tipo = (p.tipo || "").toLowerCase()
        const cargo = (p.perfilStaff?.cargo || "").toLowerCase()
        if (["admin", "administrador", "secretaria", "secretario", "estudiante"].includes(tipo)) return false
        if (cargo.includes("admin") || cargo.includes("secretar")) return false
        return ["instructor", "staff", "pasante"].includes(tipo)
      })
      .map((p) => ({
        id: p.id,
        nombres: p.nombres,
        apellidos: p.apellidos || "",
        cargo:
          p.perfilStaff?.cargo ||
          p.perfilInstructor?.especialidad ||
          (p.tipo === "instructor" ? "Profesor" : p.tipo === "pasante" ? "Pasante" : "Staff"),
      }))
  }, [personas])

  // Inicializar datos al abrir en modo edición
  useEffect(() => {
    if (!isOpen) return

    if (editingReserva) {
      setTarifaId(String(editingReserva.tarifa_id))
      setFecha(editingReserva.fecha_reserva)
      const hIni = editingReserva.hora_inicio.substring(0, 5)
      const hFin = editingReserva.hora_fin.substring(0, 5)
      setHoraInicio(hIni)

      const [hi, mi] = hIni.split(":").map(Number)
      const [hf, mf] = hFin.split(":").map(Number)
      const durMin = (hf * 60 + mf) - (hi * 60 + mi)
      setDuracionInput(String(durMin > 0 ? durMin : 60))

      setIncluyeOperador(Boolean(editingReserva.incluye_operador))
      setOperadorId(editingReserva.operador_id || null)
      setObservaciones(editingReserva.observaciones || "")

      horarioOriginal.current = {
        fecha: editingReserva.fecha_reserva,
        hora_inicio: hIni,
        hora_fin: hFin,
      }

      // Cliente asignado
      if (editingReserva.persona_id) {
        personasService
          .getPersonaById(editingReserva.persona_id)
          .then((p) => {
            setCliente({
              tipo: "persona",
              id: p.id,
              nombres: p.nombres,
              apellidos: p.apellidos || "",
              cedula: p.cedula,
              correo: p.correo,
              personaTipo: p.tipo,
            })
          })
          .catch(() => {
            if (editingReserva.persona) {
              setCliente({
                tipo: "persona",
                id: editingReserva.persona.id,
                nombres: editingReserva.persona.nombres,
                apellidos: editingReserva.persona.apellidos || "",
              })
            }
          })
      } else if (editingReserva.cliente_externo) {
        setCliente({
          tipo: "cliente_externo",
          id: editingReserva.cliente_externo.id,
          nombres: editingReserva.cliente_externo.nombres,
          apellidos: (editingReserva.cliente_externo as { apellidos?: string }).apellidos || "",
          cedula: editingReserva.cliente_externo.cedula,
          correo: editingReserva.cliente_externo.correo,
          celular: editingReserva.cliente_externo.celular,
        })
      }
    } else {
      setTarifaId(tarifas[0]?.id ? String(tarifas[0].id) : "")
      setFecha(fechaPreseleccionada || new Date().toISOString().split("T")[0])
      setHoraInicio(horaPreseleccionada || "08:00")
      setDuracionInput("60")
      setIncluyeOperador(false)
      setOperadorId(null)
      setObservaciones("")
      setCliente(null)
      horarioOriginal.current = null
    }
  }, [isOpen, editingReserva, fechaPreseleccionada, horaPreseleccionada, tarifas])

  // Búsqueda en vivo de clientes
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
        personasService.getPersonas({
          buscar: q,
          tipo: "estudiante,instructor,pasante,staff",
          per_page: 50,
          page: 1,
        }),
        clientesService.getClientes({ search: q, per_page: 50 }),
      ])
        .then(([people, external]) => {
          const result: ClienteOption[] = []
          if (people.status === "fulfilled") {
            result.push(
              ...people.value.data.map((p) => ({
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
          if (external.status === "fulfilled") {
            const data =
              (external.value as { data: ClienteExterno[] }).data ||
              (external.value as ClienteExterno[])
            for (const c of Array.isArray(data) ? data : []) {
              if (result.some((r) => r.tipo === "cliente_externo" && r.id === c.id)) continue
              result.push({
                tipo: "cliente_externo" as const,
                id: c.id,
                nombres: c.nombres,
                apellidos: c.apellidos || "",
                cedula: c.cedula,
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
  }

  const clearCliente = () => {
    setCliente(null)
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
  }

  // Cálculos de tiempo
  const duracionMinutos = useMemo(() => {
    const n = parseInt(duracionInput)
    return isNaN(n) || n < 1 ? 60 : Math.min(Math.max(n, 15), 480)
  }, [duracionInput])

  const horaFin = useMemo(() => {
    return calculateEndTime(horaInicio, String(duracionMinutos))
  }, [horaInicio, duracionMinutos])

  // Tarifa seleccionada
  const tarifaSeleccionada = useMemo(
    () => tarifas.find((t) => String(t.id) === String(tarifaId)),
    [tarifaId, tarifas]
  )

  // Cálculos de Precios
  const precioOriginal = useMemo(() => {
    if (!tarifaSeleccionada) return 0
    const horas = duracionMinutos / 60
    return Math.round(horas * tarifaSeleccionada.precio_por_hora * 100) / 100
  }, [tarifaSeleccionada, duracionMinutos])

  let montoDescuentoCalculado = 0
  if (showDescuento && descuentoValor) {
    if (descuentoTipo === "fijo") {
      montoDescuentoCalculado = Number(descuentoValor) || 0
    } else {
      montoDescuentoCalculado = (precioOriginal * (Number(descuentoValor) || 0)) / 100
    }
  }
  montoDescuentoCalculado = Math.min(precioOriginal, Math.max(0, montoDescuentoCalculado))
  const precioFinal = Math.max(0, precioOriginal - montoDescuentoCalculado)

  // Verificación de Conflictos de Horario
  useEffect(() => {
    if (!fecha || !horaInicio || !horaFin) return

    // Si está en modo edición y no se ha modificado la fecha ni las horas originales, omitir conflicto
    if (
      editingReserva &&
      horarioOriginal.current &&
      fecha === horarioOriginal.current.fecha &&
      horaInicio === horarioOriginal.current.hora_inicio &&
      horaFin === horarioOriginal.current.hora_fin
    ) {
      setConflicto(null)
      return
    }

    let cancel = false
    setCheckingConflict(true)

    const timer = setTimeout(async () => {
      try {
        const res = await radioService.getReservas({ fecha, per_page: 50 })
        if (cancel) return

        const reservasDelDia = res.data || []
        const conflict = reservasDelDia.find((r) => {
          if (editingReserva && String(r.id) === String(editingReserva.id)) return false
          if (r.estado === "cancelado") return false

          const rIni = r.hora_inicio.substring(0, 5)
          const rFin = r.hora_fin.substring(0, 5)
          return !(rFin <= horaInicio || rIni >= horaFin)
        })

        if (conflict) {
          const clientName =
            conflict.persona
              ? `${conflict.persona.nombres} ${conflict.persona.apellidos}`
              : conflict.cliente_externo?.nombres || "Otro cliente"
          setConflicto(
            `Conflicto de horario: Ya existe una reserva de ${conflict.hora_inicio.substring(0, 5)} a ${conflict.hora_fin.substring(0, 5)} (${clientName})`
          )
        } else {
          setConflicto(null)
        }
      } catch {
        if (!cancel) setConflicto(null)
      } finally {
        if (!cancel) setCheckingConflict(false)
      }
    }, 300)

    return () => {
      cancel = true
      clearTimeout(timer)
    }
  }, [fecha, horaInicio, horaFin, editingReserva])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tarifaId || !fecha || !horaInicio) {
      toast.error("Complete los campos obligatorios de la reserva")
      return
    }

    if (incluyeOperador && !operadorId) {
      toast.error("Seleccione un operador de cabina o desactive 'Incluye operador'")
      return
    }

    if (!cliente) {
      toast.error("Debe asignar un cliente responsable para la reserva")
      return
    }

    if (conflicto) {
      toast.error("Resuelva el conflicto de horario antes de guardar")
      return
    }

    setSaving(true)
    try {
      const normalizarHora = (t: string) => (t.length > 5 ? t.substring(0, 5) : t)

      const payload: Record<string, unknown> = {
        tarifa_id: parseInt(tarifaId),
        fecha_reserva: fecha,
        hora_inicio: normalizarHora(horaInicio),
        hora_fin: normalizarHora(horaFin),
        precio_total: precioFinal,
        precio_original: showDescuento && montoDescuentoCalculado > 0 ? precioOriginal : null,
        monto_descuento: showDescuento && montoDescuentoCalculado > 0 ? montoDescuentoCalculado : 0,
        motivo_descuento:
          showDescuento && montoDescuentoCalculado > 0 && motivoDescuento.trim()
            ? motivoDescuento.trim()
            : null,
        incluye_operador: incluyeOperador,
        operador_id: incluyeOperador ? operadorId : null,
        observaciones: observaciones.trim() || null,
        persona_id: cliente.tipo === "persona" ? cliente.id : null,
        cliente_externo_id: cliente.tipo === "cliente_externo" ? cliente.id : null,
      }

      if (editingReserva) {
        await radioService.updateReserva(editingReserva.id, payload)
        toast.success("Reserva de radio actualizada exitosamente")
      } else {
        await radioService.createReserva(payload)
        toast.success("Reserva de radio creada exitosamente")
      }

      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al procesar la reserva de radio"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const personasEnLista = clientesDisponibles.filter((c) => c.tipo === "persona")
  const externosEnLista = clientesDisponibles.filter((c) => c.tipo === "cliente_externo")

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header Principal de la Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Servicios / Cabina de Radio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#fd761a] border border-orange-200">
                  {editingReserva ? "Modo Edición" : "Nueva Reserva"}
                </span>
                {editingReserva && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 font-mono">
                    ID: #{editingReserva.id}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {editingReserva
                  ? `Editar Reserva de Cabina #${editingReserva.id}`
                  : "Nueva Reserva de Cabina de Radio"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Bento Grid: 8 columnas izquierda + 4 columnas derecha sticky */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda (8 columnas) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Card 1: Cliente / Responsable de la Emisión */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Cliente / Responsable de la Emisión
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna la persona o institución responsable de la emisión radial
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
                      <div className="size-11 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                        {cliente.nombres.charAt(0)}
                        {cliente.apellidos?.charAt(0) || ""}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            {cliente.tipo === "persona" ? "Institucional" : "Cliente Externo"}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            Responsable asignado
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {cliente.nombres} {cliente.apellidos}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
                          {cliente.cedula && (
                            <span className="font-medium">
                              <span className="text-slate-400">C.I:</span> {cliente.cedula}
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

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={clearCliente}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                      >
                        Cambiar cliente
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Buscador de Clientes Unificado */
                <div ref={clienteRef} className="relative">
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
                        if (clienteSearch.trim()) setShowClienteDropdown(true)
                      }}
                      placeholder="Buscar por nombre, apellido, cédula o email institucional..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    {clienteSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setClienteSearch("")
                          setClientesDisponibles([])
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown flotante de resultados */}
                  <AnimatePresence>
                    {showClienteDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100"
                      >
                        {searchingCliente ? (
                          <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-emerald-600" />
                            <span>Buscando personas y clientes...</span>
                          </div>
                        ) : clientesDisponibles.length === 0 ? (
                          <div className="p-6 text-center">
                            <p className="text-xs font-medium text-slate-500">
                              {clienteSearch.length < 2
                                ? "Escribe al menos 2 caracteres para buscar..."
                                : "No se encontraron coincidencias"}
                            </p>
                            {clienteSearch.length >= 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowClienteDropdown(false)
                                  setShowNuevoCliente(true)
                                }}
                                className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                              >
                                + Registrar como nuevo cliente externo
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
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
                                        {opt.cedula && <span><b>C.I:</b> {opt.cedula}</span>}
                                        {opt.celular && <span><b>Tel:</b> {opt.celular}</span>}
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

            {/* Card 2: Tarifa, Horario y Programación */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Calendar03Icon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Programación y Horario de Cabina
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configura la tarifa radial, fecha de emisión y duración del bloque
                    </p>
                  </div>
                </div>

                {tarifaSeleccionada && (
                  <span className="text-xs font-bold text-[#fd761a] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                    ${tarifaSeleccionada.precio_por_hora.toFixed(2)} / hora
                  </span>
                )}
              </div>

              {/* Selector de Tarifa */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Radio size={14} className="text-slate-400" />
                  <span>Tarifa de Radio</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tarifas
                    .filter((t) => t.es_activo)
                    .map((t) => {
                      const isSelected = String(t.id) === String(tarifaId)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTarifaId(String(t.id))}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-[#fd761a] bg-orange-50/50 ring-2 ring-[#fd761a]/15 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          )}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{t.nombre}</p>
                            <p className="text-[10px] text-slate-500">
                              {t.incluye_operador ? "Incluye operador" : "Tarifa estándar"}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-black text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200/80">
                            ${t.precio_por_hora.toFixed(2)}/h
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Fecha y Rango Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Fecha */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Fecha de Emisión</span>
                    {fecha && (
                      <span className="text-[10px] font-semibold text-slate-400 capitalize">
                        {new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
                          weekday: "short",
                        })}
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                    required
                  />
                </div>

                {/* Hora Inicio */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <HugeiconsIcon icon={Clock01Icon} size={12} className="text-slate-400" />
                    <span>Hora Inicio</span>
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all cursor-pointer"
                    required
                  />
                </div>

                {/* Duración */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Duración (Minutos)</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Fin: {horaFin}
                    </span>
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={duracionInput}
                    onChange={(e) => setDuracionInput(e.target.value)}
                    onBlur={() => {
                      const n = parseInt(duracionInput)
                      if (isNaN(n) || n < 15) setDuracionInput("60")
                      else setDuracionInput(String(Math.min(Math.max(n, 15), 480)))
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                  />
                </div>
              </div>

              {/* Botones rápidos de duración */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Rápido:</span>
                {[
                  { label: "30m", val: "30" },
                  { label: "45m", val: "45" },
                  { label: "1h", val: "60" },
                  { label: "1.5h", val: "90" },
                  { label: "2h", val: "120" },
                  { label: "3h", val: "180" },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setDuracionInput(preset.val)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                      duracionInput === preset.val
                        ? "bg-[#fd761a] text-white border-[#fd761a] shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Operador Técnico y Configuración de Emisión */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={UserGroupIcon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Operador Técnico y Emisión
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna un operador de cabina disponible y pauta u observaciones
                    </p>
                  </div>
                </div>

                {incluyeOperador && operadorId && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Operador Asignado
                  </span>
                )}
              </div>

              {/* Selector interactivo de Operador */}
              <div className="space-y-1.5">
                <OperadorSelector
                  operadores={operadores}
                  selectedId={operadorId}
                  incluyeOperador={incluyeOperador}
                  onToggleIncluye={(incluye) => {
                    setIncluyeOperador(incluye)
                    if (!incluye) setOperadorId(null)
                  }}
                  onSelect={(id) => {
                    setOperadorId(id)
                    if (id) setIncluyeOperador(true)
                  }}
                />
              </div>

              {/* Observaciones de la Emisión (Debajo de la sección de Operador Técnico) */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Observaciones de la Emisión
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Ej. Nombre del programa, pauta o indicaciones especiales"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Card 4: Descuento Aplicable a la Reserva */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-5 space-y-4">
              {!showDescuento ? (
                <button
                  type="button"
                  onClick={() => setShowDescuento(true)}
                  className="w-full py-3 px-4 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 text-[#fd761a] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Tag size={15} />
                  <span>+ Aplicar descuento especial a la reserva</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center">
                        <Tag size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          Descuento a la Reserva
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          Aplica un porcentaje o monto fijo de descuento
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {montoDescuentoCalculado > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          -${montoDescuentoCalculado.toFixed(2)} USD
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowDescuento(false)
                          setDescuentoValor("")
                          setMotivoDescuento("")
                        }}
                        className="size-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Quitar descuento"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* Tipo y Valor */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Monto fijo a descontar ($ USD)
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
                          value={descuentoValor}
                          onChange={(e) => setDescuentoValor(e.target.value)}
                          className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
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
                        placeholder="Ej. Convenio institucional, cliente frecuente..."
                        value={motivoDescuento}
                        onChange={(e) => setMotivoDescuento(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha Sticky (4 columnas) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            {/* Card Resumen Consolidado */}
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RadioTower size={16} className="text-[#fd761a]" />
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resumen de la Reserva
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Cabina Radio
                </span>
              </div>

              {/* Items del resumen */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Cliente</span>
                  <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                    {cliente ? `${cliente.nombres} ${cliente.apellidos}` : "No asignado"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Fecha</span>
                  <span className="font-bold text-slate-900">{fecha || "No definida"}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Horario</span>
                  <span className="font-bold text-slate-900">
                    {horaInicio} – {horaFin} ({duracionMinutos} min)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Tarifa</span>
                  <span className="font-bold text-slate-900">
                    {tarifaSeleccionada ? tarifaSeleccionada.nombre : "No seleccionada"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Operador</span>
                  <span className="font-bold text-slate-900">
                    {incluyeOperador && operadorId
                      ? operadores.find((op) => String(op.id) === String(operadorId))
                          ?.nombres || "Asignado"
                      : "Auto-servicio"}
                  </span>
                </div>
              </div>

              {/* Alerta de Conflicto de Horario */}
              {conflicto && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                    <span>Conflicto Detectado</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{conflicto}</p>
                </div>
              )}

              {/* Liquidación Financiera Destacada */}
              <div className="rounded-xl bg-slate-900 text-white p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Subtotal ({duracionMinutos / 60} hrs)</span>
                  <span className="font-medium">${precioOriginal.toFixed(2)}</span>
                </div>

                {showDescuento && montoDescuentoCalculado > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-400">
                    <span>Descuento aplicado</span>
                    <span className="font-medium">-${montoDescuentoCalculado.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Total a Facturar
                    </span>
                    <span className="text-[10px] text-slate-400">Impuestos incluidos</span>
                  </div>
                  <span className="text-2xl font-black text-white tracking-tight">
                    ${precioFinal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || Boolean(conflicto) || checkingConflict}
                  className="w-full h-11 rounded-xl bg-[#fd761a] hover:opacity-95 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                      <span>{editingReserva ? "Actualizar Reserva" : "Confirmar Reserva"}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal para Crear Nuevo Cliente */}
      <NuevoClienteModal
        isOpen={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onCreated={handleNewClienteCreated}
      />
    </div>
  )
}
