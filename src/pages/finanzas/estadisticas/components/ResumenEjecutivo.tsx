import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  Wallet01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Metricas } from "@/types/estadisticas"
import { cn } from "@/lib/utils"

function VariacionPill({ value }: { value: number | string | null }) {
  if (value === null || value === undefined || value === "—") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-400">
        —
      </span>
    )
  }
  const n = typeof value === "string" ? parseFloat(value) : value
  const positivo = n >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border",
        positivo
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      )}
    >
      <HugeiconsIcon icon={positivo ? ArrowUpRightIcon : ArrowDownRightIcon} size={12} />
      {n > 0 ? "+" : ""}
      {n}%
    </span>
  )
}

export function ResumenEjecutivo({ m }: { m: Metricas }) {
  const format = (v: number) =>
    "$" +
    Math.abs(v).toLocaleString("es-EC", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  const balanceSigno = m.balance >= 0 ? "+" : "\u2212"

  return (
    <section className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {/* Col 1: Ingresos */}
        <div className="p-5 flex flex-col justify-between space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              INGRESOS
            </span>
            <span className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {format(m.ingresos)}
              </span>
              <VariacionPill value={m.vs_periodo_anterior} />
            </div>
            <p className="text-xs text-slate-500">
              {m.vs_periodo_anterior !== null && m.vs_periodo_anterior !== undefined
                ? "vs. período anterior"
                : "Recaudación bruta del período"}
            </p>
          </div>
        </div>

        {/* Col 2: Egresos */}
        <div className="p-5 flex flex-col justify-between space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              EGRESOS
            </span>
            <span className="size-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center border border-orange-100">
              <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {format(m.egresos)}
              </span>
            </div>
            <p className="text-xs text-slate-500">Gasto operativo y desembolsos</p>
          </div>
        </div>

        {/* Col 3: Balance Neto */}
        <div
          className={cn(
            "p-5 flex flex-col justify-between space-y-3",
            m.balance >= 0 ? "bg-slate-50/70" : "bg-red-50/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              BALANCE NETO
            </span>
            <span className="size-7 rounded-lg bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs">
              <HugeiconsIcon icon={Wallet01Icon} size={15} />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className={cn(
                  "text-2xl sm:text-3xl font-black tracking-tight tabular-nums",
                  m.balance >= 0 ? "text-slate-900" : "text-red-600"
                )}
              >
                {balanceSigno}
                {format(m.balance)}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-bold",
                  m.balance >= 0
                    ? "bg-[#fd761a] text-white"
                    : "bg-red-600 text-white"
                )}
              >
                {m.balance >= 0 ? "Óptimo" : "Déficit"}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Margen operativo:{" "}
              <span className="font-bold text-slate-900">{m.margen_neto}%</span>
            </p>
          </div>
        </div>

        {/* Col 4: Estudiantes Matriculados */}
        <div className="p-5 flex flex-col justify-between space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ESTUDIANTES MATRICULADOS
            </span>
            <span className="size-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60">
              <HugeiconsIcon icon={UserGroupIcon} size={15} />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {m.estudiantes_matriculados}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Activos
              </span>
            </div>
            <p className="text-xs text-slate-500">Matrículas e inscripciones vigentes</p>
          </div>
        </div>
      </div>
    </section>
  )
}
