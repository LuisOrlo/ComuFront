import { useState, useEffect } from "react"

import { COLORS } from "@/lib/constants"
import { secretariaService, type ReservaPodcast } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaPodcastPage() {
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getReservasPodcast({ per_page: 50 })
      .then((res) => setReservas(res.data ?? []))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Reservas de Podcast</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de reservas del estudio de podcast</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Cliente</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Paquete</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No hay reservas de podcast</td></tr>
                  ) : reservas.map((r: ReservaPodcast) => (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{r.cliente_nombre ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{r.paquete?.nombre ?? "—"}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{r.fecha_reserva ?? r.created_at}</span></td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: r.estado === "confirmada" ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.62 0.14 85 / 0.12)", color: r.estado === "confirmada" ? "oklch(0.58 0.16 145)" : "oklch(0.62 0.14 85)" }}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: r.pagado ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)" }}>
                          {r.pagado ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
