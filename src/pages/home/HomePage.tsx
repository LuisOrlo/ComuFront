import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  UserGroupIcon,
  DollarCircleIcon,
  CalendarIcon,
  Clock5Icon,
  ArrowRight01Icon,
  Alert01Icon,
  AddCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Wallet01Icon,
  UserAdd01Icon,
  BarChartIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useMemo } from "react"

const STAT_ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const statCards = [
  {
    icon: UserGroupIcon,
    label: "Matriculas activas",
    value: "248",
    delta: 15,
    deltaLabel: "vs mes anterior",
    color: "oklch(0.62 0.16 245)",
  },
  {
    icon: DollarCircleIcon,
    label: "Ingresos del mes",
    value: "$4,850",
    delta: 8.2,
    deltaLabel: "vs mes anterior",
    color: "oklch(0.58 0.16 145)",
  },
  {
    icon: VideoIcon,
    label: "Cursos en progreso",
    value: "12",
    delta: 2,
    deltaLabel: "nuevos este mes",
    color: STAT_ACCENT,
  },
  {
    icon: Alert01Icon,
    label: "Pagos pendientes",
    value: "7",
    delta: -3,
    deltaLabel: "3 vencidos",
    color: "oklch(0.55 0.18 15)",
  },
]

const weeklyIncome = [
  { name: "Sem 1", ingresos: 980 },
  { name: "Sem 2", ingresos: 1240 },
  { name: "Sem 3", ingresos: 1100 },
  { name: "Sem 4", ingresos: 1530 },
]

const courses = [
  { name: "Curso de Video", instructor: "Carlos Roa", enrolled: 22, capacity: 25 },
  { name: "Taller de Podcast", instructor: "Laura Blum", enrolled: 15, capacity: 20 },
  { name: "Curso de Edicion", instructor: "Miguel Soto", enrolled: 9, capacity: 18 },
  { name: "Curso de Audio", instructor: "Laura Blum", enrolled: 6, capacity: 12 },
  { name: "Taller de Fotografia", instructor: "Ana Villegas", enrolled: 24, capacity: 28 },
  { name: "Curso de Iluminacion", instructor: "Pedro Rivas", enrolled: 4, capacity: 15 },
]

const quickActions = [
  { icon: UserAdd01Icon, label: "Nueva matricula" },
  { icon: Wallet01Icon, label: "Registrar pago" },
  { icon: AddCircleIcon, label: "Agregar curso" },
  { icon: CalendarIcon, label: "Ver agenda" },
]

const agenda = [
  { name: "Curso de Video - Modulo 3", instructor: "Carlos Roa", time: "14:00", status: "confirmed" as const },
  { name: "Taller de Podcast", instructor: "Laura Blum", time: "16:00", status: "confirmed" as const },
  { name: "Curso de Edicion", instructor: "Miguel Soto", time: "10:00", status: "pending" as const },
  { name: "Curso de Audio", instructor: "Laura Blum", time: "14:00", status: "pending" as const },
]

const recentActivity = [
  { id: 1, action: "Nuevo estudiante registrado", actor: "Valentina Rojas", time: "Hace 5 min", type: "student" as const },
  { id: 2, action: "Pago recibido - Curso de Podcast", actor: "Esteban Carmona", time: "Hace 1 hora", type: "payment" as const },
  { id: 3, action: "Nueva matricula en Curso de Video", actor: "Lucia Mendez", time: "Hace 3 horas", type: "enrollment" as const },
  { id: 4, action: "Horario actualizado - Taller Fotografia", actor: "Staff Admin", time: "Ayer", type: "system" as const },
  { id: 5, action: "Certificado generado", actor: "Sistema", time: "Ayer", type: "system" as const },
]

const sparklineData = [38, 48, 42, 58, 64, 72]

