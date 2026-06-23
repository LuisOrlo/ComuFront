import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MapPinIcon, AddCircleIcon, Delete01Icon, SearchIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const ECUADOR_CIUDADES = [
  { nombre: "Quito", provincia: "Pichincha", region: "Sierra" },
  { nombre: "Guayaquil", provincia: "Guayas", region: "Costa" },
  { nombre: "Cuenca", provincia: "Azuay", region: "Sierra" },
  { nombre: "Ambato", provincia: "Tungurahua", region: "Sierra" },
  { nombre: "Santo Domingo", provincia: "Santo Domingo de los Tsáchilas", region: "Tropical" },
  { nombre: "Manta", provincia: "Manabí", region: "Costa" },
  { nombre: "Portoviejo", provincia: "Manabí", region: "Costa" },
  { nombre: "Loja", provincia: "Loja", region: "Sierra" },
  { nombre: "Riobamba", provincia: "Chimborazo", region: "Sierra" },
  { nombre: "Machala", provincia: "El Oro", region: "Costa" },
  { nombre: "Durán", provincia: "Guayas", region: "Costa" },
  { nombre: "Ibarra", provincia: "Imbabura", region: "Sierra" },
  { nombre: "Babahoyo", provincia: "Los Ríos", region: "Costa" },
  { nombre: "Tulcán", provincia: "Carchi", region: "Sierra" },
  { nombre: "Latacunga", provincia: "Cotopaxi", region: "Sierra" },
  { nombre: "Guaranda", provincia: "Bolívar", region: "Sierra" },
  { nombre: "Azogues", provincia: "Cañar", region: "Sierra" },
  { nombre: "Tena", provincia: "Napo", region: "Amazonía" },
  { nombre: "Puyo", provincia: "Pastaza", region: "Amazonía" },
  { nombre: "Zamora", provincia: "Zamora Chinchipe", region: "Amazonía" },
  { nombre: "Macas", provincia: "Morona Santiago", region: "Amazonía" },
  { nombre: "Nueva Loja", provincia: "Sucumbíos", region: "Amazonía" },
  { nombre: "Francisco de Orellana", provincia: "Orellana", region: "Amazonía" },
  { nombre: "Puerto Baquerizo Moreno", provincia: "Galápagos", region: "Insular" },
]

const REGIONES = ["Sierra", "Costa", "Amazonía", "Insular"] as const
type Region = typeof REGIONES[number]

const regionColors: Record<Region, string> = {
  Sierra: "oklch(0.65 0.15 250)",
  Costa: "oklch(0.65 0.18 145)",
  Amazonía: "oklch(0.60 0.18 145)",
  Insular: "oklch(0.65 0.15 50)",
}

