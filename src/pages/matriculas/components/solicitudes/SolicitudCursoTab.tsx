/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpenIcon, UserIcon, Location01Icon, Calendar03Icon, CalendarIcon, PaymentIcon, Edit01Icon } from "@hugeicons/core-free-icons"
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
}

export function SolicitudCursoTab(props: SolicitudCursoTabProps) {
  const { selected, getCursoNombre, searchCursoQuery, setSearchCursoQuery,
    editCursoField, editCursoVal, setEditCursoField, setEditCursoVal,
    saveCursoEdit, savingCursoEdit, loadCursosAbiertos,
    filteredCursosAbiertos, cursoCatalogo, cursoModalidad, cursoDocente,
    cursoCiudad, cursoHorario, cursoInicio, cursoFin, cursoPrecio } = props

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
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {filteredCursosAbiertos.length === 0 ? (
                  <div className="p-3 text-sm text-center text-gray-500">No se encontraron cursos</div>
                ) : (
                  filteredCursosAbiertos.map((c: any) => {
                    const isSelected = editCursoVal === c.id
                    return (
                      <button key={c.id} type="button" onClick={() => setEditCursoVal(c.id)}
                        className={cn("w-full text-left p-2.5 text-sm flex flex-col gap-0.5 hover:bg-gray-50 transition-colors", isSelected && "bg-blue-50/50 hover:bg-blue-50 font-semibold")}
                        style={isSelected ? { borderLeft: `3px solid ${COLORS.ACCENT}` } : {}}>
                        <div className="flex justify-between items-center gap-2">
                          <span style={{ color: COLORS.CHARCOAL }}>{c.nombre || c.id}</span>
                          {isSelected && <span className="text-xs text-blue-600 font-bold shrink-0">Seleccionado</span>}
                        </div>
                        <div className="flex gap-2 text-xs opacity-60">
                          {c.semestre && <span>Sem.: {c.semestre}</span>}
                          {c.fecha_inicio && <span>Inicio: {c.fecha_inicio.split("T")[0]}</span>}
                          {c.precio_base && <span>${c.precio_base}</span>}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={saveCursoEdit} disabled={savingCursoEdit} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.ACCENT, color: "white", opacity: savingCursoEdit ? 0.6 : 1 }}>
                  {savingCursoEdit ? "Guardando..." : "Confirmar curso"}
                </button>
                <button onClick={() => { setEditCursoField(null); setEditCursoVal("") }} disabled={savingCursoEdit} className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 border" style={{ color: COLORS.TEXT_MUTED, borderColor: COLORS.BORDER_SUBTLE }}>
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
                <button onClick={() => { setEditCursoField("curso"); setEditCursoVal(selected.curso?.id || ""); setSearchCursoQuery(""); loadCursosAbiertos() }}
                  className="ml-auto shrink-0" style={{ color: COLORS.ACCENT }}>
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                </button>
              </div>
              <InfoItem icon={BookOpenIcon} label="Catálogo" value={cursoCatalogo} />
              <InfoItem icon={BookOpenIcon} label="Modalidad" value={cursoModalidad} />
              <InfoItem icon={UserIcon} label="Docente" value={cursoDocente} />
              <InfoItem icon={Location01Icon} label="Ciudad" value={cursoCiudad} />
              <InfoItem icon={Calendar03Icon} label="Horario" value={cursoHorario} />
              <InfoItem icon={CalendarIcon} label="Inicio" value={cursoInicio} />
              <InfoItem icon={CalendarIcon} label="Fin estimada" value={cursoFin} />
              <InfoItem icon={PaymentIcon} label="Precio" value={`$${cursoPrecio || 0}`} bold />
            </>
          )}
        </div>
      </div>
    </Section>
  )
}
