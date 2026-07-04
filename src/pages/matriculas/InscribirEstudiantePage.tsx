import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, SearchIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { CursoAbierto } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"
import { estudiantesService } from "@/services/estudiantes.service"
import { PagoPreAprobacionSection, type PagoPreAprobacionRef } from "@/pages/matriculas/PagoPreAprobacionSection"
import { toast } from "sonner"
import axios from "axios"
import api from "@/services/auth.service"

type TipoInscripcion = "curso" | "taller"

export function InscribirEstudiantePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [tipo, setTipo] = useState<TipoInscripcion>("curso")
  const [estudiante, setEstudiante] = useState<Record<string, unknown> | null>(null)
  const [loadingEstudiante, setLoadingEstudiante] = useState(true)
  const [search, setSearch] = useState("")
  const [cursos, setCursos] = useState<CursoAbierto[]>([])
  const [talleres, setTalleresData] = useState<Record<string, unknown>[]>([])
  const [loadingOpciones, setLoadingOpciones] = useState(false)
  const [selectedCurso, setSelectedCurso] = useState<string | null>(null)
  const [selectedTaller, setSelectedTaller] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const pagoRef = useRef<PagoPreAprobacionRef>(null)

  // Simple taller payment
  const [montoTaller, setMontoTaller] = useState("")
  const [metodoTaller, setMetodoTaller] = useState("transferencia")

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingEstudiante(true)
    estudiantesService.getStudentById(id)
      .then((data) => setEstudiante(data as unknown as Record<string, unknown>))
      .catch(() => { toast.error("Error al cargar estudiante"); navigate("/estudiantes") })
      .finally(() => setLoadingEstudiante(false))
  }, [id, navigate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingOpciones(true)
    setSelectedCurso(null)
    setSelectedTaller(null)
    if (tipo === "curso") {
      api.get("/cursos-abiertos", { params: { per_page: 100, no_iniciados: "true" } })
        .then((res) => setCursos(res.data.data || []))
        .catch(() => setCursos([]))
        .finally(() => setLoadingOpciones(false))
    } else {
      tallerService.listar()
        .then((res: unknown) => setTalleresData(((res as Record<string, unknown>).data || (res as Record<string, unknown>).datos || []) as Record<string, unknown>[]))
        .catch(() => setTalleresData([]))
        .finally(() => setLoadingOpciones(false))
    }
  }, [tipo])

  const filteredCursos = cursos.filter(c =>
    (c.nombre_instancia || c.catalogo?.nombre || "").toLowerCase().includes(search.toLowerCase())
  )

  const filteredTalleres = talleres.filter((t: Record<string, unknown>) =>
    String(t.nombre || "").toLowerCase().includes(search.toLowerCase())
  )

  async function handleApproveWithPayment(pagos: Record<string, unknown>[], metodoPago: string) {
    if (!selectedCurso || !id) return
    setSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      await axios.post(`${base}/academic/matriculas/inscribir-desde-perfil`, {
        estudiante_id: id,
        curso_abierto_id: selectedCurso,
        pagos,
        metodo_pago: metodoPago,
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      toast.success("Estudiante inscrito exitosamente")
      navigate(`/estudiantes/${id}/academico`)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al inscribir estudiante")
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitTaller() {
    if (!selectedTaller || !id) return
    setSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL
      await axios.post(`${base}/academic/inscripciones-talleres/inscribir-desde-perfil`, {
        estudiante_id: id,
        taller_id: selectedTaller,
        monto_pagado: parseFloat(montoTaller) || 0,
        metodo_pago: metodoTaller,
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      toast.success("Estudiante inscrito al taller exitosamente")
      navigate(`/estudiantes/${id}/academico`)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al inscribir estudiante")
    } finally {
      setSaving(false)
    }
  }

  const selectedCursoData = cursos.find(c => c.id === selectedCurso)
  const selectedTallerData = talleres.find(t => t.id === selectedTaller) as Record<string, unknown> | undefined

  if (loadingEstudiante) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando...
      </div>
    )
  }

  const estudianteNombre = estudiante ? `${estudiante.nombres || ""} ${estudiante.apellidos || ""}` : "—"
  const estudianteCedula = estudiante ? String(estudiante.cedula || "—") : "—"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[800px] mx-auto px-6 py-5">
          <button onClick={() => navigate(`/estudiantes/${id}/academico`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: COLORS.TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver al perfil
          </button>
          <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Inscribir Estudiante</h1>
        </div>
      </div>

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-6 space-y-5">
        {/* Student info card */}
        <div className="bg-white rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-center size-12 rounded-xl shrink-0 text-lg font-bold text-white" style={{ backgroundColor: COLORS.ACCENT }}>
            {String(estudiante?.nombres || "?").charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{estudianteNombre}</p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Cédula: {estudianteCedula}</p>
          </div>
        </div>

        {/* Tipo toggle */}
        <div className="flex gap-1 rounded-xl border p-0.5 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {([
            { value: "curso" as const, label: "Curso" },
            { value: "taller" as const, label: "Taller" },
          ]).map(t => (
            <button key={t.value} onClick={() => { setTipo(t.value); setSearch(""); setSelectedCurso(null); setSelectedTaller(null) }}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: tipo === t.value ? COLORS.CHARCOAL : "transparent",
                color: tipo === t.value ? "white" : COLORS.TEXT_MUTED,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + selector */}
        <div className="space-y-3">
          <div className="relative">
            <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
            <input type="text" placeholder={`Buscar ${tipo}...`} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border bg-white outline-none"
              style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          </div>

          {loadingOpciones ? (
            <p className="text-xs text-center py-4" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</p>
          ) : tipo === "curso" ? (
            <div className="grid gap-2 max-h-[250px] overflow-y-auto">
              {filteredCursos.map(c => (
                <button key={c.id} type="button"
                  onClick={() => setSelectedCurso(selectedCurso === c.id ? null : c.id)}
                  className="p-4 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: selectedCurso === c.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                    backgroundColor: selectedCurso === c.id ? `color-mix(in srgb, ${COLORS.ACCENT} 5%, white)` : "white",
                  }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                        {c.nombre_instancia || c.catalogo?.nombre || "Sin nombre"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                        {c.modalidad} · Precio: ${Number(c.precio_base || 0).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{
                      backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`,
                      color: COLORS.ACCENT,
                    }}>
                      {c.matriculas?.length || 0}/{c.capacidad_maxima}
                    </span>
                  </div>
                </button>
              ))}
              {filteredCursos.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: COLORS.TEXT_MUTED }}>No se encontraron cursos</p>
              )}
            </div>
          ) : (
            <div className="grid gap-2 max-h-[250px] overflow-y-auto">
              {filteredTalleres.map((t: Record<string, unknown>) => (
                <button key={String(t.id)} type="button"
                  onClick={() => setSelectedTaller(selectedTaller === t.id ? null : String(t.id))}
                  className="p-4 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: selectedTaller === String(t.id) ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                    backgroundColor: selectedTaller === String(t.id) ? `color-mix(in srgb, ${COLORS.ACCENT} 5%, white)` : "white",
                  }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{String(t.nombre || "")}</p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                         {String(t.modalidad || "")} · {String(t.fecha || "").split("T")[0]} · ${String(t.precio)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{
                      backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`,
                      color: COLORS.ACCENT,
                    }}>
                      {String(t.capacidad_maxima || "—")}
                    </span>
                  </div>
                </button>
              ))}
              {filteredTalleres.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: COLORS.TEXT_MUTED }}>No se encontraron talleres</p>
              )}
            </div>
          )}
        </div>

        {/* Payment section */}
        {tipo === "curso" && selectedCurso && selectedCursoData && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: COLORS.CHARCOAL }}>
              Pago - {selectedCursoData.nombre_instancia || selectedCursoData.catalogo?.nombre || "Curso"}
            </h3>
            <PagoPreAprobacionSection
              ref={pagoRef}
              cursoAbiertoId={selectedCurso}
              cursoNombre={selectedCursoData.nombre_instancia || selectedCursoData.catalogo?.nombre || "Curso"}
              metodoPagoInicial="transferencia"
              onMontoModulo1Change={() => {}}
              onSubmit={(pagos, metodoPago) => handleApproveWithPayment(pagos, metodoPago)}
            />
          </div>
        )}

        {tipo === "taller" && selectedTaller && selectedTallerData && (
          <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
              Pago - {String(selectedTallerData.nombre || "Taller")}
            </h3>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Precio: ${String(selectedTallerData.precio)}
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>Monto a pagar</label>
              <input type="number" min={0} step="0.01" value={montoTaller}
                onChange={e => setMontoTaller(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}
                placeholder={String(selectedTallerData.precio || "0")} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: COLORS.CHARCOAL }}>Método de pago</label>
              <select value={metodoTaller} onChange={e => setMetodoTaller(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm border bg-white outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="deposito">Depósito</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <button onClick={handleSubmitTaller} disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ backgroundColor: COLORS.ACCENT }}>
              {saving ? "Inscribiendo..." : "Inscribir al Taller"}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
