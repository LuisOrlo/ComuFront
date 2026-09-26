import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  UserIcon,
  CheckmarkCircle02Icon,
  UserGroupIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface OperadorOption {
  id: string
  nombres: string
  apellidos: string
  cargo?: string
}

export interface OperadorSelectorProps {
  operadores: OperadorOption[]
  selectedId?: string | null
  onSelect: (id: string | null) => void
  disabled?: boolean
  incluyeOperador?: boolean
  onToggleIncluye?: (incluye: boolean) => void
  title?: string
  subtitle?: string
  className?: string
}

export function OperadorSelector({
  operadores,
  selectedId,
  onSelect,
  disabled,
  incluyeOperador = true,
  onToggleIncluye,
  title = "Incluye operador",
  subtitle = "Asignar un operador de radio disponible",
  className,
}: OperadorSelectorProps) {
  const [search, setSearch] = useState("")

  const filtered = search.trim()
    ? operadores.filter(
        (op) =>
          `${op.nombres} ${op.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
          op.cargo?.toLowerCase().includes(search.toLowerCase())
      )
    : operadores

  const selectedOp = operadores.find((op) => String(op.id) === String(selectedId))

  return (
    <div className={cn("space-y-3", className)}>
      {/* Switch Toggle (si se pasa onToggleIncluye) */}
      {onToggleIncluye && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 transition-all">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                incluyeOperador
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200/70 text-slate-400"
              )}
            >
              <HugeiconsIcon icon={UserGroupIcon} size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{title}</p>
              <p className="text-[10px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = !incluyeOperador
              onToggleIncluye(next)
              if (!next) onSelect(null)
            }}
            className={cn(
              "relative w-11 h-6 rounded-full transition-all cursor-pointer focus:outline-none shrink-0",
              incluyeOperador ? "bg-emerald-500" : "bg-slate-300"
            )}
            title={incluyeOperador ? "Desactivar operador" : "Activar operador"}
          >
            <div
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all",
                incluyeOperador ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      )}

      {/* Selector interactivo cuando incluyeOperador es true */}
      {incluyeOperador && (
        <div className="p-3 rounded-xl bg-white border border-slate-200/90 space-y-2 shadow-2xs">
          {/* Buscador de operador */}
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar operador por nombre o cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 transition-all disabled:opacity-40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
              </button>
            )}
          </div>

          {/* Lista scrolleable de operadores */}
          <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-xs font-medium text-slate-400">
                  No se encontraron operadores disponibles
                </p>
                {search && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Prueba con otro término de búsqueda
                  </p>
                )}
              </div>
            ) : (
              filtered.map((op) => {
                const isSelected = String(selectedId) === String(op.id)
                return (
                  <button
                    key={op.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(isSelected ? null : op.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer border",
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-300 shadow-2xs"
                        : "hover:bg-slate-50 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                          isSelected
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {isSelected ? (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                        ) : (
                          <HugeiconsIcon icon={UserIcon} size={13} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-xs font-bold truncate leading-tight",
                            isSelected ? "text-emerald-950" : "text-slate-800"
                          )}
                        >
                          {op.nombres} {op.apellidos}
                        </p>
                        {op.cargo && (
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {op.cargo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize",
                          isSelected
                            ? "bg-emerald-200 text-emerald-900"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {op.cargo || "Staff"}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Acciones al tener un operador seleccionado */}
          {selectedId && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                Asignado:{" "}
                <b className="text-slate-800">
                  {selectedOp ? `${selectedOp.nombres} ${selectedOp.apellidos}` : "Operador"}
                </b>
              </span>
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
              >
                Quitar operador
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
