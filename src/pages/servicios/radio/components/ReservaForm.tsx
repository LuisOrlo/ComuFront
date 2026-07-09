import { useState, useEffect, useMemo, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { ArrowLeft } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { radioService, type TarifaRadio, type ReservaRadio } from "@/services/radio.service"
import { staffService } from "@/services/staff.service"
import { personasService, type Persona } from "@/services/personas.service"
import { toast } from "sonner"
import { OperadorSelector } from "./OperadorSelector"
 
export function ReservaForm({
  isOpen,
  onClose,
  tarifas,
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
  const [tarifaId, setTarifaId] = useState("")
  const [fecha, setFecha] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [duracionMinutos, setDuracionMinutos] = useState(60)
  const [personaId, setPersonaId] = useState("")
  const [clienteExternoNombre, setClienteExternoNombre] = useState("")
  const [incluyeOperador, setIncluyeOperador] = useState(false)
  const [operadorId, setOperadorId] = useState<string | null>(null)
  const [operadores, setOperadores] = useState<{ id: string; nombres: string; apellidos: string; cargo?: string }[]>([])
  const [observaciones, setObservaciones] = useState("")
  const [saving, setSaving] = useState(false)
  const [tipoResponsable, setTipoResponsable] = useState<"persona" | "externo">("persona")
  const [personaSearch, setPersonaSearch] = useState("")
  const [personasDisponibles, setPersonasDisponibles] = useState<Persona[]>([])
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false)
  const [searchingPersona, setSearchingPersona] = useState(false)
  const personaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node))
        setShowPersonaDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (!personaSearch.trim() || tipoResponsable !== "persona") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPersonasDisponibles([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingPersona(true)
      try {
        const res = await personasService.getPersonas({ buscar: personaSearch, tipo: 'estudiante,instructor,staff,secretaria' })
        setPersonasDisponibles(res.data)
      } catch {
        setPersonasDisponibles([])
      } finally {
        setSearchingPersona(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [personaSearch, tipoResponsable])

  const selectPersona = (p: Persona) => {
    setPersonaId(p.id)
    setPersonaSearch(`${p.nombres} ${p.apellidos}`)
    setShowPersonaDropdown(false)
  }

  const clearPersona = () => {
    setPersonaId("")
    setPersonaSearch("")
    setPersonasDisponibles([])
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isOpen) return
    if (editingReserva) {
      setTarifaId(editingReserva.tarifa_id)
      setFecha(editingReserva.fecha_reserva)
      setHoraInicio(editingReserva.hora_inicio)
      const inicio = editingReserva.hora_inicio.split(":").map(Number)
      const fin = editingReserva.hora_fin.split(":").map(Number)
      setDuracionMinutos((fin[0] * 60 + fin[1]) - (inicio[0] * 60 + inicio[1]))
      setPersonaId(editingReserva.persona_id || "")
      if (editingReserva.persona_id) {
        personasService.getPersonaById(editingReserva.persona_id)
          .then(p => { setPersonaSearch(`${p.nombres} ${p.apellidos}`) })
          .catch(() => {})
      }
      setClienteExternoNombre(editingReserva.cliente_externo?.nombres || "")
      setIncluyeOperador(editingReserva.incluye_operador)
      setOperadorId(editingReserva.operador_id || null)
      setObservaciones(editingReserva.observaciones || "")
      setTipoResponsable(editingReserva.persona_id ? "persona" : "externo")
      if (!editingReserva.persona_id) { setPersonaSearch(""); setPersonasDisponibles([]) }
    } else {
      setTarifaId(tarifas[0]?.id || "")
      setFecha(fechaPreseleccionada || new Date().toISOString().split("T")[0])
      setHoraInicio(horaPreseleccionada || "08:00")
      setDuracionMinutos(60)
      setPersonaId("")
      setPersonaSearch("")
      setPersonasDisponibles([])
      setClienteExternoNombre("")
      setIncluyeOperador(false)
      setOperadorId(null)
      setObservaciones("")
      setTipoResponsable("persona")
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

      if (tipoResponsable === "persona") {
        if (!personaId) {
          toast.error("Seleccione un cliente")
          setSaving(false)
          return
        }
        payload.persona_id = personaId
        payload.cliente_externo_id = null
      } else {
        if (!clienteExternoNombre.trim()) {
          toast.error("Ingrese el nombre del cliente externo")
          setSaving(false)
          return
        }
        payload.persona_id = null
        payload.cliente_externo_id = clienteExternoNombre.trim()
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
              min={30}
              max={480}
              step={15}
              value={duracionMinutos}
              onChange={e => setDuracionMinutos(Math.max(15, parseInt(e.target.value) || 60))}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Cliente</label>
            <div className="flex gap-2">
              {(["persona", "externo"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTipoResponsable(t); setShowPersonaDropdown(false) }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border",
                    tipoResponsable === t
                      ? "bg-charcoal text-white border-charcoal"
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                  )}
                  style={tipoResponsable === t ? { backgroundColor: COLORS.CHARCOAL, borderColor: COLORS.CHARCOAL } : {}}
                >
                  {t === "persona" ? "Cliente interno" : "Cliente externo"}
                </button>
              ))}
            </div>
            {tipoResponsable === "persona" ? (
              <div className="relative mt-2" ref={personaRef}>
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre..."
                    value={personaSearch}
                    onChange={e => { setPersonaSearch(e.target.value); setShowPersonaDropdown(true) }}
                    onFocus={() => { if (personaSearch.trim()) setShowPersonaDropdown(true) }}
                    className="w-full pl-10 pr-9 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  />
                  {personaId && (
                    <button type="button" onClick={clearPersona}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </button>
                  )}
                </div>
                {showPersonaDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border rounded-xl shadow-xl max-h-52 overflow-y-auto"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {searchingPersona ? (
                      <div className="p-4 text-center text-xs opacity-40">Buscando...</div>
                    ) : personasDisponibles.length === 0 ? (
                      <div className="p-4 text-center text-xs opacity-40">
                        {personaSearch.trim() ? "Sin resultados" : "Escribe para buscar"}
                      </div>
                    ) : (
                      personasDisponibles.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPersona(p)}
                          className={cn(
                            "w-full text-left px-4 py-3 text-xs font-medium transition-colors hover:bg-gray-50 border-b last:border-b-0",
                            personaId === p.id && "bg-gray-50/80"
                          )}
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        >
                          <span className="font-bold" style={{ color: COLORS.CHARCOAL }}>
                            {p.nombres} {p.apellidos}
                          </span>
                          {p.cedula && <span className="ml-2 opacity-40">· {p.cedula}</span>}
                          {p.correo && <span className="ml-2 opacity-30 text-[10px]">{p.correo}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Nombre del cliente externo"
                value={clienteExternoNombre}
                onChange={e => setClienteExternoNombre(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 transition-all bg-gray-50/50"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            )}
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
