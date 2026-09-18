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
    <div className="flex min-h-full flex-col overflow-y-auto bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-20 shrink-0 border-b bg-white/95 px-4 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] sm:px-6 lg:px-8" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: COLORS.CHARCOAL }}>Clientes</h1>
                <span className="hidden rounded-full bg-[#e5eeff] px-2.5 py-1 text-[11px] font-semibold text-[#45464d] sm:inline">Directorio</span>
              </div>
             
            </div>
          <button
            onClick={() => navigate("/clientes/nuevo")}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <Plus size={18} strokeWidth={2.5} color="white" />
            Nuevo Cliente
          </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
          <ClientesFilters search={search} onSearchChange={handleSearch} />
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 size={30} className="animate-spin" style={{ color: COLORS.ACCENT }} />
              <p className="text-sm font-medium text-[#73747b]">Cargando clientes...</p>
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
      </main>
    </div>
  )
}
