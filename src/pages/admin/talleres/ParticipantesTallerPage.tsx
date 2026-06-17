/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import { toast } from "sonner"

const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function ParticipantesTallerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      if (!id) return
      try {
        const [tallerRes, inscRes] = await Promise.all([
          tallerService.obtener(id),
          tallerService.listarInscripciones(id, { per_page: 200 }),
        ])
        setTaller(tallerRes)
        setInscripciones((inscRes as any).data || [])
      } catch {
        toast.error("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Cargando...</div>
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[800px] mx-auto px-6 py-6">
          <button onClick={() => navigate("/instructor/talleres")}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver a mis talleres
          </button>
          <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>Participantes</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>{taller?.nombre}</p>
        </div>
      </div>

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: BORDER }}>
            <HugeiconsIcon icon={UserGroupIcon} size={14} style={{ color: TEXT_MUTED }} />
            <span className="text-xs" style={{ color: TEXT_MUTED }}>
              {inscripciones.filter(i => i.estado === "activo").length} inscritos
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: BORDER }}>
                  <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Nombre</th>
                  <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Cédula</th>
                  <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Correo</th>
                  <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-sm" style={{ color: TEXT_MUTED }}>Sin participantes</td></tr>
                ) : (
                  inscripciones.map(ins => (
                    <tr key={ins.id} className="border-b" style={{ borderColor: BORDER }}>
                      <td className="px-5 py-3 font-semibold" style={{ color: CHARCOAL }}>{ins.nombres} {ins.apellidos}</td>
                      <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.cedula}</td>
                      <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.correo}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px]" style={{ color: ins.estado === "activo" ? "oklch(0.45 0.12 140)" : TEXT_MUTED }}>
                          {ins.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
