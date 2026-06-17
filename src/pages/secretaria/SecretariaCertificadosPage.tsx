import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  CheckmarkCircleIcon,
  CertificateIcon,
  UserCheckIcon,
  ClockIcon,
  FileDownloadIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { formatDate, getStatus } from "@/lib/utils"
import { secretariaService, type Certificado } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-5 py-4">
          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "oklch(0.9 0 0)", width: j === 0 ? "80%" : "60%" }} />
        </td>
      ))}
    </tr>
  ))
}

export function SecretariaCertificadosPage() {
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    secretariaService.getCertificados({ search, per_page: 50 })
      .then((res) => setCertificados(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search])

  const handleEntregar = async (id: string) => {
    try {
      await secretariaService.marcarEntregado(id)
      setCertificados((prev) => prev.map((c) => c.id === id ? { ...c, estado: "entregado" } : c))
    } catch { /* ignore */ }
  }

  const pendientes = certificados.filter((c) => c.estado === "pendiente").length
  const entregados = certificados.filter((c) => c.estado === "entregado").length

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4 bg-white" style={{ borderColor: BORDER }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Certificados</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Emisión y entrega de certificados a estudiantes</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="rounded-xl border bg-white p-5 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <HugeiconsIcon icon={CertificateIcon} size={22} style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Total emitidos</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{certificados.length}</p>
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
            <div className="flex items-center justify-center size-11 rounded-xl shrink-0" style={{ backgroundColor: "oklch(0.58 0.16 145 / 0.1)" }}>
              <HugeiconsIcon icon={UserCheckIcon} size={22} style={{ color: "oklch(0.58 0.16 145)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>Entregados</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: CHARCOAL }}>{entregados}</p>
            </div>
          </article>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: BORDER }}>
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                type="text"
                placeholder="Buscar por estudiante o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-transparent outline-none transition-colors focus:border-[--focus]"
                style={{ borderColor: BORDER, "--focus": ACCENT } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.96 0 0)", borderBottom: `1px solid ${BORDER}` }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Código</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estudiante</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Fecha emisión</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : certificados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: "oklch(0.96 0 0)" }}>
                          <HugeiconsIcon icon={CertificateIcon} size={26} style={{ color: "oklch(0.8 0 0)" }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No se encontraron certificados</p>
                        <p className="text-xs max-w-xs text-center" style={{ color: MUTED }}>
                          {search ? "Intenta con otro término de búsqueda" : "Aún no se han emitido certificados"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : certificados.map((c) => {
                  const st = getStatus(c.estado)
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-gray-50/60" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-medium tracking-wide" style={{ color: CHARCOAL }}>
                          {c.codigo_certificado || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.estudiante ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center size-7 rounded-full shrink-0 text-[11px] font-semibold" style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}>
                              {c.estudiante.nombres.charAt(0)}
                            </div>
                            <span className="text-sm font-medium" style={{ color: CHARCOAL }}>
                              {c.estudiante.nombres} {c.estudiante.apellidos}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm italic" style={{ color: "oklch(0.75 0 0)" }}>Sin asignar</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: CHARCOAL }}>{c.catalogo_curso?.nombre ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm" style={{ color: MUTED }}>{(c as Certificado & { created_at?: string }).created_at ? formatDate((c as Certificado & { created_at?: string }).created_at) : "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>
                          <span className="size-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {c.estado !== "entregado" ? (
                          <button
                            onClick={() => handleEntregar(c.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                          >
                            <HugeiconsIcon icon={CheckmarkCircleIcon} size={13} />
                            Marcar entregado
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ color: "oklch(0.75 0 0)" }}>
                            <HugeiconsIcon icon={FileDownloadIcon} size={13} />
                            Entregado
                          </span>
                        )}
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
