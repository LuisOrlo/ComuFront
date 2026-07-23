import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, UploadIcon, UserIcon, AiFolderIcon, PackageIcon, SettingsIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import api from "@/services/auth.service"
import { cn } from "@/lib/utils"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

const CATEGORIAS = [
  { id: 1, nombre: 'Personal', tipo_general: 'Personal' },
  { id: 2, nombre: 'Servicios', tipo_general: 'Servicios' },
  { id: 3, nombre: 'Equipos', tipo_general: 'Equipos' },
  { id: 4, nombre: 'Varios', tipo_general: 'Varios' },
]

const CAT_ICONS: Record<string, { icon: typeof UserIcon; color: string }> = {
  Personal: { icon: UserIcon, color: "#4f46e5" },
  Servicios: { icon: AiFolderIcon, color: "#d97706" },
  Equipos: { icon: SettingsIcon, color: "#7c3aed" },
  Varios: { icon: PackageIcon, color: "#6b7280" },
}

interface PersonalItem {
  id: string
  nombre_completo: string
  tipo: string
}

export function EgresoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [categorias] = useState(CATEGORIAS)
  const [personal, setPersonal] = useState<PersonalItem[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const pendingFileRef = useRef<File | null>(null)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)
  const [form, setForm] = useState({
    categoria_id: "", descripcion: "", monto: "",
    proveedor_beneficiario: "", metodo_pago: "transferencia",
    fecha_pago: new Date().toISOString().split("T")[0],
    comprobante_url: "", notas: "",
  })

  const categoriaSeleccionada = categorias.find(c => String(c.id) === form.categoria_id)
  const esPersonal = categoriaSeleccionada?.nombre === "Personal"

  useEffect(() => {
    financeService.getPersonalDisponible().then(setPersonal).catch(() => {})
    if (isEdit) {
      financeService.getEgresos({}).then((r: { data?: Array<Record<string, unknown>> }) => {
        const item = (r.data || []).find((e: Record<string, unknown>) => e.id === id)
        if (item) setForm({
          categoria_id: String(item.categoria_id || ""), descripcion: String(item.descripcion || ""),
          monto: String(item.monto || ""), proveedor_beneficiario: String(item.proveedor_beneficiario || ""),
          metodo_pago: String(item.metodo_pago || "transferencia"), fecha_pago: String(item.fecha_pago || ""),
          comprobante_url: String(item.comprobante_url || ""), notas: String(item.notas || ""),
        })
      }).catch(() => toast.error("Error al cargar egreso"))
    }
  }, [id, isEdit])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.categoria_id) e.categoria = "Selecciona una categoría"
    if (!form.descripcion || form.descripcion.length < 3) e.descripcion = "La descripción debe tener al menos 3 caracteres"
    const m = parseFloat(form.monto)
    if (!m || m <= 0) e.monto = "Ingresa un monto válido mayor a $0"
    if (form.fecha_pago > new Date().toISOString().split("T")[0]) e.fecha = "No puedes registrar un egreso con fecha futura"
    if (esPersonal && !form.proveedor_beneficiario) e.proveedor = "Selecciona un personal"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("El archivo supera los 5MB permitidos"); return }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) { toast.error("Solo JPG, PNG o PDF"); return }
    pendingFileRef.current = file
    if (file.type.startsWith("image/")) setPreviewFile({ url: URL.createObjectURL(file), name: file.name })
    else setPreviewFile({ url: "", name: file.name })
    toast.success("Archivo listo para subir al confirmar")
  }

  const uploadFile = async (): Promise<string> => {
    const file = pendingFileRef.current
    if (!file) return form.comprobante_url
    const fd = new FormData()
    fd.append("archivo", file)
    const token = localStorage.getItem("auth_token")
    const res = await api.post("/finanzas/pagos-iniciales/comprobante", fd, {
      headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    return res.data.data?.url || res.data.url || ""
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const comprobanteUrl = pendingFileRef.current ? await uploadFile() : form.comprobante_url
      const catId = parseInt(form.categoria_id)
      const payload = { ...form, monto: parseFloat(form.monto), categoria_id: catId, comprobante_url: comprobanteUrl }
      if (isEdit) { await financeService.updateEgreso(id!, payload); toast.success("Egreso actualizado") }
      else { await financeService.createEgreso(payload); toast.success("Egreso registrado") }
      navigate("/finanzas/egresos")
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } } }
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Error al guardar"
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const removeFile = () => {
    pendingFileRef.current = null
    setPreviewFile(null)
    setForm({ ...form, comprobante_url: "" })
  }

  const catIcon = (nombre: string) => CAT_ICONS[nombre]

  return (
    <div className="px-8 py-6 max-w-[720px] mx-auto">
      <button onClick={() => navigate("/finanzas/egresos")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 mb-6" style={{ color: CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Volver a Egresos
      </button>

      <h2 className="text-xl font-bold mb-5" style={{ color: CHARCOAL }}>{isEdit ? "Editar egreso" : "Registrar egreso"}</h2>

      <div className="rounded-2xl border bg-white p-6 space-y-5" style={{ borderColor: BORDER }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-bold uppercase opacity-40">Fecha *</label>
            <input type="date" value={form.fecha_pago} max={new Date().toISOString().split("T")[0]}
              onChange={e => setForm({ ...form, fecha_pago: e.target.value })}
              className={cn("w-full px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none mt-1", errors.fecha && "border-red-400")}
              style={{ borderColor: errors.fecha ? undefined : BORDER }} />
            {errors.fecha && <p className="text-[9px] text-red-500 mt-1">{errors.fecha}</p>}
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase opacity-40">Método de pago</label>
            <select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none mt-1" style={{ borderColor: BORDER }}>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="deposito">Depósito</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[9px] font-bold uppercase opacity-40">Categoría *</label>
          {errors.categoria && <p className="text-[9px] text-red-500 mt-1">{errors.categoria}</p>}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {categorias.map(cat => {
              const sel = form.categoria_id === String(cat.id)
              const iconDef = catIcon(cat.nombre) || { icon: PackageIcon, color: "#6b7280" }
              const color = iconDef.color
              return (
                <button key={cat.id} type="button" onClick={() => setForm({ ...form, categoria_id: String(cat.id), proveedor_beneficiario: "" })}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                  style={{ borderColor: sel ? color : BORDER, backgroundColor: sel ? `${color}10` : "transparent" }}>
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <HugeiconsIcon icon={iconDef.icon} size={16} style={{ color }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: sel ? color : CHARCOAL }}>{cat.nombre}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-bold uppercase opacity-40">Descripción *</label>
          <input type="text" value={form.descripcion} maxLength={255}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Pago mensual instructor, Factura de luz..."
            className={cn("w-full px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none mt-1", errors.descripcion && "border-red-400")}
            style={{ borderColor: errors.descripcion ? undefined : BORDER }} />
          <div className="flex justify-between mt-1">
            {errors.descripcion && <p className="text-[9px] text-red-500">{errors.descripcion}</p>}
            <span className="text-[9px] opacity-30 ml-auto">{form.descripcion.length}/255</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-bold uppercase opacity-40">Monto *</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30">$</span>
              <input type="number" value={form.monto} min="0.01" step="0.01"
                onChange={e => setForm({ ...form, monto: e.target.value })}
                className={cn("w-full pl-8 pr-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-bold outline-none", errors.monto && "border-red-400")}
                style={{ borderColor: errors.monto ? undefined : BORDER }} />
            </div>
            {errors.monto && <p className="text-[9px] text-red-500 mt-1">{errors.monto}</p>}
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase opacity-40">
              {esPersonal ? "Personal *" : "Proveedor / Beneficiario"}
            </label>
            {esPersonal ? (
              <select value={form.proveedor_beneficiario}
                onChange={e => setForm({ ...form, proveedor_beneficiario: e.target.value })}
                className={cn("w-full px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none mt-1", errors.proveedor && "border-red-400")}
                style={{ borderColor: errors.proveedor ? undefined : BORDER }}>
                <option value="">Seleccionar personal...</option>
                {personal.map(p => (
                  <option key={p.id} value={p.nombre_completo}>{p.nombre_completo} ({p.tipo})</option>
                ))}
              </select>
            ) : (
              <input type="text" value={form.proveedor_beneficiario}
                onChange={e => setForm({ ...form, proveedor_beneficiario: e.target.value })}
                placeholder="Ej: Juan Pérez, CNT..."
                className="w-full px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none mt-1" style={{ borderColor: BORDER }} />
            )}
            {errors.proveedor && <p className="text-[9px] text-red-500 mt-1">{errors.proveedor}</p>}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-bold uppercase opacity-40">Comprobante</label>
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleFileSelect} className="hidden" id="egreso-upload" />
          {previewFile ? (
            <div className="mt-1 p-3 rounded-xl border bg-gray-50 flex items-center gap-3" style={{ borderColor: BORDER }}>
              {previewFile.url ? <img src={previewFile.url} alt="preview" className="size-12 rounded-lg object-cover" /> : <span className="text-[10px] font-bold">📄</span>}
              <span className="text-xs truncate flex-1">{previewFile.name}</span>
              <button onClick={removeFile}
                className="text-[10px] font-bold text-red-500 hover:underline">Quitar</button>
            </div>
          ) : (
            <button onClick={() => document.getElementById("egreso-upload")?.click()}
              className="w-full py-4 mt-1 rounded-xl border-2 border-dashed text-xs font-bold flex flex-col items-center gap-1 hover:bg-gray-50"
              style={{ borderColor: BORDER }}>
              <HugeiconsIcon icon={UploadIcon} size={18} />
              📎 Arrastra tu comprobante o haz clic
              <span className="text-[9px] opacity-40 font-normal">JPG, PNG, PDF — Máximo 5MB</span>
            </button>
          )}
        </div>

        <div>
          <label className="text-[9px] font-bold uppercase opacity-40">Notas</label>
          <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none mt-1 resize-none" style={{ borderColor: BORDER }} />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={() => navigate("/finanzas/egresos")} className="px-6 py-3 rounded-xl text-sm font-bold bg-gray-100">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ backgroundColor: "#c0392b" }}>
            {saving ? "Guardando..." : isEdit ? "Actualizar egreso" : "Registrar egreso"}
          </button>
        </div>
      </div>
    </div>
  )
}