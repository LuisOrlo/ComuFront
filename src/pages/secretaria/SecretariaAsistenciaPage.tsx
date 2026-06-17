import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CalendarIcon, UserCheckIcon, ClockIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface AsistenciaRecord {
  id: string
  persona?: { nombres: string; apellidos: string }
  fecha: string
  hora_entrada?: string
  hora_salida?: string
  estado: string
  observaciones?: string
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "85%" : "50%" }} />
        </td>
      ))}
    </tr>
  ))
}

function formatHora(hora?: string): string {
  if (!hora) return "—"
  try {
    return hora.substring(0, 5)
  } catch {
    return hora
  }
}

export function SecretariaAsistenciaPage() {
  const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    secretariaService.getAsistencia({ per_page: 50 })
      .then((res) => setAsistencias(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const presentes = asistencias.filter((a) => a.estado === "presente").length
  const ausentes = asistencias.filter((a) => a.estado === "ausente").length
  const justificados = asistencias.filter((a) => a.estado === "justificado").length

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Asistencia del Personal</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Registro de asistencia del staff administrativo</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={UserCheckIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Presentes</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{presentes}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.55 0.18 15 / 0.1)" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={22} style={{ color: "oklch(0.55 0.18 15)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Ausentes</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{ausentes}</p>
            </div>
          </article>
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.62 0.14 85 / 0.12)" }}>
              <HugeiconsIcon icon={ClockIcon} size={22} style={{ color: "oklch(0.62 0.14 85)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Justificados</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{justificados}</p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Personal</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Entrada</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Salida</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : asistencias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={CalendarIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No hay registros de asistencia</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          Aún no se han registrado asistencias del personal
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : asistencias.map((a) => {
                  const st = getStatus(a.estado)
                  const nombre = a.persona
                    ? `${a.persona.nombres} ${a.persona.apellidos}`
                    : "—"
                  const initial = nombre !== "—" ? nombre.charAt(0) : "?"
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                            {initial}
                          </div>
                          <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: CHARCOAL }}>{formatDate(a.fecha)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm tabular-nums" style={{ color: a.hora_entrada ? CHARCOAL : MUTED }}>
                          {formatHora(a.hora_entrada)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm tabular-nums" style={{ color: a.hora_salida ? CHARCOAL : MUTED }}>
                          {formatHora(a.hora_salida)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <p className="text-sm truncate" style={{ color: a.observaciones ? MUTED : "oklch(0.75 0 0)" }}>
                          {a.observaciones || "—"}
                        </p>
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
