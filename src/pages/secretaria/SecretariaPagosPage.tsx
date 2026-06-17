import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  MoneyIcon,
  DollarCircleIcon,
  CheckmarkCircleIcon,
  ClockIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService, type CuentaCobrar } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 8 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "100%" : "55%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaPagosPage() {
  const [cuentas, setCuentas] = useState<CuentaCobrar[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")

  useEffect(() => {
    const params: Record<string, unknown> = {}
    if (search) params.search = search
    if (estadoFilter) params.estado = estadoFilter
    secretariaService.getCuentas(params)
      .then((res) => setCuentas(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, estadoFilter])

  const pendientes = cuentas.filter((c) => c.estado === "pendiente").length
  const pagados = cuentas.filter((c) => c.estado === "pagado").length
  const montoPendiente = cuentas
    .filter((c) => c.estado !== "pagado" && c.estado !== "anulado")
    .reduce((sum, c) => sum + (c.saldo_pendiente ?? (c.monto_total - c.monto_abonado)), 0)
  const totalRecaudado = cuentas.reduce((sum, c) => sum + c.monto_abonado, 0)

  function getEstudianteNombre(c: CuentaCobrar): string {
    const nombres = c.matricula?.estudiante
      ? `${c.matricula.estudiante.nombres} ${c.matricula.estudiante.apellidos}`
      : c.solicitud_inscripcion?.estudiante
        ? `${c.solicitud_inscripcion.estudiante.nombres} ${c.solicitud_inscripcion.estudiante.apellidos}`
        : c.solicitud_inscripcion?.participante_externo
          ? `${c.solicitud_inscripcion.participante_externo.nombres} ${c.solicitud_inscripcion.participante_externo.apellidos}`
          : null
    return nombres ?? "—"
  }

  function getConcepto(c: CuentaCobrar): string {
    return c.matricula?.curso_abierto?.catalogo?.nombre
      ?? c.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre
      ?? c.inscripcion_taller?.taller?.nombre
      ?? "—"
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Pagos y Abonos</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de cobranza, pagos y verificación de transacciones</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <HugeiconsIcon icon={MoneyIcon} size={22} style={{ color: ACCENT }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total cuentas</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{cuentas.length}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
              <HugeiconsIcon icon={ClockIcon} size={22} style={{ color: "oklch(0.55 0.18 15)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pendientes</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{pendientes}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={CheckmarkCircleIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pagados</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{pagados}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
              <HugeiconsIcon icon={Wallet01Icon} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Saldo por cobrar</p>
              <p className="text-lg font-bold tracking-tight truncate" style={{ color: "oklch(0.55 0.18 15)" }}>
                ${montoPendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                Recaudado: ${totalRecaudado.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: BORDER }}>
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-transparent outline-none transition-colors focus:border-[--focus]"
                style={{ borderColor: BORDER, "--focus": ACCENT } as React.CSSProperties}
              />
            </div>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border bg-white outline-none transition-colors focus:border-[--focus]"
              style={{ borderColor: BORDER, color: CHARCOAL, "--focus": ACCENT } as React.CSSProperties}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="abonado">Abonado</option>
              <option value="pagado">Pagado</option>
              <option value="anulado">Anulado</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estudiante</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Concepto</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Total</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Abonado</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Saldo</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : cuentas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={DollarCircleIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No se encontraron cuentas</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          {search || estadoFilter ? "Ajusta los filtros de búsqueda" : "No hay cuentas por cobrar registradas"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : cuentas.map((c) => {
                  const nombre = getEstudianteNombre(c)
                  const concepto = getConcepto(c)
                  const saldo = c.saldo_pendiente ?? (c.monto_total - c.monto_abonado)
                  const st = getStatus(c.estado)
                  const initial = nombre !== "—" ? nombre.charAt(0) : "?"

                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                            {initial}
                          </div>
                          <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: CHARCOAL }}>{concepto}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-medium tabular-nums" style={{ color: CHARCOAL }}>
                          ${c.monto_total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm tabular-nums" style={{ color: c.monto_abonado > 0 ? "oklch(0.58 0.16 145)" : MUTED }}>
                          ${c.monto_abonado.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${saldo > 0 ? "" : ""}`}
                          style={{ color: saldo > 0 ? "oklch(0.55 0.18 15)" : "oklch(0.58 0.16 145)" }}>
                          ${saldo.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: MUTED }}>{formatDate(c.created_at)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!loading && cuentas.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: BORDER }}>
              <span className="text-xs" style={{ color: MUTED }}>
                Mostrando {cuentas.length} cuenta{cuentas.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
