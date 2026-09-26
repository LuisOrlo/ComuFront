import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  Edit01Icon,
  Tick02Icon,
  ArrowLeft01Icon,
  Money01Icon,
  CheckmarkCircle04Icon,
  Search01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Plus, Trash2, LayoutGrid, Columns2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { podcastService, type PaquetePodcast } from "@/services/podcast.service"
import { PaqueteModal } from "./components/PaqueteModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

export function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<PaquetePodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "activos" | "inactivos">("todos")
  const [viewMode, setViewMode] = useState<"grid" | "split">("split")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPaquete, setEditingPaquete] = useState<PaquetePodcast | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const initialMount = useRef(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await podcastService.getPaquetes()
      setPaquetes(data)
      setSelectedId((currentId) => {
        if (initialMount.current && data.length > 0) {
          initialMount.current = false
          return data[0].id
        }
        return !currentId && data.length > 0 ? data[0].id : currentId
      })
    } catch {
      toast.error("Error al cargar paquetes de podcast")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredPaquetes = useMemo(() => {
    return paquetes.filter((p) => {
      if (statusFilter === "activos" && !p.activo) return false
      if (statusFilter === "inactivos" && p.activo) return false

      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchesNombre = p.nombre.toLowerCase().includes(q)
        const matchesDesc = (p.descripcion || "").toLowerCase().includes(q)
        const matchesItems = (p.items || []).some((i) => i.nombre.toLowerCase().includes(q))
        if (!matchesNombre && !matchesDesc && !matchesItems) return false
      }
      return true
    })
  }, [paquetes, statusFilter, search])

  // Si el seleccionado no está en la lista filtrada, ajustamos
  useEffect(() => {
    if (filteredPaquetes.length > 0) {
      if (!selectedId || !filteredPaquetes.some((p) => p.id === selectedId)) {
        setSelectedId(filteredPaquetes[0].id)
      }
    } else {
      setSelectedId(null)
    }
  }, [filteredPaquetes, selectedId])

  const selected = useMemo(() => {
    return paquetes.find((p) => p.id === selectedId) || null
  }, [paquetes, selectedId])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await podcastService.deletePaquete(deleteConfirm.id)
      toast.success("Paquete eliminado exitosamente")
      if (selectedId === deleteConfirm.id) {
        const remaining = paquetes.filter((p) => p.id !== deleteConfirm.id)
        setSelectedId(remaining[0]?.id || null)
      }
      setDeleteConfirm(null)
      load()
    } catch {
      toast.error("Error al eliminar paquete")
    } finally {
      setDeletingItem(false)
    }
  }

  // Métricas Bento
  const totalPaquetes = paquetes.length
  const paquetesActivos = paquetes.filter((p) => p.activo).length
  const paquetesInactivos = totalPaquetes - paquetesActivos
  const precios = paquetes.map((p) => Number(p.precio_por_hora) || 0)
  const precioPromedio =
    precios.length > 0 ? precios.reduce((a, b) => a + b, 0) / precios.length : 0
  const totalItemsRegistrados = paquetes.reduce((acc, p) => acc + (p.items?.length || 0), 0)

  return (
    <div className="min-h-full bg-[#f8f9ff] text-slate-800 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/servicios/podcast"
              className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-xs shrink-0"
              title="Volver a Reservas de Podcast"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                Catálogo de Paquetes
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingPaquete(null)
                setModalOpen(true)
              }}
              className="h-11 px-5 rounded-xl bg-[#fd761a] hover:opacity-95 active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Nuevo Paquete</span>
            </button>
          </div>
        </div>

        {/* 4 Tarjetas Bento KPI de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Paquetes */}
          <div className="p-5 rounded-xl border border-slate-200/90 shadow-xs bg-white flex items-center justify-between hover:shadow-sm transition-all">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Total Paquetes</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{totalPaquetes}</p>
              <span className="inline-block text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                {paquetesActivos} activos en oferta
              </span>
            </div>
            <div className="size-11 rounded-xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={PackageIcon} size={22} />
            </div>
          </div>

          {/* Card 2: Disponibles */}
          <div className="p-5 rounded-xl border border-slate-200/90 shadow-xs bg-white flex items-center justify-between hover:shadow-sm transition-all">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Paquetes Activos</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{paquetesActivos}</p>
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Listos para agendar
              </span>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={22} />
            </div>
          </div>

          {/* Card 3: Tarifa Promedio */}
          <div className="p-5 rounded-xl border border-slate-200/90 shadow-xs bg-white flex items-center justify-between hover:shadow-sm transition-all">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Tarifa Promedio</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                ${precioPromedio.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ sesión</span>
              </p>
              <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Tarifa base por sesión
              </span>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Money01Icon} size={22} />
            </div>
          </div>

          {/* Card 4: Equipamiento Total */}
          <div className="p-5 rounded-xl border border-slate-200/90 shadow-xs bg-white flex items-center justify-between hover:shadow-sm transition-all">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">Equipamiento Total</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {totalItemsRegistrados}
                <span className="text-xs font-normal text-slate-400 ml-1">ítems</span>
              </p>
              <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Microfonía y cabina
              </span>
            </div>
            <div className="size-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Tick02Icon} size={22} />
            </div>
          </div>
        </div>

        {/* Toolbar de Filtros, Búsqueda y Selector de Vista */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative w-full md:w-80">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paquete o equipamiento..."
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            )}
          </div>

          {/* Filtros de Estado y Cambio de Vista */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Tabs de Estado */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("todos")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  statusFilter === "todos"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Todos ({totalPaquetes})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("activos")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  statusFilter === "activos"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Activos ({paquetesActivos})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactivos")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  statusFilter === "inactivos"
                    ? "bg-white text-slate-800 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Inactivos ({paquetesInactivos})
              </button>
            </div>

            {/* Selector de Modo de Vista */}
            <div className="hidden sm:inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/70 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "split"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                )}
                title="Vista dividida (detalle completo)"
              >
                <Columns2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-400 hover:text-slate-700"
                )}
                title="Vista de cuadrícula de tarjetas"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse"
                />
              ))}
            </div>
            <div className="lg:col-span-8 h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          </div>
        ) : filteredPaquetes.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-slate-200 bg-white text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="size-16 rounded-2xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center">
              <HugeiconsIcon icon={PackageIcon} size={28} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-900">
                {search ? "Sin resultados para tu búsqueda" : "No hay paquetes configurados"}
              </h3>
              <p className="text-xs text-slate-500">
                {search
                  ? `No encontramos coincidencias para "${search}". Prueba con otros términos.`
                  : "Crea tu primer paquete de podcast para comenzar a recibir reservas técnicas."}
              </p>
            </div>
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("todos")
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingPaquete(null)
                  setModalOpen(true)
                }}
                className="px-5 py-2.5 rounded-xl bg-[#fd761a] hover:opacity-95 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Crear Primer Paquete</span>
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ================= VISTA DE CUADRÍCULA (GRID) ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPaquetes.map((pkg) => {
              return (
                <div
                  key={pkg.id}
                  className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Tag & Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          pkg.activo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            pkg.activo ? "bg-emerald-500" : "bg-slate-400"
                          )}
                        />
                        {pkg.activo ? "Disponible" : "Inactivo"}
                      </span>

                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPaquete(pkg)
                            setModalOpen(true)
                          }}
                          className="size-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                          title="Editar paquete"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ id: pkg.id, name: pkg.nombre })}
                          className="size-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                          title="Eliminar paquete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Nombre y Precio */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {pkg.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {pkg.descripcion || "Sin descripción registrada para este paquete."}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Tarifa por sesión
                        </span>
                        <p className="text-lg font-black text-slate-900 tracking-tight">
                          ${Number(pkg.precio_por_hora).toFixed(2)}
                          <span className="text-xs font-normal text-slate-500 ml-1">/ sesión</span>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[#fd761a] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg">
                        {pkg.items?.length || 0} ítems
                      </span>
                    </div>

                    {/* Lista rápida de equipamiento */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <HugeiconsIcon icon={Tick02Icon} size={12} className="text-emerald-600" />
                        <span>Equipamiento incluido:</span>
                      </span>
                      {pkg.items && pkg.items.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {pkg.items.slice(0, 4).map((it) => (
                            <div
                              key={it.id}
                              className="text-xs text-slate-600 flex items-center gap-2"
                            >
                              <span className="size-1 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{it.nombre}</span>
                            </div>
                          ))}
                          {pkg.items.length > 4 && (
                            <p className="text-[11px] text-slate-400 italic pt-0.5">
                              + {pkg.items.length - 4} equipamientos adicionales...
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin ítems vinculados.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(pkg.id)
                        setViewMode("split")
                      }}
                      className="text-xs font-semibold text-[#fd761a] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver ficha técnica detallada →</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ================= VISTA DIVIDIDA (MASTER-DETAIL) ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Columna Izquierda: Lista de Paquetes */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Catálogo de Paquetes</span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {filteredPaquetes.length} resultado{filteredPaquetes.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
                {filteredPaquetes.map((pkg) => {
                  const isSelected = selectedId === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedId(pkg.id)}
                      className={cn(
                        "w-full text-left p-4 transition-all relative flex items-start gap-3.5 cursor-pointer",
                        isSelected
                          ? "bg-orange-50/50 border-l-4 border-l-[#fd761a]"
                          : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center shrink-0 transition-all font-bold text-xs",
                          isSelected
                            ? "bg-[#fd761a] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <HugeiconsIcon icon={PackageIcon} size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4
                            className={cn(
                              "text-xs font-bold truncate",
                              isSelected ? "text-[#fd761a]" : "text-slate-900"
                            )}
                          >
                            {pkg.nombre}
                          </h4>
                          <span
                            className={cn(
                              "size-2 rounded-full shrink-0",
                              pkg.activo ? "bg-emerald-500" : "bg-slate-300"
                            )}
                            title={pkg.activo ? "Activo" : "Inactivo"}
                          />
                        </div>

                        <p className="text-[11px] text-slate-500 truncate">
                          {pkg.descripcion || "Sin descripción"}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px]">
                          <span className="font-extrabold text-slate-900">
                            ${Number(pkg.precio_por_hora).toFixed(2)}
                            <span className="font-normal text-slate-400">/sesión</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-medium">
                            {pkg.items?.length || 0} ítems incluidos
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Columna Derecha: Detalle Completo del Paquete Seleccionado */}
            <div className="lg:col-span-7">
              {selected ? (
                <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden space-y-6 p-6 sm:p-7 animate-in fade-in duration-150">
                  {/* Ficha Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="size-14 rounded-2xl bg-orange-50 text-[#fd761a] border border-orange-100 flex items-center justify-center shrink-0 shadow-xs">
                        <HugeiconsIcon icon={PackageIcon} size={28} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              selected.activo
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                selected.activo ? "bg-emerald-500" : "bg-slate-400"
                              )}
                            />
                            {selected.activo ? "Disponible para reserva" : "Inactivo / Pausado"}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                          {selected.nombre}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {selected.descripcion || "Este paquete no tiene especificaciones detalladas registradas aún."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPaquete(selected)
                          setModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      >
                        <HugeiconsIcon icon={Edit01Icon} size={14} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({ id: selected.id, name: selected.nombre })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 border border-slate-200 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  {/* 2 Cajas de Métricas Rápidas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tarifa por Sesión Base
                      </span>
                      <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                        ${Number(selected.precio_por_hora).toFixed(2)}
                        <span className="text-xs font-medium text-slate-500 ml-1">/ sesión</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Equipamiento Incluido
                      </span>
                      <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                        {selected.items?.length || 0}
                        <span className="text-xs font-medium text-slate-500 ml-1.5">
                          ítems configurados
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Sección de Equipamiento Incluido */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                        <HugeiconsIcon icon={Tick02Icon} size={14} className="text-emerald-600" />
                        <span>Equipos y Servicios que incluye la sesión</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {selected.items?.length || 0} beneficios
                      </span>
                    </div>

                    {selected.items && selected.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selected.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs"
                          >
                            <div className="size-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={Tick02Icon} size={12} />
                            </div>
                            <span className="font-medium text-slate-800">{item.nombre}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/40">
                        <p className="text-xs text-slate-500 font-medium">
                          Este paquete no tiene ítems ni equipamiento asignado.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPaquete(selected)
                            setModalOpen(true)
                          }}
                          className="mt-2 text-xs font-bold text-[#fd761a] hover:underline cursor-pointer"
                        >
                          Haz clic aquí para agregar equipamiento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs p-10 text-center text-slate-400">
                  <p className="text-xs font-medium">Selecciona un paquete para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Crear / Editar Paquete */}
      <PaqueteModal
        key={editingPaquete?.id || "new"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        paquete={editingPaquete}
        onSaved={load}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Paquete de Podcast"
        message={`¿Estás seguro de que deseas eliminar permanentemente el paquete "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Paquete"
        cancelText="Cancelar"
        isDangerous
        isLoading={deletingItem}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
