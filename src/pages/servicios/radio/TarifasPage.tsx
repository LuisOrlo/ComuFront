import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { DiscountIcon, TagIcon, File02Icon, MoneyIcon, CheckmarkCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Plus, Pencil, Trash2, X, ArrowLeft } from "lucide-react"
import { Link } from "react-router"
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
    setShowForm(true)
  }

  const openEdit = (t: TarifaRadio) => {
    setEditing(t)
    setNombre(t.nombre)
    setDescripcion(t.descripcion || "")
    setPrecioPorHora(t.precio_por_hora.toString())
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
        incluye_operador: false,
        es_activo: true,
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
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                to="/servicios/radio"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:bg-gray-100 bg-white"
                style={{ color: COLORS.CHARCOAL, borderColor: COLORS.BORDER_SUBTLE }}
              >
                <ArrowLeft size={16} />
                <span>Volver al Alquiler</span>
              </Link>
              <div>
                <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
                  Gestionar Tarifas
                </h1>
                <p className="text-sm opacity-50 mt-1">
                  {tarifas.filter(t => t.es_activo).length} activas
                  {tarifas.filter(t => !t.es_activo).length > 0 && ` · ${tarifas.filter(t => !t.es_activo).length} inactivas`}
                </p>
              </div>
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
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tarifas.map(t => {
                const priceColors = getPriceColors(t.precio_por_hora)
                return (
                  <div key={t.id}
                    className="rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md active:scale-[0.98] group"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="h-1.5" style={{ backgroundColor: priceColors.border }} />
                    <div className="p-4 flex flex-col items-center text-center gap-3">
                      <div className="size-12 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: priceColors.bg }}>
                        <HugeiconsIcon icon={TagIcon} size={22} style={{ color: priceColors.icon }} />
                      </div>
                      <div className="min-w-0 w-full">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>
                            {t.nombre}
                          </span>
                        </div>
                        {t.descripcion && (
                          <p className="text-[10px] opacity-40 truncate mt-1">{t.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-bold" style={{ color: priceColors.icon }}>
                          ${t.precio_por_hora.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-normal opacity-30">/h</span>
                      </div>
                      <div className="flex items-center gap-2 w-full pt-1">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full",
                          t.es_activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                        )}>
                          <HugeiconsIcon icon={t.es_activo ? CheckmarkCircleIcon : Cancel01Icon} size={10} />
                          {t.es_activo ? "Activo" : "Inactivo"}
                        </span>
                        <div className="flex-1" />
                        <button onClick={() => openEdit(t)}
                          className="size-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                          title="Editar">
                          <Pencil size={12} className="opacity-40" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: t.id, name: t.nombre })}
                          className="size-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          title="Eliminar">
                          <Trash2 size={12} className="opacity-40 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE, background: "linear-gradient(135deg, oklch(0.98 0.01 260), oklch(0.98 0.01 160))" }}>
              <div className="size-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: "oklch(0.65 0.2 45)" }}>
                <HugeiconsIcon icon={DiscountIcon} size={20} color="white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
                  {editing ? "Editar Tarifa" : "Nueva Tarifa"}
                </h2>
                <p className="text-[11px] opacity-50 mt-0.5">Configuraci&oacute;n de tarifa por hora</p>
              </div>
              <button onClick={() => setShowForm(false)} className="size-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40">
                  <HugeiconsIcon icon={TagIcon} size={12} />
                  Nombre
                </div>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }} required />
              </div>
              <div className="h-px" style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40">
                  <HugeiconsIcon icon={File02Icon} size={12} />
                  Descripci&oacute;n
                </div>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                  className="w-full px-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 resize-none transition-all"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              </div>
              <div className="h-px" style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40">
                  <HugeiconsIcon icon={MoneyIcon} size={12} />
                  Precio por hora ($)
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold opacity-30">$</span>
                  <input type="number" min={0} step={0.5} value={precioPorHora} onChange={e => setPrecioPorHora(e.target.value)}
                    className="w-full pl-8 pr-14 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 transition-all"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }} required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">/hora</span>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3.5 rounded-lg text-sm font-bold border transition-all hover:bg-gray-50"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: COLORS.ACCENT }}>{saving ? "Guardando..." : (editing ? "Actualizar Tarifa" : "Crear Tarifa")}</button>
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

function getPriceColors(price: number) {
  if (price >= 30) {
    return {
      border: "oklch(0.65 0.2 300)",
      bg: "oklch(0.95 0.02 300)",
      icon: "oklch(0.55 0.2 300)",
    }
  }
  if (price >= 15) {
    return {
      border: "oklch(0.55 0.15 220)",
      bg: "oklch(0.95 0.02 220)",
      icon: "oklch(0.45 0.15 220)",
    }
  }
  return {
    border: "oklch(0.55 0.18 160)",
    bg: "oklch(0.95 0.02 160)",
    icon: "oklch(0.45 0.18 160)",
  }
}
