import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon, Money01Icon, InformationCircleIcon, Tick02Icon,
} from "@hugeicons/core-free-icons"
import { Plus, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { podcastService, type PaquetePodcast } from "@/services/podcast.service"
import { toast } from "sonner"

interface PaqueteModalProps {
  isOpen: boolean
  onClose: () => void
  paquete?: PaquetePodcast | null
  onSaved: () => void
}

export function PaqueteModal({ isOpen, onClose, paquete, onSaved }: PaqueteModalProps) {
  const [form, setForm] = useState<Partial<PaquetePodcast>>(
    paquete ? { ...paquete } : { nombre: "", descripcion: "", precio_por_hora: 0, items: [], activo: true }
  )
  const [nuevoItemNombre, setNuevoItemNombre] = useState("")
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    if (!nuevoItemNombre.trim()) return
    setForm({
      ...form,
      items: [...(form.items || []), { id: crypto.randomUUID(), nombre: nuevoItemNombre.trim(), incluido: true }],
    })
    setNuevoItemNombre("")
  }

  const removeItem = (itemId: string) => {
    setForm({ ...form, items: (form.items || []).filter(i => i.id !== itemId) })
  }

  const handleSave = async () => {
    try {
      if (!form.nombre?.trim()) { toast.error("El nombre del paquete es obligatorio"); return }
      setSaving(true)
      if (form.id) {
        await podcastService.updatePaquete(form.id, form)
        toast.success("Paquete actualizado")
      } else {
        await podcastService.createPaquete(form)
        toast.success("Paquete creado")
      }
      onSaved()
      onClose()
    } catch { toast.error("Error al guardar paquete") }
    finally { setSaving(false) }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-7 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                  <HugeiconsIcon icon={PackageIcon} size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                    {paquete ? "Editar Paquete" : "Nuevo Paquete"}
                  </h2>
                  <p className="text-xs font-medium opacity-40 mt-0.5">Configuración de paquete de podcast</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider border-2 transition-all",
                    form.activo ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400"
                  )}
                >
                  <div className={cn("size-2 rounded-full", form.activo ? "bg-emerald-500" : "bg-gray-300")} />
                  {form.activo ? "Activo" : "Inactivo"}
                </button>
                <button onClick={onClose} className="size-10 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
              <div className="rounded-2xl border-2 bg-gradient-to-br from-violet-50/80 to-white overflow-hidden" style={{ borderColor: "rgba(139, 92, 246, 0.15)" }}>
                <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(139, 92, 246, 0.1)" }}>
                  <div className="size-7 rounded-lg bg-violet-200/60 flex items-center justify-center">
                    <HugeiconsIcon icon={PackageIcon} size={14} style={{ color: "#7c3aed" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-700/70">Información del Paquete</span>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Nombre del Paquete</label>
                    <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border-2 bg-white text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-violet-500/10"
                      style={{ borderColor: form.nombre ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }} placeholder="Ej. Podcast Básico"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                        <HugeiconsIcon icon={Money01Icon} size={10} className="inline mr-1" />Precio por Hora
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30">$</span>
                        <input type="number" value={form.precio_por_hora} onChange={e => setForm({ ...form, precio_por_hora: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 bg-gray-50/60 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }} placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">
                        <HugeiconsIcon icon={InformationCircleIcon} size={10} className="inline mr-1" />Estado
                      </label>
                      <button onClick={() => setForm({ ...form, activo: !form.activo })}
                        className={cn("w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all", form.activo ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400")}
                      >
                        <div className={cn("size-3 rounded-full", form.activo ? "bg-emerald-500" : "bg-gray-300")} />
                        {form.activo ? "Paquete Activo" : "Paquete Inactivo"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Descripción</label>
                    <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border-2 bg-gray-50/50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 resize-none transition-all"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }} rows={3} placeholder="Describe lo que incluye este paquete..."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "rgba(5, 150, 105, 0.15)" }}>
                <div className="px-5 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(5, 150, 105, 0.1)", backgroundColor: "rgba(5, 150, 105, 0.03)" }}>
                  <div className="size-7 rounded-lg bg-emerald-200/60 flex items-center justify-center">
                    <HugeiconsIcon icon={Tick02Icon} size={14} style={{ color: "#059669" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700/70">Ítems Incluidos</span>
                  <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
                    {(form.items || []).length} ítem{(form.items || []).length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  {(form.items || []).length > 0 && (
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                      {(form.items || []).map(item => (
                        <div key={item.id} className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-100 transition-all hover:border-emerald-200">
                          <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Tick02Icon} size={10} className="text-emerald-600" />
                          </div>
                          <span className="text-xs font-medium flex-1" style={{ color: COLORS.CHARCOAL }}>{item.nombre}</span>
                          <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-full hover:bg-red-100 transition-all"><Trash2 size={11} className="text-red-400" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <input type="text" value={nuevoItemNombre} onChange={e => setNuevoItemNombre(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem() } }}
                      className="flex-1 px-4 py-3 rounded-xl border-2 bg-gray-50/60 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }} placeholder="Nuevo ítem..."
                    />
                    <button onClick={addItem} disabled={!nuevoItemNombre.trim()}
                      className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                    ><Plus size={14} /> Agregar</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-gray-50/80 border-t flex justify-between items-center gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="text-[10px] font-medium opacity-40">
                {(form.precio_por_hora ?? 0) > 0 && `$ ${(form.precio_por_hora ?? 0).toFixed(2)} / hora`}
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-3 rounded-xl bg-black/5 text-sm font-semibold text-charcoal/60 hover:bg-black/10 transition-all">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !form.nombre?.trim()}
                  className="px-10 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-violet-500/20 active:scale-[0.97] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  {saving ? "Guardando..." : form.id ? "Actualizar Paquete" : "Crear Paquete"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
