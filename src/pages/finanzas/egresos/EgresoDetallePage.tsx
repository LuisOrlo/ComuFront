import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  InvoiceIcon,
  CalendarIcon,
  PaymentIcon,
  Image01Icon,
  UserIcon,
  AiFolderIcon,
  PackageIcon,
  SettingsIcon,
  Delete02Icon,
  BanknoteArrowDownIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE

const CAT_ICONS: Record<string, { icon: typeof UserIcon; color: string }> = {
  Personal: { icon: UserIcon, color: "#4f46e5" },
  Servicios: { icon: AiFolderIcon, color: "#d97706" },
  Equipos: { icon: SettingsIcon, color: "#7c3aed" },
  Varios: { icon: PackageIcon, color: "#6b7280" },
}

export function EgresoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [deletingComprobante, setDeletingComprobante] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [comprobanteEliminado, setComprobanteEliminado] = useState(false)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    financeService.getEgreso(id)
      .then(res => setData(res.data))
      .catch(() => { toast.error("Error al cargar egreso"); navigate("/finanzas/pagos/historial") })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleDeleteComprobante = async () => {
    if (!id) return
    setDeleteModalOpen(false)
    setDeletingComprobante(true)
    try {
      await financeService.deleteComprobante(id, "egreso")
      toast.success("Comprobante eliminado")
      setComprobanteEliminado(true)
    } catch { toast.error("Error al eliminar comprobante") }
    finally { setDeletingComprobante(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>Cargando...</p>
      </div>
    )
  }

  if (!data) return null

  const catLabel = data.categoria_nombre || "Sin categoría"
  const catIcon = (["Personal", "Servicios", "Equipos"].includes(catLabel) ? CAT_ICONS[catLabel] : CAT_ICONS.Varios)
  const CatIconComponent = catIcon.icon
  return (
    <div className="px-8 py-6 max-w-2xl mx-auto">
      <button onClick={() => navigate("/finanzas/pagos/historial")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 mb-6 transition-opacity"
        style={{ color: CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al historial
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: BORDER }}>

        <div className="p-6 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${catIcon.color}12` }}>
              <HugeiconsIcon icon={CatIconComponent} size={24} style={{ color: catIcon.color }} />
            </div>
            <div>
              <h2 className="text-lg font-black flex items-center gap-2" style={{ color: CHARCOAL }}>
                <HugeiconsIcon icon={BanknoteArrowDownIcon} size={20} style={{ color: "oklch(0.55 0.15 30)" }} />
                Egreso
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
                  {catLabel}
                </span>
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Ficha icon={CalendarIcon} label="Fecha" value={data.fecha_pago ? new Date(data.fecha_pago).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
            <Ficha icon={PaymentIcon} label="Monto" value={`-$${data.monto?.toLocaleString()}`} color="oklch(0.55 0.15 30)" bold />
            <Ficha icon={UserIcon} label="Beneficiario" value={data.proveedor_beneficiario || "—"} />
            <Ficha icon={InvoiceIcon} label="Método de pago" value={data.metodo_pago ? data.metodo_pago.charAt(0).toUpperCase() + data.metodo_pago.slice(1) : "—"} />
          </div>

          <Ficha icon={AiFolderIcon} label="Descripción" value={data.descripcion || "—"} />

          {data.subcategoria && (
            <Ficha icon={PackageIcon} label="Subcategoría" value={data.subcategoria} />
          )}

          <Ficha icon={UserIcon} label="Registrado por" value={data.registrado_por || "—"} />

          {data.notas && (
            <Ficha icon={InvoiceIcon} label="Notas" value={data.notas} />
          )}

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-3">Comprobante</p>
            {comprobanteEliminado ? (
              <div>
                <div className="p-4 rounded-xl border bg-red-50/50 text-center" style={{ borderColor: BORDER }}>
                  <p className="text-xs font-bold text-red-400">Comprobante eliminado del almacenamiento</p>
                  <p className="text-[10px] opacity-50 mt-1">El registro histórico se conserva</p>
                </div>
              </div>
            ) : data.comprobante_url ? (
              <div>
                <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer mb-3" style={{ borderColor: BORDER }}
                  onClick={() => setExpandedImage(getStorageUrl(data.comprobante_url))}>
                  <img src={getStorageUrl(data.comprobante_url)} alt="Comprobante"
                    className="w-full object-contain max-h-[500px]" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedImage(getStorageUrl(data.comprobante_url))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: BORDER, color: CHARCOAL }}>
                    <HugeiconsIcon icon={Image01Icon} size={12} />
                    Ampliar
                  </button>
                  <button onClick={() => setDeleteModalOpen(true)} disabled={deletingComprobante}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50">
                    <HugeiconsIcon icon={Delete02Icon} size={12} />
                    {deletingComprobante ? "Eliminando..." : "Eliminar comprobante"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: BORDER }}>
                <p className="text-xs opacity-40">Sin comprobante</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Eliminar comprobante"
        message="¿Eliminar la imagen del comprobante del almacenamiento? El registro histórico se conservará como constancia."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deletingComprobante}
        icon="danger"
        onConfirm={handleDeleteComprobante}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {expandedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpandedImage(null)}>
          <button onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            ✕
          </button>
          <img src={expandedImage} alt="Comprobante ampliado"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

function Ficha({ icon: Icon, label, value, color, bold }: {
  icon: IconSvgElement
  label: string
  value?: string
  color?: string
  bold?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <HugeiconsIcon icon={Icon} size={12} className="opacity-30" />}
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">{label}</p>
      </div>
      <p className="text-sm" style={{ color: color || CHARCOAL, fontWeight: bold ? 700 : 500 }}>
        {value || "—"}
      </p>
    </div>
  )
}
