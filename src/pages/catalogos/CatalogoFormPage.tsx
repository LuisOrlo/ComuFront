import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Upload, X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn, getStorageUrl } from "@/lib/utils"
import { cursosService } from "@/services/cursos.service"
import { toast } from "sonner"

interface FormData {
  nombre: string
  descripcion: string
  imagen: string
  imagenFile: File | null
  color: string
}

const emptyForm: FormData = {
  nombre: "",
  descripcion: "",
  imagen: "",
  imagenFile: null,
  color: "#3B82F6",
}

export function CatalogoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!id)

  const isEditing = !!id

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    cursosService.getCatalogoById(id)
      .then((cat) => {
        setForm({
          nombre: cat.nombre,
          descripcion: cat.descripcion || "",
          imagen: cat.imagen || "",
          imagenFile: null,
          color: cat.color || "#3B82F6",
        })
      })
      .catch(() => toast.error("Error al cargar catálogo"))
      .finally(() => setLoading(false))
  }, [id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (form.imagen?.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagen)
    }
    const previewUrl = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, imagen: previewUrl, imagenFile: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!form.nombre.trim()) {
      setFieldErrors({ nombre: "El nombre del catálogo es obligatorio" })
      return
    }

    setSaving(true)
    try {
      let imagenUrl = form.imagen

      if (form.imagenFile) {
        imagenUrl = await cursosService.uploadImagenCatalogo(form.imagenFile)
      }

      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        categoria: "regular" as const,
        imagen: imagenUrl?.startsWith("blob:") ? undefined : imagenUrl || undefined,
        color: form.color || undefined,
      }

      if (isEditing) {
        await cursosService.actualizarCatalogo(id, payload as Record<string, unknown>)
        toast.success("Catálogo actualizado")
      } else {
        await cursosService.crearCatalogo(payload)
        toast.success("Catálogo creado exitosamente")
      }

      navigate("/catalogos")
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { errors?: Record<string, string[]>; mensaje?: string } } }
      const errors = axiosError.response?.data?.errors
      if (errors) {
        const parsed: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(errors)) {
          parsed[key] = (msgs as string[])[0]
        }
        setFieldErrors(parsed)
      } else {
        toast.error(axiosError.response?.data?.mensaje || "Error al guardar el catálogo")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
          <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando catálogo...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      <header className="px-6 py-4 bg-white/80 backdrop-blur-xl border-b flex items-center gap-4 shrink-0"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <button
          onClick={() => navigate("/catalogos")}
          className="size-9 flex items-center justify-center rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
            {isEditing ? "Actualizar Catálogo" : "Nuevo Catálogo"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
            {isEditing ? "Modifica los datos del catálogo" : "Registra un nuevo catálogo de cursos"}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex justify-center p-6">
        <div className="w-full max-w-[1080px] grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-white rounded-[2.5rem] overflow-hidden shadow-xl border"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}>

          {/* LEFT: Image */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r flex flex-col justify-start"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <label className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 block">
              Imagen representativa
            </label>
            <div className="flex-1 flex items-center justify-center min-h-0">
              {form.imagen ? (
                <div className="relative rounded-2xl overflow-hidden border aspect-[4/3] max-h-[300px] w-full shadow-inner"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <img src={getStorageUrl(form.imagen)} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent" />
                  <button
                    type="button"
                    onClick={() => {
                      if (form.imagen?.startsWith("blob:")) URL.revokeObjectURL(form.imagen)
                      setForm({ ...form, imagen: "", imagenFile: null })
                    }}
                    className="absolute top-3 right-3 size-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full min-h-[240px] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all hover:bg-gray-50 active:scale-[0.98]"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}
                >
                  <div className="size-14 rounded-2xl flex items-center justify-center bg-black/5">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Subir imagen de portada</p>
                    <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>PNG, JPG o WebP</p>
                  </div>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* RIGHT: Fields */}
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                Color Identificador
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="size-11 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
                  style={{ backgroundColor: form.color, borderColor: COLORS.BORDER_SUBTLE }}
                />
                <input
                  ref={colorInputRef}
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="hidden"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 px-3 py-2.5 rounded-xl border bg-gray-50/50 text-sm font-mono font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "size-6 rounded-full border transition-all hover:scale-110 active:scale-90",
                      form.color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-2 ring-black/40 scale-105" : "border-black/10"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Master en Cinematografía"
                className="w-full px-4 py-3 rounded-xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5"
                style={{ borderColor: fieldErrors.nombre ? "#ef4444" : COLORS.BORDER_SUBTLE }}
              />
              {fieldErrors.nombre && (
                <p className="text-xs text-red-500 px-1">{fieldErrors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest opacity-50 px-1">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe el impacto y alcance de este catálogo..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-tomato/5 resize-none"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {saving ? "Sincronizando..." : isEditing ? "Guardar cambios" : "Crear catálogo"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/catalogos")}
                className="flex-1 py-3 rounded-xl bg-black/5 text-sm font-bold transition-all active:scale-95 hover:bg-black/10"
                style={{ color: COLORS.CHARCOAL }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
