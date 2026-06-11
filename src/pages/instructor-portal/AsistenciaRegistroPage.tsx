import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  SaveIcon,
  InformationCircleIcon,
  UserGroupIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  instructorService,
  type InstructorCurso,
  type EstudianteCurso,
  type ClaseItem,
} from "@/services/instructor.service"
import { toast } from "sonner"

type AsistenciaLocal = {
  asistio: boolean
  estado: string
  observaciones: string
}

export function AsistenciaRegistroPage() {
  const { cursoId, claseId } = useParams<{ cursoId: string; claseId: string }>()
  const navigate = useNavigate()
  const [curso, setCurso] = useState<InstructorCurso | null>(null)
  const [clase, setClase] = useState<ClaseItem | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [asistenciasLocal, setAsistenciasLocal] = useState<
    Record<string, AsistenciaLocal>
  >({})

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData, claseData] = await Promise.all([
        instructorService.getDetalleCurso(cursoId!),
        instructorService.getEstudiantesCurso(cursoId!),
        claseId ? instructorService.getDetalleClase(claseId) : Promise.resolve(null),
      ])

      setCurso(cursoData)
      setEstudiantes(estudiantesData)
      if (claseData) setClase(claseData)

      const initialAsistencias: Record<string, AsistenciaLocal> = {}
      estudiantesData.forEach((e) => {
        initialAsistencias[e.id] = {
          asistio: true,
          estado: "presente",
          observaciones: "",
        }
      })
      setAsistenciasLocal(initialAsistencias)
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cursoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId])

  const handleStatusChange = (matriculaId: string, estado: string) => {
    setAsistenciasLocal((prev) => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        estado,
        asistio: estado === "presente" || estado === "tardanza",
      },
    }))
  }

  const handleObservacionChange = (matriculaId: string, value: string) => {
    setAsistenciasLocal((prev) => ({
      ...prev,
      [matriculaId]: { ...prev[matriculaId], observaciones: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.entries(asistenciasLocal).map(
        ([matriculaId, data]) => ({
          matricula_id: matriculaId,
          asistio: data.asistio,
          estado: data.estado,
          observaciones: data.observaciones,
        }),
      )

      await instructorService.registrarAsistencia(claseId!, payload)
      toast.success("Asistencia guardada correctamente")
      navigate(`/instructor/cursos/${cursoId}`)
    } catch {
      toast.error("Error al guardar la asistencia")
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando...
      </div>
    )
  if (!curso)
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Curso no encontrado
      </div>
    )

  const presentesCount = Object.values(asistenciasLocal).filter(
    (a) => a.estado === "presente" || a.estado === "tardanza",
  ).length

  const getEstudianteName = (e: EstudianteCurso) => {
    if (e.estudiante) {
      return `${e.estudiante.nombres} ${e.estudiante.apellidos}`
    }
    if (e.participante_externo) {
      return `${e.participante_externo.nombres} ${e.participante_externo.apellidos ?? ""}`
    }
    return "Estudiante externo"
  }

  const getEstudianteCedula = (e: EstudianteCurso) =>
    e.estudiante?.cedula ?? e.participante_externo?.cedula ?? "—"

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        to={`/instructor/cursos/${cursoId}`}
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al curso
      </Link>

      <div
        className="bg-white rounded-2xl overflow-hidden shadow-sm"
        style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
      >
        <div
          className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          style={{
            borderBottomColor: COLORS.BORDER_SUBTLE,
            borderBottomWidth: 1,
            backgroundColor: "oklch(0.97 0 0)",
          }}
        >
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: COLORS.ACCENT }}
            >
              Registro de Asistencia
            </span>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
              Pase de Lista
            </h1>
            <p style={{ color: COLORS.TEXT_MUTED }} className="text-sm">
              {curso.catalogo?.nombre ?? "Curso"} - {curso.nombre_instancia}
            </p>
            {clase && (
              <div
                className="flex items-center gap-2 mt-1 text-sm"
                style={{ color: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                <span className="font-medium">
                  {new Date(clase.fecha_clase).toLocaleDateString("es", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span style={{ color: "oklch(0.9 0.01 45)" }} className="mx-1">
                  •
                </span>
                <span>
                  {clase.hora_inicio} - {clase.hora_fin}
                </span>
              </div>
            )}
          </div>
          <div
            className="px-6 py-3 rounded-2xl text-center text-white"
            style={{ backgroundColor: COLORS.ACCENT, boxShadow: `0 4px 12px ${COLORS.ACCENT}40` }}
          >
            <span
              className="block text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "oklch(0.9 0.01 45)" }}
            >
              Presentes
            </span>
            <span className="text-2xl font-bold">
              {presentesCount}{" "}
              <span
                className="text-sm font-normal"
                style={{ color: "oklch(0.9 0.01 45)" }}
              >
                de {estudiantes.length}
              </span>
            </span>
          </div>
        </div>

        <div className="p-8">
          <div
            className="rounded-xl p-4 flex gap-3 mb-8"
            style={{
              backgroundColor: "oklch(0.97 0.01 45)",
              borderColor: "oklch(0.9 0.02 45)",
              borderWidth: 1,
            }}
          >
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={20}
              style={{ color: COLORS.ACCENT, flexShrink: 0 }}
            />
            <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>
              Selecciona el estado de asistencia para cada estudiante. Por
              defecto todos están marcados como <b>Presente</b>.
            </p>
          </div>

          <div className="space-y-4">
            {estudiantes.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                No hay estudiantes matriculados para registrar asistencia.
              </div>
            ) : (
              estudiantes.map((e) => {
                const currentStatus = asistenciasLocal[e.id]?.estado

                return (
                  <div
                    key={e.id}
                    className="grid md:grid-cols-12 gap-4 items-center p-4 rounded-xl transition-colors"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
                  >
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div
                        className="size-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: "oklch(0.95 0 0)",
                          color: COLORS.TEXT_MUTED,
                        }}
                      >
                        <HugeiconsIcon icon={UserGroupIcon} size={20} />
                      </div>
                      <div>
                        <div
                          className="font-bold leading-tight"
                          style={{ color: COLORS.CHARCOAL }}
                        >
                          {getEstudianteName(e)}
                        </div>
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          {getEstudianteCedula(e)}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <div
                        className="flex p-1 rounded-xl"
                        style={{ backgroundColor: "oklch(0.95 0 0)" }}
                      >
                        {[
                          {
                            id: "presente",
                            label: "P",
                            activeBg: "oklch(0.5 0.1 150)",
                            activeColor: "white",
                          },
                          {
                            id: "ausente",
                            label: "A",
                            activeBg: "oklch(0.45 0.15 20)",
                            activeColor: "white",
                          },
                          {
                            id: "tardanza",
                            label: "T",
                            activeBg: "oklch(0.6 0.15 65)",
                            activeColor: "white",
                          },
                          {
                            id: "justificado",
                            label: "J",
                            activeBg: "oklch(0.5 0.12 240)",
                            activeColor: "white",
                          },
                        ].map((status) => (
                          <button
                            key={status.id}
                            onClick={() => handleStatusChange(e.id, status.id)}
                            className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                            style={{
                              backgroundColor:
                                currentStatus === status.id
                                  ? status.activeBg
                                  : "transparent",
                              color:
                                currentStatus === status.id
                                  ? status.activeColor
                                  : COLORS.TEXT_MUTED,
                              boxShadow:
                                currentStatus === status.id
                                  ? `0 2px 6px ${status.activeBg}40`
                                  : "none",
                            }}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between px-2 mt-1">
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Presente
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Ausente
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Tarde
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Justificado
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={asistenciasLocal[e.id]?.observaciones || ""}
                        onChange={(ev) =>
                          handleObservacionChange(e.id, ev.target.value)
                        }
                        placeholder="Nota..."
                        className="w-full h-10 px-3 text-xs rounded-xl outline-none transition-all"
                        style={{
                          borderWidth: 1,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.CHARCOAL,
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="mt-12 flex justify-end gap-4">
            <Link
              to={`/instructor/cursos/${cursoId}`}
              className="px-6 py-3 rounded-xl font-bold transition-all"
              style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1, color: COLORS.TEXT_MUTED }}
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-xl text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: COLORS.ACCENT,
                boxShadow: `0 4px 12px ${COLORS.ACCENT}40`,
              }}
            >
              {saving ? (
                "Guardando..."
              ) : (
                <>
                  <HugeiconsIcon icon={SaveIcon} size={20} />
                  Guardar Asistencia
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
