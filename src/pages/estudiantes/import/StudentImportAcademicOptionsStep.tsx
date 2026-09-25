import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GraduationCapIcon,
  UserIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Calendar03Icon,
  MapPinIcon,
  UserGroupIcon,
  Coins01Icon,
  ArrowLeft01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { studentImportService, type ImportCourse } from "@/services/student-import.service"
import { formatDate, parseLocalDate } from "@/lib/utils"

interface Props {
  loading: boolean
  onBack: () => void
  onSubmit: (options: Record<string, unknown>) => void
}

export function StudentImportAcademicOptionsStep({ loading, onBack, onSubmit }: Props) {
  const [mode, setMode] = useState<"independent" | "enroll">("independent")
  const [historical, setHistorical] = useState(false)
  const [courseId, setCourseId] = useState("")
  const [financeEnabled, setFinanceEnabled] = useState(false)
  const [courses, setCourses] = useState<ImportCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [error, setError] = useState("")

  const enabled = mode === "enroll"
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
    studentImportService
      .getCourses(historical)
      .then(setCourses)
      .catch(() => setError("No se pudieron cargar los cursos disponibles."))
      .finally(() => setLoadingCourses(false))
  }, [enabled, historical])

  const handleSelectMode = (newMode: "independent" | "enroll") => {
    setMode(newMode)
    if (newMode === "independent") {
      setCourseId("")
      setFinanceEnabled(false)
    }
  }

  const capacityMax = selectedCourse?.capacidad_maxima ?? 0
  const totalEnrolled = selectedCourse?.total_matriculas ?? 0
  const capacityPct = capacityMax > 0 ? Math.min(100, Math.round((totalEnrolled / capacityMax) * 100)) : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b1c30]">
          Configuración académica
        </h2>
        <p className="text-sm text-[#45464d] mt-1">
          Decide si deseas únicamente registrar las fichas de los estudiantes o matricularlos en una cohorte o curso existente.
        </p>
      </div>

      {/* Tarjetas de Selección de Modalidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opción 1: Solo registrar */}
        <div
          onClick={() => handleSelectMode("independent")}
          className={`cursor-pointer rounded-2xl p-6 transition-all border flex flex-col justify-between relative ${
            mode === "independent"
              ? "bg-white border-[#fd761a] shadow-md ring-2 ring-[#fd761a]/20"
              : "bg-white/80 border-[#c6c6cd]/30 hover:border-[#c6c6cd] hover:bg-white shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0b1c30] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserIcon} size={24} />
            </div>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                mode === "independent"
                  ? "bg-[#fd761a] text-white"
                  : "border-2 border-[#c6c6cd] bg-white"
              }`}
            >
              {mode === "independent" && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-bold text-base text-[#0b1c30]">
              Solo registrar estudiantes
            </h3>
            <p className="text-xs text-[#45464d] mt-1.5 leading-relaxed">
              Crea los expedientes y fichas de contacto sin vincularlos a ningún curso por ahora. Podrás matricularlos manualmente después.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c6c6cd]/20 flex items-center gap-2 text-xs text-[#76777d]">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} />
            <span>No genera matrícula ni movimientos de caja</span>
          </div>
        </div>

        {/* Opción 2: Matricular en un curso */}
        <div
          onClick={() => handleSelectMode("enroll")}
          className={`cursor-pointer rounded-2xl p-6 transition-all border flex flex-col justify-between relative ${
            mode === "enroll"
              ? "bg-white border-[#fd761a] shadow-md ring-2 ring-[#fd761a]/20"
              : "bg-white/80 border-[#c6c6cd]/30 hover:border-[#c6c6cd] hover:bg-white shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffdbca] text-[#783200] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={GraduationCapIcon} size={24} />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#ffdbca] text-[#783200] text-[10px] font-bold uppercase tracking-wider">
                Recomendado
              </span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  mode === "enroll"
                    ? "bg-[#fd761a] text-white"
                    : "border-2 border-[#c6c6cd] bg-white"
                }`}
              >
                {mode === "enroll" && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-bold text-base text-[#0b1c30]">
              Importar y matricular en un curso
            </h3>
            <p className="text-xs text-[#45464d] mt-1.5 leading-relaxed">
              Asigna a todos los alumnos del archivo a un curso abierto existente y permite asentar pagos históricos o estados financieros.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c6c6cd]/20 flex items-center gap-2 text-xs text-[#9d4300] font-semibold">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
            <span>Permite conciliar pagos históricos por módulo</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DETALLADA DE MATRÍCULA Y ASIGNACIÓN DE CURSO */}
      {enabled && (
        <div className="space-y-6">
          {/* Card Principal: Selector y Curso */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#c6c6cd]/25 shadow-sm space-y-6">
            {/* Header del Bloque */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#c6c6cd]/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#fd761a] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={GraduationCapIcon} size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#fd761a]">
                      Paso 3 · Asignación Académica
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0b1c30] text-[10px] font-bold">
                      Obligatorio
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1c30] mt-0.5">
                    Seleccionar curso destino *
                  </h3>
                </div>
              </div>

              {/* Switch Estilizado para Cursos Históricos */}
              <label className="flex items-center gap-3 cursor-pointer select-none bg-[#eff4ff]/60 hover:bg-[#eff4ff] px-3.5 py-2 rounded-xl border border-[#c6c6cd]/25 transition-colors">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historical}
                    onChange={(e) => {
                      setHistorical(e.target.checked)
                      setCourseId("")
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#c6c6cd]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fd761a]"></div>
                </div>
                <span className="text-xs font-semibold text-[#45464d]">
                  Mostrar cursos históricos y finalizados
                </span>
              </label>
            </div>

            {/* Input / Selector de Curso */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#45464d] block">
                Curso abierto o cohorte académica:
              </label>
              <div className="relative">
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={loadingCourses}
                  className="w-full appearance-none rounded-xl border border-[#c6c6cd]/40 pl-4 pr-10 py-3.5 text-xs sm:text-sm font-semibold bg-white text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 disabled:bg-gray-50 transition-all cursor-pointer shadow-xs"
                >
                  <option value="">
                    {loadingCourses ? "Cargando cursos disponibles..." : "Seleccionar un curso abierto del catálogo..."}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {courseLabel(course)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#76777d]">
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                </div>
              </div>
            </div>

            {/* Tarjeta Enriquecida del Curso Seleccionado */}
            {selectedCourse && (
              <div className="rounded-xl border border-[#c6c6cd]/25 bg-gradient-to-br from-[#eff4ff]/70 to-[#dce9ff]/30 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] text-xs font-bold">
                      {isHistoricalCourse(selectedCourse) ? "Curso Histórico" : "Cohorte Vigente"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#6ffbbe]/40 text-[#005236] text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#009668] animate-pulse" />
                      Inscripciones Habilitadas
                    </span>
                    {selectedCourse.es_personalizado && (
                      <span className="px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#783200] text-xs font-bold">
                        Personalizado
                      </span>
                    )}
                  </div>

                  <span className="px-3 py-1 rounded-lg bg-white/80 border border-[#c6c6cd]/20 text-xs font-semibold text-[#45464d]">
                    {selectedCourse.modalidad || "Modalidad estándar"}
                  </span>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                    {selectedCourse.nombre_instancia || selectedCourse.catalogo?.nombre}
                  </h4>
                  <p className="text-xs text-[#76777d] mt-0.5">
                    ID de cohorte: <span className="font-mono">{selectedCourse.id}</span>
                  </p>
                </div>

                {/* Grid con detalles lectivos, sede y cupos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#c6c6cd]/20 bg-white/70 rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={Calendar03Icon} size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#76777d] block leading-tight">
                        Fechas Lectivas
                      </span>
                      <span className="text-xs font-bold text-[#0b1c30]">
                        {selectedCourse.fecha_inicio ? formatDate(selectedCourse.fecha_inicio) : "Sin fecha"}
                        {selectedCourse.fecha_fin ? ` → ${formatDate(selectedCourse.fecha_fin)}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={MapPinIcon} size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#76777d] block leading-tight">
                        Sede y Aula
                      </span>
                      <span className="text-xs font-bold text-[#0b1c30]">
                        {selectedCourse.ciudad?.nombre || "Campus Principal"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={UserGroupIcon} size={16} />
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between items-center text-[10px] font-bold text-[#76777d] uppercase mb-1">
                        <span>Capacidad</span>
                        <span className="text-[#0b1c30]">
                          {totalEnrolled} {capacityMax > 0 ? `/ ${capacityMax}` : ""} inscritos
                        </span>
                      </div>
                      {capacityMax > 0 && (
                        <div className="w-full h-1.5 bg-[#dce9ff] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#fd761a] rounded-full transition-all duration-300"
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#45464d] pt-1">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="text-[#009668] shrink-0" />
                  <span>
                    Se usará este curso existente. La importación no creará ni modificará la estructura de módulos de la academia.
                  </span>
                </div>
              </div>
            )}

            {/* Alerta de Cursos Personalizados */}
            {customCourseSelected && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex items-start gap-2.5">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold block">Curso personalizado no compatible con carga masiva:</span>
                  <span>Los cursos personalizados utilizan un flujo de pagos y contenidos individual y no admiten matriculación masiva por archivo. Selecciona un curso regular.</span>
                </div>
              </div>
            )}
          </div>

          {/* Card Destacada: Integración Financiera */}
          {!customCourseSelected && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#c6c6cd]/25 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#ffdbca] text-[#783200] flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Coins01Icon} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9d4300]">
                        Paso 4 · Integración Financiera
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#ffdbca] text-[#783200] text-[10px] font-bold">
                        Módulo Tesorería
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0b1c30] mt-0.5">
                      Importar información financiera histórica de pagos y saldos
                    </h3>
                    <p className="text-xs text-[#45464d] mt-1 leading-relaxed max-w-2xl">
                      Activa esta opción únicamente si tu archivo contiene columnas como TOTAL, ABONO y SALDO que corresponden a cobros ya percibidos en el pasado.
                    </p>
                  </div>
                </div>

                {/* Toggle Switch Grande y Elegante */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-center">
                  <input
                    type="checkbox"
                    checked={financeEnabled}
                    onChange={(e) => setFinanceEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-[#c6c6cd]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#fd761a]"></div>
                </label>
              </div>

              {/* Callout cuando está activado */}
              {financeEnabled ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 mt-3 animate-fadeIn">
                  <HugeiconsIcon icon={AlertCircleIcon} size={20} className="shrink-0 text-[#9d4300] mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-bold block">
                      Atención contable de tesorería:
                    </strong>
                    <p className="leading-relaxed text-[#783200]">
                      Estos pagos se registrarán como movimientos financieros reales en el módulo de Pagos y Cobros y afectarán el balance de caja acumulado, recibos de caja y los reportes contables oficiales.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      <span className="px-2.5 py-0.5 rounded-full bg-white font-bold text-[#009668] border border-amber-200">
                        ✓ Asienta abonos históricos en caja
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white font-bold text-[#783200] border border-amber-200">
                        ✓ Genera cuentas por cobrar para saldos pendientes
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#eff4ff]/60 border border-[#c6c6cd]/15 text-xs text-[#45464d] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#76777d]" />
                  <span>
                    Modalidad estándar: Los estudiantes serán matriculados en el curso seleccionado sin generar cargos ni movimientos financieros.
                  </span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-[#ba1a1a] font-semibold">{error}</p>}
        </div>
      )}

      {/* Botones de navegación inferior */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#c6c6cd]/30 bg-white text-[#0b1c30] text-xs font-bold shadow-sm hover:bg-[#eff4ff] transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          <span>Atrás</span>
        </button>

        <button
          type="button"
          disabled={loading || (enabled && (!courseId || loadingCourses || customCourseSelected))}
          onClick={() =>
            onSubmit({
              enabled,
              curso_abierto_id: enabled ? courseId : null,
              sin_registro_financiero: !financeEnabled,
              finance: { enabled: financeEnabled },
            })
          }
          className="px-6 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Preparando...</span>
            </>
          ) : financeEnabled ? (
            <span>Configurar finanzas</span>
          ) : (
            <span>Generar previsualización</span>
          )}
        </button>
      </div>
    </div>
  )
}
