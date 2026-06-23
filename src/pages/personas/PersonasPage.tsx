import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon, ViewIcon } from "@hugeicons/core-free-icons"
import { Plus, Trash2, Search, X } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { personasService, type Persona } from "@/services/personas.service"
import { toast } from "sonner"
import { PersonaFormModal } from "./PersonaFormModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"

export function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("")
  const [modal, setModal] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  })
  const [detailPersona, setDetailPersona] = useState<Persona | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null)

  const cargarPersonas = async () => {
    setLoading(true)
    try {
      const response = await personasService.getPersonas({
        buscar: search || undefined,
        tipo: filtroTipo || undefined,
      })
      setPersonas(response.data)
    } catch {
      toast.error("Error al cargar")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPersonas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filtroTipo])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await personasService.eliminarPersona(deleteConfirm.id)
      toast.success("Eliminado")
      cargarPersonas()
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDeleteConfirm(null)
    }
  }

  const openDetail = async (id: string) => {
    setLoadingDetail(true)
    try {
      const p = await personasService.getPersonaById(id)
      setDetailPersona(p)
    } catch {
      toast.error("Error al cargar detalles")
    } finally {
      setLoadingDetail(false)
    }
  }

  const fullName = (p: Persona) => `${p.nombres} ${p.apellidos}`

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>
                Personal
              </h1>
              
            </div>
            <button
              onClick={() => setModal({ open: true, editingId: null })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 active:scale-[0.97]"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={16} />
              Nueva Persona
            </button>
          </header>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm outline-none"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              />
            </div>
            <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {[
                { label: "Todos", value: "" },
                { label: "Instructores", value: "instructor" },
                { label: "Staff", value: "staff" },
                { label: "Secretaría", value: "secretaria" },
                { label: "Admin", value: "admin" },
              ].map(({ label, value }) => (
                <button
                  key={value || "todos"}
                  onClick={() => setFiltroTipo(value)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180"
                  style={{
                    backgroundColor: filtroTipo === value ? COLORS.CHARCOAL : "transparent",
                    color: filtroTipo === value ? "white" : COLORS.TEXT_MUTED,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
                <span style={{ color: COLORS.TEXT_MUTED }}>Cargando...</span>
              </div>
            </div>
          )}

          {!loading && personas.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p style={{ color: COLORS.TEXT_MUTED }}>No hay personas registradas.</p>
              <button onClick={() => setModal({ open: true, editingId: null })} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                <Plus size={16} />Registrar primera persona
              </button>
            </div>
          )}

          {!loading && personas.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((p) => (
                <article key={p.id}
                  onClick={() => openDetail(p.id)}
                  className="group rounded-xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: p.tipo === "instructor" ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "oklch(0.55 0.05 250 / 0.12)", color: p.tipo === "instructor" ? COLORS.ACCENT : "oklch(0.50 0.12 250)" }}>
                      {p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openDetail(p.id)} className="size-7 flex items-center justify-center rounded-md transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                        <HugeiconsIcon icon={ViewIcon} size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, editingId: p.id }) }} className="size-7 flex items-center justify-center rounded-md transition-colors" style={{ color: COLORS.TEXT_MUTED }}>
                        <HugeiconsIcon icon={Edit01Icon} size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: p.id, nombre: fullName(p) }) }} className="size-7 flex items-center justify-center rounded-md transition-colors hover:bg-red-50" style={{ color: "oklch(0.50 0.12 10)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.CHARCOAL }}>{fullName(p)}</h3>
                  {p.cedula && <p className="text-xs font-mono mb-1" style={{ color: COLORS.TEXT_MUTED }}>{p.cedula}</p>}

                  <div className="space-y-0.5 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    {p.correo && <p>{p.correo}</p>}
                    {p.celular && <p>{p.celular}</p>}
                     {p.ciudad && <p>{p.ciudad}</p>}
                  </div>

                  {p.perfilInstructor?.especialidad && (
                    <p className="text-xs mt-2 font-medium" style={{ color: COLORS.ACCENT }}>{p.perfilInstructor.especialidad}</p>
                  )}
                  {p.perfilStaff?.cargo && (
                    <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>{p.perfilStaff.cargo}</p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] mt-3 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: p.cuentaSistema ? "oklch(0.50 0.12 140)" : "oklch(0.85 0 0)" }} />
                      {p.cuentaSistema ? p.cuentaSistema.username : "Sin cuenta"}
                    </span>
                    <span style={{ color: COLORS.TEXT_MUTED }}>
                      {p.es_activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </article>
              ))}

              <button
                onClick={() => setModal({ open: true, editingId: null })}
                className="group rounded-xl border border-dashed flex flex-col items-center justify-center min-h-[230px] p-5 transition-all duration-200"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${COLORS.ACCENT}50`
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 3%, white)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                <Plus size={28} className="mb-2" style={{ color: COLORS.TEXT_MUTED }} />
                <span className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Nueva persona</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {modal.open && (
        <PersonaFormModal
          editingId={modal.editingId}
          onClose={() => setModal({ open: false, editingId: null })}
          onSuccess={cargarPersonas}
        />
      )}

      {/* Detail Modal */}
      {detailPersona && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailPersona(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90dvh] overflow-y-auto" style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <h2 className="text-lg font-semibold" style={{ color: COLORS.CHARCOAL }}>
                {fullName(detailPersona)}
              </h2>
              <button onClick={() => setDetailPersona(null)} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize" style={{
                  backgroundColor: detailPersona.tipo === "instructor" ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "oklch(0.55 0.05 250 / 0.12)",
                  color: detailPersona.tipo === "instructor" ? COLORS.ACCENT : "oklch(0.50 0.12 250)"
                }}>{detailPersona.tipo}</span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: detailPersona.es_activo ? "oklch(0.50 0.12 140)" : "oklch(0.85 0 0)" }} />
                  <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{detailPersona.es_activo ? "Activo" : "Inactivo"}</span>
                </span>
              </div>

              <Section title="Datos personales">
                <Row label="Cédula" value={detailPersona.cedula} />
                <Row label="Correo" value={detailPersona.correo} />
                <Row label="Celular" value={detailPersona.celular} />
                <Row label="Ciudad" value={detailPersona.ciudad} />
              </Section>

              <Section title="Cuenta de sistema">
                {detailPersona.cuentaSistema ? (
                  <>
                    <Row label="Usuario" value={detailPersona.cuentaSistema.username} />
                    <Row label="ID Cuenta" value={detailPersona.cuentaSistema.id} mono />
                  </>
                ) : (
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Sin cuenta de sistema</p>
                )}
              </Section>

              {detailPersona.tipo === "instructor" && detailPersona.perfilInstructor && (
                <Section title="Perfil de Instructor">
                  <Row label="Especialidad" value={detailPersona.perfilInstructor.especialidad} />
                  <Row label="Bio" value={detailPersona.perfilInstructor.bio} />
                </Section>
              )}

              {detailPersona.tipo !== "instructor" && detailPersona.perfilStaff && (
                <Section title="Perfil Staff">
                  <Row label="Cargo" value={detailPersona.perfilStaff.cargo} />
                  {detailPersona.perfilStaff.salario_base && (
                    <Row label="Salario" value={`$${parseFloat(String(detailPersona.perfilStaff.salario_base)).toFixed(2)}`} />
                  )}
                  <Row label="Fecha ingreso" value={detailPersona.perfilStaff.fecha_ingreso} />
                  {detailPersona.perfilStaff.es_pasante && (
                    <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "oklch(0.55 0.05 250 / 0.12)", color: "oklch(0.50 0.12 250)" }}>Pasante</span>
                  )}
                </Section>
              )}

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button onClick={() => { setDetailPersona(null); setModal({ open: true, editingId: detailPersona.id }) }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: COLORS.ACCENT }}>
                  Editar
                </button>
                <button onClick={() => setDetailPersona(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: "oklch(0.96 0 0)", color: COLORS.TEXT_MUTED }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "white", borderRightColor: "white" }} />
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Persona"
        message={`¿Eliminar a "${deleteConfirm?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: COLORS.TEXT_MUTED }}>{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{label}</span>
      <span className={`text-xs ${mono ? "font-mono" : ""}`} style={{ color: value ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
        {value || "—"}
      </span>
    </div>
  )
}

export default PersonasPage
