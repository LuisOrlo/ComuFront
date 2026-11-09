/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import {
  Search,
  Loader2,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  X,
  BookOpen,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { tallerService } from "@/services/taller.service"
import { cursosService } from "@/services/cursos.service"
import { CiudadBadge, ModalidadBadge } from "../../../estudiantes/components/Badges"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface TallerCambioSectionProps {
  selected: any
  onSuccess: () => void
  onCancel: () => void
}

interface OfertaAcademicaItem {
  id: string
  tipo: "taller" | "curso"
  nombre: string
  precio: number
  modalidad?: string
  ciudad?: string
  fecha?: string | null
  capacidad: number
  inscritos: number
  instructor?: string | null
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#fd761a] font-extrabold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

function formatFechaOferta(fecha?: string | null): string | null {
  if (!fecha) return null
  const dateStr = String(fecha).slice(0, 10)
  const parts = dateStr.split("-").map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
}

export function TallerCambioSection({ selected, onSuccess, onCancel }: TallerCambioSectionProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [ofertas, setOfertas] = useState<OfertaAcademicaItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string>(selected?.taller?.id || "")
  const [selectedTipo, setSelectedTipo] = useState<"taller" | "curso">("taller")
  const [saving, setSaving] = useState(false)

  const fetchOfertas = useCallback(async (query: string = "") => {
    setLoading(true)
    try {
      const trimmedQuery = query.trim()

      const [resTalleres, resCursos] = await Promise.allSettled([
        tallerService.listar({ per_page: 50, search: trimmedQuery || undefined }),
        cursosService.getCursos({ per_page: 50, search: trimmedQuery || undefined }),
      ])

      const listTalleres: OfertaAcademicaItem[] = []
      if (resTalleres.status === "fulfilled") {
        const rawT = resTalleres.value
        const itemsT = Array.isArray(rawT) ? rawT : (rawT?.data || rawT?.datos || [])
        itemsT.forEach((t: any) => {
          listTalleres.push({
            id: t.id,
            tipo: "taller",
            nombre: t.nombre || "Taller formativo",
            precio: Number(t.precio || 0),
            modalidad: t.modalidad,
            ciudad: typeof t.ciudad === "string" ? t.ciudad : (t.ciudad?.nombre || ""),
            fecha: t.fecha,
            capacidad: Number(t.capacidad_maxima || t.capacidad || 0),
            inscritos: Number(t.inscripciones_count || t.estudiantes || 0),
            instructor: t.instructor ? `${t.instructor.nombres} ${t.instructor.apellidos}` : null,
          })
        })
      }

      const listCursos: OfertaAcademicaItem[] = []
      if (resCursos.status === "fulfilled") {
        const rawC = resCursos.value
        const itemsC = Array.isArray(rawC) ? rawC : (rawC?.data || [])
        itemsC.forEach((c: any) => {
          listCursos.push({
            id: c.id,
            tipo: "curso",
            nombre: c.nombre_instancia || c.catalogo?.nombre || c.nombre || "Curso abierto",
            precio: Number(c.precioBase ?? c.precio_base ?? 0),
            modalidad: c.modalidad,
            ciudad: typeof c.ciudad === "string" ? c.ciudad : (c.ciudad?.nombre || c.ciudad_nombre || ""),
            fecha: c.fechaInicio || c.fecha_inicio,
            capacidad: Number(c.capacidad || c.capacidad_maxima || 0),
            inscritos: Number(c.estudiantes || c.matriculas_count || 0),
            instructor: c.docente?.nombre || (c.docente ? `${c.docente.nombres} ${c.docente.apellidos}` : null),
          })
        })
      }

      setOfertas([...listTalleres, ...listCursos])
    } catch {
      toast.error("Error al cargar la oferta formativa")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOfertas(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchOfertas])

  // Filtrado estrictamente por nombre
  const filteredOfertas = useMemo(() => {
    if (!searchQuery.trim()) return ofertas
    const q = searchQuery.toLowerCase().trim()
    return ofertas.filter((item) => (item.nombre || "").toLowerCase().includes(q))
  }, [ofertas, searchQuery])

  const selectedItem = useMemo(() => {
    return filteredOfertas.find((o) => o.id === selectedId) ||
      ofertas.find((o) => o.id === selectedId) ||
      null
  }, [filteredOfertas, ofertas, selectedId])

  const precioActual = Number(selected?.taller?.precio || 0)
  const precioNuevo = Number(selectedItem?.precio || 0)
  const precioDiff = selectedItem ? precioNuevo - precioActual : 0
  const totalAbonado = Number(selected?.monto_pagado || 0)
  const yaProcesada = Boolean(selected?.pago_verificado)

  const isCurrentTaller = selectedTipo === "taller" && selectedId === selected?.taller?.id

  const handleSelectOferta = (item: OfertaAcademicaItem) => {
    setSelectedId(item.id)
    setSelectedTipo(item.tipo)
  }

  const handleConfirmChange = async () => {
    if (!selectedId) {
      toast.error("Debes seleccionar una opción")
      return
    }

    if (isCurrentTaller) {
      toast.info("El taller seleccionado es el mismo que ya está asignado")
      return
    }

    setSaving(true)
    try {
      if (selectedTipo === "taller") {
        await tallerService.actualizarInscripcion(selected.id, { taller_id: selectedId })
        toast.success("Taller actualizado correctamente")
        queryClient.invalidateQueries({ queryKey: ["talleres-inscripciones-pendientes"] })
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        onSuccess()
      } else {
        // Traslado a curso académico
        const res = await tallerService.transferirACurso(selected.id, { curso_abierto_id: selectedId })
        toast.success("Inscripción transferida a curso con éxito. Redirigiendo a expediente...")
        queryClient.invalidateQueries({ queryKey: ["talleres-inscripciones-pendientes"] })
        queryClient.invalidateQueries({ queryKey: ["solicitudes-inscripcion"] })
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        navigate(`/matriculas/aprobacion/solicitud/${res.solicitud_id}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || "Error al procesar el cambio")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80 space-y-4">
      {/* Header Selector */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <ArrowRightLeft className="size-4 text-[#fd761a]" />
          <span>Buscar y seleccionar taller o curso académico</span>
        </div>
        <button
          onClick={onCancel}
          disabled={saving}
          type="button"
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Input de Búsqueda (Solo por nombre) */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar solo por nombre de taller o curso..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={saving}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd761a]/30 focus:border-[#fd761a] transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#fd761a] animate-spin size-4 pointer-events-none" />
        )}
        {!loading && searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Lista de Talleres y Cursos */}
      <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
        {filteredOfertas.length === 0 ? (
          <div className="p-4 text-xs text-center text-slate-400">
            {loading ? "Buscando talleres y cursos disponibles..." : "No se encontraron ofertas que coincidan con el nombre."}
          </div>
        ) : (
          filteredOfertas.map((item) => {
            const isSelected = selectedId === item.id && selectedTipo === item.tipo
            const isCurrent = item.tipo === "taller" && selected?.taller?.id === item.id
            const sinCupo = item.capacidad > 0 && item.inscritos >= item.capacidad && !isCurrent
            const fechaInicio = formatFechaOferta(item.fecha)

            return (
              <button
                key={`${item.tipo}-${item.id}`}
                type="button"
                onClick={() => handleSelectOferta(item)}
                className={cn(
                  "w-full text-left p-3.5 flex flex-col gap-1.5 transition-all cursor-pointer",
                  isSelected
                    ? item.tipo === "taller"
                      ? "bg-orange-50/80 border-l-4 border-l-[#fd761a]"
                      : "bg-indigo-50/80 border-l-4 border-l-indigo-600"
                    : "hover:bg-slate-50"
                )}
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    {/* Badge diferenciador Taller vs Curso */}
                    {item.tipo === "taller" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 shrink-0">
                        <GraduationCap className="size-3 text-orange-700" />
                        Taller
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                        <BookOpen className="size-3 text-indigo-700" />
                        Curso
                      </span>
                    )}

                    <span className="text-sm font-bold text-slate-900 truncate">
                      {highlightText(item.nombre, searchQuery)}
                    </span>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        Actual
                      </span>
                    )}
                  </div>

                  <span className={cn(
                    "text-sm font-black font-mono shrink-0",
                    item.tipo === "taller" ? "text-[#fd761a]" : "text-indigo-600"
                  )}>
                    ${item.precio.toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {item.modalidad && (
                    <ModalidadBadge modalidad={item.modalidad} />
                  )}
                  {item.ciudad && item.ciudad !== "No especificada" && item.ciudad !== "—" && (
                    <CiudadBadge ciudad={item.ciudad} />
                  )}
                  {fechaInicio && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                      <Calendar className="size-3 text-blue-500 shrink-0" />
                      <span>Inicia: {fechaInicio}</span>
                    </span>
                  )}
                  {item.instructor && (
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[200px]">
                      Prof: {item.instructor}
                    </span>
                  )}
                  <span className="text-[11px] font-medium text-slate-500">
                    • {item.inscritos}/{item.capacidad > 0 ? item.capacidad : "∞"} cupos
                  </span>
                  {sinCupo && (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Sobrecupo ({item.inscritos}/{item.capacidad})
                    </span>
                  )}
                  {isSelected && (
                    <div className={cn(
                      "ml-auto flex items-center gap-1 text-xs font-bold",
                      item.tipo === "taller" ? "text-[#fd761a]" : "text-indigo-600"
                    )}>
                      <CheckCircle2 className="size-3.5" />
                      <span>Seleccionado</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Comparativa de precios si hay selección */}
      {selectedItem && (
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-2 text-xs shadow-2xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="size-3.5 text-[#fd761a]" />
              <span>Comparativa de valores a pagar</span>
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-extrabold",
                precioDiff > 0
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : precioDiff < 0
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-slate-50 text-slate-700 border border-slate-200"
              )}
            >
              {precioDiff > 0
                ? `+$${precioDiff.toFixed(2)} (Aumenta valor)`
                : precioDiff < 0
                ? `-$${Math.abs(precioDiff).toFixed(2)} (Disminuye valor)`
                : "Mismo valor total"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-slate-600">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Taller actual</span>
              <strong className="text-slate-800 text-sm font-mono">${precioActual.toFixed(2)}</strong>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                {selectedItem.tipo === "curso" ? "Nuevo curso" : "Nuevo taller"}
              </span>
              <strong className={cn("text-sm font-mono", selectedItem.tipo === "curso" ? "text-indigo-600" : "text-[#ea580c]")}>
                ${precioNuevo.toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total ya abonado</span>
              <strong className="text-emerald-700 text-sm font-mono">${totalAbonado.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Alerta explicativa si se seleccionó un CURSO */}
      {selectedItem?.tipo === "curso" && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70">
          <BookOpen className="size-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 font-medium space-y-1">
            <p>
              Has seleccionado trasladar este registro a un <strong>Curso Académico</strong>. Al confirmar, la inscripción de taller se convertirá en una <strong>solicitud de inscripción de curso</strong> (manteniendo los datos personales, comprobantes y montos declarados) y serás redirigido a la bandeja de aprobación de cursos.
            </p>
          </div>
        </div>
      )}

      {/* Alerta de inscripción aprobada con pago registrado para TALLER */}
      {selectedItem?.tipo === "taller" && yaProcesada && totalAbonado > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-300/80 bg-amber-50">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 font-medium space-y-1">
            <p>
              Esta inscripción ya tiene un pago verificado (<strong>${totalAbonado.toFixed(2)} USD</strong>). Al confirmar el cambio de taller, el saldo de la cuenta por cobrar y el tipo de pago se recalcularán automáticamente según el arancel del nuevo taller.
            </p>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          onClick={handleConfirmChange}
          disabled={saving || isCurrentTaller}
          type="button"
          className={cn(
            "px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
            selectedTipo === "curso"
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-[#fd761a] hover:bg-[#ea580c]"
          )}
        >
          {saving
            ? "Procesando..."
            : selectedTipo === "curso"
            ? "Confirmar traslado a curso"
            : "Confirmar cambio de taller"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          type="button"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
