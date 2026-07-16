import { motion } from "motion/react"
import { COLORS } from "@/lib/constants"
import type { CatalogoCurso, CursoAbierto } from "@/services/cursos.service"

interface CatalogoStepProps {
  catalogos: CatalogoCurso[]
  cursosAbiertos: CursoAbierto[]
  selectedModalidad: string
  selectedCiudadNombre: string
  selectedTipo: string
  catalogoFilter: string
  loadingCursos: boolean
  onSelect: (id: string, nombre: string) => void
  onBack: () => void
}

export function CatalogoStep({ catalogos, cursosAbiertos, selectedModalidad, selectedCiudadNombre, selectedTipo, catalogoFilter, loadingCursos, onSelect, onBack }: CatalogoStepProps) {
  return (
    <motion.div
      key="catalogo"
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
        <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>|</span>
        <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Categoria:</span>
        <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedTipo === "curso" ? "Curso" : selectedTipo === "taller" ? "Taller" : "Personalizado"}</span>
        <button onClick={onBack} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
      </div>
      <p className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Selecciona el {selectedTipo === "taller" ? "taller" : selectedTipo === "personalizado" ? "curso personalizado" : "curso"} que deseas estudiar</p>
      {loadingCursos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-lg bg-gray-50 border animate-pulse" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          ))}
        </div>
      ) : catalogos.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay cursos disponibles</div>
      ) : (() => {
        const availableCatalogoIds = new Set(cursosAbiertos.map(c => c.catalogo?.id).filter(Boolean))
        const filtrados = catalogos
          .filter(c => c.es_activo !== false)
          .filter(c => c.categoria === (selectedTipo === "curso" ? "regular" : selectedTipo))
          .filter(c => availableCatalogoIds.has(c.id))
        if (filtrados.length === 0) {
          return <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay {selectedTipo === "curso" ? "cursos" : selectedTipo === "taller" ? "talleres" : "cursos personalizados"} disponibles para esta ciudad y modalidad</div>
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {filtrados.map(cat => (
              <button key={cat.id} onClick={() => onSelect(cat.id, cat.nombre)}
                className="rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md text-left active:scale-[0.98] hover-orange"
                style={{ borderColor: catalogoFilter === cat.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: catalogoFilter === cat.id ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold leading-snug" style={{ color: catalogoFilter === cat.id ? COLORS.ACCENT : COLORS.CHARCOAL }}>{cat.nombre}</span>
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                    backgroundColor: cat.categoria === "regular" ? "oklch(0.92 0.08 220)" : cat.categoria === "taller" ? "oklch(0.92 0.05 80)" : "oklch(0.92 0.05 160)",
                    color: cat.categoria === "regular" ? "oklch(0.45 0.12 220)" : cat.categoria === "taller" ? "oklch(0.55 0.12 70)" : "oklch(0.45 0.12 160)"
                  }}>
                    {cat.categoria === "regular" ? "Curso" : cat.categoria === "taller" ? "Taller" : "Personalizado"}
                  </span>
                </div>
                {cat.descripcion && <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color: COLORS.TEXT_MUTED }}>{cat.descripcion}</p>}
              </button>
            ))}
          </div>
        )
      })()}
    </motion.div>
  )
}
