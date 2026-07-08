/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { usePermission } from "@/hooks/usePermission"
import { useAuth } from "@/context/AuthContext"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, SaveIcon, InformationCircleIcon,
  UserGroupIcon, Calendar03Icon, Download04Icon, CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

type AsistenciaLocal = {
  asistio: boolean
  estado: string
  observaciones: string
}

export function AsistenciaTallerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin, isSecretaria } = usePermission()
  const { user } = useAuth()
  const [taller, setTaller] = useState<Taller | null>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [yaRegistrado, setYaRegistrado] = useState(false)
  const [fechaSesion, setFechaSesion] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [asistenciasLocal, setAsistenciasLocal] = useState<Record<string, AsistenciaLocal>>({})

  useEffect(() => {
    const cargar = async () => {
      if (!id) return
      try {
        const [tallerRes, inscRes] = await Promise.all([
          tallerService.obtener(id),
          tallerService.listarInscripciones(id, { per_page: 200 }),
        ])
        setTaller(tallerRes)
        const data = (inscRes as any).data || []
        setInscripciones(data)

        const activos = data.filter((i: InscripcionTaller) => i.estado === "activo")
        const initial: Record<string, AsistenciaLocal> = {}
        activos.forEach((i: InscripcionTaller) => {
          initial[i.id] = { asistio: true, estado: "presente", observaciones: "" }
        })
        setAsistenciasLocal(initial)

        if (tallerRes.asistencias?.length > 0) {
          setYaRegistrado(true)
          const ultima = tallerRes.asistencias[tallerRes.asistencias.length - 1]
          if (ultima.fecha_sesion) {
            setFechaSesion(ultima.fecha_sesion)
          }
        } else if (tallerRes.fecha) {
          setFechaSesion(tallerRes.fecha.substring(0, 10))
        }
      } catch {
        toast.error("Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  const handleStatusChange = (inscId: string, estado: string) => {
    setAsistenciasLocal(prev => ({
      ...prev,
      [inscId]: {
        ...prev[inscId],
        estado,
        asistio: estado === "presente" || estado === "tardanza",
      },
    }))
  }

  const handleObservacionChange = (inscId: string, value: string) => {
    setAsistenciasLocal(prev => ({
      ...prev,
      [inscId]: { ...prev[inscId], observaciones: value },
    }))
  }

  const handleRegistrar = async () => {
    if (!id) return
    setSaving(true)
    try {
      const activos = inscripciones.filter(i => i.estado === "activo")
      const estudiantes = activos.map(i => ({
        inscripcion_taller_id: i.id,
        asistio: asistenciasLocal[i.id]?.asistio ?? true,
        estado: asistenciasLocal[i.id]?.estado ?? "presente",
        observaciones: asistenciasLocal[i.id]?.observaciones || null,
      }))

      await tallerService.registrarAsistencia(id, {
        taller_id: id,
        fecha_sesion: fechaSesion,
        observaciones: observaciones || null,
        estudiantes,
      })
      toast.success("Asistencia registrada correctamente")
      setYaRegistrado(true)
    } catch (err: any) {
      console.error("Error al registrar asistencia:", err?.response?.data)
      const msg = err?.response?.data?.message || "Error al registrar asistencia"
      toast.error(`${msg}${err?.response?.data?.error ? `: ${err.response.data.error}` : ""}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDescargarPDF = async () => {
    if (!taller) return
    try {
      const activos = inscripciones.filter(i => i.estado === "activo")
      const nombres = activos.map(i => `${i.nombres} ${i.apellidos}`)
      const horario = `${taller.hora_inicio || "—"} - ${taller.hora_fin || "—"}`
      const instructorName = taller.instructor
        ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
        : user?.persona
          ? `${user.persona.nombres || ""} ${user.persona.apellidos || ""}`.trim() || undefined
          : undefined
      await generarListadoAsistenciaPDF(taller.nombre, horario, nombres, instructorName)
      toast.success("Listado de asistencia descargado")
    } catch {
      toast.error("Error al generar el PDF")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Cargando...</div>
  }

  if (!taller) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>Taller no encontrado</div>
  }

  const inscritosActivos = inscripciones.filter(i => i.estado === "activo")
  const presentesCount = Object.values(asistenciasLocal).filter(
    a => a.estado === "presente" || a.estado === "tardanza",
  ).length

  if (yaRegistrado) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
          <div className="max-w-[1000px] mx-auto px-6 py-6">
            <button onClick={() => navigate(isAdmin || isSecretaria ? `/talleres/${id}` : "/instructor/talleres")}
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver al taller
            </button>
            <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>Registrar Asistencia</h1>
            <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>{taller.nombre}</p>
          </div>
        </div>
        <main className="flex-1 max-w-[600px] mx-auto w-full px-6 py-6">
          <div className="bg-white rounded-xl border p-6 space-y-5" style={{ borderColor: BORDER }}>
            <div className="text-center py-8">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} style={{ color: "oklch(0.45 0.12 140)" }} />
              <p className="text-sm font-semibold mt-3" style={{ color: CHARCOAL }}>Asistencia ya registrada</p>
              <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                La asistencia para este taller ya fue registrada el {taller.asistencias?.[taller.asistencias.length - 1]?.fecha_sesion || "—"}
              </p>
              {inscritosActivos.length > 0 && (
                <button onClick={handleDescargarPDF}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                >
                  <HugeiconsIcon icon={Download04Icon} size={14} />
                  Descargar Listado PDF
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          <button onClick={() => navigate(isAdmin || isSecretaria ? `/talleres/${id}` : "/instructor/talleres")}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver al taller
          </button>
          <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>Registrar Asistencia</h1>
          <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>{taller.nombre}</p>
        </div>
      </div>

      <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
          {/* Header */}
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b" style={{ borderColor: BORDER, backgroundColor: "oklch(0.97 0 0)" }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                Registro de Asistencia
              </span>
              <h2 className="text-lg font-bold mt-1" style={{ color: CHARCOAL }}>Pase de Lista</h2>
              <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>{taller.nombre}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleDescargarPDF}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
              >
                <HugeiconsIcon icon={Download04Icon} size={14} className="inline mr-1" />
                Descargar Listado
              </button>
              <div className="px-5 py-2 rounded-xl text-center border" style={{ backgroundColor: "oklch(0.5 0.1 150 / 0.1)", borderColor: "oklch(0.5 0.1 150 / 0.2)" }}>
                <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>Presentes</span>
                <span className="text-lg font-bold" style={{ color: "oklch(0.45 0.12 140)" }}>
                  {presentesCount} <span className="text-xs font-normal" style={{ color: TEXT_MUTED }}>de {inscritosActivos.length}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Date and observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: CHARCOAL }}>
                  Fecha de la sesión
                </label>
                <div className="relative">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                  <input type="date" value={fechaSesion} onChange={e => setFechaSesion(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: CHARCOAL }}>
                  Observaciones (opcional)
                </label>
                <input type="text" value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  placeholder="Novedades durante la sesión..."
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
              </div>
            </div>

            {/* Info banner */}
            <div className="rounded-xl p-4 flex gap-3" style={{ backgroundColor: "oklch(0.97 0.01 45)", borderColor: "oklch(0.9 0.02 45)", borderWidth: 1 }}>
              <HugeiconsIcon icon={InformationCircleIcon} size={20} style={{ color: ACCENT, flexShrink: 0 }} />
              <p className="text-sm" style={{ color: CHARCOAL }}>
                Selecciona el estado de asistencia para cada participante. Por defecto todos están marcados como <b>Presente</b>.
              </p>
            </div>

            {/* Students list */}
            {inscritosActivos.length === 0 ? (
              <div className="text-center py-12" style={{ color: TEXT_MUTED }}>
                No hay participantes inscritos para registrar asistencia.
              </div>
            ) : (
              <div className="space-y-3">
                {inscritosActivos.map(ins => {
                  const currentStatus = asistenciasLocal[ins.id]?.estado
                  return (
                    <div key={ins.id} className="grid md:grid-cols-12 gap-4 items-center p-4 rounded-xl border" style={{ borderColor: BORDER }}>
                      <div className="md:col-span-4 flex items-center gap-3">
                        <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "oklch(0.95 0 0)", color: TEXT_MUTED }}>
                          <HugeiconsIcon icon={UserGroupIcon} size={20} />
                        </div>
                        <div>
                          <div className="font-bold leading-tight text-sm" style={{ color: CHARCOAL }}>
                            {ins.nombres} {ins.apellidos}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: TEXT_MUTED }}>
                            {ins.cedula || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-5">
                        <div className="flex p-1 rounded-xl" style={{ backgroundColor: "oklch(0.95 0 0)" }}>
                          {[
                            { id: "presente", label: "P", activeBg: "oklch(0.5 0.1 150)", activeColor: "white" },
                            { id: "ausente", label: "A", activeBg: "oklch(0.45 0.15 20)", activeColor: "white" },
                            { id: "tardanza", label: "T", activeBg: "oklch(0.6 0.15 65)", activeColor: "white" },
                            { id: "justificado", label: "J", activeBg: "oklch(0.5 0.12 240)", activeColor: "white" },
                          ].map(status => (
                            <button key={status.id} onClick={() => handleStatusChange(ins.id, status.id)}
                              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                              style={{
                                backgroundColor: currentStatus === status.id ? status.activeBg : "transparent",
                                color: currentStatus === status.id ? status.activeColor : TEXT_MUTED,
                                boxShadow: currentStatus === status.id ? `0 2px 6px ${status.activeBg}40` : "none",
                              }}>
                              {status.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between px-2 mt-1">
                          <span className="text-[9px] font-bold uppercase" style={{ color: TEXT_MUTED }}>Presente</span>
                          <span className="text-[9px] font-bold uppercase" style={{ color: TEXT_MUTED }}>Ausente</span>
                          <span className="text-[9px] font-bold uppercase" style={{ color: TEXT_MUTED }}>Tarde</span>
                          <span className="text-[9px] font-bold uppercase" style={{ color: TEXT_MUTED }}>Justif.</span>
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <input type="text" value={asistenciasLocal[ins.id]?.observaciones || ""}
                          onChange={e => handleObservacionChange(ins.id, e.target.value)}
                          placeholder="Nota..." className="w-full h-10 px-3 text-xs rounded-xl outline-none border"
                          style={{ borderColor: BORDER, color: CHARCOAL }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            {inscritosActivos.length > 0 && (
              <div className="flex justify-end gap-4 pt-4">
                <button onClick={() => navigate(isAdmin || isSecretaria ? `/talleres/${id}` : "/instructor/talleres")}
                  className="px-6 py-3 rounded-xl font-bold text-xs transition-all border"
                  style={{ borderColor: BORDER, color: TEXT_MUTED }}>
                  Cancelar
                </button>
                <button onClick={handleRegistrar} disabled={saving}
                  className="px-8 py-3 rounded-xl text-white font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: ACCENT, boxShadow: `0 4px 12px ${ACCENT}40` }}>
                  <HugeiconsIcon icon={SaveIcon} size={16} />
                  {saving ? "Guardando..." : "Guardar Asistencia"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
