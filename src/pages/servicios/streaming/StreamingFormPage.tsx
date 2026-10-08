import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Search01Icon,
  UserIcon,
  Money01Icon,
  AlertCircleIcon,
  CheckmarkCircle04Icon,
  UserGroupIcon,
  Tag01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Clock,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  streamingService,
  type ConflictoStaff,
} from "@/services/streaming.service"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { NuevoClienteModal } from "@/components/clientes/NuevoClienteModal"
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

export interface SesionStreamingDraft {
  id: string
  titulo: string
  fecha_evento: string
  hora_inicio: string
  hora_fin: string
  lugar: string
  ciudad_id: number | ""
  direccion: string
  referencias_ubicacion: string
  equipos_detalle: string
  observaciones: string
  personal_ids: string[]
  // Finanzas
  precio_base: string
  showDescuento: boolean
  descuentoValor: string
  motivoDescuento: string
  showRecargo: boolean
  recargoValor: string
  motivoRecargo: string
  // Errores locales
  conflictos: ConflictoStaff[]
  errors: Record<string, string>
}

const today = () => new Date().toISOString().split("T")[0]

const calculateEndTime = (horaInicio: string, duracionHoras = 3) => {
  const [h, m] = (horaInicio || "09:00").split(":").map(Number)
  const total = (h || 9) * 60 + (m || 0) + duracionHoras * 60
  const finH = Math.min(23, Math.floor(total / 60))
  const finM = total % 60
  return `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`
}

const blankSesion = (copy?: SesionStreamingDraft): SesionStreamingDraft => ({
  id: crypto.randomUUID(),
  titulo: copy?.titulo || "",
  fecha_evento: copy?.fecha_evento || today(),
  hora_inicio: copy?.hora_inicio || "09:00",
  hora_fin: copy?.hora_fin || "12:00",
  lugar: copy?.lugar || "",
  ciudad_id: copy?.ciudad_id || "",
  direccion: copy?.direccion || "",
  referencias_ubicacion: copy?.referencias_ubicacion || "",
  equipos_detalle: copy?.equipos_detalle || "",
  observaciones: copy?.observaciones || "",
  personal_ids: copy?.personal_ids ? [...copy.personal_ids] : [],
  precio_base: copy?.precio_base || "0.00",
  showDescuento: copy?.showDescuento ?? false,
  descuentoValor: copy?.descuentoValor || "",
  motivoDescuento: copy?.motivoDescuento || "",
  showRecargo: copy?.showRecargo ?? false,
  recargoValor: copy?.recargoValor || "",
  motivoRecargo: copy?.motivoRecargo || "",
  conflictos: [],
  errors: {},
})

