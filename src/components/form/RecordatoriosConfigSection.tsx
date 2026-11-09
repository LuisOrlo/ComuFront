import { useState, useEffect } from "react"
import { Bell, ChevronDown, ChevronUp } from "lucide-react"
import type { RecordatoriosConfig } from "@/services/recordatorios.service"
import { cn } from "@/lib/utils"

function DaysInput({
  value,
  min = 0,
  max = 60,
  defaultVal = 1,
  onChange,
}: {
  value: number | undefined
  min?: number
  max?: number
  defaultVal?: number
  onChange: (val: number) => void
}) {
  const [localVal, setLocalVal] = useState<string>(() => String(value ?? defaultVal))

  useEffect(() => {
    setLocalVal(String(value ?? defaultVal))
  }, [value, defaultVal])

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={localVal}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const raw = e.target.value
        setLocalVal(raw)
        if (raw !== "") {
          const num = parseInt(raw, 10)
          if (!isNaN(num)) {
            const clamped = Math.max(min, Math.min(max, num))
            onChange(clamped)
          }
        }
      }}
      onBlur={() => {
        if (localVal === "" || isNaN(parseInt(localVal, 10))) {
          setLocalVal(String(defaultVal))
          onChange(defaultVal)
        } else {
          const num = Math.max(min, Math.min(max, parseInt(localVal, 10)))
          setLocalVal(String(num))
          onChange(num)
        }
      }}
      className="w-16 px-2 py-1 text-xs text-center font-bold border border-slate-300 rounded-md focus:ring-1 focus:ring-orange-500 bg-white"
    />
  )
}

interface RecordatoriosConfigSectionProps {
  tipo: "curso" | "taller"
  value?: RecordatoriosConfig
  onChange: (config: RecordatoriosConfig) => void
  fechaInicioReferencia?: string
  fechaFinReferencia?: string
}

