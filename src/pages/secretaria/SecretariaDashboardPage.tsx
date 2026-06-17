import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  GraduationCapIcon,
  ArrowRight01Icon,
  AddCircleIcon,
  Wallet01Icon,
  UserAdd01Icon,
  Microphone,
  AiFolderIcon,
  CertificateIcon,
  UserGroupIcon,
  CalendarIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { secretariaService, type DashboardData } from "@/services/secretaria.service"
import { useNavigate } from "react-router"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function getOccupancyColor(ratio: number) {
  if (ratio >= 0.85) return { color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.12)" }
  if (ratio >= 0.7) return { color: ACCENT, bg: `${ACCENT}15` }
  if (ratio >= 0.4) return { color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" }
  return { color: "oklch(0.55 0.1 260)", bg: "oklch(0.55 0.1 260 / 0.1)" }
}

export function SecretariaDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const quickActions = [
    { icon: UserAdd01Icon, label: "Nuevo estudiante", path: "/secretaria/estudiantes" },
    { icon: Wallet01Icon, label: "Registrar pago", path: "/secretaria/pagos" },
    { icon: AddCircleIcon, label: "Nueva matrícula", path: "/secretaria/cursos" },
    { icon: CertificateIcon, label: "Emitir certificado", path: "/secretaria/certificados" },
  ]

  const servicios = [
    {
      label: "Reservas Podcast",
      value: data?.estado_servicios?.podcast_activas ?? 0,
      icon: Microphone,
      color: "oklch(0.62 0.16 245)",
      path: "/secretaria/podcast",
    },
    {
      label: "Edición de Video",
      value: data?.estado_servicios?.edicion_pendientes ?? 0,
      icon: VideoIcon,
      color: "oklch(0.58 0.16 145)",
      path: "/secretaria/edicion-video",
    },
    {
      label: "Alquileres Activos",
      value: data?.estado_servicios?.alquileres_activos ?? 0,
      icon: AiFolderIcon,
      color: ACCENT,
      path: "/secretaria/alquileres",
    },
  ]

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
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Panel de Secretaría</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Resumen operativo del día</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article
            className="group relative overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] cursor-pointer"
            style={{ borderColor: BORDER }}
            onClick={() => navigate("/secretaria/pagos")}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>Pagos pendientes</span>
              <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
                <HugeiconsIcon icon={Wallet01Icon} size={18} style={{ color: "oklch(0.55 0.18 15)" }} />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: CHARCOAL }}>
              {data?.pagos_pendientes_hoy ?? 0}
            </p>
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>Cuentas por cobrar hoy</p>
          </article>

          {servicios.map(({ label, value, icon, color, path }) => (
            <article
              key={label}
              className="group relative overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] cursor-pointer"
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
              <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                {label === "Reservas Podcast" ? "Activas en estudio" : label === "Edición de Video" ? "Pendientes de entrega" : "Equipos en préstamo"}
              </p>
            </article>
          ))}
        </section>

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
                  {(data?.cursos_con_cupo ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <HugeiconsIcon icon={GraduationCapIcon} size={22} style={{ color: "oklch(0.8 0 0)" }} />
                          <p className="text-sm" style={{ color: MUTED }}>No hay cursos con cupo disponible</p>
                        </div>
                      </td>
                    </tr>
                  ) : (data?.cursos_con_cupo ?? []).slice(0, 5).map((curso) => {
                    const ratio = curso.inscritos / Math.max(curso.capacidad, 1)
                    const occupancy = getOccupancyColor(ratio)
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
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: occupancy.color }} />
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

          <div className="flex flex-col gap-5">
            <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <HugeiconsIcon icon={CalendarIcon} size={15} style={{ color: ACCENT }} />
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Acciones rápidas</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ icon, label, path }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-center transition-all duration-200 hover:border-[--hover] active:scale-[0.97]"
                      style={{ borderColor: BORDER, "--hover": ACCENT } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${ACCENT}12` }}>
                        <HugeiconsIcon icon={icon} size={17} style={{ color: ACCENT }} />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight" style={{ color: CHARCOAL }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-xl border bg-white overflow-hidden flex-1" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <div className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={UserGroupIcon} size={15} style={{ color: ACCENT }} />
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Matrículas recientes</h2>
                </div>
                <button
                  onClick={() => navigate("/secretaria/cursos")}
                  className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 hover:gap-1.5"
                  style={{ color: ACCENT }}
                >
                  Ver <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                </button>
              </div>
              <ul className="divide-y" style={{ borderColor: "oklch(0.9 0 0)" }}>
                {(data?.matriculas_recientes ?? []).length === 0 ? (
                  <li className="px-5 py-10 text-center">
                    <HugeiconsIcon icon={UserGroupIcon} size={22} style={{ color: "oklch(0.8 0 0)" }} />
                    <p className="text-sm mt-2" style={{ color: MUTED }}>Sin matrículas recientes</p>
                  </li>
                ) : (data?.matriculas_recientes ?? []).slice(0, 6).map((m) => (
                  <li key={m.id} className="px-5 py-3 hover:bg-gray-50/40 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex-none flex items-center justify-center size-8 rounded-full text-xs font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                        {m.estudiante_nombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>{m.estudiante_nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{m.curso}</p>
                      </div>
                      <span className="flex-none text-[11px]" style={{ color: MUTED }}>{formatDate(m.fecha)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
