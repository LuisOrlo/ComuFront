import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Dialog } from "radix-ui"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { CATALOG_ICONS, type CatalogIconOption } from "./catalog-icons"

interface IconPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIcon: string | null
  catalogColor: string
  onApply: (iconName: string) => void
}

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

const CATEGORIES = ["Todas", ...Array.from(new Set(CATALOG_ICONS.map((i) => i.category)))]

function IconCard({ option, isSelected, catalogColor, onSelect }: {
  option: CatalogIconOption
  isSelected: boolean
  catalogColor: string
  onSelect: (name: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.name)}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:shadow-md active:scale-95"
      style={{
        borderColor: isSelected ? catalogColor : COLORS.BORDER_SUBTLE,
        backgroundColor: isSelected ? `color-mix(in srgb, ${catalogColor} 12%, transparent)` : "transparent",
      }}
    >
      <HugeiconsIcon
        icon={option.icon}
        size={28}
        style={{ color: isSelected ? catalogColor : "oklch(0.55 0.01 0)" }}
      />
      <span
        className="text-[10px] font-medium text-center leading-tight line-clamp-2"
        style={{ color: isSelected ? catalogColor : COLORS.TEXT_MUTED }}
      >
        {option.label}
      </span>
    </button>
  )
}

export function IconPickerModal({ open, onOpenChange, selectedIcon, catalogColor, onApply }: IconPickerModalProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todas")
  const [pendingIcon, setPendingIcon] = useState<string | null>(selectedIcon)

  useEffect(() => {
    if (open) {
      setSearch("")
      setActiveCategory("Todas")
      setPendingIcon(selectedIcon)
    }
  }, [open, selectedIcon])

  const query = normalize(search.trim())
  const filtered = CATALOG_ICONS.filter((opt) => {
    const matchesCategory = activeCategory === "Todas" || opt.category === activeCategory
    const matchesSearch = !query
      || normalize(opt.label).includes(query)
      || normalize(opt.name).includes(query)
    return matchesCategory && matchesSearch
  })

  const handleApply = () => {
    if (!pendingIcon) return
    onApply(pendingIcon)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-2xl p-0 z-50 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50 shrink-0">
            <div>
              <Dialog.Title className="text-xl font-black text-gray-900">Seleccionar ícono</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                Busca y elige el ícono representativo del catálogo.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setActiveCategory("Todas")
                }}
                placeholder="Buscar por nombre (ej: cámara, video, radio)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50/50 text-sm outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95",
                    activeCategory === category
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  style={activeCategory === category ? { backgroundColor: catalogColor } : undefined}
                >
                  {category}
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {filtered.map((option) => (
                  <IconCard
                    key={option.name}
                    option={option}
                    isSelected={pendingIcon === option.name}
                    catalogColor={catalogColor}
                    onSelect={setPendingIcon}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm py-10" style={{ color: COLORS.TEXT_MUTED }}>
                Sin resultados para &quot;{search}&quot;
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t bg-gray-50/50 shrink-0">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ color: COLORS.CHARCOAL }}
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleApply}
              disabled={!pendingIcon}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              Aplicar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
