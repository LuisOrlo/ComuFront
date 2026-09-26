import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  AddCircleIcon,
  Alert01Icon,
  ArrowRight01Icon,
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  Clock5Icon,
  DollarCircleIcon,
  UserAdd01Icon,
  UserGroupIcon,
  VideoIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useDashboardData } from "@/hooks/useDashboardData"
import { financeService } from "@/services/finance.service"

const ORANGE = "#fd761a"
const SURFACE = "#f8f9ff"
const SURFACE_LOW = "#eff4ff"
const OUTLINE = "#c6c6cd"
const ON_SURFACE = "#0b1c30"
const ON_SURFACE_VARIANT = "#45464d"
const GREEN = "#009668"
const ERROR = "#ba1a1a"
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const formatCurrency = (value: number) => currencyFormatter.format(value || 0)

function getOccupancyStatus(ratio: number) {
  if (ratio >= 0.85) return { label: "Crítico", color: ERROR, bg: "#ffdad6" }
  if (ratio >= 0.7) return { label: "Óptimo", color: GREEN, bg: "#d5f5e5" }
  if (ratio >= 0.4) return { label: "Medio", color: "#9d6400", bg: "#ffefc2" }
  return { label: "Bajo cupo", color: "#9d4300", bg: "#ffdbca" }
}

function EmptyState({ icon, title, description, actionLabel, onAction }: {
  icon: IconSvgElement
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="mt-3 flex flex-col items-center justify-center rounded-lg px-5 py-7 text-center" style={{ backgroundColor: SURFACE_LOW }}>
      <div className="mb-2 flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: "#e5eeff", color: "#76777d" }}>
        <HugeiconsIcon icon={icon} size={23} />
      </div>
      <p className="text-[13px] font-semibold" style={{ color: ON_SURFACE }}>{title}</p>
      <p className="mt-1 max-w-[250px] text-xs leading-5" style={{ color: ON_SURFACE_VARIANT }}>{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: ORANGE }}>
          <HugeiconsIcon icon={AddCircleIcon} size={15} />{actionLabel}
        </button>
      )}
    </div>
  )
}

