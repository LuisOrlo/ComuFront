import { motion } from "motion/react"
import { COLORS } from "@/lib/constants"

interface CiudadStepProps {
  ciudades: Array<{ id: number; nombre: string }>
  selectedCiudadId: number | null
  loadingCursos: boolean
  onSelect: (id: number, nombre: string) => void
  onBack: () => void
}

export function CiudadStep({ ciudades, selectedCiudadId, loadingCursos, onSelect, onBack }: CiudadStepProps) {
  return (
    <motion.div
      key="ciudad"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Modalidad:</span>
        <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>Presencial</span>
        <button onClick={onBack} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Regresar</button>
      </div>
      <p className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Selecciona la ciudad donde deseas estudiar</p>
      <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>Las ciudades mostradas cuentan actualmente con cursos, talleres o cursos personalizados disponibles.</p>
      {ciudades.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          {loadingCursos ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-lg bg-gray-50 border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              ))}
            </div>
          ) : "No hay ciudades disponibles"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ciudades.map(c => (
            <button key={c.id} onClick={() => onSelect(c.id, c.nombre)}
              className="px-4 py-3 rounded-lg text-sm font-medium border transition-all hover:shadow-sm text-left active:scale-[0.98] hover-orange"
              style={{ borderColor: selectedCiudadId === c.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedCiudadId === c.id ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white", color: selectedCiudadId === c.id ? COLORS.ACCENT : COLORS.CHARCOAL }}>
              {c.nombre}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
