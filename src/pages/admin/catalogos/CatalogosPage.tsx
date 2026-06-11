import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon } from "@hugeicons/core-free-icons"
import { Plus, Trash2, X, Search, Upload } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { ValidatedInput, ValidatedTextarea } from "@/components/form"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { cursosService, type CatalogoCurso } from "@/services/cursos.service"
import { toast } from "sonner"

type Categoria = "regular" | "taller" | "personalizado"

interface FormData {
  nombre: string
  descripcion: string
  categoria: Categoria
  imagen: string
  imagenFile: File | null
}

const emptyForm: FormData = {
  nombre: "",
  descripcion: "",
  categoria: "regular",
  imagen: "",
  imagenFile: null,
}

const categoriaStyles: Record<Categoria, { label: string; accent: string; soft: string; description: string }> = {
  regular: {
    label: "Regular",
    accent: "oklch(0.56 0.17 250)",
    soft: "color-mix(in srgb, oklch(0.56 0.17 250) 10%, white)",
    description: "Cursos base para formación continua.",
  },
  taller: {
    label: "Taller",
    accent: "oklch(0.72 0.18 72)",
    soft: "color-mix(in srgb, oklch(0.72 0.18 72) 12%, white)",
    description: "Sesiones prácticas, cortas y directas.",
  },
  personalizado: {
    label: "Personalizado",
    accent: "oklch(0.62 0.18 304)",
    soft: "color-mix(in srgb, oklch(0.62 0.18 304) 11%, white)",
    description: "Propuestas a medida para grupos o clientes.",
  },
}

