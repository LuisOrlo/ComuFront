import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, CheckmarkCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type Certificado } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaCertificadosPage() {
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    secretariaService.getCertificados({ search, per_page: 50 })
      .then((res) => setCertificados(res.data ?? []))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [search])

  const handleEntregar = async (id: string) => {
    try {
      await secretariaService.marcarEntregado(id)
      setCertificados((prev) => prev.map((c) => c.id === id ? { ...c, estado: "entregado" } : c))
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Certificados</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Emisión y entrega de certificados</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input type="text" placeholder="Buscar por estudiante o código..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border bg-transparent outline-none" style={{ borderColor: BORDER }} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Código</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estudiante</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {certificados.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No se encontraron certificados</td></tr>
                  ) : certificados.map((c: Certificado) => (
                    <tr key={c.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5"><span className="text-sm font-mono font-medium" style={{ color: CHARCOAL }}>{c.codigo_certificado}</span></td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{c.estudiante ? `${c.estudiante.nombres} ${c.estudiante.apellidos}` : "—"}</p>
                      </td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{c.catalogo_curso?.nombre ?? "—"}</span></td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: c.estado === "entregado" ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.62 0.14 85 / 0.12)", color: c.estado === "entregado" ? "oklch(0.58 0.16 145)" : "oklch(0.62 0.14 85)" }}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {c.estado !== "entregado" && (
                          <button onClick={() => handleEntregar(c.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
                            <HugeiconsIcon icon={CheckmarkCircleIcon} size={13} /> Entregar
                          </button>
                        )}
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
