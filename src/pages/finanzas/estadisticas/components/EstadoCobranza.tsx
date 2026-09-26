import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { Cobranza } from "@/types/estadisticas"

const GREEN = "#10b981"
const ORANGE = "#fd761a"

export function EstadoCobranza({ data }: { data: Cobranza | null }) {
  if (!data) return null

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Estado de cobranza</h2>
          <p className="text-xs text-slate-500">
            Seguimiento de morosidad y cumplimiento de pagos por estudiante y catálogo
          </p>
        </div>
      </div>

      {/* 3-column summary strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50/70 border border-slate-200/70 p-3 sm:p-4 text-center">
        <div className="px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total estudiantes
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {data.total_estudiantes}
          </span>
        </div>
        <div className="px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#fd761a] block mb-1">
            Debe al menos 1 pago
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#fd761a] tabular-nums">
            {data.deben_al_menos_un_pago}
          </span>
        </div>
        <div className="px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-1">
            Debe todos los pagos
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-red-600 tabular-nums">
            {data.deben_todos_los_pagos}
          </span>
        </div>
      </div>

      {/* Distribución por catálogo */}
      {data.distribucion_por_catalogo?.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Distribución de cobranza por catálogo
          </h4>
          <ResponsiveContainer
            width="100%"
            height={Math.max(data.distribucion_por_catalogo.length * 48, 160)}
          >
            <BarChart
              data={data.distribucion_por_catalogo}
              layout="vertical"
              margin={{ left: 80, right: 20 }}
            >
              <XAxis
                type="number"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fontSize: 11, fill: "#334155" }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "0.5rem",
                  border: "none",
                  color: "#fff",
                  fontSize: "11px",
                  padding: "6px 10px",
                }}
              />
              <Bar dataKey="al_dia" fill={GREEN} stackId="a" name="Al día" radius={[0, 0, 0, 0]} />
              <Bar dataKey="deben" fill={ORANGE} stackId="a" name="Deben" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
