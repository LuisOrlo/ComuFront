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
  validarTextoSinNumeros,
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
  nombres: (v) => validarTextoSinNumeros(v, "Nombres"),
  apellidos: (v) => validarTextoSinNumeros(v, "Apellidos"),
  telefono: validarTelefono,
  celular: validarTelefono,
  cedula: validarCedula,
  correo: validarEmail,
  email: validarEmail,
  edad: validarEdad,
}

export function EF({
  icon,
  label,
  field,
  data,
  editField,
  editVal,
  onEdit,
  onChange,
  onSave,
  onCancel,
  bold,
  saving,
  inputType,
  groupColor,
  validator,
  options,
  maxLength,
  uppercase = true,
  customDisplay,
}: {
  icon: any
  label: string
  field: string
  data: any
  editField: string | null
  editVal: string
  onEdit: (f: string, v: string) => void
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  bold?: boolean
  saving?: boolean
  inputType?: string
  groupColor?: string
  validator?: (v: string) => string | null
  options?: Array<{ value: string; label: string }>
  maxLength?: number
  uppercase?: boolean
  customDisplay?: React.ReactNode
}) {
  const [error, setError] = useState<string | null>(null)

  const raw =
    data?.perfil_estudiante?.[field] ??
    data?.[field] ??
    (field === "correo"
      ? data?.perfil_estudiante?.email ?? data?.email
      : field === "email"
      ? data?.perfil_estudiante?.correo ?? data?.correo
      : undefined)

  const displayRaw = inputType === "date" && typeof raw === "string" && raw.includes("T") ? raw.split("T")[0] : raw

  let textValue = displayRaw != null && displayRaw !== "" ? String(displayRaw) : "—"

  // Map option value to option label if available
  if (options && options.length > 0 && textValue !== "—") {
    const matchedOpt = options.find((o) => o.value.toLowerCase() === textValue.toLowerCase())
    if (matchedOpt) {
      textValue = matchedOpt.label
    }
  }

  // Display value in uppercase if enabled (except for email/correo fields)
  const isEmail = field === "correo" || field === "email" || inputType === "email"
  const shouldUppercase = uppercase && !isEmail
  const displayValue = shouldUppercase && textValue !== "—" ? textValue.toUpperCase() : textValue

  const validar = (valor: string): string | null => {
    if (validator) return validator(valor)
    if (options && options.length > 0) {
      if (!valor || !valor.trim()) return `Seleccione ${label.toLowerCase()}`
      return null
    }
    const fieldValidator = VALIDATORS[field]
    if (fieldValidator) return fieldValidator(valor)
    return null
  }

  const handleSave = () => {
    const err = validar(editVal)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    let val = e.target.value

    if (field === "nombres" || field === "apellidos" || field === "ciudad") {
      val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
    } else if (field === "cedula") {
      val = val.replace(/\D/g, "").slice(0, 10)
    } else if (field === "celular" || field === "telefono") {
      val = val.replace(/\D/g, "").slice(0, 10)
    } else if (field === "edad") {
      val = val.replace(/\D/g, "").slice(0, 3)
    }

    onChange(val)
  }

  if (editField === field) {
    const effMaxLength =
      maxLength ||
      (field === "cedula" || field === "celular" || field === "telefono"
        ? 10
        : field === "edad"
        ? 3
        : undefined)

    return (
      <div className="flex flex-col gap-1 col-span-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: groupColor || COLORS.TEXT_MUTED }} />
          <span className="shrink-0 text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>
            {label}:
          </span>

          {options && options.length > 0 ? (
            <select
              value={editVal}
              onChange={(e) => {
                setError(null)
                onChange(e.target.value)
              }}
              className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none bg-white shadow-xs focus:ring-2 focus:ring-blue-200 transition-shadow uppercase font-medium cursor-pointer"
              style={{ borderColor: error ? "oklch(0.5 0.15 20)" : COLORS.ACCENT }}
              autoFocus
              disabled={saving}
            >
              <option value="">SELECCIONAR...</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label.toUpperCase()}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={inputType || "text"}
              value={editVal}
              onChange={handleInputChange}
              maxLength={effMaxLength}
              placeholder={`Ingrese ${label.toLowerCase()}`}
              className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none bg-white shadow-xs focus:ring-2 focus:ring-blue-200 transition-shadow"
              style={{ borderColor: error ? "oklch(0.5 0.15 20)" : COLORS.ACCENT }}
              autoFocus
              disabled={saving}
            />
          )}

          <button
            onClick={handleSave}
            disabled={saving || !!error}
            className="text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition active:scale-[0.98]"
            style={{
              backgroundColor: COLORS.ACCENT,
              color: "white",
              opacity: saving || !!error ? 0.6 : 1,
            }}
          >
            {saving ? "..." : "Guardar"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="text-xs font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            style={{ color: COLORS.TEXT_MUTED, opacity: saving ? 0.6 : 1 }}
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-xs ml-1 font-medium" style={{ color: "oklch(0.5 0.15 20)" }}>{error}</p>}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg group"
      style={groupColor ? { backgroundColor: `color-mix(in srgb, ${groupColor} 6%, transparent)` } : {}}
    >
      <HugeiconsIcon icon={icon} size={14} className="shrink-0" style={{ color: groupColor || COLORS.TEXT_MUTED }} />
      <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">
        {label}:
      </span>
      {customDisplay ? (
        customDisplay
      ) : (
        <span
          className={`truncate text-sm ${shouldUppercase ? "uppercase" : ""}`}
          style={{ color: COLORS.CHARCOAL, fontWeight: bold ? 700 : 500 }}
        >
          {displayValue}
        </span>
      )}
      <button
        type="button"
        onClick={() => onEdit(field, displayRaw != null && displayRaw !== "—" ? String(displayRaw) : "")}
        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
        style={{ color: COLORS.ACCENT }}
        title={`Editar ${label.toLowerCase()}`}
      >
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