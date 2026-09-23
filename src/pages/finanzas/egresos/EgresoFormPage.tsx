import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import {
  ArrowLeft,
  Calendar,
  Badge,
  Zap,
  Video,
  Package,
  Receipt,
  Paperclip,
  FileEdit,
  Check,
  CheckCircle2,
  Upload,
  X,
  Send,
  AlertCircle,
  ChevronDown,
} from "lucide-react"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIAS = [
  {
    id: 1,
    nombre: "Personal",
    desc: "Honorarios & Staff",
    icon: Badge,
  },
  {
    id: 2,
    nombre: "Servicios",
    desc: "Luz, SaaS, Web",
    icon: Zap,
  },
  {
    id: 3,
    nombre: "Equipos",
    desc: "Cámaras & Audio",
    icon: Video,
  },
  {
    id: 4,
    nombre: "Varios",
    desc: "Insumos & Otros",
    icon: Package,
  },
]

interface PersonalItem {
  id: string
  nombre_completo: string
  tipo: string
}

function formatDateDisplay(d: string) {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return d
  }
}

export function EgresoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [personal, setPersonal] = useState<PersonalItem[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const pendingFileRef = useRef<File | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  const [form, setForm] = useState({
    categoria: "Personal",
    descripcion: "",
    monto: "",
    proveedor_beneficiario: "",
    metodo_pago: "transferencia", // Solo dos: 'transferencia' (Transferencia / Depósito) o 'efectivo'
    fecha_pago: new Date().toISOString().split("T")[0],
    comprobante_url: "",
    notas: "",
  })

  const esPersonal = form.categoria === "Personal"

  const formComplete = useMemo(() => {
    const m = parseFloat(form.monto)
    return (
      !!form.categoria &&
      form.descripcion.trim().length >= 3 &&
      !!m &&
      m > 0 &&
      !!form.fecha_pago &&
      (!esPersonal || !!form.proveedor_beneficiario)
    )
  }, [form, esPersonal])

  useEffect(() => {
    financeService.getPersonalDisponible().then(setPersonal).catch(() => {})

    if (isEdit) {
      financeService
        .getEgreso(id!)
        .then((r: { data?: Record<string, unknown> }) => {
          const item = r.data
          if (item) {
            const rawMetodo = String(item.metodo_pago || "transferencia").toLowerCase()
            const metodoNormalizado = rawMetodo.includes("efect") ? "efectivo" : "transferencia"

            setForm({
              categoria: String(item.categoria || item.categoria_nombre || "Personal"),
              descripcion: String(item.descripcion || ""),
              monto: String(item.monto || ""),
              proveedor_beneficiario: String(item.proveedor_beneficiario || ""),
              metodo_pago: metodoNormalizado,
              fecha_pago: String(item.fecha_pago || new Date().toISOString().split("T")[0]),
              comprobante_url: String(item.comprobante_url || ""),
              notas: String(item.notas || ""),
            })

            if (item.comprobante_url) {
              setPreviewFile({
                url: String(item.comprobante_url),
                name: "Comprobante digital adjunto",
              })
            }
          }
        })
        .catch(() => toast.error("Error al cargar datos del egreso"))
    }
  }, [id, isEdit])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.categoria) e.categoria = "Selecciona una categoría contable"
    if (!form.descripcion || form.descripcion.trim().length < 3) {
      e.descripcion = "La descripción debe tener al menos 3 caracteres"
    }
    const m = parseFloat(form.monto)
    if (!m || m <= 0) e.monto = "Ingresa un monto válido mayor a $0"
    if (!form.fecha_pago) e.fecha = "Indica la fecha del egreso"
    if (esPersonal && !form.proveedor_beneficiario) {
      e.proveedor = "Selecciona al miembro del personal asignado"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      toast.error("El archivo supera los 3MB permitidos")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }
    pendingFileRef.current = file
    setPreviewFile({ url: URL.createObjectURL(file), name: file.name })
    toast.success("Comprobante adjuntado listo para guardar")
  }

  const uploadFile = async (): Promise<string> => {
    const file = pendingFileRef.current
    if (!file) return form.comprobante_url
    const fd = new FormData()
    fd.append("archivo", file)
    const res = await financeService.uploadComprobantePago(fd)
    return res.data?.url || res.url || ""
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const comprobanteUrl = pendingFileRef.current ? await uploadFile() : form.comprobante_url
      const payload = {
        ...form,
        monto: parseFloat(form.monto),
        comprobante_url: comprobanteUrl,
      }
      if (isEdit) {
        await financeService.updateEgreso(id!, payload)
        toast.success("Egreso actualizado exitosamente")
      } else {
        await financeService.createEgreso(payload)
        toast.success("Egreso registrado exitosamente")
      }
      navigate("/finanzas/egresos")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } } }
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Error al guardar el egreso"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const removeFile = () => {
    pendingFileRef.current = null
    setPreviewFile(null)
    setForm({ ...form, comprobante_url: "" })
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cabecera de Página con Enlace de Retorno */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200/80">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => navigate("/finanzas/egresos")}
              className="inline-flex items-center gap-1.5 text-slate-500 font-semibold text-xs hover:text-[#fd761a] group w-fit cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Volver a Egresos</span>
            </button>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {isEdit ? "Editar egreso" : "Registrar egreso"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Completa la información del movimiento para asiento contable y trazabilidad de tesorería.
            </p>
          </div>
        </div>

        {/* Cuadrícula Principal: 65% Formulario (Izquierda) + 35% Resumen Sticky (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: Formulario (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* GRUPO 1: Datos Generales */}
            <section className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-900">1. Datos Generales</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Fecha */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Fecha del egreso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.fecha_pago}
                      onChange={(e) => {
                        setForm({ ...form, fecha_pago: e.target.value })
                        if (errors.fecha) setErrors({ ...errors, fecha: "" })
                      }}
                      className={cn(
                        "w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]",
                        errors.fecha ? "border border-rose-400 bg-rose-50/20" : "border border-slate-200"
                      )}
                    />
                  </div>
                  {errors.fecha && (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.fecha}
                    </span>
                  )}
                </div>

                {/* Método de Pago - ÚNICAMENTE Transferencia / Depósito y Efectivo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Método de pago <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.metodo_pago}
                      onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                      className="w-full appearance-none px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] pr-10 cursor-pointer"
                    >
                      <option value="transferencia">Transferencia / Depósito</option>
                      <option value="efectivo">Efectivo</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* GRUPO 2: Categoría Contable */}
            <section className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <Package size={16} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">2. Categoría Contable</h2>
                </div>
                <span className="text-[11px] font-bold text-[#fd761a] uppercase tracking-wider">
                  Selecciona 1
                </span>
              </div>

              {errors.categoria && (
                <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.categoria}
                </span>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {CATEGORIAS.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = form.categoria === cat.nombre
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          categoria: cat.nombre,
                          proveedor_beneficiario: "",
                        })
                        if (errors.categoria) setErrors({ ...errors, categoria: "" })
                      }}
                      className={cn(
                        "group text-left relative p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-32 focus:outline-none cursor-pointer",
                        isSelected
                          ? "border-[#fd761a] bg-orange-50/40 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSelected
                              ? "bg-[#fd761a] text-white"
                              : "bg-slate-100 text-slate-600 group-hover:text-slate-900"
                          )}
                        >
                          <Icon size={18} />
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#fd761a] text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] leading-5 text-slate-900 font-bold">
                          {cat.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* GRUPO 3: Detalle del Desembolso */}
            <section className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                  <Receipt size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-900">3. Detalle del Desembolso</h2>
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  Descripción del egreso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.descripcion}
                  maxLength={255}
                  onChange={(e) => {
                    setForm({ ...form, descripcion: e.target.value })
                    if (errors.descripcion) setErrors({ ...errors, descripcion: "" })
                  }}
                  placeholder="Ej. Pago mensual instructor, factura de luz, adquisición micrófonos..."
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]",
                    errors.descripcion ? "border border-rose-400 bg-rose-50/20" : "border border-slate-200"
                  )}
                />
                {errors.descripcion && (
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.descripcion}
                  </span>
                )}
              </div>

              {/* Fila: Monto & Beneficiario dinámico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                {/* Monto */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    Monto <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-[#fd761a] font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={form.monto}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) => {
                        setForm({ ...form, monto: e.target.value })
                        if (errors.monto) setErrors({ ...errors, monto: "" })
                      }}
                      className={cn(
                        "w-full pl-8 pr-16 py-2.5 bg-slate-50 rounded-xl text-slate-900 font-bold text-base outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]",
                        errors.monto ? "border border-rose-400 bg-rose-50/20" : "border border-slate-200"
                      )}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      USD
                    </span>
                  </div>
                  {errors.monto && (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.monto}
                    </span>
                  )}
                </div>

                {/* Beneficiario / Personal */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    {esPersonal ? "Personal o docente asignado *" : "Proveedor / Beneficiario"}
                  </label>

                  {esPersonal ? (
                    <div className="relative">
                      <select
                        value={form.proveedor_beneficiario}
                        onChange={(e) => {
                          setForm({ ...form, proveedor_beneficiario: e.target.value })
                          if (errors.proveedor) setErrors({ ...errors, proveedor: "" })
                        }}
                        className={cn(
                          "w-full appearance-none px-3.5 py-2.5 bg-slate-50 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] pr-10 cursor-pointer",
                          errors.proveedor ? "border border-rose-400 bg-rose-50/20" : "border border-slate-200"
                        )}
                      >
                        <option value="">Seleccionar personal...</option>
                        {personal.map((p) => (
                          <option key={p.id} value={p.nombre_completo}>
                            {p.nombre_completo} ({p.tipo})
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.proveedor_beneficiario}
                      onChange={(e) => setForm({ ...form, proveedor_beneficiario: e.target.value })}
                      placeholder="Ej. Sony Pro Store / CNT / Papelería Sol"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]"
                    />
                  )}

                  {errors.proveedor && (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.proveedor}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* GRUPO 4: Comprobante de Respaldo */}
            <section className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <Paperclip size={16} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">4. Comprobante de Respaldo</h2>
                </div>
                {previewFile && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <CheckCircle2 size={13} />
                    Adjunto
                  </span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="egreso-upload"
              />

              {previewFile ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-4 transition-all">
                  <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-white shadow-xs shrink-0 border border-slate-200">
                    <img
                      src={previewFile.url}
                      alt="Comprobante"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1 text-center md:text-left">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {previewFile.name}
                    </span>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5 justify-center md:justify-start">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Archivo listo para procesar</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-stretch md:self-center justify-end">
                    <button
                      type="button"
                      onClick={() => document.getElementById("egreso-upload")?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors shadow-xs border border-slate-200 cursor-pointer"
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <X size={14} />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById("egreso-upload")?.click()}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#fd761a] bg-slate-50/50 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <div className="size-10 rounded-xl bg-white border border-slate-200 group-hover:border-orange-200 flex items-center justify-center text-slate-400 group-hover:text-[#fd761a] transition-colors shadow-xs">
                    <Upload size={18} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800 block">
                      Haz clic para subir o arrastra la foto del comprobante
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Formatos JPG, PNG, WEBP · Tamaño máximo de 3MB
                    </span>
                  </div>
                </button>
              )}
            </section>

            {/* GRUPO 5: Notas de Auditoría */}
            <section className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#fd761a] flex items-center justify-center">
                    <FileEdit size={16} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">5. Notas de Auditoría</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">{form.notas.length} / 500</span>
              </div>
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                maxLength={500}
                rows={3}
                placeholder="Detalles adicionales para conciliación contable, centro de costos o referencias internas del comprobante..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] resize-none"
              />
            </section>

            {/* Botones de Acción del Formulario */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 pb-6">
              <button
                type="button"
                onClick={() => navigate("/finanzas/egresos")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !formComplete}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#fd761a] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#fd761a]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{isEdit ? "Actualizar egreso" : "Registrar egreso"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: Resumen Sticky en Vivo (lg:col-span-4) */}
          <div className="lg:col-span-4 w-full">
            <aside className="sticky top-28 rounded-2xl bg-white border border-slate-200/90 shadow-xs p-6 flex flex-col gap-6">
              {/* Encabezado del Resumen */}
              <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center shrink-0">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Resumen del egreso
                  </h3>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">
                    Verificación previa al asiento contable
                  </p>
                </div>
              </div>

              {/* Lista Clave-Valor */}
              <div className="flex flex-col gap-3.5 text-xs">
                {/* Categoría */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[11px]">Categoría</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#fd761a] border border-orange-200/60 font-bold text-right truncate max-w-[190px]">
                    {form.categoria || "Sin categoría"}
                  </span>
                </div>

                {/* Fecha */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[11px]">Fecha</span>
                  <span className="text-slate-800 font-semibold text-right">
                    {form.fecha_pago ? formatDateDisplay(form.fecha_pago) : "—"}
                  </span>
                </div>

                {/* Método */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[11px]">Método</span>
                  <span className="text-slate-800 font-semibold text-right truncate max-w-[180px]">
                    {form.metodo_pago === "transferencia" ? "Transferencia / Depósito" : "Efectivo"}
                  </span>
                </div>

                {/* Beneficiario */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[11px] shrink-0 mt-0.5">
                    {esPersonal ? "Personal" : "Beneficiario"}
                  </span>
                  <span className="text-slate-800 font-semibold text-right leading-tight max-w-[190px] truncate">
                    {form.proveedor_beneficiario || "—"}
                  </span>
                </div>

                {/* Descripción / Glosa */}
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[11px]">
                    Concepto / Glosa
                  </span>
                  <p className="text-slate-800 text-xs italic line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{form.descripcion || "Sin descripción"}"
                  </p>
                </div>

                {/* Estado del Comprobante */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[11px]">Comprobante</span>
                  {previewFile ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <Check size={12} strokeWidth={3} />
                      Adjunto
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">No adjuntado</span>
                  )}
                </div>
              </div>

              {/* Bloque del Monto Total */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1">
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  Monto Total a Desembolsar
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl text-slate-900 leading-none font-bold tracking-tight">
                    $
                    {(parseFloat(form.monto) || 0).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-sm text-[#fd761a] font-bold">USD</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
