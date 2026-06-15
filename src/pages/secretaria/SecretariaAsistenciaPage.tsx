import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CalendarIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { secretariaService } from "@/services/secretaria.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

export function SecretariaAsistenciaPage() {
  const [staffId, setStaffId] = useState("")
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId) return
    setSubmitting(true)
    try {
      await secretariaService.registrarAsistencia({
        persona_id: staffId,
        tipo_registro: tipo,
      })
      toast.success("Asistencia registrada")
      setStaffId("")
    } catch {
      toast.error("Error al registrar asistencia")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col" style={{ backgroundColor: "#f9fafb" }}>
      <header className="flex-none flex items-center justify-between border-b px-6 py-4" style={{ borderColor: BORDER, backgroundColor: "white" }}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>Registro de Asistencia</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Registrar entrada y salida del personal</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-md mx-auto rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-lg" style={{ backgroundColor: `${ACCENT}15` }}>
              <HugeiconsIcon icon={CalendarIcon} size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: CHARCOAL }}>Registrar asistencia</h2>
              <p className="text-xs" style={{ color: MUTED }}>{new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>ID del personal</label>
              <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)}
                placeholder="Ingrese el ID de la persona"
                className="w-full h-10 px-3 text-sm rounded-lg border bg-transparent outline-none" style={{ borderColor: BORDER }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Tipo de registro</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTipo("entrada")}
                  className="flex-1 h-10 text-sm font-medium rounded-lg border transition-all"
                  style={{ borderColor: tipo === "entrada" ? ACCENT : BORDER, backgroundColor: tipo === "entrada" ? `${ACCENT}12` : "white", color: tipo === "entrada" ? ACCENT : CHARCOAL }}>
                  Entrada
                </button>
                <button type="button" onClick={() => setTipo("salida")}
                  className="flex-1 h-10 text-sm font-medium rounded-lg border transition-all"
                  style={{ borderColor: tipo === "salida" ? ACCENT : BORDER, backgroundColor: tipo === "salida" ? `${ACCENT}12` : "white", color: tipo === "salida" ? ACCENT : CHARCOAL }}>
                  Salida
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting || !staffId}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}>
              {submitting ? "Registrando..." : "Registrar asistencia"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
