/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Money02Icon,
  CalendarIcon,
  UserIcon,
  InvoiceIcon,
  PaymentIcon,
  BanknoteArrowDownIcon,
  AiFolderIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"

const CHARCOAL = COLORS.CHARCOAL
const BORDER = COLORS.BORDER_SUBTLE
const GREEN = "oklch(0.55 0.15 150)"

export function IngresoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [modalImg, setModalImg] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    financeService.getTransaccionDetalle(id)
      .then(res => setData(res.datos || res.data || res))
      .catch(() => toast.error("Error al cargar detalle"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>Cargando...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>No encontrado</p>
      </div>
    )
  }

  const estado = data.estado_verificacion
  const estadoVerificado = estado === "verificado" || estado === "aprobado"

  return (
    <div className="px-8 py-6">
      <button onClick={() => navigate("/finanzas/ingresos")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 mb-6 transition-opacity" style={{ color: CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} /> Volver a Ingresos
      </button>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border bg-white p-6 flex items-center gap-4" style={{ borderColor: BORDER }}>
            <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${GREEN}1f` }}>
              <HugeiconsIcon icon={Money02Icon} size={24} style={{ color: GREEN }} />
            </div>
            <div>
              <p className="text-3xl font-black" style={{ color: GREEN }}>${Number(data.monto || 0).toLocaleString()}</p>
              <p className="text-sm font-bold capitalize" style={{ color: CHARCOAL }}>{data.metodo_pago}</p>
            </div>
            {estado && (
              <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0"
                style={{
                  backgroundColor: estadoVerificado ? "oklch(0.55 0.15 150 / 0.12)" : "oklch(0.6 0.15 80 / 0.12)",
                  color: estadoVerificado ? "#059669" : "#ca8a04",
                }}>
                {estado}
              </span>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: BORDER }}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-4">Detalle del ingreso</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <Ficha icon={CalendarIcon} label="Fecha"
                value={data.fecha_pago ? new Date(data.fecha_pago).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
              <Ficha icon={UserIcon} label="Estudiante" value={data.estudiante_nombre || "—"} />
              <Ficha icon={InvoiceIcon} label="Concepto" value={data.curso_nombre || data.concepto || "—"} />
              <Ficha icon={PaymentIcon} label="Método de pago"
                value={data.metodo_pago ? data.metodo_pago.charAt(0).toUpperCase() + data.metodo_pago.slice(1) : "—"} />
              <Ficha icon={BanknoteArrowDownIcon} label="Tipo" value="Ingreso" />
              <Ficha icon={AiFolderIcon} label="Registrado por" value={data.registrado_por || "—"} />
            </div>
            {data.referencia_pago && (
              <div className="mt-5 pt-5 border-t" style={{ borderColor: BORDER }}>
                <Ficha icon={InvoiceIcon} label="Referencia de pago" value={data.referencia_pago} />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6" style={{ borderColor: BORDER }}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-3">Comprobante</p>
            {data.comprobante_url ? (
              <div>
                <div className="rounded-xl border overflow-hidden bg-gray-50 cursor-pointer mb-3" style={{ borderColor: BORDER }}
                  onClick={() => setModalImg(getStorageUrl(data.comprobante_url))}>
                  <img src={getStorageUrl(data.comprobante_url)} alt="Comprobante"
                    className="w-full object-contain max-h-[300px]" />
                </div>
                <button onClick={() => setModalImg(getStorageUrl(data.comprobante_url))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: BORDER, color: CHARCOAL }}>
                  <HugeiconsIcon icon={Image01Icon} size={12} /> Ampliar
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: BORDER }}>
                <p className="text-xs opacity-40">Sin comprobante</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setModalImg(null)}>
          <button onClick={() => setModalImg(null)}
            className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            ✕
          </button>
          <img src={modalImg} alt="Comprobante ampliado"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

function Ficha({ icon: Icon, label, value }: { icon: IconSvgElement; label: string; value?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <HugeiconsIcon icon={Icon} size={12} className="opacity-30" />
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">{label}</p>
      </div>
      <p className="text-sm" style={{ color: CHARCOAL, fontWeight: 500 }}>{value || "—"}</p>
    </div>
  )
}
