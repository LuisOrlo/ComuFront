import { useMemo } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Calendar03Icon,
  UserGroupIcon,
  Time03Icon,
  Location01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  Alert01Icon,
  GraduationCapIcon,
  TaskEdit01Icon,
  CheckmarkCircle02Icon,
  SunCloudIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { useAuth } from "@/context/AuthContext"
import { useInstructorDashboardData } from "@/hooks/useInstructorDashboardData"
import type { ClaseConCurso, CursoActivoConData } from "@/hooks/useInstructorDashboardData"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function ClaseCard({
  clase,
  showCurso,
  acciones,
}: {
  clase: ClaseConCurso
  showCurso?: boolean
  acciones?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border bg-white p-4 transition-all duration-200 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showCurso && (
            <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>
              {clase.cursoNombre}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
              <HugeiconsIcon icon={Calendar03Icon} size={14} />
              <span>
                {new Date(clase.fecha + "T" + (clase.horaInicio || "00:00")).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
              <HugeiconsIcon icon={Time03Icon} size={14} />
              <span>
                {clase.horaInicio || "—"} {clase.horaFin ? `- ${clase.horaFin}` : ""}
              </span>
            </div>
          </div>
        </div>
        {acciones && <div className="flex-none shrink-0">{acciones}</div>}
      </div>
    </div>
  )
}

function CursoCard({ curso }: { curso: CursoActivoConData }) {
  return (
    <div
      className="rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]"
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center size-10 rounded-xl shrink-0"
            style={{ backgroundColor: `${ACCENT}14` }}
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={20} style={{ color: ACCENT }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold leading-tight truncate" style={{ color: CHARCOAL }}>
              {curso.nombre}
            </h3>
            {curso.catalogoNombre && (
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                {curso.catalogoNombre}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mb-4" style={{ color: MUTED }}>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Calendar03Icon} size={13} />
          {curso.periodo}
        </span>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Location01Icon} size={13} />
          {curso.ciudad || "Sin ciudad"}
        </span>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={UserGroupIcon} size={13} />
          {curso.estudiantesCount} estudiantes
        </span>
      </div>

      {curso.moduloActual && (
        <p className="text-[11px] font-medium mb-2" style={{ color: MUTED }}>
          Módulo actual: <span style={{ color: CHARCOAL }}>{curso.moduloActual}</span>
        </p>
      )}

      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: MUTED }}>Progreso del curso</span>
          <span className="font-semibold" style={{ color: CHARCOAL }}>
            {curso.progreso}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${curso.progreso}%`,
              backgroundColor: curso.progreso >= 80 ? "oklch(0.58 0.16 145)" : curso.progreso >= 40 ? ACCENT : MUTED,
            }}
          />
        </div>
        <p className="text-[10px]" style={{ color: MUTED }}>
          {curso.clasesRealizadas} de {curso.totalClases} clases
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/instructor/cursos/${curso.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 active:scale-[0.97]"
          style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
        >
          Ver curso
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
        </Link>
        <Link
          to={`/instructor/estudiantes`}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 active:scale-[0.97]"
          style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)", color: "oklch(0.62 0.16 245)" }}
        >
          <HugeiconsIcon icon={UserGroupIcon} size={14} />
          Estudiantes
        </Link>
      </div>
    </div>
  )
}

export function InstructorDashboardPage() {
  const { user } = useAuth()
  const { data, loading } = useInstructorDashboardData()

  const nombreInstructor = useMemo(() => {
    if (!user?.persona) return user?.username || "Instructor"
    const p = user.persona as Record<string, unknown>
    return `${p.nombres || ""} ${p.apellidos || ""}`.trim() || user.username || "Instructor"
  }, [user])

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div className="text-center">
          <div className="animate-spin size-8 border-2 rounded-full mx-auto mb-4" style={{ borderColor: `${ACCENT} ${ACCENT} transparent transparent` }} />
          <p className="text-sm font-medium" style={{ color: MUTED }}>Cargando tu dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ backgroundColor: `${ACCENT}12` }}>
            <HugeiconsIcon icon={BookOpen01Icon} size={28} style={{ color: ACCENT }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: CHARCOAL }}>
            Bienvenido, {nombreInstructor}
          </h2>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Aún no tienes cursos asignados. Cuando te asignen uno, verás aquí tu resumen personal.
          </p>
        </div>
      </div>
    )
  }

  const tieneClasesHoy = data.clasesHoy.length > 0

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-5" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
            Hola, {nombreInstructor}
          </h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: MUTED }}>
            {data.fechaActual}
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}>
          Instructor
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-w-6xl">
        {/* Quick stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: BookOpen01Icon, label: "Cursos activos", value: data.cursosActivosCount, color: ACCENT },
            { icon: Calendar03Icon, label: "Clases esta semana", value: data.clasesSemanaCount, color: "oklch(0.62 0.16 245)" },
            { icon: UserGroupIcon, label: "Total estudiantes", value: data.totalEstudiantes, color: "oklch(0.58 0.16 145)" },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border bg-white p-5 transition-shadow hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                  {label}
                </span>
                <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                  <HugeiconsIcon icon={icon} size={17} style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-bold tracking-tight" style={{ color: CHARCOAL }}>
                {value}
              </p>
            </div>
          ))}
        </section>

        {/* Today's agenda */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                <HugeiconsIcon icon={Clock01Icon} size={16} style={{ color: ACCENT }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>
                Agenda del día
              </h2>
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md"
              style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
            >
              Hoy
            </span>
          </div>

          <div className="space-y-2.5">
            {tieneClasesHoy ? (
              data.clasesHoy.map((clase) => (
                <ClaseCard
                  key={clase.id}
                  clase={clase}
                  showCurso
                  acciones={
                    <Link
                      to={`/instructor/asistencia/${clase.cursoId}/${clase.id}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
                      style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                      Tomar asistencia
                    </Link>
                  }
                />
              ))
            ) : (
              <div className="rounded-xl border bg-white p-6 text-center" style={{ borderColor: BORDER }}>
                <div className="flex items-center justify-center size-12 rounded-xl mx-auto mb-3" style={{ backgroundColor: `${ACCENT}10` }}>
                  <HugeiconsIcon icon={SunCloudIcon} size={24} style={{ color: ACCENT }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: CHARCOAL }}>
                  Sin clases por hoy
                </p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  Disfruta tu día libre
                </p>
                {data.proximaClase && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: MUTED }}>
                      Próxima clase
                    </p>
                    <ClaseCard clase={data.proximaClase} showCurso />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Active courses */}
        {data.cursosActivos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
                <HugeiconsIcon icon={GraduationCapIcon} size={16} style={{ color: ACCENT }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>
                Mis cursos activos
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.cursosActivos.map((curso) => (
                <CursoCard key={curso.id} curso={curso} />
              ))}
            </div>
          </section>
        )}

        {/* Pending weekly classes */}
        {data.clasesPendientesSemana.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex items-center justify-center size-8 rounded-lg"
                style={{
                  backgroundColor: data.clasesPendientesSemana.some((c) => c.vencida)
                    ? "oklch(0.55 0.18 15 / 0.1)"
                    : `${ACCENT}15`,
                }}
              >
                <HugeiconsIcon
                  icon={Alert01Icon}
                  size={16}
                  style={{
                    color: data.clasesPendientesSemana.some((c) => c.vencida)
                      ? "oklch(0.55 0.18 15)"
                      : ACCENT,
                  }}
                />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>
                Clases pendientes de la semana
              </h2>
            </div>
            <div className="space-y-2">
              {data.clasesPendientesSemana.map((clase) => (
                <div
                  key={clase.id}
                  className="rounded-xl border bg-white p-4 transition-all duration-200 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
                  style={{
                    borderColor: clase.vencida ? "oklch(0.55 0.18 15 / 0.3)" : BORDER,
                    borderLeftWidth: clase.vencida ? 3 : 1,
                    borderLeftColor: clase.vencida ? "oklch(0.55 0.18 15)" : BORDER,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {clase.vencida && (
                          <span
                            className="flex-none text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.12)", color: "oklch(0.55 0.18 15)" }}
                          >
                            PENDIENTE
                          </span>
                        )}
                        <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>
                          {clase.cursoNombre}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                          <HugeiconsIcon icon={Calendar03Icon} size={13} />
                          {new Date(clase.fecha + "T" + (clase.horaInicio || "00:00")).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                          <HugeiconsIcon icon={Time03Icon} size={13} />
                          {clase.horaInicio || "—"}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/instructor/asistencia/${clase.cursoId}/${clase.id}`}
                      className="flex-none inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
                      style={{ backgroundColor: `${ACCENT}12`, color: ACCENT }}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                      Registrar asistencia
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending observations */}
        {data.observacionesPendientes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
                <HugeiconsIcon icon={TaskEdit01Icon} size={16} style={{ color: "oklch(0.62 0.14 85)" }} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: CHARCOAL }}>
                Observaciones pendientes
              </h2>
            </div>
            <div className="space-y-2">
              {data.observacionesPendientes.map((clase) => (
                <div
                  key={clase.id}
                  className="rounded-xl border bg-white p-4 transition-all duration-200 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
                  style={{ borderColor: BORDER }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: CHARCOAL }}>
                        {clase.cursoNombre}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                        {new Date(clase.fecha + "T" + (clase.horaInicio || "00:00")).toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                        {" — "}
                        {clase.moduloNombre}
                      </p>
                    </div>
                    <Link
                      to={`/instructor/cursos/${clase.cursoId}`}
                      className="flex-none inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
                      style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)", color: "oklch(0.62 0.14 85)" }}
                    >
                      <HugeiconsIcon icon={TaskEdit01Icon} size={13} />
                      Registrar observación
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
