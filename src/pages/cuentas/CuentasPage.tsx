import { useState, useEffect, type CSSProperties } from "react"
import { Search, KeyRound, X, Check, Eye, EyeOff, User, ShieldCheck } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { personasService, type Persona } from "@/services/personas.service"
import { toast } from "sonner"

type ModalMode = "crear" | "editar"

const TIPO_STYLES: Record<string, { label: string; accent: string; soft: string }> = {
  instructor: { label: "Instructor", accent: "oklch(0.58 0.18 260)", soft: "oklch(0.58 0.18 260 / 0.10)" },
  staff: { label: "Staff", accent: "oklch(0.72 0.18 72)", soft: "oklch(0.72 0.18 72 / 0.12)" },
  secretaria: { label: "Secretaría", accent: "oklch(0.62 0.18 304)", soft: "oklch(0.72 0.18 304 / 0.11)" },
  admin: { label: "Admin", accent: "oklch(0.50 0.12 10)", soft: "oklch(0.50 0.12 10 / 0.10)" },
}

export function CuentasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>("crear")
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editPassword, setEditPassword] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await personasService.getPersonas({ buscar: search || undefined, page: 1 })
      setPersonas(res.data.slice(0, 50))
    } catch { toast.error("Error al cargar") }
    finally { setLoading(false) }
  }

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openCreate = (p: Persona) => {
    setSelectedPersona(p)
    setModalMode("crear")
    setUsername(p.nombres.toLowerCase().replace(/\s/g, "").slice(0, 15))
    setPassword("")
    setEditPassword(false)
    setShowPassword(false)
    setModal(true)
  }

  const openEdit = (p: Persona) => {
    setSelectedPersona(p)
    setModalMode("editar")
    setUsername(p.cuentaSistema?.username || "")
    setPassword("")
    setEditPassword(false)
    setShowPassword(false)
    setModal(true)
  }

  const closeModal = () => {
    setModal(false)
    setSelectedPersona(null)
    setUsername("")
    setPassword("")
    setEditPassword(false)
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPersona) return
    setSaving(true)
    try {
      if (modalMode === "editar") {
        const data: { username?: string; password?: string } = {}
        if (username) data.username = username
        if (editPassword && password) data.password = password
        await personasService.actualizarCuenta(selectedPersona.id, data)
        toast.success("Cuenta actualizada")
      } else {
        await personasService.crearCuenta(selectedPersona.id, username, password || "cambio123")
        toast.success("Cuenta creada")
      }
      closeModal()
      cargar()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || "Error al guardar cuenta")
    } finally { setSaving(false) }
  }

  const tipo = selectedPersona ? TIPO_STYLES[selectedPersona.tipo] || TIPO_STYLES.instructor : null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/40">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto px-6 py-6 space-y-5">

          {/* ─── HEADER ─── */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>Cuentas de Sistema</h1>
              <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>Gestiona las cuentas de acceso para instructores y staff.</p>
            </div>
          </header>

          {/* ─── SEARCH ─── */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
            <input type="text" placeholder="Buscar persona..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          </div>

          {/* ─── LOADING ─── */}
          {loading && (
            <div className="flex justify-center py-20"><div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} /></div>
          )}

          {/* ─── TABLE ─── */}
          {!loading && (
            <div className="rounded-[1.5rem] border bg-white overflow-hidden shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    {["Persona", "Tipo", "Usuario", "admin", "staff"].map((h, i) => (
                      <th key={`${h}-${i}`} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>{i < 3 ? h : ""}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE } as CSSProperties}>
                  {personas.map(p => {
                    const ts = TIPO_STYLES[p.tipo] || TIPO_STYLES.instructor
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: ts.soft, color: ts.accent }}>
                              {p.nombres[0]}{p.apellidos[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-snug" style={{ color: COLORS.CHARCOAL }}>{p.nombres} {p.apellidos}</p>
                              <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>{p.correo || "Sin correo"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: ts.soft, color: ts.accent }}>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: ts.accent }} />
                            {ts.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: p.cuentaSistema ? COLORS.CHARCOAL : "oklch(0.72 0 0)" }}>
                          {p.cuentaSistema ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-sm">
                              <ShieldCheck size={13} style={{ color: "oklch(0.55 0.18 150)" }} />
                              {p.cuentaSistema.username}
                            </span>
                          ) : (
                            <span className="text-sm">Sin cuenta</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: COLORS.TEXT_MUTED }}>—</td>
                        <td className="px-4 py-3 text-right">
                          {p.cuentaSistema ? (
                            <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 active:scale-[0.97]" style={{ backgroundColor: "oklch(0.55 0.18 260 / 0.10)", color: "oklch(0.55 0.18 260)" }}>
                              <KeyRound size={12} />Editar
                            </button>
                          ) : (
                            <button onClick={() => openCreate(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 active:scale-[0.97]" style={{ backgroundColor: COLORS.ACCENT }}>
                              <KeyRound size={12} />Crear
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL ─── */}
      {modal && selectedPersona && tipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div
            className="bg-white rounded-[1.75rem] w-full max-w-lg overflow-hidden shadow-2xl border"
            style={{
              borderColor: "color-mix(in srgb, white 75%, rgba(0,0,0,0.08))",
              boxShadow: `0 30px 80px -20px ${tipo.accent}30`,
            }}
          >
            {/* ─── HEADER ─── */}
            <div className="relative border-b overflow-hidden" style={{ borderColor: "color-mix(in srgb, white 65%, rgba(0,0,0,0.08))" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${tipo.accent}12 0%, transparent 60%)` }} />
              <div className="relative px-6 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-4">
                  <div className="size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: tipo.soft, color: tipo.accent }}>
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: tipo.soft, color: tipo.accent }}>
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: tipo.accent }} />
                        {tipo.label}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: modalMode === "editar" ? "oklch(0.72 0.18 72 / 0.15)" : "oklch(0.58 0.18 260 / 0.12)", color: modalMode === "editar" ? "oklch(0.72 0.18 72)" : COLORS.ACCENT }}>
                        {modalMode === "editar" ? "Editar cuenta" : "Nueva cuenta"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
                      {selectedPersona.nombres} {selectedPersona.apellidos}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                      {modalMode === "editar" ? "Modifica el usuario o cambia la contraseña" : "Crea una cuenta de acceso para el sistema"}
                    </p>
                  </div>
                  <button onClick={closeModal} className="size-9 flex items-center justify-center rounded-xl bg-black/5 hover:bg-black/10 transition-colors shrink-0">
                    <X size={16} style={{ color: COLORS.TEXT_MUTED }} />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── FORM ─── */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
              {/* Username */}
              <div className="rounded-2xl border-2 p-5 transition-all" style={{ borderColor: `${tipo.accent}20`, background: `${tipo.accent}04` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: COLORS.TEXT_MUTED }}>Usuario</span>
                  <span className="text-[10px] text-red-400 font-bold">*</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full mt-2 px-4 py-3 bg-white border-2 rounded-xl text-sm font-medium outline-none transition-all focus:ring-4"
                  style={{
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.CHARCOAL,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = tipo.accent
                    e.currentTarget.style.boxShadow = `0 0 0 4px ${tipo.accent}18`
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
                    e.currentTarget.style.boxShadow = "none"
                  }}
                  required
                />
                <p className="text-[10px] mt-1.5 px-1" style={{ color: COLORS.TEXT_MUTED }}>Nombre de inicio de sesión único en el sistema</p>
              </div>

              {/* Password */}
              <div className="rounded-2xl border-2 p-5 transition-all" style={{ borderColor: modalMode === "editar" && !editPassword ? "oklch(0.88 0 0)" : `${tipo.accent}20`, background: modalMode === "editar" && !editPassword ? "oklch(0.985 0 0)" : `${tipo.accent}04` }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: COLORS.TEXT_MUTED }}>Contraseña</span>
                    {modalMode === "crear" && <span className="text-[10px] text-red-400 font-bold">*</span>}
                  </div>
                  {modalMode === "editar" && (
                    <button
                      type="button"
                      onClick={() => { setEditPassword(!editPassword); if (!editPassword) setPassword("") }}
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        backgroundColor: editPassword ? `${tipo.accent}12` : "oklch(0.95 0 0)",
                        color: editPassword ? tipo.accent : COLORS.TEXT_MUTED,
                      }}
                    >
                      {editPassword ? "Cancelar cambio" : "Cambiar contraseña"}
                    </button>
                  )}
                </div>
                {(modalMode === "crear" || editPassword) && (
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 rounded-xl text-sm font-medium outline-none transition-all focus:ring-4 pr-12"
                      style={{
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.CHARCOAL,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = tipo.accent
                        e.currentTarget.style.boxShadow = `0 0 0 4px ${tipo.accent}18`
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
                        e.currentTarget.style.boxShadow = "none"
                      }}
                      placeholder={modalMode === "editar" ? "Nueva contraseña..." : "Mín 6 caracteres"}
                      required={modalMode === "crear"}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-black/5"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                )}
                {modalMode === "editar" && !editPassword && (
                  <p className="mt-3 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    <Check size={12} className="inline mr-1" style={{ color: "oklch(0.55 0.18 150)" }} />
                    La contraseña actual se mantiene sin cambios
                  </p>
                )}
                {modalMode === "crear" && (
                  <p className="text-[10px] mt-1.5 px-1" style={{ color: COLORS.TEXT_MUTED }}>Si se deja vacía, se usará "cambio123" como contraseña por defecto</p>
                )}
              </div>

              {/* ─── FOOTER ─── */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 rounded-xl text-sm font-medium transition-all border active:scale-[0.98]"
                  style={{
                    backgroundColor: "white",
                    color: COLORS.TEXT_MUTED,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "oklch(0.98 0 0)" }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "white" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] hover:translate-y-[-1px]"
                  style={{
                    background: `linear-gradient(135deg, ${tipo.accent} 0%, color-mix(in srgb, ${tipo.accent} 78%, black) 100%)`,
                    opacity: saving ? 0.65 : 1,
                    boxShadow: `0 18px 34px -20px ${tipo.accent}`,
                  }}
                >
                  {saving ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando...
                    </>
                  ) : modalMode === "editar" ? (
                    <><Check size={16} /> Actualizar cuenta</>
                  ) : (
                    <><KeyRound size={16} /> Crear cuenta</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
