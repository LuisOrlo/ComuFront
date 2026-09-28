import { useState, useRef } from "react"
import {
  X,
  Banknote,
  Landmark,
  Upload,
  Trash2,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  FileCheck,
} from "lucide-react"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"

interface InstructorInfo {
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  ciudad?: string | { id?: number; nombre?: string }
  perfil?: { especialidad?: string; bio?: string } | null
}

interface RegistrarPagoInstructorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  instructor: InstructorInfo
}

export function RegistrarPagoInstructorModal({
  isOpen,
  onClose,
  onSuccess,
  instructor,
}: RegistrarPagoInstructorModalProps) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const pendingFileRef = useRef<File | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; size?: number } | null>(null)

  const nombreCompleto = `${instructor.nombres} ${instructor.apellidos}`.trim()
  const initials = `${instructor.nombres?.[0] || ""}${instructor.apellidos?.[0] || ""}`.toUpperCase()

  const [form, setForm] = useState({
    categoria: "Personal",
    subcategoria: "Honorarios Instructores",
    monto: "",
    fecha_pago: new Date().toISOString().split("T")[0],
    metodo_pago: "transferencia" as "transferencia" | "efectivo",
    descripcion: "",
    notas: "",
  })

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}

    const m = parseFloat(form.monto)
    if (!form.monto || isNaN(m) || m <= 0) {
      newErrors.monto = "Ingresa un monto válido mayor a $0.00"
    }

    if (!form.descripcion || form.descripcion.trim().length < 3) {
      newErrors.descripcion = "El concepto debe tener al menos 3 caracteres"
    }

    if (!form.fecha_pago) {
      newErrors.fecha_pago = "Indica la fecha del pago"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 5 MB")
      return
    }

    pendingFileRef.current = file
    const isImg = file.type.startsWith("image/")
    setPreviewFile({
      url: isImg ? URL.createObjectURL(file) : "",
      name: file.name,
      size: file.size,
    })
    toast.success("Comprobante adjuntado")
  }

  const removeFile = () => {
    pendingFileRef.current = null
    setPreviewFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      let comprobanteUrl = ""
      if (pendingFileRef.current) {
        const fd = new FormData()
        fd.append("archivo", pendingFileRef.current)
        const uploadRes = await financeService.uploadComprobantePago(fd)
        comprobanteUrl = uploadRes?.data?.url || uploadRes?.url || ""
      }

      const payload = {
        categoria: "Personal",
        subcategoria: "Honorarios Instructores",
        proveedor_beneficiario: nombreCompleto,
        descripcion: form.descripcion.trim(),
        monto: parseFloat(form.monto),
        metodo_pago: form.metodo_pago,
        fecha_pago: form.fecha_pago,
        comprobante_url: comprobanteUrl || null,
        notas: form.notas.trim() || null,
      }

      await financeService.createEgreso(payload)
      toast.success(`Pago de $${parseFloat(form.monto).toFixed(2)} registrado para ${instructor.nombres}`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } } }
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Error al registrar el pago"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-4 backdrop-blur-xs"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs"
            >
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Registrar Pago a Instructor</h2>
              <p className="text-xs text-gray-500">Desembolso contable por honorarios profesionales de docencia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Card: Instructor Asignado (Beneficiario) */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50/20 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-xs"
                  style={{ background: "linear-gradient(135deg, #fd761a 0%, #e05e07 100%)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 truncate">{nombreCompleto}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} /> Beneficiario
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500 mt-0.5">
                    {instructor.cedula && <span>CI: <b className="font-mono text-gray-700">{instructor.cedula}</b></span>}
                    {instructor.perfil?.especialidad && (
                      <span className="text-orange-700 font-medium truncate max-w-[200px]">
                        {instructor.perfil.especialidad}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span className="hidden sm:inline-block rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 border border-gray-200 shadow-2xs shrink-0">
                Cat: Personal
              </span>
            </div>
          </div>

          {/* Grid: Monto y Fecha */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Monto */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Monto del Desembolso <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={(e) => {
                    setForm({ ...form, monto: e.target.value })
                    if (errors.monto) setErrors({ ...errors, monto: "" })
                  }}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-8 pr-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.monto ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-emerald-500"
                  }`}
                />
              </div>
              {errors.monto && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
                  <AlertCircle size={11} /> {errors.monto}
                </p>
              )}
            </div>

            {/* Fecha de pago */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Fecha del Pago <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.fecha_pago}
                  onChange={(e) => {
                    setForm({ ...form, fecha_pago: e.target.value })
                    if (errors.fecha_pago) setErrors({ ...errors, fecha_pago: "" })
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {errors.fecha_pago && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
                  <AlertCircle size={11} /> {errors.fecha_pago}
                </p>
              )}
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Método de Pago <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, metodo_pago: "transferencia" })}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                  form.metodo_pago === "transferencia"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    form.metodo_pago === "transferencia" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Landmark size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold">Transferencia</span>
                  <span className="block text-[10px] text-gray-400">Depósito / Banco</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, metodo_pago: "efectivo" })}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                  form.metodo_pago === "efectivo"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    form.metodo_pago === "efectivo" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Banknote size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold">Efectivo</span>
                  <span className="block text-[10px] text-gray-400">Entrega en caja</span>
                </div>
              </button>
            </div>
          </div>

          {/* Concepto / Descripción */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">
                Concepto / Descripción del Pago <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">Mínimo 3 caracteres</span>
            </div>
            <input
              type="text"
              placeholder="Ej: Honorarios por dictado del curso / Liquidación..."
              value={form.descripcion}
              onChange={(e) => {
                setForm({ ...form, descripcion: e.target.value })
                if (errors.descripcion) setErrors({ ...errors, descripcion: "" })
              }}
              className={`w-full rounded-xl border bg-white py-2.5 px-3.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                errors.descripcion ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-emerald-500"
              }`}
            />
            {errors.descripcion && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
                <AlertCircle size={11} /> {errors.descripcion}
              </p>
            )}
          </div>

          {/* Comprobante de Pago Adjunto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Comprobante de Pago Digital <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            {previewFile ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {previewFile.url ? (
                    <img
                      src={previewFile.url}
                      alt="Comprobante"
                      className="size-11 rounded-lg object-cover border border-emerald-200"
                    />
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <FileCheck size={20} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{previewFile.name}</p>
                    <p className="text-[10px] text-gray-500">
                      {previewFile.size ? `${(previewFile.size / 1024).toFixed(0)} KB` : "Listo para subir"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  title="Quitar archivo"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-4 transition hover:bg-gray-50 cursor-pointer">
                <Upload size={18} className="text-gray-400 mb-1" />
                <span className="text-xs font-bold text-gray-700">Subir imagen o documento PDF</span>
                <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, PDF hasta 5MB</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Notas / Referencia Bancaria */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Notas u Observaciones <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: No. de transferencia bancaria, banco emisor, liquidación de horas..."
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando pago...
                </>
              ) : (
                <>
                  <DollarSign size={14} />
                  Registrar Pago {form.monto ? `($${parseFloat(form.monto || "0").toFixed(2)})` : ""}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
