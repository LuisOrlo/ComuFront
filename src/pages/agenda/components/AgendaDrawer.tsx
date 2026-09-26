import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Clock01Icon,
  Home02Icon,
  Calendar03Icon,
  Book02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { type AgendaEvent, type AgendaEventDetail, agendaService } from "@/services/agenda.service"
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
}

export function AgendaDrawer({
  event,
  daySelection,
  onClose,
  onSelectEvent,
}: AgendaDrawerProps) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AgendaEventDetail | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar detalle completo si hay evento seleccionado
  useEffect(() => {
    if (event?.tipo_evento && event?.referencia_id) {
      setLoading(true)
      agendaService
        .getEventDetail(event.tipo_evento, event.referencia_id)
        .then(setDetail)
        .catch(() => {
          // Si falla o no tiene detalle extendido, se mantiene la data base
          setDetail(null)
        })
        .finally(() => setLoading(false))
    } else {
      setDetail(null)
    }
  }, [event?.tipo_evento, event?.referencia_id])

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Fondo oscuro con desenfoque suave al hacer clic cierra */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Si tenemos un evento seleccionado: MOSTRAR DETALLE DEL EVENTO */}
          {data ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Header del Panel */}
              <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Badge de Servicio: "Curso" (nunca "Curso regular"), "Taller", etc. */}
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: styles?.bg,
                          color: styles?.text,
                          border: `1px solid ${styles?.border}40`,
                        }}
                      >
                        {loading && (
                          <span className="inline-block size-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {styles?.label}
                      </span>

                      {/* Modalidad si existe */}
                      {data.modalidad && (
                        <ModalidadBadge modalidad={data.modalidad} />
                      )}

                      {/* Sede / Ciudad si existe */}
                      {data.ciudad_nombre && (
                        <CiudadBadge ciudad={data.ciudad_nombre} />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {daySelection && daySelection.events.length > 1 && (
                      <button
                        onClick={() => onSelectEvent(null as unknown as AgendaEvent)}
                        title="Volver a los eventos del día"
                        className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
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
                <div className="mt-4 space-y-1.5">
                  <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
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

              {/* Contenido / Tarjetas de metadatos */}
              <div className="p-5 space-y-4">
                {/* Cuadrícula de detalles con iconos de code.html */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
                  {/* Fecha y Horario */}
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center shrink-0 mt-0.5">
                      <HugeiconsIcon icon={Clock01Icon} size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Fecha y Horario
                      </span>
                      <span className="text-sm font-bold text-slate-800 capitalize block">
                        {formatDate(data.fecha)}
                      </span>
                      <span className="text-xs font-bold text-[#fd761a] block mt-0.5">
                        {formatTime(data.hora_inicio)} - {formatTime(data.hora_fin)}
                        {duration && <span className="text-slate-500 font-medium ml-1.5">({duration})</span>}
                      </span>
                    </div>
                  </div>

                  {/* Docente / Instructor si existe */}
                  {data.instructor_nombre && (
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                      <div className="size-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {data.instructor_nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          {getEventPersonLabel(data.tipo_evento)}
                        </span>
                        <span className="text-sm font-bold text-slate-800 block truncate">
                          {data.instructor_nombre}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sede / Ciudad (SOLO si existe ciudad_nombre) */}
                  {Boolean(data.ciudad_nombre) && (
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                      <div className="size-8 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <HugeiconsIcon icon={Home02Icon} size={16} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Sede / Ciudad
                        </span>
                        <span className="text-sm font-bold text-slate-800 block">
                          {data.ciudad_nombre}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Módulo si está presente en detalle */}
                  {Boolean(data.detalle?.modulo) && (
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
                      <div className="size-8 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <HugeiconsIcon icon={Book02Icon} size={16} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Módulo
                        </span>
                        <span className="text-sm font-medium text-slate-800 block">
                          {String(data.detalle?.modulo)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medidor de Capacidad / Aforo (de code.html) */}
                {hasCapacidad && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Capacidad de Sala</span>
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
                        className={`font-semibold ${
                          pctOcupacion >= 100
                            ? "text-rose-600"
                            : pctOcupacion >= 80
                              ? "text-amber-600"
                              : "text-emerald-700"
                        }`}
                      >
                        {pctOcupacion >= 100 ? "Aforo completo" : "Aforo en rango óptimo"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Vista alternativa: Lista de eventos del DÍA SELECCIONADO */
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 capitalize">
                    {daySelection ? formatDate(daySelection.dateStr) : "Eventos del día"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {daySelection?.events.length || 0} actividades programadas
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {daySelection && daySelection.events.length > 0 ? (
                  daySelection.events.map((ev) => {
                    const st = getEventStyles(ev.tipo_evento)
                    return (
                      <div
                        key={ev.id}
                        onClick={() => onSelectEvent(ev)}
                        className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#fd761a]/60 bg-white hover:bg-orange-50/20 shadow-2xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                            style={{ backgroundColor: st.bg, color: st.text }}
                          >
                            {st.label}
                          </span>
                          <span className="text-xs font-bold text-[#fd761a]">
                            {formatTime(ev.hora_inicio)} - {formatTime(ev.hora_fin)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#fd761a] transition-colors line-clamp-1">
                          {ev.tipo_evento === "CLASE_CURSO" && ev.nombre_instancia
                            ? `Clase: ${ev.nombre_instancia}`
                            : ev.titulo}
                        </h4>

                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>{ev.instructor_nombre || (getEventPersonLabel(ev.tipo_evento) === "Cliente" ? "Sin cliente asignado" : "Sin docente asignado")}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#fd761a]">
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
          <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
            {/* Si es curso, botón "Ver Curso" */}
            {data && isCurso && data.referencia_id ? (
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
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
