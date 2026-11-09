import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  AddCircleIcon,
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
import { Building2, GraduationCap, Clapperboard, DoorClosed, Mic, Camera, Radio, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

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

function getServiceIconLucide(tipo: string) {
  const t = tipo.toLowerCase()
  if (t.includes("aula") || t.includes("espacio")) return DoorClosed
  if (t.includes("podcast")) return Mic
  if (t.includes("radio")) return Radio
  if (t.includes("equipo") || t.includes("cámara") || t.includes("camara")) return Camera
  return Layers
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
  const [unidadNegocio, setUnidadNegocio] = useState<"todos" | "academia" | "servicios">("todos")
  const {
    kpis, ingresosVsEgresos, ocupacionCursos, agendaDelDia, actividadReciente, actividadServicios, loading,
  } = useDashboardData(unidadNegocio)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const paymentsQuery = useQuery({
    queryKey: ["dashboard", "historial-pagos", unidadNegocio],
    queryFn: () =>
      financeService.getHistorial({
        page: 1,
        per_page: 5,
        tipo_movimiento: "ingreso",
        ...(unidadNegocio !== "todos" ? { unidad_negocio: unidadNegocio } : {}),
      }),
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

  const statCards = useMemo(() => {
    if (unidadNegocio === "academia") {
      return [
        {
          icon: DollarCircleIcon,
          label: "Ingresos Academia",
          value: formatCurrency(kpis.ingresosDelMes),
          color: GREEN,
          bg: "#d5f5e5",
          detail: "Cursos, talleres y matrículas",
          foot: monthLabel,
        },
        {
          icon: UserGroupIcon,
          label: "Matrículas activas",
          value: String(kpis.matriculasActivas),
          color: "#9d4300",
          bg: "#ffdbca",
          detail: "Alumnos vigentes en formación",
          foot: "Ciclo actual",
        },
        {
          icon: VideoIcon,
          label: "Cursos en progreso",
          value: String(kpis.cursosEnProgreso),
          color: ON_SURFACE,
          bg: "#dce9ff",
          detail: `${ocupacionCursos.length} cursos cargados`,
          foot: `${totals.occupancy}% de aforo ocupado`,
        },
      ]
    }

    if (unidadNegocio === "servicios") {
      return [
        {
          icon: DollarCircleIcon,
          label: "Ingresos Servicios",
          value: formatCurrency(kpis.ingresosDelMes),
          color: GREEN,
          bg: "#d5f5e5",
          detail: "Productora & servicios comerciales",
          foot: monthLabel,
        },
        {
          icon: UserGroupIcon,
          label: "Clientes de servicios",
          value: String(kpis.clientesServicios),
          color: "#0284c7",
          bg: "#e0f2fe",
          detail: "Empresas y clientes atendidos",
          foot: "Facturación directa",
        },
        {
          icon: VideoIcon,
          label: "Servicios ejecutados",
          value: String(kpis.totalServicios),
          color: ON_SURFACE,
          bg: "#dce9ff",
          detail: "Proyectos y contratos",
          foot: "Historial registrado",
        },
      ]
    }

    return [
      {
        icon: DollarCircleIcon,
        label: "Ingresos del mes",
        value: formatCurrency(kpis.ingresosDelMes),
        color: GREEN,
        bg: "#d5f5e5",
        detail: "Ingresos consolidados",
        foot: monthLabel,
      },
      {
        icon: UserGroupIcon,
        label: "Alumnos y clientes",
        value: String(kpis.matriculasActivas + kpis.clientesServicios),
        color: "#9d4300",
        bg: "#ffdbca",
        detail: `${kpis.matriculasActivas} alumnos · ${kpis.clientesServicios} clientes`,
        foot: "Comunidad activa",
      },
      {
        icon: VideoIcon,
        label: "Operaciones activas",
        value: String(kpis.cursosEnProgreso + kpis.totalServicios),
        color: ON_SURFACE,
        bg: "#dce9ff",
        detail: `${kpis.cursosEnProgreso} cursos · ${kpis.totalServicios} servicios`,
        foot: `${totals.occupancy}% ocupación formativa`,
      },
    ]
  }, [unidadNegocio, kpis, monthLabel, ocupacionCursos.length, totals.occupancy])
  const quickActions = useMemo(() => {
    if (unidadNegocio === "servicios") {
      return [
        { icon: Wallet01Icon, label: "Registrar pago", description: "Cobro o anticipo", path: "/finanzas/pagos" },
        { icon: VideoIcon, label: "Cuentas servicios", description: "Cobros pendientes", path: "/finanzas/pagos/servicios" },
        { icon: AddCircleIcon, label: "Historial pagos", description: "Ver movimientos", path: "/finanzas/movimientos" },
        { icon: CalendarIcon, label: "Ver agenda", description: "Disponibilidad", path: "/agenda" },
      ]
    }
    return [
      { icon: UserAdd01Icon, label: "Nueva matrícula", description: "Inscribir alumno", path: "/estudiantes" },
      { icon: Wallet01Icon, label: "Registrar pago", description: "Recibo o arancel", path: "/finanzas/pagos" },
      { icon: AddCircleIcon, label: "Agregar curso", description: "Nuevo curso", path: "/cursos/nuevo" },
      { icon: CalendarIcon, label: "Ver agenda", description: "Horarios y aulas", path: "/agenda" },
    ]
  }, [unidadNegocio])

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

        {/* Macro-Tabs: Unidad de Negocio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setUnidadNegocio("todos")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                unidadNegocio === "todos"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              )}
            >
              <Building2 size={15} />
              <span>Consolidado</span>
            </button>

            <button
              type="button"
              onClick={() => setUnidadNegocio("academia")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                unidadNegocio === "academia"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              )}
            >
              <GraduationCap size={15} />
              <span>Academia & Formación</span>
            </button>

            <button
              type="button"
              onClick={() => setUnidadNegocio("servicios")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                unidadNegocio === "servicios"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              )}
            >
              <Clapperboard size={15} />
              <span>Servicios & Productora</span>
            </button>
          </div>

          <p className="text-xs font-medium" style={{ color: ON_SURFACE_VARIANT }}>
            {unidadNegocio === "academia"
              ? "Filtrando indicadores e ingresos de cursos y talleres"
              : unidadNegocio === "servicios"
              ? "Filtrando indicadores de servicios comerciales y productora"
              : "Vista general integrada de toda la institución"}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Indicadores principales">
          {statCards.map(({ icon, label, value, color, bg, detail, foot }) => (
            <article key={label} className="flex min-h-[150px] flex-col justify-between rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: ON_SURFACE_VARIANT }}>{label}</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <p className="text-3xl font-bold leading-tight tracking-tight">{value}</p>
                  </div>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: bg, color }}><HugeiconsIcon icon={icon} size={23} /></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "#e5eeff" }}>
                <span className="text-[11px]" style={{ color: ON_SURFACE_VARIANT }}>{detail}</span>
                <span className="text-[10px] font-medium" style={{ color: ON_SURFACE_VARIANT }}>{foot}</span>
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
                    <h2 className="text-lg font-semibold">
                      {unidadNegocio === "academia"
                        ? "Ingresos y egresos — Academia"
                        : unidadNegocio === "servicios"
                        ? "Ingresos y egresos — Servicios & Productora"
                        : "Ingresos y egresos"}
                    </h2>
                    <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: "#e5eeff", color: ON_SURFACE_VARIANT }}>Últimos {ingresosVsEgresos.length} meses</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>
                    {unidadNegocio === "academia"
                      ? "Comparativa mensual de ingresos formativos y egresos"
                      : unidadNegocio === "servicios"
                      ? "Comparativa mensual de ingresos comerciales de productora y egresos"
                      : "Comparativa mensual del balance operativo"}
                  </p>
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
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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

            {unidadNegocio === "servicios" ? (
              <article className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">Rendimiento de servicios y productora</h2>
                      <span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: "#e5eeff", color: ON_SURFACE_VARIANT }}>
                        {monthLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>
                      Ingresos y volumen por tipo de servicio comercial y alquileres
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/finanzas/pagos/servicios")}
                    className="inline-flex items-center gap-1 self-start text-xs font-semibold hover:underline sm:self-auto cursor-pointer"
                    style={{ color: ORANGE }}
                  >
                    Ver cuentas por cobrar <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                  </button>
                </div>

                {actividadServicios.length === 0 ? (
                  <EmptyState
                    icon={VideoIcon}
                    title="Sin actividad de servicios en el período"
                    description="Los contratos de alquiler de sets, aulas, podcast, radio, streaming o edición aparecerán aquí al registrarse."
                    actionLabel="Registrar cobro"
                    onAction={() => navigate("/finanzas/pagos")}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider" style={{ backgroundColor: SURFACE_LOW, color: ON_SURFACE_VARIANT }}>
                          <th className="rounded-l-lg px-3 py-3 font-semibold">Línea de servicio</th>
                          <th className="px-3 py-3 font-semibold text-center w-[160px]">Contratos / Reservas</th>
                          <th className="px-3 py-3 font-semibold text-right w-[160px]">Ingresos generados</th>
                          <th className="rounded-r-lg px-3 py-3 text-right font-semibold w-[110px]">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actividadServicios.map((s) => {
                          const IconComp = getServiceIconLucide(s.tipo)
                          return (
                            <tr key={s.tipo} className="border-b transition-colors hover:bg-[#f8f9ff]" style={{ borderColor: "#e5eeff" }}>
                              <td className="px-3 py-3.5 align-middle">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] text-[#45464d]">
                                    <IconComp size={16} />
                                  </div>
                                  <span className="text-xs font-semibold leading-snug">
                                    {s.tipo}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-center align-middle">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                  {s.cantidad} {s.cantidad === 1 ? "servicio" : "servicios"}
                                </span>
                              </td>
                              <td className="px-3 py-3.5 text-right align-middle font-bold text-xs" style={{ color: GREEN }}>
                                {formatCurrency(Number(s.ingresos || 0))}
                              </td>
                              <td className="px-3 py-3.5 text-right align-middle">
                                <button
                                  type="button"
                                  onClick={() => navigate("/finanzas/movimientos")}
                                  className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-semibold hover:underline cursor-pointer"
                                  style={{ color: ORANGE }}
                                >
                                  Detalle <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: ON_SURFACE_VARIANT }}>
                  <span>Mostrando {actividadServicios.length} {actividadServicios.length === 1 ? "categoría de servicio" : "categorías de servicios"}</span>
                  <span className="font-semibold text-slate-700">
                    Total ingresado: {formatCurrency(kpis.ingresosDelMes)}
                  </span>
                </div>
              </article>
            ) : (
              <article className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Ocupación de cursos</h2><span className="rounded px-2 py-1 text-[10px] font-medium" style={{ backgroundColor: "#e5eeff", color: ON_SURFACE_VARIANT }}>Período actual</span></div><p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Estado de inscripciones y cupos por curso</p></div>
                  <button type="button" onClick={() => navigate("/cursos")} className="inline-flex items-center gap-1 self-start text-xs font-semibold hover:underline sm:self-auto" style={{ color: ORANGE }}>Ver todos los cursos <HugeiconsIcon icon={ArrowRight01Icon} size={15} /></button>
                </div>
                {ocupacionCursos.length === 0 ? <div className="rounded-lg px-4 py-10 text-center text-sm" style={{ backgroundColor: SURFACE_LOW, color: ON_SURFACE_VARIANT }}>Sin cursos registrados</div> : (
                  <div className="overflow-x-auto"><table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider" style={{ backgroundColor: SURFACE_LOW, color: ON_SURFACE_VARIANT }}>
                        <th className="rounded-l-lg px-3 py-3 font-semibold">Curso</th>
                        <th className="px-3 py-3 font-semibold">Instructor</th>
                        <th className="w-[140px] px-3 py-3 font-semibold">Inscritos / aforo</th>
                        <th className="rounded-r-lg px-3 py-3 text-right font-semibold w-[90px]">Acción</th>
                      </tr>
                    </thead>
                    <tbody>{ocupacionCursos.map((course) => {
                      const ratio = course.capacity > 0 ? course.enrolled / course.capacity : 0
                      const status = getOccupancyStatus(ratio)
                      const initials = course.instructor.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
                      return <tr key={course.id} className="border-b transition-colors hover:bg-[#f8f9ff]" style={{ borderColor: "#e5eeff" }}>
                        <td className="px-3 py-3.5 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff] text-[#45464d] mt-0.5">
                              <HugeiconsIcon icon={BookOpenIcon} size={17} />
                            </div>
                            <span className="text-xs font-semibold leading-snug break-words">
                              {course.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          {course.instructor && course.instructor !== "—" ? (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dce9ff] text-[9px] font-bold mt-0.5">
                                {initials}
                              </span>
                              <span className="text-xs leading-snug break-words">
                                {course.instructor}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs italic text-[#76777d]">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-semibold">{course.enrolled} <span className="font-normal text-[#45464d]">/ {course.capacity}</span></span>
                              <span style={{ color: status.color }}>{Math.round(ratio * 100)}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#e5eeff]">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: ratio >= 0.7 ? "#4edea3" : ORANGE }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right align-top">
                          <button type="button" onClick={() => navigate(`/cursos/${course.id}`)} className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-semibold hover:underline cursor-pointer" style={{ color: ORANGE }}>
                            Ver detalle <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                          </button>
                        </td>
                      </tr>
                    })}</tbody>
                  </table></div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]" style={{ color: ON_SURFACE_VARIANT }}><span>Mostrando {ocupacionCursos.length} {ocupacionCursos.length === 1 ? "curso" : "cursos"} consultados</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: ORANGE }} />{totals.lowCapacity} {totals.lowCapacity === 1 ? "curso con" : "cursos con"} vacantes prioritarias</span></div>
              </article>
            )}

            <article className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-2 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    {unidadNegocio === "academia"
                      ? "Historial de pagos — Academia"
                      : unidadNegocio === "servicios"
                      ? "Historial de pagos — Servicios & Productora"
                      : "Historial de pagos realizados"}
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>
                    {unidadNegocio === "academia"
                      ? "Últimos ingresos por matrículas y cuotas"
                      : unidadNegocio === "servicios"
                      ? "Últimos ingresos por servicios y producción comercial"
                      : "Últimos movimientos de ingreso"}
                  </p>
                </div>
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

            <article className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 pb-2">
                <div>
                  <h2 className="text-lg font-semibold">Actividad reciente</h2>
                  <p className="mt-1 text-xs" style={{ color: ON_SURFACE_VARIANT }}>Últimos registros del sistema</p>
                </div>
                <span title="Actividad recibida del sistema" className="mt-2 size-2 rounded-full bg-[#4edea3]" />
              </div>
              {actividadReciente.length === 0 ? (
                <EmptyState icon={Clock5Icon} title="Sin actividad reciente" description="Los registros y solicitudes recientes aparecerán aquí." />
              ) : (
                <ul className="mt-2 divide-y divide-[#e5eeff]">
                  {actividadReciente.flatMap((group) => group.items).slice(0, 5).map((item) => {
                    const isMatricula = item.subtipo === "matricula"
                    const isTaller = item.tipo === "taller"
                    const badgeColor = isMatricula ? GREEN : isTaller ? "#7c3aed" : ORANGE
                    const titulo = item.titulo || (isMatricula ? "Nueva matrícula" : isTaller ? "Inscripción a taller" : "Nueva solicitud de inscripción")
                    return (
                      <li
                        key={item.id}
                        onClick={() => navigate(isMatricula ? "/estudiantes" : `/matriculas?tab=${isTaller ? "talleres" : "cursos"}&id=${item.id}`)}
                        className="flex items-start gap-2.5 py-3 transition-colors hover:bg-[#f8f9ff] rounded-lg px-2 -mx-2 cursor-pointer"
                        title="Ver detalle del registro"
                      >
                        <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: badgeColor }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{titulo}</p>
                          <p className="mt-1 truncate text-[10px]" style={{ color: ON_SURFACE_VARIANT }}>
                            {item.estudiante} · {item.curso}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium" style={{ color: ON_SURFACE_VARIANT }}>{item.hora}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>

            
          </aside>
        </section>
      </div>
    </div>
  )
}
