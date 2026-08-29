import { useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { Plus, Loader2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { ClientesFilters } from "./components/ClientesFilters"
import { ClientesTable } from "./components/ClientesTable"

const ITEMS_PER_PAGE = 50

export function ClientesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const clientesQuery = useQuery({
    queryKey: ["clientes", searchQuery],
    queryFn: () => clientesService.getClientes({ per_page: ITEMS_PER_PAGE, search: searchQuery || undefined }) as Promise<{ data: ClienteExterno[] }>,
    placeholderData: keepPreviousData,
  })
  const clientes = clientesQuery.data?.data ?? []
  const loading = clientesQuery.isLoading

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Clientes
            </h1>
            <p className="text-sm opacity-50 mt-1">Registro de clientes de servicios</p>
          </div>
          <button
            onClick={() => navigate("/clientes/nuevo")}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-xl shadow-emerald-500/20"
            style={{ backgroundColor: "oklch(0.55 0.18 160)" }}
          >
            <Plus size={18} strokeWidth={2.5} color="white" />
            Nuevo Cliente
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <div className="bg-white rounded-xl border shadow-2xl shadow-black/5 flex flex-col min-h-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <ClientesFilters search={search} onSearchChange={handleSearch} />
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: COLORS.ACCENT }} />
              <p className="text-sm font-medium opacity-50">Cargando clientes...</p>
            </div>
          ) : (
            <ClientesTable
              clientes={clientes}
              loading={clientesQuery.isFetching}
              search={search}
              onSearchChange={handleSearch}
            />
          )}
        </div>
      </div>
    </div>
  )
}
