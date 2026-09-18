import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Check, CloudCheck, Eye, Info, Palette, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { cursosService } from "@/services/cursos.service"
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
  color: "#FD761A",
}

const colorPalette = [
  "#FD761A", "#1E293B", "#4F46E5", "#059669", "#E11D48",
  "#D97706", "#7C3AED", "#0891B2", "#065F46", "#0B1C30",
]

export function CatalogoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [initialForm, setInitialForm] = useState<FormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  const isEditing = Boolean(id)
  const selectedIcon = form.imagen ? CATALOG_ICONS.find((item) => item.name === form.imagen) : undefined
  const selectedCatalogIcon = form.imagen ? iconMap[form.imagen] : undefined
  const isFormComplete = Boolean(form.nombre.trim() && form.descripcion.trim() && form.imagen && form.color.trim())
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm)
  const canSubmit = isEditing ? isDirty && Boolean(form.nombre.trim()) : isFormComplete

  const updateForm = (changes: Partial<FormData>) => {
    setForm((current) => ({ ...current, ...changes }))
    if (Object.keys(changes).some((key) => fieldErrors[key])) {
      setFieldErrors((current) => {
        const next = { ...current }
        Object.keys(changes).forEach((key) => delete next[key])
        return next
      })
    }
  }

  useEffect(() => {
    if (!id) {
      setForm(emptyForm)
      setInitialForm(emptyForm)
      setLoading(false)
      return
    }

    setLoading(true)
    cursosService.getCatalogoById(id)
      .then((cat) => {
        const loadedForm = {
          nombre: cat.nombre,
          descripcion: cat.descripcion || "",
          imagen: cat.imagen || "",
          color: cat.color || "#FD761A",
        }
        setForm(loadedForm)
        setInitialForm(loadedForm)
      })
      .catch(() => toast.error("Error al cargar catálogo"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFieldErrors({})

    const errors: Record<string, string> = {}
    if (!form.nombre.trim()) errors.nombre = "El nombre del catálogo es obligatorio"
    if (!form.descripcion.trim()) errors.descripcion = "La descripción del catálogo es obligatoria"
    if (!form.imagen) errors.imagen = "Selecciona un ícono para el catálogo"
    if (!form.color.trim()) errors.color = "Selecciona un color identificador"

    if (Object.keys(errors).length > 0 && !isEditing) {
      setFieldErrors(errors)
      return
    }
    if (isEditing && !form.nombre.trim()) {
      setFieldErrors({ nombre: "El nombre del catálogo es obligatorio" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        categoria: "regular" as const,
        imagen: form.imagen || undefined,
        color: form.color || undefined,
      }

      if (isEditing) {
        await cursosService.actualizarCatalogo(id!, payload as Record<string, unknown>)
        toast.success("Catálogo actualizado")
      } else {
        await cursosService.crearCatalogo(payload)
        toast.success("Catálogo creado exitosamente")
      }
      navigate("/catalogos")
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { errors?: Record<string, string[]>; mensaje?: string } } }
      const errorsFromApi = axiosError.response?.data?.errors
      if (errorsFromApi) {
        const parsed: Record<string, string> = {}
        for (const [key, messages] of Object.entries(errorsFromApi)) parsed[key] = messages[0]
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8f9ff" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
          <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando catálogo...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9ff" }}>
      <header className="border-b bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => navigate("/catalogos")} className="size-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-[#e5eeff]" aria-label="Volver a catálogos">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: COLORS.TEXT_MUTED }}>Catálogos</p>
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{isEditing ? "Editar catálogo" : "Nuevo catálogo"}</h1>
            </div>
          </div>
          {isEditing && <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#ffdbca", color: "#783200" }}>Editando existente</span>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-1">
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-7 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold" style={{ color: COLORS.TEXT_MUTED }}><Eye size={16} style={{ color: COLORS.ACCENT }} /> Vista previa en vivo</span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold" style={{ backgroundColor: "#eff4ff", color: COLORS.TEXT_MUTED }}>Tarjeta del catálogo</span>
              </div>

              <div className="relative rounded-xl p-5 shadow-sm" style={{ backgroundColor: "#eff4ff" }}>
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: form.color || COLORS.ACCENT }} />
                <div className="flex items-start justify-between gap-3 mb-5 pt-1">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "white", color: COLORS.TEXT_MUTED }}>Catálogo formativo</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: "white", color: COLORS.TEXT_MUTED }}><span className="size-2 rounded-full" style={{ backgroundColor: form.color || COLORS.ACCENT }} />{isEditing ? "Activo" : "Nuevo"}</div>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${form.color || COLORS.ACCENT}1f`, color: form.color || COLORS.ACCENT }}>{selectedCatalogIcon ? <HugeiconsIcon icon={selectedCatalogIcon} size={30} /> : <Palette size={27} />}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold leading-tight break-words" style={{ color: COLORS.CHARCOAL }}>{form.nombre.trim() || "Nombre del catálogo..."}</h3>
                    {isEditing && <span className="text-[10px] font-mono" style={{ color: COLORS.TEXT_MUTED }}>Catálogo existente</span>}
                  </div>
                </div>
                <p className="text-xs leading-5 line-clamp-3 min-h-[60px] mb-5" style={{ color: COLORS.TEXT_MUTED }}>{form.descripcion.trim() || "Sin descripción asignada. Añade detalles para orientar a docentes y estudiantes."}</p>
                <div className="pt-3 border-t flex items-center justify-between gap-3 text-xs" style={{ borderColor: "rgba(118,119,125,.25)", color: COLORS.TEXT_MUTED }}>
                  <span><strong style={{ color: COLORS.CHARCOAL }}>{isEditing ? "Cursos asociados" : "0 cursos"}</strong></span>
                  {isEditing && <span>Catálogo activo</span>}
                </div>
              </div>

              <div className="p-4 rounded-xl flex flex-col gap-3" style={{ backgroundColor: "#eff4ff" }}>
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: COLORS.TEXT_MUTED }}>Ícono representativo</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setIconPickerOpen(true)} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white hover:bg-[#e5eeff] text-xs font-semibold shadow-sm" style={{ color: COLORS.CHARCOAL }}><Palette size={17} style={{ color: COLORS.ACCENT }} /> Cambiar ícono</button>
                  {form.imagen && <button type="button" onClick={() => updateForm({ imagen: "" })} className="px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-white hover:text-red-500" style={{ color: COLORS.TEXT_MUTED }} aria-label="Quitar ícono"><Trash2 size={16} /></button>}
                </div>
                {fieldErrors.imagen && <p className="text-xs text-red-500">{fieldErrors.imagen}</p>}
                <div className="flex items-start gap-2 pt-1"><Info size={15} className="mt-0.5 shrink-0" style={{ color: COLORS.TEXT_MUTED }} /><p className="text-[11px] leading-4" style={{ color: COLORS.TEXT_MUTED }}>La vista previa refleja cómo verán este catálogo docentes y estudiantes.</p></div>
              </div>

             
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between"><label htmlFor="catalog-name" className="text-xs uppercase tracking-wider font-bold" style={{ color: COLORS.CHARCOAL }}>Nombre del catálogo <span className="text-red-500">*</span></label><span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>{form.nombre.length} / 60</span></div>
                <input id="catalog-name" type="text" maxLength={60} value={form.nombre} onChange={(event) => updateForm({ nombre: event.target.value })} placeholder="Ej. Diseño Gráfico, Animación 3D, Marketing Digital..." className="w-full h-11 px-3.5 rounded-lg text-sm outline-none focus:bg-white focus:ring-2" style={{ backgroundColor: "#eff4ff", color: COLORS.CHARCOAL, border: `1px solid ${fieldErrors.nombre ? "#ef4444" : "transparent"}` }} />
                {fieldErrors.nombre ? <p className="text-xs text-red-500">{fieldErrors.nombre}</p> : <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Usa un nombre corto, directo y fácil de identificar.</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between"><label htmlFor="catalog-description" className="text-xs uppercase tracking-wider font-bold" style={{ color: COLORS.CHARCOAL }}>Descripción del catálogo <span className="text-red-500">*</span></label><span className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>{form.descripcion.length} / 240</span></div>
                <textarea id="catalog-description" maxLength={240} rows={4} value={form.descripcion} onChange={(event) => updateForm({ descripcion: event.target.value })} placeholder="Describe brevemente los objetivos de aprendizaje o el alcance temático..." className="w-full p-3.5 rounded-lg text-sm outline-none resize-none focus:bg-white focus:ring-2" style={{ backgroundColor: "#eff4ff", color: COLORS.CHARCOAL, border: `1px solid ${fieldErrors.descripcion ? "#ef4444" : "transparent"}` }} />
                {fieldErrors.descripcion ? <p className="text-xs text-red-500">{fieldErrors.descripcion}</p> : <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Esta síntesis se mostrará en el catálogo y en las fichas de sus cursos.</p>}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between"><label className="text-xs uppercase tracking-wider font-bold" style={{ color: COLORS.CHARCOAL }}>Color identificador <span className="text-red-500">*</span></label><span className="text-[11px] font-mono font-semibold" style={{ color: COLORS.TEXT_MUTED }}>{form.color.toUpperCase()}</span></div>
                <div className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: "#eff4ff" }}>
                  <button type="button" onClick={() => colorInputRef.current?.click()} className="size-10 rounded-lg shadow-sm shrink-0 hover:brightness-95" style={{ backgroundColor: form.color }} aria-label="Seleccionar color" />
                  <input ref={colorInputRef} type="color" value={form.color} onChange={(event) => updateForm({ color: event.target.value.toUpperCase() })} className="hidden" />
                  <div className="flex flex-col"><span className="text-[10px] uppercase" style={{ color: COLORS.TEXT_MUTED }}>Valor hexadecimal</span><span className="text-sm font-mono font-bold" style={{ color: COLORS.CHARCOAL }}>{form.color.toUpperCase()}</span></div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {colorPalette.map((color) => <button key={color} type="button" onClick={() => updateForm({ color })} className={cn("size-8 rounded-lg flex items-center justify-center hover:brightness-90", form.color.toLowerCase() === color.toLowerCase() && "ring-2 ring-offset-2")} style={{ backgroundColor: color, ["--tw-ring-color" as string]: form.color.toLowerCase() === color.toLowerCase() ? COLORS.ACCENT : "transparent" }} aria-label={`Seleccionar ${color}`}>{form.color.toLowerCase() === color.toLowerCase() && <Check size={16} className="text-white" />}</button>)}
                </div>
                {fieldErrors.color && <p className="text-xs text-red-500">{fieldErrors.color}</p>}
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>El color se aplicará en las tarjetas y elementos visuales del catálogo.</p>
              </div>
              {selectedIcon && <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Ícono seleccionado: <strong style={{ color: form.color }}>{selectedIcon.label}</strong></p>}
            </div>
          </div>

          <div className="px-5 sm:px-7 lg:px-8 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: "#eff4ff", borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}><CloudCheck size={17} style={{ color: COLORS.ACCENT }} /><span>{isEditing ? (isDirty ? "Hay cambios pendientes por guardar" : "No hay cambios pendientes") : "Completa todos los campos para crear el catálogo"}</span></div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button type="button" onClick={() => navigate("/catalogos")} className="px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-white" style={{ color: COLORS.CHARCOAL }}>Cancelar</button>
              <button type="submit" disabled={!canSubmit || saving} className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110" style={{ backgroundColor: COLORS.ACCENT }}>{saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear catálogo"}</button>
            </div>
          </div>
        </form>
      </main>

      <IconPickerModal open={iconPickerOpen} onOpenChange={setIconPickerOpen} selectedIcon={form.imagen || null} catalogColor={form.color} onApply={(iconName) => updateForm({ imagen: iconName })} />
    </div>
  )
}
