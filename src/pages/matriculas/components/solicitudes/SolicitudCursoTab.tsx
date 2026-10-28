/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpenIcon,
  UserIcon,
  Calendar03Icon,
  CalendarIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Search01Icon,
  Exchange01Icon,
  GraduationCapIcon,
} from "@hugeicons/core-free-icons"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type CursoAbierto } from "@/services/cursos.service"
import { CiudadBadge, ModalidadBadge } from "../../../estudiantes/components/Badges"

interface SolicitudCursoTabProps {
  selected: any
  getCursoNombre: () => string
  cursosAbiertosList: CursoAbierto[]
  filteredCursosAbiertos: any[]
  searchCursoQuery: string
  setSearchCursoQuery: (val: string) => void
  searchingCursos?: boolean
  editCursoField: string | null
  editCursoVal: string
  setEditCursoField: (val: string | null) => void
  setEditCursoVal: (val: string) => void
  saveCursoEdit: () => void
  savingCursoEdit: boolean
  loadCursosAbiertos: (q?: string) => void
  cursoCatalogo: string
  cursoModalidad: string
  cursoDocente: string
  cursoCiudad: string
  cursoHorario: string
  cursoInicio: string
  cursoFin: string
  cursoPrecio: number
  yaProcesada: boolean
  totalAbonado: number
  desgloseMetodos?: any[]
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#fd761a] font-extrabold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

function cupoText(c: any): string {
  const cap = c.capacidad || 0
  const mat = c.estudiantes || 0
  return `${mat}/${cap} cupos`
}

function modulosText(c: any): string {
  const count = c.totalModulos || 0
  return `${count} módulo${count !== 1 ? "s" : ""}`
}

function formatFechaInicio(f?: string | null): string | null {
  if (!f) return null
  const dateStr = String(f).slice(0, 10)
  const parts = dateStr.split("-").map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
}

export function SolicitudCursoTab(props: SolicitudCursoTabProps) {
  const {
    selected,
    getCursoNombre,
    searchCursoQuery,
    setSearchCursoQuery,
    editCursoField,
    editCursoVal,
    setEditCursoField,
    setEditCursoVal,
    saveCursoEdit,
    savingCursoEdit,
    loadCursosAbiertos,
    cursosAbiertosList,
    filteredCursosAbiertos,
    cursoCatalogo,
    cursoModalidad,
    cursoDocente,
    cursoCiudad,
    cursoHorario,
    cursoInicio,
    cursoFin,
    cursoPrecio,
    yaProcesada,
    totalAbonado,
    searchingCursos,
    desgloseMetodos,
  } = props

  const openEdit = () => {
    setEditCursoField("curso")
    setEditCursoVal(selected.curso?.id || "")
    setSearchCursoQuery("")
    loadCursosAbiertos("")
  }

  const selectedCourseObj = useMemo(() => {
    return (
      filteredCursosAbiertos.find((c: any) => c.id === editCursoVal) ||
      cursosAbiertosList.find((c: any) => c.id === editCursoVal) ||
      null
    )
  }, [filteredCursosAbiertos, cursosAbiertosList, editCursoVal])

  const precioNuevo = Number(selectedCourseObj?.precioBase ?? selectedCourseObj?.precio_base ?? 0)
  const precioDiff = selectedCourseObj ? precioNuevo - cursoPrecio : 0

  const formatPrecio = (c: any) => {
    const raw = c.precioBase ?? c.precio_base
    if (raw === null || raw === undefined || raw === "" || raw === 0) return "$0"
    return `$${Number(raw).toLocaleString()}`
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Información del curso
          </h2>
          
        </div>
        {editCursoField !== "curso" && (
          <button
            onClick={openEdit}
            type="button"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Exchange01Icon} size={16} />
            <span>Cambiar curso</span>
          </button>
        )}
      </div>

      {editCursoField === "curso" ? (
        /* Edit Mode: Course Selector */
        <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <HugeiconsIcon icon={BookOpenIcon} size={18} className="text-[#fd761a]" />
              <span>Buscar y seleccionar cualquier curso</span>
            </div>
            <button
              onClick={() => {
                setEditCursoField(null)
                setEditCursoVal("")
              }}
              disabled={savingCursoEdit}
              type="button"
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar curso por nombre, catálogo o docente..."
              value={searchCursoQuery}
              onChange={(e) => setSearchCursoQuery(e.target.value)}
              disabled={savingCursoEdit}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a] transition-all"
            />
            {searchingCursos && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#fd761a] animate-spin size-4 pointer-events-none" />
            )}
          </div>

          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
            {filteredCursosAbiertos.length === 0 ? (
              <div className="p-4 text-xs text-center text-slate-400">
                {searchingCursos ? "Buscando cursos disponibles..." : "No se encontraron cursos que coincidan con la búsqueda."}
              </div>
            ) : (
              filteredCursosAbiertos.map((c: any) => {
                const isSelected = editCursoVal === c.id
                const sinCupo =
                  (c.estudiantes || 0) >= (c.capacidad || 0) &&
                  (c.capacidad || 0) > 0 &&
                  c.id !== selected.curso?.id

                const ciudadNombre = typeof c.ciudad === "string" ? c.ciudad : (c.ciudad?.nombre || c.ciudad_nombre || "")
                const fechaInicio = formatFechaInicio(c.fechaInicio || c.fecha_inicio)

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditCursoVal(c.id)}
                    className={cn(
                      "w-full text-left p-3.5 flex flex-col gap-1.5 transition-all cursor-pointer",
                      isSelected
                        ? "bg-orange-50/80 border-l-4 border-l-[#fd761a]"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {highlightText(c.nombre || c.nombre_instancia || c.catalogo?.nombre || c.id, searchCursoQuery)}
                      </span>
                      <span className="text-sm font-black font-mono text-[#fd761a] shrink-0">
                        {formatPrecio(c)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {c.modalidad && (
                        <ModalidadBadge modalidad={c.modalidad} />
                      )}
                      {ciudadNombre && ciudadNombre !== "No especificada" && ciudadNombre !== "—" && (
                        <CiudadBadge ciudad={ciudadNombre} />
                      )}
                      {fechaInicio && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                          <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-blue-500 shrink-0" />
                          <span>Inicia: {fechaInicio}</span>
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-500">
                        {cupoText(c)}
                      </span>
                      {c.totalModulos > 0 && (
                        <span className="text-[11px] font-medium text-slate-500">
                          • {modulosText(c)}
                        </span>
                      )}
                      {sinCupo ? (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Sobrecupo ({c.estudiantes || 0}/{c.capacidad || 0})
                        </span>
                      ) : null}
                      {isSelected && (
                        <div className="ml-auto flex items-center gap-1 text-xs font-bold text-[#fd761a]">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                          <span>Seleccionado</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Comparativa de precios del curso seleccionado */}
          {selectedCourseObj && (
            <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Exchange01Icon} size={14} className="text-[#fd761a]" />
                  <span>Comparativa de valores a pagar</span>
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-extrabold",
                    precioDiff > 0
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : precioDiff < 0
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-slate-50 text-slate-700 border border-slate-200"
                  )}
                >
                  {precioDiff > 0
                    ? `+$${precioDiff.toLocaleString()} (Aumenta valor)`
                    : precioDiff < 0
                    ? `-$${Math.abs(precioDiff).toLocaleString()} (Disminuye valor)`
                    : "Mismo valor total"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-slate-600">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Curso actual</span>
                  <strong className="text-slate-800 text-sm font-mono">${cursoPrecio.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Nuevo curso</span>
                  <strong className="text-[#ea580c] text-sm font-mono">${precioNuevo.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Total ya abonado</span>
                  <strong className="text-emerald-700 text-sm font-mono">${totalAbonado.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          {yaProcesada && totalAbonado > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-300/80 bg-amber-50">
              <HugeiconsIcon icon={Alert02Icon} size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 font-medium space-y-1">
                <p>
                  Esta matrícula ya tiene pagos registrados (<strong>${totalAbonado.toLocaleString()}</strong>). Al confirmar se abrirá el asistente para redistribuir los montos entre los módulos del nuevo curso preservando los comprobantes y pagos mixtos.
                </p>
                {desgloseMetodos && desgloseMetodos.length > 0 && (
                  <p className="text-[11px] text-amber-800">
                    Métodos registrados: {desgloseMetodos.map((dm: any) => `${dm.metodo}: $${Number(dm.monto).toFixed(2)}`).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={saveCursoEdit}
              disabled={savingCursoEdit || !editCursoVal}
              type="button"
              className="px-4 py-2 rounded-xl bg-[#fd761a] hover:bg-[#ea580c] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {savingCursoEdit ? "Guardando..." : "Confirmar cambio de curso"}
            </button>
            <button
              onClick={() => {
                setEditCursoField(null)
                setEditCursoVal("")
              }}
              disabled={savingCursoEdit}
              type="button"
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        /* Display Mode: Course Banner & Info Grid */
        <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-6">
          {/* Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-[#ea580c] uppercase tracking-wider">
                  {cursoCatalogo || "Catálogo General"}
                </span>
                <ModalidadBadge modalidad={cursoModalidad} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                {getCursoNombre()}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Programa formativo integral con certificación avalada Comunikate
              </p>
            </div>

            <div className="text-left md:text-right bg-white p-4 rounded-xl border border-slate-200 shadow-xs shrink-0 min-w-[170px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Precio Base Catálogo
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono leading-tight">
                ${Number(cursoPrecio || 0).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">USD • Matrícula incluida</span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <HugeiconsIcon icon={UserIcon} size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">Docente</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {cursoDocente ? cursoDocente.slice(0, 2).toUpperCase() : "—"}
                </div>
                <span className="font-bold text-slate-900 text-sm truncate">
                  {cursoDocente || "Por asignar"}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <HugeiconsIcon icon={GraduationCapIcon} size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">Modalidad</span>
              </div>
              <div className="mt-1">
                <ModalidadBadge modalidad={cursoModalidad} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Ciudad / Sede
              </span>
              <div className="mt-1">
                <CiudadBadge ciudad={cursoCiudad} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <HugeiconsIcon icon={Calendar03Icon} size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">Horario</span>
              </div>
              <span className="font-bold text-slate-900 text-sm block mt-1">
                {cursoHorario || "Por definir"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <HugeiconsIcon icon={CalendarIcon} size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">Fecha Inicio</span>
              </div>
              <span className="font-bold text-slate-900 text-sm block mt-1">
                {cursoInicio || "Por definir"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <HugeiconsIcon icon={CalendarIcon} size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">Fecha Fin Estimada</span>
              </div>
              <span className="font-bold text-slate-900 text-sm block mt-1">
                {cursoFin || "Por definir"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
