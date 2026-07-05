import { useState } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CertificateIcon, SearchIcon, ShieldCheck, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { Download } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { certificadosService, type Certificado } from "@/services/certificados.service"
import { toast } from "sonner"

const ESTADO_STYLES: Record<string, string> = {
  generado: "bg-sky-100 text-sky-700 border-sky-200",
  entregado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  borrado: "bg-red-50 text-red-500 border-red-200",
}

const ESTADO_LABELS: Record<string, string> = {
  generado: "Disponible",
  entregado: "Entregado",
  borrado: "Expirado",
}

export function VerificarCertificadosPage() {
  const [cedula, setCedula] = useState("")
  const [resultados, setResultados] = useState<Certificado[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [consultado, setConsultado] = useState(false)

  const handleSearch = async () => {
    if (!cedula.trim()) {
      toast.error("Ingrese un número de cédula")
      return
    }
    try {
      setLoading(true)
      setConsultado(true)
      const data = await certificadosService.verificarPorCedula(cedula.trim())
      setResultados(data)
    } catch {
      toast.error("Error al consultar certificados")
      setResultados([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <header className="px-6 py-8 border-b bg-white/80 backdrop-blur-md" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center mb-2">
            <img src="/Logo_PDF.png" alt="Logo" className="h-28 w-auto" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter" style={{ color: COLORS.CHARCOAL }}>Verificar Certificados</h1>
          <p className="text-sm opacity-50 max-w-md mx-auto">
            Ingrese su número de cédula para consultar los certificados emitidos a su nombre.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ingrese su cédula (ej: 123456789)"
                className="w-full px-5 py-4 rounded-xl border bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <HugeiconsIcon icon={SearchIcon} size={16} />
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm font-medium opacity-30 animate-pulse">Buscando certificados...</p>
          </div>
        )}

        {!loading && consultado && resultados !== null && resultados.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center py-16">
            <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-gray-100 mb-4">
              <HugeiconsIcon icon={InformationCircleIcon} size={36} className="opacity-15" style={{ color: COLORS.CHARCOAL }} />
            </div>
            <p className="text-sm font-bold opacity-40">No se encontraron certificados</p>
            <p className="text-xs opacity-30 mt-1">No hay certificados disponibles asociados a esta cédula.</p>
          </motion.div>
        )}

        {!loading && consultado && resultados !== null && resultados.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold opacity-50 uppercase tracking-wider">
                {resultados.length} certificado{resultados.length !== 1 ? "s" : ""} encontrado{resultados.length !== 1 ? "s" : ""}
              </p>
            </div>
            {resultados.map((cert, i) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={CertificateIcon} size={18} className="text-amber-500 shrink-0" />
                      <span className="font-mono text-sm font-bold" style={{ color: COLORS.ACCENT }}>{cert.codigo_certificado}</span>
                    </div>
                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: COLORS.CHARCOAL }}>
                      {cert.catalogo_curso?.color && (
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: cert.catalogo_curso.color }} />
                      )}
                      {cert.catalogo_curso?.nombre || "Curso"}
                    </p>
                    <div className="flex items-center gap-3 text-xs opacity-50">
                      <span>Emisión: {new Date(cert.fecha_emision).toLocaleDateString("es-ES")}</span>
                      <span className={cn("inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border", ESTADO_STYLES[cert.estado])}>
                        {ESTADO_LABELS[cert.estado]}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {cert.estado === "borrado" ? (
                      <div className="text-right space-y-1">
                        <p className="text-[11px] font-bold text-red-500">Certificado expirado</p>
                        <p className="text-[10px] opacity-50 max-w-[200px] leading-tight">
                          El período de descarga ha finalizado. Contacte a la academia para solicitar una copia de su certificado.
                        </p>
                      </div>
                    ) : (cert as Certificado & { archivo_purgado?: boolean }).archivo_purgado ? (
                      <div className="text-right space-y-1">
                        <p className="text-[11px] font-bold text-amber-600">Archivo no disponible</p>
                        <p className="text-[10px] opacity-50 max-w-[200px] leading-tight">
                          El certificado es válido pero el archivo PDF fue removido del almacenamiento. Contacte a la academia para solicitar una copia.
                        </p>
                      </div>
                    ) : cert.archivo_pdf_url ? (
                      <button
                        onClick={() => certificadosService.descargarPdf(cert.id)}
                        className="px-4 py-2.5 rounded-xl text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center gap-1"
                      >
                        <Download size={12} /> PDF
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!consultado && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-amber-50 mb-4">
              <HugeiconsIcon icon={ShieldCheck} size={36} className="text-amber-300" />
            </div>
            <p className="text-sm font-bold opacity-30">Ingrese su cédula para verificar</p>
            <p className="text-xs opacity-20 mt-1 max-w-[300px] mx-auto">
              Los certificados emitidos por Comunicate Academy pueden ser verificados aquí.
            </p>
          </div>
        )}
      </div>

      <footer className="mt-auto px-6 py-6 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-center opacity-30">
          Verificación de Certificados
        </p>
      </footer>
    </div>
  )
}
