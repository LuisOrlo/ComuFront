import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { CalendarClock, X, ChevronRight, AlertTriangle, Clock, CheckCircle2, Award, CheckCheck } from "lucide-react"
import { recordatoriosService, type RecordatorioItem } from "@/services/recordatorios.service"
import { cn } from "@/lib/utils"

export function FloatingRecordatorios() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [filtroUrgencia, setFiltroUrgencia] = useState<"todos" | "urgente">("todos")
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Obtener fecha de hoy para almacenar descartes del día en localStorage
  const hoyKey = useMemo(() => {
    return `rec_descartados_${new Date().toISOString().slice(0, 10)}`
  }, [])

  const [descartados, setDescartados] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(hoyKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Guardar descartes en localStorage
  const descartarRecordatorio = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updated = Array.from(new Set([...descartados, id]))
    setDescartados(updated)
    try {
      localStorage.setItem(hoyKey, JSON.stringify(updated))
    } catch {
      // Ignorar error de cuota si ocurre
    }
  }

  // Consulta al backend con 5 horas de staleTime (sin re-fetching automático continuo)
  const { data } = useQuery({
    queryKey: ["recordatorios"],
    queryFn: recordatoriosService.getRecordatorios,
    staleTime: 5 * 60 * 60 * 1000, // 5 horas en milisegundos
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  // Filtrar descartados
  const itemsActivos = useMemo(() => {
    const list = data?.items ?? []
    return list.filter((item) => !descartados.includes(item.id))
  }, [data?.items, descartados])

  // Conteo de activos
  const urgentesActivos = useMemo(() => {
    return itemsActivos.filter((i) => i.urgencia === "urgente").length
  }, [itemsActivos])

  // Filtrado según selección de píldora
  const itemsFiltrados = useMemo(() => {
    if (filtroUrgencia === "urgente") {
      return itemsActivos.filter((i) => i.urgencia === "urgente")
    }
    return itemsActivos
  }, [itemsActivos, filtroUrgencia])

  // Limpiar todos los recordatorios activos al salir o manualmente
  const limpiarTodosVistos = useCallback(() => {
    if (itemsActivos.length > 0) {
      const idsAMarcar = itemsActivos.map((i) => i.id)
      const updated = Array.from(new Set([...descartados, ...idsAMarcar]))
      setDescartados(updated)
      try {
        localStorage.setItem(hoyKey, JSON.stringify(updated))
      } catch {
        // Ignorar error de cuota si ocurre
      }
    }
  }, [itemsActivos, descartados, hoyKey])

  const handleClose = useCallback(() => {
    limpiarTodosVistos()
    setIsOpen(false)
  }, [limpiarTodosVistos])

  // Cerrar al hacer click fuera del popover y limpiar vistos
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        handleClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, handleClose])

  const totalActivos = itemsActivos.length

  return (
    <>
      {/* Botón Flotante */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (isOpen) {
            handleClose()
          } else {
            setIsOpen(true)
          }
        }}
        className={cn(
          "fixed bottom-[5.5rem] right-8 z-[95] size-11 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen
            ? "bg-slate-800 text-white shadow-slate-800/40"
            : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-md"
        )}
        title={totalActivos > 0 ? `${totalActivos} avisos pendientes` : "Avisos y recordatorios"}
        aria-label="Avisos y recordatorios"
      >
        <CalendarClock size={20} className={cn(totalActivos > 0 && !isOpen && "text-[#fd761a]")} />

        {/* Badge de contador */}
        {totalActivos > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center shadow-md animate-pulse",
              urgentesActivos > 0 ? "bg-rose-500" : "bg-[#fd761a]"
            )}
          >
            {totalActivos}
          </span>
        )}
      </button>

      {/* Popover Compacto */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed bottom-[9rem] right-8 z-[100] w-[370px] sm:w-[410px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: "calc(100vh - 12rem)" }}
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/10 text-orange-400">
                <CalendarClock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white leading-tight">Avisos y Recordatorios</h3>
                <p className="text-[11px] text-slate-300">
                  {totalActivos === 0
                    ? "Sin avisos pendientes hoy"
                    : `${totalActivos} aviso${totalActivos > 1 ? "s" : ""} activo${totalActivos > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {totalActivos > 0 && (
                <button
                  type="button"
                  onClick={limpiarTodosVistos}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                  title="Marcar todos como vistos y limpiar"
                >
                  <CheckCheck size={14} className="text-emerald-400" />
                  <span>Limpiar</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Cerrar y limpiar avisos vistos"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filtros simples por Urgencia */}
          {totalActivos > 0 && (
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFiltroUrgencia("todos")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-colors",
                  filtroUrgencia === "todos"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                )}
              >
                Todos ({totalActivos})
              </button>
              {urgentesActivos > 0 && (
                <button
                  onClick={() => setFiltroUrgencia("urgente")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors",
                    filtroUrgencia === "urgente"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-rose-700 hover:bg-rose-50"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Urgentes ({urgentesActivos})
                </button>
              )}
            </div>
          )}

          {/* Lista de Avisos */}
          <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y-0">
            {itemsFiltrados.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="mx-auto size-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                  <CheckCircle2 size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-800">¡Todo al día!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {totalActivos === 0
                    ? "No tienes avisos ni recordatorios pendientes."
                    : "No hay recordatorios con este filtro."}
                </p>
              </div>
            ) : (
              itemsFiltrados.map((item: RecordatorioItem) => {
                const esUrgente = item.urgencia === "urgente"
                const esCertificado = item.tipo_evento === "certificado"

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative p-3 rounded-xl border transition-all duration-150 flex flex-col gap-2 hover:shadow-sm",
                      esUrgente
                        ? "bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70"
                        : "bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className={cn(
                            "mt-0.5 shrink-0 size-6 rounded-lg flex items-center justify-center text-xs font-semibold",
                            esCertificado
                              ? "bg-indigo-100 text-indigo-700"
                              : esUrgente
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {esCertificado ? (
                            <Award size={13} />
                          ) : esUrgente ? (
                            <AlertTriangle size={13} />
                          ) : (
                            <Clock size={13} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider",
                              esCertificado
                                ? "bg-indigo-100/80 text-indigo-800"
                                : esUrgente
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {esCertificado ? "Certificados" : esUrgente ? "Urgente" : "Próximo"}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5" title={item.subtitulo}>
                            {item.subtitulo}
                          </h4>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                            {item.descripcion}
                          </p>
                        </div>
                      </div>

                      {/* Botón descartar por hoy */}
                      <button
                        onClick={(e) => descartarRecordatorio(item.id, e)}
                        className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
                        title="Descartar por hoy"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Botón de acción */}
                    <div className="flex justify-end pt-1 border-t border-slate-100/60">
                      <button
                        onClick={() => {
                          descartarRecordatorio(item.id)
                          setIsOpen(false)
                          navigate(item.accion_url)
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:shadow-xs",
                          esCertificado
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : esUrgente
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-slate-800 text-white hover:bg-slate-900"
                        )}
                      >
                        <span>{item.accion_label}</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Informativo */}
          <div className="bg-slate-50 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Actualización cada 5 horas</span>
            <span className="text-[10px]">Klever Avisos</span>
          </div>
        </div>
      )}
    </>
  )
}
