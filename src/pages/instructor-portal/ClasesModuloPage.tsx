import { useState, useEffect } from "react"
import { useParams, Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Calendar03Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  instructorService,
  type ClaseItem,
  type ModuloResumen,
} from "@/services/instructor.service"
import { toast } from "sonner"

export function ClasesModuloPage() {
  const { cursoId, moduloId } = useParams<{ cursoId: string; moduloId: string }>()
  const [modulo, setModulo] = useState<ModuloResumen | null>(null)
  const [clases, setClases] = useState<ClaseItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [cursoData, clasesData] = await Promise.all([
        instructorService.getDetalleCurso(cursoId!),
        instructorService.getClasesModulo(moduloId!),
      ])
      const found = cursoData.modulos.find((m) => m.id === moduloId) ?? null
      setModulo(found)
      setClases(clasesData)
    } catch {
      toast.error("Error al cargar las clases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (moduloId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId])

  if (loading)
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando clases...
      </div>
    )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        to={`/instructor/cursos/${cursoId}`}
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: COLORS.TEXT_MUTED }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al curso
      </Link>

      <header className="mb-8">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: COLORS.ACCENT }}
        >
          Programación de Clases
        </span>
        <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
          {modulo?.nombre_modulo ?? "Módulo"}
        </h1>
        <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          Selecciona una fecha para registrar la asistencia.
        </p>
      </header>

      <div className="space-y-3">
        {clases.length === 0 ? (
          <div
            className="bg-white border-dashed rounded-2xl p-12 text-center"
            style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={48}
              className="mx-auto mb-4"
              style={{ color: "oklch(0.9 0 0)" }}
            />
            <p style={{ color: COLORS.TEXT_MUTED }}>
              No hay clases programadas para este módulo.
            </p>
          </div>
        ) : (
          clases.map((clase) => (
            <Link
              key={clase.id}
              to={`/instructor/asistencia/${cursoId}/${clase.id}`}
              className="bg-white rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-all group"
              style={{ borderColor: COLORS.BORDER_SUBTLE, borderWidth: 1 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="size-12 rounded-xl flex flex-col items-center justify-center text-white"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(clase.fecha_clase).toLocaleString("es", {
                      month: "short",
                    })}
                  </span>
                  <span className="text-lg font-black leading-none">
                    {new Date(clase.fecha_clase).getDate()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: COLORS.CHARCOAL }}>
                    {new Date(clase.fecha_clase).toLocaleDateString("es", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    {clase.hora_inicio} - {clase.hora_fin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {clase.asistencia_registrada ? (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
                    style={{
                      color: "oklch(0.45 0.1 150)",
                      backgroundColor: "oklch(0.95 0.03 150)",
                    }}
                  >
                    Registrada
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full uppercase"
                    style={{
                      color: "oklch(0.5 0.08 65)",
                      backgroundColor: "oklch(0.95 0.04 65)",
                    }}
                  >
                    Pendiente
                  </span>
                )}
                <div
                  className="p-2 rounded-lg group-hover:text-white transition-all"
                  style={{
                    backgroundColor: "oklch(0.97 0 0)",
                    color: COLORS.TEXT_MUTED,
                  }}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
