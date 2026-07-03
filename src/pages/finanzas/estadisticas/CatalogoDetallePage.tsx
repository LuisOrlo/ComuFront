import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { financeService } from "@/services/finance.service"
import { COLORS } from "@/lib/constants"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { CatalogoDetalleResponse } from "@/types/estadisticas"

export function CatalogoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [data, setData] = useState<CatalogoDetalleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const desde = searchParams.get("desde") || ""
  const hasta = searchParams.get("hasta") || ""

  useEffect(() => {
    if (!id) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    financeService.getEstadisticasCatalogo(id, { desde, hasta })
      .then((res) => { if (!cancelled) setData(res) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, desde, hasta])

  if (loading) return <div className="flex items-center justify-center h-full text-sm opacity-40">Cargando...</div>
  if (!data) return <div className="flex items-center justify-center h-full text-sm opacity-40">Catálogo no encontrado</div>

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#F4F6FA" }}>
      <header className="shrink-0 px-4 lg:px-8 py-4 border-b bg-white/90 backdrop-blur-md flex items-center gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} style={{ color: COLORS.TEXT_MUTED }} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>{data.catalogo.nombre}</h1>
          <p className="text-[10px] opacity-30">{data.periodo.desde} — {data.periodo.hasta}</p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs opacity-50">
          <span>{data.catalogo.ofertas} ofertas</span>
          <span>{data.catalogo.estudiantes} estudiantes</span>
          <span>Retención {data.retencion}%</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 lg:px-8 py-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIMini label="Ingreso total" value={`$${data.catalogo.ingreso.toLocaleString()}`} color="#16a34a" />
          <KPIMini label="Ocupación" value={`${data.catalogo.ocupacion_pct}%`} color={data.catalogo.ocupacion_pct >= 70 ? "#16a34a" : "#f97316"} />
          <KPIMini label="Aprobación" value={`${data.catalogo.aprobacion_pct}%`} color={data.catalogo.aprobacion_pct >= 70 ? "#16a34a" : "#f97316"} />
          <KPIMini label="Retención" value={`${data.retencion}%`} color={COLORS.ACCENT} />
        </div>

        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3">Evolución mensual</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.evolucion_mensual}>
              <XAxis dataKey={(d: { mes: string }) => d.mes?.substring(5)} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `$${Number(v ?? 0).toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ingresos" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Ingresos" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Ofertas del período</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Instancia</th>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Semestre</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Estud.</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Ocup.</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Aprob.</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {data.ofertas.map(o => (
                  <tr key={o.id} className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <td className="py-2.5 px-4 font-medium" style={{ color: COLORS.CHARCOAL }}>{o.nombre_instancia}</td>
                    <td className="py-2.5 px-4 opacity-50">{o.semestre}</td>
                    <td className="py-2.5 px-4 text-right font-medium">{o.estudiantes}</td>
                    <td className="py-2.5 px-4 text-right" style={{ color: o.ocupacion_pct >= 70 ? "#16a34a" : "#f97316" }}>{o.ocupacion_pct}%</td>
                    <td className="py-2.5 px-4 text-right" style={{ color: o.aprobacion_pct >= 70 ? "#16a34a" : "#f97316" }}>{o.aprobacion_pct}%</td>
                    <td className="py-2.5 px-4 text-right font-bold" style={{ color: "#16a34a" }}>${o.ingreso.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPIMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-30 mb-0.5">{label}</p>
      <span className="text-xl font-black" style={{ color }}>{value}</span>
    </div>
  )
}
