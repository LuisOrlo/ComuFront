import { useState, useEffect } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { estudiantesService } from "@/services/estudiantes.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"

interface EstudianteBusqueda {
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  celular?: string
  ciudad?: string
}

interface StudentCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

type Step = "buscar" | "formulario"

export function StudentCreateModal({ open, onOpenChange, onCreated }: StudentCreateModalProps) {
  const [step, setStep] = useState<Step>("buscar")
  const [searchCedula, setSearchCedula] = useState("")
  const [searchNombre, setSearchNombre] = useState("")
  const [searchCorreo, setSearchCorreo] = useState("")
  const [searching, setSearching] = useState(false)
  const [resultados, setResultados] = useState<EstudianteBusqueda[]>([])

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

  const resetAll = () => {
    setStep("buscar")
    setSearchCedula("")
    setSearchNombre("")
    setSearchCorreo("")
    setResultados([])
    setForm({ nombres: "", apellidos: "", cedula: "", correo: "", celular: "", ciudad_id: "", fecha_nacimiento: "", ocupacion: "", direccion: "", estado_civil: "", edad: "" })
  }

  const handleBuscar = async () => {
    if (!searchCedula.trim() && !searchNombre.trim() && !searchCorreo.trim()) {
      toast.error("Ingresa cédula, nombre o correo para buscar")
      return
    }
    setSearching(true)
    try {
      const res = await estudiantesService.buscarEstudiantes({
        cedula: searchCedula || undefined,
        nombre: searchNombre || undefined,
        correo: searchCorreo || undefined,
      })
      setResultados(res.datos || [])
    } catch {
      toast.error("Error al buscar")
    } finally {
      setSearching(false)
    }
  }

  const handleSelectExisting = (e: EstudianteBusqueda) => {
    onOpenChange(false)
    resetAll()
    onCreated()
    toast.success("Estudiante existente seleccionado: " + e.nombres + " " + e.apellidos)
  }

  const handleCreateNew = async (e: React.FormEvent) => {
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
      resetAll()
      onCreated()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje
      toast.error(msg || "Error al registrar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) resetAll()
        onOpenChange(v)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-lg my-auto overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-8 py-6 border-b bg-gray-50/50">
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900">
                  {step === "buscar" ? "Buscar Estudiante" : "Nuevo Estudiante"}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-1">
                  {step === "buscar"
                    ? "Busca un estudiante existente por cédula, nombre o correo."
                    : "Completa los datos para el registro academico."}
                </Dialog.Description>
              </div>
              <Dialog.Close className="size-10 flex items-center justify-center rounded-2xl bg-white border shadow-sm hover:bg-red-50 hover:text-red-500 transition-all">
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </Dialog.Close>
            </div>

            {step === "buscar" && (
              <div className="p-8 space-y-4">
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Cédula / DNI"
                    value={searchCedula}
                    onChange={e => setSearchCedula(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleBuscar()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={searchNombre}
                    onChange={e => setSearchNombre(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleBuscar()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Correo"
                    value={searchCorreo}
                    onChange={e => setSearchCorreo(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleBuscar()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>

                <button
                  onClick={handleBuscar}
                  disabled={searching}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  <HugeiconsIcon icon={Search01Icon} size={16} />
                  {searching ? "Buscando..." : "Buscar"}
                </button>

                {resultados.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resultados ({resultados.length})</p>
                    {resultados.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectExisting(r)}
                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:bg-blue-50/30 transition-colors"
                      >
                        <div className="font-bold text-gray-900">{r.nombres} {r.apellidos}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {r.cedula && <span className="mr-3">Céd: {r.cedula}</span>}
                          {r.correo && <span className="mr-3">{r.correo}</span>}
                          {r.ciudad && <span>{r.ciudad}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-center pt-2">
                  <button
                    onClick={() => setStep("formulario")}
                    className="text-sm font-bold hover:underline"
                    style={{ color: COLORS.ACCENT }}
                  >
                    + Crear nuevo estudiante
                  </button>
                </div>
              </div>
            )}

            {step === "formulario" && (
              <form onSubmit={handleCreateNew} className="p-8 space-y-5">
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setStep("buscar")}
                    className="text-xs font-bold hover:underline"
                    style={{ color: COLORS.ACCENT }}
                  >
                    ← Volver a buscar
                  </button>
                </div>
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
                  <button type="button" onClick={() => setStep("buscar")} className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60" style={{ backgroundColor: COLORS.ACCENT }}>
                    {saving ? "Procesando..." : "Finalizar Registro"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
