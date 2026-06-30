/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { EstadisticasPeriodo } from "./components/EstadisticasPeriodo"
import { EstadisticasKPIs } from "./components/EstadisticasKPIs"
import { EstadisticasInsights } from "./components/EstadisticasInsights"
import { EstadisticasPrincipal, EstadisticasBento } from "./components/EstadisticasCharts"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

function getDefaultDesde(p: string) {
  const now = new Date()
  if (p === "trimestre") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0]
  if (p === "este_año") return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
}

export function EstadisticasPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [periodo, setPeriodo] = useState("este_mes")
  const [customDesde, setCustomDesde] = useState("")
  const [customHasta, setCustomHasta] = useState("")

  const load = async (d: string, h: string) => {
    setLoading(true)
    try {
      const res = await financeService.getEstadisticas({ desde: d, hasta: h })
      setData(res)
    } catch { toast.error("Error al cargar estadísticas") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (periodo !== "custom") {
      const d = getDefaultDesde(periodo)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load(d, new Date().toISOString().split("T")[0])
    }
  }, [periodo])

  const applyCustom = (d: string, h: string) => { load(d, h) }

  if (loading || !data) {
    return <div className="flex items-center justify-center h-full text-sm opacity-40" style={{ backgroundColor: "#F4F6FA" }}>Cargando estadísticas...</div>
  }

  const m = data.metricas || {}
  const dist = data.distribucion_categorias || data.distribucion_ingresos || []

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#F4F6FA" }}>
      <header className="shrink-0 px-8 py-6 border-b bg-white/90 backdrop-blur-md flex items-center justify-between" style={{ borderColor: BORDER }}>
        <h1 className="text-2xl font-bold tracking-tighter" style={{ color: CHARCOAL }}>Estadísticas</h1>
      </header>

      <div className="flex-1 overflow-auto px-6 lg:px-8 py-6 space-y-5">
        <div className="rounded-2xl bg-white border p-5" style={{ borderColor: BORDER }}>
          <EstadisticasPeriodo periodo={periodo} setPeriodo={setPeriodo}
            customDesde={customDesde} setCustomDesde={setCustomDesde}
            customHasta={customHasta} setCustomHasta={setCustomHasta}
            onApply={applyCustom} />
        </div>

        <EstadisticasInsights distribucion={dist} ingresosVsEgresos={data.ingresos_vs_egresos} />

        <EstadisticasKPIs m={m} />

        <EstadisticasPrincipal data={data.ingresos_vs_egresos} />

        <EstadisticasBento
          distribucion={dist}
          metodoPago={data.metodo_pago}
          diasSemana={data.dias_semana} />
      </div>
    </div>
  )
}