export function StreamingFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  // Cliente
  const [cliente, setCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)

  // Catálogos
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [personasStaff, setPersonasStaff] = useState<Persona[]>([])

  // Lista de Sesiones (Batch o Única en modo edición)
  const [sesiones, setSesiones] = useState<SesionStreamingDraft[]>([blankSesion()])
  const [loadingInitial, setLoadingInitial] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  // Cargar catálogos iniciales
  useEffect(() => {
    ciudadesService
      .getCiudadesTodas()
      .then((data) => setCiudades(data))
      .catch(() => {})

    personasService
      .getPersonas({ per_page: 100 })
      .then((res) => {
        const staff = (res.data || []).filter((p) => {
          if (p.es_activo === false) return false
          const tipo = (p.tipo || "").toLowerCase()
          return ["instructor", "staff", "pasante", "administrador", "secretaria"].includes(tipo)
        })
        setPersonasStaff(staff)
      })
      .catch(() => {})
  }, [])

  // Cargar registro existente si estamos editando
  useEffect(() => {
    if (!id) return
    setLoadingInitial(true)
    streamingService
      .getById(id)
      .then((data) => {
        // Asignar cliente
        if (data.cliente_externo) {
          setCliente({
            tipo: "cliente_externo",
            id: data.cliente_externo.id,
            nombres: data.cliente_externo.nombres,
            apellidos: data.cliente_externo.apellidos || "",
            cedula: data.cliente_externo.cedula || data.cliente_externo.ruc,
            correo: data.cliente_externo.correo,
            celular: data.cliente_externo.celular,
          })
        } else if (data.persona) {
          setCliente({
            tipo: "persona",
            id: data.persona.id,
            nombres: data.persona.nombres,
            apellidos: data.persona.apellidos,
            cedula: data.persona.cedula,
            correo: data.persona.correo,
            celular: data.persona.celular,
          })
        }

        const pBase = data.precio_original != null ? Number(data.precio_original) : Number(data.precio_total)

        setSesiones([
          {
            id: data.id,
            titulo: data.titulo || "",
            fecha_evento: data.fecha_evento,
            hora_inicio: data.hora_inicio.slice(0, 5),
            hora_fin: data.hora_fin.slice(0, 5),
            lugar: data.lugar,
            ciudad_id: data.ciudad_id || "",
            direccion: data.direccion || "",
            referencias_ubicacion: data.referencias_ubicacion || "",
            equipos_detalle: data.equipos_detalle || "",
            observaciones: data.observaciones || "",
            personal_ids: data.asignaciones ? data.asignaciones.map((a) => a.persona_id) : [],
            precio_base: pBase.toFixed(2),
            showDescuento: Boolean(data.monto_descuento && Number(data.monto_descuento) > 0),
            descuentoValor: data.monto_descuento ? Number(data.monto_descuento).toFixed(2) : "",
            motivoDescuento: data.motivo_descuento || "",
            showRecargo: Boolean(data.monto_recargo && Number(data.monto_recargo) > 0),
            recargoValor: data.monto_recargo ? Number(data.monto_recargo).toFixed(2) : "",
            motivoRecargo: data.motivo_recargo || "",
            conflictos: [],
            errors: {},
          },
        ])
      })
      .catch(() => {
        toast.error("Error al cargar la cobertura de streaming")
        navigate("/servicios/streaming")
      })
      .finally(() => {
        setLoadingInitial(false)
      })
  }, [id, navigate])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Búsqueda de clientes reactiva con Debounce
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
        personasService.getPersonas({ buscar: q, per_page: 8 }),
        clientesService.getClientes({ search: q, per_page: 20 }),
      ])
        .then(([people, external]) => {
          const result: ClienteOption[] = []
          if (people.status === "fulfilled") {
            result.push(
              ...(people.value.data || []).map((p: Persona) => ({
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
            const data = (external.value as { data: ClienteExterno[] }).data || []
            for (const c of data) {
              if (result.some((r) => r.tipo === "cliente_externo" && r.id === c.id)) continue
              result.push({
                tipo: "cliente_externo" as const,
                id: c.id,
                nombres: c.nombres,
                apellidos: c.apellidos || "",
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

  // Modificadores de sesiones
  const updateSesion = (id: string, patch: Partial<SesionStreamingDraft>) => {
    setSesiones((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  const duplicateSesion = (orig: SesionStreamingDraft) => {
    const nextHoraInicio = orig.hora_fin || "14:00"
    const nextHoraFin = calculateEndTime(nextHoraInicio, 3)
    const copy = blankSesion(orig)
    copy.hora_inicio = nextHoraInicio
    copy.hora_fin = nextHoraFin
    setSesiones((prev) => [...prev, copy])
    toast.success("Sesión duplicada correctamente")
  }

  const removeSesion = (idToRemove: string) => {
    if (sesiones.length <= 1) return
    setSesiones((prev) => prev.filter((s) => s.id !== idToRemove))
  }

  // Toggle de un técnico para una sesión
  const toggleTecnico = (sesionId: string, personaId: string) => {
    setSesiones((prev) =>
      prev.map((s) => {
        if (s.id !== sesionId) return s
        const exists = s.personal_ids.includes(personaId)
        const updated = exists
          ? s.personal_ids.filter((id) => id !== personaId)
          : [...s.personal_ids, personaId]
        return { ...s, personal_ids: updated }
      })
    )
  }

  // Pre-validación de staff con Debounce por cada sesión
  useEffect(() => {
    const timer = setTimeout(() => {
      sesiones.forEach(async (s) => {
        if (!s.fecha_evento || !s.hora_inicio || !s.hora_fin || s.personal_ids.length === 0) {
          if (s.conflictos.length > 0) updateSesion(s.id, { conflictos: [] })
          return
        }

        if (s.hora_fin <= s.hora_inicio) return

        try {
          const res = await streamingService.verificarDisponibilidadStaff({
            fecha_evento: s.fecha_evento,
            hora_inicio: s.hora_inicio,
            hora_fin: s.hora_fin,
            persona_ids: s.personal_ids,
            exclude_id: isEdit ? id : undefined,
          })

          updateSesion(s.id, { conflictos: res.valido ? [] : res.conflictos || [] })
        } catch {
          // Silencioso
        }
      })
    }, 450)

    return () => clearTimeout(timer)
  }, [sesiones, id, isEdit])

  // Cálculo de finanzas por sesión
  const getSesionFinanzas = useCallback((s: SesionStreamingDraft) => {
    const base = parseFloat(s.precio_base) || 0
    let desc = 0
    if (s.showDescuento && s.descuentoValor) {
      const v = parseFloat(s.descuentoValor) || 0
      if (v > 0) desc = v
    }

    let rec = 0
    if (s.showRecargo && s.recargoValor) {
      const v = parseFloat(s.recargoValor) || 0
      if (v > 0) rec = v
    }

    const total = Math.max(0, base - desc + rec)

    // Duración en horas
    const [h1, m1] = (s.hora_inicio || "09:00").split(":").map(Number)
    const [h2, m2] = (s.hora_fin || "12:00").split(":").map(Number)
    const mins = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1))
    const horas = mins / 60

    return {
      base,
      desc,
      rec,
      total,
      horas,
    }
  }, [])

  // Totales consolidados
  const totals = useMemo(() => {
    return sesiones.reduce(
      (acc, s) => {
        const f = getSesionFinanzas(s)
        acc.sumHoras += f.horas
        acc.sumBase += f.base
        acc.sumDesc += f.desc
        acc.sumRec += f.rec
        acc.sumTotal += f.total
        return acc
      },
      { sumHoras: 0, sumBase: 0, sumDesc: 0, sumRec: 0, sumTotal: 0 }
    )
  }, [sesiones, getSesionFinanzas])

  // Envío del Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cliente) {
      toast.error("Debes seleccionar un cliente responsable")
      return
    }

    // Validar cada sesión
    let hasErrors = false
    for (let i = 0; i < sesiones.length; i++) {
      const s = sesiones[i]
      if (!s.lugar.trim()) {
        toast.error(`La sesión #${i + 1} requiere indicar el lugar/recinto`)
        hasErrors = true
        break
      }
      if (s.hora_fin <= s.hora_inicio) {
        toast.error(`La sesión #${i + 1} tiene un horario inválido (la hora fin debe ser posterior a la de inicio)`)
        hasErrors = true
        break
      }
      if (s.conflictos.length > 0) {
        toast.error(`La sesión #${i + 1} presenta conflicto de horario en el personal asignado`)
        hasErrors = true
        break
      }
    }

    if (hasErrors) return

    setSaving(true)
    try {
      if (isEdit && id) {
        // Actualización de cobertura única
        const s = sesiones[0]
        const finanzas = getSesionFinanzas(s)
        await streamingService.update(id, {
          titulo: s.titulo.trim() || undefined,
          fecha_evento: s.fecha_evento,
          hora_inicio: s.hora_inicio,
          hora_fin: s.hora_fin,
          lugar: s.lugar.trim(),
          ciudad_id: s.ciudad_id ? Number(s.ciudad_id) : undefined,
          direccion: s.direccion.trim() || undefined,
          referencias_ubicacion: s.referencias_ubicacion.trim() || undefined,
          equipos_detalle: s.equipos_detalle.trim() || undefined,
          observaciones: s.observaciones.trim() || undefined,
          persona_id: cliente.tipo === "persona" ? cliente.id : null,
          cliente_externo_id: cliente.tipo === "cliente_externo" ? cliente.id : null,
          precio_original: finanzas.base,
          monto_descuento: s.showDescuento ? finanzas.desc : 0,
          motivo_descuento: s.showDescuento && s.motivoDescuento.trim() ? s.motivoDescuento.trim() : null,
          monto_recargo: s.showRecargo ? finanzas.rec : 0,
          motivo_recargo: s.showRecargo && s.motivoRecargo.trim() ? s.motivoRecargo.trim() : null,
          precio_total: finanzas.total,
          asignaciones: s.personal_ids.map((pid) => ({ persona_id: pid })),
        })
        toast.success("Cobertura de streaming actualizada exitosamente")
      } else {
        // Creación en Batch (una o múltiples coberturas)
        for (let i = 0; i < sesiones.length; i++) {
          const s = sesiones[i]
          const finanzas = getSesionFinanzas(s)
          await streamingService.create({
            titulo: s.titulo.trim() || undefined,
            fecha_evento: s.fecha_evento,
            hora_inicio: s.hora_inicio,
            hora_fin: s.hora_fin,
            lugar: s.lugar.trim(),
            ciudad_id: s.ciudad_id ? Number(s.ciudad_id) : undefined,
            direccion: s.direccion.trim() || undefined,
            referencias_ubicacion: s.referencias_ubicacion.trim() || undefined,
            equipos_detalle: s.equipos_detalle.trim() || undefined,
            observaciones: s.observaciones.trim() || undefined,
            persona_id: cliente.tipo === "persona" ? cliente.id : null,
            cliente_externo_id: cliente.tipo === "cliente_externo" ? cliente.id : null,
            precio_original: finanzas.base,
            monto_descuento: s.showDescuento ? finanzas.desc : 0,
            motivo_descuento: s.showDescuento && s.motivoDescuento.trim() ? s.motivoDescuento.trim() : null,
            monto_recargo: s.showRecargo ? finanzas.rec : 0,
            motivo_recargo: s.showRecargo && s.motivoRecargo.trim() ? s.motivoRecargo.trim() : null,
            precio_total: finanzas.total,
            asignaciones: s.personal_ids.map((pid) => ({ persona_id: pid })),
          })
        }
        toast.success(
          sesiones.length === 1
            ? "Cobertura de streaming registrada exitosamente"
            : `${sesiones.length} coberturas de streaming registradas exitosamente`
        )
      }

      navigate("/servicios/streaming")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al procesar el servicio"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando cobertura de streaming...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/servicios/streaming"
              className="size-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#fd761a]" />
                <span className="text-[11px] font-bold tracking-widest text-[#fd761a] uppercase">
                  {isEdit ? "Edición de Cobertura" : "Programación de Transmisiones"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isEdit ? "Editar Servicio de Streaming" : "Nueva Reserva de Streaming"}
              </h1>
            </div>
          </div>
        </div>

        {/* Formulario Principal en 2 Columnas (Estilo ReservaBatchForm de Radio) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: CLIENTE Y SESIONES (2 COLUMNAS) */}
          <div className="lg:col-span-2 space-y-5">
            {/* CARD 1: CLIENTE RESPONSABLE */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <HugeiconsIcon icon={UserIcon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Cliente Responsable
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecciona la persona institucional o cliente externo a facturar
                    </p>
                  </div>
                </div>

                {!cliente && (
                  <button
                    type="button"
                    onClick={() => setShowNuevoCliente(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#fd761a] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <UserPlus className="size-3.5" />
                    <span>Nuevo Cliente Externo</span>
                  </button>
                )}
              </div>

              {cliente ? (
                /* Cliente Seleccionado */
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
                      {cliente.nombres.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={11} />
                          <span>{cliente.tipo === "persona" ? "Institucional" : "Cliente Externo"}</span>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {cliente.nombres} {cliente.apellidos}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-0.5">
                        {cliente.cedula && <span>ID: {cliente.cedula}</span>}
                        {cliente.celular && <span>Tel: {cliente.celular}</span>}
                        {cliente.correo && <span>Email: {cliente.correo}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCliente(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                /* Buscador de Cliente */
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
                      onFocus={() => setShowClienteDropdown(true)}
                      placeholder="Buscar por nombre, cédula o email del cliente..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                    />
                    {searchingCliente && (
                      <Loader2 className="size-4 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                  </div>

                  {/* Dropdown de Resultados */}
                  <AnimatePresence>
                    {showClienteDropdown && clienteSearch.trim().length >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100"
                      >
                        {searchingCliente ? (
                          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin text-[#fd761a]" />
                            <span>Buscando personas y clientes...</span>
                          </div>
                        ) : clientesDisponibles.length === 0 ? (
                          <div className="p-5 text-center">
                            <p className="text-xs font-semibold text-slate-700">No se encontraron clientes</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Puedes registrar uno nuevo con el botón superior</p>
                          </div>
                        ) : (
                          clientesDisponibles.map((opt) => (
                            <button
                              key={`${opt.tipo}-${opt.id}`}
                              type="button"
                              onClick={() => {
                                setCliente(opt)
                                setShowClienteDropdown(false)
                                setClienteSearch("")
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {opt.nombres} {opt.apellidos}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {opt.cedula ? `ID: ${opt.cedula} · ` : ""}
                                  {opt.celular || opt.correo || ""}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {opt.tipo === "persona" ? "Interno" : "Externo"}
                              </span>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* CARD 2: LISTA DE COBERTURAS / SESIONES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <HugeiconsIcon icon={Calendar03Icon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Sesiones de Streaming & Cobertura
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configura fecha, ventana horaria, recinto, personal técnico y finanzas
                    </p>
                  </div>
                </div>

                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => setSesiones((prev) => [...prev, blankSesion(prev[prev.length - 1])])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Agregar Otra Sesión</span>
                  </button>
                )}
              </div>

              {/* ITERACIÓN DE CADA SESIÓN */}
              <div className="space-y-5">
                {sesiones.map((s, index) => {
                  const finanzas = getSesionFinanzas(s)
                  const hasConflict = s.conflictos.length > 0
                  const horarioInvalido = s.hora_fin <= s.hora_inicio

                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "rounded-2xl bg-white border p-5 shadow-xs transition-all space-y-4 relative",
                        hasConflict || horarioInvalido
                          ? "border-red-300 ring-2 ring-red-400/10"
                          : "border-slate-200/90 hover:border-slate-300"
                      )}
                    >
                      {/* Cabecera de la Sesión */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <span className="size-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Sesión #{index + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-[#fd761a] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock size={11} />
                            {finanzas.horas.toFixed(1)} hrs ({s.hora_inicio} - {s.hora_fin})
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <HugeiconsIcon icon={UserGroupIcon} size={12} className="text-slate-400" />
                            {s.personal_ids.length} técnico(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900 mr-2">
                            ${finanzas.total.toFixed(2)}
                          </span>

                          {!isEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => duplicateSesion(s)}
                                className="size-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                                title="Duplicar esta sesión"
                              >
                                <Copy size={13} />
                              </button>

                              {sesiones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSesion(s.id)}
                                  className="size-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Eliminar esta sesión"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Conflictos de horario */}
                      {hasConflict && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
                            <span>Conflicto de Horario Detectado:</span>
                          </div>
                          {s.conflictos.map((c, ci) => (
                            <p key={ci} className="pl-5 text-[11px]">
                              • <strong>{c.persona_nombre}</strong> está ocupado/a en: {c.actividad} ({c.hora_inicio?.slice(0, 5)} - {c.hora_fin?.slice(0, 5)})
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Campos Logísticos de la Sesión Ordenados Lógicamente */}
                      <div className="space-y-3.5">
                        {/* 1. Título del Evento (Ancho completo) */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Título del Evento / Transmisión
                          </label>
                          <input
                            type="text"
                            value={s.titulo}
                            onChange={(e) => updateSesion(s.id, { titulo: e.target.value })}
                            placeholder="Ej: Graduación, Concierto en vivo..."
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                          />
                        </div>

                        {/* 2. Lugar / Recinto y Ciudad (2 Columnas) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              Lugar / Recinto <span className="text-[#fd761a]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={s.lugar}
                              onChange={(e) => updateSesion(s.id, { lugar: e.target.value })}
                              placeholder="Ej: Salón Las Palmeras, Teatro..."
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              Ciudad
                            </label>
                            <select
                              value={s.ciudad_id}
                              onChange={(e) => updateSesion(s.id, { ciudad_id: e.target.value ? Number(e.target.value) : "" })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                            >
                              <option value="">Seleccione una ciudad...</option>
                              {ciudades.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 3. Fecha y Ventana Horaria (Fecha a la izquierda, Horas a la derecha) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              Fecha del Evento <span className="text-[#fd761a]">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={s.fecha_evento}
                              onChange={(e) => updateSesion(s.id, { fecha_evento: e.target.value })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Hora Inicio <span className="text-[#fd761a]">*</span>
                              </label>
                              <input
                                type="time"
                                required
                                value={s.hora_inicio}
                                onChange={(e) => updateSesion(s.id, { hora_inicio: e.target.value })}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Hora Fin <span className="text-[#fd761a]">*</span>
                              </label>
                              <input
                                type="time"
                                required
                                value={s.hora_fin}
                                onChange={(e) => updateSesion(s.id, { hora_fin: e.target.value })}
                                className={cn(
                                  "w-full h-10 px-3 rounded-xl border bg-white text-xs font-semibold outline-none",
                                  horarioInvalido
                                    ? "border-red-400 text-red-700"
                                    : "border-slate-200 text-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Dirección exacta (Ancho completo) */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Dirección exacta
                          </label>
                          <input
                            type="text"
                            value={s.direccion}
                            onChange={(e) => updateSesion(s.id, { direccion: e.target.value })}
                            placeholder="Calle, número, intersección..."
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                          />
                        </div>

                        {/* 5. Referencias de acceso / locación (Ancho completo) */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Referencias de acceso / locación
                          </label>
                          <input
                            type="text"
                            value={s.referencias_ubicacion}
                            onChange={(e) => updateSesion(s.id, { referencias_ubicacion: e.target.value })}
                            placeholder="Ej: Frente al parque central, portón metálico..."
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                          />
                        </div>
                      </div>

                      {/* 6. Selector de Personal Técnico Asignado */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                          <span>Personal Técnico Asignado ({s.personal_ids.length})</span>
                          <span className="text-[10px] text-slate-400 font-normal">Haz clic para asignar o remover</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-200/60">
                          {personasStaff.map((p) => {
                            const selected = s.personal_ids.includes(p.id)
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleTecnico(s.id, p.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                                  selected
                                    ? "bg-[#fd761a] text-white border-[#fd761a] shadow-xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                )}
                              >
                                {p.nombres} {p.apellidos?.charAt(0)}.
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* 7. Equipos Requeridos y Observaciones (Separados en ancho completo o apilados) */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Equipos Requeridos (Texto libre)
                          </label>
                          <textarea
                            rows={2}
                            value={s.equipos_detalle}
                            onChange={(e) => updateSesion(s.id, { equipos_detalle: e.target.value })}
                            placeholder="Cámaras, trípodes, micrófonos, switcher, luces..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Observaciones
                          </label>
                          <textarea
                            rows={2}
                            value={s.observaciones}
                            onChange={(e) => updateSesion(s.id, { observaciones: e.target.value })}
                            placeholder="Notas técnicas o requerimientos eléctricos del cliente..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 resize-none"
                          />
                        </div>
                      </div>

                      {/* Finanzas Individuales de la Sesión */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                              Precio Base ($) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={s.precio_base}
                              onChange={(e) => updateSesion(s.id, { precio_base: e.target.value })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => updateSesion(s.id, { showDescuento: !s.showDescuento })}
                            className={cn(
                              "h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              s.showDescuento
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            <HugeiconsIcon icon={Tag01Icon} size={14} />
                            {s.showDescuento ? "Descuento Activo" : "+ Descuento"}
                          </button>

                          <button
                            type="button"
                            onClick={() => updateSesion(s.id, { showRecargo: !s.showRecargo })}
                            className={cn(
                              "h-10 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                              s.showRecargo
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            <HugeiconsIcon icon={Tag01Icon} size={14} />
                            {s.showRecargo ? "Recargo Activo" : "+ Recargo"}
                          </button>
                        </div>

                        {/* Descuento Detalle (Solo Monto Fijo) */}
                        {s.showDescuento && (
                          <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-1">
                              <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                                Monto Descuento ($)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={s.descuentoValor}
                                  onChange={(e) => updateSesion(s.id, { descuentoValor: e.target.value })}
                                  className="w-full h-9 pl-7 pr-3 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                                Motivo / Justificación
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Convenio institucional, cortesía..."
                                value={s.motivoDescuento}
                                onChange={(e) => updateSesion(s.id, { motivoDescuento: e.target.value })}
                                className="w-full h-9 px-3 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Recargo Detalle (Solo Monto Fijo) */}
                        {s.showRecargo && (
                          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-1">
                              <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                                Monto Recargo ($)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={s.recargoValor}
                                  onChange={(e) => updateSesion(s.id, { recargoValor: e.target.value })}
                                  className="w-full h-9 pl-7 pr-3 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                                Motivo / Justificación
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Traslado fuera de perímetro, horario nocturno..."
                                value={s.motivoRecargo}
                                onChange={(e) => updateSesion(s.id, { motivoRecargo: e.target.value })}
                                className="w-full h-9 px-3 bg-white border border-amber-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: SIDEBAR DE RESUMEN FINANCIERO (STICKY) */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resumen Consolidado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo acumulado de las coberturas
                  </p>
                </div>
              </div>

              {/* Badge de Cliente */}
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
                  Desglose ({sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {sesiones.map((s, i) => {
                    const f = getSesionFinanzas(s)
                    return (
                      <div key={s.id} className="pt-1.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 truncate">
                            #{i + 1} {s.titulo || s.lugar || "Cobertura Externa"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {s.fecha_evento} • {f.horas.toFixed(1)}h ({s.hora_inicio} - {s.hora_fin})
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">
                          ${f.total.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Horas totales:</span>
                  <span className="font-bold text-slate-900">{totals.sumHoras.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal base:</span>
                  <span className="font-bold text-slate-900">${totals.sumBase.toFixed(2)}</span>
                </div>
                {totals.sumDesc > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuentos acumulados:</span>
                    <span>-${totals.sumDesc.toFixed(2)}</span>
                  </div>
                )}
                {totals.sumRec > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Recargos acumulados:</span>
                    <span>+${totals.sumRec.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Caja Oscura con Total Final */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total a Facturar
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {sesiones.length} cobertura{sesiones.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  {(totals.sumDesc > 0 || totals.sumRec > 0) && (
                    <span className="text-xs text-slate-400 line-through block">
                      ${totals.sumBase.toFixed(2)}
                    </span>
                  )}
                  <span className="text-2xl font-black text-white tracking-tight">
                    ${totals.sumTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Envío */}
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
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                      <span>
                        {isEdit
                          ? "Actualizar Cobertura"
                          : `Registrar ${sesiones.length} Cobertura${sesiones.length !== 1 ? "s" : ""}`}
                      </span>
                    </>
                  )}
                </button>

                <Link
                  to="/servicios/streaming"
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-2xs"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Nuevo Cliente Externo */}
      <NuevoClienteModal
        isOpen={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onCreated={(c) => {
          setCliente({
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
  )
}
