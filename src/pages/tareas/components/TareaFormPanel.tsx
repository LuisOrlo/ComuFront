import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Cancel01Icon,
  TaskEdit01Icon,
} from "@hugeicons/core-free-icons"
import { tareasService, type TareaStaff, type StaffPersona } from "@/services/tareas.service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface TareaFormPanelProps {
  isOpen: boolean
  tarea?: TareaStaff | null
  staff: StaffPersona[]
  onClose: () => void
  onSave: () => void
}

interface FormErrors {
  titulo?: string
  persona_id?: string
  fecha_inicio?: string
  fecha_fin?: string
}

export function TareaFormPanel({ isOpen, tarea, staff, onClose, onSave }: TareaFormPanelProps) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [personaId, setPersonaId] = useState("")
  const [personaSearch, setPersonaSearch] = useState("")
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const personaInputRef = useRef<HTMLDivElement>(null)

  const editando = !!tarea

  const resetForm = () => {
    setTitulo("")
    setDescripcion("")
    setPersonaId("")
    setPersonaSearch("")
    setFechaInicio("")
    setFechaFin("")
    setErrors({})
  }

  useEffect(() => {
    if (tarea) {
      setTitulo(tarea.titulo)
      setDescripcion(tarea.descripcion || "")
      setPersonaId(tarea.persona_id)
      const p = staff.find((s) => s.id === tarea.persona_id)
      setPersonaSearch(p ? p.nombre_completo : "")
      setFechaInicio(tarea.fecha_inicio?.split("T")[0] || "")
      setFechaFin(tarea.fecha_fin?.split("T")[0] || "")
    } else {
      resetForm()
    }
  }, [tarea, isOpen, staff])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (personaInputRef.current && !personaInputRef.current.contains(e.target as Node)) {
        setShowPersonaDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!titulo.trim()) errs.titulo = "El título es obligatorio"
    if (!personaId) errs.persona_id = "Selecciona un miembro del staff o instructor"
    if (!fechaInicio) errs.fecha_inicio = "La fecha de inicio es obligatoria"
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
      errs.fecha_fin = "La fecha de fin debe ser posterior a la de inicio"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const data: Record<string, unknown> = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        persona_id: personaId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || undefined,
      }
      if (editando) {
        await tareasService.updateTarea(tarea!.id, data)
        toast.success("Tarea actualizada correctamente")
      } else {
        data.estado = "pendiente"
        await tareasService.createTarea(data)
        toast.success("Tarea creada correctamente")
      }
      onSave()
      onClose()
    } catch {
      toast.error("Error al guardar la tarea")
    } finally {
      setSaving(false)
    }
  }

  const filteredStaff = staff
    .filter((p) => p.tipo === "staff" || p.tipo === "instructor" || (!["admin", "secretaria"].includes(p.tipo?.toLowerCase()) && p.tipo))
    .filter((p) =>
      p.nombre_completo.toLowerCase().includes(personaSearch.toLowerCase())
    )

  function selectPersona(p: StaffPersona) {
    setPersonaId(p.id)
    setPersonaSearch(p.nombre_completo)
    setShowPersonaDropdown(false)
    if (errors.persona_id) setErrors((prev) => ({ ...prev, persona_id: undefined }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0">
              <HugeiconsIcon icon={TaskEdit01Icon} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editando ? "Editar tarea" : "Nueva tarea"}
              </h2>
              <p className="text-xs text-slate-500">
                {editando ? "Modifica los detalles de la tarea asignada" : "Asigna una nueva tarea a un miembro del staff"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Título de la tarea <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value)
                if (errors.titulo) setErrors((prev) => ({ ...prev, titulo: undefined }))
              }}
              placeholder="Ej: Revisar expedientes de matrícula del periodo actual"
              className={cn(
                "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all",
                errors.titulo
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200/90 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
              )}
            />
            {errors.titulo && (
              <p className="text-xs text-rose-600 font-medium">{errors.titulo}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Descripción o Instrucciones
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalla los pasos o notas relevantes para realizar la tarea..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all resize-none"
            />
          </div>

          {/* Persona Asignada */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Persona asignada <span className="text-rose-500">*</span>
            </label>
            <div ref={personaInputRef} className="relative">
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={personaSearch}
                  onChange={(e) => {
                    setPersonaSearch(e.target.value)
                    setShowPersonaDropdown(true)
                    if (!e.target.value) setPersonaId("")
                  }}
                  onFocus={() => setShowPersonaDropdown(true)}
                  placeholder="Buscar staff o instructor por nombre..."
                  className={cn(
                    "w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all",
                    errors.persona_id
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200/90 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                  )}
                />
                {personaSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPersonaSearch("")
                      setPersonaId("")
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                )}
              </div>

              {showPersonaDropdown && filteredStaff.length > 0 && (
                <div className="absolute z-10 top-full mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {filteredStaff.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPersona(p)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-orange-50/50 transition-colors",
                        p.id === personaId ? "bg-orange-50/80" : ""
                      )}
                    >
                      <div className="size-8 rounded-full bg-orange-100 text-[#fd761a] font-bold text-xs flex items-center justify-center shrink-0">
                        {p.iniciales}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{p.nombre_completo}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{p.tipo}</p>
                      </div>
                      {p.id === personaId && (
                        <span className="text-xs font-bold text-[#fd761a]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.persona_id && (
              <p className="text-xs text-rose-600 font-medium">{errors.persona_id}</p>
            )}
          </div>

          {/* Fechas en 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Fecha de inicio <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value)
                    if (errors.fecha_inicio) setErrors((prev) => ({ ...prev, fecha_inicio: undefined }))
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white transition-all",
                    errors.fecha_inicio
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200/90 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                  )}
                />
              </div>
              {errors.fecha_inicio && (
                <p className="text-xs text-rose-600 font-medium">{errors.fecha_inicio}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Fecha límite (opcional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value)
                    if (errors.fecha_fin) setErrors((prev) => ({ ...prev, fecha_fin: undefined }))
                  }}
                  className={cn(
                    "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white transition-all",
                    errors.fecha_fin
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200/90 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                  )}
                />
              </div>
              {errors.fecha_fin && (
                <p className="text-xs text-rose-600 font-medium">{errors.fecha_fin}</p>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200/80 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 h-11 px-4 rounded-xl text-sm font-semibold text-white bg-[#fd761a] hover:bg-[#e06513] shadow-sm disabled:opacity-60 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin size-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Guardando...</span>
              </>
            ) : editando ? (
              "Guardar cambios"
            ) : (
              "Crear tarea"
            )}
          </button>
        </div>
      </div>
    </>
  )
}
