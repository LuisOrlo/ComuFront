import { useState, useEffect } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Calendar03Icon,
  ArrowRight01Icon,
  Time03Icon,
  GraduationCapIcon,
  PlayIcon,
  GlobeIcon,
  Building01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { instructorService, type InstructorCurso } from "@/services/instructor.service"
import { toast } from "sonner"

const statusConfig: Record<string, { color: string; label: string }> = {
  pendiente: { color: "#f59e0b", label: "Pendiente" },
  activo: { color: "#3b82f6", label: "Activo" },
  en_progreso: { color: "#3b82f6", label: "En Progreso" },
  completado: { color: "#10b981", label: "Completado" },
  finalizado: { color: "#10b981", label: "Finalizado" },
  aprobado: { color: "#10b981", label: "Aprobado" },
}

function getStatusConfig(estado: string) {
  return statusConfig[estado.toLowerCase()] ?? { color: "#6b7280", label: estado }
}

function inferModality(curso: InstructorCurso): "presencial" | "virtual" {
  if (curso.modalidad === "presencial" || curso.modalidad === "virtual") return curso.modalidad
  const ref = (curso.horario?.nombre_referencial ?? "").toLowerCase()
  if (ref.includes("virtual") || ref.includes("online") || ref.includes("zoom") || ref.includes("meet")) return "virtual"
  return "presencial"
}

function getProgreso(curso: InstructorCurso): number {
  const inicio = new Date(curso.fecha_inicio).getTime()
  const fin = new Date(curso.fecha_fin).getTime()
  const ahora = Date.now()
  if (ahora <= inicio) return 0
  if (ahora >= fin) return 100
  return Math.round(((ahora - inicio) / (fin - inicio)) * 100)
}

export function InstructorCursosPage() {
  const [cursos, setCursos] = useState<InstructorCurso[]>([])
  const [loading, setLoading] = useState(true)

  const loadCursos = async () => {
    try {
      const data = await instructorService.getMisCursos()
      setCursos(data)
    } catch {
      toast.error("Error al cargar tus cursos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCursos()
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando tus cursos...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>
          Mis Cursos Asignados
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          Gestiona las clases, asistencias y notas de tus cursos.
        </p>
      </header>

      {cursos.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-14 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          style={{ border: "1px solid #f1f3f5" }}
        >
          <div
            className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}
          >
            <HugeiconsIcon icon={BookOpen01Icon} size={28} style={{ color: COLORS.ACCENT }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
            No tienes cursos asignados
          </h3>
          <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>
            Contacta con administración si crees que esto es un error.
          </p>
        </div>
      ) : (
        <>
          {(["virtual", "presencial"] as const).map((tipo) => {
            const filtered = cursos.filter((c) => inferModality(c) === tipo)
            if (filtered.length === 0) return null

            const isVirtual = tipo === "virtual"

            return (
              <section key={tipo} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="size-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isVirtual
                        ? `color-mix(in srgb, #8b5cf6 12%, transparent)`
                        : `color-mix(in srgb, #f97316 12%, transparent)`,
                      color: isVirtual ? "#8b5cf6" : "#f97316",
                    }}
                  >
                    <HugeiconsIcon icon={isVirtual ? GlobeIcon : Building01Icon} size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>
                      {isVirtual ? "Virtuales" : "Presenciales"}
                    </h2>
                    <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
                      {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((curso) => {
                    const prog = getProgreso(curso)
                    const status = getStatusConfig(curso.estado)

                    return (
                      <Link
                        key={curso.id}
                        to={`/instructor/cursos/${curso.id}`}
                        className="group relative flex flex-col bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:bg-orange-50 hover:border-orange-200 hover:shadow-[0_4px_16px_rgba(251,146,60,0.1)] active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="size-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${status.color} 14%, transparent)`,
                              color: status.color,
                            }}
                          >
                            <HugeiconsIcon icon={prog > 0 && prog < 100 ? PlayIcon : GraduationCapIcon} size={18} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${status.color} 12%, transparent)`,
                                color: status.color,
                              }}
                            >
                              {status.label}
                            </span>
                            <div
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                              style={{ color: COLORS.ACCENT }}
                            >
                              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                            </div>
                          </div>
                        </div>

                        <h3
                          className="text-base font-black leading-tight mb-0.5 truncate"
                          style={{ color: COLORS.CHARCOAL }}
                          title={curso.nombre_instancia}
                        >
                          {curso.nombre_instancia}
                        </h3>
                        <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: COLORS.TEXT_MUTED }}>
                          {curso.catalogo?.color && (
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: curso.catalogo.color }} />
                          )}
                          {curso.catalogo?.nombre ?? "Sin catálogo"}
                        </p>

                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            <HugeiconsIcon icon={Calendar03Icon} size={14} />
                            <span>{curso.horario?.nombre_referencial ?? "Sin horario"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: status.color }}
                            />
                            <span>{curso.ciudad?.nombre ?? "Sin ciudad"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            <HugeiconsIcon icon={Time03Icon} size={14} />
                            <span>
                              {new Date(curso.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                              {" — "}
                              {curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                              Progreso
                            </span>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: status.color }}>
                              {prog}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${prog}%`,
                                backgroundColor: status.color,
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
                            style={{ color: COLORS.ACCENT }}
                          >
                            <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                            Ver clases
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
