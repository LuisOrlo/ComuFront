/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { IngresosKPIs } from "./components/IngresosKPIs"
import { IngresosGraficos } from "./components/IngresosGraficos"
import { IngresosFiltros } from "./components/IngresosFiltros"
import { IngresosTabla } from "./components/IngresosTabla"
import { IngresosAnalisis } from "./components/IngresosAnalisis"
import { ExportPDFModal } from "./components/ExportPDFModal"

const BORDER = COLORS.BORDER_SUBTLE
const CHARCOAL = COLORS.CHARCOAL

export function IngresosPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [totales, setTotales] = useState<any>({})
  const [grafico, setGrafico] = useState<any[]>([])
  const [graficoMetodo, setGraficoMetodo] = useState<any[]>([])
  const [graficoCategorias, setGraficoCategorias] = useState<any[]>([])
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [sortCol, setSortCol] = useState("fecha_pago")
  const [sortDir, setSortDir] = useState("desc")
  const [filtros, setFiltros] = useState({ categoria: "", metodo_pago: "", search: "", fecha_desde: "", fecha_hasta: "" })

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p, per_page: 25, order_by: sortCol, order_dir: sortDir }
      if (filtros.categoria) params.categoria = filtros.categoria
      if (filtros.metodo_pago) params.metodo_pago = filtros.metodo_pago
      if (filtros.search) params.search = filtros.search
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta
      const res = await financeService.getIngresos(params)
      setData(res.data || [])
      setTotales(res.totales || {})
      setGrafico(res.grafico || [])
      setGraficoMetodo(res.grafico_metodo || [])
      setGraficoCategorias(res.grafico_categorias || [])
      setAnalytics(res.analytics || null)
      setPage(res.current_page || 1)
      setLastPage(res.last_page || 1)
    } catch { toast.error("Error al cargar ingresos") }
    finally { setLoading(false) }
  }, [filtros, sortCol, sortDir])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("desc") }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 flex items-center justify-between" style={{ borderColor: BORDER }}>
        <h1 className="text-2xl font-bold tracking-tighter" style={{ color: CHARCOAL }}>Ingresos</h1>
        <button onClick={() => setPdfModalOpen(true)}
          className="px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1"
          style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}12` }}>
          <HugeiconsIcon icon={Download01Icon} size={14} /> Exportar PDF
        </button>
      </header>
      <div className="flex-1 overflow-auto px-8 py-6 space-y-5">
        <IngresosKPIs totales={totales} />
        <IngresosGraficos grafico={grafico} graficoMetodo={graficoMetodo} graficoCategorias={graficoCategorias} />
        <IngresosAnalisis analytics={analytics} />
        <IngresosFiltros filtros={filtros} onChange={setFiltros} />
        <IngresosTabla data={data} loading={loading} page={page} lastPage={lastPage}
          onPageChange={(p) => load(p)} onSort={handleSort} sortCol={sortCol} sortDir={sortDir} />
        <ExportPDFModal isOpen={pdfModalOpen} onClose={() => setPdfModalOpen(false)}
          data={data} totales={totales} grafico={grafico} graficoCategorias={graficoCategorias} filtros={filtros} />
      </div>
    </div>
  )
}