export function CatalogosPage() {
  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  })
  const [form, setForm] = useState<FormData>(emptyForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Estados para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [catalogoToDelete, setCatalogoToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingCatalogo, setDeletingCatalogo] = useState(false)

  useEffect(() => {
    cargarCatalogos()
  }, [search])

  const cargarCatalogos = async () => {
    setLoading(true)
    try {
      const response = await cursosService.getCatalogos(search || undefined)
      setCatalogos(response.data)
    } catch {
      toast.error("Error al cargar catálogos")
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setModal({ open: true, editingId: null })
  }

  const openEdit = (cat: CatalogoCurso) => {
    setForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion || "",
      categoria: cat.categoria as Categoria,
      imagen: cat.imagen || "",
      imagenFile: null,
    })
    setModal({ open: true, editingId: cat.id })
  }

  const closeModal = () => {
    // Limpiar blob URL local si existe
    if (form.imagen?.startsWith("blob:")) {
      URL.revokeObjectURL(form.imagen)
    }
    setModal({ open: false, editingId: null })
    setForm(emptyForm)
    setTouched({})
    setFieldErrors({})
  }

  const handleCategoriaChange = (cat: Categoria) => {
    setForm((prev) => ({
      ...prev,
      categoria: cat,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limpiar preview local anterior
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
      setTouched({ ...touched, nombre: true })
      return
    }

    setSaving(true)
    try {
      let imagenUrl = form.imagen

      // Subir imagen solo al guardar, si hay archivo pendiente
      if (form.imagenFile) {
        imagenUrl = await cursosService.uploadImagenCatalogo(form.imagenFile)
      }

      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        categoria: form.categoria,
        imagen: imagenUrl?.startsWith("blob:") ? undefined : imagenUrl || undefined,
      }

      if (modal.editingId) {
        await cursosService.actualizarCatalogo(modal.editingId, payload as any)
        toast.success("Catálogo actualizado")
      } else {
        await cursosService.crearCatalogo(payload)
        toast.success("Catálogo creado exitosamente")
      }

      closeModal()
      cargarCatalogos()
    } catch (error: any) {
      const errors = error.response?.data?.errors
      if (errors) {
        const parsed: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(errors)) {
          parsed[key] = (msgs as string[])[0]
        }
        setFieldErrors(parsed)
      } else {
        toast.error(error.response?.data?.mensaje || "Error al guardar el catálogo")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string, nombre: string) => {
    setCatalogoToDelete({ id, nombre })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteCatalogo = async () => {
    if (!catalogoToDelete) return
    setDeletingCatalogo(true)
    try {
      await cursosService.eliminarCatalogo(catalogoToDelete.id)
      toast.success("Catálogo eliminado exitosamente")
      setShowDeleteConfirm(false)
      setCatalogoToDelete(null)
      cargarCatalogos()
    } catch {
      toast.error("Error al eliminar el catálogo")
    } finally {
      setDeletingCatalogo(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5">

          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>
                Catálogos de Cursos
              </h1>
              <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                Gestiona los cursos principales. Cada catálogo es la plantilla base de la que se crean las instancias.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 active:scale-[0.97]"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={16} />
              Nuevo Catálogo
            </button>
          </header>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <input
              type="text"
              placeholder="Buscar catálogos por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm outline-none"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.CHARCOAL,
              }}
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="size-8 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }}
                />
                <span style={{ color: COLORS.TEXT_MUTED }}>Cargando catálogos...</span>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && catalogos.length === 0 && (
            <div
              className="flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <p style={{ color: COLORS.TEXT_MUTED }}>
                No hay catálogos registrados.
              </p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Plus size={16} />
                Crear primer catálogo
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && catalogos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogos.map((cat, index) => (
                <article
                  key={cat.id || `${cat.nombre}-${index}` || `catalogo-${index}`}
                  className="group rounded-xl border bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  {/* Card image area */}
                  <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${(categoriaStyles[cat.categoria as Categoria]?.accent) || "#e5e7eb"}20 0%, ${(categoriaStyles[cat.categoria as Categoria]?.accent) || "#e5e7eb"}08 100%)` }}>
                    {cat.imagen ? (
                      <img
                        src={cat.imagen}
                        alt={cat.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span
                          className="text-4xl font-bold opacity-15 select-none"
                          style={{ color: (categoriaStyles[cat.categoria as Categoria]?.accent) || COLORS.ACCENT }}
                        >
                          {cat.categoria.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span
                      className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur"
                      style={{
                        backgroundColor: `${(categoriaStyles[cat.categoria as Categoria]?.accent) || COLORS.ACCENT}18`,
                        color: (categoriaStyles[cat.categoria as Categoria]?.accent) || COLORS.ACCENT,
                      }}
                    >
                      {cat.categoria}
                    </span>
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(cat)}
                        className="size-7 flex items-center justify-center rounded-md bg-white/90 transition-colors"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        <HugeiconsIcon icon={Edit01Icon} size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nombre)}
                        className="size-7 flex items-center justify-center rounded-md bg-white/90 transition-colors"
                        style={{ color: "oklch(0.50 0.12 10)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-4">
                    <h3
                      className="text-sm font-semibold mb-1 line-clamp-2"
                      style={{ color: COLORS.CHARCOAL }}
                    >
                      {cat.nombre}
                    </h3>
                    {cat.descripcion && (
                      <p className="text-xs line-clamp-2" style={{ color: COLORS.TEXT_MUTED }}>
                        {cat.descripcion}
                      </p>
                    )}
                  </div>
                </article>
              ))}

              {/* New catalog card */}
              <button
                onClick={openCreate}
                className="group rounded-xl border border-dashed flex flex-col items-center justify-center min-h-[260px] p-5 transition-all duration-200"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${COLORS.ACCENT}50`
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 3%, white)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                <Plus
                  size={28}
                  className="mb-2 transition-colors duration-180"
                  style={{ color: COLORS.TEXT_MUTED }}
                />
                <span
                  className="text-sm font-medium transition-colors duration-180"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  Nuevo catálogo
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
          <div
            className="bg-white rounded-[2rem] w-full max-w-[95vw] 2xl:max-w-[1500px] max-h-[90dvh] overflow-y-auto modal-scroll border shadow-2xl"
            style={{
              borderColor: "color-mix(in srgb, white 75%, rgba(0,0,0,0.08))",
              boxShadow: `0 40px 100px -30px ${categoriaStyles[form.categoria].accent}30, 0 30px 60px -20px rgba(15,23,42,0.25)`,
            }}
          >
            <style>{`.modal-scroll::-webkit-scrollbar{width:4px}.modal-scroll::-webkit-scrollbar-track{background:transparent}.modal-scroll::-webkit-scrollbar-thumb{background:oklch(0.85 0 0);border-radius:4px}.modal-scroll::-webkit-scrollbar-thumb:hover{background:oklch(0.75 0 0)}`}</style>

            {/* ─── HEADER ─── */}
            <div className="sticky top-0 z-20 border-b backdrop-blur-sm" style={{ borderColor: "color-mix(in srgb, white 65%, rgba(0,0,0,0.08))", backgroundColor: `${categoriaStyles[form.categoria].accent}06` }}>
              <div className="flex items-center justify-between px-6 py-3 sm:px-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${categoriaStyles[form.categoria].accent}14`, color: categoriaStyles[form.categoria].accent }}
                  >
                    <HugeiconsIcon icon={Edit01Icon} size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${categoriaStyles[form.categoria].accent}14`, color: categoriaStyles[form.categoria].accent }}
                      >
                        Catálogo
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                      {modal.editingId ? "Editar catálogo" : "Nuevo catálogo"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-[11px] font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${categoriaStyles[form.categoria].accent}10`, color: categoriaStyles[form.categoria].accent }}>
                    {categoriaStyles[form.categoria].label}
                  </span>
                  <button onClick={closeModal} className="p-2 rounded-full transition-colors hover:bg-black/5" style={{ color: COLORS.TEXT_MUTED }}>
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8">

                {/* ─── LEFT — IMAGE ─── */}
                <aside className="flex flex-col">
                  <div
                    className="flex-1 rounded-[1.6rem] border overflow-hidden flex flex-col transition-all duration-300"
                    style={{
                      borderColor: `${categoriaStyles[form.categoria].accent}20`,
                      background: `linear-gradient(180deg, ${categoriaStyles[form.categoria].accent}08 0%, white 100%)`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: COLORS.TEXT_MUTED }}>Portada</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: COLORS.CHARCOAL }}>Imagen del catálogo</p>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${categoriaStyles[form.categoria].accent}12`, color: categoriaStyles[form.categoria].accent }}
                      >
                        Opcional
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 px-6 pb-5">
                      {form.imagen ? (
                        <div className="relative rounded-[1.25rem] overflow-hidden border bg-white shadow-sm h-full" style={{ borderColor: `${categoriaStyles[form.categoria].accent}30` }}>
                          <img src={form.imagen} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider shadow-sm" style={{ color: categoriaStyles[form.categoria].accent }}>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: categoriaStyles[form.categoria].accent }} />
                            Portada
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (form.imagen?.startsWith("blob:")) URL.revokeObjectURL(form.imagen)
                              setForm({ ...form, imagen: "", imagenFile: null })
                            }}
                            className="absolute top-3 right-3 size-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed transition-all duration-200 active:scale-[0.98]"
                          style={{
                            borderColor: `${categoriaStyles[form.categoria].accent}30`,
                            color: COLORS.TEXT_MUTED,
                            opacity: uploading ? 0.6 : 1,
                            background: `linear-gradient(180deg, ${categoriaStyles[form.categoria].accent}06 0%, white 100%)`,
                          }}
                          onMouseEnter={(e) => {
                            if (!uploading) {
                              e.currentTarget.style.borderColor = categoriaStyles[form.categoria].accent
                              e.currentTarget.style.transform = "translateY(-1px)"
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = `${categoriaStyles[form.categoria].accent}30`
                            e.currentTarget.style.transform = "translateY(0)"
                          }}
                        >
                          {uploading ? (
                            <>
                              <div className="size-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: categoriaStyles[form.categoria].accent, borderRightColor: categoriaStyles[form.categoria].accent }} />
                              <span className="text-sm font-medium">Subiendo imagen...</span>
                            </>
                          ) : (
                            <>
                              <div
                                className="size-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300"
                                style={{ backgroundColor: `${categoriaStyles[form.categoria].accent}14`, color: categoriaStyles[form.categoria].accent }}
                              >
                                <Upload size={24} />
                              </div>
                              <div className="text-center space-y-1">
                                <span className="text-sm font-semibold block" style={{ color: COLORS.CHARCOAL }}>Subir imagen de portada</span>
                                <span className="text-xs block" style={{ color: COLORS.TEXT_MUTED }}>PNG, JPG o WebP. Máx 2MB</span>
                              </div>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
                  </div>
                </aside>

                {/* ─── RIGHT — FORM ─── */}
                <section
                  className="space-y-5 rounded-[1.6rem] p-6 border transition-all duration-300"
                  style={{
                    borderColor: `${categoriaStyles[form.categoria].accent}18`,
                    backgroundColor: "white",
                    boxShadow: `0 2px 20px -10px ${categoriaStyles[form.categoria].accent}15`,
                  }}
                >
                  {/* ─── CATEGORY SELECTOR ─── */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: COLORS.TEXT_MUTED }}>Tipo de curso</span>
                      <span className="text-xs text-red-500">*</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(["regular", "taller", "personalizado"] as Categoria[]).map((cat) => {
                        const s = categoriaStyles[cat]
                        const active = form.categoria === cat
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoriaChange(cat)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border active:scale-[0.97]"
                            style={{
                              backgroundColor: active ? s.accent : "white",
                              color: active ? "white" : COLORS.TEXT_MUTED,
                              borderColor: active ? s.accent : COLORS.BORDER_SUBTLE,
                            }}
                          >
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ─── FORM FIELDS ─── */}
                  <div className="space-y-3.5">
                    <ValidatedInput
                      label="Nombre del curso"
                      value={form.nombre}
                      onChange={(value) => setForm({ ...form, nombre: value })}
                      onBlur={() => setTouched({ ...touched, nombre: true })}
                      error={fieldErrors.nombre}
                      touched={touched.nombre}
                      placeholder="Ej: Oratoria Ejecutiva Avanzada"
                      required
                    />

                    <ValidatedTextarea
                      label="Descripción"
                      value={form.descripcion}
                      onChange={(value) => setForm({ ...form, descripcion: value })}
                      onBlur={() => setTouched({ ...touched, descripcion: true })}
                      error={fieldErrors.descripcion}
                      touched={touched.descripcion}
                      placeholder="Describe el contenido y objetivos del curso..."
                      rows={3}
                      helperText="(opcional)"
                    />
                  </div>

                  {/* ─── FOOTER BUTTONS ─── */}
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-[0.98]"
                      style={{
                        backgroundColor: "white",
                        color: COLORS.TEXT_MUTED,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97]"
                      style={{
                        background: `linear-gradient(135deg, ${categoriaStyles[form.categoria].accent} 0%, color-mix(in srgb, ${categoriaStyles[form.categoria].accent} 78%, black) 100%)`,
                        opacity: saving ? 0.65 : 1,
                      }}
                    >
                      {saving ? (
                        <>
                          <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Guardando...
                        </>
                      ) : modal.editingId ? (
                        <>Actualizar catálogo</>
                      ) : (
                        <>Crear catálogo</>
                      )}
                    </button>
                  </div>
                </section>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Eliminar Catálogo"
        message={`¿Estás seguro de que deseas eliminar el catálogo "${catalogoToDelete?.nombre}"? Esta acción no se puede deshacer y se perderán todos los cursos asociados.`}
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        isDangerous={true}
        isLoading={deletingCatalogo}
        icon="trash"
        onConfirm={confirmDeleteCatalogo}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setCatalogoToDelete(null)
        }}
      />
    </div>
  )
}
