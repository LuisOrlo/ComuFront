import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon, CheckmarkCircle02Icon, Cancel01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"

interface Props {
  loading: boolean
  onSubmit: (file: File) => void
}

export function StudentImportUploadStep({ loading, onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (selected: File | undefined | null) => {
    setError(null)
    if (!selected) return
    const extension = selected.name.split(".").pop()?.toLowerCase()
    if (!extension || !["csv", "xls", "xlsx"].includes(extension)) {
      setError("Formato de archivo no soportado. Debe ser CSV, XLS o XLSX.")
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo permitido de 10 MB.")
      return
    }
    setFile(selected)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Dropzone y Archivo */}
      <section className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c6c6cd]/20 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b1c30]">
              Selecciona el archivo de estudiantes
            </h2>
            <p className="text-sm text-[#45464d]">
              Puedes importar estudiantes desde hojas de cálculo en formato CSV, XLS o XLSX.
            </p>
          </div>

          {/* Dropzone */}
          <div
            className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4 ${
              dragOver
                ? "border-[#fd761a] bg-orange-50/50"
                : "border-[#c6c6cd]/50 bg-[#eff4ff]/30 hover:bg-[#eff4ff]/60 hover:border-[#fd761a]"
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleSelect(e.dataTransfer.files?.[0])
            }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(e) => handleSelect(e.target.files?.[0])}
            />

            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-[#c6c6cd]/20 flex items-center justify-center text-[#fd761a] group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={FileUploadIcon} size={32} />
            </div>

            <div className="flex flex-col items-center gap-1.5 max-w-md">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#fd761a] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                >
                  Seleccionar archivo
                </button>
                <span className="text-xs sm:text-sm text-[#45464d] font-medium">
                  o arrastra y suelta tu archivo aquí
                </span>
              </div>
              <p className="text-xs text-[#76777d]">
                Reconocimiento automático de cabeceras en español e inglés
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[11px] font-semibold">
                Máximo 10 MB
              </span>
              <span className="text-[#c6c6cd]">•</span>
              <span className="px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[11px] font-semibold">
                Hasta 2,000 filas por carga
              </span>
              <span className="text-[#c6c6cd]">•</span>
              <span className="px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#783200] text-[11px] font-semibold">
                CSV, XLS, XLSX
              </span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#ba1a1a] flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tarjeta de archivo seleccionado */}
          {file && (
            <div className="p-4 rounded-xl bg-[#eff4ff]/60 border border-[#c6c6cd]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} className="text-[#009668]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#0b1c30] truncate">
                      {file.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#6ffbbe]/30 text-[#005236] text-[10px] font-bold uppercase tracking-wider">
                      Listo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#45464d] mt-0.5">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="uppercase">{file.name.split(".").pop()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={loading}
                  className="p-2 rounded-lg text-[#76777d] hover:text-[#ba1a1a] hover:bg-white transition-colors"
                  title="Quitar archivo"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onSubmit(file)}
                  className="px-5 py-2.5 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <span>Analizar archivo</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Columna Derecha: Guía y Ayuda */}
      <aside className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#c6c6cd]/20 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#9d4300]">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
            </div>
            <h3 className="font-bold text-sm text-[#0b1c30]">Columnas esperadas</h3>
          </div>
          <p className="text-xs text-[#45464d] leading-relaxed">
            El sistema buscará y mapeará automáticamente columnas comunes de tu Excel:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#c6c6cd]/20">
              <span className="font-bold text-[#0b1c30] block">Nombres y Apellidos *</span>
              <span className="text-[#45464d] text-[11px]">
                En columnas separadas o como "Nombre completo"
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#c6c6cd]/20">
              <span className="font-bold text-[#0b1c30] block">Cédula / Documento</span>
              <span className="text-[#45464d] text-[11px]">
                Exactamente 10 dígitos numéricos
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#c6c6cd]/20">
              <span className="font-bold text-[#0b1c30] block">Celular y Correo</span>
              <span className="text-[#45464d] text-[11px]">
                Celular de 10 dígitos y correo válido
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#c6c6cd]/20">
              <span className="font-bold text-[#0b1c30] block">Ciudad</span>
              <span className="text-[#45464d] text-[11px]">
                Se asociará al catálogo de ciudades o se conservará como texto
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#eff4ff]/60 rounded-2xl p-5 border border-[#c6c6cd]/20 text-xs text-[#45464d] space-y-2">
          <p className="font-bold text-[#0b1c30]">Seguridad y validación:</p>
          <p className="leading-relaxed">
            Ningún registro se insertará en la base de datos hasta que revises la previsualización y confirmes la importación.
          </p>
        </div>
      </aside>
    </div>
  )
}
