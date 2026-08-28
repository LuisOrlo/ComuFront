import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon } from "@hugeicons/core-free-icons"
import { BookOpen01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { CatalogoCurso } from "@/services/cursos.service"
import { CatalogoCard } from "./CatalogoCard"

interface CatalogoGridProps {
  catalogos: CatalogoCurso[]
  selectedId: string | null
  search: string
  onSearchChange: (v: string) => void
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string, nombre: string) => void
  isAdmin: boolean
}

export function CatalogoGrid({
  catalogos,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onEdit,
  onDelete,
  isAdmin,
}: CatalogoGridProps) {
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
          placeholder="Buscar catálogo..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border bg-white/70 text-sm outline-none transition-all focus:bg-white focus:ring-2"
          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
        />
      </div>

      {catalogos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <HugeiconsIcon icon={BookOpen01Icon} size={32} style={{ color: COLORS.TEXT_MUTED }} />
          <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
            {search ? "Sin resultados" : "No hay catálogos"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {catalogos.map((cat) => (
            <CatalogoCard
              key={cat.id}
              catalogo={cat}
              isSelected={selectedId === cat.id}
              isAdmin={isAdmin}
              onSelect={() => onSelect(cat.id)}
              onEdit={() => onEdit(cat.id)}
              onDelete={() => onDelete(cat.id, cat.nombre)}
            />
          ))}
        </div>
      )}
    </div>
  )
}