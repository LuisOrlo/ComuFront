import { useState, useEffect, Fragment } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Money01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { ChevronDown, ChevronRight } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface Props {
  cursoId: string
}

interface ModulePayData {
  modulo_id: string
  nombre_modulo: string
  numero_orden: number
  precio: number
  abonado: number
  saldo: number
  estado: string
  es_ajustado: boolean
}

interface EstudianteFinanciero {
  matricula_id: string
  nombre: string
  cedula: string
  telefono: string
  ciudad: string
  modulos: Record<string, ModulePayData>
  total_pagado: number
}

interface ModuloInfo {
  id: string
  nombre: string
  numero_orden: number
  precio_base: number
}

export function CursoPagosSection({ cursoId }: Props) {
  const [loading, setLoading] = useState(true)
  const [estudiantes, setEstudiantes] = useState<EstudianteFinanciero[]>([])
  const [modulos, setModulos] = useState<ModuloInfo[]>([])
  const [totales, setTotales] = useState({ estudiantes: 0, modulos: 0, esperado_catalogo: 0, recaudado_real: 0 })
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    if (!cursoId) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await financeService.getCursoFinanciero(cursoId)
        const data = res.datos || res.data || res
        setEstudiantes(data.estudiantes || [])
        setModulos(data.modulos || [])
        setTotales(data.totales || {})
      } catch {
        toast.error("Error al cargar datos financieros")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cursoId])

  const recaudado = totales.recaudado_real ?? 0
  const esperado = totales.esperado_catalogo ?? 0
  const pct = esperado > 0 ? Math.round((recaudado / esperado) * 100) : 0

  const toggleExpand = (id: string) => {
    setExpandido(prev => prev === id ? null : id)
  }

  const modulosOrdenados = [...modulos].sort((a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999))

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: ACCENT, borderRightColor: ACCENT }} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: BORDER }}>
          <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Total Recaudado</p>
          <p className="text-2xl font-bold">
            <span style={{ color: "oklch(0.45 0.12 140)" }}>
              ${Number(recaudado).toFixed(2)}
            </span>
            {esperado > 0 && (
              <>
                <span style={{ color: TEXT_MUTED }}> / </span>
                <span style={{ color: "oklch(0.58 0.18 250)" }}>
                  ${Number(esperado).toFixed(2)}
                </span>
              </>
            )}
          </p>
          {esperado > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: pct >= 100 ? "oklch(0.45 0.12 140)" : pct >= 50 ? "oklch(0.55 0.12 90)" : "oklch(0.5 0.15 25)",
              }} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: BORDER }}>
          <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Estudiantes</p>
          <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>
            <HugeiconsIcon icon={UserGroupIcon} size={20} className="inline mr-1.5" style={{ color: ACCENT }} />
            {estudiantes.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: BORDER }}>
          <p className="text-[11px] font-medium mb-1" style={{ color: TEXT_MUTED }}>Módulos</p>
          <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>
            <HugeiconsIcon icon={Money01Icon} size={20} className="inline mr-1.5" style={{ color: ACCENT }} />
            {modulos.length}
          </p>
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: BORDER }}>
          <p className="text-xs font-semibold" style={{ color: CHARCOAL }}>Detalle por Estudiante</p>
        </div>
        <div className="overflow-x-auto">
          {estudiantes.length === 0 ? (
            <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Sin estudiantes matriculados</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: BORDER }}>
                  <th className="w-8" />
                  <th className="text-left font-semibold px-2 py-3" style={{ color: TEXT_MUTED }}>Estudiante</th>
                  <th className="text-left font-semibold px-2 py-3" style={{ color: TEXT_MUTED }}>Cédula</th>
                  {modulosOrdenados.map(mod => (
                    <th key={mod.id} className="text-center font-semibold px-2 py-3" style={{ color: TEXT_MUTED }}>
                      M{mod.numero_orden ?? ""}
                    </th>
                  ))}
                  <th className="text-right font-semibold px-3 py-3" style={{ color: TEXT_MUTED }}>Total Pagado</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map(est => {
                  const modData = est.modulos || {}
                  return (
                    <Fragment key={est.matricula_id}>
                      <tr
                        onClick={() => toggleExpand(est.matricula_id)}
                        className="border-b hover:bg-gray-50/50 cursor-pointer transition-colors"
                        style={{ borderColor: BORDER }}>
                        <td className="px-2 py-3">
                          {expandido === est.matricula_id ? <ChevronDown size={14} style={{ color: TEXT_MUTED }} /> : <ChevronRight size={14} style={{ color: TEXT_MUTED }} />}
                        </td>
                        <td className="px-2 py-3 font-semibold whitespace-nowrap" style={{ color: CHARCOAL }}>{est.nombre}</td>
                        <td className="px-2 py-3 whitespace-nowrap" style={{ color: TEXT_MUTED }}>{est.cedula}</td>
                        {modulosOrdenados.map(mod => {
                          const md = modData[mod.id]
                          const abonado = md?.abonado ?? 0
                          const precioMod = md?.precio ?? mod.precio_base ?? 0
                          return (
                            <td key={mod.id} className="px-2 py-3 text-center">
                              <span className="font-semibold" style={{ color: abonado >= precioMod ? "oklch(0.45 0.12 140)" : TEXT_MUTED }}>
                                ${Number(abonado).toFixed(2)}
                              </span>
                            </td>
                          )
                        })}
                        <td className="px-3 py-3 text-right font-bold" style={{ color: CHARCOAL }}>
                          ${Number(est.total_pagado ?? 0).toFixed(2)}
                        </td>
                      </tr>
                      {expandido === est.matricula_id && (
                        <tr key={`${est.matricula_id}-detalle`}>
                          <td colSpan={modulos.length + 4} className="bg-gray-50/50 px-6 py-4">
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEXT_MUTED }}>Desglose por Módulo</p>
                              <div className="grid gap-2">
                                {modulosOrdenados.map(mod => {
                                  const md = modData[mod.id]
                                  const precio = md?.precio ?? mod.precio_base ?? 0
                                  const abonado = md?.abonado ?? 0
                                  const saldo = md?.saldo ?? Math.max(0, precio - abonado)
                                  const estadoMod = md?.estado ?? "pendiente"
                                  return (
                                    <div key={mod.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border" style={{ borderColor: BORDER }}>
                                      <div className="flex items-center gap-3">
                                        <span className="font-semibold text-sm" style={{ color: CHARCOAL }}>
                                          M{mod.numero_orden ?? ""}: {mod.nombre}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase"
                                          style={{
                                            backgroundColor: estadoMod === "pagado" ? "#d1fae5" : estadoMod === "pendiente" ? "#fef3c7" : "#fee2e2",
                                            color: estadoMod === "pagado" ? "#065f46" : estadoMod === "pendiente" ? "#92400e" : "#991b1b",
                                          }}>
                                          {estadoMod}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span style={{ color: TEXT_MUTED }}>Precio: <strong style={{ color: CHARCOAL }}>${Number(precio).toFixed(2)}</strong></span>
                                        <span style={{ color: "oklch(0.45 0.12 140)" }}>Abonado: <strong>${Number(abonado).toFixed(2)}</strong></span>
                                        <span style={{ color: saldo > 0 ? "oklch(0.5 0.15 25)" : "oklch(0.45 0.12 140)" }}>
                                          Saldo: <strong>${Number(saldo).toFixed(2)}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="flex justify-end pt-2 border-t mt-2" style={{ borderColor: BORDER }}>
                                <span className="text-sm font-bold" style={{ color: CHARCOAL }}>
                                  Total Pagado: <span style={{ color: "oklch(0.45 0.12 140)" }}>${Number(est.total_pagado ?? 0).toFixed(2)}</span>
                                  <span className="mx-1" style={{ color: TEXT_MUTED }}>/</span>
                                  <span style={{ color: CHARCOAL }}>${Number(esperado).toFixed(2)}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
