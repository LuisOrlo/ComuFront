import { useState, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Check,
  CheckCheck,
  XCircle,
  Users,
  Search,
  Zap,
  Download,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Info,
  Edit3,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RotateCcw,
  ClipboardCheck,
} from "lucide-react"
import { parseLocalDate } from "@/lib/utils"
import {
  instructorService,
  type EstudianteCurso,
  type ClaseItem,
} from "@/services/instructor.service"
import { cursosService } from "@/services/cursos.service"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
import { usePermission } from "@/hooks/usePermission"
import { toast } from "sonner"

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

type ViewMode = "overview" | "workspace"
type FiltroEstado = "todas" | "pendientes" | "registradas"

interface AsistenciaRegistro {
  asistio: boolean
  estado: "presente" | "ausente"
}

interface ModuloConClases {
  modulo: ModuloItem
  clases: ClaseItem[]
  registradas: number
  total: number
}

function getMesAbrev(fechaStr: string): string {
  const d = parseLocalDate(fechaStr)
  if (!d) return "MES"
  const m = d.toLocaleDateString("es", { month: "short" }).toUpperCase().replace(".", "")
  return m.length > 3 ? m.slice(0, 3) : m
}

function getDiaNumero(fechaStr: string): string {
  const d = parseLocalDate(fechaStr)
  if (!d) return "00"
  return String(d.getDate())
}

