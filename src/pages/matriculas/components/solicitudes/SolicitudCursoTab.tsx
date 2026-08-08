/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpenIcon, UserIcon, Location01Icon, Calendar03Icon, CalendarIcon, PaymentIcon, Edit01Icon, CheckmarkCircle02Icon, UserWarning01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { type CursoAbierto } from "@/services/cursos.service"
import { Section, InfoItem } from "../../AprobacionHelpers"

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
      <span style={{ color: COLORS.ACCENT, fontWeight: 800 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

function cupoText(c: any): string {
  const cap = c.capacidad || 0
  const mat = c.estudiantes || 0
  return `${mat}/${cap} cupo`
}

function modulosText(c: any): string {
  const count = c.totalModulos || 0
  return `${count} módulo${count !== 1 ? "s" : ""}`
}

export function SolicitudCursoTab(props: SolicitudCursoTabProps) {
  const { selected, getCursoNombre, searchCursoQuery, setSearchCursoQuery,
    editCursoField, editCursoVal, setEditCursoField, setEditCursoVal,
    saveCursoEdit, savingCursoEdit, loadCursosAbiertos,
    filteredCursosAbiertos, cursoCatalogo, cursoModalidad, cursoDocente,
    cursoCiudad, cursoHorario, cursoInicio, cursoFin, cursoPrecio,
    yaProcesada, totalAbonado } = props

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
    <Section title="Curso" icon={BookOpenIcon}>
      <div className="p-4 rounded-xl space-y-2 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="grid grid-cols-2 gap-2">
          {editCursoField === "curso" ? (
            <div className="col-span-2 space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon icon={BookOpenIcon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                <span style={{ color: COLORS.TEXT_MUTED }}>Buscar y seleccionar curso:</span>
              </div>

              <input type="text" placeholder="Escribe el nombre del curso..."
                value={searchCursoQuery} onChange={e => setSearchCursoQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                style={{ borderColor: COLORS.BORDER_SUBTLE }} disabled={savingCursoEdit} />

              <div className="max-h-60 overflow-y-auto border rounded-lg divide-y bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {filteredCursosAbiertos.length === 0 ? (
                  <div className="p-3 text-sm text-center text-gray-500">No se encontraron cursos</div>
                ) : (
                  filteredCursosAbiertos.map((c: any) => {
                    const isSelected = editCursoVal === c.id
                    const sinCupo = (c.estudiantes || 0) >= (c.capacidad || 0)
                      && (c.capacidad || 0) > 0
                      && c.id !== selected.curso?.id

                    return (
                      <button key={c.id} type="button"
                        onClick={() => { if (!sinCupo) setEditCursoVal(c.id) }}
                        disabled={sinCupo}
                        className={cn("w-full text-left p-2.5 flex flex-col gap-1 transition-colors",
                          sinCupo ? "opacity-40 cursor-not-allowed"
                            : isSelected
                              ? "bg-amber-50/80"
                              : "hover:bg-gray-50")}
                        style={isSelected ? { borderLeft: `3px solid ${COLORS.ACCENT}` } : {}}>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-sm font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>
                            {highlightText(c.nombre || c.id, searchCursoQuery)}
                          </span>
                          <span className="text-sm font-black shrink-0" style={{ color: COLORS.ACCENT }}>
                            {formatPrecio(c)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.modalidad && (
                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                              c.modalidad === "presencial" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            )}>{c.modalidad}</span>
                          )}
                          <span className="text-[10px] font-medium opacity-50" style={{ color: COLORS.CHARCOAL }}>
                            {cupoText(c)}
                          </span>
                          {c.totalModulos > 0 && (
                            <span className="text-[10px] font-medium opacity-50" style={{ color: COLORS.CHARCOAL }}>
                              {modulosText(c)}
                            </span>
                          )}
                          {sinCupo && (
                            <span className="text-[9px] font-bold text-red-500 shrink-0 ml-auto">Sin cupo</span>
                          )}
                          {isSelected && !sinCupo && (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="ml-auto shrink-0"
                              style={{ color: COLORS.ACCENT }} />
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {yaProcesada && totalAbonado > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl border" style={{ borderColor: "oklch(0.65 0.15 75 / 0.3)", backgroundColor: "oklch(0.65 0.15 75 / 0.06)" }}>
                  <HugeiconsIcon icon={UserWarning01Icon} size={15} className="shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.15 75)" }} />
                  <p className="text-xs font-medium" style={{ color: "oklch(0.5 0.1 75)" }}>
                    Esta matrícula ya tiene pagos registrados (<strong>${totalAbonado.toLocaleString()}</strong>).
                    Al confirmar se abrirá un modal para redistribuir los montos entre los módulos del nuevo curso.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={saveCursoEdit} disabled={savingCursoEdit}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                  {savingCursoEdit ? "Guardando..." : "Confirmar curso"}
                </button>
                <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit}
                  className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 border" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm group col-span-2">
                <HugeiconsIcon icon={BookOpenIcon} size={14} className="shrink-0" style={{ color: COLORS.TEXT_MUTED }} />
                <span style={{ color: COLORS.TEXT_MUTED }} className="shrink-0 text-sm">Curso</span>
                <span className="truncate text-sm" style={{ color: COLORS.CHARCOAL, fontWeight: 700 }}>{getCursoNombre()}</span>
              </div>
              <InfoItem icon={BookOpenIcon} label="Catálogo" value={cursoCatalogo} />
              <InfoItem icon={BookOpenIcon} label="Modalidad" value={cursoModalidad} />
              <InfoItem icon={UserIcon} label="Docente" value={cursoDocente} />
              <InfoItem icon={Location01Icon} label="Ciudad" value={cursoCiudad} />
              <InfoItem icon={Calendar03Icon} label="Horario" value={cursoHorario} />
              <InfoItem icon={CalendarIcon} label="Inicio" value={cursoInicio} />
              <InfoItem icon={CalendarIcon} label="Fin estimada" value={cursoFin} />
              <InfoItem icon={PaymentIcon} label="Precio" value={`$${cursoPrecio || 0}`} bold />
              <button onClick={openEdit}
                className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                style={{ color: COLORS.ACCENT, borderColor: COLORS.BORDER_SUBTLE }}>
                <HugeiconsIcon icon={Edit01Icon} size={14} />
                Cambiar curso
              </button>
            </>
          )}
        </div>
      </div>
    </Section>
  )
}
