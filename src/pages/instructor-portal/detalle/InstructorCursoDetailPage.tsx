import { useState, useEffect } from "react"
import { useParams, useSearchParams, Link } from "react-router"
import {
  ArrowLeft,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  ArrowRight,
  Download,
  Clock,
  User,
  X,
  Loader2,
} from "lucide-react"
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

function getEstudianteApellidos(e: EstudianteCurso): string {
  return (e.estudiante?.apellidos || e.participante_externo?.apellidos || "").trim()
}

function getEstudianteNombres(e: EstudianteCurso): string {
  return (e.estudiante?.nombres || e.participante_externo?.nombres || "").trim()
}

function compararEstudiantesPorApellido(a: EstudianteCurso, b: EstudianteCurso): number {
  const apeA = getEstudianteApellidos(a)
  const apeB = getEstudianteApellidos(b)
  const comp = apeA.localeCompare(apeB, "es", { sensitivity: "base" })
  if (comp !== 0) return comp
  const nomA = getEstudianteNombres(a)
  const nomB = getEstudianteNombres(b)
  return nomA.localeCompare(nomB, "es", { sensitivity: "base" })
}

export function InstructorCursoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [curso, setCurso] = useState<InstructorCurso | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(true)
  const tabParam = searchParams.get("tab")
  const resolveTab = (t?: string | null) => (t === "asistencia" ? "attendance" : t || "info")
  const [activeTab, setActiveTab] = useState(resolveTab(tabParam))
  const [progresoPeriodo, setProgresoPeriodo] = useState<number>(0)

  // Estado para el modal de perfil de estudiante
  const [estudianteModal, setEstudianteModal] = useState<EstudianteCurso | null>(null)
  const [detallePersonal, setDetallePersonal] = useState<{
    id: string
    nombres: string
    apellidos: string
    cedula?: string
    correo?: string
    celular?: string
    ciudad?: { nombre: string }
    perfil_estudiante?: {
      ocupacion?: string
      direccion?: string
      estado_civil?: string
      edad?: number
      nivel_educativo?: string
    } | null
  } | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const abrirModalEstudiante = async (e: EstudianteCurso) => {
    setEstudianteModal(e)
    setDetallePersonal(null)
    const personaId = e.estudiante?.id || e.id
    if (personaId) {
      setLoadingDetalle(true)
      try {
        const data = await instructorService.getDetalleEstudiante(personaId)
        setDetallePersonal(data)
      } catch {
        // Fallback silencioso con datos ya existentes en e
      } finally {
        setLoadingDetalle(false)
      }
    }
  }

  useEffect(() => {
    const t = searchParams.get("tab")
    if (t) {
      setActiveTab(resolveTab(t))
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData] = await Promise.all([
        instructorService.getDetalleCurso(id!),
        instructorService.getEstudiantesCurso(id!),
      ])
      setCurso(cursoData)
      setEstudiantes([...estudiantesData].sort(compararEstudiantesPorApellido))

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

  if (loading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto animate-spin">
          <BookOpen size={20} />
        </div>
        <p className="text-sm font-bold text-slate-500">Cargando información del curso...</p>
      </div>
    )
  }

  if (!curso) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-3">
        <h3 className="text-base font-bold text-slate-800">Curso no encontrado</h3>
        <p className="text-xs text-slate-500">No pudimos encontrar la información del curso solicitado.</p>
        <Link
          to="/instructor/cursos"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all"
        >
          <ArrowLeft size={14} />
          Volver a mis cursos
        </Link>
      </div>
    )
  }

  const getEstudianteName = (e: EstudianteCurso) => {
    const ape = getEstudianteApellidos(e)
    const nom = getEstudianteNombres(e)
    if (ape && nom) return `${ape} ${nom}`
    return ape || nom || "Estudiante"
  }

  const getEstudianteCedula = (e: EstudianteCurso) =>
    e.estudiante?.cedula ?? e.participante_externo?.cedula ?? "—"

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

  const tabsConfig = [
    { id: "info", label: "Información", shortLabel: "Info", icon: BookOpen },
    { id: "students", label: "Estudiantes", shortLabel: "Estudiantes", icon: Users },
    { id: "attendance", label: "Asistencia", shortLabel: "Asistencia", icon: ClipboardCheck },
    { id: "grades", label: "Notas", shortLabel: "Notas", icon: Award },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Botón de retroceso */}
      <Link
        to="/instructor/cursos"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver a mis cursos
      </Link>

      {/* Tarjeta de Encabezado Principal del Curso */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200/90 min-w-0">
        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2.5 min-w-0 flex-1">
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
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                  {curso.modalidad || "Presencial"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-snug break-words">
                {curso.nombre_instancia}
              </h1>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500 pt-0.5">
                <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <Clock size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate max-w-[260px]">{curso.horario?.nombre_referencial ?? "Sin horario asignado"}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 text-blue-700 font-bold">
                  <Users size={14} className="shrink-0" />
                  <span>{estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""}</span>
                </span>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
              <button
                onClick={handleDescargarAsistencia}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download size={15} />
                <span>Descargar Listado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de progreso inferior */}
        <div className="px-5 sm:px-6 md:px-8 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Periodo académico:</span>
            <span>
              {new Date(curso.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              {" — "}
              {curso.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Indefinido"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
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

      {/* Contenedor Principal con Tabs y Contenido */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden min-w-0">
        {/* ── BARRA DE TABS PARA MÓVIL (< md): Cuadrícula simétrica sin scroll ── */}
        <div className="p-2 border-b border-slate-100 md:hidden">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200/70 text-center">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} className={active ? "text-orange-600" : "text-slate-400"} />
                  <span className="mt-1 leading-none">{tab.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── BARRA DE TABS PARA ESCRITORIO (>= md) ── */}
        <nav className="hidden md:flex gap-2 px-6 pt-4 border-b border-slate-100 bg-white" aria-label="Pestañas del curso">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  active
                    ? "border-orange-500 text-orange-600 bg-orange-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} className={active ? "text-orange-600" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Contenido de la pestaña activa */}
        <div className="p-4 sm:p-6 md:p-8 min-w-0">
          {/* TAB 1: INFORMACIÓN */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
              <div className="lg:col-span-3 space-y-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Detalles del Curso
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Descripción
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700 break-words">
                      {curso.catalogo?.descripcion || "Sin descripción disponible para este curso."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Fecha de Inicio
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(curso.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Fecha de Finalización
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {curso.fecha_fin
                          ? new Date(curso.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
                          : "No definida"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Días de clase programados
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(curso.horario?.dias_semana && curso.horario.dias_semana.length > 0
                        ? curso.horario.dias_semana.map((d) => d.dia_semana)
                        : curso.horario?.dia_semana || []
                      ).map((dia: number) => (
                        <span
                          key={dia}
                          className="text-xs px-3 py-1 rounded-full font-bold bg-orange-50 border border-orange-200 text-orange-700"
                        >
                          {getDiaNombre(dia)}
                        </span>
                      ))}
                      {(!curso.horario?.dias_semana || curso.horario.dias_semana.length === 0) &&
                        (!curso.horario?.dia_semana || curso.horario.dia_semana.length === 0) && (
                          <span className="text-xs text-slate-400">Sin días de clase especificados en el horario</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Módulos (Sin bloque de peso) */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Módulos del Curso ({curso.modulos.length})
                </h3>
                <div className="space-y-2.5">
                  {curso.modulos.map((modulo: ModuloResumen) => (
                    <div
                      key={modulo.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                          Módulo {modulo.numero_orden}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-2 break-words">
                          {modulo.nombre_modulo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESTUDIANTES */}
          {activeTab === "students" && (
            <div className="space-y-3 min-w-0">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Total de estudiantes: <strong className="text-slate-800 font-bold">{estudiantes.length}</strong></span>
              </div>

              {/* Vista Móvil (< sm): Tarjetas sin scroll horizontal */}
              <div className="block sm:hidden space-y-2.5">
                {estudiantes.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No hay estudiantes matriculados en este curso actualmente.
                  </div>
                ) : (
                  estudiantes.map((e, idx) => {
                    const promedio =
                      e.notas.length > 0
                        ? (e.notas.reduce((acc, n) => acc + (n.calificacion || 0), 0) / e.notas.length).toFixed(1)
                        : "—"
                    const studentName = getEstudianteName(e)

                    return (
                      <div key={e.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono text-slate-400 mr-1.5">#{idx + 1}</span>
                            <span className="font-bold text-sm text-slate-900 break-words">{studentName}</span>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">CI: {getEstudianteCedula(e)}</p>
                          </div>
                          <span
                            className="shrink-0 font-bold text-xs px-2.5 py-1 rounded-lg"
                            style={{
                              backgroundColor: promedio !== "—" ? (parseFloat(promedio) >= 6.5 ? "#d1fae5" : parseFloat(promedio) >= 4 ? "#fef3c7" : "#fee2e2") : "#f3f4f6",
                              color: promedio !== "—" ? (parseFloat(promedio) >= 6.5 ? "#065f46" : parseFloat(promedio) >= 4 ? "#92400e" : "#991b1b") : "#6b7280",
                            }}
                          >
                            Prom: {promedio}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{e.porcentaje_asistencia}%</span>
                            <span className="text-[10px] text-slate-400">({e.clases_asistidas}/{e.total_clases} clases)</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => abrirModalEstudiante(e)}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 active:scale-95 transition-all cursor-pointer"
                          >
                            Ver perfil
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Vista Escritorio (>= sm): Tabla completa */}
              <div className="hidden sm:block w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 sm:px-6">Estudiante</th>
                      <th className="py-3.5 px-4">Cédula</th>
                      <th className="py-3.5 px-4 text-center">Asistencia</th>
                      <th className="py-3.5 px-4 text-center">Promedio</th>
                      <th className="py-3.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estudiantes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                          No hay estudiantes matriculados en este curso actualmente.
                        </td>
                      </tr>
                    ) : (
                      estudiantes.map((e) => {
                        const promedio =
                          e.notas.length > 0
                            ? (e.notas.reduce((acc, n) => acc + (n.calificacion || 0), 0) / e.notas.length).toFixed(1)
                            : "—"

                        const studentName = getEstudianteName(e)

                        return (
                          <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6">
                              <span className="font-bold text-slate-800 break-words">{studentName}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              {getEstudianteCedula(e)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${e.porcentaje_asistencia}%`,
                                        backgroundColor: e.porcentaje_asistencia >= 70 ? "#10b981" : e.porcentaje_asistencia >= 50 ? "#f59e0b" : "#ef4444",
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="font-bold text-xs"
                                    style={{
                                      color: e.porcentaje_asistencia >= 70 ? "#059669" : e.porcentaje_asistencia >= 50 ? "#d97706" : "#dc2626",
                                    }}
                                  >
                                    {e.porcentaje_asistencia}%
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {e.clases_asistidas}/{e.total_clases} clases
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className="font-bold text-xs px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: promedio !== "—" ? (parseFloat(promedio) >= 6.5 ? "#d1fae5" : parseFloat(promedio) >= 4 ? "#fef3c7" : "#fee2e2") : "#f3f4f6",
                                  color: promedio !== "—" ? (parseFloat(promedio) >= 6.5 ? "#065f46" : parseFloat(promedio) >= 4 ? "#92400e" : "#991b1b") : "#6b7280",
                                }}
                              >
                                {promedio}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => abrirModalEstudiante(e)}
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                              >
                                Ver perfil
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ASISTENCIA */}
          {activeTab === "attendance" && (
            <CursoAsistenciaSection
              cursoId={curso.id}
              cursoNombre={curso.nombre_instancia}
              modulos={curso.modulos}
            />
          )}

          {/* TAB 4: NOTAS */}
          {activeTab === "grades" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Registro de Calificaciones</h3>
                <p className="text-xs text-slate-500">
                  Las notas se registran por módulo académico. Selecciona el módulo correspondiente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {curso.modulos.map((modulo: ModuloResumen) => (
                  <Link
                    key={modulo.id}
                    to={`/instructor/notas/${curso.id}/${modulo.id}`}
                    className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 transition-all hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] overflow-hidden"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-orange-600 border border-orange-100 group-hover:scale-105 transition-transform">
                        <Award size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                          Módulo {modulo.numero_orden}
                        </span>
                        <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 line-clamp-2 break-words group-hover:text-orange-600 transition-colors">
                          {modulo.nombre_modulo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-500">
                        {modulo.ponderacion || "—"}% de la nota final
                      </span>
                      <div className="size-8 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Perfil del Estudiante */}
      {estudianteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => setEstudianteModal(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
                  <User size={22} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Ficha del Estudiante
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 break-words leading-tight">
                    {getEstudianteName(estudianteModal)}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    CI: {getEstudianteCedula(estudianteModal)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEstudianteModal(null)}
                className="size-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Datos Personales y de Contacto */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Información de Contacto
              </h4>

              {loadingDetalle ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={20} className="animate-spin text-orange-500" />
                  <span className="text-xs">Cargando detalles...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correo</span>
                    <span className="font-semibold text-slate-800 break-all">
                      {detallePersonal?.correo || estudianteModal.estudiante?.correo || estudianteModal.participante_externo?.correo || "No registrado"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Celular / Teléfono</span>
                    <span className="font-semibold text-slate-800">
                      {detallePersonal?.celular || "No registrado"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ciudad / Sede</span>
                    <span className="font-semibold text-slate-800">
                      {typeof detallePersonal?.ciudad === "string"
                        ? detallePersonal.ciudad
                        : detallePersonal?.ciudad?.nombre || "No especificada"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ocupación</span>
                    <span className="font-semibold text-slate-800">
                      {detallePersonal?.perfil_estudiante?.ocupacion || "No especificada"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nivel de Estudio</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {detallePersonal?.perfil_estudiante?.nivel_educativo || "No especificado"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Edad</span>
                    <span className="font-semibold text-slate-800">
                      {detallePersonal?.perfil_estudiante?.edad != null
                        ? `${detallePersonal.perfil_estudiante.edad} años`
                        : "No registrada"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Rendimiento en el Curso Actual */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rendimiento en este Curso
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
                    Asistencia General
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">
                      {estudianteModal.porcentaje_asistencia}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({estudianteModal.clases_asistidas}/{estudianteModal.total_clases} clases)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    Promedio Calificaciones
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">
                      {estudianteModal.notas.length > 0
                        ? (estudianteModal.notas.reduce((acc, n) => acc + (n.calificacion || 0), 0) / estudianteModal.notas.length).toFixed(1)
                        : "—"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">/ 10</span>
                  </div>
                </div>
              </div>

              {/* Detalle de notas por módulo si existen */}
              {estudianteModal.notas.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Notas Registradas por Módulo
                  </span>
                  <div className="divide-y divide-slate-100">
                    {estudianteModal.notas.map((n, i) => {
                      const mod = curso?.modulos?.find((m) => m.id === n.modulo_id)
                      return (
                        <div key={n.id || i} className="py-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 truncate max-w-[200px]">
                            {mod?.nombre_modulo || `Módulo ${i + 1}`}
                          </span>
                          <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                            {Number(n.calificacion).toFixed(1)} / 10
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de cierre */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEstudianteModal(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getDiaNombre(numero: number): string {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  return dias[numero - 1] || `Día ${numero}`
}
