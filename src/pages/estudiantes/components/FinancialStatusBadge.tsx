const COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  deudor: { bg: "#ffdbca", text: "#783200", dot: "#fd761a" },
  abonado: { bg: "#fff3d6", text: "#8a5a00", dot: "#d97706" },
  al_dia: { bg: "#dff8ed", text: "#005236", dot: "#009668" },
  ninguno: { bg: "#eff4ff", text: "#45464d", dot: "#76777d" },
}

const labels: Record<string, string> = {
  deudor: "Pendiente",
  abonado: "Abono parcial",
  al_dia: "Al dia",
  ninguno: "Sin actividad",
}

export function FinancialStatusBadge({ status }: { status: string }) {
  const colors = COLORS[status] ?? COLORS.ninguno
  const label = labels[status] ?? status

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ backgroundColor: colors.bg, color: colors.text }}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
      {label}
    </span>
  )
}

export function FinancialStatusBadgeSmall({ status }: { status: string }) {
  const colors = COLORS[status] ?? COLORS.ninguno

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: colors.bg, color: colors.text }}>
      <span className="size-1 rounded-full" style={{ backgroundColor: colors.dot }} />
    </span>
  )
}
