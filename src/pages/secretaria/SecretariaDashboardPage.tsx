import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  VideoIcon,
  GraduationCapIcon,
  DollarCircleIcon,
  ArrowRight01Icon,
  AddCircleIcon,
  Wallet01Icon,
  UserAdd01Icon,
  Microphone,
  AiFolderIcon,
  CertificateIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type DashboardData } from "@/services/secretaria.service"
import { useNavigate } from "react-router"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function getOccupancyStatus(ratio: number) {
  if (ratio >= 0.85) return { label: "Critico", color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.12)" }
  if (ratio >= 0.7) return { label: "Optimo", color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.12)" }
  if (ratio >= 0.4) return { label: "Medio", color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" }
  return { label: "Bajo", color: MUTED, bg: "oklch(0.85 0 0 / 0.5)" }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} />
      </div>
    )
  }

  const quickActions = [
    { icon: UserAdd01Icon, label: "Nuevo estudiante", path: "/secretaria/estudiantes" },
    { icon: Wallet01Icon, label: "Registrar pago", path: "/secretaria/pagos" },
    { icon: AddCircleIcon, label: "Nueva matrícula", path: "/secretaria/cursos" },
    { icon: CertificateIcon, label: "Emitir certificado", path: "/secretaria/certificados" },
  ]

  const servicios = [
    { label: "Reservas Podcast", value: data?.estado_servicios.podcast_activas ?? 0, icon: Microphone, color: "oklch(0.62 0.16 245)" },
    { label: "Edición Video", value: data?.estado_servicios.edicion_pendientes ?? 0, icon: VideoIcon, color: "oklch(0.58 0.16 145)" },
    { label: "Alquileres Activos", value: data?.estado_servicios.alquileres_activos ?? 0, icon: AiFolderIcon, color: ACCENT },
  ]

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Panel de Secretaria</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Tareas operativas del día</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="group relative overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]" style={{ borderColor: BORDER }}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pagos pendientes hoy</span>
                <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
                  <HugeiconsIcon icon={DollarCircleIcon} size={18} style={{ color: "oklch(0.55 0.18 15)" }} />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{data?.pagos_pendientes_hoy ?? 0}</p>
            </div>
          </article>

          {servicios.map(({ label, value, icon, color }) => (
            <article key={label} className="group relative overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]" style={{ borderColor: BORDER }}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>{label}</span>
                  <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <HugeiconsIcon icon={icon} size={18} style={{ color }} />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{value}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                  <HugeiconsIcon icon={GraduationCapIcon} size={16} style={{ color: ACCENT }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Cursos con cupo disponible</h2>
                  <p className="text-xs" style={{ color: MUTED }}>Próximas inscripciones</p>
                </div>
              </div>
              <button onClick={() => navigate("/secretaria/cursos")} className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70" style={{ color: ACCENT }}>
                Ver todos <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inscritos</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Disponibles</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.cursos_con_cupo ?? []).length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: MUTED }}>No hay cursos con cupo disponible</td></tr>
                  ) : (data?.cursos_con_cupo ?? []).slice(0, 5).map((curso) => {
                    const ratio = curso.inscritos / curso.capacidad
                    const occupancy = getOccupancyStatus(ratio)
                    return (
                      <tr key={curso.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-5 py-3.5"><p className="text-sm font-medium" style={{ color: CHARCOAL }}>{curso.nombre}</p></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${BORDER}` }}>
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: occupancy.color }} />
                            </div>
                            <span className="text-xs font-medium flex-none" style={{ color: CHARCOAL }}>{curso.inscritos}/{curso.capacidad}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
                            {curso.disponibles}
                          </span>
                        </td>
                        <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{curso.fecha_inicio}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
              <div className="px-5 py-4">
                <h2 className="text-sm font-semibold mb-3" style={{ color: CHARCOAL }}>Accesos rápidos</h2>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(({ icon, label, path }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 hover:border-[--hover] active:scale-[0.97]"
                      style={{ borderColor: BORDER, "--hover": ACCENT } as React.CSSProperties}
                    >
                      <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${ACCENT}12` }}>
                        <HugeiconsIcon icon={icon} size={17} style={{ color: ACCENT }} />
                      </div>
                      <span className="text-[11px] font-medium leading-tight" style={{ color: CHARCOAL }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER }}>
                <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Matrículas recientes</h2>
                <button onClick={() => navigate("/secretaria/cursos")} className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70" style={{ color: ACCENT }}>
                  Ver <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                </button>
              </div>
              <ul className="divide-y divide-[oklch(0.85_0_0)]">
                {(data?.matriculas_recientes ?? []).length === 0 ? (
                  <li className="px-5 py-8 text-center text-sm" style={{ color: MUTED }}>Sin matrículas recientes</li>
                ) : (data?.matriculas_recientes ?? []).slice(0, 5).map((m) => (
                  <li key={m.id} className="px-5 py-3 hover:bg-gray-50/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-none flex items-center justify-center size-7 rounded-full text-xs font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                        {m.estudiante_nombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: CHARCOAL }}>{m.estudiante_nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{m.curso}</p>
                      </div>
                      <span className="flex-none text-[11px]" style={{ color: MUTED }}>{m.fecha}</span>
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
