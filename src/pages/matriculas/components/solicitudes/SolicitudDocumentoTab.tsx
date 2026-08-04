/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, Edit01Icon, Upload05Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { Section } from "../../AprobacionHelpers"
import { fixImageUrl } from "../../AprobacionUtils"

interface SolicitudDocumentoTabProps {
  selected: any
  cedulaRef: React.RefObject<HTMLInputElement | null>
  handleUploadCedula: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingCedula: boolean
  deletingCedula: boolean
  setDeleteArchivoModal: (val: { type: "comprobante" | "cedula"; label: string } | null) => void
  setExpandedImageUrl: (url: string | null) => void
}

export function SolicitudDocumentoTab({ selected, cedulaRef, handleUploadCedula, uploadingCedula,
  deletingCedula, setDeleteArchivoModal, setExpandedImageUrl }: SolicitudDocumentoTabProps) {
  return (
    <Section title="Copia de Cédula" icon={Image01Icon}>
      <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        {selected.pago?.comprobante?.cedula_url && !selected.pago?.comprobante?.cedula_purgado ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium opacity-40">Imagen actual</span>
              <div className="flex items-center gap-2">
                <button onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
                  className="flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS.ACCENT }}>
                  <HugeiconsIcon icon={Edit01Icon} size={12} />Cambiar
                </button>
                <button onClick={() => setDeleteArchivoModal({ type: "cedula", label: "cédula de identidad" })} disabled={deletingCedula}
                  className="flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                  style={{ color: "oklch(0.50 0.15 10)" }}>
                  {deletingCedula ? "..." : "✕ Eliminar"}
                </button>
              </div>
            </div>
            <img src={fixImageUrl(selected.pago.comprobante.cedula_url)} alt="Cédula"
              className="w-full object-contain max-h-[400px] rounded-xl border cursor-pointer" style={{ borderColor: COLORS.BORDER_SUBTLE }}
              onError={() => setExpandedImageUrl(null)}
              onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.cedula_url))} />
          </div>
        ) : selected.pago?.comprobante?.cedula_purgado ? (
          <div className="p-5 rounded-xl border text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              <HugeiconsIcon icon={Image01Icon} size={12} />
              Cédula eliminada del almacenamiento
            </span>
          </div>
        ) : (
          <div className="p-5 rounded-xl border border-dashed text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <p className="text-sm mb-3" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</p>
            <button type="button" onClick={() => cedulaRef.current?.click()} disabled={uploadingCedula}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97]"
              style={{ backgroundColor: COLORS.ACCENT, opacity: uploadingCedula ? 0.6 : 1 }}>
              <HugeiconsIcon icon={Upload05Icon} size={14} className="inline mr-1.5" />
              {uploadingCedula ? "Subiendo..." : "Subir foto de cédula"}
            </button>
          </div>
        )}
        <input ref={cedulaRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCedula} />
      </div>
    </Section>
  )
}
