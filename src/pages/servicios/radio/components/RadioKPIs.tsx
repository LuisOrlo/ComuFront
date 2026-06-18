import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Money01Icon, Time02Icon, UserIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { ReservaRadio } from "@/services/radio.service"

export function RadioKPIs({ reservas }: { reservas: ReservaRadio[] }) {
  const hoy = new Date().toISOString().split("T")[0]
  const hoyReservas = reservas.filter(r => r.fecha_reserva === hoy)
  const totalHoy = hoyReservas.length
  const ingresosHoy = hoyReservas.reduce((sum, r) => sum + r.precio_total, 0)
  const enProgreso = reservas.filter(r => r.estado === "en_progreso" || r.estado === "confirmado").length
  const conOperador = reservas.filter(r => r.incluye_operador && r.operador).length

  const items = [
    { icon: Calendar03Icon, label: "Reservas hoy", value: totalHoy, color: COLORS.ACCENT },
    { icon: Money01Icon, label: "Ingresos hoy", value: `$${ingresosHoy.toFixed(2)}`, color: "oklch(0.6 0.18 160)" },
    { icon: Time02Icon, label: "En progreso", value: enProgreso, color: "oklch(0.6 0.18 220)" },
    { icon: UserIcon, label: "Con operador", value: conOperador, color: "oklch(0.6 0.18 40)" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border bg-white p-5 flex items-center gap-4 shadow-sm"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
            <HugeiconsIcon icon={item.icon} size={20} style={{ color: item.color }} />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
              {item.value}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-40 truncate">
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
