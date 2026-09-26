import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  Clock01Icon,
  Money01Icon,
  UserIcon,
  Search01Icon,
  Cancel01Icon,
  CheckmarkCircle04Icon,
  AlertCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import {
  Plus,
  Trash2,
  Copy,
  UserPlus,
  Loader2,
  Tag,
  Clock,
  Radio,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { radioService, type TarifaRadio } from "@/services/radio.service"
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

interface Draft {
  id: string
  tarifa_id: string
  fecha_reserva: string
  hora_inicio: string
  duracion: string
  incluye_operador: boolean
  operador_id: string
  observaciones: string
  showDescuento: boolean
  descuentoValor: string
  motivoDescuento: string
  errors: Record<string, string>
}

const today = () => new Date().toISOString().split("T")[0]

const calculateEndTime = (horaInicio: string, duracionMinutos: string) => {
  const [h, m] = (horaInicio || "08:00").split(":").map(Number)
  const duration = Math.max(15, Math.min(480, Number(duracionMinutos) || 60))
  const total = h * 60 + m + duration
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

const blank = (copy?: Draft): Draft => ({
  id: crypto.randomUUID(),
  tarifa_id: copy?.tarifa_id || "",
  fecha_reserva: copy?.fecha_reserva || today(),
  hora_inicio: copy ? calculateEndTime(copy.hora_inicio, copy.duracion) : "08:00",
  duracion: copy?.duracion || "60",
  incluye_operador: copy?.incluye_operador ?? false,
  operador_id: copy?.operador_id || "",
  observaciones: "",
  showDescuento: false,
  descuentoValor: "",
  motivoDescuento: "",
  errors: {},
})

const checkOverlap = (a: Draft, b: Draft) => {
  const endA = calculateEndTime(a.hora_inicio, a.duracion)
  const endB = calculateEndTime(b.hora_inicio, b.duracion)
  return (
    a.fecha_reserva === b.fecha_reserva &&
    a.hora_inicio < endB &&
    endA > b.hora_inicio
  )
}

export function ReservaBatchForm({
  tarifas: propTarifas,
  onClose,
  onSaved,
}: {
  tarifas?: TarifaRadio[]
  onClose?: () => void
  onSaved?: () => void
}) {
  const navigate = useNavigate()
  const [tarifas, setTarifas] = useState<TarifaRadio[]>(propTarifas || [])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [reservas, setReservas] = useState<Draft[]>([blank()])
  const [saving, setSaving] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  // Cargar tarifas si no vinieron por props
  useEffect(() => {
    if (propTarifas && propTarifas.length > 0) {
      setTarifas(propTarifas)
      setReservas((rs) =>
        rs.map((r) => ({
          ...r,
          tarifa_id: r.tarifa_id || String(propTarifas[0]?.id || ""),
        }))
      )
    } else {
      radioService
        .getTarifas()
        .then((data) => {
          setTarifas(data)
          if (data.length > 0) {
            setReservas((rs) =>
              rs.map((r) => ({
                ...r,
                tarifa_id: r.tarifa_id || String(data[0]?.id || ""),
              }))
            )
          }
        })
        .catch(() => toast.error("No se pudieron cargar las tarifas de radio"))
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

  // Búsqueda en vivo de clientes institucionales y externos
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

  // Cerrar dropdown de cliente al hacer click fuera
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

  const update = (id: string, values: Partial<Draft>) =>
    setReservas((rs) => rs.map((r) => (r.id === id ? { ...r, ...values, errors: {} } : r)))

  const duplicateDraft = (r: Draft) => {
    const newDraft = blank(r)
    setReservas((rs) => [...rs, newDraft])
    toast.success("Nueva sesión de radio agregada a continuación")
  }

  const removeDraft = (id: string) => {
    if (reservas.length <= 1) return
    setReservas((rs) => rs.filter((x) => x.id !== id))
  }

  const personasEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "persona"),
    [clientesDisponibles]
  )
  const externosEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "cliente_externo"),
    [clientesDisponibles]
  )

  const getPrices = useCallback((r: Draft) => {
    const tarifa = tarifas.find((t) => String(t.id) === String(r.tarifa_id))
    const duration = Math.max(15, Math.min(480, Number(r.duracion) || 0))
    const hours = Math.round((duration / 60) * 100) / 100
    const original = tarifa ? Math.round(hours * Number(tarifa.precio_por_hora) * 100) / 100 : 0
    const discount = r.showDescuento ? Math.min(Math.max(0, Number(r.descuentoValor) || 0), original) : 0
    const final = Math.max(0, Math.round((original - discount) * 100) / 100)
    return { original, discount, final, hours, duration }
  }, [tarifas])

  // Totales consolidados de la tanda
  const totals = useMemo(() => {
    let sumOriginal = 0
    let sumDiscount = 0
    let sumTotal = 0
    let sumMinutes = 0

    reservas.forEach((r) => {
      const p = getPrices(r)
      sumOriginal += p.original
      sumDiscount += p.discount
      sumTotal += p.final
      sumMinutes += p.duration
    })

    const sumHours = Math.round((sumMinutes / 60) * 100) / 100
    return { sumOriginal, sumDiscount, sumTotal, sumHours, sumMinutes }
  }, [reservas, getPrices])

  const validate = () => {
    const next = reservas.map((r) => {
      const errors: Record<string, string> = {}
      if (!r.tarifa_id) errors.tarifa_id = "Seleccione una tarifa"
      if (!r.fecha_reserva) errors.fecha_reserva = "La fecha es obligatoria"
      if (!r.hora_inicio || Number(r.duracion) < 15 || Number(r.duracion) > 480) {
        errors.hora_inicio = "La duración debe estar entre 15 y 480 minutos"
      }
      if (r.incluye_operador && !r.operador_id) {
        errors.operador_id = "Seleccione un operador técnico"
      }
      if (r.showDescuento && Number(r.descuentoValor) < 0) {
        errors.descuento = "El descuento no puede ser negativo"
      }
      if (r.showDescuento && Number(r.descuentoValor) > getPrices(r).original) {
        errors.descuento = "El descuento no puede superar el precio original"
      }
      return { ...r, errors }
    })

    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        if (checkOverlap(next[i], next[j])) {
          next[j].errors.hora_inicio = `Conflicto con la Sesión #${i + 1} (horario superpuesto)`
        }
      }
    }

    setReservas(next)
    return Boolean(cliente) && next.every((r) => Object.keys(r.errors).length === 0)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cliente) {
      toast.error("Debes seleccionar un cliente o responsable institucional")
      return
    }
    if (!validate()) {
      toast.error("Revisa los campos y posibles conflictos de horario en el formulario")
      return
    }

    setSaving(true)
    try {
      await radioService.createReservasBatch({
        persona_id: cliente.tipo === "persona" ? cliente.id : null,
        cliente_externo_id: cliente.tipo === "cliente_externo" ? cliente.id : null,
        reservas: reservas.map((r) => {
          const prices = getPrices(r)
          return {
            tarifa_id: Number(r.tarifa_id),
            fecha_reserva: r.fecha_reserva,
            hora_inicio: r.hora_inicio,
            hora_fin: calculateEndTime(r.hora_inicio, r.duracion),
            incluye_operador: r.incluye_operador,
            operador_id: r.incluye_operador ? r.operador_id : null,
            precio_original: r.showDescuento && prices.discount > 0 ? prices.original : null,
            monto_descuento: prices.discount,
            motivo_descuento: r.showDescuento && prices.discount > 0 ? r.motivoDescuento.trim() || null : null,
            observaciones: r.observaciones?.trim() || null,
            estado: "reservado",
          }
        }),
      })

      toast.success(
        `${reservas.length} reserva${reservas.length === 1 ? "" : "s"} de radio creada${reservas.length === 1 ? "" : "s"} exitosamente`
      )
      if (onSaved) onSaved()
      if (onClose) {
        onClose()
      } else {
        navigate("/servicios/radio")
      }
    } catch (error: unknown) {
      const data = (
        error as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } }
        }
      )?.response?.data
      const next = reservas.map((r) => ({ ...r, errors: {} as Record<string, string> }))
      Object.entries(data?.errors || {}).forEach(([key, messages]) => {
        const m = key.match(/^reservas\.(\d+)\.(.+)$/)
        if (m && next[Number(m[1])]) {
          next[Number(m[1])].errors[m[2]] = messages[0]
        }
      })
      setReservas(next)
      toast.error(data?.message || "No se pudieron registrar las reservas de radio")
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (onClose) {
      onClose()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header Principal de la Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                Reserva de Cabina de Radio (Individual o por Lote)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              {reservas.length} sesión{reservas.length !== 1 ? "es" : ""} en borrador
            </span>
          </div>
        </div>

        {/* Formulario en Grid Bento de 2 Columnas */}
        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Cliente y Sesiones (8 cols) */}
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
                      Cliente / Responsable de la Emisión
                    </h2>
                    <p className="text-xs text-slate-500">
                      Asigna la persona o institución responsable de las reservas de radio
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
                        {cliente.nombres.charAt(0)}
                        {cliente.apellidos?.charAt(0) || ""}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                            <HugeiconsIcon icon={CheckmarkCircle04Icon} size={11} />
                            <span>
                              {cliente.tipo === "persona"
                                ? cliente.personaTipo || "Institucional"
                                : "Cliente Externo"}
                            </span>
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
                    <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={clienteSearch}
                      onChange={(e) => {
                        setClienteSearch(e.target.value)
                        setShowClienteDropdown(true)
                      }}
                      onFocus={() => setShowClienteDropdown(true)}
                      placeholder="Buscar cliente institucional o externo por nombre, cédula o email..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                    />
                    {searchingCliente ? (
                      <Loader2 className="size-4 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    ) : clienteSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setClienteSearch("")
                          setClientesDisponibles([])
                        }}
                        className="size-5 absolute right-3 top-1/2 -translate-y-1/2 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      </button>
                    ) : null}
                  </div>

                  {/* Dropdown de Resultados */}
                  <AnimatePresence>
                    {showClienteDropdown && clienteSearch.trim().length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100"
                      >
                        {searchingCliente ? (
                          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin text-[#fd761a]" />
                            <span>Buscando registros institucionales y externos...</span>
                          </div>
                        ) : clientesDisponibles.length === 0 ? (
                          <div className="p-6 text-center">
                            <p className="text-xs font-semibold text-slate-700">
                              No se encontraron personas con "{clienteSearch}"
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Puedes crear un nuevo cliente externo de forma rápida
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

            {/* Card 2: Lista de Sesiones de Radio Programadas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center">
                    <HugeiconsIcon icon={Calendar03Icon} size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Sesiones de Radio Programadas
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configura tarifa, fecha, duración, operador y descuentos de cada sesión
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReservas((rs) => [...rs, blank(rs[rs.length - 1])])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Plus size={14} />
                  <span>Agregar Sesión</span>
                </button>
              </div>

              {/* Tarjetas de cada Sesión */}
              <div className="space-y-4">
                {reservas.map((r, index) => {
                  const tarifa = tarifas.find((t) => String(t.id) === String(r.tarifa_id))
                  const p = getPrices(r)
                  const hasConflict = Boolean(r.errors.hora_inicio)
                  const endTime = calculateEndTime(r.hora_inicio, r.duracion)

                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "rounded-xl bg-white border p-5 shadow-xs transition-all space-y-4 relative",
                        hasConflict
                          ? "border-red-300 ring-2 ring-red-400/10"
                          : "border-slate-200/90 hover:border-slate-300"
                      )}
                    >
                      {/* Encabezado de la Tarjeta de Sesión */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="size-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Sesión #{index + 1}
                          </span>
                          {tarifa && (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Radio size={12} className="text-slate-500" />
                              {tarifa.nombre} (${Number(tarifa.precio_por_hora).toFixed(2)}/h)
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-[#fd761a] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock size={11} />
                            {p.hours} hr{p.hours !== 1 ? "s" : ""} ({r.duracion} min)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900 mr-2">
                            ${p.final.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => duplicateDraft(r)}
                            className="size-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                            title="Duplicar esta sesión"
                          >
                            <Copy size={13} />
                          </button>

                          {reservas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDraft(r.id)}
                              className="size-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                              title="Eliminar esta sesión"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Banner de Conflicto de Horario */}
                      {hasConflict && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                          <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
                          <span>{r.errors.hora_inicio}</span>
                        </div>
                      )}

                      {/* Grid de Campos de la Sesión */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Tarifa de Radio */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Radio size={12} className="text-slate-400" />
                            <span>Tarifa de Radio <span className="text-[#fd761a]">*</span></span>
                          </label>
                          <select
                            value={r.tarifa_id}
                            onChange={(e) => update(r.id, { tarifa_id: e.target.value })}
                            className={cn(
                              "w-full h-10 px-3 rounded-xl border bg-white text-xs font-semibold text-slate-800 outline-none transition-all",
                              r.errors.tarifa_id
                                ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                                : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                            )}
                          >
                            <option value="">Seleccionar tarifa...</option>
                            {tarifas
                              .filter((t) => t.es_activo !== false)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.nombre} — ${Number(t.precio_por_hora).toFixed(2)}/h{" "}
                                  {t.incluye_operador ? "(Incluye Operador)" : ""}
                                </option>
                              ))}
                          </select>
                          {r.errors.tarifa_id && (
                            <span className="text-[10px] text-red-500 font-medium block">
                              {r.errors.tarifa_id}
                            </span>
                          )}
                        </div>

                        {/* Fecha de Reserva */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-slate-400" />
                            <span>Fecha de Reserva <span className="text-[#fd761a]">*</span></span>
                          </label>
                          <input
                            type="date"
                            value={r.fecha_reserva}
                            onChange={(e) => update(r.id, { fecha_reserva: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                          />
                          {r.errors.fecha_reserva && (
                            <span className="text-[10px] text-red-500 font-medium block">
                              {r.errors.fecha_reserva}
                            </span>
                          )}
                        </div>

                        {/* Hora Inicio */}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <HugeiconsIcon icon={Clock01Icon} size={12} className="text-slate-400" />
                            <span>Hora Inicio <span className="text-[#fd761a]">*</span></span>
                          </label>
                          <input
                            type="time"
                            value={r.hora_inicio}
                            onChange={(e) => update(r.id, { hora_inicio: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                          />
                        </div>

                        {/* Duración (Minutos) */}
                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>Duración (Minutos) <span className="text-[#fd761a]">*</span></span>
                            </label>
                            <span className="text-[10px] text-slate-400">15 a 480 min</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="15"
                                max="480"
                                step="15"
                                value={r.duracion}
                                onChange={(e) => update(r.id, { duracion: e.target.value })}
                                className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                min
                              </span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                              {[30, 60, 90, 120].map((mins) => (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => update(r.id, { duracion: String(mins) })}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer",
                                    Number(r.duracion) === mins
                                      ? "bg-slate-900 text-white border-slate-900"
                                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                  )}
                                >
                                  {mins}m
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Descuento Opcional (Debajo de los inputs de hora) */}
                        {!r.showDescuento ? (
                          <div className="sm:col-span-2 md:col-span-4 pt-1">
                            <button
                              type="button"
                              onClick={() => update(r.id, { showDescuento: true })}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#fd761a] hover:text-orange-700 bg-orange-50/70 hover:bg-orange-100/80 border border-orange-200/70 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
                            >
                              <Tag size={13} />
                              <span>+ Aplicar descuento a esta sesión</span>
                            </button>
                          </div>
                        ) : (
                          <div className="sm:col-span-2 md:col-span-4 rounded-xl border border-orange-200/80 bg-orange-50/40 p-3.5 space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between pb-1 border-b border-orange-200/50">
                              <div className="flex items-center gap-2">
                                <div className="size-6 rounded-md bg-orange-100 text-[#fd761a] flex items-center justify-center">
                                  <Tag size={12} />
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                  Descuento Opcional
                                </span>
                                {p.original > 0 && (
                                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                                    (Tarifa base: ${p.original.toFixed(2)})
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  update(r.id, {
                                    showDescuento: false,
                                    descuentoValor: "",
                                    motivoDescuento: "",
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Quitar descuento y ocultar"
                              >
                                <X size={12} />
                                <span>Quitar descuento</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                              {/* Monto Descuento */}
                              <div className="space-y-1 sm:col-span-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                  <HugeiconsIcon icon={Money01Icon} size={12} className="text-slate-400" />
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
                                    value={r.descuentoValor}
                                    onChange={(e) => update(r.id, { descuentoValor: e.target.value })}
                                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                                  />
                                </div>
                                {r.errors.descuento && (
                                  <small className="text-red-600 text-[10px] block mt-0.5">
                                    {r.errors.descuento}
                                  </small>
                                )}
                              </div>

                              {/* Motivo Descuento */}
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                  Motivo del Descuento
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej. Beca, Convenio institucional..."
                                  value={r.motivoDescuento}
                                  onChange={(e) => update(r.id, { motivoDescuento: e.target.value })}
                                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all placeholder:text-slate-400"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Operador Técnico */}
                        <div className="sm:col-span-2 md:col-span-4 space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-slate-400" />
                              <span>Operador Técnico de Radio</span>
                            </span>
                            {r.incluye_operador && r.operador_id && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Asignado
                              </span>
                            )}
                          </label>

                          <OperadorSelector
                            operadores={operadores}
                            selectedId={r.operador_id || null}
                            incluyeOperador={r.incluye_operador}
                            onToggleIncluye={(incluye) => {
                              update(r.id, {
                                incluye_operador: incluye,
                                operador_id: incluye ? r.operador_id : "",
                              })
                            }}
                            onSelect={(id) => {
                              update(r.id, {
                                operador_id: id || "",
                                incluye_operador: Boolean(id),
                              })
                            }}
                          />

                          {r.errors.operador_id && (
                            <span className="text-[10px] text-red-500 font-medium block mt-1">
                              {r.errors.operador_id}
                            </span>
                          )}
                        </div>

                        {/* Observaciones de la Emisión (Directamente debajo de la sección de Operador Técnico) */}
                        <div className="sm:col-span-2 md:col-span-4 space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                            Observaciones de la Emisión
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Nombre del programa, pauta o indicaciones especiales"
                            value={r.observaciones}
                            onChange={(e) => update(r.id, { observaciones: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Footer de la Sesión con desglose */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                        <span className="flex items-center gap-2 text-[11px]">
                          <span className="font-semibold text-slate-700">
                            Horario: {r.hora_inicio} → {endTime} ({r.duracion} min)
                          </span>
                          {p.discount > 0 && (
                            <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              -${p.discount.toFixed(2)} dto
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Total sesión:{" "}
                          <span className="font-extrabold text-[#fd761a] text-sm">
                            ${p.final.toFixed(2)} USD
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botón Grande para Agregar otra Sesión */}
              <button
                type="button"
                onClick={() => setReservas((rs) => [...rs, blank(rs[rs.length - 1])])}
                className="w-full py-3.5 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:border-[#fd761a] hover:text-[#fd761a]"
              >
                <Plus size={16} />
                <span>Agregar otra sesión o fecha de radio al lote</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Liquidación Consolidada (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            <div className="rounded-xl shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Liquidación por Lote
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo consolidado de las reservas de radio
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
                    {cliente.nombres} {cliente.apellidos}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <HugeiconsIcon icon={AlertCircleIcon} size={13} />
                    <span>Selecciona un cliente para continuar</span>
                  </p>
                )}
              </div>

              {/* Desglose de Sesiones */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Desglose de Sesiones ({reservas.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {reservas.map((r, i) => {
                    const tarifa = tarifas.find((t) => String(t.id) === String(r.tarifa_id))
                    const p = getPrices(r)
                    const endT = calculateEndTime(r.hora_inicio, r.duracion)
                    return (
                      <div key={r.id} className="pt-1.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 truncate">
                            #{i + 1} {tarifa?.nombre || "Tarifa de Radio"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {r.fecha_reserva} • {p.hours}h ({r.hora_inicio} - {endT})
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">
                          ${p.final.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Horas totales reservadas:</span>
                  <span className="font-bold text-slate-900">{totals.sumHours.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal bruto:</span>
                  <span className="font-bold text-slate-900">${totals.sumOriginal.toFixed(2)}</span>
                </div>
                {totals.sumDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuentos acumulados:</span>
                    <span>-${totals.sumDiscount.toFixed(2)}</span>
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
                    {reservas.length} sesión{reservas.length !== 1 ? "es" : ""} reservada{reservas.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  {totals.sumDiscount > 0 && (
                    <span className="text-xs text-slate-400 line-through block">
                      ${totals.sumOriginal.toFixed(2)}
                    </span>
                  )}
                  <span className="text-2xl font-black text-white tracking-tight">
                    ${totals.sumTotal.toFixed(2)}
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
                      <span>Registrando reservas...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                      <span>
                        Registrar {reservas.length} Reserva{reservas.length !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
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
              nombres: c.nombres,
              apellidos: c.apellidos || "",
              cedula: c.cedula,
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
