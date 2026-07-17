import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Calendar02Icon,
  Money01Icon,
  InformationCircleIcon,
  UserIcon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  MatrixIcon,
  Home02Icon,
  Clock01Icon,
  Mail01Icon,
  CallIcon,
  IdentificationIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons"
import { X, Plus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"
import { AulasKPIs } from "./components/AulasKPIs"

type VistaModo = "semanal" | "diaria" | "lista"

const AULA_PALETTE = [
  { bg: "bg-indigo-500", bgLight: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-300", dot: "bg-indigo-500" },
  { bg: "bg-emerald-500", bgLight: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-amber-500", bgLight: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" },
  { bg: "bg-rose-500", bgLight: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", dot: "bg-rose-500" },
  { bg: "bg-cyan-500", bgLight: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-300", dot: "bg-cyan-500" },
  { bg: "bg-violet-500", bgLight: "bg-violet-50", text: "text-violet-700", border: "border-violet-300", dot: "bg-violet-500" },
  { bg: "bg-orange-500", bgLight: "bg-orange-50", text: "text-orange-700", border: "border-orange-300", dot: "bg-orange-500" },
  { bg: "bg-teal-500", bgLight: "bg-teal-50", text: "text-teal-700", border: "border-teal-300", dot: "bg-teal-500" },
]

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  reservado: { label: "Reservado", color: "bg-blue-100 text-blue-700" },
  confirmado: { label: "Confirmado", color: "bg-green-100 text-green-700" },
  en_progreso: { label: "En progreso", color: "bg-amber-100 text-amber-700" },
  completado: { label: "Completado", color: "bg-gray-100 text-gray-600" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
}

function fmtDate(d: Date) { return d.toISOString().split("T")[0] }
function fmtHora(h: string) { return h.substring(0, 5) }

function getWeekRange(date: Date) {
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function getWeekDays(monday: Date) {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

export function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null)
  
  // Reservas
  const [reservas, setReservas] = useState<ReservaAula[]>([])
  const navigate = useNavigate()

  // Vista general
  const [modoVista, setModoVista] = useState<"aula" | "general">("aula")
  const [vistaSub, setVistaSub] = useState<VistaModo>("semanal")
  const [fechaRef, setFechaRef] = useState(() => new Date())
  const [reservasGenerales, setReservasGenerales] = useState<ReservaAula[]>([])
  const [detalleReserva, setDetalleReserva] = useState<ReservaAula | null>(null)
  const [detalleOpen, setDetalleOpen] = useState(false)

  const { monday: genMonday, sunday: genSunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const genWeekDays = useMemo(() => getWeekDays(genMonday), [genMonday])

  const loadAulas = async () => {
    try {
      setLoading(true)
      const data = await aulasService.getAulas()
      setAulas(data)
      if (data.length > 0 && !selectedAula) {
        handleSelectAula(data[0])
      }
    } catch {
      toast.error("Error al cargar aulas")
    } finally {
      setLoading(false)
    }
  }

  const loadReservas = async (aulaId: string) => {
    try {
      const data = await aulasService.getReservas({ aula_id: aulaId })
      setReservas(data)
    } catch {
      toast.error("Error al cargar reservas")
    }
  }

  const loadReservasGenerales = useCallback(async () => {
    try {
      const data = await aulasService.getReservas({
        fecha_inicio: fmtDate(genMonday),
        fecha_fin: fmtDate(genSunday),
      })
      setReservasGenerales(data)
    } catch {
      // silent
    }
  }, [genMonday, genSunday])

  useEffect(() => {
    if (modoVista === "general") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadReservasGenerales()
    }
  }, [modoVista, loadReservasGenerales])

  const colorForAula = (aulaId: string) => AULA_PALETTE[aulas.findIndex(a => a.id === aulaId) % AULA_PALETTE.length]

  const getReservasSlot = (dateStr: string, hour: number, aulaId?: string) => {
    return reservasGenerales.filter(r => {
      if (r.fecha_reserva !== dateStr) return false
      if (aulaId && r.aula_id !== aulaId) return false
      const hIni = parseInt(r.hora_inicio.split(":")[0])
      const hFin = parseInt(r.hora_fin.split(":")[0])
      return hour >= hIni && hour < hFin
    })
  }

  const isFirstHour = (r: ReservaAula, h: number) => h === parseInt(r.hora_inicio.split(":")[0])
  const reservaSpan = (r: ReservaAula) => Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0]))

  const handleSelectAula = (aula: Aula) => {
    setSelectedAula(aula)
    loadReservas(aula.id)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAulas()
    loadReservasGenerales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      {/* Header */}
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Alquiler de Aulas
            </h1>
          </div>
          
          <Link
            to="/servicios/aulas/gestion"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
            style={{ color: COLORS.CHARCOAL, backgroundColor: "oklch(0.95 0 0)" }}
          >
            <HugeiconsIcon icon={PackageIcon} size={14} />
            Gestionar Aulas
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-6">
        {/* Aula selector tabs */}
        <section className="shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {loading ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-9 w-28 rounded-xl bg-white border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                ))}
              </div>
            ) : aulas.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <HugeiconsIcon icon={InformationCircleIcon} size={16} className="opacity-30" />
                <span className="text-xs font-bold opacity-30">No hay aulas configuradas</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {aulas.map((aula, i) => {
                  const isSelected = selectedAula?.id === aula.id
                  const now = new Date()
                  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                  const date = now.toISOString().split('T')[0]
                  const occupied = reservasGenerales.some(r =>
                    r.aula_id === aula.id && r.fecha_reserva === date &&
                    r.estado !== "cancelado" && time >= r.hora_inicio && time < r.hora_fin
                  )
                  return (
                    <motion.button
                      key={aula.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                      onClick={() => handleSelectAula(aula)}
                      className={cn(
                        "relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97]",
                        isSelected
                          ? "bg-white shadow-sm border-2"
                          : "bg-white/50 hover:bg-white border-2 border-transparent hover:border-black/10"
                      )}
                      style={{
                        borderColor: isSelected ? COLORS.ACCENT : undefined,
                        color: COLORS.CHARCOAL,
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-aula-tab"
                          className="absolute inset-0 rounded-xl"
                          style={{ backgroundColor: `${COLORS.ACCENT}08` }}
                        />
                      )}
                      <span className="relative z-10">{aula.nombre}</span>
                      <div className={cn("relative z-10 size-2 rounded-full shrink-0", occupied ? "bg-red-500" : "bg-emerald-500")} />
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <AulasKPIs aulas={aulas} reservas={reservasGenerales} />

        {/* Bottom: Cronograma */}
        <main className="flex-1 bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {/* Tab bar */}
          <div className="shrink-0 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl">
                {(["aula", "general"] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setModoVista(k)}
                    className={cn(
                      "px-4 py-2 rounded-[10px] text-xs font-bold transition-all",
                      modoVista === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                    )}
                  >
                    {k === "aula" ? "Por Aula" : "Agenda General"}
                  </button>
                ))}
              </div>

              {modoVista === "general" && (
                <div className="flex gap-0.5 p-0.5 bg-gray-200/70 rounded-xl ml-2">
                  {([
                    { k: "semanal", label: "Sem", icon: Calendar03Icon },
                    { k: "diaria", label: "Día", icon: Calendar02Icon },
                    { k: "lista", label: "Lista", icon: MatrixIcon },
                  ] as const).map(({ k, label, icon }) => (
                    <button
                      key={k}
                      onClick={() => setVistaSub(k)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 rounded-[10px] text-[10px] font-bold transition-all",
                        vistaSub === k ? "bg-white text-charcoal shadow-sm" : "text-charcoal/40 hover:text-charcoal/60"
                      )}
                    >
                      <HugeiconsIcon icon={icon} size={12} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {modoVista === "general" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() - (vistaSub === "diaria" ? 1 : 7)); setFechaRef(d) }} className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                    <HugeiconsIcon icon={ArrowLeft02Icon} size={14} className="opacity-50" />
                  </button>
                  <span className="text-[11px] font-bold opacity-60 min-w-[120px] text-center">
                    {vistaSub === "diaria"
                      ? fechaRef.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
                      : `${genMonday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${genSunday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
                    }
                  </span>
                  <button onClick={() => { const d = new Date(fechaRef); d.setDate(d.getDate() + (vistaSub === "diaria" ? 1 : 7)); setFechaRef(d) }} className="size-7 flex items-center justify-center rounded-full hover:bg-black/5">
                    <HugeiconsIcon icon={ArrowRight02Icon} size={14} className="opacity-50" />
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px]">
                  {aulas.slice(0, 5).map((a, i) => (
                    <div key={a.id} className="flex items-center gap-1"><div className={cn("size-2 rounded-sm", AULA_PALETTE[i % 8].dot)} /><span className="opacity-40 truncate max-w-[60px]">{a.nombre}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <AnimatePresence mode="wait">
              {modoVista === "aula" ? (
                selectedAula ? (
                  <AulaCalendar
                    key="aula-cal"
                    aula={selectedAula}
                    reservas={reservas}
                    onSlotClick={(dateStr, hour) => {
                      navigate(`/servicios/aulas/nueva-reserva/${selectedAula.id}`, {
                        state: { fecha_reserva: dateStr, hora_inicio: `${hour.toString().padStart(2, "0")}:00`, hora_fin: `${(hour + 1).toString().padStart(2, "0")}:00` }
                      })
                    }}
                    onCrearReserva={() => {
                      navigate(`/servicios/aulas/nueva-reserva/${selectedAula.id}`, {
                        state: { fecha_reserva: new Date().toISOString().split("T")[0], hora_inicio: "08:00", hora_fin: "10:00" }
                      })
                    }}
                  />
                ) : (
                  <EmptyState key="empty" />
                )
              ) : vistaSub === "lista" ? (
                <ListaView key="gen-list" reservas={reservasGenerales} colorForAula={colorForAula} onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }} />
              ) : vistaSub === "diaria" ? (
                <DiariaView key="gen-day" fecha={fechaRef} horas={hours} aulas={aulas} reservas={reservasGenerales} colorForAula={colorForAula} isFirstHour={isFirstHour} reservaSpan={reservaSpan} onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }} />
              ) : (
                <SemanalView key="gen-week" weekDays={genWeekDays} horas={hours} colorForAula={colorForAula} getReservasSlot={getReservasSlot} isFirstHour={isFirstHour} onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }} />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>



      {/* Modal detalle de reserva */}
      <AnimatePresence>
        {detalleOpen && detalleReserva && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetalleOpen(false)} className="absolute inset-0 bg-charcoal/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[2rem] w-full max-w-xl flex flex-col max-h-[85vh] shadow-2xl">
              <div className="shrink-0 p-6 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div>
                  <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Detalle de Reserva</h2>
                  <p className="text-xs font-medium opacity-40 mt-0.5">Información completa de la asignación</p>
                </div>
                <button onClick={() => setDetalleOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {detalleReserva.aula && (
                  <div className={cn("p-4 rounded-2xl flex items-center gap-4 border", colorForAula(detalleReserva.aula_id).bgLight, colorForAula(detalleReserva.aula_id).border)}>
                    <div className="size-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <HugeiconsIcon icon={Home02Icon} size={22} className={colorForAula(detalleReserva.aula_id).text} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.aula.nombre}</p>
                      <p className="text-[10px] font-medium opacity-50">Cap: {detalleReserva.aula.capacidad} PAX · ${detalleReserva.aula.precio_hora}/hr</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fecha</p>
                    <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(detalleReserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Horario</p>
                    <p className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}><HugeiconsIcon icon={Clock01Icon} size={14} className="opacity-40" />{fmtHora(detalleReserva.hora_inicio)} — {fmtHora(detalleReserva.hora_fin)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Tipo</p>
                    <div className="flex items-center gap-2">
                      {detalleReserva.persona_id ? (
                        <><HugeiconsIcon icon={UserIcon} size={16} className="text-indigo-500" /><span className="text-sm font-bold text-indigo-600">Uso Interno</span></>
                      ) : (
                        <><HugeiconsIcon icon={Money01Icon} size={16} className="text-emerald-500" /><span className="text-sm font-bold text-emerald-600">Renta Externa</span></>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Precio</p>
                    <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>${Number(detalleReserva.precio_total).toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Estado</p>
                  <span className={cn("inline-block px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider", ESTADO_LABELS[detalleReserva.estado]?.color || "bg-gray-100 text-gray-600")}>{ESTADO_LABELS[detalleReserva.estado]?.label || detalleReserva.estado}</span>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Responsable</p>
                  {detalleReserva.persona ? (
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-indigo-600" /></div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.persona.nombres} {detalleReserva.persona.apellidos}</p>
                        {detalleReserva.persona.correo && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={10} />{detalleReserva.persona.correo}</p>}
                      </div>
                    </div>
                  ) : detalleReserva.cliente_externo ? (
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center"><HugeiconsIcon icon={UserIcon} size={18} className="text-emerald-600" /></div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{detalleReserva.cliente_externo.nombres} {detalleReserva.cliente_externo.apellidos}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {detalleReserva.cliente_externo.cedula && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={IdentificationIcon} size={10} />{detalleReserva.cliente_externo.cedula}</p>}
                          {detalleReserva.cliente_externo.correo && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={Mail01Icon} size={10} />{detalleReserva.cliente_externo.correo}</p>}
                          {detalleReserva.cliente_externo.celular && <p className="text-[10px] opacity-50 flex items-center gap-1"><HugeiconsIcon icon={CallIcon} size={10} />{detalleReserva.cliente_externo.celular}</p>}
                        </div>
                      </div>
                    </div>
                  ) : <p className="text-xs opacity-30 italic">No especificado</p>}
                </div>
              </div>
              <div className="shrink-0 px-6 py-5 bg-gray-50 border-t flex justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => setDetalleOpen(false)} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10">Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AulaCalendar({ aula, reservas, onSlotClick, onCrearReserva }: { aula: Aula; reservas: ReservaAula[]; onSlotClick: (dateStr: string, hour: number) => void; onCrearReserva: () => void }) {
  const today = new Date()
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    const dow = today.getDay()
    d.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1) + i)
    days.push(d)
  }
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  return (
    <motion.div key="cal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Cronograma: {aula.nombre}</h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-blue-100 text-blue-700">Semana actual</span>
          </div>
          <p className="text-xs font-medium opacity-50 mt-0.5">Selecciona horario vacío para crear reserva</p>
        </div>
        <button onClick={onCrearReserva} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-600/20 hover:opacity-90 active:scale-[0.97]">
          <HugeiconsIcon icon={Calendar03Icon} size={16} /> Crear Reserva
        </button>
      </div>
      <div className="flex-1 min-h-0 border rounded-[1.5rem] overflow-hidden shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="grid grid-cols-8 border-b bg-gradient-to-b from-gray-50 to-gray-100/80" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="p-2.5 text-center border-r flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <HugeiconsIcon icon={Calendar03Icon} size={11} className="opacity-30" />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Hora</span>
          </div>
          {days.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div key={i} className={cn("p-2.5 text-center border-r last:border-0 relative", isToday && "bg-amber-50/80")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {isToday && <div className="absolute -top-px left-1 right-1 h-[3px] bg-amber-400 rounded-b-full" />}
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-0.5">{day.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                <div className={cn("text-base font-bold", isToday && "text-amber-600")} style={{ color: isToday ? undefined : COLORS.CHARCOAL }}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>
        <div className="divide-y overflow-auto" style={{ borderColor: COLORS.BORDER_SUBTLE, maxHeight: "calc(100% - 48px)" }}>
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[50px]">
              <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              {days.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const r = reservas.find(rr => rr.fecha_reserva === dateStr && hour >= parseInt(rr.hora_inicio.split(":")[0]) && hour < parseInt(rr.hora_fin.split(":")[0]))
                const first = r && hour === parseInt(r.hora_inicio.split(":")[0])
                const isToday = day.toDateString() === today.toDateString()
                return (
                  <div key={di} className={cn("p-0.5 border-r last:border-0 relative transition-colors", isPast ? "bg-gray-100/50" : isToday ? "bg-amber-50/30 hover:bg-amber-100/40 cursor-pointer" : "hover:bg-blue-50/30 cursor-pointer")} style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    onClick={() => { if (!isPast && !r) onSlotClick(dateStr, hour) }}
                  >
                    {first && (
                      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={cn("absolute top-0.5 left-0.5 right-0.5 p-2 rounded-xl text-[9px] z-10 shadow-lg border flex flex-col justify-between", r.persona_id ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-400/50" : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400/50")}
                        style={{ height: `calc(${Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0]))}*100% - 4px)` }}>
                        <span className="font-bold">{fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}</span>
                        <span className="uppercase font-black tracking-wider opacity-70 text-[7px]">{r.persona_id ? "Interno" : "Externo"}</span>
                      </motion.div>
                    )}
                    {!r && !isPast && <div className="absolute inset-1 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100"><Plus size={12} className="text-blue-300/50" /></div>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="size-24 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <HugeiconsIcon icon={Calendar03Icon} size={40} className="opacity-25" style={{ color: COLORS.CHARCOAL }} />
      </div>
      <div className="max-w-[260px] space-y-1.5">
        <h3 className="text-lg font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Sin aula seleccionada</h3>
        <p className="text-xs font-medium opacity-40">Selecciona un espacio arriba para ver su cronograma, o cambia a Agenda General para ver todas las reservas.</p>
      </div>
    </motion.div>
  )
}

function SemanalView({ weekDays, horas, colorForAula, getReservasSlot, isFirstHour, onSelect }: {
  weekDays: Date[]; horas: number[]; colorForAula: (id: string) => (typeof AULA_PALETTE)[number]
  getReservasSlot: (d: string, h: number, aid?: string) => ReservaAula[]; isFirstHour: (r: ReservaAula, h: number) => boolean; onSelect: (r: ReservaAula) => void
}) {
  const today = new Date()
  return (
    <motion.div key="sw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="grid grid-cols-8 border-b bg-gradient-to-b from-gray-50 to-gray-100/80" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="p-2.5 text-center border-r flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Aula</span>
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div key={i} className={cn("p-2.5 text-center border-r last:border-0 relative", isToday && "bg-amber-50/80")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {isToday && <div className="absolute -top-px left-1 right-1 h-[3px] bg-amber-400 rounded-b-full" />}
                <div className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-0.5">{day.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                <div className={cn("text-base font-bold", isToday && "text-amber-600")} style={{ color: isToday ? undefined : COLORS.CHARCOAL }}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>
        <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {horas.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[50px]">
              <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const slotReservas = getReservasSlot(dateStr, hour)
                const firstReservas = slotReservas.filter(r => isFirstHour(r, hour))
                return (
                  <div key={di} className={cn("p-0.5 border-r last:border-0", isPast && "bg-gray-100/40")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="flex flex-col gap-0.5 h-full">
                      {firstReservas.map(r => {
                        const span = Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0]))
                        const c = colorForAula(r.aula_id)
                        return (
                          <button key={r.id} onClick={(e) => { e.stopPropagation(); onSelect(r) }} className={cn("flex-1 rounded-lg p-1.5 text-left hover:brightness-110 cursor-pointer border", c.bgLight, c.border)} style={{ minHeight: `${span * 50 - 6}px` }}>
                            <p className={cn("text-[9px] font-bold leading-tight truncate", c.text)}>{r.aula?.nombre}</p>
                            <p className="text-[8px] font-medium opacity-50 truncate">{fmtHora(r.hora_inicio)}-{fmtHora(r.hora_fin)}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function DiariaView({ fecha, horas, aulas, reservas, colorForAula, isFirstHour, reservaSpan, onSelect }: {
  fecha: Date; horas: number[]; aulas: Aula[]; reservas: ReservaAula[]
  colorForAula: (id: string) => (typeof AULA_PALETTE)[number]; isFirstHour: (r: ReservaAula, h: number) => boolean; reservaSpan: (r: ReservaAula) => number; onSelect: (r: ReservaAula) => void
}) {
  const dateStr = fmtDate(fecha)
  const dateReservas = reservas.filter(r => r.fecha_reserva === dateStr)
  const today = new Date()
  if (aulas.length === 0) return null
  return (
    <motion.div key="dw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="grid border-b bg-gradient-to-b from-gray-50 to-gray-100/80 overflow-x-auto" style={{ borderColor: COLORS.BORDER_SUBTLE, gridTemplateColumns: `70px repeat(${aulas.length}, minmax(130px, 1fr))` }}>
          <div className="p-2.5 text-center border-r flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}><span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Hora</span></div>
          {aulas.map(aula => { const c = colorForAula(aula.id); return <div key={aula.id} className={cn("p-2.5 text-center border-r last:border-0", c.bgLight)} style={{ borderColor: COLORS.BORDER_SUBTLE }}><div className="flex items-center justify-center gap-1"><div className={cn("size-2 rounded-sm", c.dot)} /><span className="text-[10px] font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{aula.nombre}</span></div></div> })}
        </div>
        <div className="divide-y overflow-x-auto" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {horas.map(hour => {
            const isPast = `${hour}:00` < `${today.getHours()}:${today.getMinutes()}` && dateStr === fmtDate(today)
            return (
              <div key={hour} className="grid min-h-[50px]" style={{ gridTemplateColumns: `70px repeat(${aulas.length}, minmax(130px, 1fr))` }}>
                <div className="p-2 text-center border-r bg-gray-50/20 flex items-center justify-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <span className="text-[10px] font-mono font-bold opacity-40">{hour.toString().padStart(2, "0")}:00</span>
                </div>
                {aulas.map(aula => {
                  const r = dateReservas.find(rr => rr.aula_id === aula.id && hour >= parseInt(rr.hora_inicio.split(":")[0]) && hour < parseInt(rr.hora_fin.split(":")[0]))
                  const first = r && isFirstHour(r, hour)
                  const c = colorForAula(aula.id)
                  return (
                    <div key={aula.id} className={cn("p-0.5 border-r last:border-0 relative", isPast && "opacity-40")} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      {first && (
                        <button onClick={() => onSelect(r)} className={cn("w-full rounded-xl p-2 text-left hover:brightness-110 cursor-pointer border", c.bgLight, c.border)} style={{ height: `${reservaSpan(r) * 50 - 6}px` }}>
                          <p className={cn("text-[10px] font-bold", c.text)}>{fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}</p>
                          <p className="text-[9px] font-medium opacity-50 truncate mt-0.5">{r.persona_id ? r.persona?.nombres || "Staff" : r.cliente_externo?.nombres || "Cliente"}</p>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function ListaView({ reservas, colorForAula, onSelect }: { reservas: ReservaAula[]; colorForAula: (id: string) => (typeof AULA_PALETTE)[number]; onSelect: (r: ReservaAula) => void }) {
  return (
    <motion.div key="lv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4">
      <div className="border rounded-[1.5rem] overflow-hidden shadow-sm bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-gray-100/80">
                {["Fecha", "Aula", "Entrada", "Salida", "Tipo", "Responsable", "Estado", "Precio"].map(h => (
                  <th key={h} className="p-3 text-left text-[9px] font-bold uppercase tracking-widest opacity-40 border-r last:border-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {reservas.map(r => {
                const c = colorForAula(r.aula_id)
                const responsable = r.persona_id ? `${r.persona?.nombres || ""} ${r.persona?.apellidos || ""}`.trim() || "—" : `${r.cliente_externo?.nombres || ""} ${r.cliente_externo?.apellidos || ""}`.trim() || "—"
                const isToday = r.fecha_reserva === fmtDate(new Date())
                return (
                  <tr key={r.id} onClick={() => onSelect(r)} className={cn("cursor-pointer hover:bg-gray-50/80", isToday && "bg-amber-50/40")}>
                    <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <div className="flex items-center gap-2">{isToday && <div className="size-1.5 rounded-full bg-amber-400" />}<span className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span></div>
                    </td>
                    <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}><div className="flex items-center gap-2"><div className={cn("size-2 rounded-sm shrink-0", c.dot)} /><span className="text-xs font-bold truncate max-w-[100px]" style={{ color: COLORS.CHARCOAL }}>{r.aula?.nombre || "—"}</span></div></td>
                    <td className="p-3 border-r text-xs font-mono opacity-60" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{fmtHora(r.hora_inicio)}</td>
                    <td className="p-3 border-r text-xs font-mono opacity-60" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{fmtHora(r.hora_fin)}</td>
                    <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{r.persona_id ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg"><HugeiconsIcon icon={UserIcon} size={10} />Interno</span> : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg"><HugeiconsIcon icon={Money01Icon} size={10} />Externo</span>}</td>
                    <td className="p-3 border-r text-xs font-medium opacity-60 max-w-[100px] truncate" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{responsable}</td>
                    <td className="p-3 border-r" style={{ borderColor: COLORS.BORDER_SUBTLE }}>{(() => { const e = ESTADO_LABELS[r.estado]; return <span className={cn("inline-block px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider", e?.color || "bg-gray-100 text-gray-600")}>{e?.label || r.estado}</span> })()}</td>
                    <td className="p-3 text-xs font-bold text-right" style={{ color: COLORS.CHARCOAL }}>${Number(r.precio_total).toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
