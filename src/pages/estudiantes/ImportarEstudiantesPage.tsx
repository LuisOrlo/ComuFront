import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { queryClient } from "@/lib/queryClient"
import {
  studentImportService,
  type ImportExecutionResponse,
  type ImportPreviewResponse,
  type ImportPreviewRow,
} from "@/services/student-import.service"
import { StudentImportUploadStep } from "./import/StudentImportUploadStep"
import { StudentImportMappingStep } from "./import/StudentImportMappingStep"
import { StudentImportAcademicOptionsStep } from "./import/StudentImportAcademicOptionsStep"
import { StudentImportFinanceStep } from "./import/StudentImportFinanceStep"
import { StudentImportPreviewStep } from "./import/StudentImportPreviewStep"
import { StudentImportResultStep } from "./import/StudentImportResultStep"

type StepKey = "upload" | "mapping" | "academic" | "finance" | "preview" | "result"

interface StepItem {
  id: StepKey
  num: number
  title: string
  subtitle: string
}

const STEPS: StepItem[] = [
  { id: "upload", num: 1, title: "Archivo", subtitle: "Carga base" },
  { id: "mapping", num: 2, title: "Columnas", subtitle: "Mapeo" },
  { id: "academic", num: 3, title: "Matrícula", subtitle: "Cursos" },
  { id: "finance", num: 4, title: "Finanzas", subtitle: "Saldos" },
  { id: "preview", num: 5, title: "Revisión", subtitle: "Validación" },
  { id: "result", num: 6, title: "Resultado", subtitle: "Confirmación" },
]

