import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Calendar02Icon,
  Money01Icon,
  InformationCircleIcon,
  UserIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MatrixIcon,
  Home02Icon,
  Clock01Icon,
  Mail01Icon,
  CallIcon,
  IdentificationIcon,
  PackageIcon,
  Search01Icon,
  Edit01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"
import { AulasKPIs } from "./components/AulasKPIs"

type VistaModo = "semanal" | "diaria" | "lista"

const AULA_PALETTE = [
  { bg: "bg-indigo-500", bgLight: "bg-indigo-50/90", text: "text-indigo-900", border: "border-indigo-200", borderLeft: "border-l-indigo-600", dot: "bg-indigo-500" },
  { bg: "bg-emerald-500", bgLight: "bg-emerald-50/90", text: "text-emerald-900", border: "border-emerald-200", borderLeft: "border-l-emerald-600", dot: "bg-emerald-500" },
  { bg: "bg-amber-500", bgLight: "bg-amber-50/90", text: "text-amber-900", border: "border-amber-200", borderLeft: "border-l-amber-500", dot: "bg-amber-500" },
  { bg: "bg-rose-500", bgLight: "bg-rose-50/90", text: "text-rose-900", border: "border-rose-200", borderLeft: "border-l-rose-500", dot: "bg-rose-500" },
  { bg: "bg-cyan-500", bgLight: "bg-cyan-50/90", text: "text-cyan-900", border: "border-cyan-200", borderLeft: "border-l-cyan-600", dot: "bg-cyan-500" },
  { bg: "bg-violet-500", bgLight: "bg-violet-50/90", text: "text-violet-900", border: "border-violet-200", borderLeft: "border-l-violet-600", dot: "bg-violet-500" },
  { bg: "bg-orange-500", bgLight: "bg-orange-50/90", text: "text-orange-900", border: "border-orange-200", borderLeft: "border-l-orange-500", dot: "bg-orange-500" },
  { bg: "bg-teal-500", bgLight: "bg-teal-50/90", text: "text-teal-900", border: "border-teal-200", borderLeft: "border-l-teal-600", dot: "bg-teal-500" },
]

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  reservado: { label: "Reservado", color: "bg-blue-50 border border-blue-200/80 text-blue-700" },
  confirmado: { label: "Confirmado", color: "bg-emerald-50 border border-emerald-200/80 text-emerald-700" },
  en_progreso: { label: "En progreso", color: "bg-amber-50 border border-amber-200/80 text-amber-700" },
  completado: { label: "Completado", color: "bg-slate-100 border border-slate-200 text-slate-700" },
  cancelado: { label: "Cancelado", color: "bg-rose-50 border border-rose-200/80 text-rose-700" },
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
  const [selectedAula, setSelectedAula] = useState<Aula | "todas" | null>("todas")

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

  const [aulaSearch, setAulaSearch] = useState("")
  const [showMoreAulas, setShowMoreAulas] = useState(false)
  const [aulaWeekRef, setAulaWeekRef] = useState(() => new Date())
  const moreAulasRef = useRef<HTMLDivElement>(null)

  const { monday: genMonday, sunday: genSunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const genWeekDays = useMemo(() => getWeekDays(genMonday), [genMonday])

  const loadAulas = async () => {
    try {
      setLoading(true)
      const data = await aulasService.getAulas()
      setAulas(data)
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
    loadReservasGenerales()
  }, [loadReservasGenerales])

  const colorForAula = (aulaId: string) => AULA_PALETTE[aulas.findIndex(a => a.id === aulaId) % AULA_PALETTE.length] || AULA_PALETTE[0]

  const MAX_VISIBLE_AULAS = 7
  const filteredAulas = useMemo(() => {
    if (!aulaSearch.trim()) return aulas
    const q = aulaSearch.toLowerCase()
    return aulas.filter(a => a.nombre.toLowerCase().includes(q))
  }, [aulas, aulaSearch])

  const visibleAulas = filteredAulas.slice(0, MAX_VISIBLE_AULAS)
  const hiddenAulas = filteredAulas.slice(MAX_VISIBLE_AULAS)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreAulasRef.current && !moreAulasRef.current.contains(e.target as Node))
        setShowMoreAulas(false)
    }
    if (showMoreAulas) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showMoreAulas])

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

  const handleSelectAula = (aula: Aula | "todas") => {
    setSelectedAula(aula)
    setAulaWeekRef(new Date())
    if (aula !== "todas") {
      loadReservas(aula.id)
    }
  }

  useEffect(() => {
    loadAulas()
  }, [])

  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16 flex flex-col">
      {/* Header Principal */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              SERVICIOS / AULAS
            </span>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Agenda de Aulas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                {modoVista === "aula"
                  ? selectedAula === "todas"
                    ? "Todas las aulas"
                    : selectedAula && typeof selectedAula === "object"
                      ? selectedAula.nombre
                      : "Aula"
                  : "Agenda General"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/servicios/aulas/gestion"
              className="h-10 px-4 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 active:scale-95"
            >
              <HugeiconsIcon icon={PackageIcon} size={15} className="text-slate-500" />
              <span>Gestión de Aulas</span>
            </Link>
            <button
              onClick={() => navigate("/servicios/aulas")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} className="text-slate-500" />
              <span>Historial</span>
            </button>
            <button
              onClick={() => {
                if (selectedAula && selectedAula !== "todas") {
                  navigate(`/servicios/aulas/nueva-reserva/${selectedAula.id}`)
                } else {
                  navigate("/servicios/aulas/nueva-reserva")
                }
              }}
              className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>Nueva Reserva</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-5">
        {/* Aula selector: buscador + chips */}
        <section className="shrink-0 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-[220px] shrink-0">
              <HugeiconsIcon icon={Search01Icon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={aulaSearch}
                onChange={e => setAulaSearch(e.target.value)}
                placeholder="Buscar aula..."
                className="w-full pl-9 pr-8 h-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#fd761a] transition-all"
              />
              {aulaSearch && (
                <button
                  onClick={() => setAulaSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={13} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredAulas.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 text-xs">
                <HugeiconsIcon icon={InformationCircleIcon} size={16} />
                <span>{aulaSearch ? "Sin aulas encontradas" : "No hay aulas configuradas"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap min-w-0 pb-1 sm:pb-0 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => handleSelectAula("todas")}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97] shrink-0 cursor-pointer",
                    selectedAula === "todas"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                  )}
                >
                  <span>Todas</span>
                </button>
                {visibleAulas.map((aula) => {
                  const isSelected = selectedAula === aula || (typeof selectedAula === "object" && selectedAula?.id === aula.id)
                  const now = new Date()
                  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                  const date = now.toISOString().split('T')[0]
                  const occupied = reservasGenerales.some(r =>
                    r.aula_id === aula.id && r.fecha_reserva === date &&
                    r.estado !== "cancelado" && time >= r.hora_inicio && time < r.hora_fin
                  )
                  return (
                    <button
                      key={aula.id}
                      type="button"
                      onClick={() => { handleSelectAula(aula); setShowMoreAulas(false) }}
                      className={cn(
                        "flex items-center gap-2 px-3.5 h-9 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-[0.97] shrink-0 cursor-pointer",
                        isSelected
                          ? "bg-[#fd761a] text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                      )}
                    >
                      <span>{aula.nombre}</span>
                      <span
                        title={occupied ? "En uso actualmente" : "Disponible"}
                        className={cn(
                          "size-2 rounded-full shrink-0 ring-2 ring-white/60",
                          occupied ? "bg-rose-500" : "bg-emerald-500"
                        )}
                      />
                    </button>
                  )
                })}

                {hiddenAulas.length > 0 && (
                  <div className="relative shrink-0" ref={moreAulasRef}>
                    <button
                      type="button"
                      onClick={() => setShowMoreAulas(!showMoreAulas)}
                      className="px-3 h-9 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200/80 transition-colors shrink-0 cursor-pointer"
                    >
                      +{hiddenAulas.length} más
                    </button>
                    {showMoreAulas && (
                      <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-slate-200/80 rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto min-w-[150px]">
                        {hiddenAulas.map(aula => {
                          const isSelected = typeof selectedAula === "object" && selectedAula?.id === aula.id
                          return (
                            <button
                              key={aula.id}
                              type="button"
                              onClick={() => { handleSelectAula(aula); setShowMoreAulas(false) }}
                              className={cn(
                                "w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between",
                                isSelected && "bg-orange-50 font-bold text-[#fd761a]"
                              )}
                            >
                              <span>{aula.nombre}</span>
                              {isSelected && <span className="text-[#fd761a]">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* KPIs */}
        <AulasKPIs aulas={aulas} reservas={reservasGenerales} />

        {/* Main Workspace Card */}
        <main className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Tab bar / Toolbar */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Segmented selector: Por Aula | Agenda General */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5">
                {(["aula", "general"] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setModoVista(k)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      modoVista === k
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                  >
                    {k === "aula" ? "Por Aula" : "Agenda General"}
                  </button>
                ))}
              </div>

              {modoVista === "general" && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-0.5">
                  {([
                    { k: "semanal", label: "Semana", icon: Calendar03Icon },
                    { k: "diaria", label: "Día", icon: Calendar02Icon },
                    { k: "lista", label: "Lista", icon: MatrixIcon },
                  ] as const).map(({ k, label, icon }) => (
                    <button
                      key={k}
                      onClick={() => setVistaSub(k)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        vistaSub === k
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      )}
                    >
                      <HugeiconsIcon icon={icon} size={14} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Controles de navegación de fecha en vista General */}
            {modoVista === "general" && (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Navegador < Hoy > */}
                <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5">
                  <button
                    onClick={() => {
                      const d = new Date(fechaRef)
                      d.setDate(d.getDate() - (vistaSub === "diaria" ? 1 : 7))
                      setFechaRef(d)
                    }}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    aria-label="Anterior"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>
                  <button
                    onClick={() => setFechaRef(new Date())}
                    className="px-3 h-8 flex items-center justify-center text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(fechaRef)
                      d.setDate(d.getDate() + (vistaSub === "diaria" ? 1 : 7))
                      setFechaRef(d)
                    }}
                    className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    aria-label="Siguiente"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>

                {/* Período badge */}
                <div className="flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800">
                  <HugeiconsIcon icon={Calendar03Icon} size={17} className="text-[#fd761a]" />
                  <span className="text-xs font-bold capitalize">
                    {vistaSub === "diaria"
                      ? fechaRef.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                      : `${genMonday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${genSunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Subvistas */}
          <div className="flex-1 min-h-0 overflow-auto">
            <AnimatePresence mode="wait">
              {modoVista === "aula" ? (
                selectedAula === "todas" ? (
                  <TodasAulasCalendar
                    key="todas-cal"
                    aulas={aulas}
                    reservas={reservasGenerales}
                    fechaRef={fechaRef}
                    onWeekChange={setFechaRef}
                    onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                  />
                ) : selectedAula ? (
                  <AulaCalendar
                    key="aula-cal"
                    aula={selectedAula}
                    reservas={reservas}
                    fechaRef={aulaWeekRef}
                    onWeekChange={setAulaWeekRef}
                    onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                    onSlotClick={(dateStr, hour) => {
                      navigate(`/servicios/aulas/nueva-reserva/${selectedAula.id}`, {
                        state: {
                          fecha_reserva: dateStr,
                          hora_inicio: `${hour.toString().padStart(2, "0")}:00`,
                          hora_fin: `${(hour + 1).toString().padStart(2, "0")}:00`
                        }
                      })
                    }}
                    onCrearReserva={() => {
                      navigate(`/servicios/aulas/nueva-reserva/${selectedAula.id}`, {
                        state: {
                          fecha_reserva: new Date().toISOString().split("T")[0],
                          hora_inicio: "08:00",
                          hora_fin: "10:00"
                        }
                      })
                    }}
                  />
                ) : (
                  <EmptyState key="empty" />
                )
              ) : vistaSub === "lista" ? (
                <ListaView
                  key="gen-list"
                  reservas={reservasGenerales}
                  colorForAula={colorForAula}
                  onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                />
              ) : vistaSub === "diaria" ? (
                <DiariaView
                  key="gen-day"
                  fecha={fechaRef}
                  horas={hours}
                  aulas={aulas}
                  reservas={reservasGenerales}
                  colorForAula={colorForAula}
                  isFirstHour={isFirstHour}
                  reservaSpan={reservaSpan}
                  onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                />
              ) : (
                <SemanalView
                  key="gen-week"
                  weekDays={genWeekDays}
                  horas={hours}
                  colorForAula={colorForAula}
                  getReservasSlot={getReservasSlot}
                  isFirstHour={isFirstHour}
                  onSelect={(r) => { setDetalleReserva(r); setDetalleOpen(true) }}
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modal Detalle de Reserva */}
      <AnimatePresence>
        {detalleOpen && detalleReserva && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetalleOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl w-full max-w-xl flex flex-col max-h-[85vh] shadow-2xl border border-slate-200/80 overflow-hidden"
            >
              <div className="shrink-0 p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Detalle de Reserva</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Información completa de la asignación</p>
                </div>
                <button
                  onClick={() => setDetalleOpen(false)}
                  className="size-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {detalleReserva.aula && (
                  <div className={cn(
                    "p-4 rounded-xl flex items-center gap-4 border",
                    colorForAula(detalleReserva.aula_id).bgLight,
                    colorForAula(detalleReserva.aula_id).border
                  )}>
                    <div className="size-11 rounded-xl bg-white flex items-center justify-center shadow-2xs shrink-0">
                      <HugeiconsIcon icon={Home02Icon} size={20} className={colorForAula(detalleReserva.aula_id).text} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{detalleReserva.aula.nombre}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Capacidad: {detalleReserva.aula.capacidad} PAX · ${detalleReserva.aula.precio_hora}/hr
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(detalleReserva.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Horario</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <HugeiconsIcon icon={Clock01Icon} size={15} className="text-slate-400" />
                      {fmtHora(detalleReserva.hora_inicio)} — {fmtHora(detalleReserva.hora_fin)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo de Reserva</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {detalleReserva.persona_id ? (
                        <>
                          <HugeiconsIcon icon={UserIcon} size={16} className="text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-700">Uso Interno</span>
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon icon={Money01Icon} size={16} className="text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-700">Renta Externa</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Precio Total</p>
                    <p className="text-base font-black text-slate-900">
                      ${Number(detalleReserva.precio_total).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</p>
                  <span className={cn(
                    "inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                    ESTADO_LABELS[detalleReserva.estado]?.color || "bg-slate-100 text-slate-700"
                  )}>
                    {ESTADO_LABELS[detalleReserva.estado]?.label || detalleReserva.estado}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente / Solicitante</p>
                  {detalleReserva.persona ? (
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <HugeiconsIcon icon={UserIcon} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {detalleReserva.persona.nombres} {detalleReserva.persona.apellidos}
                        </p>
                        {detalleReserva.persona.correo && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <HugeiconsIcon icon={Mail01Icon} size={12} className="text-slate-400" />
                            {detalleReserva.persona.correo}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : detalleReserva.cliente_externo ? (
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <HugeiconsIcon icon={UserIcon} size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-900">
                          {detalleReserva.cliente_externo.nombres} {detalleReserva.cliente_externo.apellidos}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          {detalleReserva.cliente_externo.cedula && (
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon icon={IdentificationIcon} size={12} className="text-slate-400" />
                              {detalleReserva.cliente_externo.cedula}
                            </span>
                          )}
                          {detalleReserva.cliente_externo.correo && (
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon icon={Mail01Icon} size={12} className="text-slate-400" />
                              {detalleReserva.cliente_externo.correo}
                            </span>
                          )}
                          {detalleReserva.cliente_externo.celular && (
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon icon={CallIcon} size={12} className="text-slate-400" />
                              {detalleReserva.cliente_externo.celular}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No especificado</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setDetalleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
                {detalleReserva.estado !== "cancelado" && detalleReserva.estado !== "completado" && (
                  <button
                    onClick={() => {
                      navigate(`/servicios/aulas/reservas/${detalleReserva.id}/editar`)
                      setDetalleOpen(false)
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:opacity-95 transition-all shadow-xs active:scale-95"
                  >
                    <HugeiconsIcon icon={Edit01Icon} size={14} />
                    <span>Editar Reserva</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AulaCalendar({
  aula,
  reservas,
  onSlotClick,
  onCrearReserva,
  onSelect,
  fechaRef,
  onWeekChange,
}: {
  aula: Aula
  reservas: ReservaAula[]
  onSlotClick: (dateStr: string, hour: number) => void
  onCrearReserva: () => void
  onSelect?: (r: ReservaAula) => void
  fechaRef: Date
  onWeekChange: (d: Date) => void
}) {
  const today = new Date()
  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const days = useMemo(() => getWeekDays(monday), [monday])
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  const weekLabel = `${monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
  const isCurrentWeek = today >= monday && today <= sunday

  return (
    <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5 h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Cronograma: {aula.nombre}</h2>
            {isCurrentWeek && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200/80 text-blue-700">
                Semana actual
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Haz clic en un horario vacío para agendar una reserva</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navegación de semana */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5">
            <button
              onClick={() => {
                const d = new Date(fechaRef)
                d.setDate(d.getDate() - 7)
                onWeekChange(d)
              }}
              className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>
            <button
              onClick={() => onWeekChange(new Date())}
              className="px-3 h-8 flex items-center justify-center text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const d = new Date(fechaRef)
                d.setDate(d.getDate() + 7)
                onWeekChange(d)
              }}
              className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800">
            <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-[#fd761a]" />
            <span className="text-xs font-bold">{weekLabel}</span>
          </div>

          <button
            onClick={onCrearReserva}
            className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Crear Reserva</span>
          </button>
        </div>
      </div>

      {/* Grid Calendario */}
      <div className="flex-1 min-h-0 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="grid grid-cols-8 border-b border-slate-200/80 bg-slate-50">
          <div className="p-3 text-center border-r border-slate-200/80 flex items-center justify-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora</span>
          </div>
          {days.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className={cn(
                  "p-2.5 text-center border-r border-slate-200/80 last:border-0 relative",
                  isToday && "bg-orange-50/60"
                )}
              >
                {isToday && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fd761a]" />}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {day.toLocaleDateString("es-ES", { weekday: "short" })}
                </div>
                <div className={cn("text-base font-extrabold mt-0.5", isToday ? "text-[#fd761a]" : "text-slate-800")}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: "calc(100% - 54px)" }}>
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[52px]">
              <div className="p-2 text-center border-r border-slate-100 bg-slate-50/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
              {days.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const r = reservas.find(rr => rr.fecha_reserva === dateStr && hour >= parseInt(rr.hora_inicio.split(":")[0]) && hour < parseInt(rr.hora_fin.split(":")[0]))
                const first = r && hour === parseInt(r.hora_inicio.split(":")[0])
                const isToday = day.toDateString() === today.toDateString()

                return (
                  <div
                    key={di}
                    className={cn(
                      "p-1 border-r border-slate-100 last:border-0 relative transition-colors group",
                      isPast ? "bg-slate-100/40" : isToday ? "bg-orange-50/20 hover:bg-orange-50/50 cursor-pointer" : "hover:bg-slate-50/80 cursor-pointer"
                    )}
                    onClick={() => { if (!isPast && !r) onSlotClick(dateStr, hour) }}
                  >
                    {first && (
                      <motion.div
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "absolute top-1 left-1 right-1 p-2 rounded-xl z-10 shadow-xs border cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-center",
                          r.persona_id
                            ? "bg-indigo-50 border-indigo-200/80 border-l-[3.5px] border-l-indigo-600 text-indigo-950"
                            : "bg-emerald-50 border-emerald-200/80 border-l-[3.5px] border-l-emerald-600 text-emerald-950"
                        )}
                        style={{ height: `calc(${Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0]))}*100% - 8px)` }}
                        onClick={(e) => { e.stopPropagation(); onSelect?.(r) }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-[11px] leading-tight">
                            {fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">
                            {r.persona_id ? "Interno" : "Externo"}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold truncate opacity-80 mt-0.5">
                          {r.persona?.nombres || r.cliente_externo?.nombres || "Reserva"}
                        </span>
                      </motion.div>
                    )}
                    {!r && !isPast && (
                      <div className="absolute inset-1 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} className="text-[#fd761a]" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded border border-dashed border-slate-300 bg-white" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded bg-indigo-600" />
          <span>Uso Interno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded bg-emerald-600" />
          <span>Renta Externa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded bg-slate-300" />
          <span>Día Pasado</span>
        </div>
      </div>
    </motion.div>
  )
}

function TodasAulasCalendar({
  aulas,
  reservas,
  fechaRef,
  onWeekChange,
  onSelect,
}: {
  aulas: Aula[]
  reservas: ReservaAula[]
  fechaRef: Date
  onWeekChange: (d: Date) => void
  onSelect: (r: ReservaAula) => void
}) {
  const navigate = useNavigate()
  const today = new Date()
  const { monday, sunday } = useMemo(() => getWeekRange(fechaRef), [fechaRef])
  const days = useMemo(() => getWeekDays(monday), [monday])
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  const weekLabel = `${monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
  const isCurrentWeek = today >= monday && today <= sunday

  return (
    <motion.div key="todas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Todas las Aulas</h2>
            {isCurrentWeek && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200/80 text-blue-700">
                Semana actual
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Vista integrada de ocupación de todos los espacios</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navegación */}
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs gap-0.5">
            <button
              onClick={() => {
                const d = new Date(fechaRef)
                d.setDate(d.getDate() - 7)
                onWeekChange(d)
              }}
              className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>
            <button
              onClick={() => onWeekChange(new Date())}
              className="px-3 h-8 flex items-center justify-center text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const d = new Date(fechaRef)
                d.setDate(d.getDate() + 7)
                onWeekChange(d)
              }}
              className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-slate-800">
            <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-[#fd761a]" />
            <span className="text-xs font-bold">{weekLabel}</span>
          </div>

          <button
            onClick={() => navigate("/servicios/aulas/nueva-reserva")}
            className="h-10 px-4 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Crear Reserva</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="grid grid-cols-8 border-b border-slate-200/80 bg-slate-50">
          <div className="p-3 text-center border-r border-slate-200/80 flex items-center justify-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora</span>
          </div>
          {days.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className={cn(
                  "p-2.5 text-center border-r border-slate-200/80 last:border-0 relative",
                  isToday && "bg-orange-50/60"
                )}
              >
                {isToday && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fd761a]" />}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {day.toLocaleDateString("es-ES", { weekday: "short" })}
                </div>
                <div className={cn("text-base font-extrabold mt-0.5", isToday ? "text-[#fd761a]" : "text-slate-800")}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: "calc(100% - 54px)" }}>
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[52px]">
              <div className="p-2 text-center border-r border-slate-100 bg-slate-50/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
              {days.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const isToday = day.toDateString() === today.toDateString()
                const iniciosSlot = reservas.filter(r =>
                  r.fecha_reserva === dateStr &&
                  r.estado !== "cancelado" &&
                  hour === parseInt(r.hora_inicio.split(":")[0])
                )
                const count = iniciosSlot.length

                return (
                  <div
                    key={di}
                    className={cn(
                      "p-1 border-r border-slate-100 last:border-0 relative",
                      isPast ? "bg-slate-100/40" : isToday ? "bg-orange-50/20" : ""
                    )}
                  >
                    {iniciosSlot.map((r, idx) => {
                      const span = Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0]))
                      const c = AULA_PALETTE[aulas.findIndex(a => a.id === r.aula_id) % AULA_PALETTE.length] || AULA_PALETTE[0]
                      const rowHeight = 52
                      const cardHeight = span * rowHeight
                      const slice = count > 1 ? Math.floor(cardHeight / count) : cardHeight

                      return (
                        <motion.div
                          key={r.id}
                          initial={{ scale: 0.96 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "absolute left-1 right-1 rounded-xl z-10 shadow-xs border border-l-[3.5px] cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-center px-2 py-1 overflow-hidden",
                            c.bgLight,
                            c.border,
                            c.borderLeft
                          )}
                          style={{
                            top: `${idx * slice + 3}px`,
                            height: `${Math.max(slice - 5, 32)}px`,
                          }}
                          onClick={() => onSelect(r)}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={cn("text-[11px] font-black truncate", c.text)}>
                              {r.aula?.nombre || "Aula"}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-500 shrink-0">
                              {fmtHora(r.hora_inicio)}-{fmtHora(r.hora_fin)}
                            </span>
                          </div>
                          <span className="text-[9px] font-medium text-slate-600 truncate mt-0.5">
                            {r.persona?.nombres || r.cliente_externo?.nombres || ""}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Aula legend dots */}
      <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-500 flex-wrap">
        {aulas.slice(0, 8).map((a, i) => (
          <div key={a.id} className="flex items-center gap-1.5">
            <div className={cn("size-2 rounded-full", AULA_PALETTE[i % 8].dot)} />
            <span className="truncate max-w-[90px]">{a.nombre}</span>
          </div>
        ))}
        {aulas.length > 8 && <span className="text-slate-400">+{aulas.length - 8} más</span>}
      </div>
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
      <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        <HugeiconsIcon icon={Calendar03Icon} size={30} />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-bold text-slate-900">Sin aula seleccionada</h3>
        <p className="text-xs text-slate-500">
          Selecciona un espacio en la barra superior para ver su cronograma, o cambia a Agenda General.
        </p>
      </div>
    </motion.div>
  )
}

function SemanalView({
  weekDays,
  horas,
  colorForAula,
  getReservasSlot,
  isFirstHour,
  onSelect,
}: {
  weekDays: Date[]
  horas: number[]
  colorForAula: (id: string) => (typeof AULA_PALETTE)[number]
  getReservasSlot: (d: string, h: number, aid?: string) => ReservaAula[]
  isFirstHour: (r: ReservaAula, h: number) => boolean
  onSelect: (r: ReservaAula) => void
}) {
  const today = new Date()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5">
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="grid grid-cols-8 border-b border-slate-200/80 bg-slate-50">
          <div className="p-3 text-center border-r border-slate-200/80 flex items-center justify-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={13} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora</span>
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className={cn(
                  "p-2.5 text-center border-r border-slate-200/80 last:border-0 relative",
                  isToday && "bg-orange-50/60"
                )}
              >
                {isToday && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#fd761a]" />}
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {day.toLocaleDateString("es-ES", { weekday: "short" })}
                </div>
                <div className={cn("text-base font-extrabold mt-0.5", isToday ? "text-[#fd761a]" : "text-slate-800")}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        <div className="divide-y divide-slate-100">
          {horas.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[52px]">
              <div className="p-2 text-center border-r border-slate-100 bg-slate-50/50 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
              {weekDays.map((day, di) => {
                const dateStr = fmtDate(day)
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const slotReservas = getReservasSlot(dateStr, hour)
                const firstReservas = slotReservas.filter(r => isFirstHour(r, hour))
                return (
                  <div
                    key={di}
                    className={cn(
                      "p-1 border-r border-slate-100 last:border-0",
                      isPast && "bg-slate-100/40"
                    )}
                  >
                    <div className="flex flex-col gap-1 h-full">
                      {firstReservas.map(r => {
                        const span = Math.max(1, parseInt(r.hora_fin.split(":")[0]) - parseInt(r.hora_inicio.split(":")[0]))
                        const c = colorForAula(r.aula_id)
                        return (
                          <button
                            key={r.id}
                            onClick={(e) => { e.stopPropagation(); onSelect(r) }}
                            className={cn(
                              "flex-1 rounded-xl p-2 text-left cursor-pointer border border-l-[3.5px] hover:shadow-md transition-shadow",
                              c.bgLight,
                              c.border,
                              c.borderLeft
                            )}
                            style={{ minHeight: `${span * 52 - 8}px` }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={cn("text-[10px] font-bold truncate", c.text)}>
                                {r.aula?.nombre}
                              </span>
                              <span className="text-[9px] font-medium text-slate-500">
                                {fmtHora(r.hora_inicio)}-{fmtHora(r.hora_fin)}
                              </span>
                            </div>
                            <p className="text-[9px] truncate text-slate-600 font-medium mt-0.5">
                              {r.persona?.nombres || r.cliente_externo?.nombres || ""}
                            </p>
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

function DiariaView({
  fecha,
  horas,
  aulas,
  reservas,
  colorForAula,
  isFirstHour,
  reservaSpan,
  onSelect,
}: {
  fecha: Date
  horas: number[]
  aulas: Aula[]
  reservas: ReservaAula[]
  colorForAula: (id: string) => (typeof AULA_PALETTE)[number]
  isFirstHour: (r: ReservaAula, h: number) => boolean
  reservaSpan: (r: ReservaAula) => number
  onSelect: (r: ReservaAula) => void
}) {
  const dateStr = fmtDate(fecha)
  const dateReservas = reservas.filter(r => r.fecha_reserva === dateStr)
  const today = new Date()

  if (aulas.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5">
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div
          className="grid border-b border-slate-200/80 bg-slate-50 overflow-x-auto"
          style={{ gridTemplateColumns: `80px repeat(${aulas.length}, minmax(140px, 1fr))` }}
        >
          <div className="p-3 text-center border-r border-slate-200/80 flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hora</span>
          </div>
          {aulas.map(aula => {
            const c = colorForAula(aula.id)
            return (
              <div
                key={aula.id}
                className={cn("p-3 text-center border-r border-slate-200/80 last:border-0", c.bgLight)}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <div className={cn("size-2 rounded-full", c.dot)} />
                  <span className="text-xs font-bold text-slate-800 truncate">{aula.nombre}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {horas.map(hour => {
            const isPast = `${hour}:00` < `${today.getHours()}:${today.getMinutes()}` && dateStr === fmtDate(today)
            return (
              <div
                key={hour}
                className="grid min-h-[52px]"
                style={{ gridTemplateColumns: `80px repeat(${aulas.length}, minmax(140px, 1fr))` }}
              >
                <div className="p-2 text-center border-r border-slate-100 bg-slate-50/50 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
                {aulas.map(aula => {
                  const r = dateReservas.find(rr => rr.aula_id === aula.id && hour >= parseInt(rr.hora_inicio.split(":")[0]) && hour < parseInt(rr.hora_fin.split(":")[0]))
                  const first = r && isFirstHour(r, hour)
                  const c = colorForAula(aula.id)
                  return (
                    <div
                      key={aula.id}
                      className={cn("p-1 border-r border-slate-100 last:border-0 relative", isPast && "opacity-40")}
                    >
                      {first && (
                        <button
                          onClick={() => onSelect(r)}
                          className={cn(
                            "w-full rounded-xl p-2 text-left cursor-pointer border border-l-[3.5px] hover:shadow-md transition-shadow",
                            c.bgLight,
                            c.border,
                            c.borderLeft
                          )}
                          style={{ height: `${reservaSpan(r) * 52 - 8}px` }}
                        >
                          <p className={cn("text-[11px] font-bold", c.text)}>
                            {fmtHora(r.hora_inicio)} – {fmtHora(r.hora_fin)}
                          </p>
                          <p className="text-[10px] font-medium text-slate-600 truncate mt-0.5">
                            {r.persona_id ? r.persona?.nombres || "Interno" : r.cliente_externo?.nombres || "Externo"}
                          </p>
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

function ListaView({
  reservas,
  colorForAula,
  onSelect,
}: {
  reservas: ReservaAula[]
  colorForAula: (id: string) => (typeof AULA_PALETTE)[number]
  onSelect: (r: ReservaAula) => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5">
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                {["Fecha", "Aula", "Entrada", "Salida", "Tipo", "Cliente", "Estado", "Precio"].map(h => (
                  <th
                    key={h}
                    className="p-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-r border-slate-200/80 last:border-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-xs text-slate-400">
                    No hay reservas registradas en este período
                  </td>
                </tr>
              ) : (
                reservas.map(r => {
                  const c = colorForAula(r.aula_id)
                  const clienteNombre = r.persona_id
                    ? `${r.persona?.nombres || ""} ${r.persona?.apellidos || ""}`.trim() || "—"
                    : `${r.cliente_externo?.nombres || ""} ${r.cliente_externo?.apellidos || ""}`.trim() || "—"
                  const isToday = r.fecha_reserva === fmtDate(new Date())

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelect(r)}
                      className={cn(
                        "cursor-pointer hover:bg-slate-50/80 transition-colors",
                        isToday && "bg-orange-50/20"
                      )}
                    >
                      <td className="p-3.5 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          {isToday && <div className="size-1.5 rounded-full bg-[#fd761a]" />}
                          <span className="text-xs font-bold text-slate-800">
                            {new Date(r.fecha_reserva + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-2 rounded-full shrink-0", c.dot)} />
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                            {r.aula?.nombre || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-xs font-mono font-medium text-slate-600">
                        {fmtHora(r.hora_inicio)}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-xs font-mono font-medium text-slate-600">
                        {fmtHora(r.hora_fin)}
                      </td>
                      <td className="p-3.5 border-r border-slate-100">
                        {r.persona_id ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                            <HugeiconsIcon icon={UserIcon} size={11} />
                            Interno
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                            <HugeiconsIcon icon={Money01Icon} size={11} />
                            Externo
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 border-r border-slate-100 text-xs font-medium text-slate-600 max-w-[140px] truncate">
                        {clienteNombre}
                      </td>
                      <td className="p-3.5 border-r border-slate-100">
                        {(() => {
                          const e = ESTADO_LABELS[r.estado]
                          return (
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                              e?.color || "bg-slate-100 text-slate-600"
                            )}>
                              {e?.label || r.estado}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="p-3.5 text-xs font-black text-right text-slate-900">
                        ${Number(r.precio_total).toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
