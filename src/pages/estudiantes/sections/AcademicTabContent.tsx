import { useState, useEffect } from "react"
import type { AcademicProfile, AsistenciasResponse } from "@/services/estudiantes.service"
import { estudiantesService } from "@/services/estudiantes.service"
import {
  GraduationCap,
  Printer,
  Calendar,
  ClipboardCheck,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface AcademicTabContentProps {
  data: AcademicProfile | null
  loading: boolean
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    const clean = dateStr.split("T")[0]
    const [y, m, d] = clean.split("-")
    if (y && m && d) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      return new Intl.DateTimeFormat("es-EC", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date)
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export function AcademicTabContent({ data, loading }: AcademicTabContentProps) {
  const [asistencias, setAsistencias] = useState<AsistenciasResponse | null>(null)
  const [asistenciasLoading, setAsistenciasLoading] = useState(false)
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set())
  const [selectedCursoId, setSelectedCursoId] = useState<string | "todos">("todos")

  useEffect(() => {
    if (!data?.estudiante?.id) return

    setAsistenciasLoading(true)
    estudiantesService
      .getAsistencias(data.estudiante.id)
      .then((res) => {
        setAsistencias(res)
        // Auto expand first module by default
        if (res?.matriculas?.length && res.matriculas[0].modulos?.length) {
          const firstKey = `${res.matriculas[0].matricula_id}-${res.matriculas[0].modulos[0].modulo_id}`
          setExpandedModulos(new Set([firstKey]))
        }
      })
      .catch(() => setAsistencias(null))
      .finally(() => setAsistenciasLoading(false))
  }, [data?.estudiante?.id])

  const toggleModulo = (key: string) => {
    setExpandedModulos((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderAttendancePill = (estado: string) => {
    const s = estado.toLowerCase()
    if (s === "presente") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Presente
        </span>
      )
    }
    if (s === "ausente") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Ausente
        </span>
      )
    }
    if (s === "justificado") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Justificado
        </span>
      )
    }
    if (s === "tardanza") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
          Tardanza
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
        {estado}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="animate-spin size-7 border-2 border-[#fd761a] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400">Cargando expediente académico...</p>
      </div>
    )
  }

  if (!data || data.matriculas.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="size-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Sin cursos registrados</p>
        <p className="text-xs text-slate-400 mt-1">Este estudiante no tiene matrículas activas ni históricas.</p>
      </div>
    )
  }

  const matriculasFiltradas = data.matriculas.filter(
    (m) => selectedCursoId === "todos" || m.id === selectedCursoId
  )

  const activeCursosCount = data.matriculas.filter((m) => m.estado === "activo").length
  const allNotas = data.matriculas.flatMap((m) =>
    (m.notas || []).map((n) => ({ ...n, cursoNombre: m.curso, matriculaId: m.id }))
  ).filter((n) => selectedCursoId === "todos" || n.matriculaId === selectedCursoId)

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Course Selection / Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center shrink-0">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Seguimiento Académico</h3>
            <span className="text-xs text-slate-500">
              {activeCursosCount} curso{activeCursosCount !== 1 ? "s" : ""} activo
              {activeCursosCount !== 1 ? "s" : ""} registrado{activeCursosCount !== 1 ? "s" : ""} para este estudiante
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label className="sr-only" htmlFor="course-select-filter">
            Seleccionar curso
          </label>
          <select
            id="course-select-filter"
            value={selectedCursoId}
            onChange={(e) => setSelectedCursoId(e.target.value)}
            className="h-9 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold border-0 outline-none focus:ring-2 focus:ring-[#fd761a] transition-colors cursor-pointer w-full sm:w-auto"
          >
            <option value="todos">Todos los cursos históricos</option>
            {data.matriculas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.curso} ({m.estado === "activo" ? "En curso" : m.estado})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            title="Descargar o imprimir reporte académico"
            className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Printer className="size-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Course Overview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
            Resumen de Cursos Inscritos
          </span>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {matriculasFiltradas.length} {matriculasFiltradas.length === 1 ? "Registro" : "Registros"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6">Curso</th>
                <th className="py-3 px-4">Inscripción</th>
                <th className="py-3 px-4">Asistencia</th>
                <th className="py-3 px-4">Promedio</th>
                <th className="py-3 px-4">Módulos</th>
                <th className="py-3 px-6 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matriculasFiltradas.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    <div>{m.curso}</div>
                    <span className="block text-[11px] font-normal text-slate-500 font-mono mt-0.5">
                      Matrícula #{m.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {formatDate(m.fecha_inscripcion)}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            m.porcentaje_asistencia >= 70 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(m.porcentaje_asistencia, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold font-mono ${
                          m.porcentaje_asistencia >= 70 ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {m.porcentaje_asistencia}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {m.promedio !== null && m.promedio !== undefined ? (
                      <span className="font-bold text-slate-800 font-mono">{m.promedio}</span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">— (Pendiente)</span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-800 text-xs">
                    {(m.total_modulos ?? m.notas?.length) || 0} módulo{((m.total_modulos ?? m.notas?.length) || 0) !== 1 ? "s" : ""}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        m.estado === "activo"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.estado === "completado"
                          ? "bg-blue-100 text-blue-800"
                          : m.estado === "retirado"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calificaciones por Módulo */}
      {allNotas.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-bold text-slate-900">Calificaciones por Módulo</h4>
              <p className="text-sm text-slate-500 max-w-2xl">
                No hay calificaciones registradas todavía para los cursos seleccionados. Las evaluaciones se
                asentarán conforme avance el ciclo lectivo y sean registradas por el docente o coordinación.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
              <Clock className="size-4 text-slate-400" />
              Pendiente de evaluación
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-[#fd761a]" />
              <h4 className="text-sm font-bold text-slate-900">Calificaciones por Módulo</h4>
            </div>
            <span className="text-xs text-slate-500 font-mono">{allNotas.length} Evaluaciones</span>
          </div>
          <div className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allNotas.map((nota, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="min-w-0 mr-3">
                  <p className="text-xs font-bold text-slate-800 truncate">{nota.modulo}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{nota.cursoNombre}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-black font-mono px-2 py-1 rounded-md ${
                      nota.aprobado
                        ? "bg-blue-50 text-blue-700"
                        : nota.calificacion !== null
                        ? "bg-rose-50 text-rose-600"
                        : "text-slate-400"
                    }`}
                  >
                    {nota.calificacion !== null && nota.calificacion !== undefined
                      ? Number(nota.calificacion).toFixed(1)
                      : "—"}
                  </span>
                  <span className="block text-[10px] font-semibold mt-0.5 text-slate-400">
                    {nota.aprobado ? "Aprobado" : nota.calificacion !== null ? "Reprobado" : "Pendiente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asistencia por módulo: Log Table */}
      <div className="space-y-4">
        {asistenciasLoading && (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="animate-spin size-6 border-2 border-[#fd761a] border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs text-slate-400">Cargando registros detallados de asistencia...</p>
          </div>
        )}

        {!asistenciasLoading && (!asistencias || asistencias.matriculas.length === 0) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
            <Calendar className="size-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Sin registros de asistencia</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Las sesiones de clase aún no han registrado toma de asistencia para este alumno.
            </p>
          </div>
        )}

        {!asistenciasLoading &&
          asistencias?.matriculas
            .filter((am) => selectedCursoId === "todos" || am.matricula_id === selectedCursoId)
            .map((am) => {
              const matriculaData = data.matriculas.find((m) => m.id === am.matricula_id)
              return (
                <div key={am.matricula_id} className="space-y-4">
                  {am.modulos.map((mod) => {
                    const key = `${am.matricula_id}-${mod.modulo_id}`
                    const isOpen = expandedModulos.has(key)

                    return (
                      <div
                        key={key}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
                      >
                        {/* Module header */}
                        <div
                          onClick={() => toggleModulo(key)}
                          className="px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-slate-400">
                              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                            </span>
                            <Calendar className="size-4 text-[#fd761a] shrink-0" />
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {matriculaData?.curso ?? am.curso} · {mod.modulo_nombre}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {mod.total_ausencias > 0 && (
                              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                                {mod.total_ausencias} {mod.total_ausencias === 1 ? "ausencia" : "ausencias"}
                              </span>
                            )}
                            {mod.total_justificados > 0 && (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                {mod.total_justificados} justificada{mod.total_justificados === 1 ? "" : "s"}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              {mod.registros.length} sesión{mod.registros.length !== 1 ? "es" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible log table */}
                        {isOpen && (
                          <div className="overflow-x-auto">
                            {mod.registros.length === 0 ? (
                              <div className="py-8 text-center text-xs text-slate-400">
                                Sin sesiones registradas para este módulo.
                              </div>
                            ) : (
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="bg-white text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                                    <th className="py-3 px-6">Fecha de Sesión</th>
                                    <th className="py-3 px-4">Horario</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-6">Observaciones y Justificativos</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {mod.registros.map((reg, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-3.5 px-6 font-mono text-slate-800 font-medium text-xs whitespace-nowrap">
                                        {formatDate(reg.fecha)}
                                      </td>
                                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                        {reg.hora_inicio} – {reg.hora_fin}
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap">
                                        {renderAttendancePill(reg.estado)}
                                      </td>
                                      <td className="py-3.5 px-6 text-xs text-slate-600">
                                        {reg.observaciones ? (
                                          <span
                                            className={
                                              reg.estado.toLowerCase() === "ausente"
                                                ? "text-rose-700 font-medium"
                                                : reg.estado.toLowerCase() === "justificado"
                                                ? "text-amber-800 font-medium"
                                                : "text-slate-600"
                                            }
                                          >
                                            {reg.observaciones}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">Asistencia regular en aula</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
      </div>
    </div>
  )
}