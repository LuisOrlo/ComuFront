/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyIcon, AiFolderIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE

interface Insight {
  icon: any; title: string; desc: string
}

export function EstadisticasInsights({ distribucion, ingresosVsEgresos }: { distribucion: any[]; ingresosVsEgresos: any[] }) {
  const insights: Insight[] = []

  if (ingresosVsEgresos?.length > 0) {
    const filtered = ingresosVsEgresos.filter((m: any) => m.ingresos > 0)
    if (filtered.length > 0) {
      const best = filtered.reduce((a: any, b: any) => (a.ingresos - a.egresos) > (b.ingresos - b.egresos) ? a : b)
      const [y, m] = (best.mes || "").split("-")
      if (y && m) {
        const monthName = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][parseInt(m)]
        insights.push({ icon: MoneyIcon, title: "Mejor balance mensual", desc: `${monthName} ${y} con $${Number(best.ingresos - best.egresos).toLocaleString()} de balance` })
      }
    }
  }

  if (distribucion?.length > 1) {
    const top = distribucion.reduce((a: any, b: any) => a.value > b.value ? a : b)
    if (top.value > 0) {
      insights.push({ icon: AiFolderIcon, title: "Categoría líder", desc: `${top.name} representa el ${top.porcentaje}% del total de ingresos` })
    }
  }

  if (distribucion?.length > 0) {
    const sinActividad = distribucion.filter((c: any) => c.value === 0)
    if (sinActividad.length > 0) {
      insights.push({ icon: AiFolderIcon, title: "Sin actividad", desc: `${sinActividad[0].name} no tuvo ingresos en este período` })
    }
  }

  if (insights.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {insights.map((ins, i) => (
        <div key={i} className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: BORDER, backgroundColor: "oklch(0.98 0 0)" }}>
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${COLORS.ACCENT}15` }}>
            <HugeiconsIcon icon={ins.icon} size={15} style={{ color: COLORS.ACCENT }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-40">{ins.title}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: COLORS.CHARCOAL }}>{ins.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
