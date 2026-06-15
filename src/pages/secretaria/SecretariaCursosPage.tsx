import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService, type Curso } from "@/services/secretaria.service"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    secretariaService.getCursos({ search, per_page: 50 })
      .then((res) => setCursos(res.data ?? []))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Cursos</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Consulta de cursos y matrículas</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
            <div className="relative flex-1 max-w-xs">
              <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input type="text" placeholder="Buscar curso..." value={search} onChange={(e) => setSearch(e.target.value)}
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
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Curso</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Inicio</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Instructor</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Matriculados</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3" style={{ color: MUTED }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: MUTED }}>No se encontraron cursos</td></tr>
                  ) : cursos.map((c: Curso) => (
                    <tr key={c.id} className="transition-colors hover:bg-gray-50/40" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: CHARCOAL }}>{c.catalogo?.nombre ?? c.nombre}</p>
                      </td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{c.fecha_inicio}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: MUTED }}>{c.instructor ? `${c.instructor.nombres} ${c.instructor.apellidos}` : "—"}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm font-medium" style={{ color: CHARCOAL }}>{c.matriculas_count ?? "—"}/{c.capacidad}</span></td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: c.estado === "activo" ? "oklch(0.58 0.16 145 / 0.1)" : "oklch(0.85 0 0 / 0.5)", color: c.estado === "activo" ? "oklch(0.58 0.16 145)" : MUTED }}>
                          {c.estado}
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
