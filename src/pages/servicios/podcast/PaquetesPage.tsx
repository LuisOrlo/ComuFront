import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PackageIcon, Edit01Icon, Tick02Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { podcastService, type PaquetePodcast } from "@/services/podcast.service"
import { PaqueteModal } from "./components/PaqueteModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

export function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPaquete, setEditingPaquete] = useState<PaquetePodcast | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const initialMount = useRef(true)

  const load = async () => {
    try { setLoading(true); setPaquetes(await podcastService.getPaquetes()) }
    catch { toast.error("Error al cargar paquetes") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    podcastService.getPaquetes()
      .then(data => {
        setPaquetes(data)
        if (initialMount.current && data.length > 0) {
          initialMount.current = false
          setSelectedId(data[0].id)
        }
      })
      .catch(() => toast.error("Error al cargar paquetes"))
      .finally(() => setLoading(false))
  }, [])

  const selected = paquetes.find(p => p.id === selectedId) || null

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await podcastService.deletePaquete(deleteConfirm.id)
      toast.success("Paquete eliminado")
      if (selectedId === deleteConfirm.id) {
        setSelectedId(paquetes.filter(p => p.id !== deleteConfirm.id)[0]?.id || null)
      }
      setDeleteConfirm(null)
      load()
    } catch { toast.error("Error al eliminar paquete") }
    finally { setDeletingItem(false) }
  }

  const activos = paquetes.filter(p => p.activo).length
  const inactivos = paquetes.length - activos

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-7 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/servicios/podcast"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5 active:scale-[0.97] group"
              style={{ color: COLORS.CHARCOAL }}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="opacity-40 group-hover:opacity-70 transition-opacity" />
              <span className="text-xs font-bold opacity-40 group-hover:opacity-70 transition-opacity">Volver a Reservas</span>
            </Link>
            <div className="h-8 w-px bg-gray-200" />
            <div className="space-y-0.5">
              
              <h1 className="text-2xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                Paquetes de Podcast
              </h1>
            </div>
          </div>
          <button
            onClick={() => { setEditingPaquete(null); setModalOpen(true) }}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-violet-500/20"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <Plus size={18} strokeWidth={2.5} color="white" />
            Nuevo Paquete
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
              {paquetes.length} paquete{paquetes.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {activos} activos
            </span>
            {inactivos > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                <span className="size-1.5 rounded-full bg-gray-400" />
                {inactivos} inactivos
              </span>
            )}
          </motion.div>
        )}

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex gap-5 h-full">
              <div className="w-80 shrink-0 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-white border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                ))}
              </div>
              <div className="flex-1 rounded-2xl bg-white border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
          ) : paquetes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
              <div className="size-20 rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center shadow-lg shadow-violet-200/30">
                <HugeiconsIcon icon={PackageIcon} size={36} style={{ color: COLORS.ACCENT }} />
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>No hay paquetes configurados</p>
                <p className="text-sm font-medium opacity-40 max-w-xs" style={{ color: COLORS.CHARCOAL }}>Crea tu primer paquete para empezar a ofrecer servicios de podcast</p>
              </div>
              <button onClick={() => { setEditingPaquete(null); setModalOpen(true) }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl shadow-violet-500/20 hover:opacity-90 transition-all active:scale-[0.97]"
                style={{ backgroundColor: COLORS.ACCENT }}>
                <Plus size={16} strokeWidth={2.5} color="white" /> Crear primer paquete
              </button>
            </div>
          ) : (
            <div className="flex gap-5 h-full">
              <div className="w-72 lg:w-80 shrink-0 flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="shrink-0 px-4 py-3 border-b bg-gray-50/80" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Paquetes</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <AnimatePresence mode="popLayout">
                    {paquetes.map((pkg, i) => {
                      const isSelected = selectedId === pkg.id
                      return (
                        <motion.button
                          key={pkg.id}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 30 }}
                          onClick={() => setSelectedId(pkg.id)}
                          className={cn(
                            "w-full text-left px-4 py-3.5 transition-all relative",
                            isSelected ? "bg-violet-50/80" : "hover:bg-gray-50/60"
                          )}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="active-pkg-indicator"
                              className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full"
                              style={{ backgroundColor: COLORS.ACCENT }}
                            />
                          )}
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "size-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                              isSelected ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-200/50" : "bg-gray-100"
                            )}>
                              <HugeiconsIcon icon={PackageIcon} size={15} className={isSelected ? "text-white" : "opacity-40"} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-sm font-bold truncate", isSelected ? "text-violet-900" : "")} style={{ color: isSelected ? undefined : COLORS.CHARCOAL }}>
                                {pkg.nombre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium opacity-40">${pkg.precio_por_hora}/hr</span>
                                <span className="text-[8px] opacity-30">·</span>
                                <span className="text-[10px] font-medium opacity-40">{pkg.items?.length || 0} items</span>
                              </div>
                            </div>
                            <div className={cn("size-2 rounded-full shrink-0", pkg.activo ? "bg-emerald-500" : "bg-gray-300")} />
                          </div>
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <AnimatePresence mode="wait">
                  {selected && (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="bg-white rounded-2xl border shadow-sm h-full" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                    >
                      <div className="relative overflow-hidden rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/3 to-transparent pointer-events-none" />

                        <div className="relative px-8 py-7 border-b flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                              <HugeiconsIcon icon={PackageIcon} size={24} className="text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>{selected.nombre}</h2>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  selected.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                )}>
                                  <span className={cn("size-1.5 rounded-full", selected.activo ? "bg-emerald-500" : "bg-gray-400")} />
                                  {selected.activo ? "Activo" : "Inactivo"}
                                </span>
                                {selected.descripcion && (
                                  <span className="text-[10px] font-medium opacity-40 max-w-xs truncate">{selected.descripcion}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingPaquete(selected); setModalOpen(true) }}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 transition-all text-xs font-bold active:scale-[0.97]"
                              style={{ color: COLORS.CHARCOAL }}
                            >
                              <HugeiconsIcon icon={Edit01Icon} size={13} /> Editar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: selected.id, name: selected.nombre })}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-all text-xs font-bold text-red-600 active:scale-[0.97]"
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="relative px-8 py-7 space-y-8">
                          <div className="flex items-center gap-10">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1.5">Precio por hora</p>
                              <p className="text-4xl font-extrabold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                                ${selected.precio_por_hora}
                                <span className="text-base font-medium opacity-40 ml-1">/hr</span>
                              </p>
                            </div>
                            <div className="size-12 w-px bg-gray-200" />
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1.5">Items incluidos</p>
                              <p className="text-4xl font-extrabold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                                {selected.items?.length || 0}
                                <span className="text-base font-medium opacity-40 ml-1.5">ítems</span>
                              </p>
                            </div>
                          </div>

                          {selected.items && selected.items.filter(i => i.incluido).length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                  <HugeiconsIcon icon={Tick02Icon} size={12} className="text-emerald-600" />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Lo que incluye este paquete</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selected.items.filter(i => i.incluido).map(item => (
                                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-100/60">
                                    <div className="size-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                      <HugeiconsIcon icon={Tick02Icon} size={10} className="text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: COLORS.CHARCOAL }}>{item.nombre}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaqueteModal
        key={editingPaquete?.id || "new"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        paquete={editingPaquete}
        onSaved={load}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Paquete"
        message={`¿Eliminar el paquete "${deleteConfirm?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deletingItem}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
