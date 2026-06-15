import { useState, useEffect, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Cancel01Icon, AlertCircleIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { estudiantesService, type CursoAlternativo } from "@/services/estudiantes.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

interface MatriculaResumen {
  id: string
  curso: string
  fecha_inscripcion: string
  promedio: number | null
  notas: Array<{ modulo: string; calificacion: number; aprobado: boolean }>
  porcentaje_asistencia: number
}

interface TransferCursoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  matricula: MatriculaResumen
}

const DIAS_MAP: Record<number, string> = {
  1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom",
}

export function TransferCursoModal({ isOpen, onClose, onSuccess, matricula }: TransferCursoModalProps) {
  const [step, setStep] = useState(1)
  const [alternativos, setAlternativos] = useState<CursoAlternativo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(1)
      setSelectedId(null)
      setMotivo("")
      return
    }
    setLoading(true)
    estudiantesService.getAlternativos(matricula.id)
      .then(setAlternativos)
      .catch(() => toast.error("Error al cargar cursos alternativos"))
      .finally(() => setLoading(false))
  }, [isOpen, matricula.id])

  const selected = alternativos.find((a) => a.id === selectedId)

  const handleConfirm = useCallback(async () => {
    if (!selectedId) return
    setSubmitting(true)
    try {
      const result = await estudiantesService.transferirCurso(matricula.id, {
        curso_abierto_nuevo_id: selectedId,
        motivo: motivo || undefined,
      })
      toast.success(result.message || "Transferencia completada")
      onSuccess()
      onClose()
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "Error al realizar la transferencia")
    } finally {
      setSubmitting(false)
    }
  }, [selectedId, matricula.id, motivo, onSuccess, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-sm font-black text-gray-900">
            {step === 1 ? "Seleccionar Curso Destino" : "Confirmar Transferencia"}
          </h2>
          <button onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="divide-y divide-gray-50">
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Origen</p>
                <p className="text-sm font-bold text-gray-900 truncate">{matricula.curso}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                  <span>{matricula.notas.length} módulo{matricula.notas.length !== 1 ? "s" : ""}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Promedio: {matricula.promedio ?? "—"}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Asistencia: {matricula.porcentaje_asistencia}%</span>
                </div>
              </div>

              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="animate-spin size-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs text-gray-400">Buscando cursos disponibles...</p>
                </div>
              ) : alternativos.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <HugeiconsIcon icon={AlertCircleIcon} size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500 font-medium">No hay cursos alternativos disponibles</p>
                  <p className="text-xs text-gray-400 mt-1">Todos los cursos del mismo catálogo están llenos o inactivos.</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 pt-4 pb-2">
                    Destino ({alternativos.length} disponible{alternativos.length !== 1 ? "s" : ""})
                  </p>
                  {alternativos.map((alt) => {
                    const isSelected = selectedId === alt.id
                    return (
                      <button
                        key={alt.id}
                        onClick={() => setSelectedId(alt.id)}
                        className={`w-full text-left px-6 py-3.5 transition-colors border-b border-gray-50 last:border-b-0 ${
                          isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-bold truncate ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                              {alt.nombre_instancia}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-gray-500">
                              {alt.ciudad && <span>{alt.ciudad}</span>}
                              {alt.modalidad && <span className="capitalize">{alt.modalidad}</span>}
                              {alt.horario && (
                                <span>
                                  {alt.horario.dias.map((d: number) => DIAS_MAP[d]).join(" ")}
                                  {" "}{alt.horario.hora_inicio.slice(0, 5)}-{alt.horario.hora_fin.slice(0, 5)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-gray-800">${alt.precio_base.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">{alt.espacios_disponibles} cupo{alt.espacios_disponibles !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Resumen</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-gray-900 truncate">{matricula.curso}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-gray-400 shrink-0" />
                  <span className="font-bold text-blue-700 truncate">{selected?.nombre_instancia}</span>
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Notas a migrar</span>
                  <span className="font-bold text-gray-800">{matricula.notas.length} módulo{matricula.notas.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Asistencias</span>
                  <span className="font-bold text-amber-600">No se transfieren</span>
                </div>
              </div>

              <div className="px-6 py-4">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Motivo (opcional)</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 resize-none"
                  rows={2}
                  placeholder="Ej: Cambio de horario por trabajo"
                />
              </div>

              <div className="px-6 py-4">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Importante</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      La matrícula actual pasará a estado "retirado". Las asistencias no se transfieren al nuevo curso.
                      El monto de la cuenta por cobrar se ajustará automáticamente al precio del nuevo curso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                Continuar
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                Atrás
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                    Transferiendo...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    Confirmar Transferencia
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
