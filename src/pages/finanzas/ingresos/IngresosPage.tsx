/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react"
import { FileDown } from "lucide-react"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { IngresosKPIs } from "./components/IngresosKPIs"
import { IngresosGraficos } from "./components/IngresosGraficos"
import { IngresosFiltros } from "./components/IngresosFiltros"
import { IngresosTabla } from "./components/IngresosTabla"
import { ExportPDFModal } from "./components/ExportPDFModal"

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
  const [filtros, setFiltros] = useState({
    categoria: "",
    metodo_pago: "",
    search: "",
    fecha_desde: "",
    fecha_hasta: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { per_page: 25, page }
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
      setLastPage(res.last_page || 1)
    } catch {
      toast.error("Error al cargar ingresos")
    } finally {
      setLoading(false)
    }
  }, [filtros, page])

  useEffect(() => {
    setPage(1)
  }, [filtros])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Encabezado Principal de Página (Sin migas de pan Finanzas / Ingresos según lo solicitado) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Ingresos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Monitoreo analítico y reporte de ingresos generados por cursos, servicios y talleres.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setPdfModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs flex items-center gap-2 text-xs font-semibold cursor-pointer group active:scale-95"
              title="Descargar reporte en formato PDF"
            >
              <FileDown
                size={16}
                className="text-slate-500 group-hover:text-[#fd761a] transition-colors"
              />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* 1. Métricas Resumen Bento KPIs */}
        <IngresosKPIs totales={totales} />

        {/* 2. Sección Analítica con Gráficos y Métodos */}
        <IngresosGraficos
          grafico={grafico}
          graficoMetodo={graficoMetodo}
          graficoCategorias={graficoCategorias}
        />

        {/* 3. Panel de Filtros y Búsqueda */}
        <IngresosFiltros
          filtros={filtros}
          onChange={setFiltros}
          analytics={analytics}
        />

        {/* 4. Tabla Detallada de Ingresos con Paginación */}
        <IngresosTabla
          data={data}
          loading={loading}
          page={page}
          lastPage={lastPage}
          onPageChange={setPage}
        />

        {/* Modal de Exportación PDF */}
        <ExportPDFModal
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          data={data}
          totales={totales}
          grafico={grafico}
          graficoCategorias={graficoCategorias}
          filtros={filtros}
        />
      </div>
    </div>
  )
}
