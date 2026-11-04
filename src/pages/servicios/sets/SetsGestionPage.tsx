import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Video,
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Plus,
  Loader2,
} from "lucide-react"
import { setsService, type SetItem } from "@/services/sets.service"
import { SetFormModal } from "./components/SetFormModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

export function SetsGestionPage() {
  const navigate = useNavigate()
  const [sets, setSets] = useState<SetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<SetItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<SetItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await setsService.getSets()
      setSets(data || [])
    } catch {
      toast.error("Error al cargar el catálogo de sets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredSets = useMemo(() => {
    if (!search.trim()) return sets
    const q = search.toLowerCase()
    return sets.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(q))
    )
  }, [sets, search])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await setsService.deleteSet(deleteConfirm.id)
      toast.success("Set eliminado exitosamente")
      setDeleteConfirm(null)
      loadData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || "No se pudo eliminar el set")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/servicios/sets")}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition shadow-2xs"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Sets de Grabación</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/servicios/sets"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Ver Reservas
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditingSet(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nuevo Set</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar set por nombre o descripción..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#fd761a] focus:bg-white transition"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 pr-2">
          {filteredSets.length} {filteredSets.length === 1 ? "set registrado" : "sets registrados"}
        </div>
      </div>

      {/* Grid of Sets */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 size={32} className="animate-spin mb-3 text-[#fd761a]" />
          <p className="text-xs font-semibold">Cargando catálogo de sets...</p>
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Video size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No se encontraron sets</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? `No hay sets que coincidan con "${search}".` : "Comienza registrando tu primer set de grabación para recibir reservas."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => {
                setEditingSet(null)
                setModalOpen(true)
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:opacity-95 transition"
            >
              <Plus size={15} />
              <span>Crear Primer Set</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredSets.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Video size={22} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {s.nombre}
                        </h3>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.activo !== false
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {s.activo !== false ? "Operativo" : "Inactivo"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold">Tarifa</p>
                      <p className="text-base font-black text-slate-900 tracking-tight">
                        ${Number(s.precio_hora || 0).toFixed(2)}
                        <span className="text-[10px] font-medium text-slate-400">/hr</span>
                      </p>
                    </div>
                  </div>

                  {s.descripcion && (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {s.descripcion}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate(`/servicios/sets/nueva-reserva?set=${s.id}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#fd761a] hover:opacity-80 transition"
                  >
                    <Calendar size={14} />
                    <span>Reservar este Set</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSet(s)
                        setModalOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Editar set"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Eliminar set"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Crear / Editar */}
      <SetFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        set={editingSet}
        onSuccess={loadData}
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirm)}
        title="Eliminar Set"
        message={`¿Estás seguro de eliminar el set "${deleteConfirm?.nombre}"? Esta acción solo es posible si no tiene reservas registradas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleting}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
