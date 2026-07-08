export const COLORS = {
  ACCENT: "oklch(0.65 0.2 45)",
  ACCENT_HOVER: "oklch(0.55 0.2 45)",
  CHARCOAL: "oklch(0.15 0 0)",
  TEXT_MUTED: "oklch(0.65 0 0)",
  BORDER_SUBTLE: "oklch(0.85 0 0)",
} as const

export const ESTADO_ASISTENCIA_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  presente: { bg: "#d1fae5", text: "#065f46", label: "Sí" },
  tardanza: { bg: "#fef3c7", text: "#92400e", label: "Tardanza" },
  ausente: { bg: "#fee2e2", text: "#991b1b", label: "No" },
  justificado: { bg: "#dbeafe", text: "#1e40af", label: "Justificado" },
}
