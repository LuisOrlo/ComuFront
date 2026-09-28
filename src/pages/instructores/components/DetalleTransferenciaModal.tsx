import { X, ExternalLink, Calendar, Banknote, Landmark, FileText, Image, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { COLORS } from "@/lib/constants"
import { getStorageUrl } from "@/lib/utils"

export interface PagoDetalleItem {
  id?: string
  fecha_pago?: string | null
  descripcion?: string | null
  categoria?: string | null
  subcategoria?: string | null
  monto?: number | string | null
  metodo_pago?: string | null
  forma_pago?: string | null
  comprobante_url?: string | null
  comprobante_numero?: string | null
  referencia?: string | null
  proveedor_beneficiario?: string | null
  notas?: string | null
  created_at?: string | null
}

interface DetalleTransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  pago: PagoDetalleItem | null
  instructorNombre?: string
}

export function DetalleTransferenciaModal({
  isOpen,
  onClose,
  pago,
  instructorNombre,
}: DetalleTransferenciaModalProps) {
  const navigate = useNavigate()

  if (!isOpen || !pago) return null

  const montoNum = Number(pago.monto || 0)
  const metodo = (pago.metodo_pago || pago.forma_pago || "transferencia").toLowerCase()
  const esTransferencia = metodo.includes("transf") || metodo.includes("banc") || metodo.includes("deposito")

  const fmtFecha = (f?: string | null) => {
    if (!f) return "—"
    try {
      return new Date(f).toLocaleDateString("es-EC", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch {
      return f
    }
  }

  const comprobanteUrl = pago.comprobante_url ? getStorageUrl(pago.comprobante_url) : null
  const isImage = comprobanteUrl ? /\.(jpe?g|png|webp|gif)$/i.test(comprobanteUrl) : false

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-4 backdrop-blur-xs"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Detalle de la Transferencia / Pago</h2>
              <p className="text-xs text-gray-500">Registro de egreso oficial emitido al instructor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Card Destacada de Monto y Estado */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-gray-50 p-5 text-center shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Monto Desembolsado
            </span>
            <div className="mt-1 text-3xl font-extrabold text-emerald-600 tracking-tight">
              ${montoNum.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Desembolso Efectuado
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                {esTransferencia ? <Landmark size={12} /> : <Banknote size={12} />}
                {esTransferencia ? "Transferencia Bancaria" : "Efectivo / Caja"}
              </span>
            </div>
          </div>

          {/* Grid de Información Detallada */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 text-xs">
            {/* Beneficiario */}
            <div className="flex items-start justify-between gap-2 border-b border-gray-200/80 pb-2.5">
              <span className="text-gray-500 font-medium">Beneficiario / Personal:</span>
              <span className="font-bold text-gray-900 text-right">
                {pago.proveedor_beneficiario || instructorNombre || "—"}
              </span>
            </div>

            {/* Fecha de Pago */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                Fecha de Pago:
              </span>
              <span className="font-semibold text-gray-800">
                {fmtFecha(pago.fecha_pago)}
              </span>
            </div>

            {/* Categoría Contable */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
              <span className="text-gray-500 font-medium">Categoría Contable:</span>
              <span className="font-semibold text-gray-800">
                {pago.categoria || "Personal"} {pago.subcategoria ? `(${pago.subcategoria})` : ""}
              </span>
            </div>

            {/* Concepto / Motivo */}
            <div className="border-b border-gray-200/80 pb-2.5 space-y-1">
              <span className="text-gray-500 font-medium block">Concepto / Motivo del Pago:</span>
              <p className="font-semibold text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 leading-relaxed text-xs">
                {pago.descripcion || "Sin descripción registrada"}
              </p>
            </div>

            {/* Notas / Referencia */}
            {(pago.notas || pago.comprobante_numero || pago.referencia) && (
              <div className="space-y-1">
                <span className="text-gray-500 font-medium block">Notas y Referencia Bancaria:</span>
                <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-200 text-xs font-mono">
                  {pago.notas || pago.comprobante_numero || pago.referencia}
                </p>
              </div>
            )}
          </div>

          {/* Comprobante Digital */}
          <div>
            <span className="block text-xs font-bold text-gray-700 mb-2">Comprobante de Pago Adjunto</span>
            {comprobanteUrl ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                {isImage ? (
                  <div className="space-y-2">
                    <img
                      src={comprobanteUrl}
                      alt="Comprobante digital"
                      className="w-full max-h-64 rounded-lg object-contain bg-white border border-gray-200"
                    />
                    <div className="flex justify-end">
                      <a
                        href={comprobanteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#fd761a] hover:underline"
                      >
                        <ExternalLink size={13} />
                        Abrir comprobante en nueva pestaña
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <FileText size={18} className="text-[#fd761a]" />
                      <span>Documento de respaldo digital adjunto</span>
                    </div>
                    <a
                      href={comprobanteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink size={13} />
                      Ver Documento
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                <Image size={24} className="mx-auto mb-1 text-gray-300" />
                No se adjuntó archivo digital de comprobante para este egreso.
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {pago.id ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate(`/finanzas/egresos/${pago.id}`)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#fd761a] transition"
              >
                <ExternalLink size={13} />
                Ver en módulo de Finanzas
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100 active:scale-[0.98]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
