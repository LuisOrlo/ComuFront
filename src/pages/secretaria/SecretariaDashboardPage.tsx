import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  AddCircleIcon,
  UserAdd01Icon,
  VideoIcon,
  Microphone,
  AiFolderIcon,
  UserGroupIcon,
  Clock01Icon,
  Time03Icon,
  Location01Icon,
  Alert01Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  CancelCircleIcon,
  TaskEdit01Icon,
  SunCloudIcon,
  AudioWave01Icon,
  GraduationCapIcon,
  CalendarIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { useSecretariaDashboardData } from "@/hooks/useSecretariaDashboardData"
import { secretariaService } from "@/services/secretaria.service"
import type { EventoAgenda, TareaPendiente, ReservaProxima, SolicitudPendienteItem, Alerta } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const TIPO_COLORS: Record<string, string> = {
  CLASE_CURSO: "oklch(0.62 0.16 245)",
  TALLER: "oklch(0.62 0.14 85)",
  ALQUILER_AULA: "oklch(0.58 0.16 145)",
  PODCAST: "oklch(0.62 0.18 304)",
  STREAMING: "oklch(0.65 0.14 200)",
  ASESORIA: "oklch(0.58 0.14 275)",
}

const URGENCIA_CONFIG = {
  critica: { color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.1)" },
  alta: { color: "oklch(0.65 0.18 60)", bg: "oklch(0.65 0.18 60 / 0.1)" },
  normal: { color: MUTED, bg: "oklch(0.9 0 0 / 0.4)" },
}

function EventoCard({ evento }: { evento: EventoAgenda }) {
  const color = TIPO_COLORS[evento.tipo_evento] ?? MUTED
  return (
    <div
      className="rounded-xl border bg-white p-4 transition-all duration-200 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
      style={{ borderColor: BORDER, borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="flex-none text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {evento.tipo_label}
            </span>
            <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>
              {evento.titulo}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
              <HugeiconsIcon icon={Time03Icon} size={13} />
              {evento.hora_inicio?.substring(0, 5) ?? "—"} - {evento.hora_fin?.substring(0, 5) ?? "—"}
            </span>
            {evento.instructor_nombre && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                <HugeiconsIcon icon={UserGroupIcon} size={13} />
                {evento.instructor_nombre}
              </span>
            )}
            {evento.aula_nombre && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                <HugeiconsIcon icon={Location01Icon} size={13} />
                {evento.aula_nombre}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertaCard({ alerta }: { alerta: Alerta }) {
  const config = {
    danger: { icon: CancelCircleIcon, bg: "oklch(0.55 0.18 15 / 0.08)", border: "oklch(0.55 0.18 15 / 0.25)", iconColor: "oklch(0.55 0.18 15)" },
    warning: { icon: Alert02Icon, bg: "oklch(0.65 0.18 60 / 0.08)", border: "oklch(0.65 0.18 60 / 0.25)", iconColor: "oklch(0.65 0.18 60)" },
    info: { icon: InformationCircleIcon, bg: "oklch(0.62 0.16 245 / 0.08)", border: "oklch(0.62 0.16 245 / 0.25)", iconColor: "oklch(0.62 0.16 245)" },
  }
  const c = config[alerta.tipo]
  const navigate = useNavigate()
  const Icon = c.icon

  return (
    <div
      className="rounded-xl border p-4 flex items-start gap-3 transition-all duration-200 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)] cursor-pointer"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
      onClick={() => alerta.accion && navigate(alerta.accion.path)}
    >
      <div className="flex-none flex items-center justify-center size-9 rounded-lg shrink-0" style={{ backgroundColor: `${c.iconColor}15` }}>
        <HugeiconsIcon icon={Icon} size={18} style={{ color: c.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{alerta.mensaje}</p>
        {alerta.accion && (
          <p className="text-xs font-semibold mt-1" style={{ color: c.iconColor }}>
            {alerta.accion.label} →
          </p>
        )}
      </div>
    </div>
  )
}

function TareaCard({ tarea }: { tarea: TareaPendiente }) {
  const urg = URGENCIA_CONFIG[tarea.urgencia]
  const tipoLabel = {
    certificado: "Certificado",
    solicitud_vencida: "Solicitud vencida",
    cambio_horario: "Cambio de horario",
  }

  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/40 transition-colors">
      <div className="flex-none flex items-center justify-center size-8 rounded-lg shrink-0" style={{ backgroundColor: urg.bg }}>
        <HugeiconsIcon icon={Alert01Icon} size={15} style={{ color: urg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: urg.bg, color: urg.color }}>
            {tipoLabel[tarea.tipo]}
          </span>
          <span className="text-[10px]" style={{ color: MUTED }}>
            {tarea.fecha}
          </span>
        </div>
        <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: CHARCOAL }}>
          {tarea.descripcion}
        </p>
      </div>
    </div>
  )
}

function SolicitudCard({
  item,
  onAprobar,
  onRechazar,
}: {
  item: SolicitudPendienteItem
  onAprobar: (id: string) => void
  onRechazar: (id: string) => void
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/40 transition-colors">
      <div className="flex-none flex items-center justify-center size-9 rounded-full text-xs font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
        {item.solicitante.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>{item.solicitante}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{item.curso}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.tiene_comprobante ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {item.tiene_comprobante ? "Comprobante OK" : "Sin comprobante"}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.tiene_cedula ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {item.tiene_cedula ? "Cédula OK" : "Sin cédula"}
          </span>
        </div>
      </div>
      <div className="flex-none flex items-center gap-1.5">
        <button
          onClick={() => onAprobar(item.id)}
          className="inline-flex items-center justify-center size-7 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.12)", color: "oklch(0.58 0.16 145)" }}
          title="Aprobar"
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
        </button>
        <button
          onClick={() => onRechazar(item.id)}
          className="inline-flex items-center justify-center size-7 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)", color: "oklch(0.55 0.18 15)" }}
          title="Rechazar"
        >
          <HugeiconsIcon icon={CancelCircleIcon} size={15} />
        </button>
      </div>
    </div>
  )
}

