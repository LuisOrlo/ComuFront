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
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS, ESTADO_ASISTENCIA_BADGE } from "@/lib/constants"
import { generarListadoAsistenciaPDF, generarReporteAsistenciaPDF, type EstudianteReporte } from "@/lib/generarAsistenciaPDF"
import {
  instructorService,
  type InstructorCurso,
  type EstudianteCurso,
  type ModuloResumen,
  type ClaseItem,
  type AsistenciaClaseEstudiante,
} from "@/services/instructor.service"
import { useAuth } from "@/context/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { toast } from "sonner"

export function InstructorCursoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { isAdmin } = usePermission()
  const [curso, setCurso] = useState<InstructorCurso | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info")
  const [clasesPorModulo, setClasesPorModulo] = useState<Record<string, ClaseItem[]>>({})
  const [asistenciasPorClase, setAsistenciasPorClase] = useState<Record<string, AsistenciaClaseEstudiante[]>>({})
  const [cargandoClases, setCargandoClases] = useState(false)
  const [editandoClaseId, setEditandoClaseId] = useState<string | null>(null)
  const [editsLocalCurso, setEditsLocalCurso] = useState<Record<string, { estado: string; observaciones: string }>>({})

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData] = await Promise.all([
        instructorService.getDetalleCurso(id!),
        instructorService.getEstudiantesCurso(id!),
      ])
      setCurso(cursoData)
      setEstudiantes(estudiantesData)
    } catch {
      toast.error("Error al cargar la información del curso")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id || !curso || activeTab !== "attendance") return

    const cargarClasesYAsistencias = async () => {
      setCargandoClases(true)
      const modulos = curso.modulos

      // Cargar clases por módulo
      const clasesMap: Record<string, ClaseItem[]> = {}
      const resultadosClases = await Promise.all(
        modulos.map(m => instructorService.getClasesModulo(m.id).then(clases => ({ moduloId: m.id, clases })))
      )
      resultadosClases.forEach(({ moduloId, clases }) => {
        clasesMap[moduloId] = clases
      })
      setClasesPorModulo(clasesMap)

      // Cargar asistencias por clase (solo las que tienen asistencia registrada)
      const todasClases = Object.values(clasesMap).flat()
      const clasesConAsistencia = todasClases.filter(c => c.asistencia_registrada)

      const asistenciasMap: Record<string, AsistenciaClaseEstudiante[]> = {}
      await Promise.all(
        clasesConAsistencia.map(async (clase) => {
          try {
            const data = await instructorService.getAsistenciaClase(clase.id)
            asistenciasMap[clase.id] = data
          } catch {
            asistenciasMap[clase.id] = []
          }
        })
      )
      setAsistenciasPorClase(asistenciasMap)
      setCargandoClases(false)
    }

    cargarClasesYAsistencias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, curso, activeTab])

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

  const getNombreAsistenciaClase = (e: AsistenciaClaseEstudiante) => {
    if (e.estudiante) return `${e.estudiante.nombres} ${e.estudiante.apellidos}`
    if (e.participante_externo) return `${e.participante_externo.nombres} ${e.participante_externo.apellidos}`
    return "—"
  }

  const getCedulaAsistenciaClase = (e: AsistenciaClaseEstudiante) =>
    e.estudiante?.cedula ?? e.participante_externo?.cedula ?? "—"

  const getCiudadAsistenciaClase = (e: AsistenciaClaseEstudiante) =>
    e.estudiante?.ciudad ?? "—"

  const ESTADO_OPCIONES_CURSO = [
    { value: "presente", label: "Presente", color: "#10b981" },
    { value: "tardanza", label: "Tardanza", color: "#f59e0b" },
    { value: "ausente", label: "Ausente", color: "#ef4444" },
    { value: "justificado", label: "Justificado", color: "#3b82f6" },
  ]

  const iniciarEdicionClase = (claseId: string) => {
    const asistencias = asistenciasPorClase[claseId]
    if (!asistencias) return
    setEditandoClaseId(claseId)
    const initial: Record<string, { estado: string; observaciones: string }> = {}
    asistencias.forEach(a => {
      initial[a.matricula_id] = {
        estado: a.estado || (a.asistio ? "presente" : "ausente"),
        observaciones: a.observaciones || "",
      }
    })
    setEditsLocalCurso(initial)
  }

  const handleCambiarEstadoCurso = (matriculaId: string, estado: string) => {
    setEditsLocalCurso(prev => ({
      ...prev,
      [matriculaId]: { ...prev[matriculaId], estado },
    }))
  }

  const guardarEdicionClase = async (claseId: string) => {
    const asistencias = asistenciasPorClase[claseId]
    if (!asistencias) return
    try {
      const asistenciasPayload = asistencias.map(a => ({
        matricula_id: a.matricula_id,
        asistio: editsLocalCurso[a.matricula_id]?.estado === "presente" || editsLocalCurso[a.matricula_id]?.estado === "tardanza",
        estado: editsLocalCurso[a.matricula_id]?.estado || "presente",
        observaciones: editsLocalCurso[a.matricula_id]?.observaciones || "",
      }))
      await instructorService.registrarAsistencia(claseId, asistenciasPayload)
      toast.success("Asistencia actualizada")
      const data = await instructorService.getAsistenciaClase(claseId)
      setAsistenciasPorClase(prev => ({ ...prev, [claseId]: data }))
      setEditandoClaseId(null)
      setEditsLocalCurso({})
    } catch {
      toast.error("Error al guardar cambios")
    }
  }

  const formatFechaCorta = (f?: string) => {
    if (!f) return "—"
    try {
      const d = new Date(f)
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch { return f }
  }

  const handleDescargarAsistencia = async () => {
    if (!curso) return
    const horario = curso.horario?.nombre_referencial ?? "Sin horario"
    const nombres = estudiantes.map(e => getEstudianteName(e))
    const instructorName = user?.persona
      ? `${user.persona.nombres || ""} ${user.persona.apellidos || ""}`.trim() || user.username
      : curso.instructor
        ? typeof curso.instructor === "string"
          ? curso.instructor
          : `${curso.instructor.nombres} ${curso.instructor.apellidos}`
        : undefined
    await generarListadoAsistenciaPDF(curso.nombre_instancia, horario, nombres, instructorName)
    toast.success("Listado de asistencia descargado")
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

      <div
        className="bg-white rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200 mb-4"
      >
        <div
          className="p-8 md:p-10 text-white"
          style={{ background: COLORS.ACCENT }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                {curso.nombre_instancia}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "oklch(0.88 0.02 50)" }}>
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={BookOpen01Icon} size={15} />
                  {curso.catalogo?.color && (
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: curso.catalogo.color }} />
                  )}
                  {curso.catalogo?.nombre ?? "Sin nombre"}
                </span>
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={15} />
                  {curso.horario?.nombre_referencial ?? "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserGroupIcon} size={15} />
                  {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
             <button
  onClick={handleDescargarAsistencia}
  className="shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold border border-emerald-500 bg-emerald-500 text-white flex items-center gap-2 transition-all duration-200 hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
>
  <HugeiconsIcon icon={Download04Icon} size={14} />
  Descargar Listado
</button>
              <div
                className="shrink-0 px-5 py-2.5 rounded-2xl text-center border backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                <span className="block text-[10px] uppercase tracking-widest font-semibold" style={{ color: "oklch(0.85 0.02 50)" }}>
                  Estado
                </span>
                <span className="text-sm font-black uppercase tracking-wide">{curso.estado}</span>
              </div>
            </div>
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
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#f1f3f5" }}>
                  {estudiantes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>
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
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="max-w-5xl mx-auto space-y-5">
              <h3 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Registro de Asistencia por Clase</h3>

              {cargandoClases ? (
                <div className="bg-white rounded-xl border p-12 text-center text-sm" style={{ borderColor: "#f1f3f5", color: COLORS.TEXT_MUTED }}>
                  Cargando clases y asistencias...
                </div>
              ) : Object.keys(clasesPorModulo).length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#f1f3f5" }}>
                  <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>No se encontraron clases para este curso.</p>
                </div>
              ) : (
                curso.modulos.map(modulo => {
                  const clases = clasesPorModulo[modulo.id]
                  if (!clases || clases.length === 0) return null

                  return (
                    <div key={modulo.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#f1f3f5" }}>
                      <div className="px-5 py-3 border-b" style={{ borderColor: "#f1f3f5", backgroundColor: "#fafafa" }}>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                          Módulo {modulo.numero_orden}
                        </span>
                        <span className="text-sm font-bold ml-3" style={{ color: COLORS.CHARCOAL }}>
                          {modulo.nombre_modulo}
                        </span>
                        <span className="text-xs ml-3" style={{ color: COLORS.TEXT_MUTED }}>
                          {clases.filter(c => c.asistencia_registrada).length}/{clases.length} clases con asistencia
                        </span>
                      </div>

                      <div className="divide-y" style={{ borderColor: "#f1f3f5" }}>
                        {clases.map(clase => {
                          const asistencias = asistenciasPorClase[clase.id] || []
                          const editando = editandoClaseId === clase.id
                          const asistentes = asistencias.filter(a => a.asistio).length
                          const total = asistencias.length
                          const pct = total > 0 ? Math.round((asistentes / total) * 100) : 0

                          return (
                            <div key={clase.id} className="px-5 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-3">
                                  <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                                    {formatFechaCorta(clase.fecha_clase)}
                                  </p>
                                  {clase.asistencia_registrada ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                                        <HugeiconsIcon icon={UserGroupIcon} size={14} />
                                        <span>
                                          <strong style={{ color: COLORS.CHARCOAL }}>{asistentes}</strong>
                                          <span className="mx-0.5">/</span>
                                          <strong style={{ color: COLORS.CHARCOAL }}>{total}</strong>
                                          {" asistentes"}
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                                        style={{
                                          backgroundColor: pct >= 70 ? "#d1fae5" : pct >= 50 ? "#fef3c7" : "#fee2e2",
                                          color: pct >= 70 ? "#065f46" : pct >= 50 ? "#92400e" : "#991b1b"
                                        }}>
                                        {pct}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                                      style={{ backgroundColor: "oklch(0.93 0.06 20)", color: "oklch(0.55 0.15 20)" }}>
                                      Sin registro
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                {clase.asistencia_registrada ? (
                                  <button onClick={() => {
                                    const reporte: EstudianteReporte[] = asistencias.map(a => ({
                                      nombres: a.estudiante?.nombres || a.participante_externo?.nombres || "—",
                                      apellidos: a.estudiante?.apellidos || a.participante_externo?.apellidos || "—",
                                      cedula: a.estudiante?.cedula || a.participante_externo?.cedula || "—",
                                      ciudad: a.estudiante?.ciudad || "—",
                                      asistio: a.asistio,
                                    }))
                                    generarReporteAsistenciaPDF(
                                      curso.nombre_instancia,
                                      formatFechaCorta(clase.fecha_clase),
                                      reporte,
                                    ).then(() => toast.success("Reporte descargado"))
                                      .catch(() => toast.error("Error al generar PDF"))
                                  }}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                                    style={{ borderColor: "#f1f3f5", color: COLORS.ACCENT }}>
                                    <HugeiconsIcon icon={Download04Icon} size={12} />Reporte
                                  </button>
                                ) : (
                                  <button onClick={() => {
                                    const nombres = asistencias.length > 0
                                      ? asistencias.map(a => `${a.estudiante?.nombres || a.participante_externo?.nombres || "—"} ${a.estudiante?.apellidos || a.participante_externo?.apellidos || "—"}`)
                                      : estudiantes.map(e => getEstudianteName(e))
                                    const horario = curso.horario?.nombre_referencial ?? "Sin horario"
                                    generarListadoAsistenciaPDF(curso.nombre_instancia, horario, nombres)
                                      .then(() => toast.success("Listado descargado"))
                                      .catch(() => toast.error("Error al generar PDF"))
                                  }}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-500 bg-emerald-500 text-white transition-all"
                                    style={{ borderColor: "#10b981" }}>
                                    <HugeiconsIcon icon={Download04Icon} size={12} />Listado
                                  </button>
                                )}
                                {!editando && isAdmin && (
                                  <button onClick={() => iniciarEdicionClase(clase.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                                    style={{ borderColor: "#f1f3f5", color: COLORS.ACCENT }}>
                                    <HugeiconsIcon icon={Edit01Icon} size={12} />Editar
                                  </button>
                                )}
                              </div>
                            </div>
                              {clase.observaciones && (
                                <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f1f3f5" }}>
                                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>Observaciones</p>
                                  <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>{clase.observaciones}</p>
                                </div>
                              )}

                              {clase.asistencia_registrada && (
                                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#f1f3f5" }}>
                                  {asistencias.length === 0 ? (
                                    <div className="p-6 text-center text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                                      Sin datos de asistencia
                                    </div>
                                  ) : (
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="border-b" style={{ borderColor: "#f1f3f5" }}>
                                          <th className="text-left font-semibold px-4 py-2.5" style={{ color: COLORS.TEXT_MUTED }}>Nombres</th>
                                          <th className="text-left font-semibold px-3 py-2.5" style={{ color: COLORS.TEXT_MUTED }}>Apellidos</th>
                                          <th className="text-left font-semibold px-3 py-2.5" style={{ color: COLORS.TEXT_MUTED }}>Cédula</th>
                                          <th className="text-left font-semibold px-3 py-2.5" style={{ color: COLORS.TEXT_MUTED }}>Ciudad</th>
                                          <th className="text-left font-semibold px-3 py-2.5" style={{ color: COLORS.TEXT_MUTED }}>Asistió</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {asistencias.map(a => {
                                          const edit = editando ? editsLocalCurso[a.matricula_id] : undefined
                                          const estadoActual = edit?.estado || a.estado || (a.asistio ? "presente" : "ausente")
                                          return (
                                            <tr key={a.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: "#f1f3f5" }}>
                                              <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                                                {getNombreAsistenciaClase(a)}
                                              </td>
                                              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                                                {a.estudiante?.apellidos || a.participante_externo?.apellidos || "—"}
                                              </td>
                                              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: COLORS.TEXT_MUTED }}>
                                                {getCedulaAsistenciaClase(a)}
                                              </td>
                                              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: COLORS.TEXT_MUTED }}>
                                                {getCiudadAsistenciaClase(a)}
                                              </td>
                                              <td className="px-3 py-2.5 whitespace-nowrap">
                                                {editando ? (
                                                  <select
                                                    value={estadoActual}
                                                    onChange={e => handleCambiarEstadoCurso(a.matricula_id, e.target.value)}
                                                    className="px-2 py-1 rounded border text-[11px] font-semibold outline-none"
                                                    style={{ borderColor: "#f1f3f5" }}
                                                  >
                                                    {ESTADO_OPCIONES_CURSO.map(op => (
                                                      <option key={op.value} value={op.value}>{op.label}</option>
                                                    ))}
                                                  </select>
                                                ) : (
                                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
                                                    style={{
                                                      backgroundColor: ESTADO_ASISTENCIA_BADGE[estadoActual]?.bg || "#fee2e2",
                                                      color: ESTADO_ASISTENCIA_BADGE[estadoActual]?.text || "#991b1b",
                                                    }}>
                                                    {ESTADO_ASISTENCIA_BADGE[estadoActual]?.label || "No"}
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}

                              {editando && (
                                <div className="mt-2 flex items-center justify-end gap-2">
                                  <button onClick={() => { setEditandoClaseId(null); setEditsLocalCurso({}) }}
                                    className="px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all"
                                    style={{ borderColor: "#f1f3f5", color: COLORS.TEXT_MUTED }}>
                                    Cancelar
                                  </button>
                                  <button onClick={() => guardarEdicionClase(clase.id)}
                                    className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white transition-all active:scale-[0.97]"
                                    style={{ backgroundColor: COLORS.ACCENT }}>
                                    Guardar Cambios
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
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
