import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  CheckListIcon,
  Calendar03Icon,
  UserGroupIcon,
  InformationCircleIcon,
  SaveIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  instructorService,
  type EstudianteCurso,
  type ClaseItem,
} from "@/services/instructor.service"
import { toast } from "sonner"

type ViewState = "overview" | "modules" | "classes" | "attendance"

type AsistenciaLocal = {
  asistio: boolean
  estado: string
  observaciones: string
}

interface ModuloItem {
  id: string
  nombre_modulo: string
  numero_orden?: number
}

interface Props {
  cursoId: string
  cursoNombre: string
  modulos: ModuloItem[]
}

export function CursoAsistenciaSection({ cursoId, cursoNombre, modulos }: Props) {
  const [view, setView] = useState<ViewState>("overview")
  const [clases, setClases] = useState<ClaseItem[]>([])
  const [selectedModulo, setSelectedModulo] = useState<ModuloItem | null>(null)
  const [selectedClase, setSelectedClase] = useState<ClaseItem | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [asistenciasLocal, setAsistenciasLocal] = useState<
    Record<string, AsistenciaLocal>
  >({})
  const [claseObservaciones, setClaseObservaciones] = useState("")
  const [overviewEstudiantes, setOverviewEstudiantes] = useState<EstudianteCurso[]>([])

  const overviewLoading = view === "overview" && overviewEstudiantes.length === 0

  useEffect(() => {
    if (view !== "overview" || !cursoId) return
    instructorService.getEstudiantesCurso(cursoId)
      .then(setOverviewEstudiantes)
      .catch(() => toast.error("Error al cargar estadísticas de asistencia"))
  }, [view, cursoId])

  const handleModuleClick = async (modulo: ModuloItem) => {
    setSelectedModulo(modulo)
    setView("classes")
    setLoading(true)
    try {
      const data = await instructorService.getClasesModulo(modulo.id)
      setClases(data)
    } catch {
      toast.error("Error al cargar clases del módulo")
    } finally {
      setLoading(false)
    }
  }

  const handleClassClick = async (clase: ClaseItem) => {
    setSelectedClase(clase)
    setView("attendance")
    setLoading(true)
    setClaseObservaciones(clase?.observaciones ?? "")
    try {
      const [estudiantesData] = await Promise.all([
        instructorService.getEstudiantesCurso(cursoId),
        clase.id ? instructorService.getDetalleClase(clase.id) : Promise.resolve(null),
      ])
      setEstudiantes(estudiantesData)

      const initial: Record<string, AsistenciaLocal> = {}
      estudiantesData.forEach((e) => {
        initial[e.id] = {
          asistio: true,
          estado: "presente",
          observaciones: "",
        }
      })
      setAsistenciasLocal(initial)
    } catch {
      toast.error("Error al cargar datos de asistencia")
    } finally {
      setLoading(false)
    }
  }

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
    if (!selectedClase) return
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
      await instructorService.registrarAsistencia(selectedClase.id, payload, claseObservaciones)
      toast.success("Asistencia guardada correctamente")
      setView("classes")
      setSelectedClase(null)
      setEstudiantes([])
      if (selectedModulo) {
        const updated = await instructorService.getClasesModulo(selectedModulo.id)
        setClases(updated)
      }
    } catch {
      toast.error("Error al guardar la asistencia")
    } finally {
      setSaving(false)
    }
  }

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

  const presentesCount = Object.values(asistenciasLocal).filter(
    (a) => a.estado === "presente" || a.estado === "tardanza",
  ).length

  // ─── View: Overview ───
  if (view === "overview") {
    const totalClases = overviewEstudiantes.reduce((max, e) => Math.max(max, e.total_clases || 0), 0)
    const promedio = overviewEstudiantes.length > 0
      ? Math.round(overviewEstudiantes.reduce((s, e) => s + (e.porcentaje_asistencia || 0), 0) / overviewEstudiantes.length)
      : 0
    return (
      <div className="space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: COLORS.TEXT_MUTED }}>Total Estudiantes</p>
            <p className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={UserGroupIcon} size={20} className="inline mr-1.5" style={{ color: COLORS.ACCENT }} />
              {overviewEstudiantes.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: COLORS.TEXT_MUTED }}>Total Clases</p>
            <p className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
              {totalClases}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <p className="text-[11px] font-medium mb-1" style={{ color: COLORS.TEXT_MUTED }}>Promedio Asistencia</p>
            <p className="text-2xl font-bold" style={{
              color: promedio >= 70 ? "oklch(0.45 0.12 140)" : promedio >= 50 ? "oklch(0.55 0.12 90)" : "oklch(0.5 0.15 25)",
            }}>
              {promedio}%
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <p className="text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>Resumen de Asistencia</p>
            {modulos.length > 0 && (
              <button onClick={() => setView("modules")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <HugeiconsIcon icon={CheckListIcon} size={12} />Registrar Asistencia
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            {overviewLoading ? (
              <div className="p-12 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
            ) : overviewEstudiantes.length === 0 ? (
              <div className="p-12 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Sin estudiantes matriculados</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <th className="text-left font-semibold px-5 py-3" style={{ color: COLORS.TEXT_MUTED }}>Estudiante</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Cédula</th>
                    <th className="text-center font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Asistencia</th>
                    <th className="text-center font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Porcentaje</th>
                    <th className="text-center font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewEstudiantes.map(e => {
                    const asistidas = e.clases_asistidas || 0
                    const totales = e.total_clases || 0
                    const pct = e.porcentaje_asistencia || 0
                    const badgeColor = pct >= 70 ? { bg: "#d1fae5", text: "#065f46" }
                      : pct >= 50 ? { bg: "#fef3c7", text: "#92400e" }
                      : { bg: "#fee2e2", text: "#991b1b" }
                    return (
                      <tr key={e.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <td className="px-5 py-3 font-semibold whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                          {e.estudiante ? `${e.estudiante.nombres} ${e.estudiante.apellidos}` : e.participante_externo ? `${e.participante_externo.nombres} ${e.participante_externo.apellidos ?? ""}` : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: COLORS.TEXT_MUTED }}>
                          {e.estudiante?.cedula ?? e.participante_externo?.cedula ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold" style={{ color: COLORS.CHARCOAL }}>
                          {asistidas}/{totales}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold" style={{ color: badgeColor.text }}>
                          {pct}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{ backgroundColor: badgeColor.bg, color: badgeColor.text }}>
                            {pct >= 70 ? "Bueno" : pct >= 50 ? "Regular" : "Bajo"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── View: Module selection ───
  if (view === "modules") {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setView("overview")}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: COLORS.TEXT_MUTED }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Volver a resumen
        </button>
        <div className="text-center mb-10">
          <h3 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>
            Gestión de Asistencia
          </h3>
          <p className="text-sm mt-1.5" style={{ color: COLORS.TEXT_MUTED }}>
            Selecciona un módulo para registrar la asistencia de sus clases.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modulos.length === 0 ? (
            <div
              className="md:col-span-2 p-12 text-center border rounded-xl border-dashed"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
            >
              <p className="text-sm font-medium">Sin módulos asignados</p>
            </div>
          ) : (
            modulos.map((modulo) => (
              <button
                key={modulo.id}
                onClick={() => handleModuleClick(modulo)}
                className="group flex flex-col p-6 rounded-2xl bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] text-left"
                style={{ border: "1px solid #e8eaed" }}
              >
                <div className="flex items-start gap-5 mb-4">
                  <div
                    className="size-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`,
                    }}
                  >
                    <HugeiconsIcon
                      icon={CheckListIcon}
                      size={26}
                      style={{ color: COLORS.ACCENT }}
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: COLORS.ACCENT }}
                    >
                      Módulo {modulo.numero_orden}
                    </span>
                    <p
                      className="text-base font-bold mt-1 truncate"
                      style={{ color: COLORS.CHARCOAL }}
                    >
                      {modulo.nombre_modulo}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between mt-auto pt-4 border-t"
                  style={{ borderColor: "#f1f3f5" }}
                >
                  <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    {modulo.numero_orden || "—"}° módulo
                  </span>
                  <span
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all group-hover:brightness-110 group-hover:shadow-md"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    Ir a Clases
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // ─── View: Class list ───
  if (view === "classes") {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => {
            setView("modules")
            setSelectedModulo(null)
            setClases([])
          }}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: COLORS.TEXT_MUTED }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Volver a módulos
        </button>

        <header className="mb-8">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: COLORS.ACCENT }}
          >
            Programación de Clases
          </span>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
            {selectedModulo?.nombre_modulo ?? "Módulo"}
          </h1>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            Selecciona una fecha para registrar la asistencia.
          </p>
        </header>

        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center" style={{ color: COLORS.TEXT_MUTED }}>
              Cargando clases...
            </div>
          ) : clases.length === 0 ? (
            <div
              className="bg-white border-dashed rounded-2xl p-12 text-center"
              style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
            >
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={48}
                className="mx-auto mb-4"
                style={{ color: "oklch(0.9 0 0)" }}
              />
              <p style={{ color: COLORS.TEXT_MUTED }}>
                No hay clases programadas para este módulo.
              </p>
            </div>
          ) : (
            clases.map((clase) => (
              <button
                key={clase.id}
                onClick={() => handleClassClick(clase)}
                className="w-full rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-all group text-left"
                style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  borderWidth: 1,
                  backgroundColor: clase.asistencia_registrada
                    ? "oklch(0.97 0.03 145 / 0.35)"
                    : "white",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="size-12 rounded-xl flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    <span className="text-[10px] font-bold uppercase">
                      {new Date(clase.fecha_clase).toLocaleString("es", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-lg font-black leading-none">
                      {new Date(clase.fecha_clase).getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: COLORS.CHARCOAL }}>
                      {new Date(clase.fecha_clase).toLocaleDateString("es", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                      {clase.hora_inicio} - {clase.hora_fin}
                    </p>
                    {clase.observaciones && (
                      <p className="text-[11px] mt-1 italic truncate max-w-[280px]" style={{ color: "oklch(0.5 0.08 220)" }}>
                        📝 {clase.observaciones}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {clase.asistencia_registrada ? (
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
                      style={{
                        color: "oklch(0.45 0.1 150)",
                        backgroundColor: "oklch(0.95 0.03 150)",
                      }}
                    >
                      Registrada
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
                      style={{
                        color: "oklch(0.5 0.08 65)",
                        backgroundColor: "oklch(0.95 0.04 65)",
                      }}
                    >
                      Pendiente
                    </span>
                  )}
                  <span
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all group-hover:brightness-110 group-hover:shadow-md"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    {clase.asistencia_registrada ? "Ver" : "Registrar"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // ─── View: Attendance grid ───
  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => {
          setView("classes")
          setSelectedClase(null)
          setEstudiantes([])
        }}
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a clases
      </button>

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
            <p
              style={{ color: COLORS.TEXT_MUTED }}
              className="text-sm flex items-center gap-1.5"
            >
              {cursoNombre}
            </p>
            {selectedClase && (
              <div
                className="flex items-center gap-2 mt-1 text-sm"
                style={{ color: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                <span className="font-medium">
                  {new Date(selectedClase.fecha_clase).toLocaleDateString("es", {
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
                  {selectedClase.hora_inicio} - {selectedClase.hora_fin}
                </span>
              </div>
            )}
          </div>
          <div
            className="px-6 py-3 rounded-2xl text-center text-white"
            style={{
              backgroundColor: COLORS.ACCENT,
              boxShadow: `0 4px 12px ${COLORS.ACCENT}40`,
            }}
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
              Selecciona el estado de asistencia para cada estudiante. Por defecto
              todos están marcados como <b>Presente</b>.
            </p>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold block mb-1.5" style={{ color: COLORS.TEXT_MUTED }}>
              Observaciones de la clase
            </label>
            <textarea
              value={claseObservaciones}
              onChange={e => setClaseObservaciones(e.target.value)}
              placeholder="Agregar observaciones para esta clase..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none transition-all"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            />
          </div>

          {loading ? (
            <div className="p-12 text-center" style={{ color: COLORS.TEXT_MUTED }}>
              Cargando estudiantes...
            </div>
          ) : estudiantes.length === 0 ? (
            <div className="text-center py-12" style={{ color: COLORS.TEXT_MUTED }}>
              No hay estudiantes matriculados para registrar asistencia.
            </div>
          ) : (
            <div className="space-y-4">
              {estudiantes.map((e) => {
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
              })}
            </div>
          )}

          <div className="mt-12 flex justify-end gap-4">
            <button
              onClick={() => {
                setView("classes")
                setSelectedClase(null)
                setEstudiantes([])
              }}
              className="px-6 py-3 rounded-xl font-bold transition-all"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                borderWidth: 1,
                color: COLORS.TEXT_MUTED,
              }}
            >
              Cancelar
            </button>
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
