import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { financeService } from "@/services/finance.service"
import { COLORS } from "@/lib/constants"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { EstudianteDetalleResponse } from "@/types/estadisticas"

export function EstudianteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [data, setData] = useState<EstudianteDetalleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const desde = searchParams.get("desde") || ""
  const hasta = searchParams.get("hasta") || ""

  useEffect(() => {
    if (!id) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    financeService.getEstadisticasEstudiante(id, { desde, hasta })
      .then((res) => { if (!cancelled) setData(res) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, desde, hasta])

  if (loading) return <div className="flex items-center justify-center h-full text-sm opacity-40">Cargando...</div>
  if (!data) return <div className="flex items-center justify-center h-full text-sm opacity-40">Estudiante no encontrado</div>

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#F4F6FA" }}>
      <header className="shrink-0 px-4 lg:px-8 py-4 border-b bg-white/90 backdrop-blur-md flex items-center gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} style={{ color: COLORS.TEXT_MUTED }} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>{data.estudiante.nombre}</h1>
          <p className="text-[10px] opacity-30">C.I. {data.estudiante.cedula} · {data.periodo.desde} — {data.periodo.hasta}</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-4 lg:px-8 py-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <KPIMini label="Total ingresos" value={`$${data.resumen.total_ingresos.toLocaleString()}`} color="#16a34a" />
          <KPIMini label="Cursos" value={data.resumen.total_cursos.toString()} color={COLORS.CHARCOAL} />
          <KPIMini label="Promedio por curso" value={`$${data.resumen.promedio_por_curso.toLocaleString()}`} color={COLORS.ACCENT} />
        </div>

        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Historial de cursos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Curso</th>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Inscripción</th>
                  <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Estado</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Pagado</th>
                  <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.historial_cursos.map(c => (
                  <tr key={c.id} className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <td className="py-2.5 px-4 font-medium" style={{ color: COLORS.CHARCOAL }}>{c.curso}</td>
                    <td className="py-2.5 px-4 opacity-50">{c.fecha_inscripcion}</td>
                    <td className="py-2.5 px-4">
                      <EstadoBadge estado={c.estado} />
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold" style={{ color: "#16a34a" }}>${c.monto_pagado.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right opacity-60">${c.monto_total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.historial_pagos.length > 0 && (
          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Historial de pagos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Fecha</th>
                    <th className="text-right py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Monto</th>
                    <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Método</th>
                    <th className="text-left py-2 px-4 font-bold opacity-30 uppercase tracking-wider">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {data.historial_pagos.map((p, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <td className="py-2.5 px-4 opacity-50">{p.fecha}</td>
                      <td className="py-2.5 px-4 text-right font-bold" style={{ color: "#16a34a" }}>${p.monto.toLocaleString()}</td>
                      <td className="py-2.5 px-4 opacity-50">{p.metodo}</td>
                      <td className="py-2.5 px-4 opacity-50 font-mono text-[10px]">{p.referencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    activo: { label: "Activo", color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
    completado: { label: "Completado", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    retirado: { label: "Retirado", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
    reprobado: { label: "Reprobado", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
  }
  const s = map[estado] ?? { label: estado, color: "#6b7280", bg: "rgba(107,114,128,0.08)" }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  )
}
