import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { setsService, type SetItem, type ReservaSet } from "@/services/sets.service"
import { DetalleSetModal } from "./components/DetalleSetModal"
import { toast } from "sonner"

function getWeekDays(refDate: Date): Date[] {
  const d = new Date(refDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const monday = new Date(d.setDate(diff))
  return Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + i)
    return dayDate
  })
}

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0]
}

export function SetsAgendaPage() {
  const navigate = useNavigate()
  const [fechaRef, setFechaRef] = useState<Date>(() => new Date())
  const [sets, setSets] = useState<SetItem[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string>("todos")
  const [reservas, setReservas] = useState<ReservaSet[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedReserva, setSelectedReserva] = useState<ReservaSet | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const weekDays = useMemo(() => getWeekDays(fechaRef), [fechaRef])
  const fechaInicio = fmtDate(weekDays[0])
  const fechaFin = fmtDate(weekDays[6])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [resSets, resReservas] = await Promise.all([
        setsService.getSets(),
        setsService.getReservas({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          set_id: selectedSetId !== "todos" ? selectedSetId : undefined,
        }),
      ])
      setSets(resSets || [])
      setReservas(resReservas || [])
    } catch {
      toast.error("Error al cargar la agenda de sets")
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin, selectedSetId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const prevWeek = () => {
    const d = new Date(fechaRef)
    d.setDate(d.getDate() - 7)
    setFechaRef(d)
  }

  const nextWeek = () => {
    const d = new Date(fechaRef)
    d.setDate(d.getDate() + 7)
    setFechaRef(d)
  }

  const goToday = () => {
    setFechaRef(new Date())
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/servicios/sets")}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition shadow-2xs"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#fd761a] uppercase tracking-wider">
                Servicios Audiovisuales
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-500">Agenda Semanal</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Calendario de Sets</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/servicios/sets/nueva-reserva")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition"
          >
            <Plus size={16} />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Bar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        {/* Set Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filtrar Set:</span>
          <select
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#fd761a]"
          >
            <option value="todos">Todos los Sets</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Week navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Hoy
          </button>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={prevWeek}
              className="p-2 hover:bg-slate-50 text-slate-600 transition"
            >
              <ArrowLeft size={15} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {weekDays[0].toLocaleDateString("es-EC", { day: "numeric", month: "short" })} –{" "}
              {weekDays[6].toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={nextWeek}
              className="p-2 hover:bg-slate-50 text-slate-600 transition"
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-400">Cargando disponibilidad de la semana...</div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-slate-100 overflow-x-auto min-w-[700px]">
            {weekDays.map((day) => {
              const dateStr = fmtDate(day)
              const isToday = fmtDate(new Date()) === dateStr
              const dayReservas = reservas.filter((r) => r.fecha_reserva === dateStr && r.estado !== "cancelado")

              return (
                <div key={dateStr} className="min-w-[100px] flex flex-col">
                  {/* Day Header */}
                  <div className={`p-3 text-center border-b border-slate-100 ${isToday ? "bg-orange-50/70" : "bg-slate-50/50"}`}>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {day.toLocaleDateString("es-EC", { weekday: "short" })}
                    </p>
                    <p className={`text-base font-black ${isToday ? "text-[#fd761a]" : "text-slate-900"}`}>
                      {day.getDate()}
                    </p>
                  </div>

                  {/* Day Content */}
                  <div className="p-2 space-y-2 flex-1 min-h-[300px] bg-white">
                    {dayReservas.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-300 italic py-8">
                        Disponible
                      </div>
                    ) : (
                      dayReservas.map((r) => {
                        const cliente = r.persona || r.cliente_externo
                        const clienteNombre = cliente ? `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() : "Reserva"

                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedReserva(r)
                              setDetalleOpen(true)
                            }}
                            className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100/90 transition cursor-pointer text-left shadow-2xs space-y-1"
                          >
                            <p className="text-[11px] font-bold text-slate-900 truncate">{r.set?.nombre || "Set"}</p>
                            <p className="text-[10px] text-indigo-700 font-semibold truncate">{clienteNombre}</p>
                            <span className="text-[9px] font-bold text-slate-500 block">
                              {r.hora_inicio?.substring(0, 5)} - {r.hora_fin?.substring(0, 5)}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Detalle */}
      <DetalleSetModal
        isOpen={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        reserva={selectedReserva}
        set={selectedReserva ? sets.find((s) => s.id === selectedReserva.set_id) : undefined}
        onEdit={
          selectedReserva
            ? () => navigate(`/servicios/sets/reservas/${selectedReserva.id}/editar`)
            : undefined
        }
        onPago={
          selectedReserva
            ? () => {
                const clienteNombre = selectedReserva.persona
                  ? `${selectedReserva.persona.nombres || ""} ${selectedReserva.persona.apellidos || ""}`.trim()
                  : selectedReserva.cliente_externo
                  ? `${selectedReserva.cliente_externo.nombres || ""} ${selectedReserva.cliente_externo.apellidos || ""}`.trim()
                  : "Cliente"
                const total = Number(selectedReserva.precio_total || 0)
                const saldo = selectedReserva.cuenta_por_cobrar
                  ? Number(selectedReserva.cuenta_por_cobrar.saldo_pendiente ?? (total - selectedReserva.cuenta_por_cobrar.monto_abonado))
                  : total

                navigate(`/finanzas/pagos/cuentas/servicios/pago/${selectedReserva.id}`, {
                  state: {
                    tipo: "set",
                    servicioId: selectedReserva.id,
                    cuentaId: selectedReserva.cuenta_por_cobrar?.id,
                    nombre: clienteNombre,
                    montoTotal: total,
                    montoSaldo: saldo,
                    nombreServicio: `Alquiler de Set ${selectedReserva.set?.nombre || ""}`,
                  },
                })
              }
            : undefined
        }
      />
    </div>
  )
}
