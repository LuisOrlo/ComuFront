import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, GraduationCapIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

interface ModalidadStepProps {
  selectedModalidad: string
  onSelect: (modalidad: string) => void
}

export function ModalidadStep({ selectedModalidad, onSelect }: ModalidadStepProps) {
  return (
    <motion.div
      key="modalidad"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <p className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Selecciona tu modalidad</p>
      <div className="grid grid-cols-2 gap-3">
        {["presencial", "virtual"].map(mod => (
          <button key={mod} onClick={() => onSelect(mod)}
            className="rounded-xl border-2 p-6 text-center cursor-pointer transition-all hover:shadow-md active:scale-[0.98] hover-orange"
            style={{ borderColor: selectedModalidad === mod ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedModalidad === mod ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white" }}>
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: selectedModalidad === mod ? `color-mix(in srgb, ${COLORS.ACCENT} 15%, transparent)` : "oklch(0.93 0 0)" }}>
              <HugeiconsIcon icon={mod === "presencial" ? UserIcon : GraduationCapIcon} size={22}
                style={{ color: selectedModalidad === mod ? COLORS.ACCENT : "oklch(0.55 0 0)" }} />
            </div>
            <div className="text-sm font-bold" style={{ color: selectedModalidad === mod ? COLORS.ACCENT : COLORS.CHARCOAL }}>
              {mod === "presencial" ? "Presencial" : "Virtual"}
            </div>
            <div className="text-[11px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>
              {mod === "presencial" ? "Clases en nuestras instalaciones con instructor en vivo" : "Clases en línea en vivo desde cualquier lugar"}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
