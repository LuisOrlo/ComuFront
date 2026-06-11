import { useState, useRef } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon, CheckmarkCircle02Icon, AlertCircleIcon, Cancel01Icon, Alert01Icon } from "@hugeicons/core-free-icons"
import { estudiantesService, type ImportValidateResult } from "@/services/estudiantes.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

interface StudentImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

type ImportStep = "upload" | "preview" | "result"

export function StudentImportModal({ open, onOpenChange, onImported }: StudentImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [validateResult, setValidateResult] = useState<ImportValidateResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ creados: number; errores: string[]; total_procesados: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setStep("upload")
    setFile(null)
    setValidateResult(null)
    setImportResult(null)
  }

  const handleFileSelect = (f: File | null) => {
    if (!f) return
    setFile(f)
  }

  const handleValidate = async () => {
    if (!file) return
    setImporting(true)
    try {
      const result = await estudiantesService.validateImport(file)
      setValidateResult(result)
      setStep("preview")
    } catch {
      toast.error("Error al validar el archivo")
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const result = await estudiantesService.importStudents(file)
      setImportResult(result)
      setStep("result")
      if (result.errores.length === 0) {
        toast.success("Importacion completada exitosamente")
        onImported()
      } else {
        toast.warning(`Importacion parcial: ${result.creados} creados, ${result.errores.length} con errores`)
      }
    } catch {
      toast.error("Error en la importacion")
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
    if (importResult && importResult.creados > 0) onImported()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v: boolean) => { if (!v) handleClose() }}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          <HugeiconsIcon icon={FileUploadIcon} size={14} />
          Importar Estudiantes
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-2xl p-0 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
            <div>
              <Dialog.Title className="text-xl font-black text-gray-900">Importar Estudiantes</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">
                {step === "upload" && "Sube un archivo CSV o Excel con la informacion de los estudiantes."}
                {step === "preview" && "Revisa los datos antes de importar."}
                {step === "result" && "Resultado de la importacion."}
              </Dialog.Description>
            </div>
            <button onClick={handleClose} className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>

          <div className="p-8">
            {step === "upload" && (
              <div className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                    dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]) }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div className="size-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HugeiconsIcon icon={FileUploadIcon} size={28} className="text-blue-500" />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-bold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-gray-700">Arrastra un archivo aqui o haz clic</p>
                      <p className="text-sm text-gray-400 mt-1">CSV, XLSX hasta 10MB</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 mb-2">Columnas esperadas:</p>
                  <p className="text-xs text-blue-600 font-mono">nombres, apellidos, cedula, correo, celular</p>
                  <p className="text-xs text-blue-500 mt-1">Solo nombres y apellidos son obligatorios.</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleValidate}
                    disabled={!file || importing}
                    className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    {importing ? "Validando..." : "Validar e Importar"}
                  </button>
                </div>
              </div>
            )}

            {step === "preview" && validateResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl text-center">
                    <div className="text-2xl font-black text-gray-700">{validateResult.total_registros}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total Registros</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl text-center">
                    <div className="text-2xl font-black text-green-600">{validateResult.registros_validos}</div>
                    <div className="text-[10px] font-bold text-green-500 uppercase mt-1">Validos</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl text-center">
                    <div className="text-2xl font-black text-red-500">{validateResult.registros_con_error}</div>
                    <div className="text-[10px] font-bold text-red-400 uppercase mt-1">Con Errores</div>
                  </div>
                </div>

                {validateResult.errores.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">Advertencias</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {validateResult.errores.slice(0, 10).map((err, i) => (
                        <p key={i} className="text-xs text-amber-600">{err}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 font-bold text-gray-400 uppercase">#</th>
                        <th className="px-4 py-3 font-bold text-gray-400 uppercase">Nombres</th>
                        <th className="px-4 py-3 font-bold text-gray-400 uppercase">Apellidos</th>
                        <th className="px-4 py-3 font-bold text-gray-400 uppercase">Cedula</th>
                        <th className="px-4 py-3 font-bold text-gray-400 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {validateResult.vista_previa.map((row) => (
                        <tr key={row.linea} className={row.estado_validacion === 'error' ? 'bg-red-50/50' : ''}>
                          <td className="px-4 py-3 text-gray-500">{row.linea}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{row.nombres}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{row.apellidos}</td>
                          <td className="px-4 py-3 text-gray-600">{row.cedula}</td>
                          <td className="px-4 py-3">
                            {row.estado_validacion === 'valido' ? (
                              <span className="inline-flex items-center gap-1 text-green-600 font-bold text-[10px]">
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} /> Valido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500 font-bold text-[10px]">
                                <HugeiconsIcon icon={Alert01Icon} size={12} /> Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep("upload")} className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Volver
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || validateResult.registros_validos === 0}
                    className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    {importing ? "Importando..." : `Importar ${validateResult.registros_validos} Estudiantes`}
                  </button>
                </div>
              </div>
            )}

            {step === "result" && importResult && (
              <div className="space-y-6 text-center">
                <div className={`size-20 rounded-2xl flex items-center justify-center mx-auto ${
                  importResult.errores.length === 0 ? 'bg-green-50' : 'bg-amber-50'
                }`}>
                  <HugeiconsIcon
                    icon={importResult.errores.length === 0 ? CheckmarkCircle02Icon : AlertCircleIcon}
                    size={36}
                    className={importResult.errores.length === 0 ? 'text-green-500' : 'text-amber-500'}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {importResult.errores.length === 0 ? 'Importacion Exitosa' : 'Importacion Parcial'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    {importResult.creados} de {importResult.total_procesados} estudiantes creados.
                  </p>
                </div>
                {importResult.errores.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-left">
                    <p className="text-xs font-bold text-red-600 mb-2">Errores ({importResult.errores.length}):</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errores.map((err, i) => (
                        <p key={i} className="text-xs text-red-500">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-center gap-3 pt-4">
                  <button onClick={handleClose} className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg" style={{ backgroundColor: COLORS.ACCENT }}>
                    Finalizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
