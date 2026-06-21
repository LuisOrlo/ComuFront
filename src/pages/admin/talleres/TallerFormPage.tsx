/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type HorarioTaller } from "@/services/taller.service"
import axios from "axios"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const DIAS = [
  { num: 1, label: "Lun" },
  { num: 2, label: "Mar" },
  { num: 3, label: "Mie" },
  { num: 4, label: "Jue" },
  { num: 5, label: "Vie" },
  { num: 6, label: "Sab" },
  { num: 7, label: "Dom" },
]

interface FormData {
  nombre: string
  descripcion: string
  instructor_id: string
  modalidad: string
  fecha: string
  fecha_fin: string
  hora_inicio: string
  hora_fin: string
  capacidad_maxima: string
  precio: string
}

interface HorarioForm {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  aula: string
}

const initialState: FormData = {
  nombre: "",
  descripcion: "",
  instructor_id: "",
  modalidad: "presencial",
  fecha: "",
  fecha_fin: "",
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
  const [multiDia, setMultiDia] = useState(false)
  const [horarios, setHorarios] = useState<HorarioForm[]>([])
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])

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
          fecha_fin: taller.fecha_fin || "",
          hora_inicio: taller.hora_inicio || "",
          hora_fin: taller.hora_fin || "",
          capacidad_maxima: String(taller.capacidad_maxima || ""),
          precio: String(taller.precio || ""),
        })
        if (taller.instructor) {
          setInstructorNombre(`${taller.instructor.nombres} ${taller.instructor.apellidos}`)
        }
        if (taller.fecha_fin) {
          setMultiDia(true)
          if (taller.horarios?.length) {
            setHorarios(taller.horarios.map((h: HorarioTaller) => ({
              dia_semana: h.dia_semana,
              hora_inicio: h.hora_inicio?.substring(0, 5) || "",
              hora_fin: h.hora_fin?.substring(0, 5) || "",
              aula: h.aula || "",
            })))
            setDiasSeleccionados(taller.horarios.map((h: HorarioTaller) => h.dia_semana))
          }
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

  const toggleDia = (dia: number) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(dia)) {
        setHorarios(h => h.filter(x => x.dia_semana !== dia))
        return prev.filter(d => d !== dia)
      }
      setHorarios(h => [...h, { dia_semana: dia, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin, aula: "" }])
      return [...prev, dia].sort()
    })
  }

  const updateHorario = (dia: number, field: "hora_inicio" | "hora_fin" | "aula", value: string) => {
    setHorarios(prev => prev.map(h => h.dia_semana === dia ? { ...h, [field]: value } : h))
  }

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
      const data: any = {
        ...form,
        capacidad_maxima: parseInt(form.capacidad_maxima),
        precio: parseFloat(form.precio),
      }
      if (!multiDia) {
        delete data.fecha_fin
      }
      if (multiDia && horarios.length > 0) {
        data.horarios = horarios
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Fecha de inicio</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
            </div>

            <div className="col-span-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={multiDia} onChange={e => {
                  setMultiDia(e.target.checked)
                  if (!e.target.checked) {
                    setForm(f => ({ ...f, fecha_fin: "" }))
                    setHorarios([])
                    setDiasSeleccionados([])
                  }
                }}
                  className="rounded" style={{ accentColor: ACCENT }} />
                <span className="text-xs font-medium" style={{ color: CHARCOAL }}>Taller de varios días</span>
              </label>
            </div>

            {multiDia && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: CHARCOAL }}>Fecha de fin</label>
                <input type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} required={multiDia}
                  min={form.fecha || undefined}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: BORDER }} />
              </div>
            )}

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

          {!multiDia && (
            <div className="grid grid-cols-2 gap-3 pt-2">
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
          )}

          {multiDia && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: CHARCOAL }}>Días del taller</label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS.map(d => (
                    <button key={d.num} type="button" onClick={() => toggleDia(d.num)}
                      className="px-3 py-2 rounded-lg text-xs font-medium border transition-all"
                      style={{
                        borderColor: diasSeleccionados.includes(d.num) ? ACCENT : BORDER,
                        backgroundColor: diasSeleccionados.includes(d.num) ? `color-mix(in srgb, ${ACCENT} 10%, transparent)` : "white",
                        color: diasSeleccionados.includes(d.num) ? ACCENT : TEXT_MUTED,
                      }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {diasSeleccionados.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium" style={{ color: CHARCOAL }}>Horarios por día</label>
                  {diasSeleccionados.map(dia => {
                    const h = horarios.find(x => x.dia_semana === dia)
                    const diaLabel = DIAS.find(d => d.num === dia)?.label || ""
                    return (
                      <div key={dia} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: BORDER }}>
                        <span className="text-xs font-bold w-10 shrink-0" style={{ color: ACCENT }}>{diaLabel}</span>
                        <input type="time" value={h?.hora_inicio || ""} onChange={e => updateHorario(dia, "hora_inicio", e.target.value)}
                          className="px-2 py-1.5 rounded text-xs border outline-none" style={{ borderColor: BORDER }} />
                        <span className="text-xs" style={{ color: TEXT_MUTED }}>a</span>
                        <input type="time" value={h?.hora_fin || ""} onChange={e => updateHorario(dia, "hora_fin", e.target.value)}
                          className="px-2 py-1.5 rounded text-xs border outline-none" style={{ borderColor: BORDER }} />
                        <input type="text" value={h?.aula || ""} onChange={e => updateHorario(dia, "aula", e.target.value)}
                          className="px-2 py-1.5 rounded text-xs border outline-none flex-1" style={{ borderColor: BORDER }} placeholder="Aula (opcional)" />
                        <button type="button" onClick={() => toggleDia(dia)} className="shrink-0 p-1 rounded hover:bg-red-50" style={{ color: "#ef4444" }}>
                          <HugeiconsIcon icon={Delete01Icon} size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

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
