import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpenIcon, CheckmarkCircle04Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type CursoAbierto } from "@/services/cursos.service"
import { FormularioMatriculaDirecta } from "./components/FormularioMatriculaDirecta"
import { ModalidadBadge } from "@/pages/estudiantes/components/Badges"
import { CiudadBadge } from "@/components/cursos/CiudadBadge"

export function MatriculaCursoPublicaPage() {
  const { id } = useParams<{ id: string }>()
  const [curso, setCurso] = useState<CursoAbierto | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (!id) {
      setErrorMsg("Identificador de curso no proporcionado.")
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMsg(null)
    cursosService
      .getCursoPublico(id)
      .then((data) => {
        setCurso(data)
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          "No se pudo cargar la información del curso solicitado."
        setErrorMsg(msg)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50/50 p-6">
        <div className="size-10 rounded-full border-3 border-orange-100 border-t-[#fd761a] animate-spin mb-4" />
        <span className="text-sm font-semibold text-slate-500">Cargando información del curso...</span>
      </div>
    )
  }

  if (errorMsg || !curso) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50/50 p-6">
        <div
          className="max-w-md w-full bg-white rounded-2xl border p-8 text-center space-y-4 shadow-xs"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="size-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <HugeiconsIcon icon={AlertCircleIcon} size={30} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Curso no encontrado</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {errorMsg || "No hemos podido encontrar el curso especificado. Por favor verifica que el enlace sea correcto."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const nombreCurso = curso.nombre_instancia || curso.catalogo?.nombre || "Curso"

  if (showSuccess) {
    return (
      <div className="min-h-[100dvh] flex flex-col overflow-x-hidden bg-gray-50/50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="max-w-md w-full bg-white rounded-2xl border p-8 text-center space-y-6 shadow-xs"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div
              className="size-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}
            >
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={36} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
                ¡Inscripción Enviada!
              </h2>
              <p className="text-xs font-semibold text-[#fd761a] mt-1 uppercase tracking-wider">
                {nombreCurso}
              </p>
              <p className="text-sm mt-3" style={{ color: COLORS.TEXT_MUTED }}>
                Tu solicitud de matrícula ha sido registrada con éxito. Nuestro equipo validará tu información y comprobante de pago para confirmar tu cupo.
              </p>
            </div>
            <button
              onClick={() => {
                setShowSuccess(false)
                setFormKey((k) => k + 1)
              }}
              className="w-full px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              Realizar otra inscripción en este curso
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden bg-gray-50/50">
      {/* Encabezado */}
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div
              className="size-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}
            >
              <HugeiconsIcon icon={BookOpenIcon} size={22} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-50 text-[#fd761a] border border-orange-200/70">
                  Formulario de Matrícula
                </span>
                <ModalidadBadge modalidad={curso.modalidad} />
                {curso.ciudad?.nombre && <CiudadBadge ciudad={curso.ciudad.nombre} />}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                {nombreCurso}
              </h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                Completa tus datos personales y registra tu pago para asegurar tu cupo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de 2 Pasos */}
      <main className="flex-1 overflow-y-auto">
        <FormularioMatriculaDirecta
          key={formKey}
          curso={curso}
          onSuccess={() => setShowSuccess(true)}
        />
      </main>
    </div>
  )
}
export default MatriculaCursoPublicaPage
