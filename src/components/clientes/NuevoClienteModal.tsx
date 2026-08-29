import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddCircleIcon, Cancel01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

interface NuevoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (cliente: ClienteExterno) => void
}

interface FormState {
  nombres: string
  apellidos: string
  cedula: string
  correo: string
  celular: string
}

interface FormErrors {
  nombres?: string
  apellidos?: string
  cedula?: string
  celular?: string
  correo?: string
}

const FORM_FIELDS = [
  { key: "nombres" as const, label: "Nombres", required: true, placeholder: "Nombres del cliente", colSpan: 2 },
  { key: "apellidos" as const, label: "Apellidos", required: false, placeholder: "Apellidos del cliente", colSpan: 2 },
  { key: "cedula" as const, label: "Cédula", required: false, placeholder: "Número de cédula", colSpan: 1 },
  { key: "celular" as const, label: "Celular", required: false, placeholder: "Número de celular", colSpan: 1 },
  { key: "correo" as const, label: "Correo", required: false, placeholder: "Correo electrónico", colSpan: 2 },
]

function validateField(key: string, value: string): string | null {
  switch (key) {
    case "nombres":
      if (!value.trim()) return "El nombre es obligatorio"
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras"
      return null
    case "apellidos":
      if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras"
      return null
    case "cedula":
      if (value && !/^\d+$/.test(value)) return "Solo se permiten números"
      if (value && value.length > 10) return "Máximo 10 dígitos"
      return null
    case "celular":
      if (value && !/^\d+$/.test(value)) return "Solo se permiten números"
      if (value && value.length > 10) return "Máximo 10 dígitos"
      return null
    case "correo":
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo inválido"
      return null
    default:
      return null
  }
}

function fieldInputProps(key: string) {
  switch (key) {
    case "cedula":
    case "celular":
      return { inputMode: "numeric" as const, maxLength: 10, type: "text" as const }
    case "correo":
      return { type: "email" as const }
    case "nombres":
    case "apellidos":
      return { type: "text" as const, maxLength: 80 }
    default:
      return { type: "text" as const }
  }
}

export function NuevoClienteModal({ isOpen, onClose, onCreated }: NuevoClienteModalProps) {
  const [form, setForm] = useState<FormState>({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const updateField = (key: string, value: string) => {
    setForm({ ...form, [key]: value })
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => {
        const err = validateField(key, value)
        const next = { ...prev }
        if (err) next[key as keyof FormErrors] = err
        else delete next[key as keyof FormErrors]
        return next
      })
    }
  }

  const handleCreate = async () => {
    const newErrors: FormErrors = {}
    for (const { key } of FORM_FIELDS) {
      const err = validateField(key, form[key])
      if (err) newErrors[key as keyof FormErrors] = err
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      const nuevo = await clientesService.createCliente({ ...form, correo: form.correo.trim() || undefined })
      toast.success("Cliente externo registrado")
      onCreated(nuevo as ClienteExterno)
      setForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "" })
      setErrors({})
      onClose()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al crear cliente")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Nuevo Cliente Externo</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {FORM_FIELDS.map(({ key, label, required, placeholder, colSpan }) => {
              const err = errors[key as keyof FormErrors]
              const extraProps = fieldInputProps(key)
              return (
                <div key={key} className={colSpan === 2 ? "col-span-2" : ""}>
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">
                    {label}{required ? " *" : ""}
                  </label>
                  <input
                    {...extraProps}
                    value={form[key]}
                    onChange={e => {
                      const val = e.target.value
                      if (key === "nombres" || key === "apellidos") {
                        const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
                        updateField(key, clean)
                      } else {
                        updateField(key, val)
                      }
                    }}
                    onBlur={() => updateField(key, form[key])}
                    placeholder={placeholder}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-xl border bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                    style={{ borderColor: err ? "oklch(0.60 0.15 10)" : COLORS.BORDER_SUBTLE }}
                  />
                  {err && (
                    <p className="flex items-center gap-1 text-[10px] mt-1 text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={10} />
                      {err}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
            disabled={saving}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline-block mr-1" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            {saving ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <HugeiconsIcon icon={AddCircleIcon} size={16} />
            )}
            {saving ? "Guardando..." : "Registrar Cliente"}
          </button>
        </div>
      </div>
    </div>
  )
}
