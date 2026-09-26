/* eslint-disable react-hooks/refs */
import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { financeService } from "@/services/finance.service"
import { PeriodoSelector } from "./components/PeriodoSelector"
import { SkeletonEstadisticas } from "./components/SkeletonEstadisticas"
import { ResumenEjecutivo } from "./components/ResumenEjecutivo"
import { FlujoFinanciero } from "./components/FlujoFinanciero"
import { ComposicionIngresos } from "./components/ComposicionIngresos"
import { RendimientoCatalogo } from "./components/RendimientoCatalogo"
import { DistribucionGeografica } from "./components/DistribucionGeografica"
import { ComparativaModalidad } from "./components/ComparativaModalidad"
import { RetencionFidelizacion } from "./components/RetencionFidelizacion"
import { EstadoCobranza } from "./components/EstadoCobranza"
import { ActividadServicios } from "./components/ActividadServicios"
import { PatronesCobro } from "./components/PatronesCobro"
import type { EstadisticasResponse } from "@/types/estadisticas"
import { AlertCircle } from "lucide-react"

function getDefaultDesde(periodo: string): string {
  const now = new Date()
  if (periodo === "trimestre") {
    return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      .toISOString()
      .split("T")[0]
  }
  if (periodo === "este_año") {
    return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
}

export function EstadisticasPage() {
  const [periodo, setPeriodo] = useState("este_mes")
  const [customDesde, setCustomDesde] = useState("")
  const [customHasta, setCustomHasta] = useState("")
  const [fetchDesde, setFetchDesde] = useState(getDefaultDesde("este_mes"))
  const [fetchHasta, setFetchHasta] = useState(new Date().toISOString().split("T")[0])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)
  const seccionesRef = useRef<Map<string, HTMLDivElement>>(new Map())

  const registerRef = (key: string) => (el: HTMLDivElement | null) => {
    if (!el) return
    seccionesRef.current.set(key, el)
  }

  useEffect(() => {
    if (periodo !== "custom") {
      setFetchDesde(getDefaultDesde(periodo))
      setFetchHasta(new Date().toISOString().split("T")[0])
    }
  }, [periodo])

  const applyCustom = (d: string, h: string) => {
    setFetchDesde(d)
    setFetchHasta(h)
  }

  const { data, isLoading, error, refetch } = useQuery<EstadisticasResponse>({
    queryKey: ["estadisticas", fetchDesde, fetchHasta],
    queryFn: () => financeService.getEstadisticas({ desde: fetchDesde, hasta: fetchHasta }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 1,
  })

  if (isLoading && !data) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        <PeriodoSelector
          periodo={periodo}
          setPeriodo={setPeriodo}
          customDesde={customDesde}
          setCustomDesde={setCustomDesde}
          customHasta={customHasta}
          setCustomHasta={setCustomHasta}
          onApply={applyCustom}
          loading={isLoading}
          data={data}
        />
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonEstadisticas />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        <PeriodoSelector
          periodo={periodo}
          setPeriodo={setPeriodo}
          customDesde={customDesde}
          setCustomDesde={setCustomDesde}
          customHasta={customHasta}
          setCustomHasta={setCustomHasta}
          onApply={applyCustom}
          loading={false}
          data={data}
        />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center gap-3">
          <div className="size-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <p className="text-sm font-bold text-slate-800">Error al cargar estadísticas</p>
          <p className="text-xs text-slate-500 max-w-md">
            {(error as Error)?.message || "Error de conexión con el servidor"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        <PeriodoSelector
          periodo={periodo}
          setPeriodo={setPeriodo}
          customDesde={customDesde}
          setCustomDesde={setCustomDesde}
          customHasta={customHasta}
          setCustomHasta={setCustomHasta}
          onApply={applyCustom}
          loading={false}
          data={data}
        />
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-xs font-medium text-slate-400">No hay datos disponibles para este período</p>
        </div>
      </div>
    )
  }

  const m = data.metricas

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-16">
      {/* STICKY TOP TOOLBAR */}
      <PeriodoSelector
        periodo={periodo}
        setPeriodo={setPeriodo}
        customDesde={customDesde}
        setCustomDesde={setCustomDesde}
        customHasta={customHasta}
        setCustomHasta={setCustomHasta}
        onApply={applyCustom}
        loading={isLoading}
        data={data}
      />

      {/* MAIN BODY CONTENT */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SECTION 1 — RESUMEN FINANCIERO (HORIZONTAL KPI STRIP) */}
        <div ref={registerRef("resumen")}>
          <ResumenEjecutivo m={m} />
        </div>

        {/* SECTION 2 — FLUJO FINANCIERO */}
        <div ref={registerRef("flujo")}>
          <FlujoFinanciero
            data={data.ingresos_vs_egresos}
            insightText={data.insight_text}
          />
        </div>

        {/* SECTION 3 & 4 — COMPOSICIÓN DE INGRESOS Y COBROS (2-COLUMN GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div ref={registerRef("composicion")} className="lg:col-span-6 flex flex-col">
            <ComposicionIngresos
              distribucion={data.distribucion_categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              onSelectCategoria={setCategoriaSeleccionada}
            />
          </div>

          <div ref={registerRef("patrones-cobro")} className="lg:col-span-6 flex flex-col">
            <PatronesCobro metodos={data.metodo_pago} dias={data.dias_semana} />
          </div>
        </div>

        {/* SECTION 5 — RENDIMIENTO ACADÉMICO POR MODALIDAD */}
        <div ref={registerRef("modalidad")}>
          <ComparativaModalidad data={data.modalidad} />
        </div>

        {/* SECTION 6 & 7 — ESTUDIANTES TOP Y ESTADO DE COBRANZA (2-COLUMN GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div ref={registerRef("retencion")} className="lg:col-span-6">
            <RetencionFidelizacion topEstudiantes={data.top_estudiantes} />
          </div>

          <div ref={registerRef("cobranza")} className="lg:col-span-6">
            <EstadoCobranza data={data.cobranza} />
          </div>
        </div>

        {/* SECTION 8 — RENDIMIENTO POR CATÁLOGO */}
        <div ref={registerRef("catalogo")}>
          <RendimientoCatalogo data={data.catalogos_top} />
        </div>

        {/* SECTION 9 & 10 — DISTRIBUCIÓN GEOGRÁFICA Y ACTIVIDAD DE SERVICIOS (2-COLUMN GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div ref={registerRef("geografica")} className="lg:col-span-7">
            <DistribucionGeografica data={data.ciudades_top} />
          </div>

          <div ref={registerRef("servicios")} className="lg:col-span-5">
            <ActividadServicios data={data.actividad_servicios} />
          </div>
        </div>
      </div>
    </div>
  )
}
