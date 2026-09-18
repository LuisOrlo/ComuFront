import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
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

const CATEGORIES = ["Todas", ...Array.from(new Set(CATALOG_ICONS.map((item) => item.category)))]

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
      className={cn(
        "p-3 rounded-xl flex flex-col items-center justify-center gap-1 min-w-0 hover:bg-[#e5eeff]",
        isSelected && "ring-2"
      )}
      style={{
        backgroundColor: isSelected ? `color-mix(in srgb, ${catalogColor} 16%, white)` : undefined,
        color: isSelected ? catalogColor : COLORS.CHARCOAL,
        ["--tw-ring-color" as string]: isSelected ? catalogColor : "transparent",
      }}
    >
      <HugeiconsIcon icon={option.icon} size={28} />
      <span className="text-[10px] font-medium text-center leading-tight truncate max-w-full" style={{ color: isSelected ? catalogColor : COLORS.CHARCOAL }}>
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
  const filtered = CATALOG_ICONS.filter((option) => {
    const matchesCategory = activeCategory === "Todas" || option.category === activeCategory
    const matchesSearch = !query || normalize(option.label).includes(query) || normalize(option.name).includes(query)
    return matchesCategory && matchesSearch
  })
  const pendingOption = pendingIcon ? CATALOG_ICONS.find((option) => option.name === pendingIcon) : undefined

  const handleApply = () => {
    if (!pendingIcon) return
    onApply(pendingIcon)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-xl max-h-[85vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 border-b flex items-start justify-between gap-4 shrink-0" style={{ borderColor: "rgba(118,119,125,.3)" }}>
            <div>
              <Dialog.Title className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Seleccionar ícono</Dialog.Title>
              <Dialog.Description className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                Elige el glifo visual que mejor represente la disciplina de este catálogo.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="size-8 rounded-lg flex items-center justify-center hover:bg-[#e5eeff]" aria-label="Cerrar selección de ícono">
                <HugeiconsIcon icon={Cancel01Icon} size={19} style={{ color: COLORS.TEXT_MUTED }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-4 bg-[#eff4ff] flex flex-col gap-3 shrink-0">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={18} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.TEXT_MUTED }} />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setActiveCategory("Todas")
                }}
                placeholder="Buscar por nombre o palabra clave..."
                className="w-full h-10 pl-10 pr-3 rounded-lg bg-white text-sm outline-none focus:ring-2"
                style={{ color: COLORS.CHARCOAL, border: "1px solid transparent" }}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((category) => {
                const active = activeCategory === category
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap", active ? "bg-white shadow-sm" : "hover:bg-white/70")}
                    style={{ color: active ? catalogColor : COLORS.TEXT_MUTED }}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {filtered.map((option) => (
                  <IconCard key={option.name} option={option} isSelected={pendingIcon === option.name} catalogColor={catalogColor} onSelect={setPendingIcon} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm py-10" style={{ color: COLORS.TEXT_MUTED }}>Sin resultados para &quot;{search}&quot;</p>
            )}
          </div>

          <div className="p-4 bg-[#eff4ff] border-t flex items-center justify-between gap-3 shrink-0" style={{ borderColor: "rgba(118,119,125,.3)" }}>
            <span className="text-xs truncate" style={{ color: COLORS.TEXT_MUTED }}>
              Ícono actual: <strong className="font-mono" style={{ color: COLORS.CHARCOAL }}>{pendingOption?.name || "ninguno"}</strong>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Dialog.Close asChild>
                <button type="button" className="px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white" style={{ color: COLORS.CHARCOAL }}>Cancelar</button>
              </Dialog.Close>
              <button type="button" onClick={handleApply} disabled={!pendingIcon} className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110" style={{ backgroundColor: catalogColor }}>
                Aplicar selección
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
