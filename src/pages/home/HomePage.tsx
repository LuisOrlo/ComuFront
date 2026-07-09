import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  UserGroupIcon,
  DollarCircleIcon,
  CalendarIcon,
  Clock5Icon,
  Alert01Icon,
  AddCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Wallet01Icon,
  UserAdd01Icon,
  BarChartIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import { useDashboardData } from "@/hooks/useDashboardData"

const STAT_ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function getOccupancyStatus(ratio: number) {
  if (ratio >= 0.85) return { label: "Critico", color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.12)" }
  if (ratio >= 0.7) return { label: "Optimo", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.12)" }
  if (ratio >= 0.4) return { label: "Medio", color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" }
  return { label: "Bajo", color: MUTED, bg: "oklch(0.85 0 0 / 0.5)" }
}

function getActivityColor(type: string) {
  switch (type) {
    case "student": return "oklch(0.62 0.16 245)"
    case "payment": return "oklch(0.58 0.16 145)"
    case "enrollment": return STAT_ACCENT
    default: return MUTED
  }
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const points = useMemo(() => {
    if (data.length < 2) return ""
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const w = 72
    const h = 24
    const step = w / (data.length - 1)
    return data
      .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - ((v - min) / range) * (h - 4) - 2}`)
      .join(" ")
  }, [data])

  return (
    <svg viewBox="0 0 72 24" className="w-[72px] h-6 flex-none">
      <path d={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HomePage() {
  const {
    kpis,
    ingresosVsEgresos,
    alertasPagos,
    ocupacionCursos,
    agendaDelDia,
    actividadReciente,
    loading,
  } = useDashboardData()

  const navigate = useNavigate()
  const sparklineData = [38, 48, 42, 58, 64, 72]

  const statCards = [
    {
      icon: UserGroupIcon,
      label: "Matriculas activas",
      value: String(kpis.matriculasActivas),
      delta: 0,
      deltaLabel: "total inscritos",
      color: "oklch(0.62 0.16 245)",
    },
    {
      icon: DollarCircleIcon,
      label: "Ingresos del mes",
      value: `$${kpis.ingresosDelMes.toLocaleString()}`,
      delta: 0,
      deltaLabel: "este mes",
      color: "oklch(0.58 0.16 145)",
    },
    {
      icon: VideoIcon,
      label: "Cursos en progreso",
      value: String(kpis.cursosEnProgreso),
      delta: 0,
      deltaLabel: "activos",
      color: STAT_ACCENT,
    },
    {
      icon: Alert01Icon,
      label: "Pagos pendientes",
      value: `$${kpis.pagosPendientes.toLocaleString()}`,
      delta: alertasPagos.length,
      deltaLabel: "cuentas pendientes",
      color: "oklch(0.55 0.18 15)",
    },
  ]

  const quickActions = [
    { icon: UserAdd01Icon, label: "Nueva matricula", path: "/matriculas" },
    { icon: Wallet01Icon, label: "Registrar pago", path: "/finanzas/pagos" },
    { icon: AddCircleIcon, label: "Agregar curso", path: "/cursos/nuevo" },
    { icon: CalendarIcon, label: "Ver agenda", path: "/agenda" },
  ]

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div className="text-center">
          <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header
        className="flex-none flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: BORDER, backgroundColor: "white" }}
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            Vista general
          </p>
        </div>
        <span
          className="text-sm font-medium px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: `${STAT_ACCENT}12`, color: STAT_ACCENT }}
        >
          {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long" })}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ icon, label, value, delta, deltaLabel, color }) => (
            <article
              key={label}
              className="group relative overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
              style={{ borderColor: BORDER }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>
                    {label}
                  </span>
                  <div
                    className="flex items-center justify-center size-9 rounded-lg transition-colors"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <HugeiconsIcon icon={icon} size={18} style={{ color }} />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
                      {value}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      {delta > 0 && (
                        <HugeiconsIcon
                          icon={delta > 0 ? ArrowUp01Icon : ArrowDown01Icon}
                          size={12}
                          style={{ color: "oklch(0.58 0.16 145)" }}
                        />
                      )}
                      <span className="text-xs ml-1" style={{ color: MUTED }}>
                        {deltaLabel}
                      </span>
                    </div>
                  </div>
                  <MiniSparkline data={sparklineData} color={color} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article
            className="lg:col-span-2 rounded-xl border bg-white overflow-hidden"
            style={{ borderColor: BORDER }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${STAT_ACCENT}15` }}>
                  <HugeiconsIcon icon={BarChartIcon} size={16} style={{ color: STAT_ACCENT }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    Ingresos y Egresos
                  </h2>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Ultimos meses
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              {ingresosVsEgresos.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ingresosVsEgresos} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={BORDER} vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: MUTED }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: MUTED }}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: "oklch(0 0 0 / 0.03)" }}
                      contentStyle={{
                        borderRadius: "10px",
                        border: `1px solid ${BORDER}`,
                        boxShadow: "0 4px 16px -8px rgba(0,0,0,0.08)",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} maxBarSize={32} fill={STAT_ACCENT} />
                    <Bar dataKey="egresos" radius={[6, 6, 0, 0]} maxBarSize={32} fill="oklch(0.55 0.18 15 / 0.5)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                  Sin datos de ingresos/egresos
                </div>
              )}
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article
              className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <div className="px-5 py-4">
                <h2 className="text-sm font-semibold mb-3" style={{ color: CHARCOAL }}>
                  Accesos rapidos
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ icon, label, path }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 hover:border-[--hover] active:scale-[0.97] cursor-pointer"
                      style={{
                        borderColor: BORDER,
                        "--hover": STAT_ACCENT,
                      } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-center size-9 rounded-lg transition-colors" style={{ backgroundColor: `${STAT_ACCENT}12` }}>
                        <HugeiconsIcon icon={icon} size={17} style={{ color: STAT_ACCENT }} />
                      </div>
                      <span className="text-[11px] font-medium leading-tight" style={{ color: CHARCOAL }}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article
            className="lg:col-span-2 rounded-xl border bg-white overflow-hidden"
            style={{ borderColor: BORDER }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${STAT_ACCENT}15` }}>
                  <HugeiconsIcon icon={VideoIcon} size={16} style={{ color: STAT_ACCENT }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    Ocupacion de cursos
                  </h2>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Estado de inscripciones
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {ocupacionCursos.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Sin cursos registrados</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3 hidden sm:table-cell" style={{ color: MUTED }}>Instructor</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inscritos</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocupacionCursos.map(({ name, instructor, enrolled, capacity }) => {
                      const ratio = capacity > 0 ? enrolled / capacity : 0
                      const occupancy = getOccupancyStatus(ratio)
                      return (
                        <tr
                          key={name}
                          className="transition-colors hover:bg-gray-50/40"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{name}</p>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-sm" style={{ color: MUTED }}>{instructor}</span>
                          </td>
                          <td className="px-5 py-3.5 w-48">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${BORDER}` }}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: occupancy.color }}
                                />
                              </div>
                              <span className="text-xs font-medium flex-none w-10 text-right" style={{ color: CHARCOAL }}>
                                {enrolled}/{capacity}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ backgroundColor: occupancy.bg, color: occupancy.color }}
                            >
                              {occupancy.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article
              className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: BORDER }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
                    <HugeiconsIcon icon={Clock5Icon} size={15} style={{ color: "oklch(0.62 0.16 245)" }} />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                    Agenda del dia
                  </h2>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: `${STAT_ACCENT}12`, color: STAT_ACCENT }}>
                  Hoy
                </span>
              </div>
              <ul className="divide-y divide-[oklch(0.85_0_0)]">
                {agendaDelDia.length === 0 ? (
                  <li className="px-5 py-6 text-center text-sm text-gray-400">Sin eventos hoy</li>
                ) : (
                  agendaDelDia.map((event, i) => (
                    <li
                      key={event.id || i}
                      className="px-5 py-3.5 transition-colors hover:bg-gray-50/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>{event.titulo}</p>
                          <p className="text-xs mt-0.5" style={{ color: MUTED }}>{event.instructor_nombre || event.aula_nombre || "—"}</p>
                        </div>
                        <div className="flex-none flex flex-col items-end gap-1">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${event.color ?? STAT_ACCENT}15`,
                              color: event.color ?? STAT_ACCENT,
                            }}
                          >
                            {event.hora_inicio ? event.hora_inicio.substring(0, 5) : "—"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
                            {event.tipo_label || "—"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </article>

            <article
              className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                  Actividad reciente
                </h2>
              </div>
              <ul className="divide-y divide-[oklch(0.85_0_0)]">
                {actividadReciente.length === 0 ? (
                  <li className="px-5 py-6 text-center text-sm text-gray-400">Sin actividad reciente</li>
                ) : (
                  actividadReciente.slice(0, 5).flatMap((grupo) =>
                    grupo.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/40 transition-colors"
                      >
                        <div
                          className="flex-none mt-0.5 size-2 rounded-full"
                          style={{ backgroundColor: item.tipo === "curso" ? getActivityColor("enrollment") : getActivityColor("payment") }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>
                            {item.tipo === "curso" ? "Nueva solicitud de inscripcion" : "Inscripcion a taller"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                            {item.estudiante} — {item.curso}
                          </p>
                        </div>
                        <span className="flex-none text-[11px] mt-0.5" style={{ color: MUTED }}>{item.hora}</span>
                      </li>
                    ))
                  )
                )}
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
