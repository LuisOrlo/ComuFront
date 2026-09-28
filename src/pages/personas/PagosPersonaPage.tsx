import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft,
  Search,
  Calendar,
  FileText,
  ExternalLink,
  Eye,
  Plus,
  Banknote,
  Receipt,
  X,
  Download,
  Inbox,
  Landmark,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { financeService } from "@/services/finance.service"
import { getStorageUrl } from "@/lib/utils"
import { toast } from "sonner"

interface PagoItem {
  id: string
  fecha_pago?: string
  descripcion?: string
  categoria?: string
  categoria_nombre?: string
  monto: number
  metodo_pago?: string
  comprobante_url?: string | null
  notas?: string
}

interface PersonaInfo {
  id: string
  nombre_completo: string
  tipo: string
}

interface TotalesInfo {
  total_pagado: number
  cantidad_pagos: number
  ultimo_pago?: string | null
}

interface PagosPersonaResponse {
  persona: PersonaInfo
  totales: TotalesInfo
  data: PagoItem[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

const ROL_CONFIG: Record<string, { label: string; badge: string; avatarBg: string }> = {
  instructor: {
    label: "Instructor",
    badge: "bg-amber-50 text-amber-700 border-amber-200/60",
    avatarBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
  },
  staff: {
    label: "Staff Operativo",
    badge: "bg-blue-50 text-blue-700 border-blue-200/60",
    avatarBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
  },
  secretaria: {
    label: "Secretaría",
    badge: "bg-teal-50 text-teal-700 border-teal-200/60",
    avatarBg: "bg-gradient-to-br from-teal-400 to-emerald-600 text-white",
  },
  admin: {
    label: "Administrador",
    badge: "bg-purple-50 text-purple-700 border-purple-200/60",
    avatarBg: "bg-gradient-to-br from-purple-500 to-purple-700 text-white",
  },
}

const CAT_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  Personal: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/60" },
  Honorarios: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/60" },
  Servicios: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60" },
  Equipos: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200/60" },
  Varios: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200/60" },
  Mantenimiento: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60" },
}

function getMetodoBadge(metodo?: string) {
  const m = (metodo || "").toLowerCase()
  if (m.includes("transf") || m.includes("banc")) {
    return { label: "Transferencia", bg: "bg-blue-50 text-blue-700 border-blue-200/60", icon: Landmark }
  }
  if (m.includes("efect") || m.includes("caja")) {
    return { label: "Efectivo", bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", icon: Banknote }
  }
  if (m.includes("yape")) {
    return { label: "Yape", bg: "bg-purple-50 text-purple-700 border-purple-200/60", icon: CreditCard }
  }
  if (m.includes("plin")) {
    return { label: "Plin", bg: "bg-sky-50 text-sky-700 border-sky-200/60", icon: CreditCard }
  }
  return { label: metodo || "Otro", bg: "bg-slate-100 text-slate-700 border-slate-200/60", icon: CreditCard }
}

function fmtDate(d?: string | null): string {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
}

function fmtDateFull(d?: string | null): string {
  if (!d) return "—"
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return d
  }
}

export function PagosPersonaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PagosPersonaResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas")
  const [comprobanteModal, setComprobanteModal] = useState<string | null>(null)

  const cargarPagos = useCallback((page = 1) => {
    if (!id) return
    setLoading(true)
    financeService
      .getPagosPersonal(id, page)
      .then((res: PagosPersonaResponse) => {
        setData(res)
        setCurrentPage(res.current_page || page)
      })
      .catch(() => toast.error("Error al cargar el historial de pagos"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    cargarPagos(1)
  }, [cargarPagos])

  const persona = data?.persona
  const totales = data?.totales
  const pagos = useMemo(() => data?.data || [], [data?.data])

  // Lista única de categorías presentes en los datos
  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>()
    pagos.forEach((p) => {
      const cat = p.categoria_nombre || p.categoria
      if (cat) set.add(cat)
    })
    return Array.from(set)
  }, [pagos])