function getFechaLarga(fechaStr: string): string {
  const d = parseLocalDate(fechaStr)
  if (!d) return fechaStr
  const texto = d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function getFechaCompletaConAnio(fechaStr: string): string {
  const d = parseLocalDate(fechaStr)
  if (!d) return fechaStr
  const texto = d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function getFechaCorta(fechaStr: string): string {
  const d = parseLocalDate(fechaStr)
  if (!d) return ""
  return d.toLocaleDateString("es", { day: "numeric", month: "short" })
}

function getEstudianteName(e: EstudianteCurso): string {
  if (e.estudiante) {
    return `${e.estudiante.nombres} ${e.estudiante.apellidos}`.trim()
  }
  if (e.participante_externo) {
    return `${e.participante_externo.nombres} ${e.participante_externo.apellidos ?? ""}`.trim()
  }
  return "Estudiante"
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return (name.slice(0, 2) || "ES").toUpperCase()
}

export function CursoAsistenciaSection({ cursoId, cursoNombre, modulos }: Props) {
  const { isAdmin } = usePermission()

  // Modo de vista: "overview" (tabla inicial) o "workspace" (diseño unificado de registro)
  const [viewMode, setViewMode] = useState<ViewMode>("overview")

  // Estados de datos
  const [modulosData, setModulosData] = useState<ModuloConClases[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [selectedClase, setSelectedClase] = useState<ClaseItem | null>(null)
  const [selectedModulo, setSelectedModulo] = useState<ModuloItem | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false)

  // Estado del formulario de asistencia
  const [asistenciasLocal, setAsistenciasLocal] = useState<Record<string, AsistenciaRegistro>>({})
  const [originalAsistencias, setOriginalAsistencias] = useState<Record<string, AsistenciaRegistro>>({})
  const [claseObservaciones, setClaseObservaciones] = useState("")
  const [originalObservaciones, setOriginalObservaciones] = useState("")
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filtros y búsquedas
  const [claseSearch, setClaseSearch] = useState("")
  const [claseFiltro, setClaseFiltro] = useState<FiltroEstado>("todas")
  const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>({})
  const [estudianteSearch, setEstudianteSearch] = useState("")
  const [overviewSearch, setOverviewSearch] = useState("")

  // Modal para editar fecha/hora (solo admin)
  const [editClase, setEditClase] = useState<ClaseItem | null>(null)
  const [editFecha, setEditFecha] = useState("")
  const [editHoraInicio, setEditHoraInicio] = useState("")
  const [editHoraFin, setEditHoraFin] = useState("")
  const [editClaseSaving, setEditClaseSaving] = useState(false)

  // 1. Cargar módulos, clases y estudiantes al inicio
  useEffect(() => {
    if (!cursoId) return
    let isCancelled = false

    const loadAll = async () => {
      setLoadingInitial(true)
      try {
        // Cargar estudiantes del curso
        const estData = await instructorService.getEstudiantesCurso(cursoId)
        if (isCancelled) return
        setEstudiantes(estData)

        // Cargar clases de cada módulo (asegurar módulos si no llegaron en props)
        let listaModulos = modulos
        if (!listaModulos || listaModulos.length === 0) {
          try {
            const rawMods = await cursosService.getModulosCurso(cursoId)
            listaModulos = (rawMods as unknown as ModuloItem[]) || []
          } catch {
            listaModulos = []
          }
        }

        const modulosSorted = [...listaModulos].sort(
          (a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999)
        )

        const resultados = await Promise.all(
          modulosSorted.map(async (m) => {
            try {
              const clases = await instructorService.getClasesModulo(m.id)
              const registradas = clases.filter((c) => c.asistencia_registrada).length
              return {
                modulo: m,
                clases,
                registradas,
                total: clases.length,
              }
            } catch {
              return {
                modulo: m,
                clases: [],
                registradas: 0,
                total: 0,
              }
            }
          })
        )

        if (isCancelled) return
        setModulosData(resultados)

        // Por defecto todos los módulos cerrados (no desplegados)
        setExpandedModulos({})

        // Buscar automáticamente la próxima clase pendiente para activarla por defecto
        const todasLasClases: { clase: ClaseItem; modulo: ModuloItem }[] = []
        resultados.forEach((r) => {
          r.clases.forEach((c) => {
            todasLasClases.push({ clase: c, modulo: r.modulo })
          })
        })

        const primeraPendiente = todasLasClases.find((item) => !item.clase.asistencia_registrada)
        if (primeraPendiente) {
          setSelectedClase(primeraPendiente.clase)
          setSelectedModulo(primeraPendiente.modulo)
        } else if (todasLasClases.length > 0) {
          setSelectedClase(todasLasClases[0].clase)
          setSelectedModulo(todasLasClases[0].modulo)
        }
      } catch {
        if (!isCancelled) {
          toast.error("Error al cargar la información del curso")
        }
      } finally {
        if (!isCancelled) setLoadingInitial(false)
      }
    }

    loadAll()

    return () => {
      isCancelled = true
    }
  }, [cursoId, modulos])

  // Todas las clases aplanadas
  const todasClasesPlanas = useMemo(() => {
    const list: { clase: ClaseItem; modulo: ModuloItem }[] = []
    modulosData.forEach((m) => {
      m.clases.forEach((c) => {
        list.push({ clase: c, modulo: m.modulo })
      })
    })
    return list
  }, [modulosData])

  // Métricas generales del curso
  const totalClasesGeneral = todasClasesPlanas.length
  const totalClasesRegistradas = todasClasesPlanas.filter((item) => item.clase.asistencia_registrada).length
  const totalClasesPendientes = totalClasesGeneral - totalClasesRegistradas
  const progresoGeneralPct =
    totalClasesGeneral > 0
      ? ((totalClasesRegistradas / totalClasesGeneral) * 100).toFixed(1)
      : "0"

  // Promedio de asistencia para la vista overview
  const promedioGeneralAsistencia = useMemo(() => {
    if (estudiantes.length === 0) return 0
    const suma = estudiantes.reduce((acc, e) => acc + (e.porcentaje_asistencia || 0), 0)
    return Math.round(suma / estudiantes.length)
  }, [estudiantes])

  // Próxima clase pendiente en todo el curso
  const proximaClasePendiente = useMemo(() => {
    return todasClasesPlanas.find((item) => !item.clase.asistencia_registrada) ?? null
  }, [todasClasesPlanas])

  // Próxima clase pendiente después de la clase seleccionada
  const siguienteClasePendiente = useMemo(() => {
    if (!selectedClase) return null
    return (
      todasClasesPlanas.find(
        (item) => !item.clase.asistencia_registrada && item.clase.id !== selectedClase.id
      ) ?? null
    )
  }, [todasClasesPlanas, selectedClase])

  // Cargar asistencia de la clase activa cuando cambia
  const cargarAsistenciaDeClase = useCallback(
    async (clase: ClaseItem, modulo: ModuloItem) => {
      setSelectedClase(clase)
      setSelectedModulo(modulo)
      setClaseObservaciones(clase.observaciones || "")
      setOriginalObservaciones(clase.observaciones || "")
      setLoadingEstudiantes(true)
      setEstudianteSearch("")

      try {
        const estadoInicial: Record<string, AsistenciaRegistro> = {}
        estudiantes.forEach((e) => {
          estadoInicial[e.id] = {
            asistio: true,
            estado: "presente",
          }
        })

        if (clase.asistencia_registrada && clase.id) {
          try {
            const existentes = await instructorService.getAsistenciaClase(clase.id)
            existentes.forEach((a) => {
              if (estadoInicial[a.matricula_id]) {
                const esPresente = a.asistio || a.estado === "presente"
                estadoInicial[a.matricula_id] = {
                  asistio: esPresente,
                  estado: esPresente ? "presente" : "ausente",
                }
              }
            })
          } catch {
            // Sin asistencias previas
          }
        }

        setAsistenciasLocal(estadoInicial)
        setOriginalAsistencias(JSON.parse(JSON.stringify(estadoInicial)))
      } catch {
        toast.error("Error al cargar asistencias de la clase")
      } finally {
        setLoadingEstudiantes(false)
      }
    },
    [estudiantes]
  )

  useEffect(() => {
    if (!selectedClase || estudiantes.length === 0) return
    if (Object.keys(asistenciasLocal).length === 0) {
      if (selectedModulo) {
        cargarAsistenciaDeClase(selectedClase, selectedModulo)
      }
    }
  }, [selectedClase, estudiantes, selectedModulo, cargarAsistenciaDeClase, asistenciasLocal])

  // Manejo de cambio de estado (solo "presente" o "ausente")
  const handleToggleEstado = (matriculaId: string, nuevoEstado: "presente" | "ausente") => {
    setAsistenciasLocal((prev) => ({
      ...prev,
      [matriculaId]: {
        asistio: nuevoEstado === "presente",
        estado: nuevoEstado,
      },
    }))
  }

  // Acciones rápidas en masa
  const handleMarcarTodos = (estado: "presente" | "ausente") => {
    setAsistenciasLocal((prev) => {
      const next: Record<string, AsistenciaRegistro> = {}
      Object.keys(prev).forEach((id) => {
        next[id] = {
          asistio: estado === "presente",
          estado,
        }
      })
      return next
    })
    toast.success(
      estado === "presente"
        ? "Todos los estudiantes marcados como Presentes"
        : "Todos los estudiantes marcados como Ausentes"
    )
  }

  // Descartar cambios
  const handleDescartarCambios = () => {
    setAsistenciasLocal(JSON.parse(JSON.stringify(originalAsistencias)))
    setClaseObservaciones(originalObservaciones)
    toast.info("Cambios descartados")
  }

  // Guardar asistencia
  const handleGuardar = async (continuarSiguiente: boolean) => {
    if (!selectedClase) return
    setSaving(true)

    try {
      const payload = Object.entries(asistenciasLocal).map(([matriculaId, data]) => ({
        matricula_id: matriculaId,
        asistio: data.asistio,
        estado: data.estado,
        observaciones: "",
      }))

      await instructorService.registrarAsistencia(
        selectedClase.id,
        payload,
        claseObservaciones
      )

      const presentes = payload.filter((p) => p.asistio).length
      const total = payload.length

      setModulosData((prev) =>
        prev.map((m) => ({
          ...m,
          clases: m.clases.map((c) =>
            c.id === selectedClase.id
              ? {
                  ...c,
                  asistencia_registrada: true,
                  asistencias_presentes: presentes,
                  asistencias_total: total,
                  observaciones: claseObservaciones,
                }
              : c
          ),
          registradas: m.clases.filter((c) =>
            c.id === selectedClase.id ? true : c.asistencia_registrada
          ).length,
        }))
      )

      setSelectedClase((prev) =>
        prev
          ? {
              ...prev,
              asistencia_registrada: true,
              asistencias_presentes: presentes,
              asistencias_total: total,
              observaciones: claseObservaciones,
            }
          : null
      )

      setOriginalAsistencias(JSON.parse(JSON.stringify(asistenciasLocal)))
      setOriginalObservaciones(claseObservaciones)

      // Actualizar datos del estudiante
      instructorService.getEstudiantesCurso(cursoId).then(setEstudiantes).catch(() => {})

      if (continuarSiguiente && siguienteClasePendiente) {
        toast.success("Asistencia guardada. Abriendo siguiente clase...")
        await cargarAsistenciaDeClase(
          siguienteClasePendiente.clase,
          siguienteClasePendiente.modulo
        )
      } else {
        toast.success("Asistencia guardada correctamente")
      }
    } catch {
      toast.error("Error al guardar la asistencia")
    } finally {
      setSaving(false)
    }
  }

  // Exportar reporte PDF
  const handleExportarReporte = async () => {
    setExporting(true)
    try {
      const data = await instructorService.getAsistenciaPDFData(cursoId)
      await generarListadoAsistenciaPDF(data)
      toast.success("Reporte generado exitosamente")
    } catch {
      toast.error("Error al exportar el reporte de asistencia")
    } finally {
      setExporting(false)
    }
  }

  // Ir a la próxima clase pendiente
  const handleRegistrarProximaClase = () => {
    if (proximaClasePendiente) {
      cargarAsistenciaDeClase(proximaClasePendiente.clase, proximaClasePendiente.modulo)
      setExpandedModulos((prev) => ({
        ...prev,
        [proximaClasePendiente.modulo.id]: true,
      }))
    } else {
      toast.info("Todas las clases del curso ya tienen asistencia registrada")
    }
  }

  // Entrar al panel de registro desde el botón de la tabla inicial
  const handleAbrirRegistroAsistencia = () => {
    if (proximaClasePendiente) {
      cargarAsistenciaDeClase(proximaClasePendiente.clase, proximaClasePendiente.modulo)
    } else if (todasClasesPlanas.length > 0) {
      cargarAsistenciaDeClase(todasClasesPlanas[0].clase, todasClasesPlanas[0].modulo)
    }
    setViewMode("workspace")
  }

  // Conteo en vivo de la clase activa
  const presentesCount = Object.values(asistenciasLocal).filter((a) => a.asistio).length
  const totalAlumnosClase = estudiantes.length
  const porcentajePresentes =
    totalAlumnosClase > 0 ? Math.round((presentesCount / totalAlumnosClase) * 100) : 0

  // Número de sesión de la clase seleccionada
  const sesionNumero = useMemo(() => {
    if (!selectedClase || !selectedModulo) return 1
    const mod = modulosData.find((m) => m.modulo.id === selectedModulo.id)
    if (!mod) return 1
    const idx = mod.clases.findIndex((c) => c.id === selectedClase.id)
    return idx >= 0 ? idx + 1 : 1
  }, [selectedClase, selectedModulo, modulosData])

  // Filtrado de clases para la columna izquierda
  const modulosFiltrados = useMemo(() => {
    const q = claseSearch.trim().toLowerCase()
    return modulosData
      .map((m) => {
        let clases = m.clases
        if (claseFiltro === "pendientes") {
          clases = clases.filter((c) => !c.asistencia_registrada)
        } else if (claseFiltro === "registradas") {
          clases = clases.filter((c) => c.asistencia_registrada)
        }
        if (q) {
          clases = clases.filter((c) => {
            const fechaStr = (c.fecha_clase || "").toLowerCase()
            const fechaLarga = getFechaLarga(c.fecha_clase).toLowerCase()
            const obs = (c.observaciones || "").toLowerCase()
            return fechaStr.includes(q) || fechaLarga.includes(q) || obs.includes(q)
          })
        }
        return {
          ...m,
          clases,
        }
      })
      .filter((m) => m.clases.length > 0 || !q)
  }, [modulosData, claseFiltro, claseSearch])

  // Filtrado de estudiantes para el pase de lista
  const estudiantesFiltrados = useMemo(() => {
    if (!estudianteSearch.trim()) return estudiantes
    const q = estudianteSearch.toLowerCase().trim()
    return estudiantes.filter((e) => {
      const nombre = getEstudianteName(e).toLowerCase()
      const cedula = (e.estudiante?.cedula || e.participante_externo?.cedula || "").toLowerCase()
      return nombre.includes(q) || cedula.includes(q)
    })
  }, [estudiantes, estudianteSearch])

  // Filtrado de estudiantes para la tabla inicial
  const overviewEstudiantesFiltrados = useMemo(() => {
    if (!overviewSearch.trim()) return estudiantes
    const q = overviewSearch.toLowerCase().trim()
    return estudiantes.filter((e) => {
      const nombre = getEstudianteName(e).toLowerCase()
      const cedula = (e.estudiante?.cedula || e.participante_externo?.cedula || "").toLowerCase()
      return nombre.includes(q) || cedula.includes(q)
    })
  }, [estudiantes, overviewSearch])

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA INICIAL: OVERVIEW (TABLA DE ASISTENCIA Y RESUMEN)
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === "overview") {
    return (
      <div className="space-y-6">
        {/* Métricas / Stats cards principales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-[#76777d] mb-1.5">
                Total Estudiantes
              </p>
              <p className="text-2xl font-bold text-[#0b1c30]">
                {estudiantes.length}
              </p>
              <span className="text-xs text-[#76777d] mt-0.5 inline-block">
                Inscritos en el curso
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] border border-[#e5eeff] flex items-center justify-center text-[#fd761a]">
              <Users className="w-6 h-6 text-[#fd761a]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-[#76777d] mb-1.5">
                Total Clases
              </p>
              <p className="text-2xl font-bold text-[#0b1c30]">
                {totalClasesGeneral}
              </p>
              <span className="text-xs text-[#009668] font-medium mt-0.5 inline-block">
                {totalClasesRegistradas} registradas ({progresoGeneralPct}%)
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] border border-[#e5eeff] flex items-center justify-center text-[#fd761a]">
              <Calendar className="w-6 h-6 text-[#fd761a]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e5eeff] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-[#76777d] mb-1.5">
                Promedio Asistencia
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  color:
                    promedioGeneralAsistencia >= 70
                      ? "#009668"
                      : promedioGeneralAsistencia >= 50
                      ? "#fd761a"
                      : "#ba1a1a",
                }}
              >
                {promedioGeneralAsistencia}%
              </p>
              <span className="text-xs text-[#76777d] mt-0.5 inline-block">
                Rendimiento grupal
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] border border-[#e5eeff] flex items-center justify-center">
              <CheckCircle2
                className="w-6 h-6"
                style={{
                  color:
                    promedioGeneralAsistencia >= 70
                      ? "#009668"
                      : promedioGeneralAsistencia >= 50
                      ? "#fd761a"
                      : "#ba1a1a",
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabla inicial de Asistencia por Participante */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] overflow-hidden">
          {/* Header de la tabla con acciones */}
          <div className="p-5 md:p-6 border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0b1c30]">
                Resumen de asistencia por participante
              </h2>
              <p className="text-xs text-[#76777d] mt-0.5">
                {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} matriculado
                {estudiantes.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportarReporte}
                disabled={exporting}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#e5eeff] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#76777d]" />
                ) : (
                  <Download className="w-4 h-4 text-[#76777d]" />
                )}
                Exportar reporte
              </button>

              {modulos.length > 0 && (
                <button
                  onClick={handleAbrirRegistroAsistencia}
                  className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-[#fd761a]/25 transition-all active:scale-[0.98]"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Registrar Asistencia
                </button>
              )}
            </div>
          </div>

          {/* Barra de búsqueda de la tabla */}
          {estudiantes.length > 0 && (
            <div className="p-4 bg-[#eff4ff]/30 border-b border-[#e5eeff]">
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                <input
                  type="text"
                  value={overviewSearch}
                  onChange={(e) => setOverviewSearch(e.target.value)}
                  placeholder="Buscar estudiante por nombre o cédula..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl text-xs text-[#0b1c30] border border-[#e5eeff] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Contenedor de la tabla */}
          <div className="overflow-x-auto">
            {loadingInitial ? (
              <div className="p-12 text-center text-xs text-[#76777d]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#fd761a]" />
                Cargando estadísticas de asistencia...
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#76777d]">
                Sin estudiantes matriculados en este curso.
              </div>
            ) : overviewEstudiantesFiltrados.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#76777d]">
                Sin estudiantes que coincidan con la búsqueda.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e5eeff] bg-[#eff4ff] text-[11px] uppercase tracking-wider text-[#45464d]">
                    <th className="font-semibold px-5 py-3.5 w-12 text-left">#</th>
                    <th className="font-semibold px-5 py-3.5 text-left">Estudiante</th>
                    <th className="font-semibold px-5 py-3.5 text-left">Asistencias</th>
                    <th className="font-semibold px-5 py-3.5 text-left">Porcentaje</th>
                    <th className="font-semibold px-5 py-3.5 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewEstudiantesFiltrados.map((e, idx) => {
                    const nombre = getEstudianteName(e)
                    const asistidas = e.clases_asistidas || 0
                    const totales = e.total_clases || totalClasesGeneral || 0
                    const pct = e.porcentaje_asistencia || 0

                    const badgeColor =
                      pct >= 70
                        ? { bg: "#d3e4fe", text: "#005236", label: "Bueno" }
                        : pct >= 50
                        ? { bg: "#ffdbca", text: "#5c2400", label: "Regular" }
                        : pct === 0
                        ? { bg: "#ffdad6", text: "#93000a", label: "Crítico" }
                        : { bg: "#ffdbca", text: "#5c2400", label: "Bajo" }

                    return (
                      <tr
                        key={e.id}
                        className="border-b border-[#e5eeff] hover:bg-[#eff4ff]/50 transition-colors"
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-[#76777d] font-mono">
                          #{idx + 1}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#eff4ff] border border-[#e5eeff] flex items-center justify-center text-xs font-bold text-[#0b1c30]">
                              {getInitials(nombre)}
                            </div>
                            <span className="font-semibold text-[#0b1c30]">{nombre}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-[#0b1c30]">
                          {asistidas} / {totales} clases
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-bold tabular-nums text-xs"
                              style={{ color: pct === 0 ? "#ba1a1a" : "#0b1c30" }}
                            >
                              {pct.toFixed(1)}%
                            </span>
                            <div className="w-20 h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: pct === 0 ? "#ba1a1a" : "#fd761a",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{
                              backgroundColor: badgeColor.bg,
                              color: badgeColor.text,
                            }}
                          >
                            {badgeColor.label}
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

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA WORKSPACE: GESTIÓN Y PASE DE LISTA (DISEÑO UNIFICADO CODE.HTML)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-5">
      {/* Botón superior para volver al resumen inicial */}
      <div>
        <button
          onClick={() => setViewMode("overview")}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#76777d] hover:text-[#0b1c30] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-[#fd761a]" />
          Volver al resumen de asistencia
        </button>
      </div>

      {/* ─── Cabecera Principal y Acciones Rápidas ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Gestión de asistencia
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dce9ff] text-[#0b1c30] text-[11px] font-semibold">
              Periodo Activo
            </span>
          </div>
          <p className="text-sm text-[#45464d] mt-1">
            Selecciona una clase para registrar o revisar la asistencia sin salir de este panel unificado.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportarReporte}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#e5eeff] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#45464d]" />
            ) : (
              <Download className="w-4 h-4 text-[#45464d]" />
            )}
            Exportar reporte
          </button>

          {proximaClasePendiente ? (
            <button
              onClick={handleRegistrarProximaClase}
              className="px-4 py-2.5 rounded-xl bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-[#fd761a]/25 transition-all active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              <span>Registrar próxima clase</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {getFechaCorta(proximaClasePendiente.clase.fecha_clase)}
              </span>
            </button>
          ) : (
            <span className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Módulo completo
            </span>
          )}
        </div>
      </div>

      {/* ─── Cinta Global de Progreso y Métricas ─── */}
      <div className="w-full bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-[#e5eeff] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#fd761a]" />
              <span className="text-base font-bold text-[#0b1c30]">
                Progreso general del curso
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#fd761a]">
                {progresoGeneralPct}%
              </span>
              <span className="text-xs font-medium text-[#45464d]">
                ({totalClasesRegistradas} de {totalClasesGeneral} clases registradas)
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#e5eeff] overflow-hidden flex">
            <div
              className="h-full bg-[#fd761a] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(Number(progresoGeneralPct), 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#eff4ff] border border-[#e5eeff]">
            <div className="w-8 h-8 rounded-lg bg-[#009668]/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#009668]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-[#0b1c30]">{totalClasesRegistradas}</span>
              <span className="text-[11px] font-medium text-[#45464d]">Registradas</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#eff4ff] border border-[#e5eeff]">
            <div className="w-8 h-8 rounded-lg bg-[#fd761a]/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#fd761a]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-[#0b1c30]">{totalClasesPendientes}</span>
              <span className="text-[11px] font-medium text-[#45464d]">Pendientes</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#eff4ff] border border-[#e5eeff]">
            <div className="w-8 h-8 rounded-lg bg-[#d3e4fe] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#0b1c30]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-[#0b1c30]">{estudiantes.length}</span>
              <span className="text-[11px] font-medium text-[#45464d]">Estudiantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Grid Principal a 2 Columnas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── COLUMNA IZQUIERDA (5 cols): Cronograma del Curso ─── */}
        <section aria-label="Cronograma de Clases" className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] overflow-hidden flex flex-col">
            {/* Header columna izquierda */}
            <div className="p-4 space-y-3 bg-[#eff4ff]/60 border-b border-[#e5eeff]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#45464d]" />
                  <h2 className="text-base font-bold text-[#0b1c30]">Cronograma del Curso</h2>
                </div>
                {proximaClasePendiente && (
                  <button
                    onClick={handleRegistrarProximaClase}
                    className="px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#341100] text-[11px] font-bold flex items-center gap-1 hover:bg-[#ffb690] transition-all"
                  >
                    <Zap className="w-3 h-3 text-[#fd761a]" />
                    Ir a próxima
                  </button>
                )}
              </div>

              {/* Buscador de clase */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                <input
                  type="text"
                  value={claseSearch}
                  onChange={(e) => setClaseSearch(e.target.value)}
                  placeholder="Buscar por fecha, mes o día..."
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs text-[#0b1c30] border border-[#e5eeff] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all"
                />
              </div>

              {/* Pills de filtro */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setClaseFiltro("todas")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    claseFiltro === "todas"
                      ? "bg-[#0b1c30] text-white shadow-sm"
                      : "bg-white text-[#45464d] hover:bg-[#e5eeff]"
                  }`}
                >
                  Todas ({totalClasesGeneral})
                </button>
                <button
                  onClick={() => setClaseFiltro("pendientes")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    claseFiltro === "pendientes"
                      ? "bg-[#0b1c30] text-white shadow-sm"
                      : "bg-white text-[#45464d] hover:bg-[#e5eeff]"
                  }`}
                >
                  Pendientes ({totalClasesPendientes})
                </button>
                <button
                  onClick={() => setClaseFiltro("registradas")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    claseFiltro === "registradas"
                      ? "bg-[#0b1c30] text-white shadow-sm"
                      : "bg-white text-[#45464d] hover:bg-[#e5eeff]"
                  }`}
                >
                  Registradas ({totalClasesRegistradas})
                </button>
              </div>
            </div>

            {/* Listado de Módulos y Clases */}
            <div className="p-3 space-y-3 max-h-[820px] overflow-y-auto">
              {loadingInitial ? (
                <div className="p-10 text-center text-xs text-[#76777d]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#fd761a]" />
                  Cargando cronograma del curso...
                </div>
              ) : modulosFiltrados.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#76777d] border border-dashed rounded-xl border-[#e5eeff]">
                  No se encontraron clases con los filtros aplicados.
                </div>
              ) : (
                modulosFiltrados.map(({ modulo, clases, registradas, total }) => {
                  const isExpanded = !!expandedModulos[modulo.id]
                  const pct = total > 0 ? Math.round((registradas / total) * 100) : 0

                  return (
                    <div key={modulo.id} className="space-y-1.5">
                      {(() => {
                        const isSelectedModulo = selectedModulo?.id === modulo.id
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModulos((prev) => ({
                                ...prev,
                                [modulo.id]: !prev[modulo.id],
                              }))
                            }
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group border ${
                              isSelectedModulo
                                ? "bg-[#ffdbca]/40 border-[#fd761a]/50 shadow-sm"
                                : "bg-[#eff4ff]/70 hover:bg-[#eff4ff] border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? (
                                <FolderOpen
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    isSelectedModulo ? "text-[#fd761a]" : "text-[#76777d]"
                                  }`}
                                />
                              ) : (
                                <Folder
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    isSelectedModulo ? "text-[#fd761a]" : "text-[#76777d]"
                                  }`}
                                />
                              )}
                              <span
                                className={`text-xs uppercase tracking-wider truncate transition-colors ${
                                  isSelectedModulo
                                    ? "text-[#fd761a] font-black"
                                    : "text-[#0b1c30] font-bold"
                                }`}
                              >
                                MÓDULO {modulo.numero_orden ?? "—"}: {modulo.nombre_modulo}
                              </span>
                              {isSelectedModulo && (
                                <span className="px-1.5 py-0.5 rounded bg-[#fd761a] text-white text-[9px] font-extrabold uppercase shrink-0">
                                  Módulo actual
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                  isSelectedModulo
                                    ? "bg-[#ffdbca] text-[#341100]"
                                    : "bg-[#dce9ff] text-[#45464d]"
                                }`}
                              >
                                {registradas} / {total} ({pct}%)
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isSelectedModulo ? "text-[#fd761a]" : "text-[#76777d]"
                                } ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>
                        )
                      })()}

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden space-y-1.5 pl-1"
                          >
                            {clases.length === 0 ? (
                              <div className="p-4 text-center text-xs text-[#76777d]">
                                Sin clases programadas en este módulo
                              </div>
                            ) : (
                              clases.map((clase) => {
                                const isSelected = selectedClase?.id === clase.id
                                const isNext = proximaClasePendiente?.clase.id === clase.id
                                const isRegistered = clase.asistencia_registrada

                                return (
                                  <div
                                    key={clase.id}
                                    onClick={() => cargarAsistenciaDeClase(clase, modulo)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        cargarAsistenciaDeClase(clase, modulo)
                                      }
                                    }}
                                    className={`relative p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                                      isSelected
                                        ? "bg-white shadow-md ring-2 ring-[#fd761a]"
                                        : "bg-white hover:bg-[#eff4ff]/60 border border-[#e5eeff] shadow-sm"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="absolute -left-0.5 top-2 bottom-2 w-1 bg-[#fd761a] rounded-r" />
                                    )}

                                    <div className="flex items-center gap-3 min-w-0 pl-1">
                                      <div
                                        className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-center shrink-0 ${
                                          isSelected
                                            ? "bg-[#ffdbca] text-[#341100]"
                                            : isRegistered
                                            ? "bg-[#eff4ff] text-[#0b1c30]"
                                            : "bg-[#eff4ff] text-[#45464d]"
                                        }`}
                                      >
                                        <span className="text-[9px] uppercase font-extrabold leading-none">
                                          {getMesAbrev(clase.fecha_clase)}
                                        </span>
                                        <span className="text-base font-black leading-tight">
                                          {getDiaNumero(clase.fecha_clase)}
                                        </span>
                                      </div>

                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-bold text-[#0b1c30] truncate">
                                            {getFechaLarga(clase.fecha_clase)}
                                          </span>

                                          {isRegistered ? (
                                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#d3e4fe] text-[#005236] text-[10px] font-bold">
                                              <Check className="w-3 h-3" />
                                              REGISTRADA
                                            </span>
                                          ) : isNext ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffdbca] text-[#341100] text-[10px] font-bold">
                                              <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a] animate-ping" />
                                              Próxima clase
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.2 rounded bg-[#dce9ff] text-[#76777d] text-[10px] font-semibold">
                                              PENDIENTE
                                            </span>
                                          )}
                                        </div>

                                        <span
                                          className={`text-[11px] truncate mt-0.5 ${
                                            isSelected
                                              ? "text-[#fd761a] font-medium"
                                              : "text-[#76777d]"
                                          }`}
                                        >
                                          {clase.hora_inicio} – {clase.hora_fin}
                                          {isRegistered && (
                                            <>
                                              {" "}· {clase.asistencias_presentes ?? presentesCount}/
                                              {clase.asistencias_total ?? estudiantes.length} Asistencias
                                            </>
                                          )}
                                          {!isRegistered && isSelected && (
                                            <> · En curso para registrar</>
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isSelected ? (
                                        <>
                                          <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-[#fd761a] text-white text-[10px] font-bold">
                                            Registrando
                                          </span>
                                          <ChevronRight className="w-4 h-4 text-[#fd761a]" />
                                        </>
                                      ) : isRegistered ? (
                                        <span className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[11px] font-medium transition-all">
                                          Ver
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-lg bg-[#e5eeff] hover:bg-[#dce9ff] text-[#0b1c30] text-[11px] font-medium transition-all">
                                          Registrar
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        {/* ─── COLUMNA DERECHA (7 cols): Pase de Lista - Registro Enfocado ─── */}
        <section aria-label="Pase de Lista de Clase" className="lg:col-span-7 flex flex-col gap-4">
          {!selectedClase ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] p-12 text-center text-[#76777d]">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-[#dce9ff]" />
              <p className="text-base font-bold text-[#0b1c30]">Ninguna clase seleccionada</p>
              <p className="text-xs text-[#76777d] mt-1">
                Selecciona una clase del cronograma a la izquierda para registrar o verificar la asistencia.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] overflow-hidden flex flex-col">
              {/* Encabezado del panel enfocado con gradiente suave */}
              <div className="p-5 md:p-6 space-y-4 bg-gradient-to-b from-[#eff4ff]/60 to-white border-b border-[#e5eeff]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedClase.asistencia_registrada ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Asistencia Registrada · Módulo {selectedModulo?.numero_orden ?? "1"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#fd761a]/15 text-[#9d4300] text-[11px] font-bold tracking-wider uppercase">
                          Pase de lista en vivo · Módulo {selectedModulo?.numero_orden ?? "1"}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-[#76777d] font-medium">
                        <span className={`w-2 h-2 rounded-full ${selectedClase.asistencia_registrada ? "bg-emerald-500" : "bg-[#fd761a]"}`} />
                        Sesión #{sesionNumero}
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-[#0b1c30] tracking-tight">
                      {getFechaCompletaConAnio(selectedClase.fecha_clase)}
                    </h2>

                    <div className="text-xs text-[#45464d] flex items-center gap-2 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#76777d]" />
                        {selectedClase.hora_inicio} – {selectedClase.hora_fin}
                      </span>
                      <span>•</span>
                      <span className="text-[#0b1c30] font-medium">{cursoNombre}</span>
                      {isAdmin && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => {
                              setEditClase(selectedClase)
                              setEditFecha((selectedClase.fecha_clase || "").substring(0, 10))
                              setEditHoraInicio((selectedClase.hora_inicio || "").substring(0, 5))
                              setEditHoraFin((selectedClase.hora_fin || "").substring(0, 5))
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#fd761a] hover:bg-[#ffdbca]/40 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Cambiar horario
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contador en vivo a la derecha */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 p-3 rounded-xl bg-[#eff4ff] border border-[#e5eeff] shrink-0">
                    <span className="text-[11px] text-[#45464d] font-medium">Estado estimado:</span>
                    <div className="flex items-center gap-1.5 text-[#009668]">
                      <CheckCircle2 className="w-4 h-4 text-[#009668]" />
                      <span className="text-lg font-bold text-[#0b1c30]">
                        {presentesCount} de {totalAlumnosClase}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#009668] font-bold">
                      {porcentajePresentes}% Presentes
                    </span>
                  </div>
                </div>

                {/* Banner Informativo / Feedback de guardado */}
                {selectedClase.asistencia_registrada ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-emerald-800 text-sm">
                          Asistencia guardada
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
                          Completada
                        </span>
                      </div>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        Puedes modificar cualquier estado y volver a guardar cuando lo requieras.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#dce9ff]/60 border border-[#d3e4fe] text-[#0b1c30]">
                    <Info className="w-5 h-5 text-[#fd761a] shrink-0" />
                    <p className="text-xs text-[#45464d] leading-snug">
                      Por defecto, todos los estudiantes están inicializados como{" "}
                      <strong className="text-[#0b1c30] font-bold">Presente</strong> 
                    </p>
                  </div>
                )}

                {/* Observaciones de la clase */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="class-notes"
                    className="flex items-center justify-between text-xs text-[#0b1c30] font-bold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-[#76777d]" />
                      Observaciones de la clase (opcional)
                    </span>
                    <span className="text-[11px] text-[#76777d] font-normal">Máx. 250 car.</span>
                  </label>
                  <textarea
                    id="class-notes"
                    value={claseObservaciones}
                    onChange={(e) => setClaseObservaciones(e.target.value)}
                    maxLength={250}
                    rows={2}
                    placeholder="Agregar observaciones para esta clase "
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#e5eeff] text-xs text-[#0b1c30] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all resize-none shadow-sm"
                  />
                </div>
              </div>

              {/* Toolbar de estudiantes */}
              <div className="px-5 py-3 bg-[#eff4ff]/40 border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                  <input
                    type="text"
                    value={estudianteSearch}
                    onChange={(e) => setEstudianteSearch(e.target.value)}
                    placeholder="Buscar estudiante por nombre..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl text-xs text-[#0b1c30] border border-[#e5eeff] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#45464d] hidden md:inline font-medium">
                    Acción rápida:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMarcarTodos("presente")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#eff4ff] text-[#009668] text-xs font-bold flex items-center gap-1.5 border border-[#e5eeff] shadow-sm transition-all active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Todos presentes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarcarTodos("ausente")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold flex items-center gap-1.5 border border-[#e5eeff] shadow-sm transition-all active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    Todos ausentes
                  </button>
                </div>
              </div>

              {/* Lista de estudiantes en pase de lista */}
              <div className="p-5 space-y-3 max-h-[580px] overflow-y-auto">
                {loadingEstudiantes ? (
                  <div className="p-12 text-center text-xs text-[#76777d]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#fd761a]" />
                    Cargando nómina de estudiantes...
                  </div>
                ) : estudiantesFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#76777d] border border-dashed rounded-xl border-[#e5eeff]">
                    {estudianteSearch
                      ? "Sin estudiantes que coincidan con la búsqueda."
                      : "No hay estudiantes matriculados en este curso."}
                  </div>
                ) : (
                  estudiantesFiltrados.map((e) => {
                    const nombreCompleto = getEstudianteName(e)
                    const iniciales = getInitials(nombreCompleto)
                    const status = asistenciasLocal[e.id]?.estado ?? "presente"
                    const isPresente = status === "presente"
                    const isAusente = status === "ausente"
                    const pctPrevio = e.porcentaje_asistencia ?? 0

                    return (
                      <div
                        key={e.id}
                        className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#eff4ff] border border-[#e5eeff] flex items-center justify-center text-[#0b1c30] text-sm font-bold shrink-0">
                            {iniciales}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-[#0b1c30]">
                                {nombreCompleto}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#0b1c30] text-[10px] font-semibold">
                                {pctPrevio}% Asistencia previa
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botones segmentados de estado: SÓLO Presente y Ausente */}
                        <div
                          className="inline-flex rounded-xl bg-[#eff4ff] p-1 gap-1 shrink-0 self-start md:self-auto border border-[#e5eeff]"
                          role="radiogroup"
                          aria-label={`Estado para ${nombreCompleto}`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(e.id, "presente")}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isPresente
                                ? "bg-white text-[#005236] shadow-sm ring-1 ring-[#009668]/20"
                                : "text-[#45464d] hover:text-[#0b1c30]"
                            }`}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                isPresente ? "text-[#009668]" : "text-[#76777d]"
                              }`}
                            />
                            Presente
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(e.id, "ausente")}
                            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isAusente
                                ? "bg-[#ffdad6] text-[#93000a] shadow-sm ring-1 ring-[#ba1a1a]/20"
                                : "text-[#45464d] hover:text-[#0b1c30]"
                            }`}
                          >
                            <XCircle
                              className={`w-4 h-4 ${
                                isAusente ? "text-[#ba1a1a]" : "text-[#76777d]"
                              }`}
                            />
                            Ausente
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer de Acciones */}
              <div className="p-5 md:p-6 bg-[#eff4ff]/60 border-t border-[#e5eeff] flex flex-col md:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleDescartarCambios}
                  disabled={saving}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold transition-all border border-[#e5eeff] shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#76777d]" />
                  Descartar cambios
                </button>

                <button
                  type="button"
                  onClick={() => handleGuardar(false)}
                  disabled={saving}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#0b1c30] text-white hover:bg-[#131b2e] text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {selectedClase.asistencia_registrada ? "Guardar cambios" : "Solo guardar"}
                </button>

                <div className="flex flex-col items-stretch md:items-end w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => handleGuardar(true)}
                    disabled={saving}
                    className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#fd761a]/25 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>
                          {siguienteClasePendiente
                            ? "Guardar y continuar"
                            : selectedClase.asistencia_registrada
                            ? "Actualizar asistencia"
                            : "Guardar"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {siguienteClasePendiente && (
                    <span className="text-[10px] text-[#76777d] mt-1 text-center md:text-right">
                      Abre clase del {getFechaLarga(siguienteClasePendiente.clase.fecha_clase)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ─── Modal de Edición de Fecha y Hora (Solo Administrador) ─── */}
      {editClase &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditClase(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#e5eeff]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-[#0b1c30] mb-1">
                Cambiar día y horario
              </h3>
              <p className="text-xs text-[#76777d] mb-4">
                {getFechaCompletaConAnio(editClase.fecha_clase)}
              </p>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#76777d]">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#e5eeff] rounded-xl outline-none focus:ring-2 focus:ring-[#fd761a] text-[#0b1c30]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#76777d]">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={editHoraInicio}
                      onChange={(e) => setEditHoraInicio(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#e5eeff] rounded-xl outline-none focus:ring-2 focus:ring-[#fd761a] text-[#0b1c30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#76777d]">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={editHoraFin}
                      onChange={(e) => setEditHoraFin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#e5eeff] rounded-xl outline-none focus:ring-2 focus:ring-[#fd761a] text-[#0b1c30]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditClase(null)}
                  disabled={editClaseSaving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#e5eeff] hover:bg-[#eff4ff] text-[#45464d] transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={editClaseSaving}
                  onClick={async () => {
                    if (!editFecha || !editHoraInicio || !editHoraFin) {
                      toast.error("Completa todos los campos")
                      return
                    }
                    if (editHoraInicio >= editHoraFin) {
                      toast.error("La hora de fin debe ser posterior a la de inicio")
                      return
                    }
                    setEditClaseSaving(true)
                    try {
                      await cursosService.updateClase(editClase.id, {
                        fecha_clase: editFecha,
                        hora_inicio: editHoraInicio.substring(0, 5),
                        hora_fin: editHoraFin.substring(0, 5),
                      })
                      toast.success("Clase actualizada")
                      setEditClase(null)

                      setModulosData((prev) =>
                        prev.map((m) => ({
                          ...m,
                          clases: m.clases.map((c) =>
                            c.id === editClase.id
                              ? {
                                  ...c,
                                  fecha_clase: editFecha,
                                  hora_inicio: editHoraInicio.substring(0, 5),
                                  hora_fin: editHoraFin.substring(0, 5),
                                }
                              : c
                          ),
                        }))
                      )

                      setSelectedClase((prev) =>
                        prev && prev.id === editClase.id
                          ? {
                              ...prev,
                              fecha_clase: editFecha,
                              hora_inicio: editHoraInicio.substring(0, 5),
                              hora_fin: editHoraFin.substring(0, 5),
                            }
                          : prev
                      )
                    } catch {
                      toast.error("Error al actualizar la clase")
                    } finally {
                      setEditClaseSaving(false)
                    }
                  }}
                  className="flex-[2] py-2.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#9d4300] transition-all disabled:opacity-50 shadow-sm"
                >
                  {editClaseSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
