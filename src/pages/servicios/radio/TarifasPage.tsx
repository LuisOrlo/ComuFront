import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { DiscountIcon } from "@hugeicons/core-free-icons"
import { Plus, Pencil, Trash2, X, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"
import { radioService, type TarifaRadio } from "@/services/radio.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"

export function TarifasPage() {
  const [tarifas, setTarifas] = useState<TarifaRadio[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TarifaRadio | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  // Form fields
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioPorHora, setPrecioPorHora] = useState("")
  const [incluyeOperador, setIncluyeOperador] = useState(true)
  const [esActivo, setEsActivo] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadTarifas = async () => {
    try {
      setTarifas(await radioService.getTarifas())
    } catch {
      toast.error("Error al cargar tarifas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTarifas() }, [])

  const openCreate = () => {
    setEditing(null)
    setNombre("")
    setDescripcion("")
    setPrecioPorHora("")
    setIncluyeOperador(true)
    setEsActivo(true)
    setShowForm(true)
  }

  const openEdit = (t: TarifaRadio) => {
    setEditing(t)
    setNombre(t.nombre)
    setDescripcion(t.descripcion || "")
    setPrecioPorHora(t.precio_por_hora.toString())
    setIncluyeOperador(t.incluye_operador)
    setEsActivo(t.es_activo)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !precioPorHora) return
    setSaving(true)
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio_por_hora: parseFloat(precioPorHora),
        incluye_operador: incluyeOperador,
        es_activo: esActivo,
      }
      if (editing) {
        await radioService.updateTarifa(editing.id, payload)
        toast.success("Tarifa actualizada")
      } else {
        await radioService.createTarifa(payload)
        toast.success("Tarifa creada")
      }
      setShowForm(false)
      loadTarifas()
    } catch {
      toast.error("Error al guardar tarifa")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await radioService.deleteTarifa(deleteConfirm.id)
      toast.success("Tarifa eliminada")
      setDeleteConfirm(null)
      loadTarifas()
    } catch {
      toast.error("Error al eliminar tarifa")
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Servicios <span className="size-1 rounded-full bg-current opacity-50" /> Radio
            </div>
            <div className="flex items-center gap-4">
              <Link to="/servicios/radio" className="size-9 flex items-center justify-center rounded-full hover:bg-black/5">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                Gestionar Tarifas
              </h1>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-violet-500/20"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <Plus size={18} strokeWidth={2.5} color="white" />
            Nueva Tarifa
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <div className="bg-white rounded-[2.5rem] border shadow-2xl shadow-black/5 overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : tarifas.length === 0 ? (
            <div className="p-12 text-center">
              <HugeiconsIcon icon={DiscountIcon} size={40} className="opacity-20 mx-auto mb-3" />
              <p className="text-sm font-bold opacity-40">No hay tarifas configuradas</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {tarifas.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold truncate", !t.es_activo && "opacity-40")}>
                        {t.nombre}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                        t.es_activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                      )}>
                        {t.es_activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {t.descripcion && <p className="text-[11px] opacity-40 truncate mt-0.5">{t.descripcion}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">${t.precio_por_hora.toFixed(2)}<span className="text-[10px] font-normal opacity-40">/h</span></p>
                    <p className="text-[9px] opacity-40">{t.incluye_operador ? "Incluye operador" : "Sin operador"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(t)} className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                      <Pencil size={14} className="opacity-40" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ id: t.id, name: t.nombre })} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} className="opacity-40 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
                {editing ? "Editar Tarifa" : "Nueva Tarifa"}
              </h2>
              <button onClick={() => setShowForm(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2" style={{ borderColor: COLORS.BORDER_SUBTLE }} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2 resize-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Precio por hora ($)</label>
                <input type="number" min={0} step={0.5} value={precioPorHora} onChange={e => setPrecioPorHora(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2" style={{ borderColor: COLORS.BORDER_SUBTLE }} required />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold">Incluye operador por defecto</span>
                <button type="button" onClick={() => setIncluyeOperador(!incluyeOperador)} className={cn("relative w-11 h-6 rounded-full transition-all", incluyeOperador ? "bg-emerald-500" : "bg-gray-300")}>
                  <div className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all", incluyeOperador ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold">Activo</span>
                <button type="button" onClick={() => setEsActivo(!esActivo)} className={cn("relative w-11 h-6 rounded-full transition-all", esActivo ? "bg-emerald-500" : "bg-gray-300")}>
                  <div className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all", esActivo ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: COLORS.ACCENT }}>{saving ? "Guardando..." : (editing ? "Actualizar" : "Crear")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Tarifa"
        message={`¿Eliminar la tarifa "${deleteConfirm?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
