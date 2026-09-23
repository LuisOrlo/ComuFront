import { TrendingUp, TrendingDown, Wallet, GraduationCap, Mic, Wrench } from "lucide-react"

interface KPIData {
  total: number
  cursos: number
  servicios: number
  otros: number
  talleres?: number
  previo_total?: number
  previo_cursos?: number
  previo_servicios?: number
  previo_otros?: number
}

export function IngresosKPIs({ totales }: { totales: KPIData }) {
  const total = Number(totales.total || 0)
  const cursos = Number(totales.cursos || 0)
  const servicios = Number(totales.servicios || 0)
  const talleres = Number(totales.talleres || 0)

  // Variación del total vs período anterior
  const calcVariation = (actual: number, previo?: number) => {
    if (previo === undefined || previo === null || previo === 0) return null
    const pct = ((actual - previo) / previo) * 100
    return {
      subio: pct >= 0,
      pct: Math.abs(Math.round(pct)),
    }
  }

  const varTotal = calcVariation(total, totales.previo_total)

  // Proporciones sobre el total
  const pctCursos = total > 0 ? Math.round((cursos / total) * 100) : 0
  const pctServicios = total > 0 ? Math.round((servicios / total) * 100) : 0
  const pctTalleres = total > 0 ? Math.round((talleres / total) * 100) : 0

  const items = [
    {
      label: "Total Ingresado",
      value: total,
      icon: Wallet,
      iconBg: "bg-orange-50 text-[#fd761a] border border-orange-100",
      footer: varTotal ? (
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${varTotal.subio ? "text-emerald-600" : "text-rose-600"}`}>
          {varTotal.subio ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          <span>{varTotal.subio ? "+" : "-"}{varTotal.pct}% vs período anterior</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <TrendingUp size={15} />
          <span>Flujo de caja activo</span>
        </div>
      ),
    },
    {
      label: "Cursos",
      value: cursos,
      icon: GraduationCap,
      iconBg: "bg-blue-50 text-blue-700 border border-blue-100",
      footer: cursos > 0 ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#fd761a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]"></span>
          <span>{pctCursos}% de la facturación</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span>Sin movimientos</span>
        </div>
      ),
    },
    {
      label: "Servicios",
      value: servicios,
      icon: Mic,
      iconBg: "bg-purple-50 text-purple-700 border border-purple-100",
      footer: servicios > 0 ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          <span>{pctServicios}% de la facturación</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span>Sin movimientos</span>
        </div>
      ),
    },
    {
      label: "Talleres",
      value: talleres,
      icon: Wrench,
      iconBg: "bg-cyan-50 text-cyan-700 border border-cyan-100",
      footer: talleres > 0 ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
          <span>{pctTalleres}% de la facturación</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span>Sin movimientos</span>
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
                ${item.value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {item.footer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
