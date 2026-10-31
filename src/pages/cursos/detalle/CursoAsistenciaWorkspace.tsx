import { useState, useMemo, useEffect } from "react"
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
  Edit3,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RotateCcw,
  X,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
} from "lucide-react"
import { parseLocalDate } from "@/lib/utils"
import type { EstudianteCurso, ClaseItem } from "@/services/instructor.service"
import { cursosService } from "@/services/cursos.service"
import { toast } from "sonner"

export interface ModuloItem {
  id: string
  nombre_modulo: string
  numero_orden?: number
}

export interface AsistenciaRegistro {
  asistio: boolean
  estado: "presente" | "ausente"
}

export interface ModuloConClases {
  modulo: ModuloItem
  clases: ClaseItem[]
  registradas: number
  total: number
}

type FiltroEstado = "todas" | "pendientes" | "registradas"

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

interface CursoAsistenciaWorkspaceProps {
  cursoNombre: string
  isAdmin: boolean
  estudiantes: EstudianteCurso[]
  loadingEstudiantes: boolean
  modulosData: ModuloConClases[]
  setModulosData: React.Dispatch<React.SetStateAction<ModuloConClases[]>>
  selectedClase: ClaseItem | null
  setSelectedClase: React.Dispatch<React.SetStateAction<ClaseItem | null>>
  selectedModulo: ModuloItem | null
  cargarAsistenciaDeClase: (clase: ClaseItem, modulo: ModuloItem) => Promise<void>
  asistenciasLocal: Record<string, AsistenciaRegistro>
  claseObservaciones: string
  setClaseObservaciones: React.Dispatch<React.SetStateAction<string>>
  saving: boolean
  hayCambiosPendientes: boolean
  handleToggleEstado: (matriculaId: string, nuevoEstado: "presente" | "ausente") => void
  handleMarcarTodos: (estado: "presente" | "ausente") => void
  handleDescartarCambios: () => void
  handleGuardar: (avanzarSiguiente?: boolean) => Promise<void>
  handleExportarReporte: () => Promise<void>
  exporting: boolean
  handleRegistrarProximaClase: () => void
  proximaClasePendiente: { clase: ClaseItem; modulo: ModuloItem } | null
  siguienteClasePendiente: { clase: ClaseItem; modulo: ModuloItem } | null
  todasClasesPlanas: { clase: ClaseItem; modulo: ModuloItem }[]
  totalClasesGeneral: number
  totalClasesRegistradas: number
  totalClasesPendientes: number
  progresoGeneralPct: string
  onVolver: () => void
}

