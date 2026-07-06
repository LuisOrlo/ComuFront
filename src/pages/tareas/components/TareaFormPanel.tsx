import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, CancelCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tareasService, type TareaStaff, type StaffPersona } from "@/services/tareas.service"
import { toast } from "sonner"

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
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */
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
    if (!personaId) errs.persona_id = "Selecciona una persona"
    if (!fechaInicio) errs.fecha_inicio = "La fecha de inicio es obligatoria"
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) errs.fecha_fin = "La fecha de fin debe ser posterior al inicio"
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
        toast.success("Tarea actualizada")
      } else {
        data.estado = "pendiente"
        await tareasService.createTarea(data)
        toast.success("Tarea creada")
      }
      onSave()
      onClose()
    } catch {
      toast.error("Error al guardar la tarea")
    } finally {
      setSaving(false)
    }
  }

  const filteredStaff = staff.filter((p) =>
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
      <div className="fixed inset-0 z-40 bg-black/30 transition-opacity" onClick={onClose} />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
            {editando ? "Editar tarea" : "Nueva tarea"}
          </h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            <HugeiconsIcon icon={CancelCircleIcon} size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); if (errors.titulo) setErrors((prev) => ({ ...prev, titulo: undefined })) }}
              placeholder="Ej: Revisar expedientes de matrícula"
              className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white outline-none"
              style={{
                borderColor: errors.titulo ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}20` }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.titulo ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE; e.currentTarget.style.boxShadow = "none" }}
            />
            {errors.titulo && <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.18 15)" }}>{errors.titulo}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles de la tarea..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white outline-none resize-none"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}20` }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE; e.currentTarget.style.boxShadow = "none" }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>
              Persona asignada <span className="text-red-500">*</span>
            </label>
            <div ref={personaInputRef} className="relative">
              <div className="relative">
                <HugeiconsIcon
                  icon={SearchIcon}
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <input
                  type="text"
                  value={personaSearch}
                  onChange={(e) => { setPersonaSearch(e.target.value); setShowPersonaDropdown(true); if (!e.target.value) setPersonaId("") }}
                  onFocus={() => setShowPersonaDropdown(true)}
                  placeholder="Buscar staff..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-white outline-none"
                  style={{
                    borderColor: errors.persona_id ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE,
                  }}
                />
              </div>
              {showPersonaDropdown && filteredStaff.length > 0 && (
                <div
                  className="absolute z-10 top-full mt-1 w-full bg-white rounded-lg border shadow-lg max-h-48 overflow-y-auto"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  {filteredStaff.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPersona(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="flex items-center justify-center size-7 rounded-full shrink-0 text-[10px] font-semibold"
                        style={{ backgroundColor: COLORS.ACCENT, color: "white" }}
                      >
                        {p.iniciales}
                      </div>
                      <div className="text-left">
                        <p className="font-medium" style={{ color: COLORS.CHARCOAL }}>{p.nombre_completo}</p>
                        <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>{p.tipo}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.persona_id && <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.18 15)" }}>{errors.persona_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                Fecha inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); if (errors.fecha_inicio) setErrors((prev) => ({ ...prev, fecha_inicio: undefined })) }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white outline-none"
                style={{
                  borderColor: errors.fecha_inicio ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE,
                  colorScheme: "light",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}20` }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.fecha_inicio ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE; e.currentTarget.style.boxShadow = "none" }}
              />
              {errors.fecha_inicio && <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.18 15)" }}>{errors.fecha_inicio}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                Fecha fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => { setFechaFin(e.target.value); if (errors.fecha_fin) setErrors((prev) => ({ ...prev, fecha_fin: undefined })) }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white outline-none"
                style={{
                  borderColor: errors.fecha_fin ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE,
                  colorScheme: "light",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}20` }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.fecha_fin ? "oklch(0.55 0.18 15)" : COLORS.BORDER_SUBTLE; e.currentTarget.style.boxShadow = "none" }}
              />
              {errors.fecha_fin && <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.18 15)" }}>{errors.fecha_fin}</p>}
            </div>
          </div>
        </form>

        <div className="flex items-center gap-3 px-6 py-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-60"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear tarea"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
