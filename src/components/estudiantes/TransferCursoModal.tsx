/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  UserWarning01Icon,
} from "@hugeicons/core-free-icons"
import {
  estudiantesService,
  type CursoAlternativo,
} from "@/services/estudiantes.service"
import { financeService } from "@/services/finance.service"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { cursosService } from "@/services/cursos.service"

interface MatriculaResumen {
  id: string
  curso: string
  fecha_inscripcion: string
  promedio: number | null
  notas: Array<{
    modulo: string
    calificacion: number
    aprobado: boolean
  }>
  porcentaje_asistencia: number
}

interface TransferCursoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  matricula: MatriculaResumen
}

const DIAS_MAP: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
}

export function TransferCursoModal({
  isOpen,
  onClose,
  onSuccess,
  matricula,
}: TransferCursoModalProps) {
  const [step, setStep] = useState(1)
  const [alternativos, setAlternativos] = useState<CursoAlternativo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [nuevosModulos, setNuevosModulos] = useState<any[]>([])
  const [valores, setValores] = useState<Record<number, string>>({})
  const [totalAbonado, setTotalAbonado] = useState(0)
  const [loadingReconciliacion, setLoadingReconciliacion] = useState(false)
  const [search, setSearch] = useState("")

  /*
   * Filtra los cursos alternativos según el texto de búsqueda.
   */
  const filteredAlternativos = useMemo(
    () =>
      alternativos.filter((a) =>
        a.nombre_instancia
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      ),
    [alternativos, search]
  )

  /*
   * Carga los cursos alternativos cuando se abre el modal.
   */
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setSelectedId(null)
      setMotivo("")
      setNuevosModulos([])
      setValores({})
      setTotalAbonado(0)
      setSearch("")
      setAlternativos([])
      return
    }

    setLoading(true)

    estudiantesService
      .getAlternativos(matricula.id)
      .then(setAlternativos)
      .catch(() =>
        toast.error("Error al cargar cursos alternativos")
      )
      .finally(() => setLoading(false))
  }, [isOpen, matricula.id])

  /*
   * Cuando el usuario pasa al paso 2:
   * - Obtiene los módulos del nuevo curso.
   * - Obtiene las líneas de pago de la matrícula actual.
   * - Calcula una distribución sugerida de los pagos.
   */
  useEffect(() => {
    if (step !== 2 || !selectedId) {
      return
    }

    setLoadingReconciliacion(true)

    Promise.all([
      cursosService.getModulosPorCurso(selectedId),
      financeService.getLineasPagoPorMatricula(matricula.id),
    ])
      .then(([modRes, lpRes]) => {
        const rawModulos = modRes as any[]

        const lineas =
          (lpRes as any)?.data ||
          (lpRes as any)?.datos ||
          lpRes ||
          []

        /*
         * Calculamos el total abonado.
         */
        const total = Array.isArray(lineas)
          ? lineas.reduce(
              (s: number, l: any) =>
                s + (Number(l.monto_abonado) || 0),
              0
            )
          : 0

        setTotalAbonado(total)
        setNuevosModulos(rawModulos)

        /*
         * Sugerencia inicial:
         * intenta conservar los montos anteriores en el mismo orden
         * de los módulos nuevos, sin superar el precio de cada módulo.
         */
        const sugerencia: Record<number, string> = {}

        const oldMontos = Array.isArray(lineas)
          ? lineas.map(
              (l: any) => Number(l.monto_abonado) || 0
            )
          : []

        rawModulos.forEach((m: any, i: number) => {
          const viejo = oldMontos[i] || 0

          const precioModulo = Number(
            m.precio_base || m.monto_ajustado || 0
          )

          sugerencia[i] = String(
            Math.min(viejo, precioModulo)
          )
        })

        /*
         * Si todavía queda dinero por distribuir,
         * intenta colocarlo en módulos que tengan espacio disponible.
         */
        const asignado = Object.values(sugerencia).reduce(
          (s, v) => s + (parseFloat(v) || 0),
          0
        )

        let restante = total - asignado

        for (
          let i = 0;
          i < rawModulos.length && restante > 0;
          i++
        ) {
          const actual = parseFloat(sugerencia[i]) || 0

          const cap = Number(
            rawModulos[i].precio_base ||
              rawModulos[i].monto_ajustado ||
              0
          )

          const espacio = cap - actual

          if (espacio > 0) {
            const agregar = Math.min(restante, espacio)

            sugerencia[i] = String(actual + agregar)
            restante -= agregar
          }
        }

        setValores(sugerencia)
      })
      .catch(() =>
        toast.error(
          "Error al cargar datos de reconciliación"
        )
      )
      .finally(() => {
        setLoadingReconciliacion(false)
      })
  }, [step, selectedId, matricula.id])

  /*
   * Curso actualmente seleccionado.
   */
  const selected = alternativos.find(
    (a) => a.id === selectedId
  )

  /*
   * Total de dinero actualmente asignado a módulos.
   */
  const totalAsignado = useMemo(
    () =>
      Object.values(valores).reduce(
        (s, v) => s + (parseFloat(v) || 0),
        0
      ),
    [valores]
  )

  /*
   * Precio total de todos los módulos del curso nuevo.
   */
  const precioTotalNuevo = useMemo(
    () =>
      nuevosModulos.reduce(
        (s: number, m: any) =>
          s +
          Number(
            m.precio_base || m.monto_ajustado || 0
          ),
        0
      ),
    [nuevosModulos]
  )

  /*
   * Verifica si algún monto asignado supera
   * el precio del módulo.
   */
  const tieneExceso = useMemo(
    () =>
      nuevosModulos.some(
        (m: any, i: number) =>
          (parseFloat(valores[i]) || 0) >
          Number(
            m.precio_base || m.monto_ajustado || 0
          )
      ),
    [nuevosModulos, valores]
  )

  /*
   * Cambia el monto asignado a un módulo.
   */
  const handleMontoChange = (
    idx: number,
    val: string
  ) => {
    /*
     * Permite únicamente números y punto decimal.
     */
    const limpio = val.replace(/[^0-9.]/g, "")

    /*
     * Permite como máximo un punto decimal.
     */
    if ((limpio.match(/\./g) || []).length <= 1) {
      setValores((prev) => ({
        ...prev,
        [idx]: limpio,
      }))
    }
  }

  /*
   * Confirma la transferencia.
   */
  const handleConfirm = useCallback(async () => {
    if (!selectedId) {
      return
    }

    setSubmitting(true)

    try {
      /*
       * Construimos las líneas que recibirá el backend.
       */
      const lineas = nuevosModulos.map(
        (m: any, i: number) => ({
          modulo_id: m.id || null,
          tipo: "modulo",
          monto_abonado:
            parseFloat(valores[i]) || 0,
          monto_ajustado: Number(
            m.precio_base ||
              m.monto_ajustado ||
              0
          ),
        })
      )

      const result =
        await estudiantesService.transferirCurso(
          matricula.id,
          {
            curso_abierto_nuevo_id: selectedId,
            motivo: motivo || undefined,
            lineas,
          }
        )

      toast.success(
        result.message ||
          "Transferencia completada"
      )

      onSuccess()
      onClose()
    } catch (err) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string
            }
          }
        }
      )?.response?.data?.message

      toast.error(
        msg ||
          "Error al realizar la transferencia"
      )
    } finally {
      setSubmitting(false)
    }
  }, [
    selectedId,
    matricula.id,
    motivo,
    nuevosModulos,
    valores,
    onSuccess,
    onClose,
  ])

  /*
   * Si el modal está cerrado no renderizamos nada.
   */
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {step === 1
                ? "Seleccionar Curso Destino"
                : "Reconciliación de Pagos"}
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              {step === 1
                ? "Selecciona el curso al que deseas transferir la matrícula."
                : "Revisa y distribuye los pagos realizados."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="divide-y divide-gray-50">
              {/* Curso origen */}
              <div className="px-6 py-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Origen
                </p>

                <p className="truncate text-sm font-bold text-gray-900">
                  {matricula.curso}
                </p>

                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500">
                  <span>
                    {matricula.notas.length} módulo
                    {matricula.notas.length !== 1
                      ? "s"
                      : ""}
                  </span>

                  <span className="h-1 w-1 rounded-full bg-gray-300" />

                  <span>
                    Promedio:{" "}
                    {matricula.promedio ?? "—"}
                  </span>

                  <span className="h-1 w-1 rounded-full bg-gray-300" />

                  <span>
                    Asistencia:{" "}
                    {matricula.porcentaje_asistencia}%
                  </span>
                </div>
              </div>

              {/* Estados de carga / vacío / resultados */}
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

                  <p className="text-xs text-gray-400">
                    Buscando cursos disponibles...
                  </p>
                </div>
              ) : alternativos.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    size={24}
                    className="mx-auto mb-2 text-gray-300"
                  />

                  <p className="text-sm font-medium text-gray-500">
                    No hay cursos alternativos
                    disponibles
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Todos los cursos del mismo
                    catálogo están llenos o
                    inactivos.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Título */}
                  <p className="px-6 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Destino ({filteredAlternativos.length}{" "}
                    disponible
                    {filteredAlternativos.length !== 1
                      ? "s"
                      : ""}
                    )
                  </p>

                  {/* Buscador */}
                  <div className="px-6 pb-2">
                    <input
                      type="text"
                      placeholder="Buscar curso..."
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none"
                      style={{
                        borderColor:
                          COLORS.BORDER_SUBTLE,
                      }}
                    />
                  </div>

                  {/* Resultados */}
                  {filteredAlternativos.length ===
                  0 ? (
                    <div className="px-6 py-6 text-center">
                      <p className="text-xs text-gray-400">
                        Sin coincidencias para "
                        {search}"
                      </p>
                    </div>
                  ) : (
                    filteredAlternativos.map(
                      (alt) => {
                        const isSelected =
                          selectedId === alt.id

                        return (
                          <button
                            key={alt.id}
                            type="button"
                            onClick={() =>
                              setSelectedId(
                                alt.id
                              )
                            }
                            className={`w-full border-b border-gray-50 px-6 py-3.5 text-left transition-colors duration-200 last:border-b-0 ${
                              isSelected
                                ? "bg-orange-50/80"
                                : "hover:bg-orange-50/60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-gray-900">
                                  {
                                    alt.nombre_instancia
                                  }
                                </p>

                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                                  {alt.ciudad && (
                                    <span>
                                      {
                                        alt.ciudad
                                      }
                                    </span>
                                  )}

                                  {alt.modalidad && (
                                    <span className="capitalize">
                                      {
                                        alt.modalidad
                                      }
                                    </span>
                                  )}

                                  {alt.horario && (
                                    <span>
                                      {alt.horario.dias
                                        .map(
                                          (
                                            d: number
                                          ) =>
                                            DIAS_MAP[
                                              d
                                            ]
                                        )
                                        .join(
                                          " "
                                        )}

                                      {" "}

                                      {alt.horario.hora_inicio.slice(
                                        0,
                                        5
                                      )}

                                      -

                                      {alt.horario.hora_fin.slice(
                                        0,
                                        5
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-sm font-black text-gray-800">
                                  $
                                  {alt.precio_base.toLocaleString()}
                                </p>

                                <p className="text-[10px] text-gray-400">
                                  {
                                    alt.espacios_disponibles
                                  }{" "}
                                  cupo
                                  {alt.espacios_disponibles !==
                                  1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      }
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            /* PASO 2 */
            <div className="divide-y divide-gray-50">
              {/* Resumen */}
              <div className="px-6 py-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Resumen
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <span className="truncate font-bold text-gray-900">
                    {matricula.curso}
                  </span>

                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    className="shrink-0 text-gray-400"
                  />

                  <span className="truncate font-bold text-orange-600">
                    {selected?.nombre_instancia}
                  </span>
                </div>
              </div>

              {/* Loading reconciliación */}
              {loadingReconciliacion ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

                  <p className="text-xs text-gray-400">
                    Cargando datos de
                    reconciliación...
                  </p>
                </div>
              ) : totalAbonado > 0 ? (
                <>
                  {/* Advertencia de pagos */}
                  <div className="px-6 py-3">
                    <div
                      className="flex items-start gap-2 rounded-xl border p-3"
                      style={{
                        borderColor:
                          "oklch(0.65 0.15 75 / 0.3)",
                        backgroundColor:
                          "oklch(0.65 0.15 75 / 0.06)",
                      }}
                    >
                      <HugeiconsIcon
                        icon={UserWarning01Icon}
                        size={15}
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            "oklch(0.65 0.15 75)",
                        }}
                      />

                      <p
                        className="text-xs font-medium"
                        style={{
                          color:
                            "oklch(0.5 0.1 75)",
                        }}
                      >
                        Puede conservar el valor
                        registrado de cada módulo (
                        <strong>
                          $
                          {totalAbonado.toLocaleString()}{" "}
                          abonado
                        </strong>
                        ) o ajustarlo manualmente
                        antes de confirmar.
                      </p>
                    </div>
                  </div>

                  {/* Tabla de módulos */}
                  <div className="px-6 py-3">
                    <div
                      className="grid grid-cols-[1.8fr_1fr_0.7fr] gap-3 border-b pb-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: COLORS.TEXT_MUTED,
                        borderColor:
                          COLORS.BORDER_SUBTLE,
                      }}
                    >
                      <span>Módulo</span>

                      <span className="text-right">
                        Monto a asignar
                      </span>

                      <span className="text-right">
                        Precio
                      </span>
                    </div>

                    <div
                      className="divide-y"
                      style={{
                        borderColor:
                          COLORS.BORDER_SUBTLE,
                      }}
                    >
                      {nuevosModulos.map(
                        (m: any, i: number) => {
                          const precio = Number(
                            m.precio_base ||
                              m.monto_ajustado ||
                              0
                          )

                          const excede =
                            (parseFloat(
                              valores[i]
                            ) || 0) > precio

                          return (
                            <div
                              key={
                                m.id ??
                                `modulo-${i}`
                              }
                              className="grid grid-cols-[1.8fr_1fr_0.7fr] items-center gap-3 py-2 text-sm"
                            >
                              {/* Nombre */}
                              <span
                                className="truncate font-medium"
                                style={{
                                  color:
                                    COLORS.CHARCOAL,
                                }}
                              >
                                {m.nombre_modulo ||
                                  m.nombre ||
                                  `Módulo ${
                                    m.numero_orden ||
                                    "—"
                                  }`}
                              </span>

                              {/* Monto */}
                              <div className="justify-self-end">
                                <div className="relative w-[110px]">
                                  <span
                                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-sm"
                                    style={{
                                      color:
                                        COLORS.TEXT_MUTED,
                                    }}
                                  >
                                    $
                                  </span>

                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      valores[i] ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleMontoChange(
                                        i,
                                        e.target
                                          .value
                                      )
                                    }
                                    onWheel={(e) =>
                                      (
                                        e.target as HTMLElement
                                      ).blur()
                                    }
                                    className={cn(
                                      "w-full rounded-md border bg-white py-1 pl-7 pr-2 text-right font-mono text-sm outline-none",
                                      excede
                                        ? "border-red-300"
                                        : ""
                                    )}
                                    style={{
                                      borderColor:
                                        excede
                                          ? undefined
                                          : COLORS.BORDER_SUBTLE,
                                    }}
                                  />
                                </div>

                                {excede && (
                                  <p className="mt-0.5 text-right text-[9px] font-bold text-red-500">
                                    Supera el precio
                                    del módulo
                                  </p>
                                )}
                              </div>

                              {/* Precio */}
                              <span
                                className="text-right text-xs font-medium opacity-60"
                                style={{
                                  color:
                                    COLORS.CHARCOAL,
                                }}
                              >
                                $
                                {precio.toLocaleString()}
                              </span>
                            </div>
                          )
                        }
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="px-6 py-3">
                    <div
                      className="flex items-center justify-between rounded-xl border bg-gray-50 p-3"
                      style={{
                        borderColor:
                          COLORS.BORDER_SUBTLE,
                      }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{
                          color:
                            COLORS.CHARCOAL,
                        }}
                      >
                        $
                        {totalAsignado.toLocaleString()}{" "}
                        pagados de $
                        {precioTotalNuevo.toLocaleString()}{" "}
                        total
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Sin pagos */
                <div className="space-y-3 px-6 py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Notas a migrar
                    </span>

                    <span className="font-bold text-gray-800">
                      {matricula.notas.length}{" "}
                      módulo
                      {matricula.notas.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Asistencias
                    </span>

                    <span className="font-bold text-amber-600">
                      No se transfieren
                    </span>
                  </div>
                </div>
              )}

              {/* Advertencia cuando no hay pagos */}
              {totalAbonado === 0 &&
                !loadingReconciliacion && (
                  <div className="px-6 py-4">
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />

                      <div>
                        <p className="text-xs font-bold text-amber-800">
                          Importante
                        </p>

                        <p className="mt-0.5 text-[11px] text-amber-700">
                          La matrícula actual
                          pasará a estado
                          "retirado". Las
                          asistencias no se
                          transfieren al nuevo
                          curso. El monto de la
                          cuenta por cobrar se
                          ajustará automáticamente
                          al precio del nuevo
                          curso.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Motivo */}
              <div className="px-6 py-4">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Motivo (opcional)
                </label>

                <textarea
                  value={motivo}
                  onChange={(e) =>
                    setMotivo(e.target.value)
                  }
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300"
                  rows={2}
                  placeholder="Ej: Cambio de horario por trabajo"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-bold text-gray-400 transition-colors hover:text-gray-600"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedId}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor:
                    COLORS.ACCENT,
                }}
              >
                Continuar

                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-bold text-gray-400 transition-colors hover:text-gray-600"
              >
                Atrás
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  submitting ||
                  loadingReconciliacion ||
                  tieneExceso
                }
                className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{
                  backgroundColor:
                    COLORS.ACCENT,
                }}
              >
                {submitting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                    Transfiriendo...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={
                        CheckmarkCircle01Icon
                      }
                      size={14}
                    />

                    Confirmar Transferencia
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
