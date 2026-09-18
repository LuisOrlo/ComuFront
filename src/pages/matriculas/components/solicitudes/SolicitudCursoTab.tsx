/* eslint-disable @typescript-eslint/no-explicit-any */
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
  editCursoField: string | null
  editCursoVal: string
  setEditCursoField: (val: string | null) => void
  setEditCursoVal: (val: string) => void
  saveCursoEdit: () => void
  savingCursoEdit: boolean
  loadCursosAbiertos: () => void
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
  } = props

  const openEdit = () => {
    setEditCursoField("curso")
    setEditCursoVal(selected.curso?.id || "")
    setSearchCursoQuery("")
    loadCursosAbiertos()
  }

  const formatPrecio = (c: any) => {
    const raw = c.precioBase
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
              <span>Buscar y seleccionar nuevo curso abierto</span>
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
              placeholder="Buscar por nombre de curso, catálogo..."
              value={searchCursoQuery}
              onChange={(e) => setSearchCursoQuery(e.target.value)}
              disabled={savingCursoEdit}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a] transition-all"
            />
          </div>

          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
            {filteredCursosAbiertos.length === 0 ? (
              <div className="p-4 text-xs text-center text-slate-400">
                No se encontraron cursos abiertos que coincidan con la búsqueda.
              </div>
            ) : (
              filteredCursosAbiertos.map((c: any) => {
                const isSelected = editCursoVal === c.id
                const sinCupo =
                  (c.estudiantes || 0) >= (c.capacidad || 0) &&
                  (c.capacidad || 0) > 0 &&
                  c.id !== selected.curso?.id

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (!sinCupo) setEditCursoVal(c.id)
                    }}
                    disabled={sinCupo}
                    className={cn(
                      "w-full text-left p-3.5 flex flex-col gap-1.5 transition-all cursor-pointer",
                      sinCupo
                        ? "opacity-40 cursor-not-allowed bg-slate-50/50"
                        : isSelected
                          ? "bg-orange-50/80 border-l-4 border-l-[#fd761a]"
                          : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {highlightText(c.nombre || c.id, searchCursoQuery)}
                      </span>
                      <span className="text-sm font-black font-mono text-[#fd761a] shrink-0">
                        {formatPrecio(c)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {c.modalidad && (
                        <ModalidadBadge modalidad={c.modalidad} />
                      )}
                      {c.ciudad?.nombre && (
                        <CiudadBadge ciudad={c.ciudad.nombre} />
                      )}
                      <span className="text-[11px] font-medium text-slate-500">
                        {cupoText(c)}
                      </span>
                      {c.totalModulos > 0 && (
                        <span className="text-[11px] font-medium text-slate-500">
                          • {modulosText(c)}
                        </span>
                      )}
                      {sinCupo && (
                        <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 ml-auto">
                          Sin cupo
                        </span>
                      )}
                      {isSelected && !sinCupo && (
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

          {yaProcesada && totalAbonado > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-300/80 bg-amber-50">
              <HugeiconsIcon icon={Alert02Icon} size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 font-medium">
                Esta matrícula ya tiene pagos registrados (<strong>${totalAbonado.toLocaleString()}</strong>). Al confirmar se abrirá un asistente para redistribuir los montos entre los módulos del nuevo curso.
              </p>
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
