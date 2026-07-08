import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, BookOpen01Icon, UserGroupIcon, CheckListIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import { toast } from "sonner"
import { TallerInfo } from "./components/TallerInfo"
import { TallerParticipantes } from "./components/TallerParticipantes"
import { TallerAsistencia } from "./components/TallerAsistencia"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

type Tab = "info" | "participantes" | "asistencia"

const TABS: { key: Tab; label: string; icon: typeof BookOpen01Icon }[] = [
  { key: "info", label: "Detalles", icon: BookOpen01Icon },
  { key: "participantes", label: "Participantes", icon: UserGroupIcon },
  { key: "asistencia", label: "Asistencia", icon: CheckListIcon },
]

export function InstructorTallerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [tab, setTab] = useState<Tab>("info")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    tallerService.obtener(id)
      .then(t => setTaller(t))
      .catch(() => toast.error("Error al cargar taller"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || tab !== "participantes") return
    setLoadingInscripciones(true)
    tallerService.listarInscripciones(id, { per_page: 200 })
      .then(res => setInscripciones((res as any).data || []))
      .catch(() => toast.error("Error al cargar participantes"))
      .finally(() => setLoadingInscripciones(false))
  }, [id, tab])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50/50">
        <p className="text-sm" style={{ color: TEXT_MUTED }}>Cargando...</p>
      </div>
    )
  }

  if (!taller) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50/50">
        <p className="text-sm" style={{ color: TEXT_MUTED }}>Taller no encontrado</p>
      </div>
    )
  }

  const inscritosActivos = inscripciones.filter(i => i.estado === "activo")

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          <Link to="/instructor/talleres"
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70 transition-opacity"
            style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver a mis talleres
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>{taller.nombre}</h1>
              <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: TEXT_MUTED }}>
                <span>{taller.modalidad?.toUpperCase()}</span>
              </p>
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold capitalize"
              style={{
                backgroundColor: taller.estado === "confirmado" ? "oklch(0.92 0.08 140)" :
                  taller.estado === "pendiente" ? "oklch(0.92 0.05 80)" :
                  taller.estado === "completado" ? "oklch(0.95 0 0)" : "oklch(0.93 0.06 20)",
                color: taller.estado === "confirmado" ? "oklch(0.45 0.12 140)" :
                  taller.estado === "pendiente" ? "oklch(0.55 0.12 70)" :
                  taller.estado === "completado" ? "oklch(0.45 0 0)" : "oklch(0.55 0.15 20)",
              }}>
              {taller.estado}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border-b" style={{ borderColor: BORDER }}>
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: tab === t.key ? ACCENT : "transparent",
                  color: tab === t.key ? CHARCOAL : TEXT_MUTED,
                }}>
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-6">
        {tab === "info" && <TallerInfo taller={taller} inscritosActivos={inscritosActivos.length} />}

        {tab === "participantes" && (
          <TallerParticipantes
            taller={taller}
            inscripciones={inscripciones}
            loading={loadingInscripciones}
          />
        )}

        {tab === "asistencia" && (
          <TallerAsistencia taller={taller} />
        )}
      </main>
    </div>
  )
}
