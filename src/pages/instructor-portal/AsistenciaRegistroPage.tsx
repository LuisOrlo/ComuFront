import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  SaveIcon,
  Calendar03Icon,
  CheckCheckIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { parseLocalDate } from "@/lib/utils"
import {
  instructorService,
  type InstructorCurso,
  type EstudianteCurso,
  type ClaseItem,
} from "@/services/instructor.service"
import { toast } from "sonner"

type AsistenciaLocal = {
  asistio: boolean
  estado: "presente" | "ausente"
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
  const [claseObservaciones, setClaseObservaciones] = useState("")

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData, claseData] = await Promise.all([
        instructorService.getDetalleCurso(cursoId!),
        instructorService.getEstudiantesCurso(cursoId!),
        claseId ? instructorService.getDetalleClase(claseId) : Promise.resolve(null),
      ])

      setCurso(cursoData)
      setEstudiantes(estudiantesData)
      if (claseData) {
        setClase(claseData)
        setClaseObservaciones(claseData.observaciones ?? "")
      }

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
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId])

  const handleStatusChange = (matriculaId: string, estado: "presente" | "ausente") => {
    setAsistenciasLocal((prev) => ({
      ...prev,
      [matriculaId]: {
        ...prev[matriculaId],
        estado,
        asistio: estado === "presente",
      },
    }))
  }

  const handleMarcarTodos = (estado: "presente" | "ausente") => {
    setAsistenciasLocal((prev) => {
      const next: Record<string, AsistenciaLocal> = {}
      Object.keys(prev).forEach((id) => {
        next[id] = {
          ...prev[id],
          estado,
          asistio: estado === "presente",
        }
      })
      return next
    })
    toast.success(
      estado === "presente"
        ? "Todos los estudiantes fueron marcados como presentes"
        : "Todos los estudiantes fueron marcados como ausentes",
    )
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

      await instructorService.registrarAsistencia(
        claseId!,
        payload,
        claseObservaciones.trim() || undefined,
      )
      toast.success("Asistencia guardada correctamente")
      navigate(`/instructor/cursos/${cursoId}?tab=attendance`)
    } catch {
      toast.error("Error al guardar la asistencia")
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="p-12 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando datos de asistencia...
      </div>
    )
  if (!curso)
    return (
      <div className="p-12 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Curso no encontrado
      </div>
    )

  const presentesCount = Object.values(asistenciasLocal).filter(
    (a) => a.estado === "presente",
  ).length
  const ausentesCount = estudiantes.length - presentesCount

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Navegación de retorno */}
      <Link
        to={`/instructor/cursos/${cursoId}?tab=attendance`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al curso
      </Link>

      {/* Encabezado sin contenedor cerrado rígido */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            {curso.catalogo?.color && (
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: curso.catalogo.color }}
              />
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {curso.catalogo?.nombre ?? "Curso"} • {curso.nombre_instancia}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pase de Lista
          </h1>
          {clase && (
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-slate-400" />
                {parseLocalDate(clase.fecha_clase)?.toLocaleDateString("es", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <HugeiconsIcon icon={Clock01Icon} size={15} className="text-slate-400" />
                {clase.hora_inicio} – {clase.hora_fin}
              </span>
            </div>
          )}
        </div>

        {/* Resumen de conteo */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Presentes
            </span>
            <span className="text-xl font-black text-emerald-700">
              {presentesCount}{" "}
              <span className="text-xs font-semibold text-emerald-600/80">
                / {estudiantes.length}
              </span>
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Ausentes
            </span>
            <span className="text-xl font-black text-rose-700">
              {ausentesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de acciones rápidas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-medium text-slate-600 px-1">
          {estudiantes.length === 0
            ? "Sin estudiantes"
            : `${estudiantes.length} estudiante${estudiantes.length === 1 ? "" : "s"} registrado${estudiantes.length === 1 ? "" : "s"}`}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMarcarTodos("presente")}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <HugeiconsIcon icon={CheckCheckIcon} size={18} />
            Marcar todos presentes
          </button>
          <button
            type="button"
            onClick={() => handleMarcarTodos("ausente")}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all"
            title="Marcar todos ausentes"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} />
            <span className="hidden sm:inline">Todos ausentes</span>
          </button>
        </div>
      </div>

      {/* Lista abierta de estudiantes */}
      <div className="space-y-3">
        {estudiantes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400">
            No hay estudiantes matriculados en este curso.
          </div>
        ) : (
          estudiantes.map((e, index) => {
            const currentStatus = asistenciasLocal[e.id]?.estado ?? "presente"
            const isPresent = currentStatus === "presente"

            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Identificación del estudiante */}
                <div className="flex items-center gap-3.5 min-w-0 md:w-5/12">
                  <div
                    className={`size-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isPresent
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={isPresent ? CheckmarkCircle01Icon : Cancel01Icon}
                      size={20}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      <span className="text-slate-400 font-normal mr-1.5 text-xs">
                        #{index + 1}
                      </span>
                      {getEstudianteName(e)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      C.I: {getEstudianteCedula(e)}
                    </div>
                  </div>
                </div>

                {/* Controles de asistencia: Solo Presente y Ausente */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 gap-1">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(e.id, "presente")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isPresent
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(e.id, "ausente")}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !isPresent
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={15} />
                      Ausente
                    </button>
                  </div>
                </div>

                {/* Nota / Observación individual */}
                <div className="w-full md:w-3/12">
                  <input
                    type="text"
                    value={asistenciasLocal[e.id]?.observaciones || ""}
                    onChange={(ev) =>
                      handleObservacionChange(e.id, ev.target.value)
                    }
                    placeholder="Nota individual..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-slate-400 outline-none text-slate-800 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Observaciones generales de la clase */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
        <label
          htmlFor="claseObservaciones"
          className="block text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Observaciones de la clase (opcional)
        </label>
        <textarea
          id="claseObservaciones"
          value={claseObservaciones}
          onChange={(e) => setClaseObservaciones(e.target.value)}
          placeholder="Escribe temas tratados, novedades o notas de esta sesión..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:border-slate-400 bg-slate-50/40 focus:bg-white outline-none resize-none transition-all text-slate-800 placeholder:text-slate-400"
        />
        <p className="text-[10px] text-right text-slate-400">
          {claseObservaciones.length}/500
        </p>
      </div>

      {/* Botones inferiores de acción */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <Link
          to={`/instructor/cursos/${cursoId}?tab=attendance`}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-bold bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <HugeiconsIcon icon={SaveIcon} size={18} />
          {saving ? "Guardando..." : "Guardar Asistencia"}
        </button>
      </div>
    </div>
  )
}

