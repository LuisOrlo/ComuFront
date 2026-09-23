import { TrendingUp, TrendingDown, Users, Building2, Package, Receipt } from "lucide-react"

interface Totales {
  total: number
  personal: number
  servicios: number
  equipos?: number
  varios?: number
  previo_total?: number
  previo_personal?: number
  previo_servicios?: number
  previo_varios?: number
}

export function EgresosKPIs({ totales }: { totales: Totales }) {
  const total = Number(totales.total || 0)
  const personal = Number(totales.personal || 0)
  const servicios = Number(totales.servicios || 0)
  const varios = Number((totales.varios || 0) + (totales.equipos || 0))

  const calcVariation = (actual: number, previo?: number) => {
    if (previo === undefined || previo === null || previo === 0) return null
    const pct = ((actual - previo) / previo) * 100
    return {
      subio: pct > 0,
      pct: Math.abs(Math.round(pct)),
    }
  }

  const varTotal = calcVariation(total, totales.previo_total)

  const pctPersonal = total > 0 ? Math.round((personal / total) * 100) : 0
  const pctServicios = total > 0 ? Math.round((servicios / total) * 100) : 0
  const pctVarios = total > 0 ? Math.round((varios / total) * 100) : 0

  const items = [
    {
      label: "Total Egresado",
      value: total,
      icon: Receipt,
      iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
      footer: varTotal ? (
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${varTotal.subio ? "text-rose-600" : "text-emerald-600"}`}>
          {varTotal.subio ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
          <span>{varTotal.subio ? "+" : "-"}{varTotal.pct}% vs período anterior</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <Receipt size={14} />
          <span>Gasto operativo consolidado</span>
        </div>
      ),
    },
    {
      label: "Personal",
      value: personal,
      icon: Users,
      iconBg: "bg-indigo-50 text-indigo-700 border border-indigo-100",
      footer: personal > 0 ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          <span>{pctPersonal}% de los egresos</span>
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
      icon: Building2,
      iconBg: "bg-amber-50 text-amber-700 border border-amber-100",
      footer: servicios > 0 ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          <span>{pctServicios}% de los egresos</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span>Sin movimientos</span>
        </div>
      ),
    },
    {
      label: "Varios & Equipos",
      value: varios,
      icon: Package,
      iconBg: "bg-slate-100 text-slate-700 border border-slate-200",
      footer: varios > 0 ? (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          <span>{pctVarios}% de los egresos</span>
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
