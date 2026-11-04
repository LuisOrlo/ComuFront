import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { personasService, type Persona } from "@/services/personas.service"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"

export interface ResponsableOption {
  tipo: "persona" | "cliente_externo"
  id: string
  nombres: string
  apellidos: string
  cedula?: string
  correo?: string
  celular?: string
}

interface Props {
  selected: ResponsableOption | null
  onSelect: (resp: ResponsableOption | null) => void
  error?: string
}

export function SelectorClienteResponsable({ selected, onSelect, error }: Props) {
  const [tipo, setTipo] = useState<"persona" | "cliente_externo">("cliente_externo")
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<ResponsableOption[]>([])
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        if (tipo === "persona") {
          const res = await personasService.getPersonas({
            buscar: search.trim() || undefined,
            tipo: "estudiante,instructor,pasante,staff",
            per_page: 30,
            page: 1,
          })
          const items = (Array.isArray(res) ? res : res?.data || []) as Persona[]
          setResults(
            items.map((p: Persona) => ({
              tipo: "persona" as const,
              id: p.id,
              nombres: p.nombres,
              apellidos: p.apellidos || "",
              cedula: p.cedula,
              correo: p.correo,
              celular: p.celular,
            }))
          )
        } else {
          const res = await clientesService.getClientes({
            search: search.trim() || undefined,
            per_page: 30,
          })
          const items = (Array.isArray(res) ? res : res?.data || []) as ClienteExterno[]
          setResults(
            items.map((c: ClienteExterno) => ({
              tipo: "cliente_externo" as const,
              id: c.id,
              nombres: c.nombres,
              apellidos: c.apellidos || "",
              cedula: c.cedula || c.ruc,
              correo: c.correo,
              celular: c.celular,
            }))
          )
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [search, tipo, dropdownOpen])

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-700">
        Cliente o Persona Responsable <span className="text-red-500">*</span>
      </label>

      {/* Tabs Tipo Responsable */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => {
            setTipo("cliente_externo")
            setSearch("")
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            tipo === "cliente_externo" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Cliente Externo
        </button>
        <button
          type="button"
          onClick={() => {
            setTipo("persona")
            setSearch("")
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            tipo === "persona" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Estudiante / Interno
        </button>
      </div>

      {selected ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shrink-0">
              {(selected.nombres?.[0] || "C").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selected.nombres} {selected.apellidos}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800">
                  {selected.tipo === "persona" ? "Interno" : "Cliente"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {selected.cedula ? `ID: ${selected.cedula} · ` : ""}
                {selected.celular ? `Cel: ${selected.celular}` : selected.correo || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
            title="Cambiar responsable"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value)
                setDropdownOpen(true)
              }}
              placeholder={`Buscar ${tipo === "persona" ? "estudiante o docente" : "cliente externo"} por nombre o cédula...`}
              className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-xs sm:text-sm font-semibold outline-none transition shadow-2xs ${
                error
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
              }`}
            />
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border border-slate-200 bg-white shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-400">Buscando...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron coincidencias para &quot;{search}&quot;.
                </div>
              ) : (
                results.map((opt) => (
                  <button
                    key={`${opt.tipo}_${opt.id}`}
                    type="button"
                    onClick={() => {
                      onSelect(opt)
                      setDropdownOpen(false)
                      setSearch("")
                    }}
                    className="w-full p-2.5 text-left rounded-lg hover:bg-slate-50 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {opt.nombres} {opt.apellidos}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {opt.cedula && <span>Cédula: {opt.cedula} · </span>}
                        {opt.celular || opt.correo || ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      Seleccionar
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  )
}
