import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, GraduationCapIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { Curso } from "@/services/cursos.service"
import { CursoCardExpanded } from "./CursoCardExpanded"

interface CursoGridProps {
  cursos: Curso[]
  selectedId: string | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
  loading: boolean
}

export function CursoGrid({ cursos, selectedId, search, onSearchChange, onSelect, loading }: CursoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white" }} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <HugeiconsIcon
          icon={SearchIcon}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          size={14}
          style={{ color: COLORS.TEXT_MUTED }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar curso..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white/70 text-sm outline-none transition-all focus:bg-white focus:ring-2"
          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
        />
      </div>

      {cursos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <HugeiconsIcon icon={GraduationCapIcon} size={32} style={{ color: COLORS.TEXT_MUTED }} />
          <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
            {search ? "Sin resultados" : "No hay cursos en este catálogo"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map((curso) => (
            <CursoCardExpanded
              key={curso.id}
              curso={curso}
              isSelected={selectedId === curso.id}
              onSelect={() => onSelect(curso.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}