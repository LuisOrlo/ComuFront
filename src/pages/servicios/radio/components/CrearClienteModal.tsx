import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon } from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

export function CrearClienteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (cliente: ClienteExterno) => void
}) {
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [cedula, setCedula] = useState("")
  const [celular, setCelular] = useState("")
  const [correo, setCorreo] = useState("")
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setNombres("")
    setApellidos("")
    setCedula("")
    setCelular("")
    setCorreo("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombres.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    setSaving(true)
    try {
      const nuevo = await clientesService.createCliente({
        nombres: nombres.trim(),
        apellidos: apellidos.trim() || undefined,
        cedula: cedula.trim() || undefined,
        celular: celular.trim() || undefined,
        correo: correo.trim() || undefined,
      })
      toast.success("Cliente registrado")
      resetForm()
      onCreated(nuevo)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al crear cliente"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "oklch(0.95 0.02 160)" }}>
              <HugeiconsIcon icon={UserGroupIcon} size={16} style={{ color: "oklch(0.55 0.18 160)" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Nuevo Cliente</h2>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Nombres *</label>
            <input
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Apellidos</label>
            <input
              value={apellidos}
              onChange={e => setApellidos(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Cédula</label>
              <input
                value={cedula}
                onChange={e => setCedula(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Celular</label>
              <input
                value={celular}
                onChange={e => setCelular(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Correo electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none focus:ring-2"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all hover:bg-gray-50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "oklch(0.55 0.18 160)" }}
            >
              {saving ? "Guardando..." : "Registrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
