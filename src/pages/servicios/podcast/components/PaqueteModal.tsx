import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  Money01Icon,
  InformationCircleIcon,
  Tick02Icon,
  CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import { Plus, X, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { podcastService, type PaquetePodcast } from "@/services/podcast.service"
import { toast } from "sonner"

interface PaqueteModalProps {
  isOpen: boolean
  onClose: () => void
  paquete?: PaquetePodcast | null
  onSaved: () => void
}

export function PaqueteModal({ isOpen, onClose, paquete, onSaved }: PaqueteModalProps) {
  const isEdit = Boolean(paquete?.id)

  const [form, setForm] = useState<Partial<PaquetePodcast>>({
    nombre: "",
    descripcion: "",
    precio_por_hora: 0,
    items: [],
    activo: true,
  })
  const [precioText, setPrecioText] = useState("")
  const [nuevoItemNombre, setNuevoItemNombre] = useState("")
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      if (paquete) {
        setForm({
          id: paquete.id,
          nombre: paquete.nombre || "",
          descripcion: paquete.descripcion || "",
          precio_por_hora: paquete.precio_por_hora || 0,
          items: paquete.items ? [...paquete.items] : [],
          activo: paquete.activo !== false,
        })
        setPrecioText(paquete.precio_por_hora != null ? String(paquete.precio_por_hora) : "")
      } else {
        setForm({
          nombre: "",
          descripcion: "",
          precio_por_hora: 0,
          items: [],
          activo: true,
        })
        setPrecioText("")
      }
      setNuevoItemNombre("")
      setTouched({})
    }
  }, [paquete, isOpen])

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (!/^\d*\.?\d*$/.test(raw)) return
    setPrecioText(raw)
    setForm((prev) => ({
      ...prev,
      precio_por_hora: raw === "" ? 0 : parseFloat(raw) || 0,
    }))
  }

  const addItem = () => {
    const trimmed = nuevoItemNombre.trim()
    if (!trimmed) return
    if ((form.items || []).some((i) => i.nombre.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("Este ítem ya está agregado al paquete")
      return
    }
    setForm((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { id: crypto.randomUUID(), nombre: trimmed, incluido: true },
      ],
    }))
    setNuevoItemNombre("")
  }


  const removeItem = (itemId: string) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((i) => i.id !== itemId),
    }))
  }

  const isFormValid = Boolean(
    form.nombre?.trim() &&
    precioText.trim() !== "" &&
    !isNaN(parseFloat(precioText)) &&
    parseFloat(precioText) >= 0 &&
    !saving
  )

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setTouched({ nombre: true, precio: true })

    if (!form.nombre?.trim()) {
      toast.error("El nombre del paquete es obligatorio")
      return
    }

    const precio = parseFloat(precioText)
    if (precioText.trim() === "" || isNaN(precio) || precio < 0) {
      toast.error("El precio por hora debe ser un número válido")
      return
    }

    const payload = {
      ...form,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || "",
      precio_por_hora: precio,
      items: form.items || [],
      activo: form.activo ?? true,
    }

    setSaving(true)
    try {
      if (form.id) {
        await podcastService.updatePaquete(form.id, payload)
        toast.success("Paquete de podcast actualizado exitosamente")
      } else {
        await podcastService.createPaquete(payload)
        toast.success("Paquete de podcast creado exitosamente")
      }
      onSaved()
      onClose()
    } catch {
      toast.error("Error al guardar el paquete de podcast")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Bento Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200/90 z-10 flex flex-col my-auto max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-10 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={PackageIcon} size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {isEdit ? "Editar Paquete de Podcast" : "Nuevo Paquete de Podcast"}
                    </h2>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {isEdit ? "Modo Edición" : "Catálogo"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {isEdit
                      ? "Modifica las tarifas, descripción y equipamiento del paquete"
                      : "Define las tarifas por hora, alcance y los equipos que incluye la sesión"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    form.activo
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  )}
                  title="Cambiar estado del paquete"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      form.activo ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  />
                  <span>{form.activo ? "Activo" : "Inactivo"}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Card 1: Información General */}
              <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <HugeiconsIcon icon={PackageIcon} size={14} className="text-[#fd761a]" />
                  <span>Información General del Servicio</span>
                </div>

                {/* Nombre del Paquete */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>
                      Nombre del Paquete <span className="text-[#fd761a]">*</span>
                    </span>
                    {touched.nombre && !form.nombre?.trim() && (
                      <span className="text-[11px] text-red-500 font-medium">Campo requerido</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={form.nombre || ""}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, nombre: e.target.value }))
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, nombre: true }))}
                    placeholder="Ej. Sesión Estándar (Audio + 2 Micrófonos)"
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all",
                      touched.nombre && !form.nombre?.trim()
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                    )}
                  />
                </div>

                {/* Grid: Precio por Hora & Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Money01Icon} size={13} className="text-slate-400" />
                        <span>Precio por Hora ($) <span className="text-[#fd761a]">*</span></span>
                      </span>
                      {touched.precio && (!precioText.trim() || isNaN(Number(precioText))) && (
                        <span className="text-[11px] text-red-500 font-medium">Requerido</span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={precioText}
                        onChange={handlePrecioChange}
                        onBlur={() => setTouched((prev) => ({ ...prev, precio: true }))}
                        placeholder="0.00"
                        className={cn(
                          "w-full h-11 pl-8 pr-3.5 rounded-xl border bg-white text-xs font-bold text-slate-900 outline-none transition-all",
                          touched.precio && (!precioText.trim() || isNaN(Number(precioText)))
                            ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                            : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <HugeiconsIcon icon={InformationCircleIcon} size={13} className="text-slate-400" />
                      <span>Disponibilidad en Catálogo</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
                      className={cn(
                        "w-full h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer",
                        form.activo
                          ? "bg-white border-emerald-300 text-emerald-700 shadow-2xs"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            form.activo ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-slate-400"
                          )}
                        />
                        <span>{form.activo ? "Visible para reservas" : "Oculto del catálogo"}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {form.activo ? "Activo" : "Inactivo"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Descripción / Especificaciones del Paquete
                  </label>
                  <textarea
                    value={form.descripcion || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    rows={2}
                    placeholder="Detalla las características especiales, tipo de entrega o recomendaciones de la sesión..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 resize-none transition-all"
                  />
                </div>
              </div>

              {/* Card 2: Ítems y Equipamiento Incluido */}
              <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <HugeiconsIcon icon={Tick02Icon} size={13} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Equipamiento y Beneficios Incluidos
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Agrega el hardware, espacio o servicios que vienen con este paquete
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {(form.items || []).length} ítem{(form.items || []).length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Lista de Ítems */}
                {(form.items || []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {(form.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/70 hover:border-emerald-200 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Tick02Icon} size={11} />
                          </div>
                          <span className="font-medium text-slate-800 truncate">{item.nombre}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="opacity-60 hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-all cursor-pointer shrink-0"
                          title="Quitar ítem"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/40">
                    <p className="text-xs text-slate-500 font-medium">
                      No has agregado ítems todavía a este paquete.
                    </p>
                   
                  </div>
                )}

                {/* Agregar Ítem Personalizado */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={nuevoItemNombre}
                    onChange={(e) => setNuevoItemNombre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addItem()
                      }
                    }}
                    placeholder="Escribe otro ítem o equipamiento personalizado..."
                    className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!nuevoItemNombre.trim()}
                    className="h-10 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-center">
                {form.nombre?.trim() ? (
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">
                    {form.nombre}
                  </span>
                ) : (
                  <span className="italic text-slate-400">Nuevo paquete</span>
                )}
                <span>•</span>
                <span className="font-bold text-[#fd761a]">
                  ${Number(precioText || 0).toFixed(2)} / hora
                </span>
                <span>•</span>
                <span>{(form.items || []).length} ítems</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={!isFormValid || saving}
                  className={cn(
                    "h-10 px-6 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer",
                    isFormValid && !saving
                      ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 shadow-orange-500/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                      <span>{isEdit ? "Actualizar Paquete" : "Crear Paquete"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
