import { useState, useEffect, type CSSProperties } from "react"
import { Plus, Trash2, X, Search, Edit } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { asistenciaService, type AsistenciaStaff } from "@/services/asistencia.service"
import { personasService } from "@/services/personas.service"
import { toast } from "sonner"

interface PersonaOption { id: string; nombres: string; apellidos: string }

export function AsistenciaStaffPage() {
  const [registros, setRegistros] = useState<AsistenciaStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [staffOptions, setStaffOptions] = useState<PersonaOption[]>([])
  const [fecha, setFecha] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<AsistenciaStaff | null>(null)

  const [form, setForm] = useState({
    persona_id: "",
    fecha: new Date().toISOString().slice(0, 10),
    hora_entrada: "",
    hora_salida: "",
    actividades: "",
    observaciones: "",
  })

  const cargarStaff = async () => {
    try {
      const res = await personasService.getPersonas({ tipo: "staff", page: 1 })
      setStaffOptions(res.data.slice(0, 100).map(p => ({ id: p.id, nombres: p.nombres, apellidos: p.apellidos })))
    } catch { /* */ }
  }

  const cargarRegistros = async () => {
    setLoading(true)
    try {
      const res = await asistenciaService.getAsistencias({ fecha: fecha || undefined })
      setRegistros(res.data)
    } catch { toast.error("Error al cargar") }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarStaff() }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarRegistros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  const openNew = () => {
    setEditing(null)
    setForm({ persona_id: "", fecha: new Date().toISOString().slice(0, 10), hora_entrada: "", hora_salida: "", actividades: "", observaciones: "" })
    setModal(true)
  }

  const openEdit = (r: AsistenciaStaff) => {
    setEditing(r)
    setForm({
      persona_id: r.persona_id,
      fecha: r.fecha,
      hora_entrada: r.hora_entrada || "",
      hora_salida: r.hora_salida || "",
      actividades: r.actividades || "",
      observaciones: r.observaciones || "",
    })
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await asistenciaService.actualizar(editing.id, {
          hora_entrada: form.hora_entrada || undefined,
          hora_salida: form.hora_salida || undefined,
          actividades: form.actividades || undefined,
          observaciones: form.observaciones || undefined,
        })
        toast.success("Actualizado")
      } else {
        await asistenciaService.registrar(form)
        toast.success("Registrado")
      }
      setModal(false)
      cargarRegistros()
    } catch { toast.error("Error al guardar") }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return
    try {
      await asistenciaService.eliminar(id)
      toast.success("Eliminado")
      cargarRegistros()
    } catch { toast.error("Error al eliminar") }
  }

  const inputClasses = "w-full px-3 py-2.5 bg-white border rounded-lg outline-none text-sm"
  const label = "text-sm font-semibold mb-1.5"

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-5">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>Asistencia Staff</h1>
              <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>Registro manual de asistencia del personal administrativo.</p>
            </div>
            <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: COLORS.ACCENT }}>
              <Plus size={16} />Nuevo Registro
            </button>
          </header>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          </div>

          {loading && (
            <div className="flex justify-center py-20"><div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} /></div>
          )}

          {!loading && registros.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p style={{ color: COLORS.TEXT_MUTED }}>{fecha ? "No hay registros para esta fecha" : "Selecciona una fecha para ver los registros"}</p>
            </div>
          )}

          {!loading && registros.length > 0 && (
            <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {["Persona", "Fecha", "Entrada", "Salida", "Actividades", ""].map((h, i) => (
                      <th key={`asistencia-h-${i}`} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE } as CSSProperties}>
                  {registros.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
                        {r.persona ? `${r.persona.nombres} ${r.persona.apellidos}` : r.persona_id}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{r.fecha}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: COLORS.CHARCOAL }}>{r.hora_entrada || "—"}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: COLORS.CHARCOAL }}>{r.hora_salida || "—"}</td>
                      <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: COLORS.TEXT_MUTED }}>{r.actividades || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="p-2 rounded-md" style={{ color: COLORS.TEXT_MUTED }}><Edit size={14} /></button>
                          <button onClick={() => handleDelete(r.id)} className="p-2 rounded-md" style={{ color: "oklch(0.50 0.12 10)" }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90dvh] overflow-y-auto" style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-lg font-semibold" style={{ color: COLORS.CHARCOAL }}>{editing ? "Editar Registro" : "Nuevo Registro"}</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editing && (
                <div>
                  <div className={label} style={{ color: COLORS.CHARCOAL }}>Persona *</div>
                  <select value={form.persona_id} onChange={e => setForm({ ...form, persona_id: e.target.value })} className={inputClasses} style={{ borderColor: COLORS.BORDER_SUBTLE }} required>
                    <option value="">Seleccionar...</option>
                    {staffOptions.map(s => <option key={s.id} value={s.id}>{s.nombres} {s.apellidos}</option>)}
                  </select>
                </div>
              )}
              {!editing && (
                <div>
                  <div className={label} style={{ color: COLORS.CHARCOAL }}>Fecha *</div>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className={inputClasses} style={{ borderColor: COLORS.BORDER_SUBTLE }} required />
                </div>
              )}
              <div>
                <div className={label} style={{ color: COLORS.CHARCOAL }}>Hora entrada</div>
                <input type="time" value={form.hora_entrada} onChange={e => setForm({ ...form, hora_entrada: e.target.value })} className={inputClasses} style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              </div>
              <div>
                <div className={label} style={{ color: COLORS.CHARCOAL }}>Hora salida</div>
                <input type="time" value={form.hora_salida} onChange={e => setForm({ ...form, hora_salida: e.target.value })} className={inputClasses} style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              </div>
              <div>
                <div className={label} style={{ color: COLORS.CHARCOAL }}>Actividades</div>
                <textarea value={form.actividades} onChange={e => setForm({ ...form, actividades: e.target.value })} className="w-full px-3 py-2.5 bg-white border rounded-lg outline-none text-sm resize-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} rows={3} placeholder="Actividades realizadas..." />
              </div>
              <div>
                <div className={label} style={{ color: COLORS.CHARCOAL }}>Observaciones</div>
                <input type="text" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className={inputClasses} style={{ borderColor: COLORS.BORDER_SUBTLE }} placeholder="Notas adicionales..." />
              </div>
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                  {editing ? "Actualizar" : "Registrar"}
                </button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "oklch(0.96 0 0)", color: COLORS.TEXT_MUTED }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
