/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  validarTelefono,
  validarCedula,
  validarEmail,
  validarEdad,
} from "./AprobacionUtils"

export function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <HugeiconsIcon icon={icon} size={15} style={{ color: COLORS.ACCENT }} />
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>{title}</h4>
      </div>
      {children}
    </div>
  )
}

export function SubCategory({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl space-y-2" style={{
      backgroundColor: color ? `color-mix(in srgb, ${color} 8%, transparent)` : "transparent",
      borderLeft: `3px solid ${color || COLORS.BORDER_SUBTLE}`,
    }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: color || COLORS.TEXT_MUTED }}>{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {children}
      </div>
    </div>
  )
}

export function InfoItem({ icon, label, value, bold, groupColor }: { icon: any; label: string; value: string; bold?: boolean; groupColor?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg"
      style={groupColor ? { backgroundColor: `color-mix(in srgb, ${groupColor} 6%, transparent)` } : {}}>
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: groupColor || COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">{label}</span>
      <span className="truncate text-sm" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

const VALIDATORS: Record<string, ((v: string) => string | null) | undefined> = {
  telefono: validarTelefono,
  celular: validarTelefono,
  cedula: validarCedula,
  correo: validarEmail,
  email: validarEmail,
  edad: validarEdad,
}

export function EF({ icon, label, field, data, editField, editVal, onEdit, onChange, onSave, onCancel, bold, saving, inputType, groupColor, validator }: {
  icon: any; label: string; field: string; data: any
  editField: string | null; editVal: string
  onEdit: (f: string, v: string) => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void
  bold?: boolean; saving?: boolean; inputType?: string; groupColor?: string
  validator?: (v: string) => string | null
}) {
  const [error, setError] = useState<string | null>(null)

  const raw = data?.perfil_estudiante?.[field] ?? data?.[field] ?? (field === "correo" ? (data?.perfil_estudiante?.email ?? data?.email) : field === "email" ? (data?.perfil_estudiante?.correo ?? data?.correo) : undefined)
  const displayRaw = inputType === "date" && typeof raw === "string" && raw.includes("T") ? raw.split("T")[0] : raw
  const value = displayRaw ?? "—"

  const validar = (valor: string, inputTipo?: string): string | null => {
    if (validator) return validator(valor)
    if (inputTipo !== "text") {
      const validator = VALIDATORS[field]
      if (validator) return validator(valor)
    }
    return null
  }

  const handleSave = () => {
    const err = validar(editVal, inputType)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onSave()
  }

  const handleCancel = () => {
    setError(null)
    onCancel()
  }

  if (editField === field) {
    return (
      <div className="flex flex-col gap-1 col-span-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: groupColor || COLORS.TEXT_MUTED }} />
          <span className="shrink-0 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{label}:</span>
          <input type={inputType || "text"} value={editVal} onChange={e => { setError(null); onChange(e.target.value) }}
            placeholder={`Ingrese ${label.toLowerCase()}`}
            className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none bg-white shadow-sm focus:ring-2 focus:ring-blue-200 transition-shadow"
            style={{ borderColor: error ? "oklch(0.5 0.15 20)" : COLORS.ACCENT }} autoFocus disabled={saving} />
          <button onClick={handleSave} disabled={saving || !!error}
            className="text-xs font-medium px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: saving || !!error ? 0.6 : 1 }}>
            {saving ? "..." : "Guardar"}
          </button>
          <button onClick={handleCancel} disabled={saving}
            className="text-xs px-3 py-2 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED, opacity: saving ? 0.6 : 1 }}>
            Cancelar
          </button>
        </div>
        {error && <p className="text-xs ml-1" style={{ color: "oklch(0.5 0.15 20)" }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg group"
      style={groupColor ? { backgroundColor: `color-mix(in srgb, ${groupColor} 6%, transparent)` } : {}}>
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: groupColor || COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">{label}</span>
      <span className="truncate text-sm" style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}>{value}</span>
      <button type="button" onClick={() => onEdit(field, value !== "—" ? value : "")}
        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: COLORS.ACCENT }}>
        <HugeiconsIcon icon={Edit01Icon} size={14} />
      </button>
    </div>
  )
}

export function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
      style={{ backgroundColor: color ? `color-mix(in srgb, ${color} 12%, transparent)` : "oklch(0.96 0 0)", color: color || COLORS.TEXT_MUTED }}>
      {children}
    </span>
  )
}