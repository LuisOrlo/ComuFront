import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Video, X, Loader2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { setsService, type SetItem } from "@/services/sets.service"
import { toast } from "sonner"

interface Props {
  isOpen: boolean
  onClose: () => void
  set?: SetItem | null
  onSuccess: () => void
}

export function SetFormModal({ isOpen, onClose, set, onSuccess }: Props) {
  const isEdit = Boolean(set)
  const [nombre, setNombre] = useState("")
  const [precioHora, setPrecioHora] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [activo, setActivo] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (set) {
      setNombre(set.nombre || "")
      setPrecioHora(set.precio_hora != null ? String(set.precio_hora) : "")
      setDescripcion(set.descripcion || "")
      setActivo(set.activo !== false)
    } else {
      setNombre("")
      setPrecioHora("")
      setDescripcion("")
      setActivo(true)
    }
    setErrors({})
  }, [set, isOpen])

  const handleNombreChange = (val: string) => {
    // Permitir letras, números, espacios y signos básicos
    const sanitized = val.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,()]/g, "")
    setNombre(sanitized)
    if (errors.nombre) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.nombre
        return next
      })
    }
  }

  const handlePrecioChange = (val: string) => {
    // Permitir solo números y hasta 2 decimales
    if (val === "" || /^\d*(\.\d{0,2})?$/.test(val)) {
      setPrecioHora(val)
      if (errors.precioHora) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.precioHora
          return next
        })
      }
    }
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!nombre.trim()) {
      nextErrors.nombre = "El nombre del set es obligatorio."
    } else if (nombre.trim().length < 3) {
      nextErrors.nombre = "El nombre debe tener al menos 3 caracteres."
    }

    const numPrecio = parseFloat(precioHora)
    if (precioHora === "" || isNaN(numPrecio) || numPrecio < 0) {
      nextErrors.precioHora = "Indica un precio por hora válido (mayor o igual a 0)."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        nombre: nombre.trim(),
        precio_hora: parseFloat(precioHora) || 0,
        descripcion: descripcion.trim() || null,
        activo,
      }

      if (isEdit && set) {
        await setsService.updateSet(set.id, payload)
        toast.success("Set actualizado exitosamente")
      } else {
        await setsService.createSet(payload)
        toast.success("Set registrado exitosamente")
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "Error al guardar el set")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden z-10 border"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-6 py-4 bg-slate-50/60"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#ffdbca] text-[#783200]">
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEdit ? "Editar Set de Grabación" : "Registrar Nuevo Set"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEdit ? "Modifica los datos del set" : "Configura un nuevo espacio de filmación"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Set <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={nombre}
                  onChange={(e) => handleNombreChange(e.target.value)}
                  placeholder="Ej: Set Croma & Streaming, Set Podcast Visual..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none transition shadow-2xs ${
                    errors.nombre
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                  }`}
                />
                {errors.nombre && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.nombre}</p>}
              </div>

              {/* Precio por hora */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Precio de Alquiler por Hora ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={precioHora}
                    onChange={(e) => handlePrecioChange(e.target.value)}
                    placeholder="0.00"
                    className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-xs sm:text-sm font-semibold outline-none transition shadow-2xs ${
                      errors.precioHora
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    }`}
                  />
                </div>
                {errors.precioHora && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors.precioHora}</p>}
                <p className="mt-1 text-[10px] text-slate-400">
                  El sistema calculará automáticamente el total multiplicando este valor por las horas reservadas.
                </p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Equipamiento Incluido <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Incluye 3 luces LED, micrófono corbatero, teleprompter y fondo croma verde..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition"
                />
              </div>

              {/* Switch Activo */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <div>
                  <p className="text-xs font-bold text-slate-800">Set Activo para Reservas</p>
                  <p className="text-[11px] text-slate-500">Permite que el set aparezca en la lista de opciones para alquilar</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fd761a]"></div>
                </label>
              </div>

              {/* Footer Buttons */}
              <div
                className="flex items-center justify-end gap-2.5 pt-4 border-t"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#fd761a] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{isEdit ? "Guardar Cambios" : "Crear Set"}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
