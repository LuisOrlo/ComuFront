import { useState, useEffect } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, UserAdd02Icon } from "@hugeicons/core-free-icons"
import { estudiantesService } from "@/services/estudiantes.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

interface StudentCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function StudentCreateModal({ open, onOpenChange, onCreated }: StudentCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    correo: "",
    celular: "",
    ciudad_id: "",
    fecha_nacimiento: "",
    ocupacion: "",
    direccion: "",
    estado_civil: "",
    edad: "",
  })

  useEffect(() => {
    if (open) {
      ciudadesService.getCiudadesTodas().then(setCiudades).catch(() => {})
    }
  }, [open])

  const resetForm = () => setForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "", ciudad_id: "", fecha_nacimiento: "", ocupacion: "", direccion: "", estado_civil: "", edad: "" })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombres.trim() || !form.apellidos.trim()) return
    setSaving(true)
    try {
      await estudiantesService.createEstudiante({
        nombres: form.nombres,
        apellidos: form.apellidos,
        cedula: form.cedula || undefined,
        correo: form.correo || undefined,
        celular: form.celular || undefined,
        ciudad_id: form.ciudad_id || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
        ocupacion: form.ocupacion || undefined,
        direccion: form.direccion || undefined,
        estado_civil: form.estado_civil || undefined,
        edad: form.edad ? Number(form.edad) : undefined,
      })
      toast.success("Estudiante registrado")
      onOpenChange(false)
      resetForm()
      onCreated()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al registrar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97] shadow-lg"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={UserAdd02Icon} size={18} />
          Registrar Estudiante
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg my-auto overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900">Nuevo Estudiante</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">Completa los datos para el registro academico.</Dialog.Description>
              </div>
              <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombres *</label>
                  <input type="text" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} placeholder="Ej: Juan" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Apellidos *</label>
                  <input type="text" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} placeholder="Ej: Perez" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cédula / DNI</label>
                  <input type="text" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} placeholder="Cédula o DNI" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Celular</label>
                  <input type="text" value={form.celular} onChange={e => setForm({ ...form, celular: e.target.value })} placeholder="0999999999" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Correo Electronico</label>
                <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="correo@email.com" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ciudad</label>
                    <select value={form.ciudad_id} onChange={e => setForm({ ...form, ciudad_id: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white">
                      <option value="">Seleccionar...</option>
                      {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Fecha Nacimiento</label>
                    <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ocupacion</label>
                    <input type="text" value={form.ocupacion} onChange={e => setForm({ ...form, ocupacion: e.target.value })} placeholder="Ej: Ingeniero" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Estado Civil</label>
                    <select value={form.estado_civil} onChange={e => setForm({ ...form, estado_civil: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all bg-white">
                      <option value="">Seleccionar...</option>
                      <option value="soltero">Soltero</option>
                      <option value="casado">Casado</option>
                      <option value="divorciado">Divorciado</option>
                      <option value="viudo">Viudo</option>
                      <option value="union_libre">Union Libre</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Edad</label>
                    <input type="number" min={0} max={150} value={form.edad} onChange={e => setForm({ ...form, edad: e.target.value })} placeholder="Ej: 25" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Direccion</label>
                    <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Direccion residencial" className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                <Dialog.Close className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</Dialog.Close>
                <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60" style={{ backgroundColor: COLORS.ACCENT }}>
                  {saving ? "Procesando..." : "Finalizar Registro"}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
