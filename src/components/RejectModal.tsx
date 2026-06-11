import { useState } from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { COLORS } from "@/lib/constants"

interface RejectModalProps {
  isOpen: boolean
  isLoading?: boolean
  onConfirm: (motivo: string) => void | Promise<void>
  onCancel: () => void
}

export function RejectModal({ isOpen, isLoading = false, onConfirm, onCancel }: RejectModalProps) {
  const [motivo, setMotivo] = useState("")

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!motivo.trim()) return
    onConfirm(motivo.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-8 flex flex-col items-center text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
          <div className="mb-4 p-3 rounded-full" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            <HugeiconsIcon icon={Cancel01Icon} size={32} style={{ color: "#ef4444" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.CHARCOAL }}>
            Rechazar Solicitud
          </h2>
          <p className="text-sm mb-4" style={{ color: COLORS.TEXT_MUTED }}>
            Indique el motivo del rechazo
          </p>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Describa el motivo del rechazo..."
            className="w-full px-3 py-2 text-sm border rounded-xl outline-none resize-none"
            style={{ borderColor: COLORS.BORDER_SUBTLE, minHeight: 100 }}
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MUTED, opacity: isLoading ? 0.5 : 1 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !motivo.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-95"
            style={{
              backgroundColor: motivo.trim() ? "#ef4444" : "#d1d5db",
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading || !motivo.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Procesando..." : "Rechazar"}
          </button>
        </div>
      </div>
    </div>
  )
}
