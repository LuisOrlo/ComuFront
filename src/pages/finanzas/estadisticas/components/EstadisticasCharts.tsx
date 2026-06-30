/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart } from "recharts"
import { COLORS } from "@/lib/constants"

const BORDER = COLORS.BORDER_SUBTLE
const GREEN = "#16a34a"
const ORANGE = "#f97316"
const BLUE = "#3b82f6"
const CAT_COLORS = ["#16a34a", "#3b82f6", "#f97316", "#a855f7", "#eab308", "#06b6d4", "#ec4899", "#8b5cf6"]
const MET_COLORS = ["#16a34a", "#3b82f6", "#a855f7"]

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
      <h3 className="text-xs font-bold uppercase tracking-wider opacity-40 mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function EstadisticasPrincipal({ data }: { data: any[] }) {
  if (!data?.length) return null
  return (
    <ChartBox title="Ingresos vs Egresos (12 meses)">
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data.map((d: any) => ({ ...d, mes: d.mes?.substring(5) }))}>
          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="ingresos" fill={GREEN} radius={[4, 4, 0, 0]} name="Ingresos" />
          <Bar dataKey="egresos" fill={ORANGE} radius={[4, 4, 0, 0]} name="Egresos" />
          <Line type="monotone" dataKey={(d: any) => d.ingresos - d.egresos} stroke={BLUE} strokeWidth={2} dot name="Balance" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartBox>
  )
}

export function EstadisticasBento({ distribucion, metodoPago, diasSemana }: {
  distribucion: any[]; metodoPago: any[]; diasSemana: any[]
}) {
  if (!distribucion?.length && !metodoPago?.length) return null

  const hasDist = distribucion?.length > 0
  const hasMetodo = metodoPago?.length > 0
  const hasDias = diasSemana?.length > 0
  if (!hasDist && !hasMetodo && !hasDias) return null

  const cols = hasMetodo && hasDias ? 3 : hasMetodo || hasDias ? 2 : 1

  return (
    <div className={`grid grid-cols-1 ${cols >= 2 ? "lg:grid-cols-2" : ""} ${cols >= 3 ? "xl:grid-cols-3" : ""} gap-5`}>
      {hasDist && (
        <ChartBox title="Distribución por Categoría">
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={distribucion} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                label={({ name, porcentaje }: any) => `${name} ${porcentaje}%`}>
                {distribucion.map((_: any, i: number) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
      {hasMetodo && (
        <ChartBox title="Por Método de Pago">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={metodoPago} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {metodoPago.map((_: any, i: number) => <Cell key={i} fill={MET_COLORS[i % MET_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
      {hasDias && (
        <ChartBox title="Actividad por Día">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={diasSemana}>
              <XAxis dataKey="dia" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              <Bar dataKey="value" fill={BLUE} radius={[4, 4, 0, 0]} name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
    </div>
  )
}
