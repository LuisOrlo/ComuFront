import { HugeiconsIcon } from "@hugeicons/react"
import { AddCircleIcon } from "@hugeicons/core-free-icons"
import { CourseCard } from "./CourseCard"
import type { Curso } from "@/services/cursos.service"

export function CourseCardGrid({
  cursos,
  onView,
  onNewCurso,
}: {
  cursos: Curso[]
  onView?: (id: string) => void
  onNewCurso?: () => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {cursos.map((curso) => (
        <CourseCard key={curso.id} curso={curso} onView={onView} />
      ))}

      {onNewCurso && (
        <article
          onClick={onNewCurso}
          className="group rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#fd761a]/60 bg-slate-50/50 hover:bg-orange-50/30 flex flex-col items-center justify-center min-h-[260px] cursor-pointer select-none transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-[#fd761a]/40 group-hover:bg-[#fd761a] flex items-center justify-center text-slate-400 group-hover:text-white transition-all shadow-xs group-hover:shadow-md mb-3">
            <HugeiconsIcon icon={AddCircleIcon} size={24} />
          </div>
          <span className="text-sm font-bold text-slate-600 group-hover:text-[#fd761a] transition-colors">
            Nuevo Curso
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Crear una nueva oferta académica
          </span>
        </article>
      )}
    </div>
  )
}
