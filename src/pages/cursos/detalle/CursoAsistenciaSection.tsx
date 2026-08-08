import { useState, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  CheckListIcon,
  Calendar03Icon,
  UserGroupIcon,
  InformationCircleIcon,
  SaveIcon,
  Edit01Icon,
  Search01Icon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  NextIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  instructorService,
  type EstudianteCurso,
  type ClaseItem,
} from "@/services/instructor.service"
import { cursosService } from "@/services/cursos.service"
import { usePermission } from "@/hooks/usePermission"
import { toast } from "sonner"

type ViewState = "overview" | "modules" | "classes" | "attendance"

type FiltroEstado = "todas" | "pendientes" | "registradas"

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

const COLORS_ESTADO: Record<string, { bg: string; text: string }> = {
  registrada: { bg: "bg-emerald-50", text: "text-emerald-700" },
  pendiente: { bg: "bg-amber-50", text: "text-amber-700" },
}

function formatMes(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  })
}

function normalizeFechaBusqueda(fecha: string): string {
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return String(fecha).toLowerCase()
  const diaSemana = d.toLocaleDateString("es", { weekday: "long" })
  const mes = d.toLocaleDateString("es", { month: "long" })
  const diaMes = d.toLocaleDateString("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  return [
    fecha,
    diaSemana,
    mes,
    String(d.getDate()),
    String(d.getMonth() + 1),
    String(d.getFullYear()),
    diaMes,
  ]
    .join(" ")
    .toLowerCase()
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

  const [editClase, setEditClase] = useState<ClaseItem | null>(null)
  const [editFecha, setEditFecha] = useState("")
  const [editHoraInicio, setEditHoraInicio] = useState("")
  const [editHoraFin, setEditHoraFin] = useState("")
  const [editClaseSaving, setEditClaseSaving] = useState(false)

  const [moduloProgreso, setModuloProgreso] = useState<
    Record<string, { registradas: number; total: number }>
  >({})
  const [loadingModulos, setLoadingModulos] = useState(false)

  const [claseSearch, setClaseSearch] = useState("")
  const [claseFiltro, setClaseFiltro] = useState<FiltroEstado>("todas")
  const [expandedMeses, setExpandedMeses] = useState<Record<string, boolean>>({})

  const [estudianteSearch, setEstudianteSearch] = useState("")

  const { isAdmin } = usePermission()

  const overviewLoading = view === "overview" && overviewEstudiantes.length === 0

  useEffect(() => {
    if (view !== "overview" || !cursoId) return
    instructorService.getEstudiantesCurso(cursoId)
      .then(setOverviewEstudiantes)
      .catch(() => toast.error("Error al cargar estadísticas de asistencia"))
  }, [view, cursoId])

  useEffect(() => {
    if (view !== "modules" || modulos.length === 0) return
    let cancelled = false
    setLoadingModulos(true)
    Promise.all(
      modulos.map(async (m) => {
        try {
          const data = await instructorService.getClasesModulo(m.id)
          return [
            m.id,
            {
              registradas: data.filter((c) => c.asistencia_registrada).length,
              total: data.length,
            },
          ] as const
        } catch {
          return [m.id, { registradas: 0, total: 0 }] as const
        }
      })
    )
      .then((results) => {
        if (cancelled) return
        const mapa: Record<string, { registradas: number; total: number }> = {}
        results.forEach(([id, val]) => {
          mapa[id] = val
        })
        setModuloProgreso(mapa)
      })
      .finally(() => {
        if (!cancelled) setLoadingModulos(false)
      })
    return () => {
      cancelled = true
    }
  }, [view, modulos])

  const handleModuleClick = async (modulo: ModuloItem) => {
    setSelectedModulo(modulo)
    setView("classes")
    setClaseSearch("")
    setClaseFiltro("todas")
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

  const openClass = useCallback(
    async (clase: ClaseItem) => {
      setSelectedClase(clase)
      setView("attendance")
      setLoading(true)
      setClaseObservaciones(clase?.observaciones ?? "")
      setAsistenciasLocal({})
      setEstudianteSearch("")
      try {
        const estudiantesData = await instructorService.getEstudiantesCurso(cursoId)
        setEstudiantes(estudiantesData)

        const initial: Record<string, AsistenciaLocal> = {}
        estudiantesData.forEach((e) => {
          initial[e.id] = {
            asistio: true,
            estado: "presente",
            observaciones: "",
          }
        })

        if (clase.asistencia_registrada && clase.id) {
          try {
            const existentes = await instructorService.getAsistenciaClase(clase.id)
            existentes.forEach((a) => {
              if (initial[a.matricula_id] && a.estado) {
                initial[a.matricula_id] = {
                  asistio:
                    a.asistio ?? (a.estado === "presente" || a.estado === "tardanza"),
                  estado: a.estado,
                  observaciones: a.observaciones || "",
                }
              }
            })
          } catch {
            /* Sin asistencias previas */
          }
        }

        setAsistenciasLocal(initial)
      } catch {
        toast.error("Error al cargar datos de asistencia")
      } finally {
        setLoading(false)
      }
    },
    [cursoId]
  )

  const handleClassClick = (clase: ClaseItem) => {
    openClass(clase)
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

  const marcarTodos = (estado: "presente" | "ausente") => {
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

  const clasesRegistradas = clases.filter((c) => c.asistencia_registrada).length
  const clasesTotal = clases.length
  const progresoClasesPct =
    clasesTotal > 0 ? Math.round((clasesRegistradas / clasesTotal) * 100) : 0

  const hayPendientes = clases.some((c) => !c.asistencia_registrada)

  const nextPending = useMemo(
    () =>
      clases.find((c) => !c.asistencia_registrada && c.id !== selectedClase?.id) ??
      null,
    [clases, selectedClase]
  )

  const goToProxima = () => {
    const prox = clases.find((c) => !c.asistencia_registrada)
    if (prox) openClass(prox)
  }

  const filteredClases = useMemo(() => {
    let list = clases
    if (claseFiltro === "pendientes") list = list.filter((c) => !c.asistencia_registrada)
    else if (claseFiltro === "registradas") list = list.filter((c) => c.asistencia_registrada)
    if (claseSearch.trim()) {
      const q = claseSearch.toLowerCase().trim()
      list = list.filter((c) => normalizeFechaBusqueda(c.fecha_clase).includes(q))
    }
    return list
  }, [clases, claseFiltro, claseSearch])

  const mesesAgrupados = useMemo(() => {
    const groups: Record<string, ClaseItem[]> = {}
    filteredClases.forEach((c) => {
      const mes = formatMes(c.fecha_clase)
      if (!groups[mes]) groups[mes] = []
      groups[mes].push(c)
    })
    return Object.entries(groups)
  }, [filteredClases])

  useEffect(() => {
    if (view !== "classes") return
    const prox = clases.find((c) => !c.asistencia_registrada)
    if (prox) {
      const mes = formatMes(prox.fecha_clase)
      setExpandedMeses((prev) =>
        prev[mes] === undefined ? { ...prev, [mes]: true } : prev
      )
    }
  }, [view, clases])

  const toggleMes = (mes: string) => {
    setExpandedMeses((prev) => ({ ...prev, [mes]: !prev[mes] }))
  }

  const estudiantesFiltrados = useMemo(() => {
    if (!estudianteSearch.trim()) return estudiantes
    const q = estudianteSearch.toLowerCase().trim()
    return estudiantes.filter((e) => {
      const nombre = getEstudianteName(e).toLowerCase()
      const cedula = getEstudianteCedula(e).toLowerCase()
      return nombre.includes(q) || cedula.includes(q)
    })
  }, [estudiantes, estudianteSearch])

  const volverAClases = () => {
    setView("classes")
    setSelectedClase(null)
    setEstudiantes([])
  }

  const handleSave = useCallback(
    async (avanzar: boolean) => {
      if (!selectedClase) return
      setSaving(true)
      try {
        const payload = Object.entries(asistenciasLocal).map(
          ([matriculaId, data]) => ({
            matricula_id: matriculaId,
            asistio: data.asistio,
            estado: data.estado,
            observaciones: data.observaciones,
          })
        )
        await instructorService.registrarAsistencia(
          selectedClase.id,
          payload,
          claseObservaciones
        )

        setClases((prev) =>
          prev.map((c) =>
            c.id === selectedClase.id ? { ...c, asistencia_registrada: true } : c
          )
        )
        setEstudiantes([])

        if (avanzar && nextPending) {
          toast.success("Asistencia guardada")
          await openClass(nextPending)
        } else {
          if (avanzar) {
            const registradas = clases.filter(
              (c) => c.asistencia_registrada || c.id === selectedClase.id
            ).length
            toast.success(
              `Módulo completo — ${registradas}/${clases.length} clases registradas 🎉`
            )
          } else {
            toast.success("Asistencia guardada correctamente")
          }
          setView("classes")
          setSelectedClase(null)
        }
      } catch {
        toast.error("Error al guardar la asistencia")
      } finally {
        setSaving(false)
      }
    },
    [selectedClase, asistenciasLocal, claseObservaciones, nextPending, clases, openClass]
  )

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
                    <th className="text-left font-semibold px-4 py-3 w-8" style={{ color: COLORS.TEXT_MUTED }}>#</th>
                    <th className="text-left font-semibold px-5 py-3" style={{ color: COLORS.TEXT_MUTED }}>Estudiante</th>
                    <th className="text-center font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Asistencia</th>
                    <th className="text-center font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Porcentaje</th>
                    <th className="text-center font-semibold px-4 py-3" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewEstudiantes.map((e, idx) => {
                    const asistidas = e.clases_asistidas || 0
                    const totales = e.total_clases || 0
                    const pct = e.porcentaje_asistencia || 0
                    const badgeColor = pct >= 70 ? { bg: "#d1fae5", text: "#065f46" }
                      : pct >= 50 ? { bg: "#fef3c7", text: "#92400e" }
                      : { bg: "#fee2e2", text: "#991b1b" }
                    return (
                      <tr key={e.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: COLORS.TEXT_MUTED }}>{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                          {e.estudiante ? `${e.estudiante.nombres} ${e.estudiante.apellidos}` : e.participante_externo ? `${e.participante_externo.nombres} ${e.participante_externo.apellidos ?? ""}` : "—"}
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
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>
            Gestión de Asistencia
          </h3>
          <p className="text-sm mt-1.5" style={{ color: COLORS.TEXT_MUTED }}>
            Selecciona un módulo para registrar la asistencia de sus clases.
          </p>
        </div>
        {modulos.length === 0 ? (
          <div
            className="p-12 text-center border rounded-xl border-dashed"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
          >
            <p className="text-sm font-medium">Sin módulos asignados</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {loadingModulos && Object.keys(moduloProgreso).length === 0 && (
              <div className="text-center text-xs py-3" style={{ color: COLORS.TEXT_MUTED }}>
                Cargando progreso de clases...
              </div>
            )}
            {[...modulos]
              .sort((a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999))
              .map((modulo) => {
                const prog = moduloProgreso[modulo.id]
                const registradas = prog?.registradas ?? 0
                const total = prog?.total ?? 0
                const pct = total > 0 ? Math.round((registradas / total) * 100) : 0
                const completo = total > 0 && registradas === total
                return (
                  <button
                    key={modulo.id}
                    onClick={() => handleModuleClick(modulo)}
                    className="group w-full flex items-center gap-4 p-4 rounded-xl bg-white transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] text-left"
                    style={{ border: "1px solid #e8eaed", borderLeftColor: COLORS.ACCENT, borderLeftWidth: 3 }}
                  >
                    <div
                      className="size-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{ backgroundColor: COLORS.ACCENT }}
                    >
                      {modulo.numero_orden ?? "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                        {modulo.nombre_modulo}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: completo ? "oklch(0.5 0.12 150)" : COLORS.ACCENT,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold shrink-0" style={{ color: COLORS.TEXT_MUTED }}>
                          {registradas}/{total} clases registradas
                        </span>
                      </div>
                    </div>
                    {completo ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 shrink-0">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                        Completo
                      </span>
                    ) : (
                      <span
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all group-hover:brightness-110 shrink-0"
                        style={{ backgroundColor: COLORS.ACCENT }}
                      >
                        Ir a Clases
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        )}
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

        <header className="mb-6">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: COLORS.ACCENT }}
          >
            Programación de Clases
          </span>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
            {selectedModulo?.nombre_modulo ?? "Módulo"}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>
            Selecciona una fecha para registrar la asistencia.
          </p>
        </header>

        {/* Progreso del módulo */}
        {clasesTotal > 0 && (
          <div className="bg-white rounded-xl border p-4 mb-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>
                Progreso de asistencia
              </span>
              <span className="text-xs font-bold" style={{ color: COLORS.ACCENT }}>
                {clasesRegistradas} de {clasesTotal} clases registradas
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progresoClasesPct}%`, backgroundColor: COLORS.ACCENT }}
                />
              </div>
              <span className="text-xs font-bold w-10 text-right" style={{ color: COLORS.ACCENT }}>
                {progresoClasesPct}%
              </span>
            </div>
          </div>
        )}

        {/* Buscador + filtros + Ir a próxima */}
        {clases.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: COLORS.TEXT_MUTED }}
              />
              <input
                type="text"
                value={claseSearch}
                onChange={(e) => setClaseSearch(e.target.value)}
                placeholder="Buscar por fecha, mes o día..."
                className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-xs outline-none transition-all focus:ring-2"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              />
            </div>
            <select
              value={claseFiltro}
              onChange={(e) => setClaseFiltro(e.target.value as FiltroEstado)}
              className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
            >
              <option value="todas">Todas</option>
              <option value="pendientes">Pendientes</option>
              <option value="registradas">Registradas</option>
            </select>
            {hayPendientes ? (
              <button
                onClick={goToProxima}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-[0.97]"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={NextIcon} size={14} />
                Ir a próxima
              </button>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 cursor-not-allowed">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                Módulo completo
              </span>
            )}
          </div>
        )}

        <div className="space-y-4">
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
          ) : filteredClases.length === 0 ? (
            <div
              className="bg-white border-dashed rounded-2xl p-12 text-center"
              style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
            >
              <p style={{ color: COLORS.TEXT_MUTED }}>
                Sin resultados para el filtro o búsqueda actual.
              </p>
            </div>
          ) : (
            mesesAgrupados.map(([mes, items]) => {
              const isOpen = !!expandedMeses[mes]
              return (
                <div
                  key={mes}
                  className="border rounded-2xl bg-white overflow-hidden"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div
                    onClick={() => toggleMes(mes)}
                    className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={15} style={{ color: COLORS.TEXT_MUTED }} />
                      </motion.div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: COLORS.CHARCOAL }}>
                        {mes}
                      </h3>
                      <span className="text-[10px] font-bold" style={{ color: COLORS.TEXT_MUTED }}>
                        ({items.length} clase{items.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        color:
                          items.filter((c) => c.asistencia_registrada).length === items.length
                            ? "oklch(0.45 0.1 150)"
                            : COLORS.TEXT_MUTED,
                      }}
                    >
                      {items.filter((c) => c.asistencia_registrada).length}/{items.length}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          {items.map((clase) => (
                            <div
                              key={clase.id}
                              onClick={() => handleClassClick(clase)}
                              className="w-full p-4 flex items-center justify-between hover:shadow-md transition-all group text-left"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClassClick(clase) }}
                              style={{
                                backgroundColor: clase.asistencia_registrada
                                  ? "oklch(0.97 0.03 145 / 0.35)"
                                  : "white",
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className="size-11 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                                  style={{ backgroundColor: clase.asistencia_registrada ? "oklch(0.5 0.12 150)" : COLORS.ACCENT }}
                                >
                                  <span className="text-[9px] font-bold uppercase">
                                    {new Date(clase.fecha_clase).toLocaleString("es", { month: "short" })}
                                  </span>
                                  <span className="text-lg font-black leading-none">
                                    {new Date(clase.fecha_clase).getDate()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-bold text-sm" style={{ color: COLORS.CHARCOAL }}>
                                    {new Date(clase.fecha_clase).toLocaleDateString("es", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </h3>
                                  <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
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
                                  <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${COLORS_ESTADO.registrada.bg} ${COLORS_ESTADO.registrada.text}`}>
                                    Registrada
                                  </span>
                                ) : (
                                  <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${COLORS_ESTADO.pendiente.bg} ${COLORS_ESTADO.pendiente.text}`}>
                                    Pendiente
                                  </span>
                                )}
                                <span
                                  className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all group-hover:brightness-110"
                                  style={{ backgroundColor: COLORS.ACCENT }}
                                >
                                  {clase.asistencia_registrada ? "Ver" : "Registrar"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ─── View: Attendance grid ───
  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={volverAClases}
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
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditClase(selectedClase)
                      setEditFecha(selectedClase.fecha_clase || "")
                      setEditHoraInicio(selectedClase.hora_inicio || "")
                      setEditHoraFin(selectedClase.hora_fin || "")
                    }}
                    className="ml-2 px-2.5 py-1 rounded-lg text-[11px] font-bold border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}
                  >
                    <HugeiconsIcon icon={Edit01Icon} size={12} className="mr-1 inline" />
                    Cambiar
                  </button>
                )}
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
            className="rounded-xl p-4 flex gap-3 mb-6"
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
            <>
              {/* Acciones masivas + buscador */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
                <div className="relative flex-1">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: COLORS.TEXT_MUTED }}
                  />
                  <input
                    type="text"
                    value={estudianteSearch}
                    onChange={(e) => setEstudianteSearch(e.target.value)}
                    placeholder="Buscar estudiante por nombre o cédula..."
                    className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-xs outline-none transition-all focus:ring-2"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => marcarTodos("presente")}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all hover:bg-gray-50 active:scale-[0.97]"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    Marcar todos presentes
                  </button>
                  <button
                    onClick={() => marcarTodos("ausente")}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all active:scale-[0.97]"
                    style={{ backgroundColor: "oklch(0.45 0.15 20)" }}
                  >
                    Marcar todos ausentes
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {estudiantesFiltrados.length === 0 ? (
                  <div className="text-center py-10 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                    Sin estudiantes que coincidan con la búsqueda.
                  </div>
                ) : (
                  estudiantesFiltrados.map((e) => {
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
            </>
          )}

          <div className="mt-12 flex justify-end gap-3">
            <button
              onClick={volverAClases}
              className="px-5 py-3 rounded-xl font-bold transition-all"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                borderWidth: 1,
                color: COLORS.TEXT_MUTED,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                borderWidth: 1,
                color: COLORS.CHARCOAL,
              }}
            >
              {saving ? "Guardando..." : "Solo guardar"}
            </button>
            <button
              onClick={() => handleSave(true)}
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
                  {nextPending ? "Guardar y continuar" : "Guardar"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {editClase && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditClase(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}
            style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-base font-bold mb-4" style={{ color: COLORS.CHARCOAL }}>Cambiar día y hora</h3>
            <p className="text-xs mb-4" style={{ color: COLORS.TEXT_MUTED }}>
              {new Date(editClase.fecha_clase).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>Fecha</label>
                <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>Hora inicio</label>
                  <input type="time" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS.TEXT_MUTED }}>Hora fin</label>
                  <input type="time" value={editHoraFin} onChange={e => setEditHoraFin(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditClase(null)} disabled={editClaseSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!editFecha || !editHoraInicio || !editHoraFin) {
                    toast.error("Completa todos los campos")
                    return
                  }
                  if (editHoraInicio >= editHoraFin) {
                    toast.error("La hora de fin debe ser después del inicio")
                    return
                  }
                  setEditClaseSaving(true)
                  try {
                    await cursosService.updateClase(editClase.id, {
                      fecha_clase: editFecha,
                      hora_inicio: editHoraInicio,
                      hora_fin: editHoraFin,
                    })
                    toast.success("Clase actualizada")
                    setEditClase(null)
                    try {
                      const data = await instructorService.getClasesModulo(selectedModulo!.id)
                      setClases(data)
                    } catch { /* silent */ }
                  } catch {
                    toast.error("Error al actualizar la clase")
                  } finally {
                    setEditClaseSaving(false)
                  }
                }}
                disabled={editClaseSaving}
                className="flex-[2] py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: COLORS.ACCENT }}>
                {editClaseSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
