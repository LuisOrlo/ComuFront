import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon, Home02Icon, Money01Icon, UserGroupIcon, ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Plus, Trash2, X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { aulasService, type Aula } from "@/services/aulas.service"
import { toast } from "sonner"

export function AulasGestionPage() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [aulaForm, setAulaForm] = useState<Partial<Aula>>({ nombre: "", capacidad: 10, precio_hora: 0, caracteristicas: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const load = async () => {
    try { setLoading(true); setAulas(await aulasService.getAulas()) }
    catch { toast.error("Error al cargar aulas") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    aulasService.getAulas()
      .then(setAulas)
      .catch(() => toast.error("Error al cargar aulas"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!aulaForm.nombre?.trim()) {
      toast.error("El nombre del aula es obligatorio")
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await aulasService.updateAula(editingId, aulaForm)
        toast.success("Aula actualizada")
      } else {
        await aulasService.createAula(aulaForm)
        toast.success("Aula creada")
      }
      setModalOpen(false)
      setEditingId(null)
      setAulaForm({ nombre: "", capacidad: 10, precio_hora: 0, caracteristicas: "" })
      load()
    } catch { toast.error("Error al guardar aula") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await aulasService.deleteAula(deleteConfirm.id)
      toast.success("Aula eliminada")
      setDeleteConfirm(null)
      load()
    } catch { toast.error("Error al eliminar aula") }
    finally { setDeletingItem(false) }
  }

  const openEdit = (aula: Aula) => {
    setEditingId(aula.id)
    setAulaForm({ ...aula })
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setAulaForm({ nombre: "", capacidad: 10, precio_hora: 0, caracteristicas: "" })
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-7 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/servicios/aulas"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5 active:scale-[0.97] group"
              style={{ color: COLORS.CHARCOAL }}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="opacity-40 group-hover:opacity-70 transition-opacity" />
              <span className="text-xs font-bold opacity-40 group-hover:opacity-70 transition-opacity">Volver a Reservas</span>
            </Link>
            <div className="h-8 w-px bg-gray-200" />
            <div className="space-y-0.5">
              
              <h1 className="text-2xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                Gestión de Aulas
              </h1>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-violet-500/20"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <Plus size={18} strokeWidth={2.5} color="white" />
            Nueva Aula
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-5 min-h-0">
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-1"
          >
            <span className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
              {aulas.length} aula{aulas.length !== 1 ? "s" : ""}
            </span>
          </motion.div>
        )}

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-xl bg-white border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              ))}
            </div>
          ) : aulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
              <div className="size-20 rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center shadow-lg shadow-violet-200/30">
                <HugeiconsIcon icon={Home02Icon} size={36} style={{ color: COLORS.ACCENT }} />
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>No hay aulas configuradas</p>
                <p className="text-sm font-medium opacity-40 max-w-xs" style={{ color: COLORS.CHARCOAL }}>Crea tu primer espacio para empezar a gestionar reservas</p>
              </div>
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl shadow-violet-500/20 hover:opacity-90 transition-all active:scale-[0.97]"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <Plus size={16} strokeWidth={2.5} color="white" /> Crear primera aula
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {aulas.map((aula, i) => (
                  <motion.div
                    key={aula.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                    className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.02] to-transparent pointer-events-none" />
                      <div className="relative p-5 flex items-center gap-5">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-200/50">
                          <HugeiconsIcon icon={Home02Icon} size={20} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>{aula.nombre}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-medium opacity-40">
                              <HugeiconsIcon icon={UserGroupIcon} size={11} />
                              {aula.capacidad} PAX
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-medium opacity-40">
                              <HugeiconsIcon icon={Money01Icon} size={11} />
                              ${aula.precio_hora}/hr
                            </span>
                            {aula.caracteristicas && (
                              <>
                                <span className="text-[8px] opacity-30">·</span>
                                <span className="text-[10px] font-medium opacity-30 truncate max-w-[200px]">{aula.caracteristicas}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => openEdit(aula)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 transition-all text-xs font-bold active:scale-[0.97]"
                            style={{ color: COLORS.CHARCOAL }}
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={13} /> Editar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: aula.id, name: aula.nombre })}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-all text-xs font-bold text-red-600 active:scale-[0.97]"
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modal Aula */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b flex justify-between items-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>
                    {editingId ? "Editar Aula" : "Nueva Aula"}
                  </h2>
                  <p className="text-xs font-medium opacity-50">{editingId ? "Actualiza los datos del espacio" : "Configura un nuevo espacio académico"}</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="size-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Nombre del Aula */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Nombre del Aula</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-charcoal/40 flex items-center pointer-events-none">
                      <HugeiconsIcon icon={Home02Icon} size={18} />
                    </div>
                    <input
                      type="text"
                      value={aulaForm.nombre}
                      onChange={e => setAulaForm({ ...aulaForm, nombre: e.target.value })}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-gray-50/50 text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500"
                      style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      placeholder="Ej. Estudio de Producción A"
                    />
                  </div>
                </div>

                {/* Grid Capacidad y Precio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Capacidad (PAX)</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-charcoal/40 flex items-center pointer-events-none">
                        <HugeiconsIcon icon={UserGroupIcon} size={18} />
                      </div>
                      <input
                        type="number"
                        value={aulaForm.capacidad}
                        onChange={e => setAulaForm({ ...aulaForm, capacidad: parseInt(e.target.value) || 0 })}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-gray-50/50 text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        placeholder="10"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Precio por Hora ($)</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-charcoal/40 flex items-center pointer-events-none">
                        <HugeiconsIcon icon={Money01Icon} size={18} />
                      </div>
                      <input
                        type="number"
                        value={aulaForm.precio_hora}
                        onChange={e => setAulaForm({ ...aulaForm, precio_hora: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-gray-50/50 text-sm font-semibold outline-none transition-all focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Características / Equipamiento</label>
                  <textarea
                    value={aulaForm.caracteristicas}
                    onChange={e => setAulaForm({ ...aulaForm, caracteristicas: e.target.value })}
                    className="w-full h-32 px-5 py-4 rounded-2xl border bg-gray-50/50 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 resize-none"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    placeholder="Describe el equipamiento, capacidad técnica, proyector, sonido, aire acondicionado, etc..."
                  />
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50/50 border-t flex justify-end gap-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-8 py-4 rounded-2xl bg-black/5 text-sm font-bold text-charcoal/60 hover:bg-black/10 transition-all active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-12 py-4 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-violet-500/20 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Aula"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmación eliminar */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl text-center space-y-5"
            >
              <div className="size-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>Eliminar Aula</h3>
                <p className="text-sm opacity-50">¿Eliminar el aula <strong>{deleteConfirm.name}</strong>? Las reservas asociadas no se verán afectadas.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3.5 rounded-xl bg-black/5 text-sm font-bold hover:bg-black/10 transition-all">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deletingItem}
                  className="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50">
                  {deletingItem ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
