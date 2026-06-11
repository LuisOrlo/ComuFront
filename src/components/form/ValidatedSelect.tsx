import { COLORS } from "@/lib/constants"

interface ValidatedSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: Array<{ value: string; label: string }>
  error?: string
  touched?: boolean
  placeholder?: string
  disabled?: boolean
  required?: boolean
  helperText?: string
}

export function ValidatedSelect({
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  touched = false,
  placeholder,
  disabled = false,
  required = false,
  helperText,
}: ValidatedSelectProps) {
  const hasError = touched && error
  const isValid = touched && !error && value.trim() !== ""

  const borderColor = hasError ? "#ff4444" : isValid ? COLORS.ACCENT : COLORS.BORDER_SUBTLE
  const shadowColor = hasError ? "rgba(255, 68, 68, 0.3)" : isValid ? `rgba(${COLORS.ACCENT}, 0.2)` : "transparent"

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>
          {label}
          {required && <span style={{ color: "#ff4444" }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all appearance-none"
        style={{
          borderColor,
          boxShadow: hasError || isValid ? `0 0 0 3px ${shadowColor}` : "none",
          backgroundColor: disabled ? "#f5f5f5" : "white",
          color: COLORS.CHARCOAL,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${COLORS.TEXT_MUTED}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: "28px",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError && (
        <div className="text-xs" style={{ color: "#ff4444" }}>
          {error}
        </div>
      )}
      {helperText && !hasError && (
        <div className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
          {helperText}
        </div>
      )}
    </div>
  )
}