const recentEnrollments = [
  { student: "Valentina Rojas", course: "Curso de Video", date: "29 May 2026", payment: "Completo" },
  { student: "Esteban Carmona", course: "Taller de Podcast", date: "28 May 2026", payment: "Completo" },
  { student: "Lucia Mendez", course: "Curso de Video", date: "28 May 2026", payment: "Pendiente" },
  { student: "Diego Navarro", course: "Curso de Edicion", date: "27 May 2026", payment: "Completo" },
  { student: "Camila Ortega", course: "Curso de Audio", date: "26 May 2026", payment: "Parcial" },
]

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
          Mayo 2026
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
                    <HugeiconsIcon
                      icon={delta > 0 ? ArrowUp01Icon : ArrowDown01Icon}
                      size={12}
                      style={{ color: delta > 0 ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)" }}
                    />
                      <span
                        className="text-xs font-medium"
                        style={{ color: delta > 0 ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)" }}
                      >
                        {delta > 0 ? `+${delta}` : delta}{deltaLabel.includes("%") ? "" : ""}
                      </span>
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
                    Ingresos por semana
                  </h2>
                  <p className="text-xs" style={{ color: MUTED }}>
                    Mayo 2026
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)", color: "oklch(0.58 0.16 145)" }}>
                +8.2% vs Abr
              </span>
            </div>
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyIncome} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={BORDER} vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: MUTED }}
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
                  <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {weeklyIncome.map((_entry, i) => (
                      <Cell
                        key={i}
                        fill={STAT_ACCENT}
                        opacity={0.65 + i * 0.1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article
              className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <div
                className="flex items-center gap-2 px-5 py-4 border-b"
                style={{ borderColor: BORDER }}
              >
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
                  <HugeiconsIcon icon={Alert01Icon} size={16} style={{ color: "oklch(0.55 0.18 15)" }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                  Alertas de pagos
                </h2>
              </div>
              <ul className="divide-y divide-[oklch(0.85_0_0)]">
                {[
                  { student: "Martin Delgado", course: "Curso de Video", amount: "$320", days: 5 },
                  { student: "Sofia Herrera", course: "Taller de Podcast", amount: "$180", days: 3 },
                  { student: "Tomas Rivera", course: "Curso de Edicion", amount: "$220", days: 2 },
                ].map(({ student, course, amount, days }) => (
                  <li key={student} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-none flex items-center justify-center size-7 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${STAT_ACCENT}18`, color: STAT_ACCENT }}>
                        {student.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>{student}</p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{course} — {amount}</p>
                      </div>
                      <span
                        className="flex-none text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: days > 3 ? "oklch(0.55 0.18 15 / 0.1)" : "oklch(0.62 0.14 85 / 0.12)", color: days > 3 ? "oklch(0.55 0.18 15)" : "oklch(0.62 0.14 85)" }}
                      >
                        {days}d
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article
              className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              <div className="px-5 py-4">
                <h2 className="text-sm font-semibold mb-3" style={{ color: CHARCOAL }}>
                  Accesos rapidos
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ icon, label }) => (
                    <button
                      key={label}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 hover:border-[--hover] active:scale-[0.97]"
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
              <button className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70" style={{ color: STAT_ACCENT }}>
                Ver todos
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </button>
            </div>
            <div className="overflow-x-auto">
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
                  {courses.map(({ name, instructor, enrolled, capacity }) => {
                    const ratio = enrolled / capacity
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
                                style={{ width: `${ratio * 100}%`, backgroundColor: occupancy.color }}
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
                {agenda.map(({ name, instructor, time, status }, i) => (
                  <li
                    key={i}
                    className={cn(
                      "px-5 py-3.5 transition-colors",
                      status === "confirmed" && "hover:bg-gray-50/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>{name}</p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{instructor}</p>
                      </div>
                      <div className="flex-none flex flex-col items-end gap-1">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: status === "confirmed" ? `${STAT_ACCENT}15` : `${BORDER}`,
                            color: status === "confirmed" ? STAT_ACCENT : MUTED,
                          }}
                        >
                          {time}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
                          {status === "confirmed" ? "Confirmado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
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
                {recentActivity.map(({ id, action, actor, time, type }) => (
                  <li
                    key={id}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/40 transition-colors"
                  >
                    <div
                      className="flex-none mt-0.5 size-2 rounded-full"
                      style={{ backgroundColor: getActivityColor(type) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>{action}</p>
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>{actor}</p>
                    </div>
                    <span className="flex-none text-[11px] mt-0.5" style={{ color: MUTED }}>{time}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <article
          className="rounded-xl border bg-white overflow-hidden"
          style={{ borderColor: BORDER }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${STAT_ACCENT}15` }}>
                <HugeiconsIcon icon={UserAdd01Icon} size={16} style={{ color: STAT_ACCENT }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                  Ultimas matriculas
                </h2>
                <p className="text-xs" style={{ color: MUTED }}>
                  Registros mas recientes
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70" style={{ color: STAT_ACCENT }}>
              Ver todas
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estudiante</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3 hidden sm:table-cell" style={{ color: MUTED }}>Fecha</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Pago</th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments.map(({ student, course, date, payment }) => (
                  <tr
                    key={`${student}-${course}`}
                    className="transition-colors hover:bg-gray-50/40"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-none flex items-center justify-center size-7 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: `${STAT_ACCENT}18`, color: STAT_ACCENT }}
                        >
                          {student.charAt(0)}
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{student}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: MUTED }}>{course}</span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="text-sm" style={{ color: MUTED }}>{date}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                          payment === "Completo" && "bg-green-100 text-green-700",
                          payment === "Pendiente" && "bg-red-100 text-red-600",
                          payment === "Parcial" && "bg-amber-100 text-amber-700",
                        )}
                      >
                        {payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </main>
    </div>
  )
}
