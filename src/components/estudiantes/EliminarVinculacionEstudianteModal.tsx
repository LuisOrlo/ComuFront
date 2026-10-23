import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Trash2,
  BookOpen,
  Calendar,
  Layers,
  UserMinus,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import {
  estudiantesService,
  type ResumenVinculaciones,
} from "@/services/estudiantes.service"
import { cursosService } from "@/services/cursos.service"

export interface ElementoActual {
  tipo: "curso" | "taller" | "servicio" | "estudiante"
  id?: string // id de matricula, inscripcion, reserva o estudiante
  nombre?: string
}

interface EliminarVinculacionEstudianteModalProps {
  isOpen: boolean
  onClose: () => void
  estudianteId?: string
  nombreEstudiante: string
  elementoActual: ElementoActual
  onSuccess?: () => void
}

export function EliminarVinculacionEstudianteModal({
  isOpen,
  onClose,
  estudianteId,
  nombreEstudiante,
  elementoActual,
  onSuccess,
}: EliminarVinculacionEstudianteModalProps) {
  const queryClient = useQueryClient()
  const [loadingResumen, setLoadingResumen] = useState(false)
  const [resumen, setResumen] = useState<ResumenVinculaciones | null>(null)
  const [accionSeleccionada, setAccionSeleccionada] = useState<"solo_este" | "todo">("solo_este")
  const [desvincularEspecificoId, setDesvincularEspecificoId] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)

  const esContextoEstudiante = elementoActual.tipo === "estudiante"

  // Cargar resumen de vinculaciones al abrir el modal
  useEffect(() => {
    if (!isOpen || !estudianteId) {
      setResumen(null)
      setAccionSeleccionada("solo_este")
      setDesvincularEspecificoId("")
      return
    }

    let active = true
    setLoadingResumen(true)

    estudiantesService
      .getVinculaciones(estudianteId)
      .then((data) => {
        if (active) {
          setResumen(data)
          // Si solo tiene 1 vinculación o ninguna más, la única acción lógica es borrar todo de raíz
          if (data.total_vinculaciones <= 1 || esContextoEstudiante) {
            setAccionSeleccionada("todo")
          } else {
            setAccionSeleccionada("solo_este")
          }
          if (data.cursos.length > 0) {
            setDesvincularEspecificoId(data.cursos[0].matricula_id)
          }
        }
      })
      .catch((err) => {
        console.error("Error al obtener vinculaciones del estudiante:", err)
        if (active) setResumen(null)
      })
      .finally(() => {
        if (active) setLoadingResumen(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, estudianteId, esContextoEstudiante])

  if (!isOpen) return null

  // Calcular si tiene múltiples vinculaciones
  const esUnicaVinculacion = !resumen || resumen.total_vinculaciones <= 1

  // Filtrar otras vinculaciones para no mostrar el elemento actual redundante
  const otrosCursos = esContextoEstudiante
    ? resumen?.cursos || []
    : resumen?.cursos.filter(
        (c) => c.matricula_id !== elementoActual.id && c.curso_id !== elementoActual.id
      ) || []

  const otrosTalleres = esContextoEstudiante
    ? resumen?.talleres || []
    : resumen?.talleres.filter(
        (t) => t.inscripcion_id !== elementoActual.id
      ) || []

  const otrosServicios = esContextoEstudiante
    ? resumen?.servicios || []
    : resumen?.servicios.filter(
        (s) => s.id !== elementoActual.id
      ) || []

  const totalOtrasVinculaciones =
    otrosCursos.length + otrosTalleres.length + otrosServicios.length

  const handleConfirm = async () => {
    setIsExecuting(true)
    try {
      if (accionSeleccionada === "todo" || esUnicaVinculacion) {
        // Borrado total definitivo
        if (estudianteId) {
          await estudiantesService.deleteStudent(estudianteId)
          toast.success(
            "Estudiante y todos sus registros fueron eliminados del sistema exitosamente"
          )
        } else if (elementoActual.id) {
          // Fallback si no hay estudianteId
          await cursosService.eliminarMatricula(elementoActual.id)
          toast.success("Desmatriculado exitosamente")
        }
      } else {
        // Desvincular solo del elemento actual o del específico seleccionado
        const idADesvincular = esContextoEstudiante
          ? desvincularEspecificoId
          : elementoActual.id

        if (idADesvincular) {
          await cursosService.eliminarMatricula(idADesvincular)
          toast.success("Estudiante desmatriculado de la actividad exitosamente")
        } else {
          toast.error("No se pudo identificar la matrícula a desvincular")
          return
        }
      }

      // Invalidar queries para refrescar la UI
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] })
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
      queryClient.invalidateQueries({ queryKey: ["curso"] })
      queryClient.invalidateQueries({ queryKey: ["talleres"] })
      queryClient.invalidateQueries({ queryKey: ["servicios"] })

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error("Error durante la eliminación:", err)
      toast.error("Error al procesar la solicitud. Intenta de nuevo.")
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="px-6 py-6 flex items-start gap-4 border-b"
          style={{
            backgroundColor:
              accionSeleccionada === "todo" || esUnicaVinculacion
                ? "rgba(239, 68, 68, 0.05)"
                : "rgba(245, 158, 11, 0.05)",
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <div
            className="p-3 rounded-xl shrink-0"
            style={{
              backgroundColor:
                accionSeleccionada === "todo" || esUnicaVinculacion
                  ? "rgba(239, 68, 68, 0.12)"
                  : "rgba(245, 158, 11, 0.12)",
              color:
                accionSeleccionada === "todo" || esUnicaVinculacion
                  ? "#ef4444"
                  : "#d97706",
            }}
          >
            {accionSeleccionada === "todo" || esUnicaVinculacion ? (
              <Trash2 size={26} />
            ) : (
              <UserMinus size={26} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {esUnicaVinculacion
                ? "¿Eliminar estudiante del sistema?"
                : "¿Cómo deseas proceder con este estudiante?"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Estudiante: <span className="font-semibold text-slate-700">{nombreEstudiante}</span>
              {elementoActual.nombre && elementoActual.tipo !== "estudiante" && (
                <> · Elemento: <span className="font-semibold text-slate-700">{elementoActual.nombre}</span></>
              )}
            </p>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {loadingResumen ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 size={28} className="animate-spin text-blue-600" />
              <span className="text-xs">Verificando vinculaciones en la academia...</span>
            </div>
          ) : esUnicaVinculacion ? (
            /* CASO 1: Es su única vinculación o no tiene ninguna */
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">
                    {resumen?.total_vinculaciones === 0
                      ? "Sin vinculaciones activas"
                      : "Única vinculación detectada"}
                  </span>
                  {resumen?.total_vinculaciones === 0 ? (
                    <>
                      Este estudiante no tiene ningún curso, taller ni servicio activo registrado.
                      Al confirmar, se <span className="font-semibold">eliminará definitivamente</span> su perfil y ficha de la base de datos.
                    </>
                  ) : (
                    <>
                      Este estudiante solo está inscrito en{" "}
                      <span className="font-bold">
                        {resumen?.cursos[0]?.nombre ||
                          resumen?.talleres[0]?.nombre ||
                          resumen?.servicios[0]?.nombre ||
                          "1 actividad"}
                      </span>{" "}
                      y no tiene otras vinculaciones.
                      Al darlo de baja, se <span className="font-semibold">eliminarán por completo</span> sus registros, asistencias, cuentas y perfil de la base de datos para no dejar registros huérfanos.
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* CASO 2: Múltiples vinculaciones */
            <div className="space-y-4">
              {/* Resumen de vinculaciones activas */}
              {totalOtrasVinculaciones > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Layers size={14} className="text-slate-500" />
                    {esContextoEstudiante
                      ? `Vinculaciones activas de este estudiante (${totalOtrasVinculaciones}):`
                      : `Otras actividades registradas de este estudiante (${totalOtrasVinculaciones}):`}
                  </div>
                  <div className="space-y-1.5">
                    {otrosCursos.map((c) => (
                      <div
                        key={c.matricula_id}
                        className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                          esContextoEstudiante && desvincularEspecificoId === c.matricula_id && accionSeleccionada === "solo_este"
                            ? "bg-blue-50 border-blue-300 text-blue-900"
                            : "bg-white text-slate-600 border-slate-100"
                        }`}
                      >
                        <BookOpen size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate font-medium">{c.nombre}</span>
                        <span className="text-[10px] text-slate-400 ml-auto uppercase">{c.modalidad || "Curso"}</span>
                        {esContextoEstudiante && accionSeleccionada === "solo_este" && (
                          <input
                            type="radio"
                            name="curso_especifico"
                            checked={desvincularEspecificoId === c.matricula_id}
                            onChange={() => setDesvincularEspecificoId(c.matricula_id)}
                            className="ml-2 accent-blue-600 cursor-pointer"
                          />
                        )}
                      </div>
                    ))}
                    {otrosTalleres.map((t) => (
                      <div key={t.inscripcion_id} className="flex items-center gap-2 text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <Calendar size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{t.nombre}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">Taller</span>
                      </div>
                    ))}
                    {otrosServicios.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <CheckCircle2 size={13} className="text-purple-500 shrink-0" />
                        <span className="truncate font-medium">{s.nombre}</span>
                        <span className="text-[10px] text-slate-400 ml-auto capitalize">{s.tipo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Opciones */}
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Selecciona la acción a realizar:
                </label>

                {/* Opción 1: Desvincular solo de un elemento */}
                <div
                  onClick={() => setAccionSeleccionada("solo_este")}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    accionSeleccionada === "solo_este"
                      ? "border-blue-600 bg-blue-50/40"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="accion_eliminacion"
                    checked={accionSeleccionada === "solo_este"}
                    onChange={() => setAccionSeleccionada("solo_este")}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {esContextoEstudiante
                        ? "Desvincular únicamente de un curso seleccionado"
                        : `Desvincular solo de este ${elementoActual.tipo}`}
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                      {esContextoEstudiante
                        ? "Solo se da de baja la matrícula seleccionada arriba. Conservará su perfil y sus demás inscripciones."
                        : `Solo se elimina su matrícula y registros de este ${elementoActual.tipo}. Conservará intactos sus demás cursos, talleres, servicios y su ficha de estudiante.`}
                    </span>
                  </div>
                </div>

                {/* Opción 2: Eliminar completamente de todo */}
                <div
                  onClick={() => setAccionSeleccionada("todo")}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    accionSeleccionada === "todo"
                      ? "border-red-600 bg-red-50/40"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="accion_eliminacion"
                    checked={accionSeleccionada === "todo"}
                    onChange={() => setAccionSeleccionada("todo")}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-700 block flex items-center gap-1.5">
                      Eliminar estudiante y TODO lo relacionado de raíz
                    </span>
                    <span className="text-[11px] text-red-600/80 leading-snug block mt-0.5">
                      ¡Acción definitiva! Se purgará al estudiante de todos los cursos, talleres y servicios, junto con sus cuotas, asistencias y su perfil general de la base de datos.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExecuting || loadingResumen}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ${
              accionSeleccionada === "todo" || esUnicaVinculacion
                ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isExecuting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : accionSeleccionada === "todo" || esUnicaVinculacion ? (
              <>
                <Trash2 size={14} />
                <span>Eliminar definitivamente</span>
              </>
            ) : (
              <>
                <UserMinus size={14} />
                <span>Desvincular de la actividad</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
