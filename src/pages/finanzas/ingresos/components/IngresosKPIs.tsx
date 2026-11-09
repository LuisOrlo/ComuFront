import {
  TrendingUp,
  TrendingDown,
  Wallet,
  GraduationCap,
  Mic,
  Wrench,
  BookOpen,
  UserCheck,
  Clapperboard,
  Building2,
  Video,
} from "lucide-react"

interface KPIData {
  total: number
  cursos: number
  servicios: number
  otros: number
  talleres?: number
  academia_total?: number
  servicios_total?: number
  previo_total?: number
  previo_cursos?: number
  previo_servicios?: number
  previo_otros?: number
  academia_breakdown?: {
    cursos_regulares?: number
    cursos_personalizados?: number
    talleres?: number
  }
  servicios_breakdown?: {
    podcast?: number
    aulas?: number
    sets?: number
    equipos?: number
    radio?: number
    edicion?: number
    streaming?: number
    produccion?: number
  }
}

interface Props {
  totales: KPIData
  unidadNegocio?: "todos" | "academia" | "servicios"
}

export function IngresosKPIs({ totales, unidadNegocio = "todos" }: Props) {
  const total = Number(totales.total || 0)
  const cursos = Number(totales.cursos || 0)
  const servicios = Number(totales.servicios || 0)
  const talleres = Number(totales.talleres || 0)
  const academiaTotal = Number(totales.academia_total ?? cursos + talleres)
  const serviciosTotal = Number(totales.servicios_total ?? servicios)

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

  // Sub-métricas para Academia
  const cursosRegulares = Number(totales.academia_breakdown?.cursos_regulares ?? (cursos - Number(totales.academia_breakdown?.cursos_personalizados || 0)))
  const cursosPersonalizados = Number(totales.academia_breakdown?.cursos_personalizados || 0)

  // Sub-métricas para Servicios
  const sb = totales.servicios_breakdown || {}
  const podcastYRadio = Number(sb.podcast || 0) + Number(sb.radio || 0)
  const aulasYSets = Number(sb.aulas || 0) + Number(sb.sets || 0)
  const audiovisual = Number(sb.equipos || 0) + Number(sb.streaming || 0) + Number(sb.edicion || 0) + Number(sb.produccion || 0)

  let items: Array<{
    label: string
    value: number
    icon: typeof Wallet
    iconBg: string
    footer: React.ReactNode
  }>

  if (unidadNegocio === "academia") {
    const pctReg = academiaTotal > 0 ? Math.round((cursosRegulares / academiaTotal) * 100) : 0
    const pctPers = academiaTotal > 0 ? Math.round((cursosPersonalizados / academiaTotal) * 100) : 0
    const pctTal = academiaTotal > 0 ? Math.round((talleres / academiaTotal) * 100) : 0

    items = [
      {
        label: "Total Academia",
        value: academiaTotal,
        icon: GraduationCap,
        iconBg: "bg-blue-50 text-blue-700 border border-blue-100",
        footer: (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>Cursos y talleres activos</span>
          </div>
        ),
      },
      {
        label: "Cursos Regulares",
        value: cursosRegulares,
        icon: BookOpen,
        iconBg: "bg-indigo-50 text-indigo-700 border border-indigo-100",
        footer: cursosRegulares > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            <span>{pctReg}% del total academia</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
      {
        label: "Cursos Personalizados",
        value: cursosPersonalizados,
        icon: UserCheck,
        iconBg: "bg-violet-50 text-violet-700 border border-violet-100",
        footer: cursosPersonalizados > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
            <span>{pctPers}% del total academia</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
      {
        label: "Talleres / Workshops",
        value: talleres,
        icon: Wrench,
        iconBg: "bg-amber-50 text-amber-700 border border-amber-100",
        footer: talleres > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>{pctTal}% del total academia</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
    ]
  } else if (unidadNegocio === "servicios") {
    const pctMedia = serviciosTotal > 0 ? Math.round((podcastYRadio / serviciosTotal) * 100) : 0
    const pctSpaces = serviciosTotal > 0 ? Math.round((aulasYSets / serviciosTotal) * 100) : 0
    const pctAv = serviciosTotal > 0 ? Math.round((audiovisual / serviciosTotal) * 100) : 0

    items = [
      {
        label: "Total Servicios",
        value: serviciosTotal,
        icon: Clapperboard,
        iconBg: "bg-orange-50 text-[#fd761a] border border-orange-100",
        footer: (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#fd761a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]"></span>
            <span>Productora y alquileres</span>
          </div>
        ),
      },
      {
        label: "Podcast & Radio",
        value: podcastYRadio,
        icon: Mic,
        iconBg: "bg-rose-50 text-rose-700 border border-rose-100",
        footer: podcastYRadio > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            <span>{pctMedia}% de servicios</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
      {
        label: "Aulas & Sets",
        value: aulasYSets,
        icon: Building2,
        iconBg: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        footer: aulasYSets > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>{pctSpaces}% de servicios</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
      {
        label: "Equipos & Producción",
        value: audiovisual,
        icon: Video,
        iconBg: "bg-cyan-50 text-cyan-700 border border-cyan-100",
        footer: audiovisual > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
            <span>{pctAv}% de servicios</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
    ]
  } else {
    // Consolidado General
    const pctAcad = total > 0 ? Math.round((academiaTotal / total) * 100) : 0
    const pctServ = total > 0 ? Math.round((serviciosTotal / total) * 100) : 0

    items = [
      {
        label: "Total Empresa",
        value: total,
        icon: Wallet,
        iconBg: "bg-slate-100 text-slate-800 border border-slate-200",
        footer: varTotal ? (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${varTotal.subio ? "text-emerald-600" : "text-rose-600"}`}>
            {varTotal.subio ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            <span>{varTotal.subio ? "+" : "-"}{varTotal.pct}% vs mes anterior</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp size={15} />
            <span>Flujo de caja activo</span>
          </div>
        ),
      },
      {
        label: "Academia (Cursos + Talleres)",
        value: academiaTotal,
        icon: GraduationCap,
        iconBg: "bg-blue-50 text-blue-700 border border-blue-100",
        footer: academiaTotal > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>{pctAcad}% de la facturación global</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
      {
        label: "Servicios & Productora",
        value: serviciosTotal,
        icon: Clapperboard,
        iconBg: "bg-orange-50 text-[#fd761a] border border-orange-100",
        footer: serviciosTotal > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#fd761a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]"></span>
            <span>{pctServ}% de la facturación global</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
      {
        label: "Talleres Independientes",
        value: talleres,
        icon: Wrench,
        iconBg: "bg-cyan-50 text-cyan-700 border border-cyan-100",
        footer: talleres > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
            <span>{Math.round((talleres / (total || 1)) * 100)}% del total</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Sin movimientos</div>
        ),
      },
    ]
  }

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
                ${item.value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {item.footer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
