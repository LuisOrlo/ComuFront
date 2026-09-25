import { useState, useEffect } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { Plus, Loader2 } from "lucide-react"
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
    <div className="flex min-h-full flex-col overflow-y-auto bg-slate-50/50 text-slate-800">
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 py-4 shadow-2xs sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Clientes</h1>
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:inline">
              Directorio
            </span>
          </div>

          <button
            onClick={() => navigate("/clientes/nuevo")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#fd761a] hover:bg-[#e06512] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs shadow-[#fd761a]/25 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        <ClientesFilters search={search} onSearchChange={handleSearch} />
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 size={28} className="animate-spin text-[#fd761a]" />
              <p className="text-xs font-semibold text-slate-500">Cargando clientes...</p>
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
