import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  SecurityCheckIcon,
  CheckmarkCircle02Icon,
  FileCheckIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

interface TerminosCondicionesModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept?: () => void
}

export function TerminosCondicionesModal({
  isOpen,
  onClose,
  onAccept,
}: TerminosCondicionesModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border overflow-hidden"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 bg-slate-50/70" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` }}
            >
              <HugeiconsIcon icon={SecurityCheckIcon} size={22} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Términos y Tratamiento de Datos
              </h3>
              <p className="text-[11px] text-slate-500">
                Conforme a la Ley Orgánica de Protección de Datos Personales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 flex items-start gap-2.5">
            <HugeiconsIcon icon={FileCheckIcon} size={18} className="text-[#fd761a] shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-orange-950 font-medium">
              Al postular a nuestros programas académicos, autorizas a Comuníkate al tratamiento legítimo y confidencial de tu información y documentos de identidad.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* 1. Finalidad */}
            <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                <span className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">1</span>
                Finalidad del Tratamiento de Datos
              </h4>
              <p className="text-slate-600 text-[11.5px]">
                Los datos personales ingresados (nombres, cédula/DNI, teléfono, correo y fotografía o copia de cédula) serán utilizados exclusivamente para gestionar tu solicitud de matrícula, validar tu identidad en el registro estudiantil, procesar comprobantes de pago y emitir las certificaciones académicas pertinentes.
              </p>
            </div>

            {/* 2. Confidencialidad */}
            <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                <span className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">2</span>
                Confidencialidad y Seguridad
              </h4>
              <p className="text-slate-600 text-[11.5px]">
                La institución aplica medidas técnicas y organizativas para resguardar la seguridad de tus datos. En ningún caso tu información será transferida, comercializada o cedida a terceras partes sin tu consentimiento expreso, salvaguardando tu derecho a la intimidad.
              </p>
            </div>

            {/* 3. Veracidad */}
            <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                <span className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">3</span>
                Veracidad y Legitimidad de los Documentos
              </h4>
              <p className="text-slate-600 text-[11.5px]">
                El solicitante declara bajo juramento que los datos ingresados son fidedignos y que la documentación adjunta (cédula o DNI) corresponde legalmente a su persona o a su representado, asumiendo la responsabilidad ante eventuales inconsistencias.
              </p>
            </div>

            {/* 4. Derechos del Titular */}
            <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/40">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-xs">
                <span className="size-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">4</span>
                Derechos del Titular (Acceso y Rectificación)
              </h4>
              <p className="text-slate-600 text-[11.5px]">
                De conformidad con la ley establecida, puedes ejercer en cualquier momento tus derechos de acceso, actualización o rectificación de datos personales comunicándote directamente a través de los canales de secretaría y soporte de la institución.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/50" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept()
                onClose()
              }}
              className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
              <span>Aceptar y Continuar</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
