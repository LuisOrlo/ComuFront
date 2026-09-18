import { useState } from "react"
import { Dialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { estudiantesService } from "@/services/estudiantes.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import { StudentForm, type StudentFormValues } from "./StudentForm"
import { EMPTY_STUDENT_FORM } from "./studentForm.constants"

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

  const resetAll = () => {
    setStep("buscar")
    setSearchCedula("")
    setSearchNombre("")
    setSearchCorreo("")
    setResultados([])
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

  const handleCreateNew = async (form: StudentFormValues) => {
    setSaving(true)
    try {
      await estudiantesService.createEstudiante({
        nombres: form.nombres,
        apellidos: form.apellidos,
        cedula: form.cedula || undefined,
        correo: form.correo || undefined,
        celular: form.celular || undefined,
        ciudad_id: form.ciudad_id ? Number(form.ciudad_id) : undefined,
        ciudad: form.ciudad || undefined,
        notas_internas: form.notas_internas || undefined,
        ocupacion: form.ocupacion || undefined,
        direccion: form.direccion || undefined,
        estado_civil: form.estado_civil || undefined,
        edad: form.edad ? Number(form.edad) : undefined,
        nivel_educativo: form.nivel_educativo || undefined,
        archivo_cedula: form.archivo_cedula || undefined,
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
                    : "Completa los datos del registro independiente."}
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
              <div className="p-8">
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
                <StudentForm initialValues={EMPTY_STUDENT_FORM} saving={saving} submitLabel="Finalizar registro" onSubmit={handleCreateNew} onCancel={() => setStep("buscar")} />
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
