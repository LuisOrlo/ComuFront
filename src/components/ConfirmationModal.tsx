import { AlertTriangle, Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  icon?: "trash" | "warning" | "info" | "danger"
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  icon = "warning",
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (icon) {
      case "trash":
      case "danger":
        return <Trash2 size={32} style={{ color: "#ef4444" }} />
      case "warning":
        return <AlertTriangle size={32} style={{ color: "#f59e0b" }} />
      case "info":
      default:
        return <AlertTriangle size={32} style={{ color: COLORS.ACCENT }} />
    }
  }

  const getButtonColor = () => {
    if (isDangerous) return "#ef4444"
    return COLORS.ACCENT
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header con icono */}
        <div 
          className="px-6 py-8 flex flex-col items-center text-center"
          style={{ backgroundColor: isDangerous ? "rgba(239, 68, 68, 0.05)" : `color-mix(in srgb, ${COLORS.ACCENT} 5%, white)` }}
        >
          <div className="mb-4 p-3 rounded-full" style={{ backgroundColor: isDangerous ? "rgba(239, 68, 68, 0.1)" : `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}>
            {getIcon()}
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.CHARCOAL }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            {message}
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MUTED, opacity: isLoading ? 0.5 : 1 }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-95"
            style={{
              backgroundColor: getButtonColor(),
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
