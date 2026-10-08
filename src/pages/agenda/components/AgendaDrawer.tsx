import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Clock01Icon,
  Calendar03Icon,
  Book02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  GraduationCapIcon,
  Location01Icon,
  NoteIcon,
  UserGroupIcon,
  Money01Icon,
  CallIcon,
  ToolsIcon,
} from "@hugeicons/core-free-icons"
import { type AgendaEvent, type AgendaEventDetail, agendaService, agendaPublicaService } from "@/services/agenda.service"
import { getEventPersonLabel, getEventStyles } from "@/pages/agenda/utils"
import { CiudadBadge } from "@/components/cursos/CiudadBadge"
import { ModalidadBadge } from "@/pages/estudiantes/components/Badges"

function formatTime(time: string) {
  if (!time) return "—"
  return time.substring(0, 5)
}

function formatDate(date: string) {
  if (!date) return "—"
  return new Date(date + "T00:00:00").toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatDayNumber(date: string) {
  if (!date) return ""
  return new Date(date + "T00:00:00").getDate().toString()
}

function formatMonthShort(date: string) {
  if (!date) return ""
  return new Date(date + "T00:00:00").toLocaleDateString("es-EC", { month: "short" }).toUpperCase().replace(".", "")
}

function calculateDuration(inicio: string, fin: string): string | null {
  if (!inicio || !fin) return null
  const [h1, m1] = inicio.split(":").map(Number)
  const [h2, m2] = fin.split(":").map(Number)
  if (isNaN(h1) || isNaN(h2)) return null
  const mins = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0))
  if (mins <= 0) return null
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hrs > 0 && remMins > 0) return `${hrs} h ${remMins} min`
  if (hrs > 0) return `${hrs} ${hrs === 1 ? "hr" : "hrs"}`
  return `${remMins} min`
}

export interface DaySelection {
  date: Date
  dateStr: string
  events: AgendaEvent[]
}

export interface AgendaDrawerProps {
  event: AgendaEvent | null
  daySelection: DaySelection | null
  onClose: () => void
  onSelectEvent: (event: AgendaEvent) => void
  isPublic?: boolean
}

