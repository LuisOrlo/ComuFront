import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpenIcon, CheckmarkCircle04Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { NuevaMatriculaPage } from "./NuevaMatriculaPage"

export function NuevaMatriculaPublicaPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [formKey, setFormKey] = useState(0)

  if (showSuccess) {
    return (
      <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-gray-50/50">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border p-8 text-center space-y-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="size-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={36} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>¡Solicitud Enviada!</h2>
              <p className="text-sm mt-2" style={{ color: COLORS.TEXT_MUTED }}>
                Tu solicitud de inscripción ha sido registrada correctamente. Nos pondremos en contacto contigo para informarte sobre el proceso de validación.
              </p>
            </div>
            <button onClick={() => { setShowSuccess(false); setFormKey(k => k + 1) }}
              className="w-full px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              style={{ backgroundColor: COLORS.ACCENT }}>
              Realizar otra inscripción
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}>
              <HugeiconsIcon icon={BookOpenIcon} size={20} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Nueva Matrícula</h1>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Completa tus datos para inscribirte en un curso</p>
            </div>
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto">
        <NuevaMatriculaPage key={formKey} isPublic onSuccess={() => setShowSuccess(true)} />
      </main>
    </div>
  )
}
