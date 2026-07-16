import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { GraduationCapIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"

interface TipoStepProps {
  availableTipos: Array<{ key: string; label: string; desc: string; categoria: string }>
  selectedTipo: string
  loadingCursos: boolean
  selectedModalidad: string
  selectedCiudadNombre: string
  onSelect: (tipo: string) => void
  onBack: () => void
}

export function TipoStep({ availableTipos, selectedTipo, loadingCursos, selectedModalidad, selectedCiudadNombre, onSelect, onBack }: TipoStepProps) {
  return (
    <motion.div
      key="tipo"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Modalidad:</span>
        <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedModalidad === "presencial" ? "Presencial" : "Virtual"}</span>
        {selectedModalidad === "presencial" && (
          <>
            <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>|</span>
            <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Ciudad:</span>
            <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedCiudadNombre}</span>
          </>
        )}
        <button onClick={onBack} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
      </div>
      <p className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Selecciona el tipo de programa que deseas estudiar</p>
      {loadingCursos ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-gray-50 border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          ))}
        </div>
      ) : availableTipos.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay programas disponibles para esta modalidad{selectedModalidad === "presencial" && selectedCiudadNombre ? " y ciudad" : ""}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {availableTipos.map(t => (
            <button key={t.key} onClick={() => onSelect(t.key)}
              className="rounded-xl border-2 p-6 text-center cursor-pointer transition-all hover:shadow-md active:scale-[0.98] hover-orange"
              style={{ borderColor: selectedTipo === t.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedTipo === t.key ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white" }}>
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: selectedTipo === t.key ? `color-mix(in srgb, ${COLORS.ACCENT} 15%, transparent)` : "oklch(0.93 0 0)" }}>
                <HugeiconsIcon icon={GraduationCapIcon} size={22}
                  style={{ color: selectedTipo === t.key ? COLORS.ACCENT : "oklch(0.55 0 0)" }} />
              </div>
              <div className="text-sm font-bold" style={{ color: selectedTipo === t.key ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                {t.label}
              </div>
              <div className="text-[11px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>{t.desc}</div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
