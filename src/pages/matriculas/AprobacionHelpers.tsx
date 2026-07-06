/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

export function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon icon={icon} size={14} style={{ color: COLORS.ACCENT }} />
        <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>{title}</h4>
      </div>
      {children}
    </div>
  )
}

export function InfoItem({ icon, label, value, bold }: { icon: any; label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">{label}</span>
      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

export function EF({ icon, label, field, data, editField, editVal, onEdit, onChange, onSave, onCancel, bold, saving, inputType }: {
  icon: any; label: string; field: string; data: any
  editField: string | null; editVal: string
  onEdit: (f: string, v: string) => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void
  bold?: boolean; saving?: boolean; inputType?: string
}) {
  const raw = data?.perfil_estudiante?.[field] ?? data?.[field]
  const value = raw ?? "—"
  if (editField === field) {
    return (
      <div className="flex items-center gap-2 col-span-2">
        <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
        <span className="shrink-0 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{label}:</span>
        <input type={inputType || "text"} value={editVal} onChange={e => onChange(e.target.value)} placeholder={`Ingrese ${label.toLowerCase()}`}
          className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none bg-white shadow-sm focus:ring-2 focus:ring-blue-200 transition-shadow" style={{ borderColor: COLORS.ACCENT }} autoFocus disabled={saving} />
        <button onClick={onSave} disabled={saving} className="text-xs font-medium px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: saving ? 0.6 : 1 }}>
          {saving ? "..." : "Guardar"}
        </button>
        <button onClick={onCancel} disabled={saving} className="text-xs px-3 py-2 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED, opacity: saving ? 0.6 : 1 }}>
          Cancelar
        </button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-sm group">
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0">{label}</span>
      <span className="truncate" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
      <button type="button" onClick={() => onEdit(field, value !== "—" ? value : "")}
        className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
        <HugeiconsIcon icon={Edit01Icon} size={14} />
      </button>
    </div>
  )
}

export function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
      style={{ backgroundColor: color ? `color-mix(in srgb, ${color} 12%, transparent)` : "oklch(0.96 0 0)", color: color || COLORS.TEXT_MUTED }}>
      {children}
    </span>
  )
}
