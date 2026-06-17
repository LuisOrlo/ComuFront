import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Microphone, CalendarIcon, UserIcon, ClockIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService, type ReservaPodcast } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "90%" : "55%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaPodcastPage() {
  const [reservas, setReservas] = useState<ReservaPodcast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getReservasPodcast({ per_page: 50 })
      .then((res) => setReservas(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const confirmadas = reservas.filter((r) => r.estado === "confirmada").length
  const pendientes = reservas.filter((r) => r.estado === "pendiente").length
  const pendientesPago = reservas.filter((r) => !r.pagado).length

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Reservas de Podcast</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Gestión de reservas del estudio de grabación</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.16 245 / 0.1)" }}>
              <HugeiconsIcon icon={Microphone} size={22} style={{ color: "oklch(0.62 0.16 245)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total reservas</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{reservas.length}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={CalendarIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Confirmadas</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{confirmadas}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
              <HugeiconsIcon icon={ClockIcon} size={22} style={{ color: "oklch(0.62 0.14 85)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pendientes</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{pendientes}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
              <HugeiconsIcon icon={UserIcon} size={22} style={{ color: "oklch(0.55 0.18 15)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Pago pendiente</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{pendientesPago}</p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Cliente</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Paquete</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha reserva</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Pago</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : reservas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={Microphone} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No hay reservas de podcast</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          Aún no se han registrado reservas del estudio
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : reservas.map((r) => {
                  const st = getStatus(r.estado)
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                            {(r.cliente_nombre ?? "?").charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{r.cliente_nombre ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: CHARCOAL }}>{r.paquete?.nombre ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm" style={{ color: CHARCOAL }}>{formatDate(r.fecha_reserva ?? r.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.pagado ? "" : ""
                        }`}
                          style={{
                            backgroundColor: r.pagado ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.55 0.18 15 / 0.1)",
                            color: r.pagado ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)",
                          }}
                        >
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: r.pagado ? "oklch(0.58 0.16 145)" : "oklch(0.55 0.18 15)" }} />
                          {r.pagado ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
