/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"
import axios from "axios"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface FormData {
  nombre: string
  descripcion: string
  instructor_id: string
  modalidad: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  capacidad_maxima: string
  precio: string
}

const initialState: FormData = {
  nombre: "",
  descripcion: "",
  instructor_id: "",
  modalidad: "presencial",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
  capacidad_maxima: "30",
  precio: "",
}

interface Persona {
  id: string
  nombres: string
  apellidos: string
  email?: string
}

export function TallerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(initialState)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [instructorQuery, setInstructorQuery] = useState("")
  const [instructores, setInstructores] = useState<Persona[]>([])
  const [searchingInstructor, setSearchingInstructor] = useState(false)
  const [instructorNombre, setInstructorNombre] = useState("")
  const [showInstructorSelect, setShowInstructorSelect] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    const cargar = async () => {
      setLoading(true)
      try {
        const taller = await tallerService.obtener(id!)
        setForm({
          nombre: taller.nombre || "",
          descripcion: taller.descripcion || "",
          instructor_id: taller.instructor_id || "",
          modalidad: taller.modalidad || "presencial",
          fecha: taller.fecha || "",
          hora_inicio: taller.hora_inicio || "",
          hora_fin: taller.hora_fin || "",
          capacidad_maxima: String(taller.capacidad_maxima || ""),
          precio: String(taller.precio || ""),
        })
        if (taller.instructor) {
          setInstructorNombre(`${taller.instructor.nombres} ${taller.instructor.apellidos}`)
        }
      } catch {
        toast.error("Error al cargar taller")
        navigate("/talleres")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id, isEdit, navigate])

  const buscarInstructores = async (q: string) => {
    setInstructorQuery(q)
    if (!q.trim()) { setInstructores([]); return }
    setSearchingInstructor(true)
    try {
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      const res = await axios.get(`${base}/academic/personas`, {
        params: { buscar: q, tipo: "instructor", per_page: 10 },
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      setInstructores((res.data as any).data || [])
    } catch { setInstructores([]) }
    finally { setSearchingInstructor(false) }
  }

  const seleccionarInstructor = (p: Persona) => {
    setForm(f => ({ ...f, instructor_id: p.id }))
    setInstructorNombre(`${p.nombres} ${p.apellidos}`)
    setShowInstructorSelect(false)
    setInstructorQuery("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...form,
        capacidad_maxima: parseInt(form.capacidad_maxima),
        precio: parseFloat(form.precio),
      }
      if (isEdit) {
        await tallerService.actualizar(id!, data)
        toast.success("Taller actualizado")
      } else {
        await tallerService.crear(data)
        toast.success("Taller creado correctamente")
      }
      navigate("/talleres")
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || "Error al guardar taller"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        Cargando...
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[800px] mx-auto px-6 py-6">
          <button onClick={() => navigate("/talleres")}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver a talleres
          </button>
          <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>
            {isEdit ? "Editar Taller" : "Nuevo Taller"}
          </h1>
        </div>
      </div>

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5" style={{ borderColor: BORDER }}>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Nombre del Taller</label>
              <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} placeholder="Ej: Taller de Fotografía Digital" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none resize-none" style={{ borderColor: BORDER }} placeholder="Descripción del taller..." />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Instructor</label>
              <div className="relative">
                <input type="text" value={showInstructorSelect ? instructorQuery : instructorNombre}
                  onChange={e => { setShowInstructorSelect(true); buscarInstructores(e.target.value) }}
                  onFocus={() => { if (!form.instructor_id) setShowInstructorSelect(true) }}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }}
                  placeholder="Buscar instructor..." />
                {showInstructorSelect && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto" style={{ borderColor: BORDER }}>
                    {searchingInstructor ? (
                      <div className="p-3 text-xs text-center" style={{ color: TEXT_MUTED }}>Buscando...</div>
                    ) : instructores.length === 0 ? (
                      instructorQuery.trim() && <div className="p-3 text-xs text-center" style={{ color: TEXT_MUTED }}>Sin resultados</div>
                    ) : (
                      instructores.map(p => (
                        <button key={p.id} type="button" onClick={() => seleccionarInstructor(p)}
                          className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                          <span style={{ color: CHARCOAL }}>{p.nombres} {p.apellidos}</span>
                          {p.email && <span className="text-xs ml-2" style={{ color: TEXT_MUTED }}>{p.email}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Modalidad</label>
              <select value={form.modalidad} onChange={e => setForm(f => ({ ...f, modalidad: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-white outline-none" style={{ borderColor: BORDER }}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Hora Inicio</label>
                <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} required
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Hora Fin</label>
                <input type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} required
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Capacidad Máxima</label>
              <input type="number" value={form.capacidad_maxima} onChange={e => setForm(f => ({ ...f, capacidad_maxima: e.target.value }))} required min={1}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Precio ($)</label>
              <input type="number" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} required min={0}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} placeholder="0.00" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate("/talleres")}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold border" style={{ borderColor: BORDER, color: TEXT_MUTED }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}>
              {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Taller"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