export function ImportarEstudiantesPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<StepKey>("upload")
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [academicOptions, setAcademicOptions] = useState<Record<string, unknown> | null>(null)
  const [execution, setExecution] = useState<ImportExecutionResponse | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 1: Subir y analizar archivo
  const handleUpload = async (selectedFile: File) => {
    setLoading(true)
    try {
      const data = await studentImportService.preview(selectedFile)
      setPreview(data)
      setMapping(data.suggested_mapping)
      setStep("mapping")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo leer el archivo."))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Confirmar mapeo
  const handleMapping = async () => {
    if (!preview) return
    setLoading(true)
    try {
      setStep("academic")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo validar el mapeo."))
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Opciones académicas
  const handleAcademicOptions = async (options: Record<string, unknown>) => {
    if (!preview) return
    setAcademicOptions(options)
    if ((options.finance as Record<string, unknown> | undefined)?.enabled) {
      setStep("finance")
      return
    }
    setLoading(true)
    try {
      const data = await studentImportService.preview(undefined, preview.preview_id, mapping, options)
      setPreview(data)
      setStep("preview")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo validar la configuración académica."))
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Opciones financieras
  const handleFinanceOptions = async (finance: Record<string, unknown>) => {
    if (!preview || !academicOptions) return
    setLoading(true)
    try {
      const data = await studentImportService.preview(undefined, preview.preview_id, mapping, academicOptions, finance)
      setPreview(data)
      setStep("preview")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo validar la configuración financiera."))
    } finally {
      setLoading(false)
    }
  }

  // Step 5: Ejecutar importación confirmada
  const handleExecute = async (
    rows: ImportPreviewRow[],
    decisions: Record<number, Record<string, unknown>>
  ) => {
    if (!preview) return
    setLoading(true)
    try {
      const confirmedRows = rows.map((row) => ({
        row_number: row.row_number,
        ...(decisions[row.row_number] || { skip: row.status === "BLOCKED" }),
      }))
      const result = await studentImportService.execute(preview.preview_id, confirmedRows)
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] })
      queryClient.invalidateQueries({ queryKey: ["cursos"] })
      queryClient.invalidateQueries({ queryKey: ["talleres"] })
      setExecution(result)
      setStep("result")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo ejecutar la importación."))
    } finally {
      setLoading(false)
    }
  }

  // Determinar índice actual para el stepper
  const currentStepIndex = useMemo(() => {
    return STEPS.findIndex((s) => s.id === step)
  }, [step])

  // Navegar al paso anterior
  const handleGoBack = () => {
    if (step === "mapping") {
      setStep("upload")
    } else if (step === "academic") {
      setStep("mapping")
    } else if (step === "finance") {
      setStep("academic")
    } else if (step === "preview") {
      const hasFinance = Boolean(
        preview?.finance?.enabled || (academicOptions?.finance as Record<string, unknown> | undefined)?.enabled
      )
      setStep(hasFinance ? "finance" : "academic")
    } else if (step === "result") {
      navigate("/estudiantes")
    }
  }

  // Permitir clic en pasos completados anteriores
  const handleStepClick = (targetStep: StepKey) => {
    if (step === "result") return
    const targetIndex = STEPS.findIndex((s) => s.id === targetStep)
    if (targetIndex < currentStepIndex) {
      if (
        targetStep === "finance" &&
        !preview?.finance?.enabled &&
        !(academicOptions?.finance as Record<string, unknown> | undefined)?.enabled
      ) {
        return
      }
      setStep(targetStep)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Barra de progreso de Pasos (Stepper) */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#c6c6cd]/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#c6c6cd]/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fd761a] animate-pulse" />
              <h1 className="font-bold text-base sm:text-lg text-[#0b1c30]">
                Proceso de Importación Inteligente
              </h1>
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              {currentStepIndex > 0 && step !== "result" && (
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#c6c6cd]/40 bg-white font-bold text-[#0b1c30] hover:bg-[#eff4ff] hover:border-[#fd761a]/40 transition-all shadow-xs cursor-pointer"
                  title="Regresar al paso anterior"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
                  <span>Paso anterior</span>
                </button>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-[#eff4ff] text-[#0b1c30] font-bold">
                Paso {currentStepIndex + 1} de {STEPS.length} · {STEPS[currentStepIndex].title}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (step === "result" && execution) {
                    navigate("/estudiantes", {
                      state: {
                        imported: true,
                        count: execution.summary?.imported,
                      },
                    })
                  } else {
                    navigate("/estudiantes")
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#76777d] hover:text-[#ba1a1a] hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <span>{step === "result" ? "Finalizar" : "Cancelar y salir"}</span>
              </button>
            </div>
          </div>

          {/* Grid de Pasos */}
          <div className="pt-4">
            <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {STEPS.map((s, index) => {
                const isCurrent = s.id === step
                const isCompleted = currentStepIndex > index
                const isClickable =
                  isCompleted &&
                  step !== "result" &&
                  !(
                    s.id === "finance" &&
                    !preview?.finance?.enabled &&
                    !(academicOptions?.finance as Record<string, unknown> | undefined)?.enabled
                  )

                return (
                  <li
                    key={s.id}
                    onClick={() => isClickable && handleStepClick(s.id)}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-[#eff4ff] border border-[#fd761a]/30"
                        : isClickable
                        ? "opacity-90 hover:bg-[#eff4ff] cursor-pointer hover:shadow-xs group"
                        : "opacity-40 select-none"
                    }`}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    title={isClickable ? `Volver al paso ${s.num}: ${s.title}` : undefined}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                        isCurrent
                          ? "bg-[#fd761a] text-white shadow-md ring-2 ring-[#fd761a]/30"
                          : isCompleted
                          ? "bg-[#dce9ff] text-[#009668] group-hover:scale-110"
                          : "bg-gray-100 text-[#76777d]"
                      }`}
                    >
                      {isCompleted ? (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                      ) : (
                        s.num
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span
                        className={`text-xs font-bold truncate ${
                          isClickable ? "group-hover:text-[#fd761a]" : "text-[#0b1c30]"
                        }`}
                      >
                        {s.title}
                      </span>
                      <span
                        className={`text-[10px] truncate ${
                          isCurrent
                            ? "text-[#fd761a] font-bold"
                            : isCompleted
                            ? "text-[#009668]"
                            : "text-[#76777d]"
                        }`}
                      >
                        {isCurrent ? "En curso" : isCompleted ? (isClickable ? "Clic para volver" : "Completado") : s.subtitle}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Paso 1: Carga */}
        {step === "upload" && (
          <StudentImportUploadStep loading={loading} onSubmit={handleUpload} />
        )}

        {/* Paso 2: Mapeo */}
        {step === "mapping" && preview && (
          <StudentImportMappingStep
            headers={preview.headers}
            sampleRows={preview.sample_rows}
            mapping={mapping}
            loading={loading}
            onChange={setMapping}
            onBack={() => setStep("upload")}
            onSubmit={handleMapping}
          />
        )}

        {/* Paso 3: Opciones Académicas */}
        {step === "academic" && (
          <StudentImportAcademicOptionsStep
            loading={loading}
            onBack={() => setStep("mapping")}
            onSubmit={handleAcademicOptions}
          />
        )}

        {/* Paso 4: Finanzas */}
        {step === "finance" && preview && academicOptions && (
          <StudentImportFinanceStep
            headers={preview.headers}
            courseId={String(academicOptions.curso_abierto_id)}
            loading={loading}
            onBack={() => setStep("academic")}
            onSubmit={handleFinanceOptions}
          />
        )}

        {/* Paso 5: Previsualización */}
        {step === "preview" && preview?.rows && (
          <StudentImportPreviewStep
            rows={preview.rows}
            enrollment={preview.enrollment}
            finance={preview.finance}
            loading={loading}
            onBack={() =>
              setStep(preview.finance?.enabled ? "finance" : "academic")
            }
            onSubmit={handleExecute}
          />
        )}

        {/* Paso 6: Resultado */}
        {step === "result" && execution && (
          <StudentImportResultStep
            result={execution}
            onClose={() => {
              navigate("/estudiantes", {
                state: {
                  imported: true,
                  count: execution.summary?.imported,
                },
              })
            }}
          />
        )}
      </main>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string): string {
  const response = (
    error as {
      response?: {
        data?: {
          message?: string
          mensaje?: string
          errors?: Record<string, string[]>
        }
      }
    }
  )?.response?.data
  if (response?.message || response?.mensaje) return response.message || response.mensaje || fallback
  const firstError = response?.errors && Object.values(response.errors).flat()[0]
  return firstError || fallback
}
