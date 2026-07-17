import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Home02Icon, Money01Icon, Tick02Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { Loader2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { equiposService, type Equipo } from "@/services/equipos.service"
import { toast } from "sonner"

const MAX_FOTO_SIZE = 2 * 1024 * 1024

export function NuevoEquipoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioDiario, setPrecioDiario] = useState("")
  const [estado, setEstado] = useState<string>("disponible")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    equiposService.getEquipo(id)
      .then((eq: Equipo) => {
        setNombre(eq.nombre)
        setDescripcion(eq.descripcion || "")
        setPrecioDiario(String(eq.precio_diario))
        setEstado(eq.estado)
      })
      .catch(() => { toast.error("Error al cargar equipo"); navigate("/servicios/equipos") })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FOTO_SIZE) {
      toast.error("La imagen no debe superar los 2MB")
      e.target.value = ""
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio"
    if (nombre.trim().length < 2) newErrors.nombre = "Mínimo 2 caracteres"
    if (!precioDiario || Number(precioDiario) <= 0) newErrors.precioDiario = "Debe ser un valor positivo"
    setErrors(newErrors)
    setTouched({ nombre: true, precioDiario: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const form = new FormData()
      form.append("nombre", nombre.trim())
      if (descripcion.trim()) form.append("descripcion", descripcion.trim())
      form.append("precio_diario", String(Number(precioDiario)))
      if (isEdit) form.append("estado", estado)
      if (fotoFile) form.append("foto", fotoFile)

      if (isEdit && id) {
        await equiposService.updateEquipo(id, form)
        toast.success("Equipo actualizado")
        navigate("/servicios/equipos")
      } else {
        await equiposService.createEquipo(form)
        toast.success("Equipo creado exitosamente")
        navigate("/servicios/equipos")
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al guardar equipo"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (field: string) => {
    const hasErr = touched[field] && errors[field]
    return `w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white ${
      hasErr
        ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
        : "border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
    }`
  }

  const errMsg = (field: string) => {
    if (!touched[field]) return null
    const msg = errors[field]
    return msg ? (
      <p className="flex items-center gap-1.5 text-[11px] mt-1.5 text-red-500 font-medium">
        <HugeiconsIcon icon={AlertCircleIcon} size={11} />
        {msg}
      </p>
    ) : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-amber-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-amber-600 border-t-transparent rounded-full" />
          <p className="text-xs font-medium opacity-40">Cargando datos del equipo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-amber-50/20">
      <header className="shrink-0 border-b bg-white/90 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/servicios/equipos")}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <HugeiconsIcon icon={Home02Icon} size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
                  {isEdit ? "Editar Equipo" : "Nuevo Equipo"}
                </h1>
                <p className="text-xs opacity-40 mt-0.5">
                  {isEdit ? "Actualiza los datos del equipo" : "Registra un nuevo equipo en el catálogo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Sección: Información básica */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.04 90)", color: "#d97706" }}>
                  <HugeiconsIcon icon={Home02Icon} size={14} />
                </span>
                Información del equipo
              </h2>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                  Nombre del equipo
                  <span className="text-red-500">*</span>
                </label>
                <input type="text" value={nombre}
                  onChange={e => { setNombre(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.nombre; return n }) }}
                  onBlur={() => setTouched(prev => ({ ...prev, nombre: true }))}
                  className={inputCls("nombre")}
                  placeholder="Ej. Cámara Sony A7III" />
                {errMsg("nombre")}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                  Descripción
                </label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white resize-none border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
                  rows={3} placeholder="Describe el equipo, especificaciones técnicas, etc..." />
              </div>
            </div>

            {/* Sección: Precio y estado */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.04 160)", color: "#059669" }}>
                  <HugeiconsIcon icon={Money01Icon} size={14} />
                </span>
                Precio y Estado
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                    <HugeiconsIcon icon={Money01Icon} size={12} className="opacity-40" />
                    Precio diario ($)
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                      <span className="text-sm font-bold opacity-30">$</span>
                      <div className="w-px h-5 bg-gray-200 ml-1.5" />
                    </div>
                    <input type="number" min="0" step="0.01" value={precioDiario}
                      onChange={e => { setPrecioDiario(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.precioDiario; return n }) }}
                      onBlur={() => setTouched(prev => ({ ...prev, precioDiario: true }))}
                      className={`${inputCls("precioDiario")} pl-14`}
                      placeholder="0.00" />
                  </div>
                  {errMsg("precioDiario")}
                </div>

                {isEdit && (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.CHARCOAL }}>
                      Estado
                    </label>
                    <select value={estado} onChange={e => setEstado(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all bg-white border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10">
                      <option value="disponible">Disponible</option>
                      <option value="alquilado">Alquilado</option>
                      <option value="mantenimiento">En mantenimiento</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Foto */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 lg:p-7 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-xs font-bold flex items-center gap-2.5 mb-4 tracking-wide" style={{ color: COLORS.CHARCOAL }}>
                <span className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.92 0.03 270)", color: "#7c3aed" }}>
                  <HugeiconsIcon icon={Home02Icon} size={14} />
                </span>
                Foto del equipo
              </h2>

              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50/60 text-sm font-medium text-center outline-none hover:bg-gray-100 transition-colors">
                    {fotoFile ? fotoFile.name : "Seleccionar foto (máx. 2MB)"}
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" className="hidden" onChange={handleFotoChange} />
                </label>
                {(fotoPreview || isEdit) && (
                  <div className="size-16 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <img src={fotoPreview || (isEdit ? undefined : "")} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[10px] opacity-30 px-1">Formatos: JPG, PNG, WEBP. Peso máximo: 2MB</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 pb-4">
              <button type="button" onClick={() => navigate("/servicios/equipos")}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 transition-all hover:bg-gray-50 active:scale-[0.98]">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.98] shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={16} />
                    {isEdit ? "Actualizar Equipo" : "Guardar Equipo"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
