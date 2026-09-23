import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Money01Icon,
  CheckmarkCircle04Icon,
  AlertCircleIcon,
  Camera01Icon,
  Image01Icon,
  Delete02Icon,
  Upload01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { Loader2 } from "lucide-react"
import { cn, getStorageUrl } from "@/lib/utils"
import { equiposService, type Equipo } from "@/services/equipos.service"
import { toast } from "sonner"

const MAX_FOTO_SIZE = 2 * 1024 * 1024

export function NuevoEquipoPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precioDiario, setPrecioDiario] = useState("")
  const [estado, setEstado] = useState<string>("disponible")
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    equiposService
      .getEquipo(id)
      .then((eq: Equipo) => {
        setNombre(eq.nombre)
        setDescripcion(eq.descripcion || "")
        setPrecioDiario(String(eq.precio_diario))
        setEstado(eq.estado || "disponible")
        if (eq.foto_url) {
          setFotoPreview(getStorageUrl(eq.foto_url))
        }
      })
      .catch(() => {
        toast.error("Error al cargar equipo")
        navigate("/servicios/equipos")
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FOTO_SIZE) {
      toast.error("La imagen no debe superar los 2MB")
      e.target.value = ""
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleRemoveFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
  }

  // Comprobar si todos los campos requeridos están completados
  const isFormComplete = Boolean(
    nombre.trim().length >= 2 &&
    descripcion.trim().length > 0 &&
    precioDiario.trim() !== "" &&
    Number(precioDiario) > 0 &&
    !saving
  )

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!nombre.trim()) newErrors.nombre = "El nombre del equipo es obligatorio"
    else if (nombre.trim().length < 2) newErrors.nombre = "Mínimo 2 caracteres"

    if (!descripcion.trim()) newErrors.descripcion = "La descripción del equipo es obligatoria"

    if (!precioDiario || Number(precioDiario) <= 0) {
      newErrors.precioDiario = "Ingresa un precio diario válido (mayor a $0)"
    }

    setErrors(newErrors)
    setTouched({ nombre: true, descripcion: true, precioDiario: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const form = new FormData()
      form.append("nombre", nombre.trim())
      form.append("descripcion", descripcion.trim())
      form.append("precio_diario", String(Number(precioDiario)))
      form.append("estado", estado || "disponible")
      if (fotoFile) form.append("foto", fotoFile)

      if (isEdit && id) {
        await equiposService.updateEquipo(id, form)
        toast.success("Equipo actualizado con éxito")
      } else {
        await equiposService.createEquipo(form)
        toast.success("Equipo registrado con éxito en el catálogo")
      }
      navigate("/servicios/equipos")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al guardar equipo"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[450px] bg-[#f8f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin size-8 border-[3px] border-t-transparent rounded-full border-[#fd761a]" />
          <p className="text-xs font-semibold text-slate-500">Cargando datos del equipo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/servicios/equipos")}
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              title="Volver al catálogo"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </button>
            <div className="min-w-0">
              
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5 truncate">
                {isEdit ? `Editar Equipo: ${nombre || "Sin nombre"}` : "Nuevo Equipo"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/servicios/equipos")}
              className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormComplete}
              className={cn(
                "h-10 px-5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2",
                isFormComplete
                  ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                  <span>{isEdit ? "Actualizar Equipo" : "Guardar Equipo"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formulario en Cuadrícula de 2 Columnas */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Principal Izquierda */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Card 1: Información General */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Camera01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Ficha Técnica del Equipo
                  </h2>
                  
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Nombre del equipo <span className="text-[#fd761a]">*</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {nombre.length}/100
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={100}
                    value={nombre}
                    onChange={(e) => {
                      setNombre(e.target.value)
                      if (errors.nombre) {
                        setErrors((prev) => {
                          const n = { ...prev }
                          delete n.nombre
                          return n
                        })
                      }
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, nombre: true }))}
                    placeholder="Ej. Cámara Sony Alpha A7 III + Lente 28-70mm"
                    className={cn(
                      "w-full h-11 px-3.5 rounded-xl border bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all",
                      touched.nombre && errors.nombre
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20",
                    )}
                  />
                </div>
                {touched.nombre && errors.nombre && (
                  <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                    <span>{errors.nombre}</span>
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Descripción y Accesorios Incluidos <span className="text-[#fd761a]">*</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Obligatorio</span>
                </label>
                <textarea
                  rows={4}
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value)
                    if (errors.descripcion) {
                      setErrors((prev) => {
                        const n = { ...prev }
                        delete n.descripcion
                        return n
                      })
                    }
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, descripcion: true }))}
                  placeholder="Detalla qué incluye el equipo (ej: 2 baterías, cargador dual, estuche semirrígido, tarjeta SD 64GB) o especificaciones técnicas."
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all",
                    touched.descripcion && errors.descripcion
                      ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                      : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20",
                  )}
                />
                {touched.descripcion && errors.descripcion && (
                  <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                    <span>{errors.descripcion}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  Esta información se visualizará en el catálogo y en el acta de entrega.
                </p>
              </div>
            </div>

            {/* Card 2: Precio de Alquiler */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Money01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Tarifa de Alquiler
                  </h2>
                  <p className="text-xs text-slate-500">
                    Costo por día para la facturación del servicio
                  </p>
                </div>
              </div>

              {/* Precio Diario */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Precio diario de alquiler ($) <span className="text-[#fd761a]">*</span>
                </label>
                <div className="relative max-w-xs">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <span className="w-px h-4 bg-slate-200" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioDiario}
                    onChange={(e) => {
                      setPrecioDiario(e.target.value)
                      if (errors.precioDiario) {
                        setErrors((prev) => {
                          const n = { ...prev }
                          delete n.precioDiario
                          return n
                        })
                      }
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, precioDiario: true }))}
                    placeholder="0.00"
                    className={cn(
                      "w-full h-11 pl-9 pr-14 rounded-xl border bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none transition-all",
                      touched.precioDiario && errors.precioDiario
                        ? "border-red-400 focus:ring-2 focus:ring-red-400/20"
                        : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20",
                    )}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                    / día
                  </span>
                </div>
                {touched.precioDiario && errors.precioDiario && (
                  <p className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                    <HugeiconsIcon icon={AlertCircleIcon} size={12} />
                    <span>{errors.precioDiario}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Columna Lateral Derecha */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card 3: Fotografía del Equipo */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Image01Icon} size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Fotografía del Equipo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Imagen de referencia para el catálogo
                  </p>
                </div>
              </div>

              {fotoPreview ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                    <img
                      src={fotoPreview}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-800 text-xs font-semibold cursor-pointer hover:bg-white transition-colors shadow-sm">
                        Cambiar foto
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          onChange={handleFotoChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveFoto}
                        className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                        title="Eliminar foto"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{fotoFile ? fotoFile.name : "Imagen cargada"}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Quitar imagen
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-[#fd761a]/60 hover:bg-orange-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                  <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <HugeiconsIcon icon={Upload01Icon} size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Cargar imagen del equipo
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 max-w-[210px]">
                    Arrastra o haz clic para subir (JPG, PNG o WEBP, máx. 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
                </label>
              )}
            </div>

            {/* Card 4: Vista Previa en Vivo (Live Card Preview) */}
            <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/90 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <HugeiconsIcon icon={InformationCircleIcon} size={15} className="text-slate-400" />
                  Vista Previa en Catálogo
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  En tiempo real
                </span>
              </div>

              {/* Mockup de la tarjeta en el catálogo */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden shadow-xs bg-white">
                <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Preview tarjeta"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                      <HugeiconsIcon icon={Camera01Icon} size={36} />
                      <span className="text-[10px] font-semibold">Sin imagen</span>
                    </div>
                  )}

                  {/* Estado Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-xs backdrop-blur-md bg-emerald-50 text-emerald-700 border-emerald-200">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Disponible
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {nombre.trim() || "Nombre del equipo"}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {descripcion.trim() || "La descripción del equipo aparecerá aquí..."}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <span className="text-base font-extrabold text-slate-900 tracking-tight">
                      ${precioDiario && Number(precioDiario) > 0 ? Number(precioDiario).toFixed(2) : "0.00"}
                      <span className="text-[11px] font-medium text-slate-400 ml-1">/ día</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#fd761a] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                      Disponible para renta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="lg:col-span-12 pt-3 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 mt-2">
            {!isFormComplete && (
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <HugeiconsIcon icon={InformationCircleIcon} size={14} className="text-slate-400" />
                <span>Completa todos los campos obligatorios (*) para habilitar el guardado.</span>
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => navigate("/servicios/equipos")}
                className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormComplete}
                className={cn(
                  "h-11 px-7 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2",
                  isFormComplete
                    ? "bg-[#fd761a] hover:opacity-95 text-white active:scale-95 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle04Icon} size={17} />
                    <span>{isEdit ? "Actualizar Equipo" : "Guardar Equipo"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