  // Filtrado en el cliente para búsqueda rápida
  const pagosFiltrados = useMemo(() => {
    return pagos.filter((p) => {
      const matchSearch =
        !search.trim() ||
        (p.descripcion || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.categoria_nombre || p.categoria || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.notas || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.metodo_pago || "").toLowerCase().includes(search.toLowerCase())

      const matchCat =
        categoriaFiltro === "todas" ||
        (p.categoria_nombre || p.categoria) === categoriaFiltro

      return matchSearch && matchCat
    })
  }, [pagos, search, categoriaFiltro])

  const initials = useMemo(() => {
    if (!persona?.nombre_completo) return "P"
    return persona.nombre_completo
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("")
  }, [persona])

  const rolInfo = persona?.tipo ? ROL_CONFIG[persona.tipo] || {
    label: persona.tipo,
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    avatarBg: "bg-slate-600 text-white",
  } : null

  const handleOpenReceipt = (rawUrl: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const fullUrl = getStorageUrl(rawUrl)
    const isPdf = rawUrl.toLowerCase().endsWith(".pdf")
    if (isPdf) {
      window.open(fullUrl, "_blank", "noopener,noreferrer")
    } else {
      setComprobanteModal(fullUrl)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Navegación superior */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/personas")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-200/60"
          >
            <ArrowLeft className="size-4" />
            Volver a Colaboradores
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="space-y-6 animate-pulse">
            <div className="h-28 bg-slate-200 rounded-2xl w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 bg-slate-200 rounded-2xl" />
              <div className="h-24 bg-slate-200 rounded-2xl" />
              <div className="h-24 bg-slate-200 rounded-2xl" />
            </div>
            <div className="h-80 bg-slate-200 rounded-2xl w-full" />
          </div>
        )}

