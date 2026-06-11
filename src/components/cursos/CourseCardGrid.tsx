import { HugeiconsIcon } from "@hugeicons/react"
import { AddCircleIcon } from "@hugeicons/core-free-icons"
import { CourseCard } from "./CourseCard"
import { COLORS } from "@/lib/constants"
import type { Curso } from "@/services/cursos.service"

export function CourseCardGrid({ cursos }: { cursos: Curso[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cursos.map((curso) => (
        <CourseCard key={curso.id} curso={curso} />
      ))}

      <article
        className="group rounded-xl border border-dashed flex flex-col items-center justify-center min-h-[280px] cursor-pointer select-none transition-all duration-200 ease-out"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${COLORS.ACCENT}40`
          e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 4%, white)`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
          e.currentTarget.style.backgroundColor = "transparent"
        }}
      >
        <HugeiconsIcon
          icon={AddCircleIcon}
          size={36}
          className="mb-2 transition-colors duration-180 ease-out"
          style={{ color: COLORS.TEXT_MUTED }}
        />
        <span className="text-sm font-medium transition-colors duration-180 ease-out" style={{ color: COLORS.TEXT_MUTED }}>
          Nuevo curso
        </span>
      </article>
    </div>
  )
}
