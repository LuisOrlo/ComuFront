import { useState, useEffect } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpen01Icon, Calendar03Icon, Location01Icon, ArrowRight01Icon, Time03Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { instructorService, type InstructorCurso } from "@/services/instructor.service"
import { toast } from "sonner"

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
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight" style={{ color: COLORS.CHARCOAL }}>
          Mis Cursos Asignados
        </h1>
        <p className="mt-1" style={{ color: COLORS.TEXT_MUTED }}>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cursos.map((curso) => (
            <Link
              key={curso.id}
              to={`/instructor/cursos/${curso.id}`}
              className="group bg-white rounded-2xl p-6 transition-all duration-200 hover:bg-orange-50/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.03)] active:scale-[0.98] border border-gray-200"
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="size-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` }}
                >
                  <HugeiconsIcon icon={BookOpen01Icon} size={22} style={{ color: COLORS.ACCENT }} />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: curso.estado === "activo" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: curso.estado === "activo" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {curso.estado}
                  </span>
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 -mr-1.5"
                    style={{ color: COLORS.ACCENT }}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                  </div>
                </div>
              </div>

              <h3
                className="text-lg font-black leading-tight mb-1 line-clamp-2"
                style={{ color: COLORS.CHARCOAL }}
              >
                {curso.nombre_instancia}
              </h3>
              <p className="text-sm mb-5 flex items-center gap-1.5" style={{ color: COLORS.TEXT_MUTED }}>
                {curso.catalogo?.color && (
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: curso.catalogo.color }} />
                )}
                {curso.catalogo?.nombre ?? "Sin catálogo"}
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={Calendar03Icon} size={16} />
                  <span>{curso.horario?.nombre_referencial ?? "Sin horario"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={Location01Icon} size={16} />
                  <span>{curso.ciudad?.nombre ?? "Sin ciudad"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={Time03Icon} size={16} />
                  <span>
                    {new Date(curso.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    {" — "}
                    {curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </span>
                </div>
              </div>

              
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