        {data && (
          <>
            {/* Header de perfil del colaborador */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`size-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xs shrink-0 ${
                    rolInfo?.avatarBg || "bg-[#fd761a] text-white"
                  }`}
                >
                  {initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-slate-900">
                      {persona?.nombre_completo}
                    </h1>
                    {rolInfo && (
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${rolInfo.badge}`}
                      >
                        {rolInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Historial de retribuciones, pagos por honorarios y egresos liquidados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => navigate("/finanzas/egresos/nuevo")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06512] transition-colors shadow-xs active:scale-95"
                >
                  <Plus className="size-4" />
                  Registrar nuevo egreso
                </button>
              </div>
            </motion.div>

            {/* Tarjetas de Resumen Financiero */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Pagado */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
              >
                <div className="size-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Banknote className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total desembolsado
                  </p>
                  <p className="text-2xl font-black text-rose-600 tracking-tight">
                    -${(totales?.total_pagado || 0).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Monto total liquidado</p>
                </div>
              </motion.div>

              {/* Cantidad de Pagos */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
              >
                <div className="size-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Receipt className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Cantidad de pagos
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {totales?.cantidad_pagos || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Transacciones registradas</p>
                </div>
              </motion.div>

              {/* Último Pago */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4"
              >
                <div className="size-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
                  <Calendar className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Último desembolso
                  </p>
                  <p className="text-base font-bold text-slate-900 truncate">
                    {totales?.ultimo_pago ? fmtDateFull(totales.ultimo_pago) : "Sin pagos aún"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fecha más reciente</p>
                </div>
              </motion.div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por concepto, categoría o notas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {categoriasDisponibles.length > 0 && (
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#fd761a]/20 focus:border-[#fd761a]"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categoriasDisponibles.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-xs text-slate-400 whitespace-nowrap px-2 font-medium">
                  {pagosFiltrados.length} {pagosFiltrados.length === 1 ? "pago" : "pagos"}
                </span>
              </div>
            </div>

            {/* Tabla de Historial de Pagos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="px-5 py-3.5 whitespace-nowrap">Fecha</th>
                      <th className="px-5 py-3.5 min-w-[200px]">Concepto / Descripción</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Categoría</th>
                      <th className="px-5 py-3.5 whitespace-nowrap">Método</th>
                      <th className="px-5 py-3.5 text-right whitespace-nowrap">Monto</th>
                      <th className="px-5 py-3.5 text-center whitespace-nowrap">Comprobante</th>
                      <th className="px-5 py-3.5 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 px-4">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                              <Inbox className="size-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">No se encontraron pagos</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {search || categoriaFiltro !== "todas"
                                ? "No hay registros que coincidan con los filtros aplicados."
                                : "Aún no se han registrado egresos o desembolsos para este colaborador."}
                            </p>
                            {(!pagos || pagos.length === 0) && (
                              <button
                                type="button"
                                onClick={() => navigate("/finanzas/egresos/nuevo")}
                                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#fd761a] hover:bg-[#fd761a]/10 transition-colors"
                              >
                                <Plus className="size-3.5" />
                                Registrar primer egreso
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagosFiltrados.map((pago) => {
                        const metodo = getMetodoBadge(pago.metodo_pago)
                        const MetodoIcon = metodo.icon
                        const catKey = pago.categoria_nombre || pago.categoria || "Varios"
                        const catStyle = CAT_BADGE[catKey] || {
                          bg: "bg-slate-100",
                          text: "text-slate-700",
                          border: "border-slate-200/60",
                        }

                        return (
                          <tr
                            key={pago.id}
                            onClick={() => navigate(`/finanzas/egresos/${pago.id}`)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            {/* Fecha */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Calendar className="size-3.5 text-slate-400 shrink-0" />
                                <span>{fmtDate(pago.fecha_pago)}</span>
                              </div>
                            </td>

                            {/* Descripción y notas */}
                            <td className="px-5 py-4">
                              <div className="max-w-md">
                                <p className="font-semibold text-slate-900 group-hover:text-[#fd761a] transition-colors leading-snug">
                                  {pago.descripcion || "Sin descripción"}
                                </p>
                                {pago.notas && (
                                  <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                                    Nota: {pago.notas}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Categoría */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                              >
                                {pago.categoria_nombre || pago.categoria || "—"}
                              </span>
                            </td>

                            {/* Método de pago */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${metodo.bg}`}
                              >
                                <MetodoIcon className="size-3 shrink-0" />
                                {metodo.label}
                              </span>
                            </td>

                            {/* Monto */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <span className="font-bold text-rose-600 text-sm tracking-tight">
                                -${Number(pago.monto || 0).toLocaleString("es-ES", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>

                            {/* Comprobante */}
                            <td
                              className="px-5 py-4 text-center whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {pago.comprobante_url ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenReceipt(pago.comprobante_url!, e)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#fd761a] hover:text-[#e06512] bg-[#fd761a]/10 hover:bg-[#fd761a]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="Ver archivo de respaldo"
                                >
                                  <FileText className="size-3.5" />
                                  <span>Ver</span>
                                </button>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">—</span>
                              )}
                            </td>

                            {/* Acciones */}
                            <td
                              className="px-5 py-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => navigate(`/finanzas/egresos/${pago.id}`)}
                                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-flex items-center justify-center transition-colors"
                                title="Ver detalle del egreso"
                              >
                                <Eye className="size-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {data.last_page > 1 && (
                <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <div>
                    Página <span className="font-semibold text-slate-700">{data.current_page}</span> de{" "}
                    <span className="font-semibold text-slate-700">{data.last_page}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>{data.total} pagos en total</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || loading}
                      onClick={() => cargarPagos(currentPage - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <ChevronLeft className="size-3.5" />
                      Anterior
                    </button>

                    {Array.from({ length: data.last_page }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === data.last_page ||
                          Math.abs(p - currentPage) <= 1
                      )
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1]
                        return (
                          <span key={p} className="flex items-center">
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => cargarPagos(p)}
                              className={`size-8 rounded-lg text-xs font-bold transition-colors ${
                                p === currentPage
                                  ? "bg-[#fd761a] text-white shadow-2xs"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        )
                      })}

                    <button
                      type="button"
                      disabled={currentPage >= data.last_page || loading}
                      onClick={() => cargarPagos(currentPage + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      Siguiente
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* Modal / Lightbox para Comprobante */}
      <AnimatePresence>
        {comprobanteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComprobanteModal(null)}
            className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FileText className="size-4 text-[#fd761a]" />
                  Comprobante de respaldo
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={comprobanteModal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setComprobanteModal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-950/5 flex items-center justify-center max-h-[75vh] overflow-auto">
                <img
                  src={comprobanteModal}
                  alt="Comprobante de pago"
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm"
                />
              </div>

              <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Haga clic fuera para cerrar</span>
                <a
                  href={comprobanteModal}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Download className="size-3.5" />
                  Descargar comprobante
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
