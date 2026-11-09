/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ArrowLeft,
  ArrowRight,
  Download,
  Edit3,
  RotateCcw,
  CheckCheck,
  FileText,
  Loader2,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import {
  tallerService,
  type Taller,
  type InscripcionTaller,
  type AsistenciaTaller,
  type AsistenciaEstudiante,
} from "@/services/taller.service"
import {
  generarListadoAsistenciaPDF,
  generarReporteAsistenciaPDF,
  type EstudianteReporte,
} from "@/lib/generarAsistenciaPDF"

export interface TallerAsistenciaSectionProps {
  taller: Taller
  inscritosActivos: InscripcionTaller[]
  canManageAsistencia: boolean
  onTallerUpdated: (updated: Taller) => void
}

export interface DiaTallerItem {
  key: string
  numeroDia: number
  fecha: string // "YYYY-MM-DD"
  horaInicio?: string
  horaFin?: string
  asistenciaId?: string
  asistencia?: AsistenciaTaller
  registrada: boolean
  asistentesCount: number
  capacidadCount: number
}

type ViewMode = "overview" | "workspace"
type EstadoAsistencia = "presente" | "ausente"

const ESTADO_CONFIG: Record<
  EstadoAsistencia,
  { label: string; activeClass: string; inactiveClass: string }
> = {
  presente: {
    label: "Presente",
    activeClass: "bg-emerald-600 text-white shadow-xs border-emerald-600 font-bold",
    inactiveClass: "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-slate-200",
  },
  ausente: {
    label: "Ausente",
    activeClass: "bg-rose-600 text-white shadow-xs border-rose-600 font-bold",
    inactiveClass: "bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 border-slate-200",
  },
}

function parseFechaIso(f?: string | null): string {
  if (!f) return ""
  return String(f).split("T")[0]
}

function formatFechaLarga(fechaStr: string): string {
  if (!fechaStr) return "—"
  try {
    const parts = fechaStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      const texto = d.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      return texto.charAt(0).toUpperCase() + texto.slice(1)
    }
    const d = new Date(fechaStr)
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return fechaStr
  }
}

function formatFechaCorta(fechaStr: string): string {
  if (!fechaStr) return ""
  try {
    const parts = fechaStr.split("-")
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    }
    const d = new Date(fechaStr)
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  } catch {
    return fechaStr
  }
}

function formatHoraSimple(h?: string | null): string {
  if (!h) return ""
  return h.substring(0, 5)
}

