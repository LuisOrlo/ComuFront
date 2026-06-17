/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller } from "@/services/taller.service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function InstructorTalleresPage() {
  const navigate = useNavigate()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"hoy" | "proximos" | "completados">("hoy")

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return

        const payload = JSON.parse(atob(token.split(".")[1]))
        const personaId = payload.persona_id || payload.sub

        const params: Record<string, unknown> = { per_page: 50, instructor_id: personaId }
        if (tab === "proximos") {
          params.tab = "proximos"
        } else if (tab === "completados") {
          params.estado = "completado"
        } else {
          params.fecha = new Date().toISOString().split("T")[0]
        }
        const res = await tallerService.listar(params)
        setTalleres((res as any).data || [])
      } catch {
        toast.error("Error al cargar talleres")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [tab])

  const hoyStr = new Date().toISOString().split("T")[0]

  const formatFecha = (f?: string) => {
    if (!f) return "—"
    try {
      const d = new Date(f)
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch { return f }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>Mis Talleres</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>Talleres donde eres instructor</p>
        </div>
      </div>

      <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-6 space-y-5">
        <div className="flex gap-1 rounded-lg border p-0.5 bg-gray-50 inline-flex" style={{ borderColor: BORDER }}>
          {[
            { key: "hoy", label: "Hoy" },
            { key: "proximos", label: "Próximos" },
            { key: "completados", label: "Completados" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? "#fff" : "transparent",
                color: tab === t.key ? CHARCOAL : TEXT_MUTED,
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border p-16 text-center text-sm" style={{ borderColor: BORDER, color: TEXT_MUTED }}>Cargando...</div>
        ) : talleres.length === 0 ? (
          <div className="bg-white rounded-xl border p-16 text-center" style={{ borderColor: BORDER }}>
            <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No hay talleres</p>
            <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
              {tab === "hoy" ? "No tienes talleres programados para hoy" : "No tienes talleres asignados"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: BORDER }}>
                    <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Taller</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Fecha</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Horario</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Inscritos</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Estado</th>
                    <th className="text-right font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {talleres.map(t => {
                    const esHoy = t.fecha === hoyStr
                    const yaPaso = t.fecha && new Date(t.fecha) < new Date(new Date().toDateString())
                    return (
                      <tr key={t.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold" style={{ color: CHARCOAL }}>{t.nombre}</p>
                          <p className="text-[11px] capitalize" style={{ color: TEXT_MUTED }}>{t.modalidad}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: CHARCOAL }}>
                          {formatFecha(t.fecha)}
                          {esHoy && <span className="ml-2 text-[10px] font-bold text-green-600">HOY</span>}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: CHARCOAL }}>
                          {t.hora_inicio?.substring(0, 5)} - {t.hora_fin?.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3.5" style={{ color: CHARCOAL }}>
                          {t.inscripciones_count || 0}/{t.capacidad_maxima || 0}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            t.estado === "confirmado" && "text-green-700 bg-green-50",
                            t.estado === "pendiente" && "text-amber-700 bg-amber-50",
                            t.estado === "completado" && "text-gray-500 bg-gray-100",
                          )}>
                            {t.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(esHoy || yaPaso) && (
                              <button onClick={() => navigate(`/instructor/talleres/${t.id}/asistencia`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                                style={{ backgroundColor: ACCENT }}>
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />Asistencia
                              </button>
                            )}
                            <button onClick={() => navigate(`/instructor/talleres/${t.id}/participantes`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border"
                              style={{ borderColor: BORDER, color: CHARCOAL }}>
                              <HugeiconsIcon icon={UserGroupIcon} size={13} />Participantes
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