export function HomePage() {
  const {
    kpis, ingresosVsEgresos, ocupacionCursos, agendaDelDia, actividadReciente, loading,
  } = useDashboardData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const paymentsQuery = useQuery({
    queryKey: ["dashboard", "historial-pagos"],
    queryFn: () => financeService.getHistorial({ page: 1, per_page: 5, tipo_movimiento: "ingreso" }),
    staleTime: 2 * 60 * 1000,
  })
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", year: "numeric", month: "long" }).format(new Date()),
    [],
  )
  const todayLabel = new Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", day: "2-digit", month: "short" }).format(new Date())
  const totals = useMemo(() => {
    const enrolled = ocupacionCursos.reduce((sum, course) => sum + course.enrolled, 0)
    const capacity = ocupacionCursos.reduce((sum, course) => sum + course.capacity, 0)
    const lowCapacity = ocupacionCursos.filter((course) => course.capacity > 0 && course.enrolled / course.capacity < 0.4).length
    return { lowCapacity, occupancy: capacity ? Math.round((enrolled / capacity) * 100) : 0 }
  }, [ocupacionCursos])
  const recentPayments = Array.isArray(paymentsQuery.data?.data) ? paymentsQuery.data.data : []

  const refresh = async () => {
    setRefreshing(true)
    try {
      await queryClient.refetchQueries({ queryKey: ["dashboard"], type: "active" })
    } finally {
      setRefreshing(false)
    }
  }

  const statCards = [
    { icon: UserGroupIcon, label: "Matrículas activas", value: String(kpis.matriculasActivas), color: "#9d4300", bg: "#ffdbca", detail: "Alumnos vigentes en cursos", foot: "Ciclo actual" },
    { icon: DollarCircleIcon, label: "Ingresos del mes", value: formatCurrency(kpis.ingresosDelMes), color: GREEN, bg: "#d5f5e5", detail: "Ingresos acumulados", foot: monthLabel },
    { icon: VideoIcon, label: "Cursos en progreso", value: String(kpis.cursosEnProgreso), color: ON_SURFACE, bg: "#dce9ff", detail: `${ocupacionCursos.length} cursos cargados`, foot: `${totals.occupancy}% de aforo ocupado` },
    { icon: Alert01Icon, label: "Pagos pendientes", value: formatCurrency(kpis.pagosPendientes), color: ERROR, bg: "#ffdad6", detail: "Saldo por cobrar", foot: kpis.pagosPendientes > 0 ? "Requiere seguimiento" : "Sin saldo pendiente" },
  ]
  const quickActions = [
    { icon: UserAdd01Icon, label: "Nueva matrícula", description: "Inscribir alumno", path: "/estudiantes" },
    { icon: Wallet01Icon, label: "Registrar pago", description: "Recibo o arancel", path: "/finanzas/pagos" },
    { icon: AddCircleIcon, label: "Agregar curso", description: "Nuevo curso", path: "/cursos/nuevo" },
    { icon: CalendarIcon, label: "Ver agenda", description: "Horarios y aulas", path: "/agenda" },
  ]

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ backgroundColor: SURFACE }}>
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: ORANGE, borderTopColor: "transparent" }} />
          <p className="text-sm font-medium" style={{ color: ON_SURFACE_VARIANT }}>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: SURFACE, color: ON_SURFACE, fontFamily: '"Plus Jakarta Sans", Figtree, sans-serif' }}>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">Inicio</h1>
            </div>
            <p className="mt-1 text-sm" style={{ color: ON_SURFACE_VARIANT }}>Vista general del rendimiento operativo y académico</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <HugeiconsIcon icon={CalendarDaysIcon} size={17} style={{ color: ORANGE }} />
              <span className="text-xs font-semibold capitalize">{monthLabel}</span>
              <span className="size-1.5 rounded-full" style={{ backgroundColor: ORANGE }} />
            </div>
            <button type="button" title="Actualizar datos" aria-label="Actualizar datos del dashboard" onClick={() => void refresh()} disabled={refreshing}
              className="flex size-9 items-center justify-center rounded-full bg-white text-lg shadow-sm transition-colors hover:bg-[#dce9ff] disabled:opacity-60">
              <span className={refreshing ? "animate-spin" : ""} aria-hidden="true">↻</span>
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">
          {statCards.map(({ icon, label, value, color, bg, detail, foot }, index) => (
            <article key={label} className="flex min-h-[150px] flex-col justify-between rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: ON_SURFACE_VARIANT }}>{label}</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-bold leading-tight tracking-tight">{value}</p>
                    {index === 3 && kpis.pagosPendientes > 0 && <span className="text-[11px] font-medium" style={{ color: ERROR }}>Por cobrar</span>}
                  </div>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: bg, color }}><HugeiconsIcon icon={icon} size={23} /></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "#e5eeff" }}>
                <span className="text-[11px]" style={{ color: ON_SURFACE_VARIANT }}>{detail}</span>
                <span className="text-[10px] font-medium" style={{ color: index === 3 && kpis.pagosPendientes > 0 ? ERROR : ON_SURFACE_VARIANT }}>{foot}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Resumen operativo">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <article className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">Ingresos y egresos</h2>
                    <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: "#e5eeff", color: ON_SURFACE_VARIANT }}>Últimos {ingresosVsEgresos.length} meses</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Comparativa mensual del balance operativo</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ backgroundColor: ORANGE }} />Ingresos</span>
                    <span className="flex items-center gap-1.5" style={{ color: ON_SURFACE_VARIANT }}><span className="size-2.5 rounded-full bg-[#94a3b8]" />Egresos</span>
                  </div>
                  <div className="inline-flex rounded-lg p-0.5" style={{ backgroundColor: SURFACE_LOW }} role="group" aria-label="Tipo de gráfico">
                    <button type="button" aria-pressed={chartType === "line"} onClick={() => setChartType("line")} className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors" style={{ backgroundColor: chartType === "line" ? "white" : "transparent", color: chartType === "line" ? ORANGE : ON_SURFACE_VARIANT }}>Líneas</button>
                    <button type="button" aria-pressed={chartType === "bar"} onClick={() => setChartType("bar")} className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors" style={{ backgroundColor: chartType === "bar" ? "white" : "transparent", color: chartType === "bar" ? ORANGE : ON_SURFACE_VARIANT }}>Barras</button>
                  </div>
                </div>
              </div>
              {ingresosVsEgresos.length ? (
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <AreaChart data={ingresosVsEgresos} margin={{ top: 14, right: 8, left: -12, bottom: 0 }}>
                        <defs><linearGradient id="homeIncomeGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={0.28} /><stop offset="100%" stopColor={ORANGE} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid stroke={OUTLINE} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11 }} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#76777d", fontSize: 11 }} tickFormatter={(value: number) => `$${value}`} width={55} />
                        <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === "ingresos" ? "Ingresos" : "Egresos"]} contentStyle={{ border: `1px solid ${OUTLINE}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(11,28,48,0.12)", fontSize: 12 }} labelStyle={{ color: ON_SURFACE, fontWeight: 600, marginBottom: 5 }} />
                        <Area type="monotone" dataKey="ingresos" stroke={ORANGE} strokeWidth={3} fill="url(#homeIncomeGradient)" activeDot={{ r: 5, fill: ORANGE, stroke: "white", strokeWidth: 2 }} dot={{ r: 3, fill: "white", stroke: ORANGE, strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="egresos" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={{ r: 4, fill: "#94a3b8" }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={ingresosVsEgresos} margin={{ top: 14, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke={OUTLINE} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: ON_SURFACE_VARIANT, fontSize: 11 }} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#76777d", fontSize: 11 }} tickFormatter={(value: number) => `$${value}`} width={55} />
                        <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === "ingresos" ? "Ingresos" : "Egresos"]} contentStyle={{ border: `1px solid ${OUTLINE}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(11,28,48,0.12)", fontSize: 12 }} labelStyle={{ color: ON_SURFACE, fontWeight: 600, marginBottom: 5 }} />
                        <Bar dataKey="ingresos" fill={ORANGE} radius={[5, 5, 0, 0]} maxBarSize={34} />
                        <Bar dataKey="egresos" fill="#94a3b8" radius={[5, 5, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : <div className="flex h-[270px] items-center justify-center rounded-lg text-sm" style={{ backgroundColor: SURFACE, color: ON_SURFACE_VARIANT }}>Sin datos de ingresos y egresos para este período</div>}
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Ocupación de cursos</h2><span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: "#e5eeff", color: ON_SURFACE_VARIANT }}>Período actual</span></div><p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Estado de inscripciones y cupos por curso</p></div>
                <button type="button" onClick={() => navigate("/cursos")} className="inline-flex items-center gap-1 self-start text-xs font-semibold hover:underline sm:self-auto" style={{ color: ORANGE }}>Ver todos los cursos <HugeiconsIcon icon={ArrowRight01Icon} size={15} /></button>
              </div>
              {ocupacionCursos.length === 0 ? <div className="rounded-lg px-4 py-10 text-center text-sm" style={{ backgroundColor: SURFACE_LOW, color: ON_SURFACE_VARIANT }}>Sin cursos registrados</div> : (
                <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6"><table className="w-full min-w-[560px] border-collapse text-left">
                  <thead><tr className="text-[10px] uppercase tracking-wider" style={{ backgroundColor: SURFACE_LOW, color: ON_SURFACE_VARIANT }}><th className="rounded-l-lg px-3 py-3 font-semibold">Curso</th><th className="px-3 py-3 font-semibold">Instructor</th><th className="min-w-[160px] px-3 py-3 font-semibold">Inscritos / aforo</th><th className="rounded-r-lg px-3 py-3 text-right font-semibold">Acción</th></tr></thead>
                  <tbody>{ocupacionCursos.map((course) => {
                    const ratio = course.capacity > 0 ? course.enrolled / course.capacity : 0
                    const status = getOccupancyStatus(ratio)
                    const initials = course.instructor.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
                    return <tr key={course.name} className="border-b transition-colors hover:bg-[#f8f9ff]" style={{ borderColor: "#e5eeff" }}>
                      <td className="px-3 py-3.5"><div className="flex items-center gap-2.5"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] text-[#45464d]"><HugeiconsIcon icon={BookOpenIcon} size={17} /></div><span className="max-w-[210px] truncate text-xs font-semibold">{course.name}</span></div></td>
                      <td className="px-3 py-3.5">{course.instructor && course.instructor !== "—" ? <div className="flex items-center gap-2 text-xs"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dce9ff] text-[9px] font-bold">{initials}</span><span className="max-w-[130px] truncate">{course.instructor}</span></div> : <span className="text-xs italic text-[#76777d]">Sin asignar</span>}</td>
                      <td className="px-3 py-3.5"><div className="flex flex-col gap-1.5"><div className="flex justify-between text-[10px]"><span className="font-semibold">{course.enrolled} <span className="font-normal text-[#45464d]">/ {course.capacity}</span></span><span style={{ color: status.color }}>{Math.round(ratio * 100)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#e5eeff]"><div className="h-full rounded-full" style={{ width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: ratio >= 0.7 ? "#4edea3" : ORANGE }} /></div></div></td>
                      <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => navigate("/cursos")} className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-semibold hover:underline" style={{ color: ORANGE }}>Ver detalle <HugeiconsIcon icon={ArrowRight01Icon} size={13} /></button></td>
                    </tr>
                  })}</tbody>
                </table></div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: ON_SURFACE_VARIANT }}><span>Mostrando {ocupacionCursos.length} {ocupacionCursos.length === 1 ? "curso" : "cursos"} consultados</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: ORANGE }} />{totals.lowCapacity} {totals.lowCapacity === 1 ? "curso con" : "cursos con"} vacantes prioritarias</span></div>
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-2 pb-4 sm:flex-row sm:items-center">
                <div><h2 className="text-lg font-semibold">Historial de pagos realizados</h2><p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Últimos movimientos de ingreso</p></div>
                <button type="button" onClick={() => navigate("/finanzas/movimientos")} className="inline-flex items-center gap-1 self-start text-xs font-semibold hover:underline sm:self-auto" style={{ color: ORANGE }}>Ver historial <HugeiconsIcon icon={ArrowRight01Icon} size={15} /></button>
              </div>
              {paymentsQuery.isLoading ? <div className="py-8 text-center text-sm" style={{ color: ON_SURFACE_VARIANT }}>Cargando pagos...</div> : recentPayments.length === 0 ? (
                <EmptyState icon={Wallet01Icon} title="Sin pagos registrados" description="Los pagos recibidos aparecerán aquí cuando se registren." />
              ) : (
                <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6"><table className="w-full min-w-[620px] border-collapse text-left">
                  <thead><tr className="text-[10px] uppercase tracking-wider" style={{ backgroundColor: SURFACE_LOW, color: ON_SURFACE_VARIANT }}><th className="rounded-l-lg px-3 py-3 font-semibold">Pagador</th><th className="px-3 py-3 font-semibold">Concepto</th><th className="px-3 py-3 font-semibold">Fecha</th><th className="px-3 py-3 font-semibold">Método</th><th className="rounded-r-lg px-3 py-3 text-right font-semibold">Monto</th></tr></thead>
                  <tbody>{recentPayments.map((payment: Record<string, unknown>) => {
                    const date = payment.fecha_pago ? new Intl.DateTimeFormat("es-EC", { timeZone: "America/Guayaquil", day: "2-digit", month: "short", year: "numeric" }).format(new Date(String(payment.fecha_pago))) : "—"
                    return <tr key={String(payment.id)} className="border-b last:border-b-0" style={{ borderColor: "#e5eeff" }}>
                      <td className="px-3 py-3 text-xs font-semibold">{String(payment.estudiante_nombre || "Cliente")}</td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-xs" style={{ color: ON_SURFACE_VARIANT }}>{String(payment.curso_nombre || payment.categoria_nombre || "Pago registrado")}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs" style={{ color: ON_SURFACE_VARIANT }}>{date}</td>
                      <td className="px-3 py-3 text-xs capitalize" style={{ color: ON_SURFACE_VARIANT }}>{String(payment.metodo_pago || "—").replaceAll("_", " ")}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-bold" style={{ color: GREEN }}>{formatCurrency(Number(payment.monto || 0))}</td>
                    </tr>
                  })}</tbody>
                </table></div>
              )}
            </article>
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            <article className="rounded-xl bg-white p-5 shadow-sm"><div className="pb-2"><h2 className="text-lg font-semibold">Accesos rápidos</h2><p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Acciones frecuentes de gestión</p></div>
              <div className="mt-3 grid grid-cols-2 gap-2">{quickActions.map(({ icon, label, description, path }) => <button key={label} type="button" onClick={() => navigate(path)} className="group flex min-h-[126px] flex-col items-start rounded-lg bg-[#eff4ff] p-3 text-left transition-all hover:bg-[#e5eeff] hover:shadow-sm">
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-white text-[#fd761a] shadow-sm transition-colors group-hover:bg-[#fd761a] group-hover:text-white"><HugeiconsIcon icon={icon} size={19} /></span><span className="text-xs font-semibold transition-colors group-hover:text-[#9d4300]">{label}</span><span className="mt-1 text-[10px] leading-tight" style={{ color: ON_SURFACE_VARIANT }}>{description}</span>
              </button>)}</div>
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-2 pb-2"><div><h2 className="text-lg font-semibold">Agenda del día</h2><p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Clases y sesiones programadas</p></div><span className="shrink-0 rounded bg-[#e5eeff] px-2 py-1 text-[10px] font-semibold">Hoy · {todayLabel}</span></div>
              {agendaDelDia.length === 0 ? <EmptyState icon={CalendarDaysIcon} title="Sin eventos hoy" description="No hay clases ni sesiones programadas para el día de hoy." actionLabel="Ver agenda" onAction={() => navigate("/agenda")} /> : <ul className="mt-2 divide-y divide-[#e5eeff]">{agendaDelDia.map((event) => <li key={event.id} className="flex items-start justify-between gap-2 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{event.titulo}</p><p className="mt-1 truncate text-[10px]" style={{ color: ON_SURFACE_VARIANT }}>{event.instructor_nombre || event.aula_nombre || "—"}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `color-mix(in srgb, ${event.color || ORANGE} 13%, white)`, color: event.color || ORANGE }}>{event.hora_inicio?.slice(0, 5) || "—"}</span><span className="text-[9px] uppercase tracking-wide" style={{ color: ON_SURFACE_VARIANT }}>{event.tipo_label || "Sesión"}</span></div></li>)}</ul>}
            </article>

            <article className="rounded-xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-2 pb-2"><div><h2 className="text-lg font-semibold">Actividad reciente</h2><p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Últimos registros del sistema</p></div><span title="Actividad recibida del sistema" className="mt-2 size-2 rounded-full bg-[#4edea3]" /></div>
              {actividadReciente.length === 0 ? <EmptyState icon={Clock5Icon} title="Sin actividad reciente" description="Los registros y solicitudes recientes aparecerán aquí." /> : <ul className="mt-2 divide-y divide-[#e5eeff]">{actividadReciente.flatMap((group) => group.items).slice(0, 5).map((item) => <li key={item.id} className="flex items-start gap-2.5 py-3"><span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: item.tipo === "curso" ? ORANGE : GREEN }} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.tipo === "curso" ? "Nueva solicitud de inscripción" : "Inscripción a taller"}</p><p className="mt-1 truncate text-[10px]" style={{ color: ON_SURFACE_VARIANT }}>{item.estudiante} · {item.curso}</p></div><span className="shrink-0 text-[10px]" style={{ color: ON_SURFACE_VARIANT }}>{item.hora}</span></li>)}</ul>}
            </article>

            <article className="flex items-center gap-3 rounded-xl bg-[#131b2e] p-4 text-white shadow-sm"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#ff9a52]"><HugeiconsIcon icon={Alert01Icon} size={21} /></div><div className="min-w-0"><p className="text-xs font-bold">Sugerencia de cobro</p><p className="mt-1 text-[11px] leading-4 text-[#bec6e0]">{kpis.pagosPendientes > 0 ? `Hay un saldo pendiente de ${formatCurrency(kpis.pagosPendientes)} para revisar.` : "No hay saldo pendiente por cobrar en este momento."}</p></div></article>
          </aside>
        </section>
      </div>
    </div>
  )
}
