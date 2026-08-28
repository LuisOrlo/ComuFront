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
        "group flex flex-col cursor-pointer transition-all duration-200 ease-out rounded-2xl border overflow-hidden",
        isSelected
          ? "shadow-lg ring-2 ring-offset-2"
          : "hover:shadow-md hover:-translate-y-1"
      )}
      style={{
        borderColor: isSelected ? (catalogo.color || COLORS.ACCENT) : COLORS.BORDER_SUBTLE,
        borderWidth: isSelected ? 3 : 1,
        backgroundColor: isSelected && catalogo.color
          ? `color-mix(in srgb, ${catalogo.color} 6%, white)`
          : "white",
        ["--tw-ring-color" as string]: isSelected ? (catalogo.color || COLORS.ACCENT) : "transparent",
      }}
    >
      <div
        className="h-20 flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: catalogo.color
            ? `color-mix(in srgb, ${catalogo.color} 12%, white)`
            : "oklch(0.95 0 0)",
        }}
      >
        {icon ? (
          <HugeiconsIcon icon={icon} size={28} style={{ color: catalogo.color || COLORS.TEXT_MUTED }} />
        ) : (
          <span className="size-3 rounded-full" style={{ backgroundColor: catalogo.color || COLORS.TEXT_MUTED }} />
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col min-h-0">
        <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
          {catalogo.nombre}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: catalogo.categoria === "regular" ? "#dbeafe"
                : catalogo.categoria === "taller" ? "#fef3c7"
                : "#ede9fe",
              color: catalogo.categoria === "regular" ? "#1e40af"
                : catalogo.categoria === "taller" ? "#92400e"
                : "#5b21b6",
            }}
          >
            {catalogo.categoria === "regular" ? "Regular"
              : catalogo.categoria === "taller" ? "Taller"
              : "Personalizado"}
          </span>
        </div>
        {catalogo.descripcion && (
          <p className="text-[11px] leading-relaxed mt-2 break-words" style={{ color: COLORS.TEXT_MUTED }}>
            {catalogo.descripcion}
          </p>
        )}
      </div>

      {isAdmin && (
        <div className="px-3 pb-3 pt-2 flex gap-1.5 border-t">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-black/5 hover:text-gray-800 transition-colors"
          >
            <Pencil size={13} />
            Editar
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
            Borrar
          </button>
        </div>
      )}
    </div>
  )
}
