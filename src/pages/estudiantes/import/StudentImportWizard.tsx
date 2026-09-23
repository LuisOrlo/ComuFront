import { useMemo, useState } from "react"
import { toast } from "sonner"
import { studentImportService, type ImportExecutionResponse, type ImportPreviewResponse, type ImportPreviewRow } from "@/services/student-import.service"
import { StudentImportUploadStep } from "./StudentImportUploadStep"
import { StudentImportMappingStep } from "./StudentImportMappingStep"
import { StudentImportAcademicOptionsStep } from "./StudentImportAcademicOptionsStep"
import { StudentImportFinanceStep } from "./StudentImportFinanceStep"
import { StudentImportPreviewStep } from "./StudentImportPreviewStep"
import { StudentImportResultStep } from "./StudentImportResultStep"

interface Props {
  open: boolean
  onClose: () => void
}

export function StudentImportWizard({ open, onClose }: Props) {
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [execution, setExecution] = useState<ImportExecutionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"upload" | "mapping" | "academic" | "finance" | "preview" | "result">("upload")
  const [academicOptions, setAcademicOptions] = useState<Record<string, unknown> | null>(null)

  const reset = () => {
    setPreview(null)
    setMapping({})
    setExecution(null)
    setAcademicOptions(null)
    setStep("upload")
    setLoading(false)
  }

  const close = () => {
    reset()
    onClose()
  }

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

  const handleExecute = async (rows: ImportPreviewRow[], decisions: Record<number, Record<string, unknown>>) => {
    if (!preview) return
    setLoading(true)
    try {
      const confirmedRows = rows.map((row) => ({
        row_number: row.row_number,
        ...(decisions[row.row_number] || { skip: row.status === "BLOCKED" }),
      }))
      const result = await studentImportService.execute(preview.preview_id, confirmedRows)
      setExecution(result)
      setStep("result")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo ejecutar la importación."))
    } finally {
      setLoading(false)
    }
  }

  const title = useMemo(() => ({
    upload: "Importar estudiantes",
    mapping: "Mapear columnas",
    academic: "Configuración académica",
    preview: "Revisar previsualización",
    finance: "Configuración financiera",
    result: "Resultado de importación",
  }[step]), [step])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#0b1c30]">{title}</h2>
            <p className="text-xs text-gray-500">Matrícula y finanzas históricas son opcionales.</p>
          </div>
          <button type="button" onClick={close} className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Cerrar</button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {step === "upload" && <StudentImportUploadStep loading={loading} onSubmit={handleUpload} />}
          {step === "mapping" && preview && (
            <StudentImportMappingStep
              headers={preview.headers}
              mapping={mapping}
              loading={loading}
              onChange={setMapping}
              onBack={() => setStep("upload")}
              onSubmit={handleMapping}
            />
          )}
          {step === "academic" && <StudentImportAcademicOptionsStep loading={loading} onBack={() => setStep("mapping")} onSubmit={handleAcademicOptions} />}
          {step === "finance" && preview && academicOptions && <StudentImportFinanceStep headers={preview.headers} courseId={String(academicOptions.curso_abierto_id)} loading={loading} onBack={() => setStep("academic")} onSubmit={handleFinanceOptions} />}
          {step === "preview" && preview?.rows && (
            <StudentImportPreviewStep
              rows={preview.rows}
              enrollment={preview.enrollment}
              finance={preview.finance}
              loading={loading}
              onBack={() => setStep(preview.finance?.enabled ? "finance" : "academic")}
              onSubmit={handleExecute}
            />
          )}
          {step === "result" && execution && <StudentImportResultStep result={execution} onClose={close} />}
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; mensaje?: string; errors?: Record<string, string[]> } } })?.response?.data
  if (response?.message || response?.mensaje) return response.message || response.mensaje || fallback
  const firstError = response?.errors && Object.values(response.errors).flat()[0]
  return firstError || fallback
}