export function TallerAsistenciaSection({
  taller,
  inscritosActivos,
  canManageAsistencia,
  onTallerUpdated,
}: TallerAsistenciaSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [selectedFecha, setSelectedFecha] = useState<string>("")
  const [selectedSesionId, setSelectedSesionId] = useState<string | null>(null)

  // Estado del Workspace
  const [loadingSesion, setLoadingSesion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchEstudiante, setSearchEstudiante] = useState("")
  const [observacionesSesion, setObservacionesSesion] = useState("")
  const [originalObservaciones, setOriginalObservaciones] = useState("")
  const [asistenciasLocal, setAsistenciasLocal] = useState<
    Record<string, { asistio: boolean; estado: EstadoAsistencia; observaciones: string }>
  >({})
  const [originalAsistencias, setOriginalAsistencias] = useState<
    Record<string, { asistio: boolean; estado: EstadoAsistencia; observaciones: string }>
  >({})

  // Sub-pestañas en modo Overview (estilo Cursos: "Por Estudiante" vs "Por Sesión")
  const [overviewTab, setOverviewTab] = useState<"estudiantes" | "sesiones">("estudiantes")
  const [estudiantesFiltroEstado, setEstudiantesFiltroEstado] = useState<"todos" | "presentes" | "ausentes">("todos")
  const [searchEstudiantesOverview, setSearchEstudiantesOverview] = useState("")
  const [detallesAsistencias, setDetallesAsistencias] = useState<Record<string, AsistenciaEstudiante[]>>({})
  const [cargandoDetalles, setCargandoDetalles] = useState(false)

  // Cargar detalles de estudiantes para sesiones registradas
  useEffect(() => {
    if (!taller.id || !taller.asistencias || taller.asistencias.length === 0) return

    let cancelled = false
    const cargar = async () => {
      setCargandoDetalles(true)
      const resMap: Record<string, AsistenciaEstudiante[]> = {}
      await Promise.all(
        taller.asistencias!.map(async (a) => {
          try {
            const res = await tallerService.listarAsistenciaEstudiantes(taller.id, a.id)
            if (!cancelled) {
              resMap[a.id] = (res as any).estudiantes || []
            }
          } catch {
            if (!cancelled) {
              resMap[a.id] = []
            }
          }
        })
      )
      if (!cancelled) {
        setDetallesAsistencias(resMap)
        setCargandoDetalles(false)
      }
    }

    cargar()
    return () => {
      cancelled = true
    }
  }, [taller.id, taller.asistencias])

  // 1. Detección y ordenamiento del cronograma de días del taller
  const diasTaller = useMemo<DiaTallerItem[]>(() => {
    const map = new Map<string, DiaTallerItem>()
    const asistencias = taller.asistencias || []

    // 1.1 Si el taller tiene sesiones explícitas programadas
    if (taller.sesiones && taller.sesiones.length > 0) {
      taller.sesiones.forEach((s) => {
        const f = parseFechaIso(s.fecha_sesion)
        if (!f) return
        map.set(f, {
          key: `sesion-${s.id}`,
          numeroDia: 0,
          fecha: f,
          horaInicio: s.hora_inicio || taller.hora_inicio,
          horaFin: s.hora_fin || taller.hora_fin,
          registrada: false,
          asistentesCount: 0,
          capacidadCount: inscritosActivos.length,
        })
      })
    } else if (taller.fecha) {
      // 1.2 Rango de fechas o fecha única
      const fInicioStr = parseFechaIso(taller.fecha)
      const fFinStr = parseFechaIso(taller.fecha_fin)

      if (fFinStr && fFinStr > fInicioStr) {
        // Multi-día por rango
        const dCurrent = new Date(fInicioStr + "T00:00:00")
        const dEnd = new Date(fFinStr + "T00:00:00")
        let safety = 0
        while (dCurrent <= dEnd && safety < 60) {
          safety++
          const fIso = dCurrent.toISOString().split("T")[0]
          map.set(fIso, {
            key: `rango-${fIso}`,
            numeroDia: 0,
            fecha: fIso,
            horaInicio: taller.hora_inicio,
            horaFin: taller.hora_fin,
            registrada: false,
            asistentesCount: 0,
            capacidadCount: inscritosActivos.length,
          })
          dCurrent.setDate(dCurrent.getDate() + 1)
        }
      } else if (fInicioStr) {
        // Un solo día
        map.set(fInicioStr, {
          key: `single-${fInicioStr}`,
          numeroDia: 0,
          fecha: fInicioStr,
          horaInicio: taller.hora_inicio,
          horaFin: taller.hora_fin,
          registrada: false,
          asistentesCount: 0,
          capacidadCount: inscritosActivos.length,
        })
      }
    }

    // 1.3 Incorporar asistencias registradas (para enlazar datos y agregar fechas extras si existen)
    asistencias.forEach((a) => {
      const f = parseFechaIso(a.fecha_sesion)
      if (!f) return
      const existing = map.get(f)
      if (existing) {
        existing.asistenciaId = a.id
        existing.asistencia = a
        existing.registrada = true
        existing.asistentesCount = a.asistentes ?? 0
        existing.capacidadCount = a.capacidad_registrada || inscritosActivos.length
      } else {
        // Fecha extra registrada libremente
        map.set(f, {
          key: `extra-${a.id}`,
          numeroDia: 0,
          fecha: f,
          horaInicio: taller.hora_inicio,
          horaFin: taller.hora_fin,
          asistenciaId: a.id,
          asistencia: a,
          registrada: true,
          asistentesCount: a.asistentes ?? 0,
          capacidadCount: a.capacidad_registrada || inscritosActivos.length,
        })
      }
    })

    // 1.4 Ordenar por fecha cronológica y asignar número de día
    const sorted = Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))
    sorted.forEach((item, index) => {
      item.numeroDia = index + 1
    })

    return sorted
  }, [taller, inscritosActivos])

  const esMultiDia = diasTaller.length > 1
  const totalDias = diasTaller.length
  const diasRegistrados = diasTaller.filter((d) => d.registrada).length
  const diasPendientes = totalDias - diasRegistrados

  const proximoDiaPendiente = useMemo(() => {
    return diasTaller.find((d) => !d.registrada) || null
  }, [diasTaller])

  // 2. Cargar sesión seleccionada en el Workspace
  const abrirWorkspace = useCallback(
    async (diaItem: DiaTallerItem) => {
      setSelectedFecha(diaItem.fecha)
      setSelectedSesionId(diaItem.asistenciaId || null)
      setViewMode("workspace")
      setLoadingSesion(true)
      setSearchEstudiante("")

      try {
        if (diaItem.asistenciaId) {
          // Sesión ya registrada: Cargar datos desde la base de datos
          const res = await tallerService.listarAsistenciaEstudiantes(taller.id, diaItem.asistenciaId)
          const list: AsistenciaEstudiante[] = (res as any).estudiantes || []
          const mapped: Record<
            string,
            { asistio: boolean; estado: EstadoAsistencia; observaciones: string }
          > = {}

          // Si hay estudiantes en la sesión
          list.forEach((e) => {
            const k = e.inscripcion_taller_id || `ext-${e.participante_externo_id}`
            if (k) {
              const isPres = e.estado === "presente" || (e.asistio && e.estado !== "ausente")
              const est: EstadoAsistencia = isPres ? "presente" : "ausente"
              mapped[k] = {
                asistio: isPres,
                estado: est,
                observaciones: e.observaciones || "",
              }
            }
          })

          // Si algún inscrito activo no estaba en el registro guardado, agregarlo
          inscritosActivos.forEach((ins) => {
            if (!mapped[ins.id]) {
              mapped[ins.id] = { asistio: true, estado: "presente", observaciones: "" }
            }
          })

          setAsistenciasLocal(mapped)
          setOriginalAsistencias(JSON.parse(JSON.stringify(mapped)))
          setObservacionesSesion(diaItem.asistencia?.observaciones || "")
          setOriginalObservaciones(diaItem.asistencia?.observaciones || "")
        } else {
          // Sesión nueva / pendiente: Inicializar todos los inscritos como Presente por defecto
          const initial: Record<
            string,
            { asistio: boolean; estado: EstadoAsistencia; observaciones: string }
          > = {}
          inscritosActivos.forEach((ins) => {
            initial[ins.id] = { asistio: true, estado: "presente", observaciones: "" }
          })
          setAsistenciasLocal(initial)
          setOriginalAsistencias(JSON.parse(JSON.stringify(initial)))
          setObservacionesSesion("")
          setOriginalObservaciones("")
        }
      } catch {
        toast.error("Error al cargar participantes de la sesión")
      } finally {
        setLoadingSesion(false)
      }
    },
    [taller.id, inscritosActivos]
  )

  const cambiarDiaWorkspace = (diaItem: DiaTallerItem) => {
    if (saving) return
    abrirWorkspace(diaItem)
  }

  // Comprobar si hay cambios pendientes en el Workspace
  const hayCambiosPendientes = useMemo(() => {
    if (observacionesSesion !== originalObservaciones) return true
    const keys = Object.keys(asistenciasLocal)
    for (const k of keys) {
      const cur = asistenciasLocal[k]
      const orig = originalAsistencias[k]
      if (!orig) return true
      if (cur.estado !== orig.estado || cur.observaciones !== orig.observaciones) {
        return true
      }
    }
    return false
  }, [asistenciasLocal, originalAsistencias, observacionesSesion, originalObservaciones])

  // Descartar cambios
  const handleDescartarCambios = () => {
    setAsistenciasLocal(JSON.parse(JSON.stringify(originalAsistencias)))
    setObservacionesSesion(originalObservaciones)
    toast.info("Cambios descartados")
  }

  // Cambiar estado individual de un participante
  const handleCambiarEstado = (inscId: string, nuevoEstado: EstadoAsistencia) => {
    setAsistenciasLocal((prev) => ({
      ...prev,
      [inscId]: {
        ...(prev[inscId] || { observaciones: "" }),
        estado: nuevoEstado,
        asistio: nuevoEstado === "presente",
      },
    }))
  }

  // Marcar todos masivamente
  const handleMarcarTodos = (estado: EstadoAsistencia) => {
    const updated: Record<
      string,
      { asistio: boolean; estado: EstadoAsistencia; observaciones: string }
    > = {}
    inscritosActivos.forEach((ins) => {
      updated[ins.id] = {
        asistio: estado === "presente",
        estado,
        observaciones: asistenciasLocal[ins.id]?.observaciones || "",
      }
    })
    setAsistenciasLocal(updated)
    toast.success(`Se marcaron todos los participantes como "${ESTADO_CONFIG[estado].label}"`)
  }

  // Guardar asistencia del Workspace
  const handleGuardarAsistencia = async (avanzarSiguiente = false) => {
    if (!selectedFecha) {
      toast.error("Fecha de sesión no válida")
      return
    }

    if (inscritosActivos.length === 0) {
      toast.warning("No hay participantes activos en este taller para registrar asistencia.")
      return
    }

    setSaving(true)
    try {
      const payloadEstudiantes = inscritosActivos.map((ins) => {
        const reg = asistenciasLocal[ins.id] || { asistio: true, estado: "presente", observaciones: "" }
        return {
          inscripcion_taller_id: ins.id,
          asistio: reg.asistio,
          estado: reg.estado,
          observaciones: reg.observaciones || null,
        }
      })

      if (selectedSesionId) {
        // Actualizar sesión existente
        await tallerService.registrarAsistenciaEstudiantes(taller.id, selectedSesionId, {
          estudiantes: payloadEstudiantes,
        })
      } else {
        // Registrar nueva sesión
        await tallerService.registrarAsistencia(taller.id, {
          taller_id: taller.id,
          fecha_sesion: selectedFecha,
          observaciones: observacionesSesion || undefined,
          estudiantes: payloadEstudiantes,
        })
      }

      toast.success("Asistencia guardada exitosamente")

      // Recargar datos actualizados del taller
      const updatedTaller = await tallerService.obtener(taller.id)
      onTallerUpdated(updatedTaller)

      // Actualizar detalles de estudiantes en caché para reflejar quién asistió y quién faltó
      if (updatedTaller.asistencias && updatedTaller.asistencias.length > 0) {
        const ses =
          updatedTaller.asistencias.find(
            (a: any) => String(a.fecha_sesion).split("T")[0] === selectedFecha
          ) || updatedTaller.asistencias[0]
        if (ses) {
          try {
            const res = await tallerService.listarAsistenciaEstudiantes(taller.id, ses.id)
            setDetallesAsistencias((prev) => ({
              ...prev,
              [ses.id]: (res as any).estudiantes || [],
            }))
          } catch {
            // Ignorar error al refrescar caché
          }
        }
      }

      if (avanzarSiguiente) {
        // Buscar siguiente día pendiente
        const fechaActual = selectedFecha
        const siguiente = diasTaller.find(
          (d) => d.fecha > fechaActual && !d.registrada
        )
        if (siguiente) {
          await abrirWorkspace(siguiente)
          return
        }
      }

      // Regresar al overview en la pestaña de estudiantes para ver quién asistió o faltó
      setOverviewTab("estudiantes")
      setViewMode("overview")
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || err?.response?.data?.message || "Error al guardar asistencia")
    } finally {
      setSaving(false)
    }
  }

  // Descarga reporte PDF de una sesión específica
  const handleDescargarReporteSesion = async (diaItem: DiaTallerItem) => {
    if (!diaItem.asistenciaId) return
    try {
      const res = await tallerService.listarAsistenciaEstudiantes(taller.id, diaItem.asistenciaId)
      const list: AsistenciaEstudiante[] = (res as any).estudiantes || []

      const reporte: EstudianteReporte[] = list.map((e) => ({
        nombres: e.inscripcion_taller?.nombres || "—",
        apellidos: e.inscripcion_taller?.apellidos || "—",
        cedula: e.inscripcion_taller?.cedula || "—",
        ciudad: e.inscripcion_taller?.ciudad || "—",
        asistio: e.asistio,
      }))

      const instructorName = taller.instructor
        ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
        : undefined

      await generarReporteAsistenciaPDF(
        taller.nombre || "",
        formatFechaLarga(diaItem.fecha),
        reporte,
        instructorName
      )
      toast.success("Reporte descargado")
    } catch {
      toast.error("Error al generar PDF de la sesión")
    }
  }

  // Descargar listado completo de asistencia con firmas
  const handleDescargarListadoCompleto = async () => {
    try {
      const data = await tallerService.getAsistenciaPDFData(taller.id)
      await generarListadoAsistenciaPDF({ ...data, tipo: "taller" })
      toast.success("Listado descargado")
    } catch {
      toast.error("Error al generar PDF")
    }
  }

  // Filtrado de participantes en Workspace
  const participantesFiltrados = useMemo(() => {
    if (!searchEstudiante.trim()) return inscritosActivos
    const q = searchEstudiante.toLowerCase().trim()
    return inscritosActivos.filter(
      (ins) =>
        `${ins.nombres} ${ins.apellidos}`.toLowerCase().includes(q) ||
        (ins.cedula && ins.cedula.toLowerCase().includes(q)) ||
        (ins.ciudad && ins.ciudad.toLowerCase().includes(q))
    )
  }, [inscritosActivos, searchEstudiante])

  // Contadores en vivo para el Workspace (solo Presente y Ausente)
  const countsLive = useMemo(() => {
    let pres = 0
    let ause = 0
    inscritosActivos.forEach((ins) => {
      const st = asistenciasLocal[ins.id]?.estado || "presente"
      if (st === "presente") pres++
      else ause++
    })
    return { pres, ause, total: inscritosActivos.length }
  }, [inscritosActivos, asistenciasLocal])

  const diaActualItem = diasTaller.find((d) => d.fecha === selectedFecha)
  const siguienteDiaPendiente = diasTaller.find(
    (d) => d.fecha > selectedFecha && !d.registrada
  )

  // 3. Resumen consolidado por participante (quién asistió y quién faltó)
  const resumenEstudiantes = useMemo(() => {
    const totalSesiones = diasTaller.length

    return inscritosActivos.map((ins) => {
      let asistidas = 0
      let ausencias = 0
      let tieneRegistro = false

      ;(taller.asistencias || []).forEach((a) => {
        const estList = detallesAsistencias[a.id] || []
        const reg = estList.find(
          (e) =>
            e.inscripcion_taller_id === ins.id ||
            e.inscripcion_taller?.cedula === ins.cedula
        )
        if (reg) {
          tieneRegistro = true
          if (reg.asistio || reg.estado === "presente") {
            asistidas++
          } else {
            ausencias++
          }
        }
      })

      const totalEvaluadas = asistidas + ausencias
      const pct = totalEvaluadas > 0 ? Math.round((asistidas / totalEvaluadas) * 100) : 0

      let estado: "presente" | "ausente" | "pendiente" = "pendiente"
      if (tieneRegistro) {
        if (asistidas > 0 && ausencias === 0) estado = "presente"
        else if (asistidas === 0 && ausencias > 0) estado = "ausente"
        else if (asistidas > 0) estado = "presente"
        else estado = "ausente"
      }

      return {
        inscripcion: ins,
        asistidas,
        ausencias,
        totalSesiones,
        pct,
        estado,
        tieneRegistro,
      }
    })
  }, [inscritosActivos, diasTaller, taller.asistencias, detallesAsistencias])

  // Contadores para filtros rápidos en la pestaña de estudiantes
  const countsOverview = useMemo(() => {
    let pres = 0
    let ause = 0
    let pend = 0
    resumenEstudiantes.forEach((item) => {
      if (item.estado === "presente") pres++
      else if (item.estado === "ausente") ause++
      else pend++
    })
    return { pres, ause, pend, total: resumenEstudiantes.length }
  }, [resumenEstudiantes])

  // Filtrado de participantes en la pestaña "Por Estudiante"
  const estudiantesFiltradosOverview = useMemo(() => {
    return resumenEstudiantes.filter((item) => {
      if (estudiantesFiltroEstado === "presentes" && item.estado !== "presente") return false
      if (estudiantesFiltroEstado === "ausentes" && item.estado !== "ausente") return false

      if (searchEstudiantesOverview.trim()) {
        const q = searchEstudiantesOverview.toLowerCase().trim()
        const full = `${item.inscripcion.nombres || ""} ${item.inscripcion.apellidos || ""}`.toLowerCase()
        const ced = (item.inscripcion.cedula || "").toLowerCase()
        const ciu = (item.inscripcion.ciudad || "").toLowerCase()
        if (!full.includes(q) && !ced.includes(q) && !ciu.includes(q)) return false
      }

      return true
    })
  }, [resumenEstudiantes, estudiantesFiltroEstado, searchEstudiantesOverview])

  // =========================================================================
  // RENDER: VISTA RESUMEN (OVERVIEW)
  // =========================================================================
  if (viewMode === "overview") {
    return (
      <div className="space-y-6">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-[#0b1c30]">
                Control y Registro de Asistencia
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                {esMultiDia ? `Taller Multi-día (${totalDias} días)` : "Taller de 1 Día"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {esMultiDia
                ? "Gestiona el pase de lista de cada jornada planificada de forma ágil e integrada."
                : "Registra y consulta la asistencia oficial de los participantes del taller."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {inscritosActivos.length > 0 && (
              <button
                type="button"
                onClick={handleDescargarListadoCompleto}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Descargar listado oficial en PDF para firmas manuales"
              >
                <Download size={15} className="text-slate-500" />
                <span>Listado PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Métricas Principales (KPIs) */}
        {!esMultiDia ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Estado de Asistencia
                </span>
                <div
                  className={`size-8 rounded-xl flex items-center justify-center ${
                    diasTaller[0]?.registrada
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Calendar size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <span
                  className={`text-xl font-black ${
                    diasTaller[0]?.registrada ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {diasTaller[0]?.registrada ? "Registrada" : "Pendiente"}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {diasTaller[0]?.registrada
                    ? "La sesión cuenta con registro oficial"
                    : "Aún no se ha registrado la asistencia"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Participantes en Lista
                </span>
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {inscritosActivos.length}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">Participantes activos en lista</p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Asistencia Registrada
                </span>
                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCheck size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {diasTaller[0]?.registrada
                    ? `${diasTaller[0].asistentesCount} / ${diasTaller[0].capacidadCount}`
                    : "—"}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {diasTaller[0]?.registrada
                    ? `${diasTaller[0].asistentesCount} presentes · ${Math.max(
                        0,
                        diasTaller[0].capacidadCount - diasTaller[0].asistentesCount
                      )} ausentes`
                    : "Pendiente de pase de lista"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Jornadas / Días
                </span>
                <div className="size-8 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <Calendar size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {diasRegistrados}
                  </span>
                  <span className="text-sm font-bold text-slate-400 font-mono">/ {totalDias}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {diasPendientes === 0
                    ? "Todas las jornadas registradas"
                    : `${diasPendientes} día${diasPendientes > 1 ? "s" : ""} pendiente${diasPendientes > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Participantes
                </span>
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {inscritosActivos.length}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">Participantes activos en lista</p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Asistencias Totales
                </span>
                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCheck size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {diasRegistrados > 0
                    ? diasTaller.reduce(
                        (acc, d) => acc + (d.registrada ? d.asistentesCount : 0),
                        0
                      )
                    : "—"}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {diasRegistrados > 0
                    ? `Presentes en ${diasRegistrados} de ${totalDias} jornadas registradas`
                    : "Pendiente de primer pase de lista"}
                </p>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Próxima Jornada
                </span>
                <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={17} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-base font-bold text-slate-900 truncate block">
                  {proximoDiaPendiente
                    ? formatFechaCorta(proximoDiaPendiente.fecha)
                    : "Completado"}
                </span>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {proximoDiaPendiente
                    ? `Día ${proximoDiaPendiente.numeroDia} pendiente`
                    : "Todas las fechas cubiertas"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selector de Sub-Pestaña: Por Participante vs Sesión (Estilo Cursos) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 rounded-xl bg-white border border-[#e5eeff] shadow-xs">
            <button
              type="button"
              onClick={() => setOverviewTab("estudiantes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                overviewTab === "estudiantes"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Users size={14} />
              <span>Por Estudiante ({inscritosActivos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setOverviewTab("sesiones")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                overviewTab === "sesiones"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar size={14} />
              <span>{esMultiDia ? `Historial por Sesión (${totalDias})` : "Sesión del Taller"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {canManageAsistencia && diasTaller.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const target = proximoDiaPendiente || diasTaller[0]
                  abrirWorkspace(target)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>
                  {diasRegistrados > 0 && diasPendientes === 0
                    ? "Editar Asistencia"
                    : "Tomar Asistencia"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════ SUB-TAB 1: POR ESTUDIANTE (LISTADO DE QUIÉN ASISTIÓ Y QUIÉN FALTÓ) ═══════════════ */}
        {overviewTab === "estudiantes" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] overflow-hidden">
            {/* Header de la tabla con filtros */}
            <div className="p-5 md:p-6 border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                  Resumen de Asistencia por Participante
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulta de forma clara quién asistió y quién faltó a la lista del taller
                </p>
              </div>

              {/* Filtros rápidos: Todos, Asistieron, Faltaron */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setEstudiantesFiltroEstado("todos")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    estudiantesFiltroEstado === "todos"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Todos ({countsOverview.total})
                </button>
                <button
                  type="button"
                  onClick={() => setEstudiantesFiltroEstado("presentes")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    estudiantesFiltroEstado === "presentes"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-emerald-700 hover:text-emerald-900"
                  }`}
                >
                  Asistieron ({countsOverview.pres})
                </button>
                <button
                  type="button"
                  onClick={() => setEstudiantesFiltroEstado("ausentes")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    estudiantesFiltroEstado === "ausentes"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-rose-700 hover:text-rose-900"
                  }`}
                >
                  Faltaron ({countsOverview.ause})
                </button>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="p-4 bg-slate-50/60 border-b border-[#e5eeff]">
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchEstudiantesOverview}
                  onChange={(e) => setSearchEstudiantesOverview(e.target.value)}
                  placeholder="Buscar estudiante por nombre o cédula..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl text-xs text-[#0b1c30] border border-[#e5eeff] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Tabla de Participantes */}
            <div className="overflow-x-auto">
              {cargandoDetalles ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#fd761a]" />
                  Cargando estado de asistencia de los participantes...
                </div>
              ) : inscritosActivos.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No hay participantes activos en este taller.
                </div>
              ) : estudiantesFiltradosOverview.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  No se encontraron participantes que coincidan con el filtro seleccionado.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e5eeff] bg-[#f8faff] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 font-mono">#</th>
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4">Cédula / Ciudad</th>
                      {esMultiDia && <th className="py-3 px-4">Jornadas</th>}
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeff]">
                    {estudiantesFiltradosOverview.map((item, idx) => {
                      const ins = item.inscripcion
                      const esPresente = item.estado === "presente"
                      const esAusente = item.estado === "ausente"

                      return (
                        <tr key={ins.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">
                            #{idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`size-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  esPresente
                                    ? "bg-emerald-100 text-emerald-800"
                                    : esAusente
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-orange-100 text-[#fd761a]"
                                }`}
                              >
                                {`${ins.nombres?.charAt(0) || ""}${ins.apellidos?.charAt(0) || ""}`.toUpperCase()}
                              </div>
                              <span className="font-bold text-sm text-[#0b1c30]">
                                {ins.nombres} {ins.apellidos}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            <div>{ins.cedula || "—"}</div>
                            {ins.ciudad && (
                              <div className="text-[11px] text-slate-400 font-sans">{ins.ciudad}</div>
                            )}
                          </td>
                          {esMultiDia && (
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              <span className="font-mono font-bold">
                                {item.asistidas} / {item.totalSesiones}
                              </span>{" "}
                              <span className="text-slate-500 text-[11px]">jornadas</span>
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-right">
                            {item.estado === "presente" ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d3e4fe] text-[#005236] border border-emerald-200">
                                Asistió
                              </span>
                            ) : item.estado === "ausente" ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdad6] text-[#93000a] border border-rose-200">
                                Faltó
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Por registrar
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
          </div>
        ) : (
          /* ═══════════════ SUB-TAB 2: POR SESIÓN / CRONOGRAMA ═══════════════ */
          <div className="space-y-5">
            {!esMultiDia ? (
              /* Tarjeta de la Sesión Única */
              diasTaller.length > 0 && (() => {
                const dia = diasTaller[0]

                return (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className={`size-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                            dia.registrada
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase leading-none">Día</span>
                          <span className="text-base font-black font-mono leading-none mt-1">
                            {dia.fecha.split("-")[2] || "•"}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-base font-extrabold text-slate-900 truncate">
                              {formatFechaLarga(dia.fecha)}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                dia.registrada
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {dia.registrada ? "Registrada" : "Pendiente"}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                            {(dia.horaInicio || dia.horaFin) && (
                              <span className="flex items-center gap-1.5 font-mono text-slate-600">
                                <Clock size={14} className="text-slate-400" />
                                {formatHoraSimple(dia.horaInicio)} - {formatHoraSimple(dia.horaFin)}
                              </span>
                            )}
                            {dia.registrada && (
                              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                <Users size={14} className="text-emerald-600" />
                                <strong className="text-emerald-700">{dia.asistentesCount} asistieron</strong>
                                <span>·</span>
                                <strong className="text-rose-700">
                                  {Math.max(0, dia.capacidadCount - dia.asistentesCount)} faltaron
                                </strong>
                              </span>
                            )}
                            {dia.asistencia?.observaciones && (
                              <span className="text-slate-500 italic max-w-sm truncate">
                                &quot;{dia.asistencia.observaciones}&quot;
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        {dia.registrada && dia.asistenciaId && (
                          <button
                            type="button"
                            onClick={() => handleDescargarReporteSesion(dia)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                            title="Descargar reporte oficial en PDF"
                          >
                            <Download size={14} className="text-slate-500" />
                            <span>Descargar Reporte</span>
                          </button>
                        )}

                        {canManageAsistencia && (
                          <button
                            type="button"
                            onClick={() => abrirWorkspace(dia)}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] ${
                              dia.registrada
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                : "bg-[#fd761a] hover:bg-[#ea580c] text-white"
                            }`}
                          >
                            {dia.registrada ? (
                              <>
                                <Edit3 size={15} />
                                <span>Editar Asistencia</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={15} />
                                <span>Tomar Asistencia</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              /* Cronograma Multi-día */
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Cronograma de Asistencia
                    </h4>
                    <p className="text-xs text-slate-500">
                      Selecciona cualquier día para tomar o corregir asistencia directamente.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {diasRegistrados} / {totalDias} jornadas
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {diasTaller.map((dia) => {
                    return (
                      <div key={dia.key} className="transition-colors">
                        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className={`size-11 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                                dia.registrada
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase leading-none">
                                Día {dia.numeroDia}
                              </span>
                              <span className="text-sm font-black font-mono leading-none mt-0.5">
                                {dia.fecha.split("-")[2] || "•"}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-extrabold text-slate-900 truncate">
                                  {formatFechaLarga(dia.fecha)}
                                </p>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    dia.registrada
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {dia.registrada ? "Registrada" : "Pendiente"}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                {(dia.horaInicio || dia.horaFin) && (
                                  <span className="flex items-center gap-1 font-mono text-slate-600">
                                    <Clock size={13} className="text-slate-400" />
                                    {formatHoraSimple(dia.horaInicio)} - {formatHoraSimple(dia.horaFin)}
                                  </span>
                                )}

                                {dia.registrada && (
                                  <span className="flex items-center gap-1.5">
                                    <Users size={13} className="text-emerald-600" />
                                    <strong className="text-emerald-700">
                                      {dia.asistentesCount} presentes
                                    </strong>
                                    <span>·</span>
                                    <strong className="text-rose-700">
                                      {Math.max(0, dia.capacidadCount - dia.asistentesCount)} ausentes
                                    </strong>
                                  </span>
                                )}

                                {dia.asistencia?.observaciones && (
                                  <span className="text-slate-400 italic truncate max-w-xs">
                                    &quot;{dia.asistencia.observaciones}&quot;
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {dia.registrada && dia.asistenciaId && (
                              <button
                                type="button"
                                onClick={() => handleDescargarReporteSesion(dia)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                title="Descargar acta de asistencia de esta sesión"
                              >
                                <Download size={13} className="text-slate-500" />
                                <span className="hidden sm:inline">Reporte</span>
                              </button>
                            )}

                            {canManageAsistencia && (
                              <button
                                type="button"
                                onClick={() => abrirWorkspace(dia)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.98] ${
                                  dia.registrada
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                    : "bg-[#fd761a] hover:bg-[#ea580c] text-white shadow-xs"
                                }`}
                              >
                                {dia.registrada ? (
                                  <>
                                    <Edit3 size={14} />
                                    <span>Editar Asistencia</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={14} />
                                    <span>Tomar Asistencia</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // RENDER: ÁREA DE TRABAJO INLINE (WORKSPACE - SIN MODAL)
  // =========================================================================
  const esEdicion = Boolean(selectedSesionId)

  return (
    <div className="space-y-5">
      {/* Barra de Control Superior del Workspace */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (hayCambiosPendientes) {
                  if (confirm("Tienes cambios sin guardar. ¿Deseas salir del pase de lista?")) {
                    setViewMode("overview")
                  }
                } else {
                  setViewMode("overview")
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              title="Volver al cronograma general"
            >
              <ArrowLeft size={15} />
              <span>Volver</span>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {formatFechaLarga(selectedFecha)}
                </h3>
                {diaActualItem && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                    {esMultiDia ? `Día ${diaActualItem.numeroDia} de ${totalDias}` : "Jornada Oficial"}
                  </span>
                )}
                {selectedSesionId && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Edición de sesión registrada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registra la asistencia en tiempo real. Los cambios se sincronizan contable y académicamente.
              </p>
            </div>
          </div>

          {/* Botones de Guardar / Descartar */}
          <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-center">
            {hayCambiosPendientes && (
              <button
                type="button"
                onClick={handleDescartarCambios}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={14} />
                <span>Descartar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleGuardarAsistencia(false)}
              disabled={saving || inscritosActivos.length === 0 || (esEdicion && !hayCambiosPendientes)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{esEdicion ? "Guardar Cambios" : "Guardar Asistencia"}</span>
                </>
              )}
            </button>

            {esMultiDia && siguienteDiaPendiente && (
              <button
                type="button"
                onClick={() => handleGuardarAsistencia(true)}
                disabled={saving || inscritosActivos.length === 0 || (esEdicion && !hayCambiosPendientes)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-orange-100 hover:bg-orange-200 border border-orange-200/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={`Guardar y avanzar al Día ${siguienteDiaPendiente.numeroDia}`}
              >
                <span>Guardar y Pasar al Día {siguienteDiaPendiente.numeroDia}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Selector Rápido de Días Multi-día */}
        {esMultiDia && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Jornadas:
            </span>
            {diasTaller.map((dia) => {
              const esActivo = dia.fecha === selectedFecha
              return (
                <button
                  key={dia.key}
                  type="button"
                  onClick={() => cambiarDiaWorkspace(dia)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    esActivo
                      ? "bg-[#fd761a] text-white shadow-xs"
                      : dia.registrada
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <span>Día {dia.numeroDia}:</span>
                  <span className="font-mono font-medium">{formatFechaCorta(dia.fecha)}</span>
                  {dia.registrada && <Check size={12} className="shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Barra de Contadores en Vivo (solo Presente y Ausente) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
              {countsLive.pres} Presentes
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200/60">
              {countsLive.ause} Ausentes
            </span>
          </div>

          <span className="text-slate-500 font-semibold font-mono">
            Total en lista: <strong className="text-slate-900">{countsLive.total}</strong> participantes
          </span>
        </div>
      </div>

      {/* Toolbar de Pase de Lista: Acciones Masivas y Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Marcar todos:
          </span>
          <button
            type="button"
            onClick={() => handleMarcarTodos("presente")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
          >
            <CheckCheck size={14} />
            <span>Todos Presente</span>
          </button>
          <button
            type="button"
            onClick={() => handleMarcarTodos("ausente")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors cursor-pointer"
          >
            <XCircle size={14} />
            <span>Todos Ausente</span>
          </button>
        </div>

        {/* Buscador de Participantes */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar participante..."
            value={searchEstudiante}
            onChange={(e) => setSearchEstudiante(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all text-slate-900"
          />
        </div>
      </div>

      {/* Listado de Participantes con Selector de Estado */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loadingSesion ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 size={24} className="animate-spin text-[#fd761a] mx-auto" />
            <p className="text-xs font-bold text-slate-600">Cargando participantes de la sesión...</p>
          </div>
        ) : participantesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {searchEstudiante
              ? `No se encontraron participantes que coincidan con "${searchEstudiante}"`
              : "No hay participantes activos en este taller."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {participantesFiltrados.map((ins, index) => {
              const estado = asistenciasLocal[ins.id]?.estado || "presente"

              return (
                <div
                  key={ins.id}
                  className="p-4 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Datos del Participante */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-right shrink-0">
                      {index + 1}.
                    </span>

                    <div className="size-9 rounded-full bg-orange-100 text-[#fd761a] font-bold text-xs flex items-center justify-center shrink-0">
                      {`${ins.nombres?.charAt(0) || ""}${ins.apellidos?.charAt(0) || ""}`.toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {ins.nombres} {ins.apellidos}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        <span>C.I: {ins.cedula || "—"}</span>
                        {ins.ciudad && <span>· {ins.ciudad}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Selector Interactivo de Estados: Únicamente Presente y Ausente */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado(ins.id, "presente")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        estado === "presente"
                          ? ESTADO_CONFIG.presente.activeClass
                          : ESTADO_CONFIG.presente.inactiveClass
                      }`}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambiarEstado(ins.id, "ausente")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        estado === "ausente"
                          ? ESTADO_CONFIG.ausente.activeClass
                          : ESTADO_CONFIG.ausente.inactiveClass
                      }`}
                    >
                      Ausente
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sección de Observaciones de la Sesión */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#fd761a]" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
            Observaciones o Novedades de la Sesión
          </h4>
        </div>
        <textarea
          rows={2}
          value={observacionesSesion}
          onChange={(e) => setObservacionesSesion(e.target.value)}
          placeholder="Escribe aquí observaciones generales, temas impartidos o justificaciones del día..."
          className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 bg-slate-50 focus:bg-white transition-all text-slate-900"
        />
      </div>

      {/* Barra de Acciones Fija Inferior */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500 font-medium">
          {esEdicion
            ? hayCambiosPendientes
              ? "Modificaciones detectadas en la asistencia. Haz clic en Guardar Cambios para aplicar."
              : "No se han detectado cambios en la asistencia de esta sesión."
            : hayCambiosPendientes
            ? "Hay cambios pendientes por registrar en esta sesión."
            : "Selecciona el estado de cada participante para guardar el registro."}
        </span>

        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => setViewMode("overview")}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Volver al Resumen
          </button>

          <button
            type="button"
            onClick={() => handleGuardarAsistencia(false)}
            disabled={saving || inscritosActivos.length === 0 || (esEdicion && !hayCambiosPendientes)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{esEdicion ? "Guardar Cambios" : "Guardar Asistencia"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
