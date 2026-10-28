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
  CheckmarkCircle02Icon,
  SunCloudIcon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/context/AuthContext"
import { useInstructorDashboardData } from "@/hooks/useInstructorDashboardData"
import type { ClaseConCurso, CursoActivoConData } from "@/hooks/useInstructorDashboardData"

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
    <div className="w-full min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-4.5 transition-all duration-200 hover:shadow-xs hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showCurso && (
            <p className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2 break-words">
              {clase.cursoNombre}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-400 shrink-0" />
              <span className="capitalize">
                {new Date(clase.fecha + "T" + (clase.horaInicio || "00:00")).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <HugeiconsIcon icon={Time03Icon} size={14} className="text-slate-400 shrink-0" />
              <span>
                {clase.horaInicio || "—"} {clase.horaFin ? `- ${clase.horaFin}` : ""}
              </span>
            </span>
            {clase.moduloNombre && (
              <span className="text-slate-500 text-[11px] truncate max-w-[200px]" title={clase.moduloNombre}>
                {clase.moduloNombre}
              </span>
            )}
          </div>
        </div>
        {acciones && <div className="w-full sm:w-auto shrink-0 flex sm:justify-end">{acciones}</div>}
      </div>
    </div>
  )
}

function CursoCard({ curso }: { curso: CursoActivoConData }) {
  return (
    <div className="group relative flex flex-col justify-between w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-orange-300 hover:shadow-md transition-all duration-200">
      {/* Indicador de acento superior sutil en hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Cabecera: Icono + Título que fluye en 2 líneas sin desbordar */}
        <div className="flex items-start gap-3 mb-3">
          <div className="size-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <HugeiconsIcon icon={BookOpen01Icon} size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm sm:text-base font-bold leading-snug text-slate-800 line-clamp-2 break-words group-hover:text-orange-600 transition-colors"
              title={curso.nombre}
            >
              {curso.nombre}
            </h3>
            {curso.catalogoNombre && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 break-words">
                {curso.catalogoNombre}
              </p>
            )}
          </div>
        </div>

        {/* Metadatos en micro-chips que envuelven ordenadamente */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs mb-3.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-600 text-[11px] font-medium">
            <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-slate-400 shrink-0" />
            <span className="break-words">{curso.periodo}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-600 text-[11px] font-medium">
            <HugeiconsIcon icon={Location01Icon} size={12} className="text-slate-400 shrink-0" />
            <span className="truncate max-w-[140px]">{curso.ciudad || "Sede virtual"}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold sm:ml-auto">
            <HugeiconsIcon icon={UserGroupIcon} size={12} className="shrink-0" />
            <span>{curso.estudiantesCount} estudiantes</span>
          </span>
        </div>

        {/* Módulo actual protegido contra desborde */}
        {curso.moduloActual && (
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2.5 mb-3.5 text-xs">
            <span className="text-slate-500 font-medium">Módulo actual: </span>
            <span className="font-semibold text-slate-800 break-words line-clamp-2">
              {curso.moduloActual}
            </span>
          </div>
        )}
      </div>

      {/* Progreso + Botón de acción */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Progreso del curso</span>
            <span className="font-bold text-slate-800">{curso.progreso}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                curso.progreso >= 80 ? "bg-emerald-500" : curso.progreso >= 40 ? "bg-orange-500" : "bg-slate-400"
              }`}
              style={{ width: `${curso.progreso}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {curso.clasesRealizadas} de {curso.totalClases} clases completadas
          </p>
        </div>

        <Link
          to={`/instructor/cursos/${curso.id}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95 transition-all cursor-pointer"
        >
          Ver curso
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
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
      <div className="min-h-full flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="animate-spin size-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-500">Cargando tu dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-50/50 px-4">
        <div className="text-center max-w-sm">
          <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4 bg-orange-50 text-orange-600 border border-orange-100">
            <HugeiconsIcon icon={BookOpen01Icon} size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Bienvenido, {nombreInstructor}
          </h2>
          <p className="text-sm mt-1 text-slate-500">
            Aún no tienes cursos asignados. Cuando te asignen uno, verás aquí tu resumen personal.
          </p>
        </div>
      </div>
    )
  }

  const tieneClasesHoy = data.clasesHoy.length > 0

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50">
      {/* Cabecera responsiva */}
      <header className="flex-none bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
              Hola, {nombreInstructor}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">
              {data.fechaActual}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200/60 shrink-0">
            Instructor
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 w-full max-w-6xl mx-auto min-w-0">
        {/* Quick stats con gradientes y microacentos */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {[
            {
              icon: BookOpen01Icon,
              label: "Cursos activos",
              value: data.cursosActivosCount,
              accentBg: "bg-orange-50/70",
              accentBorder: "border-orange-200/70",
              iconBg: "bg-orange-100/80 text-orange-600",
            },
            {
              icon: Calendar03Icon,
              label: "Clases esta semana",
              value: data.clasesSemanaCount,
              accentBg: "bg-blue-50/70",
              accentBorder: "border-blue-200/70",
              iconBg: "bg-blue-100/80 text-blue-600",
            },
            {
              icon: UserGroupIcon,
              label: "Total estudiantes",
              value: data.totalEstudiantes,
              accentBg: "bg-emerald-50/70",
              accentBorder: "border-emerald-200/70",
              iconBg: "bg-emerald-100/80 text-emerald-600",
            },
          ].map(({ icon, label, value, accentBg, accentBorder, iconBg }) => (
            <div
              key={label}
              className={`rounded-2xl border ${accentBorder} ${accentBg} p-4 sm:p-5 transition-all duration-200 hover:shadow-xs`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {label}
                </span>
                <div className={`flex items-center justify-center size-9 rounded-xl ${iconBg}`}>
                  <HugeiconsIcon icon={icon} size={18} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </section>

        {/* Agenda del día */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                <HugeiconsIcon icon={Clock01Icon} size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Agenda del día
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200/60">
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
                      to={`/instructor/cursos/${clase.cursoId}?tab=asistencia`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                      Tomar asistencia
                    </Link>
                  }
                />
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center">
                <div className="flex items-center justify-center size-12 rounded-2xl mx-auto mb-3 bg-orange-50 text-orange-500 border border-orange-100">
                  <HugeiconsIcon icon={SunCloudIcon} size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Sin clases por hoy
                </p>
                <p className="text-xs mt-1 text-slate-500">
                  Disfruta tu día libre o prepara tus próximos contenidos.
                </p>
                {data.proximaClase && (
                  <div className="mt-5 pt-4 border-t border-slate-100 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5 text-slate-500">
                      Próxima clase programada
                    </p>
                    <ClaseCard clase={data.proximaClase} showCurso />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Mis cursos activos */}
        {data.cursosActivos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="flex items-center justify-center size-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                <HugeiconsIcon icon={GraduationCapIcon} size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Mis cursos activos ({data.cursosActivos.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {data.cursosActivos.map((curso) => (
                <CursoCard key={curso.id} curso={curso} />
              ))}
            </div>
          </section>
        )}

        {/* Clases pendientes de la semana */}
        {data.clasesPendientesSemana.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3.5">
              <div
                className={`flex items-center justify-center size-8 rounded-xl border ${
                  data.clasesPendientesSemana.some((c) => c.vencida)
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-orange-50 text-orange-600 border-orange-100"
                }`}
              >
                <HugeiconsIcon icon={Alert01Icon} size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Clases pendientes de la semana ({data.clasesPendientesSemana.length})
              </h2>
            </div>
            <div className="space-y-2.5">
              {data.clasesPendientesSemana.map((clase) => (
                <div
                  key={clase.id}
                  className={`w-full min-w-0 rounded-2xl border p-4 sm:p-4.5 transition-all duration-200 hover:shadow-xs bg-white ${
                    clase.vencida
                      ? "border-rose-200/90 bg-rose-50/20"
                      : "border-slate-200/90"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {clase.vencida && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            PENDIENTE
                          </span>
                        )}
                        <p className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2 break-words">
                          {clase.cursoNombre}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-400 shrink-0" />
                          <span className="capitalize">
                            {new Date(clase.fecha + "T" + (clase.horaInicio || "00:00")).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <HugeiconsIcon icon={Time03Icon} size={14} className="text-slate-400 shrink-0" />
                          <span>{clase.horaInicio || "—"}</span>
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/instructor/cursos/${clase.cursoId}?tab=asistencia`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                      Registrar asistencia
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
