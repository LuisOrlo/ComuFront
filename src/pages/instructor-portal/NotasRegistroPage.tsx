import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, SaveIcon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  instructorService,
  type InstructorCurso,
  type EstudianteCurso,
  type ModuloResumen,
} from "@/services/instructor.service"
import { toast } from "sonner"

type NotaLocal = { calificacion: string; observaciones: string }

export function NotasRegistroPage() {
  const { cursoId, moduloId } = useParams<{ cursoId: string; moduloId: string }>()
  const navigate = useNavigate()
  const [curso, setCurso] = useState<InstructorCurso | null>(null)
  const [modulo, setModulo] = useState<ModuloResumen | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notasLocal, setNotasLocal] = useState<Record<string, NotaLocal>>({})

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData] = await Promise.all([
        instructorService.getDetalleCurso(cursoId!),
        instructorService.getEstudiantesCurso(cursoId!),
      ])

      const mod = cursoData.modulos.find((m) => m.id === moduloId) ?? null
      setCurso(cursoData)
      setModulo(mod)
      setEstudiantes(estudiantesData)

      const initialNotas: Record<string, NotaLocal> = {}
      estudiantesData.forEach((e) => {
        const notaExistente = e.notas.find((n) => n.modulo_id === moduloId)
        initialNotas[e.id] = {
          calificacion: notaExistente?.calificacion?.toString() || "",
          observaciones: notaExistente?.observaciones || "",
        }
      })
      setNotasLocal(initialNotas)
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cursoId && moduloId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId, moduloId])

  const handleNotaChange = (matriculaId: string, value: string) => {
    const val = value.replace(",", ".")
    if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 10)) {
      setNotasLocal((prev) => ({
        ...prev,
        [matriculaId]: { ...prev[matriculaId], calificacion: val },
      }))
    }
  }

  const handleObservacionChange = (matriculaId: string, value: string) => {
    setNotasLocal((prev) => ({
      ...prev,
      [matriculaId]: { ...prev[matriculaId], observaciones: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.entries(notasLocal).map(
        ([matriculaId, data]) => ({
          matricula_id: matriculaId,
          calificacion: parseFloat(data.calificacion) || 0,
          observaciones: data.observaciones,
        }),
      )

      await instructorService.registrarNotas(moduloId!, payload)
      toast.success("Notas guardadas correctamente")
      navigate(`/instructor/cursos/${cursoId}`)
    } catch {
      toast.error("Error al guardar las notas")
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
  if (!modulo)
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Módulo no encontrado
      </div>
    )

  const aprobadosCount = Object.values(notasLocal).filter(
    (n) => parseFloat(n.calificacion) >= 6.5,
  ).length
  const reprobadosCount = estudiantes.length - aprobadosCount

  const getEstudianteName = (e: EstudianteCurso) => {
    if (e.estudiante) {
      return `${e.estudiante.nombres} ${e.estudiante.apellidos}`
    }
    if (e.participante_externo) {
      return `${e.participante_externo.nombres} ${e.participante_externo.apellidos ?? ""}`
    }
    return "Estudiante externo"
  }

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
              Registro de Notas
            </span>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
              {modulo.nombre_modulo}
            </h1>
            <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
              {curso?.catalogo?.nombre ?? "Curso"} - {curso?.nombre_instancia ?? ""}
            </p>
          </div>
          <div className="flex gap-4">
            <div
              className="text-center px-4 py-2 rounded-xl"
              style={{
                backgroundColor: "oklch(0.95 0.03 150)",
                borderColor: "oklch(0.88 0.04 150)",
                borderWidth: 1,
              }}
            >
              <span
                className="block text-[10px] font-bold uppercase"
                style={{ color: "oklch(0.5 0.1 150)" }}
              >
                Aprobados
              </span>
              <span
                className="text-xl font-bold"
                style={{ color: "oklch(0.45 0.1 150)" }}
              >
                {aprobadosCount}
              </span>
            </div>
            <div
              className="text-center px-4 py-2 rounded-xl"
              style={{
                backgroundColor: "oklch(0.95 0.04 20)",
                borderColor: "oklch(0.88 0.05 20)",
                borderWidth: 1,
              }}
            >
              <span
                className="block text-[10px] font-bold uppercase"
                style={{ color: "oklch(0.45 0.15 20)" }}
              >
                Reprobados
              </span>
              <span
                className="text-xl font-bold"
                style={{ color: "oklch(0.45 0.15 20)" }}
              >
                {reprobadosCount}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div
            className="rounded-xl p-4 flex gap-3 mb-8"
            style={{
              backgroundColor: "oklch(0.95 0.04 65)",
              borderColor: "oklch(0.88 0.05 65)",
              borderWidth: 1,
            }}
          >
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={20}
              style={{ color: "oklch(0.5 0.08 65)", flexShrink: 0 }}
            />
            <p className="text-sm" style={{ color: "oklch(0.4 0.06 65)" }}>
              Recuerda que la nota mínima de aprobación es <b>6.5</b>. El sistema
              validará automáticamente el resultado académico basado en esta nota
              y el 70% de asistencia mínima.
            </p>
          </div>

          <div className="space-y-4">
            {estudiantes.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                No hay estudiantes matriculados en este curso.
              </div>
            ) : (
              estudiantes.map((e) => {
                const nota = parseFloat(notasLocal[e.id]?.calificacion || "0")
                const isApproved = nota >= 6.5
                const attendanceWarning = e.porcentaje_asistencia < 70

                return (
                  <div
                    key={e.id}
                    className="grid md:grid-cols-12 gap-4 items-center p-4 rounded-xl transition-colors"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
                  >
                    <div className="md:col-span-4">
                      <div
                        className="font-bold"
                        style={{ color: COLORS.CHARCOAL }}
                      >
                        {getEstudianteName(e)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: attendanceWarning
                              ? "oklch(0.95 0.04 20)"
                              : "oklch(0.95 0.03 150)",
                            color: attendanceWarning
                              ? "oklch(0.45 0.15 20)"
                              : "oklch(0.45 0.1 150)",
                          }}
                        >
                          {e.porcentaje_asistencia}% Asistencia
                        </span>
                        {attendanceWarning && (
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: "oklch(0.45 0.15 20)" }}
                          >
                            No cumple asistencia
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={notasLocal[e.id]?.calificacion || ""}
                          onChange={(ev) =>
                            handleNotaChange(e.id, ev.target.value)
                          }
                          placeholder="0.00"
                          className="w-full h-12 text-center text-lg font-bold rounded-xl outline-none transition-all"
                          style={{
                            borderWidth: 1,
                            borderColor:
                              nota > 0
                                ? isApproved
                                  ? "oklch(0.7 0.1 150)"
                                  : "oklch(0.6 0.15 20)"
                                : COLORS.BORDER_SUBTLE,
                            backgroundColor:
                              nota > 0
                                ? isApproved
                                  ? "oklch(0.95 0.03 150)"
                                  : "oklch(0.95 0.04 20)"
                                : "white",
                            color:
                              nota > 0
                                ? isApproved
                                  ? "oklch(0.45 0.1 150)"
                                  : "oklch(0.45 0.15 20)"
                                : COLORS.CHARCOAL,
                          }}
                        />
                        <span
                          className="absolute -top-2 -right-1 bg-white px-1 text-[8px] font-bold uppercase"
                          style={{ color: COLORS.TEXT_MUTED }}
                        >
                          Nota
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={notasLocal[e.id]?.observaciones || ""}
                        onChange={(ev) =>
                          handleObservacionChange(e.id, ev.target.value)
                        }
                        placeholder="Observaciones (opcional)"
                        className="w-full h-12 px-4 text-sm rounded-xl outline-none transition-all"
                        style={{
                          borderWidth: 1,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.CHARCOAL,
                        }}
                      />
                    </div>

                    <div className="md:col-span-2 text-center">
                      {nota > 0 && (
                        <div
                          className="text-[10px] font-bold uppercase"
                          style={{
                            color:
                              isApproved && !attendanceWarning
                                ? "oklch(0.45 0.1 150)"
                                : "oklch(0.45 0.15 20)",
                          }}
                        >
                          {isApproved && !attendanceWarning
                            ? "Aprobado"
                            : "Reprobado"}
                        </div>
                      )}
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
                  Guardar Notas
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
