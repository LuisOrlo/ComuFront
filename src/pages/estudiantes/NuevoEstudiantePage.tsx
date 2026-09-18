import { useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import { estudiantesService } from "@/services/estudiantes.service"
import { StudentForm, type StudentFormValues } from "./components/StudentForm"
import { NuevaMatriculaPage } from "../matriculas/NuevaMatriculaPage"

interface NuevoEstudiantePageProps {
  mode?: "independiente" | "inscribir"
}

export function NuevoEstudiantePage({ mode = "independiente" }: NuevoEstudiantePageProps) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [existingStudentId, setExistingStudentId] = useState<string | null>(null)

  const handleSubmit = async (values: StudentFormValues) => {
    setSaving(true)
    setExistingStudentId(null)
    try {
      const estudiante = await estudiantesService.createEstudiante({
        nombres: values.nombres,
        apellidos: values.apellidos,
        cedula: values.cedula || undefined,
        correo: values.correo || undefined,
        celular: values.celular || undefined,
        ciudad_id: values.ciudad_id ? Number(values.ciudad_id) : undefined,
        ciudad: values.ciudad || undefined,
        notas_internas: values.notas_internas || undefined,
        ocupacion: values.ocupacion || undefined,
        direccion: values.direccion || undefined,
        estado_civil: values.estado_civil || undefined,
        edad: values.edad ? Number(values.edad) : undefined,
        nivel_educativo: values.nivel_educativo || undefined,
        archivo_cedula: values.archivo_cedula || undefined,
      })
      toast.success("Estudiante registrado correctamente")
      navigate(mode === "inscribir" ? `/estudiantes/${estudiante.id}/inscribir` : `/estudiantes/${estudiante.id}/academico`)
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { mensaje?: string; message?: string; estudiante_id?: string; errors?: Record<string, string[]> } } })?.response?.data
      const validationErrors = response?.errors ? Object.values(response.errors).flat().join(" ") : ""
      if (response?.estudiante_id) {
        setExistingStudentId(response.estudiante_id)
        toast.error("Ya existe un estudiante con esta cédula.")
      } else {
        toast.error(validationErrors || response?.mensaje || response?.message || "No se pudo registrar el estudiante")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full overflow-y-auto bg-[#f8f9ff] text-[#0b1c30]">
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#73747b]">
              
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: COLORS.CHARCOAL }}>
              {mode === "inscribir" ? "Registrar e inscribir estudiante" : "Registrar estudiante"}
            </h1>
            <p className="mt-1 text-sm text-[#73747b]">
              {mode === "inscribir"
                ? "Crea el expediente y continúa con curso, oferta y pago administrativo."
                : "Crea el expediente sin curso, matrícula, solicitud ni pago."}
            </p>
          </div>
          <button type="button" onClick={() => navigate("/estudiantes")} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-[#73747b] transition-colors hover:bg-[#eff4ff] hover:text-[#0b1c30]" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            <span className="hidden sm:inline">Volver</span>
          </button>
        </div>

        <section className="mb-6 flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm" style={{ border: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e5eeff]" style={{ color: COLORS.ACCENT }}>
            <HugeiconsIcon icon={UserAdd01Icon} size={23} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>
              {mode === "inscribir" ? "Nuevo expediente" : "Expediente independiente"}
            </h2>
            <p className="mt-1 text-sm text-[#73747b]">
              {mode === "inscribir"
                ? "Primero se crea Persona + PerfilEstudiante; después elegirás curso, curso personalizado o taller y configurarás el pago."
                : "El registro no genera matrícula, solicitud ni movimientos financieros."}
            </p>
          </div>
        </section>

        {mode === "inscribir" && existingStudentId && (
          <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-amber-900">Ya existe un estudiante con esta cédula.</h2>
              <p className="mt-1 text-sm text-amber-800">No se creó un duplicado. Puedes continuar con su inscripción.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/estudiantes/${existingStudentId}/inscribir`)}
              className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-800"
            >
              Inscribir estudiante existente
            </button>
          </section>
        )}

        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6" style={{ border: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
          <StudentForm
            saving={saving}
            submitLabel={mode === "inscribir" ? "Guardar y continuar" : undefined}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/estudiantes")}
          />
        </section>
      </main>
    </div>
  )
}

export function NuevoEstudianteInscripcionPage() {
  return <NuevaMatriculaPage adminMode />
}
