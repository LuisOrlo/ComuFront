/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  BookOpenIcon,
  PaymentIcon,
  Image01Icon,
  ArrowRight01Icon,
  CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import { fixImageUrl } from "../../AprobacionUtils"
import { CiudadBadge, ModalidadBadge } from "../../../estudiantes/components/Badges"

interface SolicitudResumenTabProps {
  selected: any
  getCursoNombre: () => string
  setExpandedImageUrl: (url: string | null) => void
  cursoCatalogo: string
  cursoPrecio: number
  cursoModalidad: string
  cursoCiudad: string
  cursoHorario: string
  onSelectTab?: (tab: "estudiante" | "curso" | "pago" | "documento") => void
}

export function SolicitudResumenTab({
  selected,
  getCursoNombre,
  setExpandedImageUrl,
  cursoCatalogo,
  cursoPrecio,
  cursoModalidad,
  cursoCiudad,
  cursoHorario,
  onSelectTab,
}: SolicitudResumenTabProps) {
  const cedulaImg = selected.pago?.comprobante?.cedula_url && !selected.pago?.comprobante?.cedula_purgado
    ? fixImageUrl(selected.pago.comprobante.cedula_url)
    : null

  const compImg = selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado
    ? fixImageUrl(selected.pago.comprobante.url)
    : null

  const montoDeclarado = Number(selected.pago?.monto_solicitado) || 0
  const isAprobado = selected?.estado?.valor === "matricula_creada" || selected?.estado?.valor === "aprobado"

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Resumen de la solicitud
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inspección rápida antes de auditoría y aprobación
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-800 self-start sm:self-auto">
          <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="text-orange-600" />
          <span>Listo para revisión formal y distribución contable</span>
        </div>
      </div>

      {/* 4 Summary Cards Grid (Design from code.html) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Estudiante */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <HugeiconsIcon icon={UserIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Estudiante</h3>
                  <span className="text-xs text-slate-500">Datos personales</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verificado
              </span>
            </div>

            <dl className="py-3.5 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Nombre:</dt>
                <dd className="font-bold text-slate-900 truncate max-w-[200px] text-right">
                  {selected.solicitante?.datos?.nombres || "—"} {selected.solicitante?.datos?.apellidos || ""}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Cédula:</dt>
                <dd className="font-mono font-semibold text-slate-800">
                  {selected.solicitante?.datos?.cedula || "—"}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Edad:</dt>
                <dd className="text-slate-800">
                  {selected.solicitante?.datos?.edad ? `${selected.solicitante.datos.edad} años` : "—"}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Ubicación:</dt>
                <dd>
                  <CiudadBadge ciudad={selected.solicitante?.datos?.ciudad} />
                </dd>
              </div>
            </dl>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onSelectTab?.("estudiante")}
              type="button"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <span>Ver información completa</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </button>
          </div>
        </div>

        {/* Card 2: Curso */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <HugeiconsIcon icon={BookOpenIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Curso</h3>
                  <span className="text-xs text-slate-500">Oferta formativa</span>
                </div>
              </div>
              <ModalidadBadge modalidad={cursoModalidad} />
            </div>

            <dl className="py-3.5 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Programa:</dt>
                <dd className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                  {getCursoNombre()}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Catálogo:</dt>
                <dd className="text-slate-800 truncate max-w-[180px]">
                  {cursoCatalogo}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Sede:</dt>
                <dd>
                  <CiudadBadge ciudad={cursoCiudad} />
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Horario:</dt>
                <dd className="text-slate-800 text-xs truncate max-w-[190px]">
                  {cursoHorario !== "—" ? cursoHorario : "Horario regular"}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Arancel oficial:</dt>
                <dd className="font-bold text-slate-900 font-mono">
                  ${Number(cursoPrecio || 0).toFixed(2)} USD
                </dd>
              </div>
            </dl>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onSelectTab?.("curso")}
              type="button"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <span>Ver detalles del curso</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </button>
          </div>
        </div>

        {/* Card 3: Pago por registrar */}
        <div className="bg-white rounded-2xl border-2 border-orange-200/80 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-[#fd761a] to-amber-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            {isAprobado ? "Pago Registrado" : "Pendiente de registro"}
          </div>

          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <HugeiconsIcon icon={PaymentIcon} size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pago por registrar</h3>
                <span className="text-xs font-medium text-amber-700">
                  {isAprobado ? "Computado en contabilidad" : "Se asienta formalmente al aprobar"}
                </span>
              </div>
            </div>

            <div className="py-3.5 space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Método:</span>
                <span className="font-semibold text-slate-900 uppercase text-xs">
                  {selected.pago?.comprobante?.tipo || "Transferencia / Depósito"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Fecha declarada:</span>
                <span className="text-slate-800 text-xs font-mono">
                  {(selected.pago?.comprobante?.fecha_pago_declarada || "—").split("T")[0]}
                </span>
              </div>
              <div className="flex justify-between items-center bg-orange-50/80 p-2.5 rounded-xl border border-orange-100">
                <span className="font-bold text-orange-950 text-xs">Monto a registrar:</span>
                <span className="text-base font-extrabold text-[#fd761a] font-mono">
                  ${montoDeclarado.toFixed(2)} USD
                </span>
              </div>
              {compImg && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Comprobante adjunto:</span>
                  <button
                    type="button"
                    onClick={() => setExpandedImageUrl(compImg)}
                    className="font-semibold text-[#fd761a] hover:underline cursor-pointer"
                  >
                    Ver comprobante
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onSelectTab?.("pago")}
              type="button"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
            >
              <span>Revisar distribución y aranceles</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </button>
          </div>
        </div>

        {/* Card 4: Cédula de Identidad (IMAGE preview, NO PDF icon) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                  <HugeiconsIcon icon={Image01Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cédula de Identidad</h3>
                  <span className="text-xs text-slate-500">Documento fotográfico</span>
                </div>
              </div>
              {cedulaImg ? (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} />
                  Adjunta
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                  Sin adjunto
                </span>
              )}
            </div>

            {/* Photo preview container */}
            <div className="my-3 p-2.5 bg-slate-950 rounded-xl flex items-center gap-3.5 text-white overflow-hidden shadow-inner">
              {cedulaImg ? (
                <div
                  onClick={() => setExpandedImageUrl(cedulaImg)}
                  className="w-24 h-16 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 cursor-pointer relative group"
                >
                  <img
                    src={cedulaImg}
                    alt="Cédula de identidad"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity">
                    Ampliar
                  </div>
                </div>
              ) : (
                <div className="w-24 h-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                  <HugeiconsIcon icon={Image01Icon} size={24} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {cedulaImg ? "cedula_identidad.jpg" : "Sin documento cargado"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {cedulaImg ? "Documento fotográfico JPG / PNG" : "Pendiente de adjuntar por el postulante"}
                </p>
                {cedulaImg && (
                  <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium">
                    ✓ Imagen lista para verificación
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Comprobación visual de datos filiatorios, número de cédula y concordancia con el solicitante.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                if (cedulaImg) setExpandedImageUrl(cedulaImg)
                else onSelectTab?.("documento")
              }}
              type="button"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              <span>{cedulaImg ? "Ver imagen en visor" : "Gestionar documento"}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
