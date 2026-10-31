import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Download,
  Loader2,
  ClipboardCheck,
} from "lucide-react"
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
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Filtro de búsqueda para la vista inicial
  const [overviewSearch, setOverviewSearch] = useState("")

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
    toast.info("Cambios descartados")
  }

  // ¿Hay cambios sin guardar respecto a la última versión guardada?
  const hayCambiosPendientes = useMemo(() => {
    if (claseObservaciones !== originalObservaciones) return true

    const ids = Object.keys(asistenciasLocal)
    if (ids.length !== Object.keys(originalAsistencias).length) return true

    return ids.some((id) => {
      const actual = asistenciasLocal[id]
      const original = originalAsistencias[id]
      return !original || actual.estado !== original.estado || actual.asistio !== original.asistio
    })
  }, [asistenciasLocal, originalAsistencias, claseObservaciones, originalObservaciones])

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

              {((modulos && modulos.length > 0) || modulosData.length > 0) && (
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
