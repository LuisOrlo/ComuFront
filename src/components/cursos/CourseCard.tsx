import { COLORS } from "@/lib/constants"
import { StatusBadge } from "./StatusBadge"
import type { Curso } from "@/services/cursos.service"

export function CourseCard({ curso }: { curso: Curso }) {
  const pct = Math.round((curso.estudiantes / curso.capacidad) * 100)

  return (
    <article
      className="group rounded-xl border bg-white overflow-hidden cursor-pointer select-none transition-all duration-200 ease-out"
      style={{ borderColor: COLORS.BORDER_SUBTLE }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${COLORS.ACCENT}40`
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.boxShadow = "0 8px 25px -10px rgba(0,0,0,0.12)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="absolute top-2 right-2">
          <StatusBadge estado={curso.estado} />
        </div>
        {curso.estado === "en_progreso" && (
          <span
            className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 15%, transparent)`,
              color: COLORS.ACCENT,
            }}
          >
            <span className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS.ACCENT }} />
            Activo
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex gap-1.5 mb-2.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
            style={{
              backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)`,
              color: COLORS.ACCENT,
              borderColor: `color-mix(in srgb, ${COLORS.ACCENT} 20%, transparent)`,
            }}
          >
            {curso.modalidad === "presencial" ? "Presencial" : "Virtual"}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border"
            style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}
          >
            {curso.ciudad}
          </span>
        </div>

        <h3
          className="text-sm font-semibold mb-1 line-clamp-2 transition-colors duration-180 ease-out"
          style={{ color: COLORS.CHARCOAL }}
        >
          {curso.nombre}
        </h3>
        <p className="text-xs mb-4" style={{ color: COLORS.TEXT_MUTED }}>
          {curso.instructor}
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span style={{ color: COLORS.TEXT_MUTED }}>Ocupación</span>
            <span className="font-medium" style={{ color: COLORS.ACCENT }}>
              {curso.estudiantes}/{curso.capacidad}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${COLORS.ACCENT}, color-mix(in srgb, ${COLORS.ACCENT} 85%, white))`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
