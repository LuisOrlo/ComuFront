const COLORS: Record<string, string> = {
  deudor: "text-red-700 bg-red-100 border-red-200",
  abonado: "text-amber-700 bg-amber-100 border-amber-200",
  al_dia: "text-emerald-700 bg-emerald-100 border-emerald-200",
  ninguno: "text-gray-500 bg-gray-100 border-gray-200",
}

const labels: Record<string, string> = {
  deudor: "Pendiente",
  abonado: "Abono parcial",
  al_dia: "Al dia",
  ninguno: "Sin cursos",
}

export function FinancialStatusBadge({ status }: { status: string }) {
  const colors = COLORS[status] ?? COLORS.ninguno
  const label = labels[status] ?? status

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${colors}`}>
      <span className={`size-1.5 rounded-full ${status === 'deudor' ? 'bg-red-500' : status === 'abonado' ? 'bg-amber-500' : status === 'al_dia' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {label}
    </span>
  )
}

export function FinancialStatusBadgeSmall({ status }: { status: string }) {
  const colors = COLORS[status] ?? COLORS.ninguno

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colors}`}>
      <span className={`size-1 rounded-full ${status === 'deudor' ? 'bg-red-500' : status === 'abonado' ? 'bg-amber-500' : status === 'al_dia' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    </span>
  )
}
