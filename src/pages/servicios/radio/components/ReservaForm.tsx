import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Search01Icon, Cancel01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { ArrowLeft, UserPlus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { radioService, type TarifaRadio, type ReservaRadio } from "@/services/radio.service"
import { staffService } from "@/services/staff.service"
import { personasService } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"
import { OperadorSelector } from "./OperadorSelector"
import { useNavigate } from "react-router"

interface ClienteOption {
  tipo: "persona" | "cliente_externo"
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
}
 
export function ReservaForm({
  isOpen,
  onClose,
  tarifas,
  editingReserva,
  fechaPreseleccionada,
  horaPreseleccionada,
  onSaved,
  nuevoCliente,
}: {
  isOpen: boolean
  onClose: () => void
  tarifas: TarifaRadio[]
  editingReserva?: ReservaRadio | null
  fechaPreseleccionada?: string
  horaPreseleccionada?: string
  onSaved: () => void
  nuevoCliente?: ClienteExterno
}) {
  const [tarifaId, setTarifaId] = useState("")
  const [fecha, setFecha] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [duracionInput, setDuracionInput] = useState("60")
  const [incluyeOperador, setIncluyeOperador] = useState(false)
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [operadores, setOperadores] = useState<{ id: string; nombres: string; apellidos: string; cargo?: string }[]>([])
  const [observaciones, setObservaciones] = useState("")
  const [saving, setSaving] = useState(false)

  const [clienteId, setClienteId] = useState("")
  const [clienteTipo, setClienteTipo] = useState<"persona" | "cliente_externo" | "">("")
  const [clienteSearch, setClienteSearch] = useState("")
  const [clientesDisponibles, setClientesDisponibles] = useState<ClienteOption[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [searchingCliente, setSearchingCliente] = useState(false)
  const navigate = useNavigate()
  const clienteRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node))
        setShowClienteDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const searchClientes = useCallback(async (query: string) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (query.trim().length < 2) {
      setClientesDisponibles([])
      setSearchingCliente(false)
      return
    }

    setSearchingCliente(true)
    try {
      const [personasRes, clientesRes] = await Promise.allSettled([
        personasService.getPersonas({ buscar: query, tipo: 'estudiante,instructor' }),
        clientesService.getClientes({ search: query, per_page: 15 }),
      ])

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
          })
        }
      }

      if (clientesRes.status === "fulfilled") {
        const data = (clientesRes.value as { data: ClienteExterno[] }).data
        for (const c of data) {
          if (results.some(r => r.tipo === "cliente_externo" && r.id === c.id)) continue
          results.push({
            tipo: "cliente_externo",
            id: c.id,
            nombres: c.nombres,
            apellidos: c.apellidos || "",
            cedula: c.cedula,
            correo: c.correo,
          })
        }
      }

      setClientesDisponibles(results)
    } catch {
      if (!controller.signal.aborted) setClientesDisponibles([])
    } finally {
      if (!controller.signal.aborted) setSearchingCliente(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchClientes(clienteSearch), 350)
    return () => { clearTimeout(timer); if (abortRef.current) abortRef.current.abort() }
  }, [clienteSearch, searchClientes])

  const selectCliente = (opt: ClienteOption) => {
    setClienteId(opt.id)
    setClienteTipo(opt.tipo)
    setClienteSearch(`${opt.nombres} ${opt.apellidos}`.trim())
    setShowClienteDropdown(false)
  }

  const clearCliente = () => {
    setClienteId("")
    setClienteTipo("")
    setClienteSearch("")
    setClientesDisponibles([])
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!nuevoCliente) return
    setClienteId(nuevoCliente.id)
    setClienteTipo("cliente_externo")
    setClienteSearch(`${nuevoCliente.nombres} ${nuevoCliente.apellidos || ""}`.trim())
    setShowClienteDropdown(false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [nuevoCliente])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isOpen) return
    if (editingReserva) {
      setTarifaId(editingReserva.tarifa_id)
      setFecha(editingReserva.fecha_reserva)
      setHoraInicio(editingReserva.hora_inicio)
      const inicio = editingReserva.hora_inicio.split(":").map(Number)
      const fin = editingReserva.hora_fin.split(":").map(Number)
      setDuracionInput(String((fin[0] * 60 + fin[1]) - (inicio[0] * 60 + inicio[1])))
      setIncluyeOperador(editingReserva.incluye_operador)
      setOperadorId(editingReserva.operador_id || null)
      setObservaciones(editingReserva.observaciones || "")

      if (editingReserva.persona_id) {
        setClienteId(editingReserva.persona_id)
        setClienteTipo("persona")
        personasService.getPersonaById(editingReserva.persona_id)
          .then(p => setClienteSearch(`${p.nombres} ${p.apellidos}`.trim()))
          .catch(() => {})
      } else if (editingReserva.cliente_externo) {
        setClienteId(editingReserva.cliente_externo.id)
        setClienteTipo("cliente_externo")
        setClienteSearch(editingReserva.cliente_externo.nombres)
      } else {
        setClienteId("")
        setClienteTipo("")
        setClienteSearch("")
      }
    } else {
      setTarifaId(tarifas[0]?.id || "")
      setFecha(fechaPreseleccionada || new Date().toISOString().split("T")[0])
      setHoraInicio(horaPreseleccionada || "08:00")
      setDuracionInput("60")
      setIncluyeOperador(false)
      setOperadorId(null)
      setObservaciones("")
      setClienteId("")
      setClienteTipo("")
      setClienteSearch("")
      setClientesDisponibles([])
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, editingReserva, fechaPreseleccionada, horaPreseleccionada, tarifas])

  useEffect(() => {
    if (!isOpen) return
    staffService.getStaff({ page: 1 })
      .then(res => {
        setOperadores(
          res.data
            .filter(p => p.es_activo && (p.perfilStaff || p.perfilInstructor))
            .map(p => ({
              id: p.id,
              nombres: p.nombres,
              apellidos: p.apellidos,
              cargo: p.perfilStaff?.cargo || p.perfilInstructor?.especialidad || "Staff",
            }))
        )
      })
      .catch(() => {})
  }, [isOpen])

  const tarifaSeleccionada = useMemo(
    () => tarifas.find(t => t.id === tarifaId),
    [tarifaId, tarifas]
  )

  const duracionMinutos = useMemo(() => {
    const n = parseInt(duracionInput)
    return isNaN(n) || n < 1 ? 0 : Math.min(Math.max(n, 15), 480)
  }, [duracionInput])

  const horaFin = useMemo(() => {
    const [h, m] = horaInicio.split(":").map(Number)
    const totalMin = h * 60 + m + duracionMinutos
    const hh = Math.floor(totalMin / 60)
    const mm = totalMin % 60
    return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`
  }, [horaInicio, duracionMinutos])

  const precioCalculado = useMemo(() => {
    if (!tarifaSeleccionada) return 0
    const horas = duracionMinutos / 60
    return Math.round(horas * tarifaSeleccionada.precio_por_hora * 100) / 100
  }, [tarifaSeleccionada, duracionMinutos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tarifaId || !fecha || !horaInicio) {
      toast.error("Complete los campos obligatorios")
      return
    }

    if (incluyeOperador && !operadorId) {
      toast.error("Seleccione un operador o desactive 'Incluye operador'")
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        tarifa_id: parseInt(tarifaId),
        fecha_reserva: fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        incluye_operador: incluyeOperador,
        operador_id: incluyeOperador ? operadorId : null,
        observaciones: observaciones || null,
      }

      if (!clienteId) {
        toast.error("Seleccione o registre un cliente")
        setSaving(false)
        return
      }
      if (clienteTipo === "persona") {
        payload.persona_id = clienteId
        payload.cliente_externo_id = null
      } else {
        payload.persona_id = null
        payload.cliente_externo_id = clienteId
      }

      if (editingReserva) {
        await radioService.updateReserva(editingReserva.id, payload)
        toast.success("Reserva actualizada")
      } else {
        await radioService.createReserva(payload)
        toast.success("Reserva creada")
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al guardar reserva"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="w-full bg-white rounded-[2.5rem] flex flex-col min-h-0">
      <div className="flex items-center justify-between px-8 py-6 border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>
            {editingReserva ? "Editar Reserva" : "Nueva Reserva"}
          </h2>
          <p className="text-xs opacity-50 mt-1">Complete la información para el alquiler de la cabina de radio</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:bg-gray-100 bg-white"
          style={{ color: COLORS.CHARCOAL, borderColor: COLORS.BORDER_SUBTLE }}
        >
          <ArrowLeft size={16} />
          <span>Volver al Alquiler</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto">
        {/* Columna Izquierda: Datos de la Reserva */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Tarifa</label>
            <select
              value={tarifaId}
              onChange={e => setTarifaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
              required
            >
              <option value="">Seleccionar tarifa...</option>
              {tarifas.filter(t => t.es_activo).map(t => (
                <option key={t.id} value={t.id}>{t.nombre} — ${t.precio_por_hora.toFixed(2)}/h</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Duración (minutos)</label>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={duracionInput}
              onChange={e => setDuracionInput(e.target.value)}
              onBlur={() => {
                const n = parseInt(duracionInput)
                if (isNaN(n) || n < 1) setDuracionInput("60")
                else setDuracionInput(String(Math.min(Math.max(n, 15), 480)))
              }}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Cliente</label>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={clienteRef}>
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre, cédula..."
                    value={clienteSearch}
                    onChange={e => { setClienteSearch(e.target.value); setShowClienteDropdown(true) }}
                    onFocus={() => { if (clienteSearch.trim()) setShowClienteDropdown(true) }}
                    className="w-full pl-10 pr-9 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  />
                  {clienteId && (
                    <button type="button" onClick={clearCliente}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </button>
                  )}
                </div>
                {showClienteDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {searchingCliente ? (
                      <div className="p-4 text-center text-xs opacity-40">Buscando...</div>
                    ) : clientesDisponibles.length === 0 ? (
                      <div className="p-4 text-center text-xs opacity-40">
                        {clienteSearch.trim().length >= 2 ? "Sin resultados" : "Escribe al menos 2 caracteres"}
                      </div>
                    ) : (
                      clientesDisponibles.map(opt => {
                        const isSelected = clienteId === opt.id && clienteTipo === opt.tipo
                        return (
                          <button
                            key={`${opt.tipo}_${opt.id}`}
                            type="button"
                            onClick={() => selectCliente(opt)}
                            className={cn(
                              "w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3",
                              isSelected && "bg-gray-50/80"
                            )}
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                          >
                            <div className={cn(
                              "size-8 rounded-xl flex items-center justify-center shrink-0",
                              opt.tipo === "persona" ? "bg-indigo-100" : "bg-emerald-100"
                            )}>
                              <HugeiconsIcon icon={UserIcon} size={14} style={{ color: opt.tipo === "persona" ? "#6366f1" : "#059669" }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>
                                {opt.nombres} {opt.apellidos}
                              </span>
                              <span className={cn(
                                "ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded",
                                opt.tipo === "persona" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                              )}>
                                {opt.tipo === "persona" ? "Interno" : "Externo"}
                              </span>
                              {opt.cedula && <span className="ml-2 opacity-40">· {opt.cedula}</span>}
                              {opt.correo && <span className="ml-2 opacity-30 text-[10px]">{opt.correo}</span>}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/clientes/nuevo?returnTo=/servicios/radio')}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-[0.97] shrink-0"
                style={{ backgroundColor: "oklch(0.55 0.18 160)", color: "white" }}
                title="Registrar nuevo cliente"
              >
                <UserPlus size={16} strokeWidth={2.5} />
                Nuevo
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Operador, Resumen y Acciones */}
        <div className="lg:col-span-5 space-y-6 lg:border-l lg:pl-8" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={UserGroupIcon} size={18} className="opacity-40" />
              <div>
                <p className="text-xs font-bold">Incluye operador</p>
                <p className="text-[9px] opacity-40">Asignar un operador de radio disponible</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIncluyeOperador(!incluyeOperador)
                if (incluyeOperador) setOperadorId(null)
              }}
              className={cn(
                "relative w-11 h-6 rounded-full transition-all",
                incluyeOperador ? "bg-emerald-500" : "bg-gray-300"
              )}
            >
              <div className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all",
                incluyeOperador ? "left-[22px]" : "left-0.5"
              )} />
            </button>
          </div>

          {incluyeOperador && (
            <OperadorSelector
              operadores={operadores}
              selectedId={operadorId}
              onSelect={setOperadorId}
            />
          )}

          <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/80 p-5 space-y-3 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Resumen de Alquiler</p>
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-60">Duración</span>
              <span className="text-sm font-bold">{duracionMinutos} min</span>
            </div>
            {tarifaSeleccionada && (
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-60">Tarifa por hora</span>
                <span className="text-sm font-bold">${tarifaSeleccionada.precio_por_hora.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="text-xs font-bold">Total estimado</span>
              <span className="text-lg font-bold" style={{ color: COLORS.ACCENT }}>${precioCalculado.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all resize-none bg-gray-50/50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50 bg-white"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              {saving ? "Guardando..." : editingReserva ? "Actualizar" : "Crear Reserva"}
            </button>
          </div>
        </div>
      </form>

    </div>
  )
}
