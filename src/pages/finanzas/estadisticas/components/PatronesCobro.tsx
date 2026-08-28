import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { COLORS } from "@/lib/constants"
import type { DiaSemanaItem, MetodoPagoItem } from "@/types/estadisticas"

const PAYMENT_COLORS = ["#16a34a", "#3b82f6", "#f97316", "#8b5cf6"]

export function PatronesCobro({ metodos, dias }: { metodos: MetodoPagoItem[]; dias: DiaSemanaItem[] }) {
  if (!metodos?.length && !dias?.length) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <section className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Métodos de pago</h3>
        {metodos.length > 0 ? <div className="flex items-center gap-3">
          <ResponsiveContainer width="55%" height={210}>
            <PieChart><Pie data={metodos} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>{metodos.map((item, index) => <Cell key={item.name} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />)}</Pie><Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} /></PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">{metodos.map((item, index) => <div key={item.name} className="flex justify-between gap-2 text-xs"><span className="font-medium"><i className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }} />{item.name}</span><span className="font-bold">${item.value.toLocaleString()}</span></div>)}</div>
        </div> : <p className="py-8 text-sm text-gray-400">Sin pagos registrados.</p>}
      </section>
      <section className="rounded-2xl border bg-white p-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-40">Cobros por día</h3>
        {dias.length > 0 ? <ResponsiveContainer width="100%" height={210}><BarChart data={dias}><XAxis dataKey="dia" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `$${value}`} /><Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="py-8 text-sm text-gray-400">Sin cobros registrados.</p>}
      </section>
    </div>
  )
}
