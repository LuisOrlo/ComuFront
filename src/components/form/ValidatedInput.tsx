import { COLORS } from "@/lib/constants"

interface ValidatedInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  touched?: boolean
  placeholder?: string
  type?: string
  disabled?: boolean
  required?: boolean
  helperText?: string
}

export function ValidatedInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  touched = false,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
  helperText,
}: ValidatedInputProps) {
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all"
        style={{
          borderColor,
          boxShadow: hasError || isValid ? `0 0 0 3px ${shadowColor}` : "none",
          backgroundColor: disabled ? "#f5f5f5" : "white",
          color: COLORS.CHARCOAL,
        }}
      />
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
