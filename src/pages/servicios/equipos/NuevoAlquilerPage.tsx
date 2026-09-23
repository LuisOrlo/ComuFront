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
  Note03Icon,
  AlertCircleIcon,
  CheckmarkCircle04Icon,
  Camera01Icon,
  Upload01Icon,
  Delete02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { UserPlus, Loader2, Tag, X } from "lucide-react"
import { cn, getStorageUrl } from "@/lib/utils"
import { equiposService, type Equipo } from "@/services/equipos.service"
import { personasService } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
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

const MAX_FOTO_SIZE = 2 * 1024 * 1024

export function NuevoAlquilerPage() {
  const navigate = useNavigate()
  const { equipoId, id } = useParams<{ equipoId: string; id: string }>()
  const editingAlquilerId = id || null
  const isEdit = !!editingAlquilerId

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [loading, setLoading] = useState(true)

  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().slice(0, 16))
  const [fechaDevolucion, setFechaDevolucion] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Descuentos
  const [descuentoTipo, setDescuentoTipo] = useState<"fijo" | "porcentaje">("fijo")
  const [descuentoValor, setDescuentoValor] = useState<string>("")
  const [motivoDescuento, setMotivoDescuento] = useState<string>("")
  const [showDescuento, setShowDescuento] = useState(false)

  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null)
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const clienteRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const personasEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "persona"),
    [clientesDisponibles],
  )
  const externosEnLista = useMemo(
    () => clientesDisponibles.filter((c) => c.tipo === "cliente_externo"),
    [clientesDisponibles],
  )

  useEffect(() => {
    const load = async () => {
      try {
        if (editingAlquilerId) {
          const alquiler = await equiposService.getAlquiler(editingAlquilerId)
          const eq = await equiposService.getEquipo(alquiler.equipo_id)
          setEquipo(eq)
          if (alquiler.fecha_entrega) setFechaEntrega(alquiler.fecha_entrega.slice(0, 16))
          if (alquiler.fecha_devolucion_esperada) {
            setFechaDevolucion(alquiler.fecha_devolucion_esperada.slice(0, 16))
          }
          setObservaciones(alquiler.observaciones || "")
          if (alquiler.foto_salida_url) {
            setFotoPreview(alquiler.foto_salida_url)
          }

          if (alquiler.monto_descuento && alquiler.monto_descuento > 0) {
            setShowDescuento(true)
            setDescuentoTipo("fijo")
            setDescuentoValor(alquiler.monto_descuento.toString())
            setMotivoDescuento(alquiler.motivo_descuento || "")
          }

          if (alquiler.persona_id) {
            const nombres = alquiler.persona?.nombres || ""
            const apellidos = alquiler.persona?.apellidos || ""
            setClienteId(alquiler.persona_id)
            setClienteTipo("persona")
            setSelectedCliente({
              tipo: "persona",
              id: alquiler.persona_id,
              nombres,
              apellidos,
              correo: alquiler.persona?.correo,
              cedula: alquiler.persona?.cedula,
              celular: alquiler.persona?.celular,
              personaTipo: alquiler.persona?.tipo,
            })
            setClienteSearch("")
          } else if (alquiler.cliente_externo_id) {
            const nombres = alquiler.cliente_externo?.nombres || ""
            const apellidos = alquiler.cliente_externo?.apellidos || ""
            setClienteId(alquiler.cliente_externo_id)
            setClienteTipo("cliente_externo")
            setSelectedCliente({
              tipo: "cliente_externo",
              id: alquiler.cliente_externo_id,
              nombres,
              apellidos,
              cedula: alquiler.cliente_externo?.cedula,
              correo: alquiler.cliente_externo?.correo,
              celular: alquiler.cliente_externo?.celular,
            })
            setClienteSearch("")
          }
        } else {
          if (!equipoId) {
            navigate("/servicios/equipos")
            return
          }
          const eq = await equiposService.getEquipo(equipoId)
          setEquipo(eq)
        }
      } catch {
        toast.error("Error al cargar datos del alquiler")
        navigate("/servicios/equipos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [editingAlquilerId, equipoId, navigate])

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
        personasService.getPersonas({ buscar: q, tipo: "estudiante,instructor,pasante,staff", per_page: 50, page: 1 }),
        clientesService.getClientes({ search: q, per_page: 50 }),
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
                apellidos: p.apellidos,
                cedula: p.cedula,
                correo: p.correo,
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
        .catch(() => {
          if (!controller.signal.aborted) setClientesDisponibles([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchingCliente(false)
        })
    }, 300)
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
    setClientesDisponibles([])
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
  }

  const calcularDias = () => {
    if (!fechaEntrega || !fechaDevolucion) return 0
    const inicio = new Date(fechaEntrega)
    const fin = new Date(fechaDevolucion)
    if (fin <= inicio) return 0
    return Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const dias = calcularDias()
  const precioOriginal = equipo ? Math.round(dias * equipo.precio_diario * 100) / 100 : 0
  let montoDescuento = 0
  if (showDescuento && descuentoValor) {
    if (descuentoTipo === "fijo") {
      montoDescuento = Number(descuentoValor) || 0
    } else {
      montoDescuento = (precioOriginal * (Number(descuentoValor) || 0)) / 100
    }
  }
  const precioTotal = Math.max(0, precioOriginal - montoDescuento)

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

  const handleRemoveFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
  }

  const isFormComplete = Boolean(
    clienteId &&
    fechaEntrega &&
    fechaDevolucion &&
    new Date(fechaDevolucion) > new Date(fechaEntrega) &&
    equipo &&
    !saving
  )

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!fechaEntrega) newErrors.fechaEntrega = "La fecha de entrega es obligatoria"
    if (!fechaDevolucion) newErrors.fechaDevolucion = "La fecha de devolución es obligatoria"
    if (fechaEntrega && fechaDevolucion && new Date(fechaDevolucion) <= new Date(fechaEntrega)) {
      newErrors.fechaDevolucion = "Debe ser posterior a la fecha de entrega"
    }
    if (!clienteId) newErrors.cliente = "Debes seleccionar un cliente o responsable"
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
      if (showDescuento && montoDescuento > 0) {
        form.append("precio_original", String(precioOriginal))
        form.append("monto_descuento", String(montoDescuento))
        if (motivoDescuento.trim()) {
          form.append("motivo_descuento", motivoDescuento.trim())
        }
      }
      if (observaciones.trim()) form.append("observaciones", observaciones.trim())
      if (fotoFile) form.append("foto_salida", fotoFile)
      if (clienteTipo === "persona") {
        form.append("persona_id", clienteId)
      } else {
        form.append("cliente_externo_id", clienteId)
      }

      if (editingAlquilerId) {
        await equiposService.updateAlquiler(editingAlquilerId, form)
        toast.success("Alquiler actualizado exitosamente")
        navigate("/servicios/equipos/alquileres")
      } else {
        await equiposService.createAlquiler(form)
        toast.success("Alquiler registrado exitosamente")
        navigate("/servicios/equipos/alquileres")
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (isEdit ? "Error al actualizar alquiler" : "Error al registrar alquiler")
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
          <p className="text-xs font-semibold text-slate-500">Cargando datos del alquiler...</p>
        </div>
      </div>
    )
  }

  if (!equipo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-slate-500">Equipo no encontrado</p>
          <button
            onClick={() => navigate("/servicios/equipos")}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate(isEdit ? "/servicios/equipos/alquileres" : "/servicios/equipos")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                SERVICIOS · ALQUILER DE EQUIPOS
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5 truncate">
                {isEdit ? "Editar Alquiler" : "Nuevo Alquiler"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(isEdit ? "/servicios/equipos/alquileres" : "/servicios/equipos")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormComplete}
              className={cn(
                "h-10 px-5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2",
                isFormComplete
                  ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                  <span>{isEdit ? "Guardar Cambios" : "Confirmar Alquiler"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formulario en Cuadrícula de 2 Columnas */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Principal Izquierda (Ficha y Parámetros) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Card 1: Período y Fechas */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Calendar03Icon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      Período de Alquiler
                    </h2>
                    <p className="text-xs text-slate-500">
                      Fecha de entrega y plazo acordado de devolución
                    </p>
                  </div>
                </div>

                {dias > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/80 text-[#fd761a] text-xs font-bold">
                    {dias} día{dias !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha Entrega */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
                    <span>
                      Fecha de entrega <span className="text-[#fd761a]">*</span>
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaEntrega}
                    onChange={(e) => {
                      setFechaEntrega(e.target.value)
                      if (errors.fechaEntrega) {
                        setErrors((prev) => {
                          const n = { ...prev }
                          delete n.fechaEntrega
                          return n
                        })
                      }
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, fechaEntrega: true }))}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 outline-none transition-all",
                      touched.fechaEntrega && errors.fechaEntrega
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20",
                    )}
                  />
                  {touched.fechaEntrega && errors.fechaEntrega && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.fechaEntrega}</span>
                    </p>
                  )}
                </div>

                {/* Fecha Devolución */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Calendar03Icon} size={13} className="text-slate-400" />
                    <span>
                      Devolución esperada <span className="text-[#fd761a]">*</span>
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaDevolucion}
                    onChange={(e) => {
                      setFechaDevolucion(e.target.value)
                      if (errors.fechaDevolucion) {
                        setErrors((prev) => {
                          const n = { ...prev }
                          delete n.fechaDevolucion
                          return n
                        })
                      }
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, fechaDevolucion: true }))}
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 outline-none transition-all",
                      touched.fechaDevolucion && errors.fechaDevolucion
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20",
                    )}
                  />
                  {touched.fechaDevolucion && errors.fechaDevolucion && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.fechaDevolucion}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Cliente y Responsable */}
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
                      Asigna la persona o cliente que firma la responsabilidad
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
                /* Campo de Búsqueda y Dropdown de Coincidencias */
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
                      className={cn(
                        "w-full h-11 pl-10 pr-10 rounded-xl border bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all",
                        touched.cliente && errors.cliente
                          ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                          : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20",
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
                        <HugeiconsIcon icon={Cancel01Icon} size={15} />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-slate-400 shrink-0" />
                    <span>Escribe al menos 2 letras para buscar estudiantes, instructores o clientes externos.</span>
                  </p>

                  {touched.cliente && errors.cliente && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium mt-1.5">
                      <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                      <span>{errors.cliente}</span>
                    </p>
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
                            <span>Buscando coincidencias para "{clienteSearch}"...</span>
                          </div>
                        ) : clientesDisponibles.length === 0 ? (
                          <div className="p-6 text-center space-y-2">
                            <p className="text-xs font-semibold text-slate-600">
                              No se encontraron coincidencias para "{clienteSearch}"
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Verifica la ortografía o registra al cliente si es externo.
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
                                {clientesDisponibles.length} coincidencia{clientesDisponibles.length > 1 ? "s" : ""} encontrada{clientesDisponibles.length > 1 ? "s" : ""}
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
                                        {opt.cedula && (
                                          <span>
                                            <b className="font-normal text-slate-400">C.I:</b> {opt.cedula}
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
                                            <b className="font-normal text-slate-400">C.I:</b> {opt.cedula}
                                          </span>
                                        )}
                                        {opt.celular && (
                                          <span>
                                            <b className="font-normal text-slate-400">Tel:</b> {opt.celular}
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

            {/* Card 3: Foto del Equipo Entregado (Acta de Salida) */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Camera01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Foto del Equipo Entregado
                  </h2>
                  <p className="text-xs text-slate-500">
                    Constancia fotográfica de las condiciones físicas del equipo al entregarlo
                  </p>
                </div>
              </div>

              {fotoPreview ? (
                <div className="space-y-3">
                  <div className="relative aspect-video max-h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                    <img
                      src={fotoPreview}
                      alt="Foto de salida"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-800 text-xs font-semibold cursor-pointer hover:bg-white transition-colors shadow-sm">
                        Cambiar foto
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          onChange={handleFotoChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveFoto}
                        className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                        title="Eliminar foto"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{fotoFile ? fotoFile.name : "Foto de salida registrada"}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Quitar imagen
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-[#fd761a]/60 hover:bg-orange-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                  <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <HugeiconsIcon icon={Upload01Icon} size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Cargar foto de entrega del equipo
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                    Sube una foto del equipo entregado (JPG, PNG o WEBP, máx. 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </label>
              )}
            </div>

            {/* Card 4: Observaciones */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Note03Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Notas y Observaciones
                  </h2>
                  <p className="text-xs text-slate-500">
                    Detalles sobre el uso, accesorios entregados o condiciones específicas
                  </p>
                </div>
              </div>

              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Indica observaciones adicionales sobre el alquiler..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
              />
            </div>
          </div>

          {/* Columna Lateral Derecha (Resumen Financiero y Ficha de Equipo) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card 5: Resumen del Equipo a Alquilar */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <HugeiconsIcon icon={Camera01Icon} size={16} className="text-[#fd761a]" />
                  Equipo Seleccionado
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {equipo.estado === "disponible" ? "Disponible" : equipo.estado}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="size-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                  {equipo.foto_url ? (
                    <img
                      src={getStorageUrl(equipo.foto_url)}
                      alt={equipo.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <HugeiconsIcon icon={Camera01Icon} size={24} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{equipo.nombre}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {equipo.descripcion || "Sin especificaciones registradas."}
                  </p>
                  <p className="text-xs font-extrabold text-[#fd761a] mt-1.5">
                    ${Number(equipo.precio_diario).toFixed(2)}
                    <span className="text-[11px] font-normal text-slate-400 ml-1">/ día base</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Card 6: Desglose Financiero */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Liquidación de Pago
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cálculo automático de días y descuentos
                  </p>
                </div>
              </div>

              {/* Cálculo de Días */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Duración del alquiler</span>
                  <span className="font-bold text-slate-800">
                    {dias > 0 ? `${dias} día${dias !== 1 ? "s" : ""}` : "0 días"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tarifa unitaria</span>
                  <span className="font-semibold text-slate-800">
                    ${Number(equipo.precio_diario).toFixed(2)} / día
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Subtotal base</span>
                  <span className="font-bold text-slate-900">${precioOriginal.toFixed(2)}</span>
                </div>

                {/* Descuentos */}
                {!showDescuento ? (
                  <button
                    type="button"
                    onClick={() => setShowDescuento(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#fd761a] hover:underline cursor-pointer pt-1"
                  >
                    <Tag size={13} />
                    <span>+ Aplicar descuento o cortesía</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                        <Tag size={13} className="text-[#fd761a]" />
                        Descuento aplicado
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDescuento(false)
                          setDescuentoValor("")
                          setMotivoDescuento("")
                        }}
                        className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                        title="Quitar descuento"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Monto ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={descuentoValor}
                          onChange={(e) => setDescuentoValor(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Motivo
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Descuento cliente frecuente"
                          value={motivoDescuento}
                          onChange={(e) => setMotivoDescuento(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#fd761a]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Final */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total a facturar
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {dias} día{dias !== 1 ? "s" : ""} de alquiler
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
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="lg:col-span-12 pt-3 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 mt-2">
            {!isFormComplete && (
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-slate-400" />
                <span>
                  {!clienteId
                    ? "Debes seleccionar un cliente para habilitar el guardado."
                    : dias <= 0
                      ? "La fecha de retorno debe ser posterior a la fecha de entrega."
                      : "Completa los campos requeridos para continuar."}
                </span>
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate(isEdit ? "/servicios/equipos/alquileres" : "/servicios/equipos")}
                className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormComplete}
                className={cn(
                  "h-11 px-7 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2",
                  isFormComplete
                    ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60",
                )}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={17} />
                    <span>{isEdit ? "Guardar Cambios" : "Confirmar Alquiler"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <NuevoClienteModal
          isOpen={showNuevoCliente}
          onClose={() => setShowNuevoCliente(false)}
          onCreated={handleNewClienteCreated}
        />
      </div>
    </div>
  )
}
