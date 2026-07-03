import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { COLORS } from "@/lib/constants"
import type { Cobranza } from "@/types/estadisticas"

const GREEN = "#16a34a"
const ORANGE = "#f97316"

export function EstadoCobranza({ data }: { data: Cobranza | null }) {
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-5 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">Total estudiantes</p>
          <span className="text-3xl font-black" style={{ color: COLORS.CHARCOAL }}>{data.total_estudiantes}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "rgba(249,115,22,0.04)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">Debe al menos un pago</p>
          <span className="text-3xl font-black" style={{ color: ORANGE }}>{data.deben_al_menos_un_pago}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "rgba(220,38,38,0.04)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">Debe todos los pagos</p>
          <span className="text-3xl font-black" style={{ color: "#dc2626" }}>{data.deben_todos_los_pagos}</span>
        </div>
      </div>

      {data.distribucion_por_catalogo?.length > 0 && (
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-3">Distribución por catálogo</h4>
          <ResponsiveContainer width="100%" height={Math.max(data.distribucion_por_catalogo.length * 50, 150)}>
            <BarChart data={data.distribucion_por_catalogo} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="al_dia" fill={GREEN} stackId="a" name="Al día" radius={[0, 0, 0, 0]} />
              <Bar dataKey="deben" fill={ORANGE} stackId="a" name="Deben" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
