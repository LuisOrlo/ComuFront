/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function AsistenciaTallerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [asistentes, setAsistentes] = useState<number>(0)
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [yaRegistrado, setYaRegistrado] = useState(false)

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

        const activos = (inscRes as any).data?.filter((i: InscripcionTaller) => i.estado === "activo") || []
        setAsistentes(activos.length)

        if (tallerRes.asistencias?.length > 0) {
          setYaRegistrado(true)
        }
      } catch {
        toast.error("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  const handleRegistrar = async () => {
    if (!id) return
    setSaving(true)
    try {
      const fecha = taller?.fecha || new Date().toISOString().split("T")[0]
      await tallerService.registrarAsistencia(id, {
        taller_id: id,
        fecha_sesion: fecha,
        asistentes,
        capacidad_registrada: inscripciones.filter(i => i.estado === "activo").length,
        observaciones: observaciones || null,
      })
      toast.success("Asistencia registrada correctamente")
      setYaRegistrado(true)
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || "Error al registrar asistencia"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Cargando...</div>
  }

  if (!taller) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Taller no encontrado</div>
  }

  const inscritosActivos = inscripciones.filter(i => i.estado === "activo")

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[600px] mx-auto px-6 py-6">
          <button onClick={() => navigate("/instructor/talleres")}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver a mis talleres
          </button>
          <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>Registrar Asistencia</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>{taller.nombre}</p>
        </div>
      </div>

      <main className="flex-1 max-w-[600px] mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl border p-6 space-y-5" style={{ borderColor: BORDER }}>
          {yaRegistrado ? (
            <div className="text-center py-8">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} style={{ color: "oklch(0.45 0.12 140)" }} />
              <p className="text-sm font-semibold mt-3" style={{ color: CHARCOAL }}>Asistencia ya registrada</p>
              <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                La asistencia para este taller ya fue registrada el {taller.asistencias?.[0]?.fecha_sesion || "—"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold" style={{ color: CHARCOAL }}>{inscritosActivos.length}</p>
                  <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>Inscritos</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold" style={{ color: CHARCOAL }}>{taller.capacidad_maxima}</p>
                  <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>Capacidad</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>¿Cuántos asistieron?</label>
                <input type="number" value={asistentes} onChange={e => setAsistentes(Number(e.target.value))}
                  min={0} max={inscritosActivos.length}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
                <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
                  Máximo: {inscritosActivos.length} (total de inscritos activos)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Observaciones (opcional)</label>
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none resize-none" style={{ borderColor: BORDER }}
                  placeholder="Novedades durante el taller..." />
              </div>

              <button onClick={handleRegistrar} disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}>
                {saving ? "Registrando..." : "Registrar Asistencia"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
