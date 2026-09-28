import { useState, useEffect, useMemo } from "react"
import {
  Search,
  KeyRound,
  X,
  Check,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { personasService, type Persona } from "@/services/personas.service"
import { toast } from "sonner"

type ModalMode = "crear" | "editar"

const TIPO_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string; avatar: string }
> = {
  instructor: {
    label: "Instructor",
    badge: "bg-blue-50 text-blue-700 border-blue-200/60",
    dot: "bg-blue-500",
    avatar: "bg-blue-50 text-blue-700 border-blue-200",
  },
  staff: {
    label: "Staff",
    badge: "bg-amber-50 text-amber-700 border-amber-200/60",
    dot: "bg-amber-500",
    avatar: "bg-amber-50 text-amber-700 border-amber-200",
  },
  secretaria: {
    label: "Secretaría",
    badge: "bg-purple-50 text-purple-700 border-purple-200/60",
    dot: "bg-purple-500",
    avatar: "bg-purple-50 text-purple-700 border-purple-200",
  },
  admin: {
    label: "Administrador",
    badge: "bg-rose-50 text-rose-700 border-rose-200/60",
    dot: "bg-rose-500",
    avatar: "bg-rose-50 text-rose-700 border-rose-200",
  },
  estudiante: {
    label: "Estudiante",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
    avatar: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pasante: {
    label: "Pasante",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    dot: "bg-cyan-500",
    avatar: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
}

export function CuentasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [cuentaFiltro, setCuentaFiltro] = useState<string>("todos")

  // Estado del Modal
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
      const res = await personasService.getPersonas({
        buscar: search || undefined,
        tipo: tipoFiltro !== "todos" ? tipoFiltro : undefined,
        per_page: 100,
        page: 1,
      })
      setPersonas(res.data || [])
    } catch {
      toast.error("Error al cargar las personas y cuentas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tipoFiltro])

  const filteredPersonas = useMemo(() => {
    return personas.filter((p) => {
      if (cuentaFiltro === "con_cuenta") return Boolean(p.cuentaSistema)
      if (cuentaFiltro === "sin_cuenta") return !p.cuentaSistema
      return true
    })
  }, [personas, cuentaFiltro])

  // Contadores analíticos
  const stats = useMemo(() => {
    const total = personas.length
    const conCuenta = personas.filter((p) => Boolean(p.cuentaSistema)).length
    const sinCuenta = total - conCuenta
    const activos = personas.filter((p) => p.es_activo !== false).length
    return { total, conCuenta, sinCuenta, activos }
  }, [personas])

  const openCreate = (p: Persona) => {
    setSelectedPersona(p)
    setModalMode("crear")
    const primerNombre = (p.nombres || "").trim().split(/\s+/)[0] || ""
    const primerApellido = (p.apellidos || "").trim().split(/\s+/)[0] || ""
    const sugerido = `${primerNombre}.${primerApellido}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]/g, "")
      .slice(0, 18)

    setUsername(sugerido)
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
        toast.success("Cuenta actualizada correctamente")
      } else {
        await personasService.crearCuenta(
          selectedPersona.id,
          username,
          password || "cambio123"
        )
        toast.success("Cuenta de acceso creada exitosamente")
      }
      closeModal()
      cargar()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || "Error al procesar la cuenta")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (nombres?: string, apellidos?: string) => {
    const n = (nombres || "").trim()[0] || ""
    const a = (apellidos || "").trim()[0] || ""
    return (n + a).toUpperCase() || "U"
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Cabecera Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Cuentas de Sistema
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Administración y credenciales de acceso para instructores, secretaría y staff operativo.
            </p>
          </div>

          <button
            type="button"
            onClick={cargar}
            disabled={loading}
            className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-2 transition-all self-start sm:self-center disabled:opacity-50 cursor-pointer active:scale-95"
            title="Recargar listado"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin text-[#fd761a]")} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* 1. Barra de Búsqueda y Filtros */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, usuario o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 h-9 text-xs rounded-xl bg-slate-50/70 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filtros por Rol y Cuenta */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro Rol */}
            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl">
              {[
                { id: "todos", label: "Todos los roles" },
                { id: "instructor", label: "Instructores" },
                { id: "staff", label: "Staff" },
                { id: "secretaria", label: "Secretaría" },
                { id: "admin", label: "Admin" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTipoFiltro(tab.id)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    tipoFiltro === tab.id
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtro Estado de Cuenta */}
            <select
              value={cuentaFiltro}
              onChange={(e) => setCuentaFiltro(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl bg-slate-50/70 border border-slate-200 text-slate-700 outline-none focus:border-[#fd761a] transition-all cursor-pointer"
            >
              <option value="todos">Todas las cuentas</option>
              <option value="con_cuenta">Con cuenta creada</option>
              <option value="sin_cuenta">Sin cuenta asignada</option>
            </select>
          </div>
        </div>

        {/* 3. Tabla de Usuarios y Cuentas */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Persona / Personal</th>
                  <th className="py-3 px-4">Rol en el Sistema</th>
                  <th className="py-3 px-4">Usuario de Acceso</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                        <RefreshCw size={16} className="animate-spin text-[#fd761a]" />
                        <span>Cargando directorio de personal...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPersonas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <User size={28} className="text-slate-300 mb-1" />
                        <p className="text-xs font-bold text-slate-700">
                          No se encontraron personas
                        </p>
                        <p className="text-[11px]">
                          Intenta modificar los filtros de búsqueda o el tipo de rol.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPersonas.map((p) => {
                    const cfg = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.instructor
                    const tieneCuenta = Boolean(p.cuentaSistema)

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Persona */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "size-9 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 shadow-xs",
                                cfg.avatar
                              )}
                            >
                              {getInitials(p.nombres, p.apellidos)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 leading-snug truncate">
                                {p.nombres} {p.apellidos}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="truncate">{p.correo || "Sin correo"}</span>
                                {p.cedula && (
                                  <>
                                    <span>•</span>
                                    <span>CI: {p.cedula}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border",
                              cfg.badge
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Usuario */}
                        <td className="px-4 py-3.5">
                          {tieneCuenta ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs font-bold shadow-xs">
                              <ShieldCheck size={13} className="text-emerald-600" />
                              {p.cuentaSistema?.username}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                              <ShieldAlert size={12} className="text-slate-300" />
                              Sin cuenta
                            </span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              p.es_activo !== false
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                p.es_activo !== false ? "bg-emerald-500" : "bg-slate-400"
                              )}
                            />
                            {p.es_activo !== false ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 text-right">
                          {tieneCuenta ? (
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              <KeyRound size={13} className="text-slate-500" />
                              <span>Editar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openCreate(p)}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#fd761a] hover:bg-[#e06512] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              <KeyRound size={13} />
                              <span>Crear cuenta</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pie de tabla con conteo */}
          {!loading && filteredPersonas.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando {filteredPersonas.length} de {personas.length} personas registradas
              </span>
              <span className="font-semibold text-slate-700">
                {stats.conCuenta} usuarios activos en el sistema
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL DE GESTIÓN DE CUENTA ─── */}
      {modal && selectedPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header del Modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-11 rounded-xl bg-orange-50 border border-orange-200 text-[#fd761a] flex items-center justify-center shrink-0 shadow-xs">
                  <KeyRound size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        (TIPO_CONFIG[selectedPersona.tipo] || TIPO_CONFIG.instructor).badge
                      )}
                    >
                      {(TIPO_CONFIG[selectedPersona.tipo] || TIPO_CONFIG.instructor).label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {modalMode === "editar" ? "Modificar" : "Asignar"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {selectedPersona.nombres} {selectedPersona.apellidos}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedPersona.correo || "Sin correo electrónico"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Usuario */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nombre de Usuario <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ej. juan.perez"
                    required
                    className="w-full pl-9 pr-4 h-10 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Identificador único para iniciar sesión en Comunikate.
                </p>
              </div>

              {/* Contraseña */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña {modalMode === "crear" && <span className="text-rose-500">*</span>}
                  </label>

                  {modalMode === "editar" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditPassword(!editPassword)
                        if (!editPassword) setPassword("")
                      }}
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer",
                        editPassword
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {editPassword ? "Cancelar cambio" : "Cambiar contraseña"}
                    </button>
                  )}
                </div>

                {(modalMode === "crear" || editPassword) && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        modalMode === "editar"
                          ? "Escribe la nueva contraseña..."
                          : "Dejar vacío para usar 'cambio123'"
                      }
                      minLength={6}
                      className="w-full pl-3.5 pr-10 h-10 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/15 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                )}

                {modalMode === "crear" && (
                  <p className="text-[11px] text-slate-400">
                    Si no especificas una contraseña, se asignará{" "}
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                      cambio123
                    </code>{" "}
                    por defecto.
                  </p>
                )}

                {modalMode === "editar" && !editPassword && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs text-slate-600">
                    <Check size={14} className="text-emerald-600 shrink-0" />
                    <span>La contraseña actual se mantendrá sin modificaciones.</span>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 rounded-xl bg-[#fd761a] hover:bg-[#e06512] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : modalMode === "editar" ? (
                    <>
                      <Check size={15} />
                      <span>Actualizar cuenta</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>Crear cuenta</span>
                    </>
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
