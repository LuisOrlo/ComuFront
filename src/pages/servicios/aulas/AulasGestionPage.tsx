import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit01Icon,
  Home02Icon,
  Money01Icon,
  UserGroupIcon,
  ArrowLeft02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import {
  Plus,
  Trash2,
  X,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  Tag,
  Loader2,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { aulasService, type Aula } from "@/services/aulas.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

const AULA_COLORS = [
  { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", iconBg: "bg-indigo-600 text-white" },
  { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", iconBg: "bg-emerald-600 text-white" },
  { bg: "bg-amber-50 text-amber-700 border-amber-200", iconBg: "bg-amber-500 text-white" },
  { bg: "bg-purple-50 text-purple-700 border-purple-200", iconBg: "bg-purple-600 text-white" },
  { bg: "bg-cyan-50 text-cyan-700 border-cyan-200", iconBg: "bg-cyan-600 text-white" },
  { bg: "bg-rose-50 text-rose-700 border-rose-200", iconBg: "bg-rose-600 text-white" },
  { bg: "bg-teal-50 text-teal-700 border-teal-200", iconBg: "bg-teal-600 text-white" },
  { bg: "bg-orange-50 text-orange-700 border-orange-200", iconBg: "bg-[#fd761a] text-white" },
]

type SortOption = "nombre-asc" | "nombre-desc" | "capacidad-desc" | "capacidad-asc" | "precio-desc" | "precio-asc"

export function AulasGestionPage() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)

  // Filters and views
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("nombre-asc")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Modal form
  const [modalOpen, setModalOpen] = useState(false)
  const [aulaForm, setAulaForm] = useState<Partial<Aula>>({ nombre: "", capacidad: 15, precio_hora: 0, caracteristicas: "" })
  const [precioHoraText, setPrecioHoraText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await aulasService.getAulas()
      setAulas(data || [])
    } catch {
      toast.error("Error al cargar las aulas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Filtered & Sorted Aulas
  const filteredAulas = useMemo(() => {
    let result = [...aulas]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.nombre?.toLowerCase().includes(q) ||
        a.caracteristicas?.toLowerCase().includes(q) ||
        String(a.capacidad).includes(q) ||
        String(a.precio_hora).includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sort) {
        case "nombre-asc":
          return (a.nombre || "").localeCompare(b.nombre || "")
        case "nombre-desc":
          return (b.nombre || "").localeCompare(a.nombre || "")
        case "capacidad-desc":
          return (b.capacidad || 0) - (a.capacidad || 0)
        case "capacidad-asc":
          return (a.capacidad || 0) - (b.capacidad || 0)
        case "precio-desc":
          return (Number(b.precio_hora) || 0) - (Number(a.precio_hora) || 0)
        case "precio-asc":
          return (Number(a.precio_hora) || 0) - (Number(b.precio_hora) || 0)
        default:
          return 0
      }
    })

    return result
  }, [aulas, search, sort])

  const handlePrecioHoraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (!/^\d*\.?\d*$/.test(raw)) return
    setPrecioHoraText(raw)
  }

  const handleSave = async () => {
    if (!aulaForm.nombre?.trim()) {
      toast.error("El nombre del aula es obligatorio")
      return
    }
    const precio = parseFloat(precioHoraText)
    if (precioHoraText.trim() === "" || isNaN(precio) || precio < 0) {
      toast.error("El precio por sesión debe ser un valor numérico válido")
      return
    }
    const capacidadNum = Number(aulaForm.capacidad) || 1
    if (capacidadNum < 1) {
      toast.error("La capacidad debe ser de al menos 1 persona")
      return
    }

    const payload = {
      ...aulaForm,
      capacidad: capacidadNum,
      precio_hora: precio,
    }

    setSaving(true)
    try {
      if (editingId) {
        await aulasService.updateAula(editingId, payload)
        toast.success("Aula actualizada correctamente")
      } else {
        await aulasService.createAula(payload)
        toast.success("Nueva aula creada con éxito")
      }
      setModalOpen(false)
      setEditingId(null)
      setAulaForm({ nombre: "", capacidad: 15, precio_hora: 0, caracteristicas: "" })
      setPrecioHoraText("")
      load()
    } catch {
      toast.error("Error al guardar los datos del aula")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeletingItem(true)
    try {
      await aulasService.deleteAula(deleteConfirm.id)
      toast.success("Aula eliminada del catálogo")
      setDeleteConfirm(null)
      load()
    } catch {
      toast.error("Error al eliminar el aula")
    } finally {
      setDeletingItem(false)
    }
  }

  const openEdit = (aula: Aula) => {
    setEditingId(aula.id)
    setAulaForm({ ...aula })
    setPrecioHoraText(aula.precio_hora != null ? String(aula.precio_hora) : "")
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setAulaForm({ nombre: "", capacidad: 15, precio_hora: 0, caracteristicas: "" })
    setPrecioHoraText("")
    setModalOpen(true)
  }

  // Parse characteristics string into an array of clean tags
  const parseFeatures = (caracteristicas?: string) => {
    if (!caracteristicas?.trim()) return []
    return caracteristicas
      .split(/[,;\n•]+/)
      .map(s => s.trim())
      .filter(Boolean)
  }

  return (
    <div className="min-h-full bg-slate-50/50 text-slate-800 pb-16 flex flex-col">
      {/* Header Contextual */}
      <header className="shrink-0 px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span style={{ color: COLORS.ACCENT }}>Servicios</span>
              <span className="text-slate-300">/</span>
              <Link to="/servicios/aulas" className="hover:text-slate-600 transition-colors">
                Aulas
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700">Catálogo de Espacios</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Gestión de Aulas
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#fd761a] border border-orange-200">
                {aulas.length} {aulas.length === 1 ? "espacio" : "espacios"}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Configura los espacios académicos, su aforo máximo y las tarifas aplicadas por sesión de reserva.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Link
              to="/servicios/aulas"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.98]"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={15} className="text-slate-400" />
              <span>Volver a Reservas</span>
            </Link>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Nueva Aula</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Filter & View Toolbar */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar aula por nombre o equipamiento..."
              className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-slate-800 placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sorting and View mode */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
                Ordenar:
              </span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none hover:bg-slate-50 focus:border-orange-400 cursor-pointer transition-all"
                >
                  <option value="nombre-asc">Nombre (A - Z)</option>
                  <option value="nombre-desc">Nombre (Z - A)</option>
                  <option value="capacidad-desc">Mayor Capacidad</option>
                  <option value="capacidad-asc">Menor Capacidad</option>
                  <option value="precio-desc">Mayor Precio</option>
                  <option value="precio-asc">Menor Precio</option>
                </select>
                <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Vista de cuadrícula"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Vista de tabla"
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* List of Aulas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-slate-100" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-50 rounded-xl" />
                <div className="h-12 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredAulas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs flex flex-col items-center justify-center space-y-4">
            <div className="size-16 rounded-2xl bg-orange-50 text-[#fd761a] flex items-center justify-center shadow-xs border border-orange-100">
              <HugeiconsIcon icon={Home02Icon} size={28} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg font-bold text-slate-900">
                {search ? "No se encontraron aulas" : "No hay aulas configuradas"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {search
                  ? `No se encontraron coincidencias para "${search}". Intenta con otros términos o limpia el filtro.`
                  : "Empieza configurando los espacios físicos disponibles para impartir clases y capacitaciones."}
              </p>
            </div>
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all active:scale-[0.98]"
              >
                <X size={14} />
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Crear primera aula
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredAulas.map((aula, i) => {
                const colorTheme = AULA_COLORS[i % AULA_COLORS.length]
                const features = parseFeatures(aula.caracteristicas)

                return (
                  <motion.div
                    key={aula.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${colorTheme.iconBg}`}>
                          <HugeiconsIcon icon={Home02Icon} size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug truncate" title={aula.nombre}>
                            {aula.nombre}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            <span className="text-[11px] font-semibold text-slate-500">Disponible para reservas</span>
                          </div>
                        </div>
                      </div>

                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Aula #{i + 1}
                      </span>
                    </div>

                    {/* Card Body & Specs */}
                    <div className="p-5 flex-1 space-y-4">
                      {/* Metric pills */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserGroupIcon} size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Capacidad</p>
                            <p className="text-sm font-black text-slate-900">{aula.capacidad} PAX</p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={Money01Icon} size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Inversión</p>
                            <p className="text-sm font-black text-slate-900">
                              ${Number(aula.precio_hora || 0).toFixed(2)}
                              <span className="text-[10px] font-normal text-slate-500 ml-0.5">/sesión</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Characteristics / Equipment Chips */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Tag size={12} className="text-slate-400" />
                          <span>Equipamiento & Detalles</span>
                        </p>
                        {features.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {features.map((feat, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
                              >
                                <span className="size-1 rounded-full bg-slate-400" />
                                {feat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Sin especificaciones de equipamiento adicionales.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(aula)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-[0.97]"
                      >
                        <HugeiconsIcon icon={Edit01Icon} size={14} className="text-slate-500" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ id: aula.id, name: aula.nombre })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs active:scale-[0.97]"
                      >
                        <Trash2 size={13} className="text-rose-600" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3.5 px-5">Aula / Espacio</th>
                    <th className="py-3.5 px-5">Aforo (PAX)</th>
                    <th className="py-3.5 px-5">Tarifa / Sesión</th>
                    <th className="py-3.5 px-5">Equipamiento & Detalles</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredAulas.map((aula, i) => {
                    const colorTheme = AULA_COLORS[i % AULA_COLORS.length]
                    const features = parseFeatures(aula.caracteristicas)

                    return (
                      <tr key={aula.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${colorTheme.iconBg}`}>
                              <HugeiconsIcon icon={Home02Icon} size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{aula.nombre}</p>
                              <span className="text-[11px] text-slate-400">Identificador #{i + 1}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <HugeiconsIcon icon={UserGroupIcon} size={13} />
                            {aula.capacidad} PAX
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <span className="text-emerald-700 font-black">
                            ${Number(aula.precio_hora || 0).toFixed(2)}
                          </span>
                          <span className="text-slate-400 text-xs font-normal"> /sesión</span>
                        </td>
                        <td className="py-3.5 px-5">
                          {features.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {features.slice(0, 3).map((f, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                                >
                                  {f}
                                </span>
                              ))}
                              {features.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-bold self-center">
                                  +{features.length - 3} más
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(aula)}
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Editar aula"
                            >
                              <HugeiconsIcon icon={Edit01Icon} size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ id: aula.id, name: aula.nombre })}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Eliminar aula"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Crear / Editar Aula */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200/90"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: COLORS.ACCENT }}
                  >
                    <HugeiconsIcon icon={Home02Icon} size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {editingId ? "Editar Aula" : "Nueva Aula"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingId ? "Modifica los parámetros del espacio físico" : "Registra un nuevo espacio para impartir capacitaciones"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="size-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form */}
              <div className="p-6 space-y-5">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Nombre del Aula <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Home02Icon}
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={aulaForm.nombre || ""}
                      onChange={e => setAulaForm(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej. Aula Magna, Estudio de Radio 1, Sala Polivalente"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-semibold text-slate-800 placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                {/* Capacidad y Precio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Aforo / Capacidad (PAX) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={UserGroupIcon}
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={aulaForm.capacidad || ""}
                        onChange={e => setAulaForm(prev => ({ ...prev, capacidad: parseInt(e.target.value) || 0 }))}
                        placeholder="15"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-semibold text-slate-800 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Número máximo de participantes permitidos.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Tarifa por Sesión ($) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Money01Icon}
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={precioHoraText}
                        onChange={handlePrecioHoraChange}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-semibold text-slate-800 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Valor de referencia al reservar este espacio.</p>
                  </div>
                </div>

                {/* Características y Equipamiento */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Equipamiento y Características
                    </label>
                    <span className="text-[10px] text-slate-400">Separados por comas</span>
                  </div>

                  <textarea
                    rows={3}
                    value={aulaForm.caracteristicas || ""}
                    onChange={e => setAulaForm(prev => ({ ...prev, caracteristicas: e.target.value }))}
                    placeholder="Describe el equipamiento disponible: Proyector HD, Sistema de Audio, Pizarra Acrílica..."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium text-slate-800 placeholder:text-slate-400 resize-none transition-all"
                  />

                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: COLORS.ACCENT }}
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  <span>{saving ? "Guardando..." : editingId ? "Actualizar Aula" : "Guardar Aula"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal Eliminar */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Aula"
        message={`¿Estás seguro de que deseas eliminar el aula "${deleteConfirm?.name}"? Esta acción removerá el espacio del catálogo disponible.`}
        confirmText="Eliminar Aula"
        cancelText="Conservar"
        isDangerous={true}
        isLoading={deletingItem}
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
