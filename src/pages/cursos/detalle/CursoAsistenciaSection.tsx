import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Download,
  Loader2,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  Clock,
  ArrowRight,
} from "lucide-react"
import { parseLocalDate } from "@/lib/utils"
import {
  instructorService,
  type EstudianteCurso,
  type ClaseItem,
} from "@/services/instructor.service"
import { cursosService } from "@/services/cursos.service"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
import { PdfViewerModal } from "@/components/archivos/PdfViewerModal"
import { usePdfPreview } from "@/hooks/usePdfPreview"
import { usePermission } from "@/hooks/usePermission"
import { toast } from "sonner"
import {
  CursoAsistenciaWorkspace,
  type ModuloItem,
  type AsistenciaRegistro,
  type ModuloConClases,
} from "./CursoAsistenciaWorkspace"

interface Props {
  cursoId: string
  cursoNombre: string
  modulos?: ModuloItem[]
}

type ViewMode = "overview" | "workspace"

function getEstudianteName(e: EstudianteCurso): string {
  const ape = (e.estudiante?.apellidos || e.participante_externo?.apellidos || "").trim()
  const nom = (e.estudiante?.nombres || e.participante_externo?.nombres || "").trim()
  if (ape && nom) return `${ape} ${nom}`
  return ape || nom || "Estudiante"
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

function compararEstudiantesPorApellido(a: EstudianteCurso, b: EstudianteCurso): number {
  const apeA = (a.estudiante?.apellidos || a.participante_externo?.apellidos || "").trim()
  const apeB = (b.estudiante?.apellidos || b.participante_externo?.apellidos || "").trim()
  const comp = apeA.localeCompare(apeB, "es", { sensitivity: "base" })
  if (comp !== 0) return comp
  const nomA = (a.estudiante?.nombres || a.participante_externo?.nombres || "").trim()
  const nomB = (b.estudiante?.nombres || b.participante_externo?.nombres || "").trim()
  return nomA.localeCompare(nomB, "es", { sensitivity: "base" })
}

export function CursoAsistenciaSection({ cursoId, cursoNombre, modulos }: Props) {
  const { isAdmin } = usePermission()
  const { preview, abrirPreview, cerrarPreview } = usePdfPreview()

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
  const [claseTema, setClaseTema] = useState("")
  const [originalTema, setOriginalTema] = useState("")
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filtro de búsqueda para la vista inicial
  const [overviewSearch, setOverviewSearch] = useState("")
  const [overviewTab, setOverviewTab] = useState<"estudiantes" | "clases">("estudiantes")
  const [clasesSearch, setClasesSearch] = useState("")
  const [clasesFiltroEstado, setClasesFiltroEstado] = useState<"todas" | "registradas" | "pendientes">("todas")

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
        setEstudiantes([...estData].sort(compararEstudiantesPorApellido))

        // Cargar clases de cada módulo (asegurar módulos si no llegaron en props)
        let listaModulos = modulos
        if (listaModulos === undefined) {
          try {
            if (isAdmin) {
              const rawMods = await cursosService.getModulosCurso(cursoId)
              listaModulos = (rawMods as unknown as ModuloItem[]) || []
            } else {
              const cursoDetalle = await instructorService.getDetalleCurso(cursoId)
              listaModulos = (cursoDetalle?.modulos as unknown as ModuloItem[]) || []
            }
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
  }, [cursoId, modulos, isAdmin])

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
      setClaseTema(clase.tema || "")
      setOriginalTema(clase.tema || "")
      setLoadingEstudiantes(true)

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
    setClaseTema(originalTema)
    toast.info("Cambios descartados")
  }

  // ¿Hay cambios sin guardar respecto a la última versión guardada?
  const hayCambiosPendientes = useMemo(() => {
    if (claseObservaciones !== originalObservaciones) return true
    if (claseTema !== originalTema) return true

    const ids = Object.keys(asistenciasLocal)
    if (ids.length !== Object.keys(originalAsistencias).length) return true

    return ids.some((id) => {
      const actual = asistenciasLocal[id]
      const original = originalAsistencias[id]
      return !original || actual.estado !== original.estado || actual.asistio !== original.asistio
    })
  }, [asistenciasLocal, originalAsistencias, claseObservaciones, originalObservaciones, claseTema, originalTema])

  // Guardar asistencia
  const handleGuardar = async (continuarSiguiente: boolean = false) => {
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
        claseObservaciones,
        claseTema
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
                  tema: claseTema,
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
              tema: claseTema,
            }
          : null
      )

      setOriginalAsistencias(JSON.parse(JSON.stringify(asistenciasLocal)))
      setOriginalObservaciones(claseObservaciones)
      setOriginalTema(claseTema)

      // Actualizar datos del estudiante
      instructorService
        .getEstudiantesCurso(cursoId)
        .then((data) => setEstudiantes([...data].sort(compararEstudiantesPorApellido)))
        .catch(() => {})

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
      const resultado = await generarListadoAsistenciaPDF(data, { preview: true })
      if (resultado) {
        abrirPreview(resultado, `Reporte de Asistencia — ${cursoNombre}`)
      }
      toast.success("Vista previa del reporte generada")
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

  // Filtrado de estudiantes para la tabla inicial (ordenados por apellido)
  const overviewEstudiantesFiltrados = useMemo(() => {
    const list = !overviewSearch.trim()
      ? estudiantes
      : estudiantes.filter((e) => {
          const q = overviewSearch.toLowerCase().trim()
          const nombre = getEstudianteName(e).toLowerCase()
          const cedula = (e.estudiante?.cedula || e.participante_externo?.cedula || "").toLowerCase()
          return nombre.includes(q) || cedula.includes(q)
        })
    return [...list].sort(compararEstudiantesPorApellido)
  }, [estudiantes, overviewSearch])

  // Filtrado de clases para la pestaña de Historial por Clase
  const overviewClasesFiltradas = useMemo(() => {
    return todasClasesPlanas.filter(({ clase, modulo }) => {
      if (clasesFiltroEstado === "registradas" && !clase.asistencia_registrada) return false
      if (clasesFiltroEstado === "pendientes" && clase.asistencia_registrada) return false

      if (!clasesSearch.trim()) return true
      const q = clasesSearch.toLowerCase().trim()
      const tema = (clase.tema || "").toLowerCase()
      const obs = (clase.observaciones || "").toLowerCase()
      const fecha = (clase.fecha_clase || "").toLowerCase()
      const modNombre = (modulo.nombre_modulo || "").toLowerCase()

      return tema.includes(q) || obs.includes(q) || fecha.includes(q) || modNombre.includes(q)
    })
  }, [todasClasesPlanas, clasesSearch, clasesFiltroEstado])

  const pdfPreviewModal = (
    <PdfViewerModal
      isOpen={preview.isOpen}
      onClose={cerrarPreview}
      titulo={preview.titulo}
      url={preview.url}
      nombreArchivo={preview.nombreArchivo}
    />
  )

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

        {/* Selector de sub-pestaña: Por Estudiante vs Historial por Clase */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 rounded-xl bg-white border border-[#e5eeff] shadow-xs">
            <button
              type="button"
              onClick={() => setOverviewTab("estudiantes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                overviewTab === "estudiantes"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-[#76777d] hover:text-[#0b1c30] hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Estudiante ({estudiantes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setOverviewTab("clases")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                overviewTab === "clases"
                  ? "bg-[#fd761a] text-white shadow-xs"
                  : "text-[#76777d] hover:text-[#0b1c30] hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Historial por Clase ({totalClasesGeneral})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleExportarReporte}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#e5eeff] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#76777d]" />
              ) : (
                <Download className="w-4 h-4 text-[#76777d]" />
              )}
              Exportar reporte
            </button>

            {((modulos && modulos.length > 0) || modulosData.length > 0) && (
              <button
                onClick={handleAbrirRegistroAsistencia}
                className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-[#fd761a]/25 transition-all active:scale-[0.98] cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                Registrar Asistencia
              </button>
            )}
          </div>
        </div>

        {overviewTab === "clases" ? (
          /* ─── VISTA 1: HISTORIAL Y BITÁCORA POR CLASE ─── */
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] overflow-hidden">
            {/* Header del historial de clases */}
            <div className="p-5 md:p-6 border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0b1c30]">
                  Historial y bitácora de clases
                </h2>
                <p className="text-xs text-[#76777d] mt-0.5">
                  Consulta de temas vistos, observaciones y asistencia por sesión
                </p>
              </div>

              {/* Filtros rápidos: Todas, Registradas, Pendientes */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#eff4ff]/60 border border-[#e5eeff] self-start sm:self-auto text-xs">
                {(["todas", "registradas", "pendientes"] as const).map((filtro) => {
                  const count =
                    filtro === "todas"
                      ? totalClasesGeneral
                      : filtro === "registradas"
                      ? totalClasesRegistradas
                      : totalClasesPendientes
                  const label =
                    filtro === "todas"
                      ? "Todas"
                      : filtro === "registradas"
                      ? "Registradas"
                      : "Pendientes"
                  return (
                    <button
                      key={filtro}
                      type="button"
                      onClick={() => setClasesFiltroEstado(filtro)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                        clasesFiltroEstado === filtro
                          ? "bg-white text-[#0b1c30] shadow-xs"
                          : "text-[#76777d] hover:text-[#0b1c30]"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Buscador de clases por tema, fecha u observación */}
            {todasClasesPlanas.length > 0 && (
              <div className="p-4 bg-[#eff4ff]/30 border-b border-[#e5eeff]">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                  <input
                    type="text"
                    value={clasesSearch}
                    onChange={(e) => setClasesSearch(e.target.value)}
                    placeholder="Buscar por tema visto, módulo, fecha u observación..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white rounded-xl text-xs text-[#0b1c30] border border-[#e5eeff] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#fd761a] transition-all shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Contenido: Tabla de Clases */}
            <div className="overflow-x-auto">
              {loadingInitial ? (
                <div className="p-12 text-center text-xs text-[#76777d]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#fd761a]" />
                  Cargando clases y cronograma...
                </div>
              ) : todasClasesPlanas.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#76777d]">
                  No hay clases programadas para este curso.
                </div>
              ) : overviewClasesFiltradas.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#76777d]">
                  No se encontraron clases que coincidan con el filtro o búsqueda.
                </div>
              ) : (
                <>
                  {/* Vista móvil (< md): Tarjetas compactas */}
                  <div className="block md:hidden divide-y divide-[#e5eeff]">
                    {overviewClasesFiltradas.map(({ clase, modulo }, idx) => {
                      const totalAlumnos = clase.asistencias_total ?? estudiantes.length
                      const presentes = clase.asistencias_presentes ?? 0
                      const pct = totalAlumnos > 0 ? Math.round((presentes / totalAlumnos) * 100) : 0
                      return (
                        <div key={clase.id || idx} className="p-4 space-y-3 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-[#76777d] mb-0.5">
                                <span className="font-mono font-bold text-[#fd761a]">Sesión #{idx + 1}</span>
                                <span>·</span>
                                <span>Módulo {modulo.numero_orden || "1"}</span>
                              </div>
                              <h4 className="font-bold text-sm text-[#0b1c30]">
                                {getFechaCompletaConAnio(clase.fecha_clase)}
                              </h4>
                              <p className="text-xs text-[#76777d]">
                                {clase.hora_inicio} – {clase.hora_fin}
                              </p>
                            </div>
                            {clase.asistencia_registrada ? (
                              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d3e4fe] text-[#005236]">
                                {presentes}/{totalAlumnos} ({pct}%)
                              </span>
                            ) : (
                              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdbca] text-[#5c2400]">
                                Por registrar
                              </span>
                            )}
                          </div>

                          {/* Tema visto */}
                          <div className="p-2.5 rounded-lg bg-[#eff4ff]/50 border border-[#e5eeff] space-y-1">
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#fd761a]">
                              <BookOpen className="w-3 h-3" />
                              Tema visto
                            </span>
                            <p className="text-xs font-semibold text-[#0b1c30]">
                              {clase.tema ? (
                                clase.tema
                              ) : (
                                <span className="text-[#76777d] font-normal italic">Sin tema registrado</span>
                              )}
                            </p>
                          </div>

                          {/* Observación si existe */}
                          {clase.observaciones && (
                            <div className="text-xs text-[#45464d] flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-[#76777d] shrink-0 mt-0.5" />
                              <span className="italic">"{clase.observaciones}"</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              cargarAsistenciaDeClase(clase, modulo)
                              setViewMode("workspace")
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-[#eff4ff] text-xs font-bold text-[#0b1c30] border border-[#e5eeff] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>{clase.asistencia_registrada ? "Ver / Editar asistencia" : "Tomar asistencia"}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#fd761a]" />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Vista Desktop (>= md): Tabla completa */}
                  <table className="hidden md:table w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#e5eeff] bg-[#f8faff] text-[#76777d] font-semibold">
                        <th className="py-3 px-4 font-mono w-14">#</th>
                        <th className="py-3 px-4 min-w-[170px]">Sesión y Fecha</th>
                        <th className="py-3 px-4 min-w-[140px]">Módulo</th>
                        <th className="py-3 px-4 min-w-[220px]">Tema Visto en Clase</th>
                        <th className="py-3 px-4 min-w-[160px]">Asistencia</th>
                        <th className="py-3 px-4 min-w-[180px]">Observaciones</th>
                        <th className="py-3 px-4 text-right w-28">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5eeff]">
                      {overviewClasesFiltradas.map(({ clase, modulo }, idx) => {
                        const totalAlumnos = clase.asistencias_total ?? estudiantes.length
                        const presentes = clase.asistencias_presentes ?? 0
                        const pct = totalAlumnos > 0 ? Math.round((presentes / totalAlumnos) * 100) : 0
                        return (
                          <tr
                            key={clase.id || idx}
                            className="hover:bg-[#eff4ff]/40 transition-colors cursor-pointer"
                            onClick={() => {
                              cargarAsistenciaDeClase(clase, modulo)
                              setViewMode("workspace")
                            }}
                          >
                            <td className="py-3.5 px-4 font-mono text-[#76777d] font-bold">
                              #{idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#0b1c30] text-xs">
                                {getFechaCompletaConAnio(clase.fecha_clase)}
                              </div>
                              <span className="text-[11px] text-[#76777d] flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {clase.hora_inicio} – {clase.hora_fin}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold max-w-[150px] truncate"
                                title={modulo.nombre_modulo}
                              >
                                Mód. {modulo.numero_orden || "1"}: {modulo.nombre_modulo}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {clase.tema ? (
                                <div className="flex items-start gap-1.5 max-w-sm">
                                  <BookOpen className="w-3.5 h-3.5 text-[#fd761a] shrink-0 mt-0.5" />
                                  <span className="font-semibold text-xs text-[#0b1c30] line-clamp-2">
                                    {clase.tema}
                                  </span>
                                </div>
                              ) : clase.asistencia_registrada ? (
                                <span className="text-xs text-[#76777d] italic">Sin tema registrado</span>
                              ) : (
                                <span className="text-xs text-[#76777d]">Pendiente</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {clase.asistencia_registrada ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#0b1c30] text-xs">
                                      {presentes} / {totalAlumnos}
                                    </span>
                                    <span
                                      className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                                      style={{
                                        backgroundColor:
                                          pct >= 70 ? "#d3e4fe" : pct >= 50 ? "#ffdbca" : "#ffdad6",
                                        color:
                                          pct >= 70 ? "#005236" : pct >= 50 ? "#5c2400" : "#93000a",
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className="w-24 h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.min(pct, 100)}%`,
                                        backgroundColor:
                                          pct >= 70 ? "#009668" : pct >= 50 ? "#fd761a" : "#ba1a1a",
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdbca] text-[#5c2400]">
                                  <Clock className="w-3 h-3" />
                                  Por registrar
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {clase.observaciones ? (
                                <div
                                  className="flex items-start gap-1 max-w-xs text-xs text-[#45464d]"
                                  title={clase.observaciones}
                                >
                                  <MessageSquare className="w-3 h-3 text-[#76777d] shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{clase.observaciones}</span>
                                </div>
                              ) : (
                                <span className="text-[#76777d]">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  cargarAsistenciaDeClase(clase, modulo)
                                  setViewMode("workspace")
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#fd761a] hover:bg-[#ffdbca]/40 transition-colors cursor-pointer"
                              >
                                <span>{clase.asistencia_registrada ? "Ver" : "Tomar"}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ─── VISTA 2: RESUMEN POR ESTUDIANTE (EXISTENTE) ─── */
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
              <>
                {/* Vista Móvil (< sm): Tarjetas compactas sin scroll horizontal */}
                <div className="block sm:hidden divide-y divide-[#e5eeff]">
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
                      <div key={e.id} className="p-4 space-y-2.5 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono text-[#76777d] mr-1.5">#{idx + 1}</span>
                            <span className="font-bold text-sm text-[#0b1c30] break-words">{nombre}</span>
                          </div>
                          <span
                            className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: badgeColor.bg, color: badgeColor.text }}
                          >
                            {badgeColor.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#45464d] pt-0.5">
                          <span>{asistidas} / {totales} clases</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold tabular-nums text-xs" style={{ color: pct === 0 ? "#ba1a1a" : "#0b1c30" }}>
                              {pct.toFixed(1)}%
                            </span>
                            <div className="w-16 h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: pct === 0 ? "#ba1a1a" : "#fd761a",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Vista Escritorio (>= sm): Tabla completa sin iniciales */}
                <table className="hidden sm:table w-full text-left border-collapse text-sm">
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
                            <span className="font-semibold text-[#0b1c30]">{nombre}</span>
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
              </>
            )}
          </div>
        </div>
        )}
        {pdfPreviewModal}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA WORKSPACE: GESTIÓN Y PASE DE LISTA (SEPARADA EN COMPONENTE)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <CursoAsistenciaWorkspace
      cursoNombre={cursoNombre}
      isAdmin={isAdmin}
      estudiantes={estudiantes}
      loadingEstudiantes={loadingEstudiantes}
      modulosData={modulosData}
      setModulosData={setModulosData}
      selectedClase={selectedClase}
      setSelectedClase={setSelectedClase}
      selectedModulo={selectedModulo}
      cargarAsistenciaDeClase={cargarAsistenciaDeClase}
      asistenciasLocal={asistenciasLocal}
      claseObservaciones={claseObservaciones}
      setClaseObservaciones={setClaseObservaciones}
      claseTema={claseTema}
      setClaseTema={setClaseTema}
      saving={saving}
      hayCambiosPendientes={hayCambiosPendientes}
      handleToggleEstado={handleToggleEstado}
      handleMarcarTodos={handleMarcarTodos}
      handleDescartarCambios={handleDescartarCambios}
      handleGuardar={handleGuardar}
      handleExportarReporte={handleExportarReporte}
      exporting={exporting}
      handleRegistrarProximaClase={handleRegistrarProximaClase}
      proximaClasePendiente={proximaClasePendiente}
      siguienteClasePendiente={siguienteClasePendiente}
      todasClasesPlanas={todasClasesPlanas}
      totalClasesGeneral={totalClasesGeneral}
      totalClasesRegistradas={totalClasesRegistradas}
      totalClasesPendientes={totalClasesPendientes}
      progresoGeneralPct={progresoGeneralPct}
      onVolver={() => setViewMode("overview")}
    />
      {pdfPreviewModal}
    </>
  )
}
