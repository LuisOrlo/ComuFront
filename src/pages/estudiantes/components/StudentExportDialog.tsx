import { useState } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"

const AVAILABLE_FIELDS = [
  { key: "nombres", label: "Nombres" },
  { key: "apellidos", label: "Apellidos" },
  { key: "cedula", label: "Cedula" },
  { key: "correo", label: "Correo" },
  { key: "celular", label: "Celular" },
  { key: "edad", label: "Edad" },
  { key: "direccion", label: "Direccion" },
  { key: "ocupacion", label: "Ocupacion" },
  { key: "estado_civil", label: "Estado Civil" },
  { key: "total_cursos", label: "Total Cursos" },
  { key: "estado_pago", label: "Estado Pago" },
  { key: "saldo_pendiente", label: "Saldo" },
]

export type ExportFormat = "excel" | "pdf"

interface StudentExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds?: string[]
  extraFilters?: Record<string, string | number | undefined>
  title?: string
  description?: string
  defaultFormat?: ExportFormat
}

export function StudentExportDialog({
  open,
  onOpenChange,
  selectedIds,
  extraFilters,
  title = "Exportar Estudiantes",
  description = "Selecciona formato y campos a exportar.",
  defaultFormat,
}: StudentExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat ?? "excel")
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "nombres", "apellidos", "cedula", "correo", "estado_pago", "saldo_pendiente",
  ])
  const [exporting, setExporting] = useState(false)

  const toggleField = (key: string) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) return
    setExporting(true)
    try {
      const blob = await estudiantesService.exportStudents({
        formato: format,
        campos: selectedFields,
        ids: selectedIds?.length ? selectedIds : undefined,
        ...extraFilters,
      } as {
        formato: "csv" | "pdf" | "excel"
        campos?: string[]
        ids?: string[]
        buscar?: string
        estado_pago?: string
      })
      const ext = format === "excel" ? "xlsx" : "pdf"
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `estudiantes.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Exportacion completada")
      onOpenChange(false)
    } catch {
      toast.error("Error al exportar")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[2rem] w-full max-w-lg p-0 z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
            <div>
              <Dialog.Title className="text-xl font-black text-gray-900">{title}</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-1">{description}</Dialog.Description>
            </div>
            <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </Dialog.Close>
          </div>
          <div className="p-8 space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Formato</label>
              <div className="flex gap-2">
                {(["excel", "pdf"] as ExportFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      format === fmt
                        ? "text-white border-transparent shadow-sm"
                        : "text-gray-600 bg-white hover:bg-gray-50"
                    }`}
                    style={format === fmt ? { backgroundColor: COLORS.ACCENT } : {}}
                  >
                    {fmt === "excel" ? "Excel" : "PDF"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3 block">Campos</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_FIELDS.map(field => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => toggleField(field.key)}
                      className="size-4 rounded border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                onClick={handleExport}
                disabled={selectedFields.length === 0 || exporting}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {exporting ? "Exportando..." : "Exportar"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
