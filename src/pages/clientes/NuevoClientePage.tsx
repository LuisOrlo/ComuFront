import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Delete02Icon,
  Add01Icon,
  UserIcon,
  Building04Icon,
  CallIcon,
  Mail01Icon,
  IdentificationIcon,
  Location01Icon,
  CheckmarkCircle04Icon,
  Briefcase01Icon,
  Tick02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { clientesService, type ClienteExterno, type ClienteExternoContacto } from "@/services/clientes.service"
import { ECUADOR_CITIES } from "@/data/ciudades-ecuador"
import { toast } from "sonner"

type TipoCliente = "persona" | "empresa"
type ContactoForm = ClienteExternoContacto
const emptyContacto = (): ContactoForm => ({
  nombres: "",
  apellidos: "",
  cargo: "",
  celular: "",
  correo: "",
  es_principal: false,
  activo: true,
})

export function NuevoClientePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const returnTo = searchParams.get("returnTo")

  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("persona")
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [nombreEmpresa, setNombreEmpresa] = useState("")
  const [cedula, setCedula] = useState("")
  const [celular, setCelular] = useState("")
  const [correo, setCorreo] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ocupacion, setOcupacion] = useState("")
  const [estadoCivil, setEstadoCivil] = useState("")
  const [contactos, setContactos] = useState<ContactoForm[]>([emptyContacto()])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!id) return
    clientesService
      .getCliente(id)
      .then((cliente: ClienteExterno) => {
        setTipoCliente(cliente.tipo_cliente || "persona")
        setNombres(cliente.nombres || "")
        setApellidos(cliente.apellidos || "")
        setNombreEmpresa(cliente.nombre_empresa || "")
        setCedula(cliente.cedula || "")
        setCelular(cliente.celular || "")
        setCorreo(cliente.correo || "")
        setCiudad(cliente.ciudad || "")
        setDireccion(cliente.direccion || "")
        setOcupacion(cliente.ocupacion || "")
        setEstadoCivil(cliente.estado_civil || "")
        if (cliente.contactos?.length) {
          setContactos(
            cliente.contactos.map((contacto) => ({
              ...contacto,
              activo: contacto.activo !== false,
            })),
          )
        }
      })
      .catch(() => {
        toast.error("Error al cargar datos del cliente")
        navigate("/clientes")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const updateContacto = (index: number, field: keyof ContactoForm, value: string | boolean) => {
    setContactos((current) =>
      current.map((contacto, i) => (i === index ? { ...contacto, [field]: value } : contacto)),
    )
  }

  const setPrincipal = (index: number) => {
    setContactos((current) =>
      current.map((contacto, i) => ({ ...contacto, es_principal: i === index })),
    )
  }

  // Validación de campos obligatorios
  const isFormValid = useMemo(() => {
    if (tipoCliente === "persona") {
      return Boolean(
        nombres.trim() &&
        apellidos.trim() &&
        cedula.trim() &&
        celular.trim() &&
        correo.trim()
      )
    }

    if (tipoCliente === "empresa") {
      const empresaOk = Boolean(
        nombreEmpresa.trim() &&
        celular.trim() &&
        correo.trim()
      )
      const activeContactos = contactos.filter((c) => c.activo !== false)
      if (activeContactos.length === 0) return false

      const contactosOk = activeContactos.every(
        (c) => Boolean(c.nombres.trim()) && Boolean(c.celular?.trim())
      )
      return empresaOk && contactosOk
    }

    return false
  }, [tipoCliente, nombres, apellidos, cedula, celular, correo, nombreEmpresa, contactos])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isFormValid) {
      return toast.error("Por favor completa todos los campos obligatorios antes de continuar")
    }

    setSaving(true)
    try {
      const payload = {
        tipo_cliente: tipoCliente,
        nombres: tipoCliente === "persona" ? nombres.trim() : undefined,
        apellidos: tipoCliente === "persona" ? apellidos.trim() || undefined : undefined,
        nombre_empresa: tipoCliente === "empresa" ? nombreEmpresa.trim() : undefined,
        cedula: tipoCliente === "persona" ? cedula.trim() || undefined : undefined,
        celular: celular.trim() || undefined,
        correo: correo.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        direccion: direccion.trim() || undefined,
        ocupacion: tipoCliente === "persona" ? ocupacion.trim() || undefined : undefined,
        estado_civil: tipoCliente === "persona" ? estadoCivil.trim() || undefined : undefined,
        contactos:
          tipoCliente === "empresa"
            ? contactos
                .filter((c) => c.nombres.trim())
                .map((c) => ({
                  ...c,
                  nombres: c.nombres.trim(),
                  apellidos: c.apellidos?.trim() || undefined,
                }))
            : undefined,
      }

      const saved =
        isEdit && id
          ? await clientesService.updateCliente(id, payload)
          : await clientesService.createCliente(payload)

      toast.success(isEdit ? "Cliente actualizado correctamente" : "Cliente registrado correctamente")
      if (returnTo) {
        navigate(returnTo, { state: { nuevoCliente: saved } })
      } else {
        navigate(`/clientes/${(saved as ClienteExterno).id}`)
      }
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
      toast.error(
        data?.message ||
          Object.values(data?.errors || {})[0]?.[0] ||
          "Error al guardar cliente",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-[3px] border-t-transparent border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando cliente...</p>
        </div>
      </div>
    )
  }

  const goBack = () => navigate(isEdit ? `/clientes/${id}` : "/clientes")

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 md:py-8 space-y-6">
        {/* Top Navigation Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} className="text-slate-500" />
              <span>Volver a Clientes</span>
            </button>
          
            
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-[#9d4300] text-[11px] font-bold uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-[#fd761a]" />
              {tipoCliente === "persona" ? "Persona Natural" : "Empresa / Institución"}
            </span>
          </div>
        </div>

        {/* Header Hero Card */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="absolute -right-12 -top-12 size-48 bg-[#fd761a]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
              </h1>
              
            </div>
          </div>
        </div>

        {/* Client Type Selector (Interactive 2-Card Layout) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tipo de cliente <span className="text-red-500">*</span>
            </label>
           
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Persona Natural Option */}
            <button
              type="button"
              onClick={() => setTipoCliente("persona")}
              className={cn(
                "group relative text-left p-5 rounded-2xl border transition-all duration-200 shadow-xs cursor-pointer select-none",
                tipoCliente === "persona"
                  ? "bg-orange-50/20 border-[#fd761a] ring-2 ring-[#fd761a]/20"
                  : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    tipoCliente === "persona"
                      ? "bg-[#ffdbca] text-[#9d4300]"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
                  )}
                >
                  <HugeiconsIcon icon={UserIcon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-slate-900 tracking-tight">
                      Persona Natural
                    </span>
                    <span
                      className={cn(
                        "size-5 rounded-full flex items-center justify-center text-xs transition-colors",
                        tipoCliente === "persona"
                          ? "bg-[#fd761a] text-white"
                          : "border border-slate-300 text-transparent"
                      )}
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={13} />
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <HugeiconsIcon icon={IdentificationIcon} size={14} />
                    <span>Identificación con Cédula personal</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Empresa / Institución Option */}
            <button
              type="button"
              onClick={() => setTipoCliente("empresa")}
              className={cn(
                "group relative text-left p-5 rounded-2xl border transition-all duration-200 shadow-xs cursor-pointer select-none",
                tipoCliente === "empresa"
                  ? "bg-orange-50/20 border-[#fd761a] ring-2 ring-[#fd761a]/20"
                  : "bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    tipoCliente === "empresa"
                      ? "bg-[#ffdbca] text-[#9d4300]"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
                  )}
                >
                  <HugeiconsIcon icon={Building04Icon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-slate-900 tracking-tight">
                      Empresa / Institución
                    </span>
                    <span
                      className={cn(
                        "size-5 rounded-full flex items-center justify-center text-xs transition-colors",
                        tipoCliente === "empresa"
                          ? "bg-[#fd761a] text-white"
                          : "border border-slate-300 text-transparent"
                      )}
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={13} />
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#9d4300]">
                    <HugeiconsIcon icon={UserGroupIcon} size={14} />
                    <span>Permite múltiples representantes autorizados</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {tipoCliente === "persona" ? (
            /* ================= VIEW: PERSONA NATURAL ================= */
            <>
              {/* Sección 01: Información Personal */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#fd761a] block">
                      Sección 01
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">Información Personal</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Titular individual</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Nombres <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Ej. Sofía Elizabeth"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Ej. Morales Carrera"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Cédula / Documento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400 font-mono"
                        placeholder="10 dígitos numéricos"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                        required
                      />
                      <HugeiconsIcon
                        icon={IdentificationIcon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Ocupación / Profesión <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Ej. Productor Audiovisual"
                        value={ocupacion}
                        onChange={(e) => setOcupacion(e.target.value)}
                      />
                      <HugeiconsIcon
                        icon={Briefcase01Icon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Estado civil <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                    </label>
                    <select
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all cursor-pointer"
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="soltero">Soltero/a</option>
                      <option value="casado">Casado/a</option>
                      <option value="divorciado">Divorciado/a</option>
                      <option value="viudo">Viudo/a</option>
                      <option value="union">Unión Libre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 02: Contacto y Ubicación */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#fd761a] block">
                    Sección 02
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Contacto y Ubicación</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Celular personal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400 font-mono"
                        placeholder="Ej. 0998765432"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                        required
                      />
                      <HugeiconsIcon
                        icon={CallIcon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder="ejemplo@correo.com"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                      />
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Ciudad <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                    </label>
                    <select
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all cursor-pointer"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                    >
                      <option value="">Seleccionar ciudad...</option>
                      {ciudad && !ECUADOR_CITIES.includes(ciudad) && (
                        <option value={ciudad}>{ciudad}</option>
                      )}
                      {ECUADOR_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Dirección domiciliaria <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Calle principal, número y secundaria"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                      />
                      <HugeiconsIcon
                        icon={Location01Icon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ================= VIEW: EMPRESA / INSTITUCIÓN ================= */
            <>
              {/* Sección 01: Información de la Empresa */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#fd761a] block">
                      Sección 01
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">Información de la Empresa</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Entidad jurídica / corporativa</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Nombre de la empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Ej. Corporación Audiovisual del Austro S.A."
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Teléfono / Celular general <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400 font-mono"
                        placeholder="Ej. 0998765432"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                        required
                      />
                      <HugeiconsIcon
                        icon={CallIcon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Correo electrónico general / facturación <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder="contacto@empresa.com"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                      />
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Ciudad <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                    </label>
                    <select
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all cursor-pointer"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                    >
                      <option value="">Seleccionar ciudad...</option>
                      {ciudad && !ECUADOR_CITIES.includes(ciudad) && (
                        <option value={ciudad}>{ciudad}</option>
                      )}
                      {ECUADOR_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Dirección fiscal / Sede administrativa <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Calle principal, número y secundaria"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                      />
                      <HugeiconsIcon
                        icon={Location01Icon}
                        size={17}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 02: Contactos Delegados */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#fd761a] block">
                      Sección 02
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">Contactos Delegados</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Las reservas y deudas pertenecen a la empresa. Asigna los representantes autorizados para coordinar servicios.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactos((current) => [...current, emptyContacto()])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer shadow-xs"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={15} />
                    <span>Agregar Contacto</span>
                  </button>
                </div>

                {/* List of contact cards */}
                <div className="space-y-4">
                  {contactos.map((contacto, index) => {
                    const isPrincipal = Boolean(contacto.es_principal)
                    const isActivo = contacto.activo !== false

                    return (
                      <div
                        key={contacto.id || index}
                        className={cn(
                          "rounded-2xl border p-5 space-y-4 transition-all",
                          isPrincipal
                            ? "bg-orange-50/15 border-[#fd761a]/40 shadow-xs"
                            : "bg-slate-50/60 border-slate-200/80"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="size-6 rounded-lg bg-slate-200/70 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">
                              {(index + 1).toString().padStart(2, "0")}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {contacto.nombres
                                ? `${contacto.nombres} ${contacto.apellidos || ""}`.trim()
                                : `Contacto ${index + 1}`}
                            </span>
                            {isPrincipal && (
                              <span className="px-2 py-0.5 rounded-full bg-[#ffdbca] text-[#9d4300] text-[10px] font-bold uppercase tracking-wider">
                                Principal
                              </span>
                            )}
                            {!isActivo && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                Inactivo
                              </span>
                            )}
                          </div>

                          {contactos.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setContactos((current) => current.filter((_, i) => i !== index))
                              }
                              className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar contacto"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Nombres <span className="text-red-500">*</span>
                            </label>
                            <input
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                              placeholder="Ej. Mateo Alejandro"
                              value={contacto.nombres}
                              onChange={(e) => updateContacto(index, "nombres", e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Apellidos <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                            </label>
                            <input
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                              placeholder="Ej. Silva Donoso"
                              value={contacto.apellidos || ""}
                              onChange={(e) => updateContacto(index, "apellidos", e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Cargo o función <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                            </label>
                            <input
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                              placeholder="Ej. Coordinador de Producción"
                              value={contacto.cargo || ""}
                              onChange={(e) => updateContacto(index, "cargo", e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Celular directo <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400 font-mono"
                                placeholder="0998765432"
                                value={contacto.celular || ""}
                                onChange={(e) => updateContacto(index, "celular", e.target.value.replace(/\D/g, "").slice(0, 10))}
                                maxLength={10}
                                required
                              />
                              <HugeiconsIcon
                                icon={CallIcon}
                                size={15}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-700">
                              Correo electrónico laboral <span className="text-slate-400 font-normal text-[11px] ml-1">(opcional)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 outline-none transition-all placeholder:text-slate-400"
                                placeholder="contacto@empresa.com"
                                value={contacto.correo || ""}
                                onChange={(e) => updateContacto(index, "correo", e.target.value)}
                              />
                              <HugeiconsIcon
                                icon={Mail01Icon}
                                size={15}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={isPrincipal}
                              onChange={() => setPrincipal(index)}
                              className="size-4 rounded text-[#fd761a] accent-[#fd761a] cursor-pointer"
                            />
                            <span>Contacto principal (Responsable de notificaciones y cobranzas)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={isActivo}
                              onChange={(e) => updateContacto(index, "activo", e.target.checked)}
                              className="size-4 rounded text-[#fd761a] accent-[#fd761a] cursor-pointer"
                            />
                            <span>Activo</span>
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>

                
              </div>
            </>
          )}

          {/* Static Bottom Action Bar (No se mueve con el scroll) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              {isFormValid ? (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-semibold">
                    Todos los campos obligatorios están completos.
                  </span>
                </>
              ) : (
                <>
                  
                  
                </>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormValid || saving}
                title={!isFormValid ? "Completa todos los campos obligatorios para guardar" : undefined}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2",
                  !isFormValid || saving
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer"
                )}
              >
                {saving ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{isEdit ? "Actualizar Cliente" : "Guardar Cliente"}</span>
                )}
              </button>
            </div>
          </div>
        </form>

        
      </div>
    </div>
  )
}