export function CursoAsistenciaWorkspace({
  cursoNombre,
  isAdmin,
  estudiantes,
  loadingEstudiantes,
  modulosData,
  setModulosData,
  selectedClase,
  setSelectedClase,
  selectedModulo,
  cargarAsistenciaDeClase,
  asistenciasLocal,
  claseObservaciones,
  setClaseObservaciones,
  saving,
  hayCambiosPendientes = true,
  handleToggleEstado,
  handleMarcarTodos,
  handleDescartarCambios,
  handleGuardar,
  handleExportarReporte,
  exporting,
  handleRegistrarProximaClase,
  proximaClasePendiente,
  siguienteClasePendiente,
  todasClasesPlanas,
  totalClasesGeneral,
  totalClasesRegistradas,
  totalClasesPendientes,
  progresoGeneralPct,
  onVolver,
}: CursoAsistenciaWorkspaceProps) {
  // Drawer cronograma state
  const [isCronogramaOpen, setIsCronogramaOpen] = useState(false)
  const [claseFiltro, setClaseFiltro] = useState<FiltroEstado>("todas")
  const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>({})

  // Búsqueda de estudiantes en el listado
  const [estudianteSearch, setEstudianteSearch] = useState("")

  useEffect(() => {
    setEstudianteSearch("")
  }, [selectedClase?.id])

  // Control para mostrar/ocultar observaciones de la clase
  const [showObservaciones, setShowObservaciones] = useState(() => Boolean(claseObservaciones.trim()))

  // Modal para editar fecha/hora (solo admin)
  const [editClase, setEditClase] = useState<ClaseItem | null>(null)
  const [editFecha, setEditFecha] = useState("")
  const [editHoraInicio, setEditHoraInicio] = useState("")
  const [editHoraFin, setEditHoraFin] = useState("")
  const [editClaseSaving, setEditClaseSaving] = useState(false)

  // Filtrado de módulos para el drawer del cronograma
  const modulosFiltrados = useMemo(() => {
    return modulosData
      .map((item) => {
        const clasesFiltradas = item.clases.filter((c) => {
          if (claseFiltro === "pendientes" && c.asistencia_registrada) return false
          if (claseFiltro === "registradas" && !c.asistencia_registrada) return false
          return true
        })

        return {
          ...item,
          clases: clasesFiltradas,
        }
      })
      .filter((item) => item.clases.length > 0)
  }, [modulosData, claseFiltro])

  // Filtrado de estudiantes en el pase de lista
  const estudiantesFiltrados = useMemo(() => {
    const list = !estudianteSearch.trim()
      ? estudiantes
      : estudiantes.filter((e) => {
          const q = estudianteSearch.toLowerCase().trim()
          const nombre = getEstudianteName(e).toLowerCase()
          const cedula = (e.estudiante?.cedula || e.participante_externo?.cedula || "").toLowerCase()
          return nombre.includes(q) || cedula.includes(q)
        })
    return [...list].sort(compararEstudiantesPorApellido)
  }, [estudiantes, estudianteSearch])

  // Conteo en vivo de la clase activa
  const presentesCount = useMemo(() => {
    return Object.values(asistenciasLocal).filter((a) => a.asistio).length
  }, [asistenciasLocal])

  const totalAlumnosClase = estudiantes.length
  const porcentajePresentes =
    totalAlumnosClase > 0 ? Math.round((presentesCount / totalAlumnosClase) * 100) : 0

  // Número de sesión de la clase seleccionada
  const sesionNumero = useMemo(() => {
    if (!selectedClase) return 1
    const idx = todasClasesPlanas.findIndex((item) => item.clase.id === selectedClase.id)
    return idx >= 0 ? idx + 1 : 1
  }, [todasClasesPlanas, selectedClase])

  return (
    <div className="w-full space-y-4">
      {/* ─── BARRA SUPERIOR COMPACTA ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#e5eeff] shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onVolver}
            className="p-1.5 rounded-lg border border-[#e5eeff] hover:bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30] transition-colors shrink-0"
            title="Volver al resumen"
            aria-label="Volver al resumen"
          >
            <ArrowLeft className="w-4 h-4 text-[#fd761a]" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#0b1c30] tracking-tight truncate">
                Registro de Asistencia
              </h2>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464d] text-[11px] font-medium border border-[#e5eeff] truncate max-w-[200px]">
                {cursoNombre}
              </span>
            </div>
            <p className="text-[11px] text-[#76777d] truncate">
              {totalClasesGeneral} clases programadas · {progresoGeneralPct}% completado
            </p>
          </div>
        </div>

        {/* Acciones principales compactas */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCronogramaOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isCronogramaOpen
                ? "bg-[#0b1c30] text-white border-[#0b1c30]"
                : "bg-white text-[#0b1c30] border-[#e5eeff] hover:bg-[#eff4ff]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#fd761a]" />
            <span>Cronograma</span>
            {isCronogramaOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-white" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 text-[#76777d]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportarReporte}
            disabled={exporting}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#e5eeff] hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#45464d]" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#45464d]" />
            )}
            <span className="hidden sm:inline">Exportar reporte</span>
            <span className="sm:hidden">Reporte</span>
          </button>

          {proximaClasePendiente ? (
            <button
              type="button"
              onClick={handleRegistrarProximaClase}
              className="px-3 py-1.5 rounded-lg bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Próxima clase</span>
              <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px] font-mono">
                {getFechaCorta(proximaClasePendiente.clase.fecha_clase)}
              </span>
            </button>
          ) : (
            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Módulo completo</span>
            </span>
          )}
        </div>
      </div>

      {/* ─── CINTA DE PROGRESO COMPACTA Y MINIMALISTA ─── */}
      <div className="bg-white rounded-xl px-4 py-2.5 border border-[#e5eeff] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-semibold text-[#0b1c30] shrink-0 text-xs">
            Progreso: <strong className="text-[#fd761a]">{progresoGeneralPct}%</strong>
          </span>
          <div className="flex-1 max-w-xs h-2 rounded-full bg-[#eff4ff] border border-[#e5eeff] overflow-hidden">
            <div
              className="h-full bg-[#fd761a] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(Number(progresoGeneralPct), 100)}%` }}
            />
          </div>
          <span className="text-[#76777d] text-[11px] shrink-0 hidden sm:inline">
            ({totalClasesRegistradas} de {totalClasesGeneral} clases)
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {totalClasesRegistradas} Registradas
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            {totalClasesPendientes} Pendientes
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-semibold">
            <Users className="w-3 h-3 text-blue-600" />
            {estudiantes.length} Estudiantes
          </span>
        </div>
      </div>

      {/* ─── PASE DE LISTA DE LA CLASE ACTIVA ─── */}
      {!selectedClase ? (
        <div className="bg-white rounded-xl shadow-xs border border-[#e5eeff] p-10 text-center text-[#76777d]">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-[#dce9ff]" />
          <h3 className="text-sm font-bold text-[#0b1c30]">Ninguna clase seleccionada</h3>
          <p className="text-xs text-[#76777d] mt-0.5 mb-3 max-w-sm mx-auto">
            Abre el cronograma a la derecha para seleccionar una clase y registrar o revisar la asistencia.
          </p>
          <button
            type="button"
            onClick={() => setIsCronogramaOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ver cronograma</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-[#e5eeff] overflow-hidden flex flex-col">
          {/* Header de la clase seleccionada: limpio y proporcionado */}
          <div className="p-4 sm:p-5 bg-gradient-to-b from-[#f8faff] to-white border-b border-[#e5eeff] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {selectedClase.asistencia_registrada ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Registrada · Módulo {selectedModulo?.numero_orden ?? "1"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-[#ffdbca] text-[#9d4300] border border-[#fd761a]/20 text-[10px] font-bold uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a] animate-pulse" />
                      Por registrar · Módulo {selectedModulo?.numero_orden ?? "1"}
                    </span>
                  )}
                  <span className="text-[11px] text-[#76777d] font-medium">
                    Sesión #{sesionNumero}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1c30] tracking-tight">
                    {getFechaCompletaConAnio(selectedClase.fecha_clase)}
                  </h3>
                  <span className="text-xs text-[#45464d] flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#76777d]" />
                    {selectedClase.hora_inicio} – {selectedClase.hora_fin}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditClase(selectedClase)
                        setEditFecha((selectedClase.fecha_clase || "").substring(0, 10))
                        setEditHoraInicio((selectedClase.hora_inicio || "").substring(0, 5))
                        setEditHoraFin((selectedClase.hora_fin || "").substring(0, 5))
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-[#fd761a] hover:bg-[#ffdbca]/40 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      Cambiar horario
                    </button>
                  )}
                </div>
              </div>

              {/* Conteo de asistencia rápida */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-[#eff4ff] border border-[#e5eeff]">
                <div className="w-6 h-6 rounded-md bg-[#009668]/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#009668]" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#0b1c30]">
                    {presentesCount} de {totalAlumnosClase}
                  </span>
                  <span className="text-[11px] text-[#009668] font-bold ml-1.5">
                    ({porcentajePresentes}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso informativo sutil de 1 sola línea */}
            {selectedClase.asistencia_registrada ? (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    <strong>Asistencia guardada.</strong> Puedes modificar cualquier estado y volver a guardar.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowObservaciones((prev) => !prev)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  {showObservaciones ? "Ocultar notas" : "Observaciones"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[#0b1c30] text-xs">
                <span className="text-[#45464d] text-xs truncate">
                  Por defecto todos inician como <strong>Presente</strong>. Marca los ausentes y guarda.
                </span>
                <button
                  type="button"
                  onClick={() => setShowObservaciones((prev) => !prev)}
                  className="text-[11px] font-semibold text-[#fd761a] hover:text-[#9d4300] flex items-center gap-1 shrink-0 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  {showObservaciones ? "Ocultar notas" : "+ Observación"}
                </button>
              </div>
            )}

            {/* Observaciones colapsables */}
            {showObservaciones && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs text-[#0b1c30] font-semibold">
                  <span className="flex items-center gap-1 text-[11px] text-[#76777d]">
                    <Edit3 className="w-3 h-3" />
                    Observaciones de la clase (opcional)
                  </span>
                  <span className="text-[10px] text-[#76777d]">{claseObservaciones.length}/250</span>
                </div>
                <textarea
                  value={claseObservaciones}
                  onChange={(e) => setClaseObservaciones(e.target.value)}
                  maxLength={250}
                  rows={2}
                  placeholder="Escribe comentarios u observaciones relevantes sobre esta sesión..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#e5eeff] text-xs text-[#0b1c30] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#fd761a] transition-all resize-none shadow-xs"
                />
              </div>
            )}
          </div>

          {/* ─── TOOLBAR DE ESTUDIANTES: BUSCADOR Y ACCIONES RÁPIDAS ─── */}
          <div className="px-4 py-2.5 bg-[#f8faff] border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
              <input
                type="text"
                value={estudianteSearch}
                onChange={(e) => setEstudianteSearch(e.target.value)}
                placeholder="Buscar por apellido, nombre o cédula..."
                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg text-xs text-[#0b1c30] border border-[#e5eeff] placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#fd761a] transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] text-[#76777d] font-medium hidden md:inline">
                Acción rápida:
              </span>
              <button
                type="button"
                onClick={() => handleMarcarTodos("presente")}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#009668] text-xs font-bold flex items-center gap-1 border border-[#e5eeff] shadow-xs transition-all active:scale-95"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Todos presentes</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarcarTodos("ausente")}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 text-[#ba1a1a] text-xs font-bold flex items-center gap-1 border border-[#e5eeff] shadow-xs transition-all active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Todos ausentes</span>
              </button>
            </div>
          </div>

          {/* ─── LISTADO DE ESTUDIANTES ─── */}
          <div className="p-3 sm:p-4 space-y-2 max-h-[520px] overflow-y-auto">
            {loadingEstudiantes ? (
              <div className="p-10 text-center text-xs text-[#76777d]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#fd761a]" />
                Cargando nómina de estudiantes...
              </div>
            ) : estudiantesFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#76777d] border border-dashed rounded-lg border-[#e5eeff]">
                {estudianteSearch
                  ? "Sin estudiantes que coincidan con la búsqueda."
                  : "No hay estudiantes matriculados en este curso."}
              </div>
            ) : (
              estudiantesFiltrados.map((e) => {
                const nombreCompleto = getEstudianteName(e)
                const status = asistenciasLocal[e.id]?.estado ?? "presente"
                const isPresente = status === "presente"
                const isAusente = status === "ausente"
                const pctPrevio = e.porcentaje_asistencia ?? 0

                return (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl bg-white border border-[#e5eeff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all hover:border-[#d3e4fe] hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#0b1c30] break-words">
                          {nombreCompleto}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#45464d] text-[10px] font-semibold border border-[#e5eeff] shrink-0">
                          {pctPrevio}% Asistencia previa
                        </span>
                      </div>
                    </div>

                    {/* Botones segmentados Presente / Ausente */}
                    <div
                      className="inline-flex rounded-lg bg-[#eff4ff] p-0.5 gap-1 shrink-0 self-start sm:self-auto border border-[#e5eeff]"
                      role="radiogroup"
                      aria-label={`Estado para ${nombreCompleto}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(e.id, "presente")}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                          isPresente
                            ? "bg-white text-[#005236] shadow-xs ring-1 ring-[#009668]/30"
                            : "text-[#45464d] hover:text-[#0b1c30]"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            isPresente ? "text-[#009668]" : "text-[#76777d]"
                          }`}
                        />
                        <span>Presente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleEstado(e.id, "ausente")}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                          isAusente
                            ? "bg-[#ffdad6] text-[#93000a] shadow-xs ring-1 ring-[#ba1a1a]/30"
                            : "text-[#45464d] hover:text-[#0b1c30]"
                        }`}
                      >
                        <XCircle
                          className={`w-3.5 h-3.5 ${
                            isAusente ? "text-[#ba1a1a]" : "text-[#76777d]"
                          }`}
                        />
                        <span>Ausente</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* ─── FOOTER DE ACCIONES ─── */}
          <div className="p-3.5 sm:p-4 bg-[#f8faff] border-t border-[#e5eeff] space-y-1.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleDescartarCambios}
                disabled={saving}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-white hover:bg-[#eff4ff] text-[#0b1c30] text-xs font-semibold transition-all border border-[#e5eeff] shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#76777d]" />
                <span>Descartar cambios</span>
              </button>

              <button
                type="button"
                onClick={() => handleGuardar(false)}
                disabled={saving || (selectedClase.asistencia_registrada && !hayCambiosPendientes)}
                title={
                  selectedClase.asistencia_registrada && !hayCambiosPendientes
                    ? "No hay cambios pendientes por guardar"
                    : undefined
                }
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#0b1c30] text-white hover:bg-[#131b2e] text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : selectedClase.asistencia_registrada && !hayCambiosPendientes ? (
                  <Check className="w-3.5 h-3.5" />
                ) : null}
                <span>
                  {selectedClase.asistencia_registrada
                    ? hayCambiosPendientes
                      ? "Guardar cambios"
                      : "Sin cambios"
                    : "Solo guardar"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGuardar(true)}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#fd761a] hover:bg-[#9d4300] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {siguienteClasePendiente
                        ? "Guardar y continuar"
                        : selectedClase.asistencia_registrada
                        ? "Actualizar asistencia"
                        : "Guardar"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {siguienteClasePendiente && (
              <p className="text-[10px] leading-tight text-[#76777d] text-center sm:text-right">
                Abre clase del {getFechaLarga(siguienteClasePendiente.clase.fecha_clase)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── DRAWER CRONOGRAMA LATERAL DESPLEGABLE ─── */}
      {createPortal(
        <AnimatePresence>
          {isCronogramaOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsCronogramaOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              />

              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="relative z-10 w-full max-w-md md:max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-[#e5eeff] overflow-hidden"
              >
                {/* Header del cronograma */}
                <div className="p-4 bg-gradient-to-b from-[#eff4ff]/80 to-[#eff4ff]/30 border-b border-[#e5eeff] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-[#e5eeff] flex items-center justify-center text-[#fd761a] shadow-xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0b1c30] leading-tight">
                          Cronograma del Curso
                        </h4>
                        <p className="text-[10px] text-[#76777d]">
                          {totalClasesGeneral} clases programadas · {progresoGeneralPct}% completado
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {proximaClasePendiente && (
                        <button
                          type="button"
                          onClick={() => {
                            handleRegistrarProximaClase()
                            setIsCronogramaOpen(false)
                          }}
                          className="px-2 py-0.5 rounded-full bg-[#ffdbca] text-[#341100] text-[10px] font-bold flex items-center gap-1 hover:bg-[#ffb690] transition-all"
                        >
                          <Zap className="w-3 h-3 text-[#fd761a]" />
                          <span>Ir a próxima</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsCronogramaOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-200/60 text-[#76777d] hover:text-[#0b1c30] transition-colors"
                        aria-label="Cerrar cronograma"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filtro pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setClaseFiltro("todas")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                        claseFiltro === "todas"
                          ? "bg-[#0b1c30] text-white shadow-xs"
                          : "bg-white text-[#45464d] hover:bg-[#e5eeff]"
                      }`}
                    >
                      Todas ({totalClasesGeneral})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaseFiltro("pendientes")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                        claseFiltro === "pendientes"
                          ? "bg-[#0b1c30] text-white shadow-xs"
                          : "bg-white text-[#45464d] hover:bg-[#e5eeff]"
                      }`}
                    >
                      Pendientes ({totalClasesPendientes})
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaseFiltro("registradas")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                        claseFiltro === "registradas"
                          ? "bg-[#0b1c30] text-white shadow-xs"
                          : "bg-white text-[#45464d] hover:bg-[#e5eeff]"
                      }`}
                    >
                      Registradas ({totalClasesRegistradas})
                    </button>
                  </div>
                </div>

                {/* Listado de módulos y clases */}
                <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                  {modulosFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#76777d] border border-dashed rounded-lg border-[#e5eeff]">
                      No se encontraron clases con los filtros aplicados.
                    </div>
                  ) : (
                    modulosFiltrados.map(({ modulo, clases, registradas, total }) => {
                      const isExpanded = !!expandedModulos[modulo.id]
                      const pct = total > 0 ? Math.round((registradas / total) * 100) : 0
                      const isSelectedModulo = selectedModulo?.id === modulo.id

                      return (
                        <div key={modulo.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModulos((prev) => ({
                                ...prev,
                                [modulo.id]: !prev[modulo.id],
                              }))
                            }
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-left border ${
                              isSelectedModulo
                                ? "bg-[#ffdbca]/40 border-[#fd761a]/40 shadow-xs"
                                : "bg-[#eff4ff]/60 hover:bg-[#eff4ff] border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isExpanded ? (
                                <FolderOpen
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelectedModulo ? "text-[#fd761a]" : "text-[#76777d]"
                                  }`}
                                />
                              ) : (
                                <Folder
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelectedModulo ? "text-[#fd761a]" : "text-[#76777d]"
                                  }`}
                                />
                              )}
                              <span
                                className={`text-[11px] uppercase tracking-wider truncate ${
                                  isSelectedModulo
                                    ? "text-[#fd761a] font-black"
                                    : "text-[#0b1c30] font-bold"
                                }`}
                              >
                                MÓDULO {modulo.numero_orden ?? "—"}: {modulo.nombre_modulo}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                  isSelectedModulo
                                    ? "bg-[#ffdbca] text-[#341100]"
                                    : "bg-[#dce9ff] text-[#45464d]"
                                }`}
                              >
                                {registradas}/{total} ({pct}%)
                              </span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isSelectedModulo ? "text-[#fd761a]" : "text-[#76777d]"
                                } ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden space-y-1 pl-1"
                              >
                                {clases.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-[#76777d]">
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
                                        onClick={() => {
                                          cargarAsistenciaDeClase(clase, modulo)
                                          setIsCronogramaOpen(false)
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            cargarAsistenciaDeClase(clase, modulo)
                                            setIsCronogramaOpen(false)
                                          }
                                        }}
                                        className={`relative p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-2.5 text-left ${
                                          isSelected
                                            ? "bg-white shadow-xs ring-2 ring-[#fd761a]"
                                            : "bg-white hover:bg-[#eff4ff]/60 border border-[#e5eeff] shadow-xs"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div
                                            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-center shrink-0 ${
                                              isSelected
                                                ? "bg-[#ffdbca] text-[#341100]"
                                                : isRegistered
                                                ? "bg-[#eff4ff] text-[#0b1c30]"
                                                : "bg-[#eff4ff] text-[#45464d]"
                                            }`}
                                          >
                                            <span className="text-[8px] uppercase font-extrabold leading-none">
                                              {getMesAbrev(clase.fecha_clase)}
                                            </span>
                                            <span className="text-sm font-black leading-tight">
                                              {getDiaNumero(clase.fecha_clase)}
                                            </span>
                                          </div>

                                          <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-xs font-bold text-[#0b1c30] truncate">
                                                {getFechaLarga(clase.fecha_clase)}
                                              </span>
                                              {isRegistered ? (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-[#d3e4fe] text-[#005236] text-[9px] font-bold">
                                                  <Check className="w-2.5 h-2.5" />
                                                  REGISTRADA
                                                </span>
                                              ) : isNext ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#ffdbca] text-[#341100] text-[9px] font-bold">
                                                  <span className="w-1 h-1 rounded-full bg-[#fd761a] animate-ping" />
                                                  Próxima
                                                </span>
                                              ) : null}
                                            </div>

                                            <span className="text-[10px] text-[#76777d] truncate">
                                              {clase.hora_inicio} – {clase.hora_fin}
                                              {isRegistered && (
                                                <>
                                                  {" "}· {clase.asistencias_presentes ?? presentesCount}/
                                                  {clase.asistencias_total ?? estudiantes.length} Asistencias
                                                </>
                                              )}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="shrink-0">
                                          {isSelected ? (
                                            <ChevronRight className="w-4 h-4 text-[#fd761a]" />
                                          ) : isRegistered ? (
                                            <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#0b1c30] text-[10px] font-medium">
                                              Ver
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#0b1c30] text-[10px] font-medium">
                                              Tomar
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

                <div className="p-3 bg-slate-50 border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#76777d]">
                  <span>Selecciona una clase para cargar su nómina</span>
                  <button
                    type="button"
                    onClick={() => setIsCronogramaOpen(false)}
                    className="px-2.5 py-1 rounded-md bg-white border border-[#e5eeff] hover:bg-[#eff4ff] text-[#0b1c30] font-semibold text-xs transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ─── MODAL DE EDICIÓN DE FECHA Y HORA (SOLO ADMIN) ─── */}
      {editClase &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditClase(null)}
          >
            <div
              className="bg-white rounded-xl p-5 w-full max-w-sm shadow-2xl border border-[#e5eeff]"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-bold text-[#0b1c30] mb-0.5">
                Cambiar día y horario
              </h4>
              <p className="text-xs text-[#76777d] mb-3">
                {getFechaCompletaConAnio(editClase.fecha_clase)}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#76777d]">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-[#e5eeff] rounded-lg outline-none focus:ring-1 focus:ring-[#fd761a] text-[#0b1c30]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#76777d]">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={editHoraInicio}
                      onChange={(e) => setEditHoraInicio(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-[#e5eeff] rounded-lg outline-none focus:ring-1 focus:ring-[#fd761a] text-[#0b1c30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-[#76777d]">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={editHoraFin}
                      onChange={(e) => setEditHoraFin(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-[#e5eeff] rounded-lg outline-none focus:ring-1 focus:ring-[#fd761a] text-[#0b1c30]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setEditClase(null)}
                  disabled={editClaseSaving}
                  className="flex-1 py-2 rounded-lg text-xs font-bold border border-[#e5eeff] hover:bg-[#eff4ff] text-[#45464d] transition-all disabled:opacity-50"
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
                  className="flex-[2] py-2 rounded-lg text-xs font-bold text-white bg-[#fd761a] hover:bg-[#9d4300] transition-all disabled:opacity-50 shadow-xs"
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