export function AgendaDrawer({
  event,
  daySelection,
  onClose,
  onSelectEvent,
  isPublic = false,
}: AgendaDrawerProps) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AgendaEventDetail | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar detalle completo según modo público o autenticado
  useEffect(() => {
    if (event?.tipo_evento && event?.referencia_id) {
      setLoading(true)
      const fetchDetail = isPublic
        ? agendaPublicaService.getEventDetail
        : agendaService.getEventDetail

      fetchDetail(event.tipo_evento, event.referencia_id)
        .then(setDetail)
        .catch(() => {
          setDetail(null)
        })
        .finally(() => setLoading(false))
    } else {
      setDetail(null)
    }
  }, [event?.tipo_evento, event?.referencia_id, isPublic])

  // Soporte para tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const isOpen = Boolean(event || daySelection)
  if (!isOpen) return null

  const data = detail ?? event
  const styles = data ? getEventStyles(data.tipo_evento) : null
  const duration = data ? calculateDuration(data.hora_inicio, data.hora_fin) : null

  // Cálculo de capacidad / aforo
  const participantes = data?.participantes_count ?? 0
  const capacidad = data?.capacidad_maxima ?? 0
  const hasCapacidad = capacidad > 0
  const pctOcupacion = hasCapacidad ? Math.min(100, Math.round((participantes / capacidad) * 100)) : 0
  const plazasDisponibles = hasCapacidad ? Math.max(0, capacidad - participantes) : null

  const isCurso = data?.tipo_evento === "CLASE_CURSO" || Boolean(data?.referencia_id && data?.tipo_evento?.includes("CURSO"))
  const isTaller = data?.tipo_evento === "TALLER"

  const observaciones = (data?.detalle?.observaciones || data?.detalle?.descripcion) as string | undefined
  const precio = (data?.detalle?.precio_total ?? data?.detalle?.precio) as number | string | undefined

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Fondo oscuro con desenfoque suave al hacer clic cierra */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Si tenemos un evento seleccionado: MOSTRAR DETALLE DEL EVENTO */}
          {data ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Franja superior decorativa del tipo de evento */}
              <div
                className="h-2 w-full transition-colors shrink-0"
                style={{ backgroundColor: styles?.color || "#fd761a" }}
              />

              {/* Header del Panel */}
              <div className="p-4 sm:p-6 border-b border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Badge de Categoría / Servicio */}
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs"
                        style={{
                          backgroundColor: styles?.bg,
                          color: styles?.text,
                          border: `1px solid ${styles?.border}50`,
                        }}
                      >
                        {loading && (
                          <span className="inline-block size-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {styles?.label}
                      </span>

                      {/* Modalidad */}
                      {data.modalidad && (
                        <ModalidadBadge modalidad={data.modalidad} />
                      )}

                      {/* Sede / Ciudad */}
                      {data.ciudad_nombre && (
                        <CiudadBadge ciudad={data.ciudad_nombre} />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {daySelection && daySelection.events.length > 1 && (
                      <button
                        onClick={() => onSelectEvent(null as unknown as AgendaEvent)}
                        title="Volver a los eventos del día"
                        className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      aria-label="Cerrar panel lateral"
                      className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={18} />
                    </button>
                  </div>
                </div>

                {/* Título Principal */}
                <div className="mt-4 space-y-2">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                    {data.tipo_evento === "CLASE_CURSO" && data.nombre_instancia
                      ? `Clase: ${data.nombre_instancia}`
                      : data.titulo}
                  </h2>

                  {/* Estado con punto animado */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span
                      className={`size-2.5 rounded-full inline-block ${
                        data.estado === "cancelado"
                          ? "bg-rose-500"
                          : data.estado === "completado"
                            ? "bg-blue-500"
                            : "bg-emerald-500 animate-pulse"
                      }`}
                    />
                    <span className="text-xs font-bold capitalize text-slate-700">
                      {data.estado ? data.estado.replace(/_/g, " ") : "Programado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenido / Tarjetas Bento de Metadatos (Estilo Reserva Detalle) */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* 2 Bento Metric Cards Superiores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Card 1: Horario & Duración */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HugeiconsIcon icon={Clock01Icon} size={14} className="text-blue-500" />
                        Horario de Sesión
                      </span>
                      {duration && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                          {duration}
                        </span>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {formatTime(data.hora_inicio)} — {formatTime(data.hora_fin)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Franja reservada
                    </p>
                  </div>

                  {/* Card 2: Fecha Programada */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-indigo-500" />
                        Fecha en Agenda
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {data.fecha}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 capitalize truncate">
                      {formatDate(data.fecha)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Día programado
                    </p>
                  </div>
                </div>

                {/* Tarjeta de Fecha Destacada tipo Calendario */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-orange-50 border border-orange-200/70 text-[#fd761a] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black tracking-wider leading-none">
                      {formatMonthShort(data.fecha)}
                    </span>
                    <span className="text-xl font-black leading-tight">
                      {formatDayNumber(data.fecha)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Detalle de Fecha y Bloque
                    </span>
                    <span className="text-sm font-bold text-slate-800 capitalize truncate block">
                      {formatDate(data.fecha)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 block mt-0.5">
                      Horario {formatTime(data.hora_inicio)} a {formatTime(data.hora_fin)} {duration ? `(${duration})` : ""}
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Inversión / Arancel si está disponible (excluyendo STREAMING) */}
                {data.tipo_evento !== "STREAMING" && precio != null && Number(precio) > 0 && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={Money01Icon} size={18} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Inversión / Arancel
                        </span>
                        <span className="text-base font-black text-emerald-700 block">
                          ${Number(precio).toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Registrado
                    </span>
                  </div>
                )}

                {/* Tarjeta de Docente / Instructor o Cliente */}
                {data.instructor_nombre && (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                      {data.instructor_nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {getEventPersonLabel(data.tipo_evento)}
                      </span>
                      <span className="text-sm font-bold text-slate-900 block truncate">
                        {data.instructor_nombre}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {data.tipo_evento === "STREAMING"
                          ? "Cliente contratante del servicio"
                          : "Responsable / titular del registro"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sede y Espacio / Aula (Para eventos estándar distintos a STREAMING o como fallback) */}
                {data.tipo_evento !== "STREAMING" && (Boolean(data.ciudad_nombre) || Boolean(data.aula_nombre)) && (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={Location01Icon} size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Lugar / Espacio
                      </span>
                      <span className="text-sm font-bold text-slate-900 block truncate">
                        {data.ciudad_nombre ? `${data.ciudad_nombre}` : "Sede Principal"}
                        {data.aula_nombre ? ` · ${data.aula_nombre}` : ""}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block capitalize">
                        Modalidad {data.modalidad || "presencial"}
                      </span>
                    </div>
                  </div>
                )}

                {/* BLOQUE ESPECIAL STREAMING: Locación, Dirección y Referencias */}
                {data.tipo_evento === "STREAMING" && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <div className="size-6 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                          <HugeiconsIcon icon={Location01Icon} size={14} />
                        </div>
                        <span>Locación & Acceso</span>
                      </div>
                      {data.ciudad_nombre && (
                        <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/70">
                          {data.ciudad_nombre}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Recinto / Lugar
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {String(data.detalle?.lugar || data.aula_nombre || "Locación externa")}
                      </p>
                    </div>

                    {Boolean(data.detalle?.direccion) && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Dirección Exacta
                        </span>
                        <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
                          {String(data.detalle?.direccion)}
                        </p>
                      </div>
                    )}

                    {Boolean(data.detalle?.referencias_ubicacion) && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                        <span className="font-bold text-slate-700 block mb-0.5">
                          Referencias de acceso:
                        </span>
                        <p className="leading-relaxed">
                          {String(data.detalle?.referencias_ubicacion)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* BLOQUE ESPECIAL STREAMING: Personal Técnico Asignado */}
                {data.tipo_evento === "STREAMING" && (
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <div className="size-6 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                          <HugeiconsIcon icon={UserGroupIcon} size={14} />
                        </div>
                        <span>Personal Técnico Asignado</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {Array.isArray(data.detalle?.personal_tecnico)
                          ? (data.detalle.personal_tecnico as any[]).length
                          : 0}{" "}
                        técnico(s)
                      </span>
                    </div>

                    {Array.isArray(data.detalle?.personal_tecnico) &&
                    (data.detalle.personal_tecnico as any[]).length > 0 ? (
                      <div className="space-y-2">
                        {(data.detalle.personal_tecnico as any[]).map((tech, idx) => (
                          <div
                            key={tech.persona_id || idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold text-xs shrink-0">
                                {(tech.nombre_completo || "T").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {tech.nombre_completo || "Técnico"}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  Personal de Cobertura
                                </p>
                              </div>
                            </div>
                            {tech.celular && (
                              <a
                                href={`tel:${tech.celular}`}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-emerald-600 transition-colors shrink-0"
                              >
                                <HugeiconsIcon icon={CallIcon} size={12} />
                                <span>{tech.celular}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-1">
                        Sin personal técnico asignado por el momento.
                      </p>
                    )}
                  </div>
                )}

                {/* BLOQUE ESPECIAL STREAMING: Equipos y Material Requerido */}
                {data.tipo_evento === "STREAMING" && Boolean(data.detalle?.equipos_detalle) && (
                  <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-4.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 pb-1 border-b border-amber-200/40">
                      <HugeiconsIcon icon={ToolsIcon} size={15} className="text-amber-700" />
                      <span>Equipos & Material Requerido</span>
                    </div>
                    <p className="text-xs text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                      {String(data.detalle?.equipos_detalle)}
                    </p>
                  </div>
                )}

                {/* Módulo si está presente en detalle */}
                {Boolean(data.detalle?.modulo) && (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={Book02Icon} size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Módulo Académico
                      </span>
                      <span className="text-sm font-bold text-slate-900 block">
                        {String(data.detalle?.modulo)}
                      </span>
                      {data.catalogo_nombre && (
                        <span className="text-[11px] text-slate-500 font-medium block truncate">
                          Curso: {data.catalogo_nombre}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Medidor de Capacidad / Aforo */}
                {hasCapacidad && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <HugeiconsIcon icon={UserGroupIcon} size={16} className="text-slate-400" />
                        <span>Capacidad y Aforo</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {participantes} / {capacidad} Alumnos ({pctOcupacion}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pctOcupacion >= 100
                            ? "bg-rose-500"
                            : pctOcupacion >= 80
                              ? "bg-amber-500"
                              : "bg-[#fd761a]"
                        }`}
                        style={{ width: `${pctOcupacion}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{plazasDisponibles} cupos disponibles</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          pctOcupacion >= 100
                            ? "bg-rose-50 text-rose-700"
                            : pctOcupacion >= 80
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {pctOcupacion >= 100 ? "Aforo completo" : "Cupos disponibles"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Observaciones / Descripción si existe */}
                {observaciones && (
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <HugeiconsIcon icon={NoteIcon} size={15} />
                      <span>Observaciones</span>
                    </div>
                    <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                      {observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista alternativa: Lista de eventos del DÍA SELECCIONADO */
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-6 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 capitalize">
                    {daySelection ? formatDate(daySelection.dateStr) : "Eventos del día"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {daySelection?.events.length || 0} actividades programadas en agenda
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {daySelection && daySelection.events.length > 0 ? (
                  daySelection.events.map((ev) => {
                    const st = getEventStyles(ev.tipo_evento)
                    return (
                      <div
                        key={ev.id}
                        onClick={() => onSelectEvent(ev)}
                        className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#fd761a]/60 bg-white hover:bg-orange-50/20 shadow-2xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                            style={{ backgroundColor: st.bg, color: st.text }}
                          >
                            {st.label}
                          </span>
                          <span className="text-xs font-bold text-[#fd761a]">
                            {formatTime(ev.hora_inicio)} – {formatTime(ev.hora_fin)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors line-clamp-1">
                          {ev.tipo_evento === "CLASE_CURSO" && ev.nombre_instancia
                            ? `Clase: ${ev.nombre_instancia}`
                            : ev.titulo}
                        </h4>

                        <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500">
                          <span className="truncate pr-2">
                            {ev.instructor_nombre || (getEventPersonLabel(ev.tipo_evento) === "Cliente" ? "Sin cliente" : "Sin docente")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#fd761a] shrink-0">
                            <span>Ver detalles</span>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <HugeiconsIcon icon={Calendar03Icon} size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold">No hay actividades programadas para este día.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer del Panel: Acciones */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
            {/* Si es modo público y es un curso o taller: Invitación a matrícula */}
            {isPublic ? (
              data && (isCurso || isTaller) ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate("/matricula/nueva")
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06310] shadow-sm shadow-[#fd761a]/30 transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon={GraduationCapIcon} size={16} />
                  <span>Inscribirme en este programa</span>
                </button>
              ) : (
                <div />
              )
            ) : (
              /* Modo privado autenticado: Acciones a los detalles específicos */
              data ? (
                <div className="flex-1 flex items-center gap-2">
                  {isCurso && data.referencia_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(data.tipo_evento === "CURSO_PERSONALIZADO"
                          ? `/cursos-personalizados/${data.referencia_id}`
                          : `/cursos/${data.referencia_id}`)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06310] shadow-sm shadow-[#fd761a]/30 transition-all cursor-pointer"
                    >
                      <span>Ver Curso</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                  {data.tipo_evento === "PODCAST" && data.referencia_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/servicios/podcast/reservas/${data.referencia_id}`)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/30 transition-all cursor-pointer"
                    >
                      <span>Ver Reserva Podcast</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                  {data.tipo_evento === "RADIO" && data.referencia_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/servicios/radio/reservas/${data.referencia_id}`)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-sm shadow-pink-600/30 transition-all cursor-pointer"
                    >
                      <span>Ver Reserva Radio</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                  {data.tipo_evento === "STREAMING" && data.referencia_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/servicios/streaming/${data.referencia_id}`)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
                    >
                      <span>Ver Servicio Streaming</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                  {data.tipo_evento === "ALQUILER_AULA" && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate("/servicios/aulas")
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <span>Ver Módulo Aulas</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                  {data.tipo_evento === "TALLER" && data.referencia_id && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/admin/talleres/${data.referencia_id}`)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-600/30 transition-all cursor-pointer"
                    >
                      <span>Ver Taller</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div />
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
