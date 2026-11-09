/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react"
import { FileDown, Building2, GraduationCap, Clapperboard } from "lucide-react"
import { cn } from "@/lib/utils"
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
  const [unidadNegocio, setUnidadNegocio] = useState<"todos" | "academia" | "servicios">("todos")
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
      if (unidadNegocio !== "todos") params.unidad_negocio = unidadNegocio
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
  }, [filtros, page, unidadNegocio])

  const handleUnidadChange = (nuevaUnidad: "todos" | "academia" | "servicios") => {
    setUnidadNegocio(nuevaUnidad)
    setFiltros(prev => ({ ...prev, categoria: "" }))
    setPage(1)
  }

  const handleFiltrosChange = useCallback((newFiltros: any) => {
    setFiltros(newFiltros)
    setPage(1)
  }, [])

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

        {/* Selector de Unidad de Negocio (Macro-Filtro de Empresa) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs w-fit">
          <button
            type="button"
            onClick={() => handleUnidadChange("todos")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              unidadNegocio === "todos"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            )}
          >
            <Building2 size={15} />
            <span>Consolidado</span>
            {totales.total != null && (
              <span
                className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-semibold",
                  unidadNegocio === "todos"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                ${Number(totales.total || 0).toLocaleString("es-EC", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleUnidadChange("academia")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              unidadNegocio === "academia"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            )}
          >
            <GraduationCap size={15} />
            <span>Academia & Formación</span>
            {totales.academia_total != null && (
              <span
                className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-semibold",
                  unidadNegocio === "academia"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-blue-700"
                )}
              >
                ${Number(totales.academia_total || 0).toLocaleString("es-EC", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleUnidadChange("servicios")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              unidadNegocio === "servicios"
                ? "bg-[#fd761a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            )}
          >
            <Clapperboard size={15} />
            <span>Servicios & Productora</span>
            {totales.servicios_total != null && (
              <span
                className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-semibold",
                  unidadNegocio === "servicios"
                    ? "bg-white/20 text-white"
                    : "bg-orange-50 text-[#fd761a]"
                )}
              >
                ${Number(totales.servicios_total || 0).toLocaleString("es-EC", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </button>
        </div>

        {/* 1. Métricas Resumen Bento KPIs */}
        <IngresosKPIs totales={totales} unidadNegocio={unidadNegocio} />

        {/* 2. Sección Analítica con Gráficos y Métodos */}
        <IngresosGraficos
          grafico={grafico}
          graficoMetodo={graficoMetodo}
          graficoCategorias={graficoCategorias}
        />

        {/* 3. Panel de Filtros y Búsqueda */}
        <IngresosFiltros
          filtros={filtros}
          onChange={handleFiltrosChange}
          analytics={analytics}
          unidadNegocio={unidadNegocio}
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
