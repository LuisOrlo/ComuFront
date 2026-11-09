/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  UserGroupIcon,
  Calendar03Icon,
  Clock04Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import { ModalidadBadge, EstadoBadge, CiudadBadge } from "@/pages/estudiantes/components/Badges"
import { TallerInfo } from "./components/TallerInfo"
import { TallerParticipantes } from "./components/TallerParticipantes"
import { TallerAsistenciaSection } from "@/pages/admin/talleres/components/TallerAsistenciaSection"
import { toast } from "sonner"

type Tab = "info" | "participantes" | "asistencia"

function formatFecha(f?: string): string {
  if (!f) return "—"
  try {
    const d = new Date(f.includes("T") ? f : f + "T00:00:00")
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return f
  }
}

function getCiudadNombre(t?: Taller | null): string {
  if (!t) return ""
  if (typeof t.ciudad === "object" && t.ciudad !== null) {
    return t.ciudad.nombre || ""
  }
  if (typeof t.ciudad === "string") {
    return t.ciudad
  }
  return ""
}

export function InstructorTallerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [tab, setTab] = useState<Tab>("info")

  const cargarTaller = useCallback(async () => {
    if (!id) return
    try {
      const t = await tallerService.obtener(id)
      setTaller(t)
      if (t?.inscripciones && Array.isArray(t.inscripciones)) {
        setInscripciones(t.inscripciones)
      }
    } catch {
      toast.error("Error al cargar taller")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    cargarTaller()
  }, [cargarTaller])

  useEffect(() => {
    if (!id) return
    setLoadingInscripciones(true)
    tallerService
      .listarInscripciones(id, { per_page: 200 })
      .then((res) => setInscripciones((res as any).data || (res as any).datos || []))
      .catch(() => {})
      .finally(() => setLoadingInscripciones(false))
  }, [id, tab])

  const inscritosActivos = useMemo(
    () => inscripciones.filter((i) => i.estado === "activo"),
    [inscripciones]
  )

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8f9ff]">
        <div className="text-center space-y-3">
          <HugeiconsIcon
            icon={RefreshIcon}
            size={28}
            className="animate-spin text-[#fd761a] mx-auto"
          />
          <p className="text-xs font-bold text-slate-500">Cargando taller...</p>
        </div>
      </div>
    )
  }

  if (!taller) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8f9ff]">
        <div className="text-center space-y-3 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm">
          <p className="text-sm font-bold text-slate-800">Taller no encontrado</p>
          <p className="text-xs text-slate-400">
            No se pudo obtener la información del taller o no tienes permisos de instructor asignados.
          </p>
          <Link
            to="/instructor/talleres"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            <span>Volver a mis talleres</span>
          </Link>
        </div>
      </div>
    )
  }

  const esMultiDia = Boolean(taller.fecha_fin && taller.fecha_fin !== taller.fecha)

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff]">
      {/* Cabecera Principal Superior */}
      <header className="bg-white border-b border-[#e5eeff] px-4 sm:px-6 lg:px-8 py-5 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Botón de retorno */}
          <div>
            <Link
              to="/instructor/talleres"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#fd761a] transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              <span>Volver a mis talleres</span>
            </Link>
          </div>

          {/* Título y Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#0b1c30]">
                  {taller.nombre}
                </h1>
                <ModalidadBadge modalidad={taller.modalidad} />
                <EstadoBadge estado={taller.estado} />
                <CiudadBadge ciudad={getCiudadNombre(taller) || "Presencial"} />
              </div>

              {/* Fila de Metadatos Rápidos */}
              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-[#fd761a]" />
                  <span>
                    {formatFecha(taller.fecha)}
                    {esMultiDia ? ` - ${formatFecha(taller.fecha_fin || undefined)}` : ""}
                  </span>
                </span>

                {(taller.hora_inicio || taller.hora_fin) && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <HugeiconsIcon icon={Clock04Icon} size={14} className="text-blue-600" />
                    <span>
                      {taller.hora_inicio?.substring(0, 5)} - {taller.hora_fin?.substring(0, 5)}
                    </span>
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-emerald-600" />
                  <span className="font-mono">
                    <strong className="text-slate-900">{inscritosActivos.length}</strong> /{" "}
                    {taller.capacidad_maxima || "—"} alumnos
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Sub-Pestañas */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setTab("info")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === "info"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <HugeiconsIcon icon={BookOpen01Icon} size={14} />
              <span>Detalles del Taller</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("participantes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === "participantes"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <HugeiconsIcon icon={UserGroupIcon} size={14} />
              <span>Participantes</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  tab === "participantes"
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {inscritosActivos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("asistencia")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === "asistencia"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={14} />
              <span>Control de Asistencia</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  tab === "asistencia"
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {taller.asistencias?.length || (taller.fecha ? 1 : 0)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal según la Pestaña Activa */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {tab === "info" && (
          <TallerInfo taller={taller} inscritosActivos={inscritosActivos.length} />
        )}

        {tab === "participantes" && (
          <TallerParticipantes
            taller={taller}
            inscripciones={inscripciones}
            loading={loadingInscripciones}
          />
        )}

        {tab === "asistencia" && (
          <TallerAsistenciaSection
            taller={taller}
            inscritosActivos={inscritosActivos}
            canManageAsistencia={true}
            onTallerUpdated={(updated) => {
              setTaller(updated)
              if (updated.inscripciones && Array.isArray(updated.inscripciones)) {
                setInscripciones(updated.inscripciones)
              }
            }}
          />
        )}
      </main>
    </div>
  )
}