export function SecretariaDashboardPage() {
  const navigate = useNavigate()
  const { data, loading } = useSecretariaDashboardData()
  const [filtroAgenda, setFiltroAgenda] = useState<string | null>(null)

  const fechaActual = useMemo(() =>
    new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  [])

  const eventosFiltrados = useMemo(() => {
    if (!data?.agenda_hoy) return []
    if (!filtroAgenda) {
      return data.agenda_hoy.flatMap((g) => g.eventos).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    }
    const grupo = data.agenda_hoy.find((g) => g.tipo === filtroAgenda)
    return grupo?.eventos ?? []
  }, [data, filtroAgenda])

  const totalEventosHoy = useMemo(() =>
    data?.agenda_hoy?.reduce((acc, g) => acc + g.total, 0) ?? 0,
  [data?.agenda_hoy])

  const handleAprobar = async (id: string) => {
    try {
      await secretariaService.aprobarSolicitud(id)
      toast.success("Solicitud aprobada exitosamente")
      window.location.reload()
    } catch {
      toast.error("Error al aprobar la solicitud")
    }
  }

  const handleRechazar = async (id: string) => {
    try {
      await secretariaService.rechazarSolicitud(id, { motivo_rechazo: "Rechazado desde dashboard" })
      toast.success("Solicitud rechazada")
      window.location.reload()
    } catch {
      toast.error("Error al rechazar la solicitud")
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
        <header className="flex-none border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
          <div className="h-6 w-48 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)" }} />
          <div className="h-4 w-32 rounded animate-pulse mt-2" style={{ backgroundColor: "oklch(0.93 0 0)" }} />
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white p-5" style={{ borderColor: BORDER }}>
                <div className="h-3 w-24 rounded animate-pulse mb-3" style={{ backgroundColor: "oklch(0.9 0 0)" }} />
                <div className="h-8 w-16 rounded animate-pulse" style={{ backgroundColor: "oklch(0.93 0 0)" }} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white p-4" style={{ borderColor: BORDER }}>
                <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)" }} />
                <div className="h-3 w-1/2 rounded animate-pulse mt-2" style={{ backgroundColor: "oklch(0.93 0 0)" }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ backgroundColor: `${ACCENT}12` }}>
            <HugeiconsIcon icon={GraduationCapIcon} size={28} style={{ color: ACCENT }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: CHARCOAL }}>
            Panel de Secretaría
          </h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            No hay datos disponibles para mostrar. Verifica tu conexión e intenta de nuevo.
          </p>
        </div>
      </div>
    )
  }

  const stats = [
    { icon: Wallet01Icon, label: "Pagos pendientes", value: data.pagos_pendientes_hoy, sub: "Por verificar hoy", color: "oklch(0.55 0.18 15)", path: "/secretaria/pagos" },
    { icon: UserGroupIcon, label: "Estudiantes activos", value: data.resumen_estudiantes.total_activos, sub: "Con matrícula activa", color: "oklch(0.58 0.16 145)", path: "/secretaria/estudiantes" },
    { icon: AddCircleIcon, label: "Solicitudes", value: data.solicitudes_pendientes.total, sub: "Pendientes de aprobar", color: "oklch(0.62 0.16 245)", path: "/secretaria/solicitudes" },
    { icon: CalendarIcon, label: "Eventos hoy", value: totalEventosHoy, sub: "En la agenda del día", color: ACCENT, path: "#" },
  ]

  const serviciosActivos = [
    { label: "Podcast", value: data.estado_servicios.podcast_activas, icon: Microphone, color: "oklch(0.62 0.18 304)", path: "/secretaria/podcast" },
    { label: "Edición Video", value: data.estado_servicios.edicion_pendientes, icon: VideoIcon, color: "oklch(0.58 0.16 145)", path: "/secretaria/edicion-video" },
    { label: "Alquileres", value: data.estado_servicios.alquileres_activos, icon: AiFolderIcon, color: ACCENT, path: "/secretaria/alquileres" },
  ]

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-5" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
            Panel de Secretaría
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: MUTED }}>{fechaActual}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
          Secretaría
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-7xl">
        {/* Alertas */}
        {data.alertas.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center size-7 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
                <HugeiconsIcon icon={Alert02Icon} size={14} style={{ color: "oklch(0.55 0.18 15)" }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Alertas</h2>
            </div>
            <div className="grid gap-2.5">
              {data.alertas.map((a) => (
                <AlertaCard key={a.id} alerta={a} />
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon, label, value, sub, color, path }) => (
            <div
              key={label}
              className="rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] cursor-pointer"
              style={{ borderColor: BORDER }}
              onClick={() => navigate(path)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>{label}</span>
                <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                  <HugeiconsIcon icon={icon} size={18} style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: CHARCOAL }}>{value}</p>
              <p className="text-[11px] mt-1" style={{ color: MUTED }}>{sub}</p>
            </div>
          ))}
        </section>

        {/* Grid principal: Agenda + Solicitudes */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agenda del día */}
          <article className="lg:col-span-2 rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                  <HugeiconsIcon icon={Clock01Icon} size={16} style={{ color: ACCENT }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Agenda del día</h2>
                {totalEventosHoy > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
                    {totalEventosHoy} evento{totalEventosHoy !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Filtros por tipo de evento */}
            {data.agenda_hoy.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b" style={{ borderColor: BORDER, backgroundColor: "oklch(0.97 0 0 / 0.5)" }}>
                <button
                  onClick={() => setFiltroAgenda(null)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: !filtroAgenda ? `${ACCENT}15` : "oklch(0.93 0 0 / 0.5)",
                    color: !filtroAgenda ? ACCENT : MUTED,
                  }}
                >
                  Todos
                </button>
                {data.agenda_hoy.map((grupo) => (
                  <button
                    key={grupo.tipo}
                    onClick={() => setFiltroAgenda(grupo.tipo)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center gap-1.5"
                    style={{
                      backgroundColor: filtroAgenda === grupo.tipo ? `${grupo.color}15` : "oklch(0.93 0 0 / 0.5)",
                      color: filtroAgenda === grupo.tipo ? grupo.color : MUTED,
                    }}
                  >
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: grupo.color }} />
                    {grupo.tipo_label} ({grupo.total})
                  </button>
                ))}
              </div>
            )}

            <div className="divide-y" style={{ borderColor: "oklch(0.9 0 0)" }}>
              {eventosFiltrados.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center size-12 rounded-xl mx-auto mb-3" style={{ backgroundColor: `${ACCENT}10` }}>
                    <HugeiconsIcon icon={SunCloudIcon} size={24} style={{ color: ACCENT }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    {filtroAgenda ? "No hay eventos de este tipo hoy" : "Sin eventos programados para hoy"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>
                    {filtroAgenda ? "Prueba con otro filtro" : "La agenda del día está despejada"}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {eventosFiltrados.map((evento) => (
                    <EventoCard key={evento.id} evento={evento} />
                  ))}
                </div>
              )}
            </div>
          </article>

          {/* Solicitudes pendientes */}
          <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                  <HugeiconsIcon icon={UserAdd01Icon} size={16} style={{ color: ACCENT }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Solicitudes pendientes</h2>
              </div>
              <button
                onClick={() => navigate("/secretaria/solicitudes")}
                className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 hover:gap-1.5"
                style={{ color: ACCENT }}
              >
                Ver todas <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0.9 0 0)" }}>
              {data.solicitudes_pendientes.items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} style={{ color: "oklch(0.8 0 0)" }} />
                  <p className="text-sm mt-2" style={{ color: MUTED }}>Sin solicitudes pendientes</p>
                </div>
              ) : (
                data.solicitudes_pendientes.items.slice(0, 5).map((item) => (
                  <SolicitudCard
                    key={item.id}
                    item={item}
                    onAprobar={handleAprobar}
                    onRechazar={handleRechazar}
                  />
                ))
              )}
            </div>
          </article>
        </section>

        {/* Grid secundario: Estudiantes + Reservas + Tareas */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen estudiantes */}
          <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                <HugeiconsIcon icon={UserGroupIcon} size={16} style={{ color: ACCENT }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Estudiantes</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.08)" }}>
                <div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: "oklch(0.58 0.16 145)" }}>{data.resumen_estudiantes.total_activos}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>Estudiantes activos</p>
                </div>
                <div className="flex items-center justify-center size-10 rounded-xl" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.12)" }}>
                  <HugeiconsIcon icon={GraduationCapIcon} size={20} style={{ color: "oklch(0.58 0.16 145)" }} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.08)" }}>
                <div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: "oklch(0.55 0.18 15)" }}>{data.resumen_estudiantes.asistencia_baja}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>Asistencia {"<"}70%</p>
                </div>
                <div className="flex items-center justify-center size-10 rounded-xl" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.12)" }}>
                  <HugeiconsIcon icon={Alert01Icon} size={20} style={{ color: "oklch(0.55 0.18 15)" }} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.08)" }}>
                <div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: "oklch(0.62 0.16 245)" }}>{data.resumen_estudiantes.proximos_completar_modulo}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>Próximos a completar módulo</p>
                </div>
                <div className="flex items-center justify-center size-10 rounded-xl" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.12)" }}>
                  <HugeiconsIcon icon={TaskEdit01Icon} size={20} style={{ color: "oklch(0.62 0.16 245)" }} />
                </div>
              </div>
            </div>
          </article>

          {/* Reservas próximas */}
          <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                  <HugeiconsIcon icon={CalendarIcon} size={16} style={{ color: ACCENT }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Próximas reservas</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
                {data.reservas_proximas.total > 0 ? "3 días" : "Vacío"}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0.9 0 0)" }}>
              {data.reservas_proximas.total === 0 ? (
                <div className="px-5 py-10 text-center">
                  <HugeiconsIcon icon={CalendarIcon} size={22} style={{ color: "oklch(0.8 0 0)" }} />
                  <p className="text-sm mt-2" style={{ color: MUTED }}>Sin reservas próximas</p>
                </div>
              ) : (
                <>
                  {data.reservas_proximas.aulas.length > 0 && (
                    <div className="px-5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.58 0.16 145)" }}>
                        Aulas ({data.reservas_proximas.aulas.length})
                      </p>
                      <div className="space-y-1.5">
                        {data.reservas_proximas.aulas.slice(0, 2).map((r) => (
                          <ReservaSmallCard key={r.id} reserva={r} />
                        ))}
                      </div>
                    </div>
                  )}
                  {data.reservas_proximas.podcast.length > 0 && (
                    <div className="px-5 py-3 border-t" style={{ borderColor: "oklch(0.92 0 0)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.62 0.18 304)" }}>
                        Podcast ({data.reservas_proximas.podcast.length})
                      </p>
                      <div className="space-y-1.5">
                        {data.reservas_proximas.podcast.slice(0, 2).map((r) => (
                          <ReservaSmallCard key={r.id} reserva={r} />
                        ))}
                      </div>
                    </div>
                  )}
                  {data.reservas_proximas.radio.length > 0 && (
                    <div className="px-5 py-3 border-t" style={{ borderColor: "oklch(0.92 0 0)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.65 0.14 200)" }}>
                        Radio ({data.reservas_proximas.radio.length})
                      </p>
                      <div className="space-y-1.5">
                        {data.reservas_proximas.radio.slice(0, 2).map((r) => (
                          <ReservaSmallCard key={r.id} reserva={r} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </article>

          {/* Tareas pendientes */}
          <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                  <HugeiconsIcon icon={TaskEdit01Icon} size={16} style={{ color: ACCENT }} />
                </div>
                <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Tareas pendientes</h2>
              </div>
              {data.tareas_pendientes.filter((t) => t.urgencia === "critica").length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.12)", color: "oklch(0.55 0.18 15)" }}>
                  {data.tareas_pendientes.filter((t) => t.urgencia === "critica").length} críticas
                </span>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0.9 0 0)" }}>
              {data.tareas_pendientes.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} style={{ color: "oklch(0.8 0 0)" }} />
                  <p className="text-sm mt-2" style={{ color: MUTED }}>Sin tareas pendientes</p>
                </div>
              ) : (
                data.tareas_pendientes.slice(0, 8).map((tarea) => (
                  <TareaCard key={tarea.id} tarea={tarea} />
                ))
              )}
            </div>
          </article>
        </section>

        {/* Cursos con cupo + Servicios */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                  <HugeiconsIcon icon={GraduationCapIcon} size={17} style={{ color: ACCENT }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Cursos con cupo disponible</h2>
                  <p className="text-xs" style={{ color: MUTED }}>Listos para nuevas matrículas</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/secretaria/cursos")}
                className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 hover:gap-1.5"
                style={{ color: ACCENT }}
              >
                Ver todos <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inscritos</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Disponibles</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cursos_con_cupo.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <HugeiconsIcon icon={GraduationCapIcon} size={22} style={{ color: "oklch(0.8 0 0)" }} />
                          <p className="text-sm" style={{ color: MUTED }}>No hay cursos con cupo disponible</p>
                        </div>
                      </td>
                    </tr>
                  ) : data.cursos_con_cupo.slice(0, 5).map((curso) => {
                    const ratio = curso.inscritos / Math.max(curso.capacidad, 1)
                    const occupancyColor = ratio >= 0.85
                      ? { color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.12)" }
                      : ratio >= 0.7
                        ? { color: ACCENT, bg: `${ACCENT}15` }
                        : ratio >= 0.4
                          ? { color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" }
                          : { color: "oklch(0.55 0.1 260)", bg: "oklch(0.55 0.1 260 / 0.1)" }
                    return (
                      <tr
                        key={curso.id}
                        className="group transition-colors hover:bg-gray-50/60 cursor-pointer"
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                        onClick={() => navigate("/secretaria/cursos")}
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>{curso.nombre}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.9 0 0)" }}>
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: occupancyColor.color }} />
                            </div>
                            <span className="text-xs font-semibold tabular-nums" style={{ color: CHARCOAL }}>
                              {curso.inscritos}/{curso.capacidad}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
                            {curso.disponibles}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm" style={{ color: MUTED }}>{formatDate(curso.fecha_inicio)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>

          {/* Servicios activos */}
          <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                <HugeiconsIcon icon={AiFolderIcon} size={16} style={{ color: ACCENT }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>Servicios activos</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "oklch(0.9 0 0)" }}>
              {serviciosActivos.map(({ label, value, icon, color, path }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors cursor-pointer"
                  onClick={() => navigate(path)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                      <HugeiconsIcon icon={icon} size={17} style={{ color }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: CHARCOAL }}>{label}</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

function ReservaSmallCard({ reserva }: { reserva: ReservaProxima }) {
  const tipoColor = {
    aula: "oklch(0.58 0.16 145)",
    podcast: "oklch(0.62 0.18 304)",
    radio: "oklch(0.65 0.14 200)",
  }
  const color = tipoColor[reserva.tipo] ?? MUTED

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg transition-colors hover:bg-gray-50/60">
      <div className="flex-none flex items-center justify-center size-7 rounded-md" style={{ backgroundColor: `${color}12` }}>
        <HugeiconsIcon icon={reserva.tipo === "aula" ? Location01Icon : reserva.tipo === "podcast" ? Microphone : AudioWave01Icon} size={13} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: CHARCOAL }}>{reserva.cliente_nombre}</p>
        <p className="text-[10px]" style={{ color: MUTED }}>
          {reserva.fecha} · {reserva.hora_inicio?.substring(0, 5)} - {reserva.hora_fin?.substring(0, 5)}
        </p>
      </div>
    </div>
  )
}
