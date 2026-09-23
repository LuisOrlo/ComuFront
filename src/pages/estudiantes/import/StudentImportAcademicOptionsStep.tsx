import { useEffect, useState } from "react"
import { studentImportService, type ImportCourse } from "@/services/student-import.service"
import { formatDate, parseLocalDate } from "@/lib/utils"

interface Props {
  loading: boolean
  onBack: () => void
  onSubmit: (options: Record<string, unknown>) => void
}

export function StudentImportAcademicOptionsStep({ loading, onBack, onSubmit }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [historical, setHistorical] = useState(false)
  const [courseId, setCourseId] = useState("")
  const [financeEnabled, setFinanceEnabled] = useState(false)
  const [courses, setCourses] = useState<ImportCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [error, setError] = useState("")
  const selectedCourse = courses.find((item) => item.id === courseId)
  const customCourseSelected = Boolean(selectedCourse?.es_personalizado)
  const isHistoricalCourse = (course: ImportCourse) => {
    if (!course.fecha_inicio) return false
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - 7)
    return parseLocalDate(course.fecha_inicio) < cutoff
  }

  const courseLabel = (course: ImportCourse) => {
    const name = course.nombre_instancia || course.catalogo?.nombre || "Curso"
    const dates = course.fecha_inicio
      ? `${formatDate(course.fecha_inicio)}${course.fecha_fin ? ` → ${formatDate(course.fecha_fin)}` : ""}`
      : "sin fecha"
    const city = course.ciudad?.nombre ? ` · ${course.ciudad.nombre}` : ""
    const historicalLabel = isHistoricalCourse(course) ? " · Histórico" : ""
    return `${name} · ${dates}${city}${historicalLabel}`
  }

  useEffect(() => {
    if (!enabled) return
    setLoadingCourses(true)
    setError("")
    studentImportService.getCourses(historical)
      .then(setCourses)
      .catch(() => setError("No se pudieron cargar los cursos disponibles."))
      .finally(() => setLoadingCourses(false))
  }, [enabled, historical])

  return <div className="max-w-3xl space-y-5">
    <div><h3 className="font-semibold text-gray-900">Configuración académica</h3><p className="mt-1 text-sm text-gray-500">La matrícula es opcional y siempre se registrará sin información financiera.</p></div>
    <label className="flex items-start gap-3 rounded-xl border p-4">
      <input type="checkbox" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); if (!event.target.checked) setCourseId("") }} className="mt-1" />
      <span><span className="font-medium text-gray-900">Matricular estudiantes en un curso</span><span className="block text-sm text-gray-500">Usa un CursoAbierto existente; el Excel no crea ni modifica cursos.</span></span>
    </label>
    {enabled && <div className="space-y-3 rounded-xl bg-blue-50 p-4">
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={historical} onChange={(event) => { setHistorical(event.target.checked); setCourseId("") }} />Mostrar cursos históricos</label>
      <select value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={loadingCourses} className="w-full rounded-lg border-gray-200 text-sm">
        <option value="">{loadingCourses ? "Cargando cursos..." : "Seleccionar curso"}</option>
        {courses.map((course) => <option key={course.id} value={course.id}>{courseLabel(course)}</option>)}
      </select>
      {selectedCourse && <div className="text-xs text-blue-900">{courseLabel(selectedCourse)} · {selectedCourse.modalidad || "modalidad no indicada"}{selectedCourse.es_personalizado && <span className="ml-2 font-semibold text-orange-700">Personalizado</span>}</div>}
      {customCourseSelected && <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">Los cursos personalizados utilizan un flujo académico y financiero especial y todavía no pueden matricularse mediante importación.</p>}
      {!customCourseSelected && <label className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3 text-sm text-blue-900"><input type="checkbox" checked={financeEnabled} onChange={(event) => setFinanceEnabled(event.target.checked)} className="mt-1" /><span><strong>Importar información financiera</strong><span className="block text-xs">Requiere configurar módulos, fecha y método de pago en el siguiente paso. Solo Administrador.</span></span></label>}
      <p className="text-sm font-medium text-blue-900">{financeEnabled ? "Los pagos históricos serán movimientos financieros reales y afectarán caja y reportes." : "Los estudiantes serán matriculados en el curso seleccionado sin generar cargos ni movimientos financieros."}</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>}
      <div className="flex justify-between"><button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 text-sm text-gray-700">Atrás</button><button type="button" disabled={loading || (enabled && (!courseId || loadingCourses || customCourseSelected))} onClick={() => onSubmit({ enabled, curso_abierto_id: enabled ? courseId : null, sin_registro_financiero: true, finance: { enabled: financeEnabled } })} className="rounded-lg bg-[#0b1c30] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Continuar..." : financeEnabled ? "Configurar finanzas" : "Generar preview"}</button></div>
  </div>
}
