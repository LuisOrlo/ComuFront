import { useState, useEffect } from "react"
import { useParams, useSearchParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Calendar03Icon,
  BookOpen01Icon,
  CheckListIcon,
  AssignmentsIcon,
  ArrowRight01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
import { CursoAsistenciaSection } from "@/pages/cursos/detalle/CursoAsistenciaSection"
import {
  instructorService,
  type InstructorCurso,
  type EstudianteCurso,
  type ModuloResumen,
} from "@/services/instructor.service"
import { toast } from "sonner"

export function InstructorCursoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [curso, setCurso] = useState<InstructorCurso | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info")
  const [progresoPeriodo, setProgresoPeriodo] = useState<number>(0)

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData] = await Promise.all([
        instructorService.getDetalleCurso(id!),
        instructorService.getEstudiantesCurso(id!),
      ])
      setCurso(cursoData)
      setEstudiantes(estudiantesData)

      if (cursoData) {
        const inicio = new Date(cursoData.fecha_inicio).getTime()
        const fin = new Date(cursoData.fecha_fin).getTime()
        const ahora = Date.now()
        let prog = 0
        if (!Number.isNaN(inicio) && !Number.isNaN(fin) && fin > inicio) {
          if (ahora <= inicio) prog = 0
          else if (ahora >= fin) prog = 100
          else prog = Math.round(((ahora - inicio) / (fin - inicio)) * 100)
        }
        setProgresoPeriodo(prog)
      }
    } catch {
      toast.error("Error al cargar la información del curso")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

  const getEstudianteId = (e: EstudianteCurso) =>
    e.estudiante?.id ?? null



  const handleDescargarAsistencia = async () => {
    if (!curso) return
    try {
      const data = await instructorService.getAsistenciaPDFData(curso.id)
      await generarListadoAsistenciaPDF(data)
      toast.success("Listado de asistencia descargado")
    } catch {
      toast.error("Error al generar el PDF")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link
        to="/instructor/cursos"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-70"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a mis cursos
      </Link>

      {/* Tarjeta de Encabezado Principal del Curso */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200/90 mb-5">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                {curso.catalogo?.color && (
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: curso.catalogo.color }}
                  />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {curso.catalogo?.nombre ?? "Curso"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                  {curso.modalidad || "Presencial"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-snug">
                {curso.nombre_instancia}
              </h1>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-400" />
                  <span>{curso.horario?.nombre_referencial ?? "Sin horario asignado"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-slate-400" />
                  <span>{estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} matriculado{estudiantes.length !== 1 ? "s" : ""}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
              <button
                onClick={handleDescargarAsistencia}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-500 bg-emerald-500 text-white flex items-center gap-2 transition-all duration-200 hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <HugeiconsIcon icon={Download04Icon} size={14} />
                <span>Descargar Listado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de progreso ubicada abajo */}
        <div className="px-6 md:px-8 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Periodo académico:</span>
            <span>
              {new Date(curso.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              {" — "}
              {curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Indefinido"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:w-64">
            <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progresoPeriodo}%`,
                  backgroundColor: progresoPeriodo >= 100 ? "#059669" : progresoPeriodo > 0 ? COLORS.ACCENT : "#94a3b8",
                }}
              />
            </div>
            <span className="text-xs font-black tabular-nums text-slate-700 shrink-0">
              {progresoPeriodo}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <nav className="flex gap-1 px-6 pt-4 border-b overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ borderColor: "#f1f3f5" }}>
          {[
            { id: "info", label: "Información", icon: BookOpen01Icon },
            { id: "students", label: "Estudiantes", icon: UserGroupIcon },
            { id: "attendance", label: "Asistencia", icon: CheckListIcon },
            { id: "grades", label: "Notas", icon: AssignmentsIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all duration-150 whitespace-nowrap"
              style={{
                backgroundColor: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
                border: activeTab === tab.id ? "1px solid #f1f3f5" : "1px solid transparent",
                borderBottomColor: activeTab === tab.id ? "white" : "transparent",
                marginBottom: -1,
              }}
            >
              <HugeiconsIcon icon={tab.icon} size={16} style={{ color: activeTab === tab.id ? COLORS.ACCENT : "currentColor" }} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6 md:p-8">
          {activeTab === "info" && (
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3">
                <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>Detalles del Curso</h3>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: COLORS.TEXT_MUTED }}>Descripción</p>
                    <p className="text-sm leading-relaxed" style={{ color: COLORS.CHARCOAL }}>
                      {curso.catalogo?.descripcion || "Sin descripción disponible."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>Fecha Inicio</p>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{new Date(curso.fecha_inicio).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>Fecha Fin</p>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: COLORS.TEXT_MUTED }}>Días de clase</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(curso.horario?.dias_semana && curso.horario.dias_semana.length > 0
                        ? curso.horario.dias_semana.map(d => d.dia_semana)
                        : curso.horario?.dia_semana || []
                      ).map((dia: number) => (
                        <span key={dia} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                          {getDiaNombre(dia)}
                        </span>
                      ))}
                      {(!curso.horario?.dias_semana || curso.horario.dias_semana.length === 0) &&
                       (!curso.horario?.dia_semana || curso.horario.dia_semana.length === 0) && (
                        <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>No especificados</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>Módulos</h3>
                <div className="space-y-2.5">
                  {curso.modulos.map((modulo: ModuloResumen) => (
                    <div
                      key={modulo.id}
                      className="p-4 rounded-xl flex items-center justify-between"
                      style={{ backgroundColor: "#f8f9fa", border: "1px solid #f1f3f5" }}
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                          Módulo {modulo.numero_orden}
                        </span>
                        <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.CHARCOAL }}>{modulo.nombre_modulo}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className="block text-[10px] uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Peso en nota final</span>
                        <span className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>{modulo.ponderacion || "—"}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="overflow-x-auto -mx-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y" style={{ borderColor: "#f1f3f5" }}>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Estudiante</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Cédula</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Asistencia</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Promedio</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#f1f3f5" }}>
                  {estudiantes.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                        No hay estudiantes matriculados en este curso.
                      </td>
                    </tr>
                  ) : (
                    estudiantes.map((e) => {
                      const promedio =
                        e.notas.length > 0
                          ? (e.notas.reduce((acc, n) => acc + (n.calificacion || 0), 0) / e.notas.length).toFixed(1)
                          : "—"

                      return (
                        <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`, color: COLORS.ACCENT }}
                              >
                                {getEstudianteName(e).charAt(0)}
                              </div>
                              <span className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{getEstudianteName(e)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{getEstudianteCedula(e)}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${e.porcentaje_asistencia}%`,
                                      backgroundColor: e.porcentaje_asistencia >= 70 ? "#10b981" : e.porcentaje_asistencia >= 50 ? "#f59e0b" : "#ef4444",
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-bold" style={{ color: e.porcentaje_asistencia >= 70 ? "#10b981" : e.porcentaje_asistencia >= 50 ? "#d97706" : "#dc2626" }}>
                                  {e.porcentaje_asistencia}%
                                </span>
                              </div>
                              <span className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                                {e.clases_asistidas}/{e.total_clases} clases
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className="text-sm font-black"
                              style={{ color: promedio !== "—" ? (parseFloat(promedio) >= 6.5 ? "#10b981" : parseFloat(promedio) >= 4 ? "#d97706" : "#dc2626") : COLORS.TEXT_MUTED }}
                            >
                              {promedio}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {getEstudianteId(e) && (
                              <Link to={`/instructor/estudiantes/${getEstudianteId(e)}`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: COLORS.ACCENT }}>
                                Ver perfil
                              </Link>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "attendance" && (
            <CursoAsistenciaSection
              cursoId={curso.id}
              cursoNombre={curso.nombre_instancia}
              modulos={curso.modulos}
            />
          )}

          {activeTab === "grades" && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h3 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Registro de Calificaciones</h3>
                <p className="text-sm mt-1.5" style={{ color: COLORS.TEXT_MUTED }}>Las notas se registran por módulo. Selecciona el módulo correspondiente.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {curso.modulos.map((modulo: ModuloResumen) => (
                  <Link
                    key={modulo.id}
                    to={`/instructor/notas/${curso.id}/${modulo.id}`}
                    className="group flex flex-col p-6 rounded-2xl bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]"
                    style={{ border: "1px solid #e8eaed" }}
                  >
                    <div className="flex items-start gap-5 mb-4">
                      <div
                        className="size-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}
                      >
                        <HugeiconsIcon icon={AssignmentsIcon} size={26} style={{ color: COLORS.ACCENT }} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                          Módulo {modulo.numero_orden}
                        </span>
                        <p className="text-base font-bold mt-1 truncate" style={{ color: COLORS.CHARCOAL }}>{modulo.nombre_modulo}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: "#f1f3f5" }}>
                      <span className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>
                        {modulo.ponderacion || "—"}% de la nota final
                      </span>
                      <div
                        className="size-10 rounded-xl flex items-center justify-center transition-all group-hover:shadow-md"
                        style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  )
}

function getDiaNombre(numero: number): string {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  return dias[numero - 1] || `Día ${numero}`
}
