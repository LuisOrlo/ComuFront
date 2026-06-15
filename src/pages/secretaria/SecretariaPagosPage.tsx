import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type CuentaCobrar } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const estadoStyles: Record<string, { color: string; bg: string }> = {
  pendiente: { color: "oklch(0.62 0.14 85)", bg: "oklch(0.62 0.14 85 / 0.12)" },
  abonado: { color: "oklch(0.58 0.16 145)", bg: "oklch(0.58 0.16 145 / 0.12)" },
  pagado: { color: "oklch(0.55 0.18 15)", bg: "oklch(0.55 0.18 15 / 0.1)" },
  anulado: { color: MUTED, bg: "oklch(0.85 0 0 / 0.5)" },
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
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [search, estadoFilter])

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Pagos y Abonos</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de cobranza y verificación</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input type="text" placeholder="Buscar estudiante..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-transparent outline-none" style={{ borderColor: BORDER }} />
            </div>
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border bg-white outline-none" style={{ borderColor: BORDER, color: CHARCOAL }}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="abonado">Abonado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estudiante</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Concepto</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Total</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Abonado</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Saldo</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentas.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No se encontraron cuentas</td></tr>
                  ) : cuentas.map((c) => {
                    const nombre = c.matricula?.estudiante
                      ? `${c.matricula.estudiante.nombres} ${c.matricula.estudiante.apellidos}`
                      : c.solicitud_inscripcion?.estudiante
                      ? `${c.solicitud_inscripcion.estudiante.nombres} ${c.solicitud_inscripcion.estudiante.apellidos}`
                      : c.solicitud_inscripcion?.participante_externo
                      ? `${c.solicitud_inscripcion.participante_externo.nombres} ${c.solicitud_inscripcion.participante_externo.apellidos}`
                      : "—"
                    const concepto = c.matricula?.curso_abierto?.catalogo?.nombre ?? c.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre ?? c.inscripcion_taller?.taller?.nombre ?? "—"
                    const saldo = c.monto_total - c.monto_abonado
                    const st = estadoStyles[c.estado] ?? estadoStyles.pendiente
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-5 py-3.5"><p className="text-sm font-medium" style={{ color: CHARCOAL }}>{nombre}</p></td>
                        <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{concepto}</span></td>
                        <td className="px-5 py-3.5"><span className="text-sm font-medium" style={{ color: CHARCOAL }}>${c.monto_total}</span></td>
                        <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>${c.monto_abonado}</span></td>
                        <td className="px-5 py-3.5"><span className="text-sm font-semibold" style={{ color: saldo > 0 ? "oklch(0.55 0.18 15)" : "oklch(0.58 0.16 145)" }}>${saldo.toFixed(2)}</span></td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
