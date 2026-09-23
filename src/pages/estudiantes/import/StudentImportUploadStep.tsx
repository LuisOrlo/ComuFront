import { useRef, useState } from "react"

interface Props {
  loading: boolean
  onSubmit: (file: File) => void
}

export function StudentImportUploadStep({ loading, onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const select = (selected: File | undefined) => {
    if (!selected) return
    const extension = selected.name.split(".").pop()?.toLowerCase()
    if (!extension || !["csv", "xls", "xlsx"].includes(extension)) return
    if (selected.size > 10 * 1024 * 1024) return
    setFile(selected)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-10 text-center">
      <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 p-10">
        <p className="text-base font-semibold text-gray-900">Selecciona un archivo de estudiantes</p>
        <p className="mt-2 text-sm text-gray-500">CSV, XLS o XLSX · máximo 10 MB y 2000 filas</p>
        <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(event) => select(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-6 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          Seleccionar archivo
        </button>
        {file && <p className="mt-4 text-sm text-gray-700">{file.name}</p>}
      </div>
      <button type="button" disabled={!file || loading} onClick={() => file && onSubmit(file)} className="rounded-lg bg-[#0b1c30] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Analizando..." : "Analizar archivo"}
      </button>
    </div>
  )
}
