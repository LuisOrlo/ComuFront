import { GraduationCapIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Pencil, Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { iconMap } from "../components/catalog-icons"
import type { CatalogoCurso } from "@/services/cursos.service"

interface CatalogoCardProps {
  catalogo: CatalogoCurso
  isSelected: boolean
  isAdmin: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function CatalogoCard({ catalogo, isSelected, isAdmin, onSelect, onEdit, onDelete }: CatalogoCardProps) {
  const icon = catalogo.imagen && iconMap[catalogo.imagen]

  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect() }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex flex-col cursor-pointer transition-all duration-200 ease-out rounded-2xl overflow-hidden p-5",
        isSelected
          ? "shadow-md ring-2 ring-offset-1"
          : "shadow-sm hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{
        border: isSelected ? `1px solid ${catalogo.color || COLORS.ACCENT}` : "1px solid transparent",
        backgroundColor: isSelected && catalogo.color ? `color-mix(in srgb, ${catalogo.color} 8%, white)` : "white",
        ["--tw-ring-color" as string]: isSelected ? (catalogo.color || COLORS.ACCENT) : "transparent",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: catalogo.color || COLORS.ACCENT }} />
      <div
        className="flex items-start justify-between gap-3 mb-4 pt-1"
        style={{
          color: catalogo.color || COLORS.TEXT_MUTED,
        }}
      >
        <div className="size-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${catalogo.color || COLORS.ACCENT} 12%, white)` }}>
          {icon ? <HugeiconsIcon icon={icon} size={24} style={{ color: catalogo.color || COLORS.TEXT_MUTED }} /> : <span className="size-3 rounded-full" style={{ backgroundColor: catalogo.color || COLORS.TEXT_MUTED }} />}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <p className="text-base font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
          {catalogo.nombre}
        </p>
        {catalogo.descripcion && (
          <p className="text-xs leading-5 mt-2 break-words line-clamp-2" style={{ color: COLORS.TEXT_MUTED }}>
            {catalogo.descripcion}
          </p>
        )}
      </div>

      <div className="mt-5 pt-3 flex items-center justify-between gap-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>
          <HugeiconsIcon icon={GraduationCapIcon} size={16} style={{ color: catalogo.color || COLORS.ACCENT }} />
          {catalogo.cursos_count ?? 0} {catalogo.cursos_count === 1 ? "curso" : "cursos"}
        </span>
        <span className="text-xs font-semibold transition-transform group-hover:translate-x-1" style={{ color: catalogo.color || COLORS.ACCENT }}>
          Ver cursos →
        </span>
      </div>

      {isAdmin && (
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-[#e5eeff] hover:text-[#0b1c30]"
          >
            <Pencil size={13} />
            Editar
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={13} />
            Borrar
          </button>
        </div>
      )}
    </div>
  )
}
