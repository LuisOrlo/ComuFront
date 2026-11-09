import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Download01Icon,
  UserGroupIcon,
  ViewIcon,
  Copy01Icon,
  CallIcon,
  Mail01Icon,
  Location01Icon,
  Briefcase01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { MessageCircle, X, Sparkles } from "lucide-react"
import type { Taller, InscripcionTaller } from "@/services/taller.service"
import { tallerService } from "@/services/taller.service"
import { CiudadBadge } from "@/pages/estudiantes/components/Badges"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
import { toast } from "sonner"

interface Props {
  taller: Taller
  inscripciones: InscripcionTaller[]
  loading: boolean
}

export function TallerParticipantes({ taller, inscripciones, loading }: Props) {
  const [search, setSearch] = useState("")
  const [selectedParticipante, setSelectedParticipante] = useState<InscripcionTaller | null>(null)

  const inscritosActivos = useMemo(
    () => inscripciones.filter((i) => i.estado === "activo"),
    [inscripciones]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return inscripciones.filter((i) => {
      if (i.estado === "retirado") return false
      if (!q) return true
      const nombre = `${i.nombres || ""} ${i.apellidos || ""}`.toLowerCase()
      const cedula = (i.cedula || "").toLowerCase()
      const ciudad = (i.ciudad || "").toLowerCase()
      const correo = (i.correo || "").toLowerCase()
      const ocupacion = (i.ocupacion || "").toLowerCase()
      return (
        nombre.includes(q) ||
        cedula.includes(q) ||
        ciudad.includes(q) ||
        correo.includes(q) ||
        ocupacion.includes(q)
      )
    })
  }, [inscripciones, search])

  const handleDescargarListado = async () => {
    try {
      const data = await tallerService.getAsistenciaPDFDataInstructor(taller.id)
      await generarListadoAsistenciaPDF({ ...data, tipo: "taller" })
      toast.success("Listado de asistencia descargado en PDF")
    } catch {
      toast.error("Error al generar el PDF del listado")
    }
  }

  const copiarTexto = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt)
    toast.success(`${label} copiado al portapapeles`)
  }

  // Limpiar teléfono para WhatsApp (Ecuador +593 o número local)
  const getWhatsAppUrl = (tel?: string) => {
    if (!tel) return null
    let clean = tel.replace(/\D/g, "")
    if (clean.startsWith("0")) {
      clean = "593" + clean.substring(1)
    } else if (!clean.startsWith("593") && clean.length === 9) {
      clean = "593" + clean
    }
    return `https://wa.me/${clean}`
  }

  return (
    <div className="space-y-4">
      {/* Contenedor Principal de la Tabla */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
        {/* Barra superior con Buscador y Acciones */}
        <div className="p-5 sm:p-6 border-b border-[#e5eeff] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <HugeiconsIcon
              icon={Search01Icon}
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula, ciudad u ocupación..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <HugeiconsIcon icon={UserGroupIcon} size={15} className="text-[#fd761a]" />
              <span>
                <strong>{inscritosActivos.length}</strong> {inscritosActivos.length === 1 ? "alumno activo" : "alumnos activos"}
              </span>
            </span>

            <button
              type="button"
              onClick={handleDescargarListado}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#ea580c] transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Tabla de Alumnos */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500">
              Cargando participantes inscritos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="text-sm font-bold text-[#0b1c30]">
                {search ? "No se encontraron alumnos" : "No hay participantes en lista"}
              </p>
              <p className="text-xs text-slate-400">
                {search
                  ? `No se encontraron coincidencias para "${search}".`
                  : "Aún no se han registrado inscripciones activas para este taller."}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e5eeff] bg-[#f8faff] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 font-mono text-center">#</th>
                  <th className="py-3.5 px-5">Estudiante</th>
                  <th className="py-3.5 px-4">Cédula</th>
                  <th className="py-3.5 px-4">Ciudad</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4">Ocupación / Profesión</th>
                  <th className="py-3.5 px-5 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                {filtered.map((ins, idx) => (
                  <tr
                    key={ins.id}
                    onClick={() => setSelectedParticipante(ins)}
                    className="hover:bg-[#eff4ff]/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-orange-100 text-[#fd761a] font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {`${ins.nombres?.charAt(0) || ""}${ins.apellidos?.charAt(0) || ""}`.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0b1c30] group-hover:text-[#fd761a] transition-colors truncate">
                            {ins.nombres} {ins.apellidos}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{ins.correo || "Sin correo"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {ins.cedula || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      {ins.ciudad ? (
                        <CiudadBadge ciudad={ins.ciudad} />
                      ) : (
                        <span className="text-slate-400 italic">No especificada</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {ins.telefono ? (
                        <span className="font-medium">{ins.telefono}</span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {ins.ocupacion ? (
                        <span className="capitalize">{ins.ocupacion}</span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedParticipante(ins)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-[#fd761a] hover:text-white transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                        title="Ver ficha completa del estudiante"
                      >
                        <HugeiconsIcon icon={ViewIcon} size={14} />
                        <span>Ver Datos</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FICHA DE DATOS DEL ESTUDIANTE */}
      {/* ========================================================================= */}
      {selectedParticipante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-orange-50 via-white to-amber-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-[#fd761a] text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                  {`${selectedParticipante.nombres?.charAt(0) || ""}${selectedParticipante.apellidos?.charAt(0) || ""}`.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {selectedParticipante.nombres} {selectedParticipante.apellidos}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>Cédula: <strong>{selectedParticipante.cedula || "—"}</strong></span>
                    {selectedParticipante.ciudad && (
                      <>
                        <span>•</span>
                        <span>{selectedParticipante.ciudad}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParticipante(null)}
                className="size-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido / Datos Detallados */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Tarjeta: Contacto Directo */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Canales de Comunicación
                </span>

                {/* Teléfono */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <HugeiconsIcon icon={CallIcon} size={15} className="text-[#fd761a] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight">Número Telefónico</span>
                      <strong className="font-mono text-sm text-[#0b1c30]">
                        {selectedParticipante.telefono || "No registrado"}
                      </strong>
                    </div>
                  </div>

                  {selectedParticipante.telefono && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => copiarTexto(selectedParticipante.telefono!, "Teléfono")}
                        className="px-2.5 py-1 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 font-semibold"
                        title="Copiar número"
                      >
                        <HugeiconsIcon icon={Copy01Icon} size={12} />
                        <span>Copiar</span>
                      </button>

                      {getWhatsAppUrl(selectedParticipante.telefono) && (
                        <a
                          href={getWhatsAppUrl(selectedParticipante.telefono)!}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1 font-bold shadow-2xs"
                        >
                          <MessageCircle size={12} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Correo */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700 min-w-0">
                    <HugeiconsIcon icon={Mail01Icon} size={15} className="text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block leading-tight">Correo Electrónico</span>
                      <span className="font-semibold text-xs text-[#0b1c30] truncate block">
                        {selectedParticipante.correo || "No registrado"}
                      </span>
                    </div>
                  </div>

                  {selectedParticipante.correo && (
                    <a
                      href={`mailto:${selectedParticipante.correo}`}
                      className="px-2.5 py-1 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors font-bold shrink-0"
                    >
                      Enviar correo
                    </a>
                  )}
                </div>
              </div>

              {/* Grid: Datos Personales y Profesionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ciudad donde vive */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <HugeiconsIcon icon={Location01Icon} size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Ciudad de Residencia</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedParticipante.ciudad || "No declarada"}
                  </p>
                </div>

                {/* Profesión / Ocupación */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <HugeiconsIcon icon={Briefcase01Icon} size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Profesión / Ocupación</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {selectedParticipante.ocupacion || "No especificada"}
                  </p>
                </div>

                {/* Estado Civil */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <HugeiconsIcon icon={UserIcon} size={14} className="text-amber-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Estado Civil</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {selectedParticipante.estado_civil || "No declarado"}
                  </p>
                </div>

                {/* Nivel Educativo / Edad */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Sparkles size={14} className="text-[#fd761a]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Edad / Nivel</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedParticipante.edad ? `${selectedParticipante.edad} años` : "—"}
                    {selectedParticipante.nivel_educativo ? ` • ${selectedParticipante.nivel_educativo}` : ""}
                  </p>
                </div>
              </div>

              {/* Dirección */}
              {selectedParticipante.direccion && (
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Dirección Domiciliaria
                  </span>
                  <p className="text-xs text-slate-700 font-medium">
                    {selectedParticipante.direccion}
                  </p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedParticipante(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
