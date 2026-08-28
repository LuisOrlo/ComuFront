import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cursosService } from "@/services/cursos.service"
import { toast } from "sonner"
import { IconPickerModal } from "./components/IconPickerModal"
import { CATALOG_ICONS, iconMap } from "./components/catalog-icons"

interface FormData {
  nombre: string
  descripcion: string
  imagen: string
  color: string
}

const emptyForm: FormData = {
  nombre: "",
  descripcion: "",
  imagen: "",
  color: "#3B82F6",
}

export function CatalogoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const colorInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!id)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const isEditing = !!id

  const canSubmit = isEditing
    || (form.nombre.trim().length > 0 && (form.imagen?.length ?? 0) > 0)

  useEffect(() => {
    if (!id) return

    setLoading(true)
    cursosService.getCatalogoById(id)
      .then((cat) => {
        setForm({
          nombre: cat.nombre,
          descripcion: cat.descripcion || "",
          imagen: cat.imagen || "",
          color: cat.color || "#3B82F6",
        })
      })
      .catch(() => toast.error("Error al cargar catálogo"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    if (!form.nombre.trim()) {
      setFieldErrors({ nombre: "El nombre del catálogo es obligatorio" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        categoria: "regular" as const,
        imagen: form.imagen || undefined,
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

          {/* LEFT: Icon Preview */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r flex flex-col items-center justify-center gap-5"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <label className="text-xs font-bold uppercase tracking-widest opacity-50 block">
              Ícono representativo
            </label>

            <div
              className="rounded-2xl border aspect-square flex items-center justify-center shadow-inner w-28"
              style={{
                background: form.imagen
                  ? `linear-gradient(135deg, ${form.color}30, ${form.color}60)`
                  : `color-mix(in srgb, ${COLORS.TEXT_MUTED} 8%, transparent)`,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              {form.imagen && iconMap[form.imagen] ? (
                <HugeiconsIcon icon={iconMap[form.imagen]} size={72} style={{ color: form.color }} />
              ) : (
                <span className="text-xs px-4 text-center" style={{ color: COLORS.TEXT_MUTED }}>
                  Sin ícono
                </span>
              )}
            </div>

            {form.imagen && CATALOG_ICONS.find(i => i.name === form.imagen) && (
              <div className="text-center -mt-1">
                <p className="text-sm font-semibold" style={{ color: form.color }}>
                  {CATALOG_ICONS.find(i => i.name === form.imagen)?.label}
                </p>
                <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>
                  {CATALOG_ICONS.find(i => i.name === form.imagen)?.category}
                </p>
              </div>
            )}

            <div className="flex flex-col items-center gap-2 w-full max-w-[220px]">
              <button
                type="button"
                onClick={() => setIconPickerOpen(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 hover:opacity-90"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                Cambiar ícono
              </button>
              {form.imagen && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imagen: "" })}
                  className="text-[11px] font-medium hover:underline"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Quitar ícono
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Fields */}
          <div className="p-6 space-y-5">
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
              </label>              <input
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
                disabled={!canSubmit || saving}
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

      <IconPickerModal
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        selectedIcon={form.imagen || null}
        catalogColor={form.color}
        onApply={(iconName) => setForm({ ...form, imagen: iconName })}
      />
    </div>
  )
}