export function CiudadesPage() {
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [selectedCiudad, setSelectedCiudad] = useState<string | null>(null)
  const [filterRegion, setFilterRegion] = useState<Region | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nombre: string } | null>(null)

  const cargarCiudades = async () => {
    try {
      setLoading(true)
      const response = await ciudadesService.getCiudades(search || undefined)
      setCiudades(response.data)
    } catch {
      toast.error("Error al cargar ciudades")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCiudades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleCreate = async (nombre: string) => {
    if (!nombre.trim()) return
    try {
      setSaving(true)
      await ciudadesService.crearCiudad(nombre)
      toast.success("Ciudad creada correctamente")
      setShowForm(false)
      setSelectedCiudad(null)
      setSelectedRegion(null)
      cargarCiudades()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const errorsObj = axiosErr.response?.data?.errors
      const backendMsg = axiosErr.response?.data?.message
      if (errorsObj) {
        const first = Object.values(errorsObj).flat()[0] as string
        toast.error(first)
      } else {
        toast.error(backendMsg || "Error al crear la ciudad")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCiudad) {
      await handleCreate(selectedCiudad)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await ciudadesService.eliminarCiudad(deleteConfirm.id)
      toast.success("Ciudad eliminada")
      cargarCiudades()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr.response?.data?.message || "Error al eliminar la ciudad")
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setSelectedCiudad(null)
    setSelectedRegion(null)
  }

  const availableCities = ECUADOR_CIUDADES.filter(
    c => !ciudades.some(existing => existing.nombre.includes(c.nombre))
  )

  const groupedCities = REGIONES.reduce((acc, region) => {
    const cities = availableCities.filter(c => c.region === region)
    if (cities.length > 0) {
      acc[region] = cities
    }
    return acc
  }, {} as Record<Region, typeof ECUADOR_CIUDADES>)

  const filteredCiudades = filterRegion
    ? ciudades.filter(c => {
        const info = ECUADOR_CIUDADES.find(ec => ec.nombre === c.nombre)
        return info?.region === filterRegion
      })
    : ciudades

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-6 space-y-6">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` }}>
                <HugeiconsIcon icon={MapPinIcon} size={20} style={{ color: COLORS.ACCENT }} />
              </div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>Ciudades</h1>
                
              </div>
            </div>
            <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
              {ciudades.length} ciudades
            </span>
          </header>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <HugeiconsIcon icon={SearchIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
              <input
                type="text"
                placeholder="Buscar ciudades..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border rounded-xl text-sm outline-none transition-all duration-150"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: showForm ? "oklch(0.5 0 0)" : COLORS.ACCENT }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = showForm ? "oklch(0.4 0 0)" : `color-mix(in srgb, ${COLORS.ACCENT} 85%, black)` }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showForm ? "oklch(0.5 0 0)" : COLORS.ACCENT }}
            >
              <HugeiconsIcon icon={showForm ? CheckmarkCircle01Icon : AddCircleIcon} size={16} />
              {showForm ? "Cerrar" : "Nueva Ciudad"}
            </button>
          </div>

          {showForm && (
            <div className="rounded-xl border p-5 animate-modal-in" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white" }}>
              <style>{`
                @keyframes modalIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
                .animate-modal-in{animation:modalIn 200ms ease-out forwards}
              `}</style>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Selecciona una ciudad</h3>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>Haz clic en una ciudad para seleccionarla</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedRegion(null)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
                    style={{ borderColor: !selectedRegion ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: !selectedRegion ? `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)` : "transparent", color: !selectedRegion ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>
                    Todas
                  </button>
                  {REGIONES.map(region => (
                    <button key={region} type="button" onClick={() => setSelectedRegion(region)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
                      style={{ borderColor: selectedRegion === region ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedRegion === region ? `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)` : "transparent", color: selectedRegion === region ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>
                      {region}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto p-1">
                  {(selectedRegion ? groupedCities[selectedRegion] : availableCities).map(ciudad => (
                    <button
                      key={ciudad.nombre}
                      type="button"
                      onClick={() => setSelectedCiudad(ciudad.nombre)}
                      className="relative flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-150"
                      style={{ borderColor: selectedCiudad === ciudad.nombre ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedCiudad === ciudad.nombre ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, white)` : "white" }}
                      onMouseEnter={(e) => { if (selectedCiudad !== ciudad.nombre) { e.currentTarget.style.borderColor = `color-mix(in srgb, ${COLORS.ACCENT} 35%, transparent)`; e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 4%, white)` } }}
                      onMouseLeave={(e) => { if (selectedCiudad !== ciudad.nombre) { e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE; e.currentTarget.style.backgroundColor = "white" } }}
                    >
                      <span className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>{ciudad.nombre}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `color-mix(in srgb, ${regionColors[ciudad.region as Region]} 15%, transparent)`, color: regionColors[ciudad.region as Region] }}>{ciudad.region}</span>
                      {selectedCiudad === ciudad.nombre && (
                        <div className="absolute -top-1 -right-1 size-4 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.ACCENT }}>
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <button type="button" onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "oklch(0.92 0 0)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "oklch(0.95 0 0)" }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving || !selectedCiudad} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                    style={{ backgroundColor: COLORS.ACCENT, opacity: saving || !selectedCiudad ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (!saving && selectedCiudad) { e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 85%, black)` } }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.ACCENT }}>
                    <HugeiconsIcon icon={AddCircleIcon} size={16} />
                    {saving ? "Guardando..." : "Agregar Ciudad"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
              <span style={{ color: COLORS.TEXT_MUTED }}>Cargando ciudades...</span>
            </div>
          )}

          {!loading && ciudades.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div className="size-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` }}>
                <HugeiconsIcon icon={MapPinIcon} size={28} style={{ color: COLORS.ACCENT, opacity: 0.5 }} />
              </div>
              <div className="text-center">
                <p className="font-medium" style={{ color: COLORS.CHARCOAL }}>No hay ciudades registradas</p>
                <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>Agrega ciudades usando el botón "Nueva Ciudad"</p>
              </div>
            </div>
          )}

          {!loading && ciudades.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterRegion(null)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
                  style={{ borderColor: !filterRegion ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: !filterRegion ? `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)` : "transparent", color: !filterRegion ? COLORS.ACCENT : COLORS.TEXT_MUTED }}
                >
                  Todas
                </button>
                {REGIONES.map(region => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setFilterRegion(region)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
                    style={{ borderColor: filterRegion === region ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: filterRegion === region ? `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)` : "transparent", color: filterRegion === region ? COLORS.ACCENT : COLORS.TEXT_MUTED }}
                  >
                    {region}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{filteredCiudades.length} ciudades</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCiudades.map((ciudad) => {
                  const ciudadInfo = ECUADOR_CIUDADES.find(c => c.nombre === ciudad.nombre)
                  const region = ciudadInfo?.region as Region | undefined
                  return (
                    <div
                      key={ciudad.id}
                      className="flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-150 group"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in srgb, ${COLORS.ACCENT} 30%, transparent)`; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE; e.currentTarget.style.boxShadow = "none" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` }}>
                          <HugeiconsIcon icon={MapPinIcon} size={16} style={{ color: COLORS.ACCENT }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>{ciudad.nombre}</p>
                          {region && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `color-mix(in srgb, ${regionColors[region]} 15%, transparent)`, color: regionColors[region] }}>
                              {region}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ id: ciudad.id, nombre: ciudad.nombre })}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                        style={{ color: COLORS.TEXT_MUTED }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "oklch(0.95 0 0)"; e.currentTarget.style.color = "oklch(0.50 0.12 10)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = COLORS.TEXT_MUTED }}
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Eliminar Ciudad"
        message={`¿Eliminar la ciudad "${deleteConfirm?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}