export function RecordatoriosConfigSection({
  tipo,
  value,
  onChange,
  fechaInicioReferencia,
  fechaFinReferencia,
}: RecordatoriosConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Valores por defecto
  const config: RecordatoriosConfig = {
    inicio: {
      activo: value?.inicio?.activo ?? true,
      modo: value?.inicio?.modo ?? "dias_antes",
      dias_antes: value?.inicio?.dias_antes ?? 3,
      fecha: value?.inicio?.fecha ?? "",
    },
    fin: {
      activo: value?.fin?.activo ?? true,
      modo: value?.fin?.modo ?? "dias_antes",
      dias_antes: value?.fin?.dias_antes ?? 3,
      fecha: value?.fin?.fecha ?? "",
    },
    proximo_modulo: {
      activo: value?.proximo_modulo?.activo ?? true,
      dias_antes: value?.proximo_modulo?.dias_antes ?? 2,
    },
    certificados: {
      activo: value?.certificados?.activo ?? true,
      modo: value?.certificados?.modo ?? "dias_despues",
      dias: value?.certificados?.dias ?? 0,
      fecha: value?.certificados?.fecha ?? "",
    },
  }

  const updateConfig = (updater: (prev: RecordatoriosConfig) => RecordatoriosConfig) => {
    const updated = updater(config)
    onChange(updated)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all">
      {/* Botón Acordeón */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 flex items-center justify-between transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-orange-100/80 text-[#fd761a]">
            <Bell size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Recordatorios y Avisos automáticos
            </h4>
            <p className="text-xs text-slate-500">
              Personaliza cuándo recibir avisos antes del inicio, cambio de módulo o certificados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">
            {isOpen ? "Ocultar opciones" : "Configurar"}
          </span>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Contenido Colapsable */}
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-slate-100 bg-white animate-in fade-in duration-150">
          {/* 1. Aviso de Inicio */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.inicio?.activo ?? true}
                  onChange={(e) =>
                    updateConfig((c) => ({
                      ...c,
                      inicio: { ...(c.inicio ?? { modo: "dias_antes" }), activo: e.target.checked },
                    }))
                  }
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 size-4"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Aviso antes de iniciar {tipo === "curso" ? "el curso" : "el taller"}
                </span>
              </label>
              {fechaInicioReferencia && (
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Fecha programada: {fechaInicioReferencia}
                </span>
              )}
            </div>

            {config.inicio?.activo && (
              <div className="pl-6 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Modalidad de aviso:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig((c) => ({
                          ...c,
                          inicio: { ...(c.inicio ?? {}), activo: true, modo: "dias_antes" },
                        }))
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        config.inicio?.modo === "dias_antes"
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Días antes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig((c) => ({
                          ...c,
                          inicio: { ...(c.inicio ?? {}), activo: true, modo: "fecha_fija" },
                        }))
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        config.inicio?.modo === "fecha_fija"
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Fecha exacta
                    </button>
                  </div>
                </div>

                {config.inicio?.modo === "dias_antes" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Avisar</span>
                    <DaysInput
                      min={1}
                      max={30}
                      defaultVal={3}
                      value={config.inicio?.dias_antes}
                      onChange={(dias) =>
                        updateConfig((c) => ({
                          ...c,
                          inicio: { ...(c.inicio ?? {}), activo: true, modo: "dias_antes", dias_antes: dias },
                        }))
                      }
                    />
                    <span className="text-xs text-slate-600">días antes de la fecha de inicio.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Empezar a avisar a partir de:</span>
                    <input
                      type="date"
                      value={config.inicio?.fecha ?? ""}
                      onChange={(e) =>
                        updateConfig((c) => ({
                          ...c,
                          inicio: { ...(c.inicio ?? {}), activo: true, modo: "fecha_fija", fecha: e.target.value },
                        }))
                      }
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Próximo Módulo (Solo Cursos) */}
          {tipo === "curso" && (
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.proximo_modulo?.activo ?? true}
                  onChange={(e) =>
                    updateConfig((c) => ({
                      ...c,
                      proximo_modulo: { ...(c.proximo_modulo ?? {}), activo: e.target.checked },
                    }))
                  }
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 size-4"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Aviso antes de iniciar cada nuevo módulo
                </span>
              </label>

              {config.proximo_modulo?.activo && (
                <div className="pl-6 flex items-center gap-2">
                  <span className="text-xs text-slate-600">Avisar al docente y secretaría</span>
                  <DaysInput
                    min={1}
                    max={15}
                    defaultVal={2}
                    value={config.proximo_modulo?.dias_antes}
                    onChange={(dias) =>
                      updateConfig((c) => ({
                        ...c,
                        proximo_modulo: { activo: true, dias_antes: dias },
                      }))
                    }
                  />
                  <span className="text-xs text-slate-600">días antes de arrancar cada módulo.</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Aviso de Fin (Solo Cursos) */}
          {tipo === "curso" && (
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.fin?.activo ?? true}
                    onChange={(e) =>
                      updateConfig((c) => ({
                        ...c,
                        fin: { ...(c.fin ?? { modo: "dias_antes" }), activo: e.target.checked },
                      }))
                    }
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 size-4"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Aviso antes de culminar el curso
                  </span>
                </label>
                {fechaFinReferencia && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Fecha fin: {fechaFinReferencia}
                  </span>
                )}
              </div>

              {config.fin?.activo && (
                <div className="pl-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Modalidad de aviso:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((c) => ({
                            ...c,
                            fin: { ...(c.fin ?? {}), activo: true, modo: "dias_antes" },
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          config.fin?.modo === "dias_antes"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Días antes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((c) => ({
                            ...c,
                            fin: { ...(c.fin ?? {}), activo: true, modo: "fecha_fija" },
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          config.fin?.modo === "fecha_fija"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Fecha exacta
                      </button>
                    </div>
                  </div>

                  {config.fin?.modo === "dias_antes" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Avisar</span>
                      <DaysInput
                        min={1}
                        max={30}
                        defaultVal={3}
                        value={config.fin?.dias_antes}
                        onChange={(dias) =>
                          updateConfig((c) => ({
                            ...c,
                            fin: { ...(c.fin ?? {}), activo: true, modo: "dias_antes", dias_antes: dias },
                          }))
                        }
                      />
                      <span className="text-xs text-slate-600">días antes de la fecha final del curso.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Avisar a partir de:</span>
                      <input
                        type="date"
                        value={config.fin?.fecha ?? ""}
                        onChange={(e) =>
                          updateConfig((c) => ({
                            ...c,
                            fin: { ...(c.fin ?? {}), activo: true, modo: "fecha_fija", fecha: e.target.value },
                          }))
                        }
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Emisión de Certificados (Solo Cursos) */}
          {tipo === "curso" && (
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.certificados?.activo ?? true}
                    onChange={(e) =>
                      updateConfig((c) => ({
                        ...c,
                        certificados: {
                          ...(c.certificados ?? { modo: "dias_despues", dias: 0 }),
                          activo: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 size-4"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      Alertar emisión de certificados pendientes
                    </span>
                    <p className="text-xs text-slate-500">
                      Notificar a secretaría cuando deban emitirse los certificados de estudiantes aprobados.
                    </p>
                  </div>
                </label>
              </div>

              {config.certificados?.activo && (
                <div className="pl-6 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500">Modalidad de aviso:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((c) => ({
                            ...c,
                            certificados: { ...(c.certificados ?? {}), activo: true, modo: "dias_despues" },
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          (config.certificados?.modo ?? "dias_despues") === "dias_despues"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Días después de fin
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((c) => ({
                            ...c,
                            certificados: { ...(c.certificados ?? {}), activo: true, modo: "dias_antes" },
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          config.certificados?.modo === "dias_antes"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Días antes de fin
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig((c) => ({
                            ...c,
                            certificados: { ...(c.certificados ?? {}), activo: true, modo: "fecha_fija" },
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          config.certificados?.modo === "fecha_fija"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Fecha exacta
                      </button>
                    </div>
                  </div>

                  {config.certificados?.modo === "fecha_fija" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Avisar a partir de:</span>
                      <input
                        type="date"
                        value={config.certificados?.fecha ?? ""}
                        onChange={(e) =>
                          updateConfig((c) => ({
                            ...c,
                            certificados: {
                              ...(c.certificados ?? {}),
                              activo: true,
                              modo: "fecha_fija",
                              fecha: e.target.value,
                            },
                          }))
                        }
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  ) : config.certificados?.modo === "dias_antes" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Avisar</span>
                      <DaysInput
                        min={0}
                        max={30}
                        defaultVal={3}
                        value={config.certificados?.dias}
                        onChange={(dias) =>
                          updateConfig((c) => ({
                            ...c,
                            certificados: {
                              ...(c.certificados ?? {}),
                              activo: true,
                              modo: "dias_antes",
                              dias,
                            },
                          }))
                        }
                      />
                      <span className="text-xs text-slate-600">
                        días antes de la fecha final del curso (preparación anticipada).
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Avisar</span>
                      <DaysInput
                        min={0}
                        max={60}
                        defaultVal={0}
                        value={config.certificados?.dias}
                        onChange={(dias) =>
                          updateConfig((c) => ({
                            ...c,
                            certificados: {
                              ...(c.certificados ?? {}),
                              activo: true,
                              modo: "dias_despues",
                              dias,
                            },
                          }))
                        }
                      />
                      <span className="text-xs text-slate-600">
                        {Number(config.certificados?.dias ?? 0) === 0
                          ? "días (el mismo día que finaliza el curso)."
                          : "días después de que finalice el curso."}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
