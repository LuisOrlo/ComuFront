import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddCircleIcon,
  Cancel01Icon,
  AlertCircleIcon,
  UserIcon,
  Building04Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

interface NuevoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (cliente: ClienteExterno) => void
}

interface FormState {
  tipo_cliente: "persona" | "empresa"
  nombres: string
  apellidos: string
  nombre_empresa: string
  cedula: string
  correo: string
  celular: string
}

interface FormErrors {
  nombre_empresa?: string
  nombres?: string
  apellidos?: string
  cedula?: string
  celular?: string
  correo?: string
}

const PERSONA_FIELDS = [
  { key: "nombres" as const, label: "Nombres", required: true, placeholder: "Nombres del cliente", colSpan: 1 },
  { key: "apellidos" as const, label: "Apellidos", required: false, placeholder: "Apellidos del cliente", colSpan: 1 },
  { key: "cedula" as const, label: "Cédula", required: false, placeholder: "Número de cédula", colSpan: 1 },
  { key: "celular" as const, label: "Celular", required: false, placeholder: "Número de celular", colSpan: 1 },
  { key: "correo" as const, label: "Correo electrónico", required: false, placeholder: "cliente@ejemplo.com", colSpan: 2 },
]

const EMPRESA_FIELDS = [
  { key: "nombre_empresa" as const, label: "Nombre de la empresa", required: true, placeholder: "Razón social o nombre comercial", colSpan: 2 },
  { key: "nombres" as const, label: "Contacto principal", required: true, placeholder: "Nombres del contacto", colSpan: 1 },
  { key: "apellidos" as const, label: "Apellidos del contacto", required: false, placeholder: "Apellidos del contacto", colSpan: 1 },
  { key: "celular" as const, label: "Teléfono / Celular", required: false, placeholder: "Teléfono de contacto", colSpan: 1 },
  { key: "correo" as const, label: "Correo general", required: false, placeholder: "contacto@empresa.com", colSpan: 1 },
]

function validateField(key: string, value: string): string | null {
  switch (key) {
    case "nombre_empresa":
      if (!value.trim()) return "El nombre de empresa es obligatorio"
      return null
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
  const [form, setForm] = useState<FormState>({
    tipo_cliente: "persona",
    nombres: "",
    apellidos: "",
    nombre_empresa: "",
    cedula: "",
    correo: "",
    celular: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => {
        const err = validateField(key, value)
        const next = { ...prev }
        if (err) next[key as keyof FormErrors] = err
        else delete next[key as keyof FormErrors]
        return next
      })
    }
  }

  const handleCreate = async () => {
    const fieldsToValidate = form.tipo_cliente === "persona" ? PERSONA_FIELDS : EMPRESA_FIELDS
    const newErrors: FormErrors = {}

    for (const { key } of fieldsToValidate) {
      const err = validateField(key, form[key])
      if (err) newErrors[key as keyof FormErrors] = err
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      const nuevo = await clientesService.createCliente({
        ...form,
        nombres: form.tipo_cliente === "persona" ? form.nombres : undefined,
        nombre_empresa: form.tipo_cliente === "empresa" ? form.nombre_empresa : undefined,
        correo: form.correo.trim() || undefined,
        contactos:
          form.tipo_cliente === "empresa"
            ? [
                {
                  nombres: form.nombres,
                  apellidos: form.apellidos,
                  celular: form.celular,
                  correo: form.correo,
                  es_principal: true,
                  activo: true,
                },
              ]
            : undefined,
      })
      toast.success("Cliente externo registrado correctamente")
      onCreated(nuevo as ClienteExterno)
      setForm({
        tipo_cliente: "persona",
        nombres: "",
        apellidos: "",
        nombre_empresa: "",
        cedula: "",
        correo: "",
        celular: "",
      })
      setErrors({})
      onClose()
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Error al crear el cliente externo"
      )
    } finally {
      setSaving(false)
    }
  }

  const activeFields = form.tipo_cliente === "persona" ? PERSONA_FIELDS : EMPRESA_FIELDS

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-[#c6c6cd]/20">
        {/* Cabecera del modal */}
        <div className="px-6 py-4.5 border-b border-[#c6c6cd]/20 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#fd761a] flex items-center justify-center shrink-0">
              <HugeiconsIcon
                icon={form.tipo_cliente === "persona" ? UserIcon : Building04Icon}
                size={20}
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">Nuevo Cliente Externo</h2>
              <p className="text-[11px] text-[#76777d]">Registro rápido para servicios y alquileres</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-xl text-[#76777d] hover:text-[#0b1c30] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <div className="p-6 space-y-4">
          {/* Selector de Tipo de Cliente */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-100/70 border border-[#c6c6cd]/20">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, tipo_cliente: "persona" }))}
              className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                form.tipo_cliente === "persona"
                  ? "bg-white text-[#fd761a] shadow-xs"
                  : "text-[#76777d] hover:text-[#0b1c30]"
              }`}
            >
              <HugeiconsIcon icon={UserIcon} size={15} />
              <span>Persona Natural</span>
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, tipo_cliente: "empresa" }))}
              className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                form.tipo_cliente === "empresa"
                  ? "bg-white text-[#fd761a] shadow-xs"
                  : "text-[#76777d] hover:text-[#0b1c30]"
              }`}
            >
              <HugeiconsIcon icon={Building04Icon} size={15} />
              <span>Empresa / Jurídica</span>
            </button>
          </div>

          {/* Campos del formulario en rejilla balanceada */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            {activeFields.map(({ key, label, required, placeholder, colSpan }) => {
              const err = errors[key as keyof FormErrors]
              const extraProps = fieldInputProps(key)

              return (
                <div key={key} className={colSpan === 2 ? "col-span-2" : "col-span-1"}>
                  <label className="text-xs font-semibold text-[#45464d] block mb-1">
                    {label}
                    {required && <span className="text-[#ba1a1a] ml-0.5">*</span>}
                  </label>
                  <input
                    {...extraProps}
                    value={form[key]}
                    onChange={(e) => {
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
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm font-medium text-[#0b1c30] placeholder:text-[#76777d]/60 outline-none transition-all shadow-2xs ${
                      err
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-[#c6c6cd]/40 focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]"
                    }`}
                  />
                  {err && (
                    <p className="flex items-center gap-1 text-[11px] mt-1 text-red-500 font-medium">
                      <HugeiconsIcon icon={AlertCircleIcon} size={11} />
                      <span>{err}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Acciones del pie */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#c6c6cd]/20 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[#c6c6cd]/30 bg-white text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} className="inline-block mr-1.5" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06512] shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={AddCircleIcon} size={16} />
                <span>Registrar Cliente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
