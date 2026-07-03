/* eslint-disable react-hooks/set-state-in-effect */
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
import { COLORS } from "@/lib/constants"
import type { EstadisticasResponse } from "@/types/estadisticas"

const BG = "#F4F6FA"

function getDefaultDesde(periodo: string): string {
  const now = new Date()
  if (periodo === "trimestre") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0]
  if (periodo === "este_año") return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
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
      <div className="flex flex-col h-full" style={{ backgroundColor: BG }}>
        <PeriodoSelector
          periodo={periodo} setPeriodo={setPeriodo}
          customDesde={customDesde} setCustomDesde={setCustomDesde}
          customHasta={customHasta} setCustomHasta={setCustomHasta}
          onApply={applyCustom} seccionesRef={seccionesRef}
          loading={isLoading} data={data}
        />
        <div className="flex-1 overflow-auto">
          <SkeletonEstadisticas />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: BG }}>
        <PeriodoSelector
          periodo={periodo} setPeriodo={setPeriodo}
          customDesde={customDesde} setCustomDesde={setCustomDesde}
          customHasta={customHasta} setCustomHasta={setCustomHasta}
          onApply={applyCustom} seccionesRef={seccionesRef}
          loading={false} data={data}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm opacity-40">Error al cargar estadísticas</p>
          <p className="text-xs opacity-25 max-w-md text-center">{(error as Error)?.message || "Error de conexión con el servidor"}</p>
          <button onClick={() => refetch()} className="px-4 py-1.5 rounded-xl text-[10px] font-bold text-white" style={{ backgroundColor: COLORS.ACCENT }}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: BG }}>
        <PeriodoSelector
          periodo={periodo} setPeriodo={setPeriodo}
          customDesde={customDesde} setCustomDesde={setCustomDesde}
          customHasta={customHasta} setCustomHasta={setCustomHasta}
          onApply={applyCustom} seccionesRef={seccionesRef}
          loading={false} data={data}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm opacity-40">No hay datos disponibles</p>
        </div>
      </div>
    )
  }

  const m = data.metricas

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: BG }}>
      <PeriodoSelector
        periodo={periodo} setPeriodo={setPeriodo}
        customDesde={customDesde} setCustomDesde={setCustomDesde}
        customHasta={customHasta} setCustomHasta={setCustomHasta}
        onApply={applyCustom} seccionesRef={seccionesRef}
        loading={isLoading} data={data}
      />

      <div className="flex-1 overflow-auto px-4 lg:px-8 py-6 space-y-5">
        <div ref={registerRef("resumen")}>
          <ResumenEjecutivo m={m} />
        </div>

        <div ref={registerRef("flujo")}>
          <FlujoFinanciero data={data.ingresos_vs_egresos} insightText={data.insight_text} />
        </div>

        <div ref={registerRef("composicion")}>
          <ComposicionIngresos
            distribucion={data.distribucion_categorias}
            categoriaSeleccionada={categoriaSeleccionada}
            onSelectCategoria={setCategoriaSeleccionada}
          />
        </div>

        <div ref={registerRef("catalogo")}>
          <RendimientoCatalogo data={data.catalogos_top} />
        </div>

        <div ref={registerRef("geografica")}>
          <DistribucionGeografica data={data.ciudades_top} />
        </div>

        <div ref={registerRef("modalidad")}>
          <ComparativaModalidad data={data.modalidad} />
        </div>

        <div ref={registerRef("retencion")}>
          <RetencionFidelizacion metricas={m} topEstudiantes={data.top_estudiantes} />
        </div>

        <div ref={registerRef("cobranza")}>
          <EstadoCobranza data={data.cobranza} />
        </div>

        <div ref={registerRef("servicios")}>
          <ActividadServicios data={data.actividad_servicios} />
        </div>
      </div>
    </div>
  )
}
