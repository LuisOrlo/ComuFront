import { useState } from "react"
import { usePermission } from "@/hooks/usePermission"
import type { Estudiante, AcademicProfile } from "@/services/estudiantes.service"
import { TransferCursoModal } from "@/components/estudiantes/TransferCursoModal"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserAccountIcon,
  PencilEdit01Icon,
  GraduationCapIcon,
  CheckmarkCircle02Icon,
  NoteIcon,
  Book02Icon,
  ArrowRight01Icon,
  ArrowDataTransferHorizontalIcon,
  SaveIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

interface InfoTabContentProps {
  data: Estudiante | null
  academicData: AcademicProfile | null
  loading: boolean
  academicLoading?: boolean
  onRefresh: () => void
  onUpdateInfo?: (fields: Record<string, string | number | undefined>) => Promise<void>
  onSwitchToAcademic?: () => void
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    const clean = dateStr.split("T")[0]
    const [y, m, d] = clean.split("-")
    if (y && m && d) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      return new Intl.DateTimeFormat("es-EC", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
    }
    return dateStr
  } catch {
    return dateStr
  }
}

export function InfoTabContent({
  data,
  academicData,
  loading,
  academicLoading,
  onRefresh,
  onUpdateInfo,
  onSwitchToAcademic,
}: InfoTabContentProps) {
  const { isAdmin } = usePermission()
  const [transferMatricula, setTransferMatricula] = useState<{
    id: string
    curso: string
    fecha_inscripcion: string
    promedio: number | null
    notas: Array<{ modulo: string; calificacion: number; aprobado: boolean }>
    porcentaje_asistencia: number
  } | null>(null)

  // Estados para edición de notas internas
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  // Estados para edición rápida de perfil
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [personalForm, setPersonalForm] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    edad: "",
    correo: "",
    celular: "",
    estado_civil: "",
    ocupacion: "",
    nivel_educativo: "",
    direccion: "",
    ciudad: "",
    nacionalidad: "Ecuatoriana",
  })
  const [savingPersonal, setSavingPersonal] = useState(false)

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin size-8 border-2 border-orange-200 border-t-[#fd761a] rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Cargando información del estudiante...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>No se encontró información del estudiante.</p>
      </div>
    )
  }

  const perfil = data.perfil_estudiante

  const handleStartEditNotes = () => {
    setNotesValue(perfil?.notas_internas || "")
    setEditingNotes(true)
  }

  const handleSaveNotes = async () => {
    if (!onUpdateInfo) return
    setSavingNotes(true)
    try {
      await onUpdateInfo({ notas_internas: notesValue })
      setEditingNotes(false)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleStartEditPersonal = () => {
    setPersonalForm({
      nombres: data.nombres || "",
      apellidos: data.apellidos || "",
      cedula: data.cedula || "",
      edad: perfil?.edad != null ? String(perfil.edad) : "",
      correo: data.correo || "",
      celular: data.celular || "",
      estado_civil: perfil?.estado_civil || "soltero",
      ocupacion: perfil?.ocupacion || "",
      nivel_educativo: perfil?.nivel_educativo || "educacion inicial",
      direccion: perfil?.direccion || "",
      ciudad: data.ciudad?.nombre || perfil?.ciudad || "",
      nacionalidad: "Ecuatoriana",
    })
    setEditingPersonal(true)
  }

  const handleSavePersonal = async () => {
    if (!onUpdateInfo) return
    setSavingPersonal(true)
    try {
      await onUpdateInfo({
        nombres: personalForm.nombres.trim() || undefined,
        apellidos: personalForm.apellidos.trim() || undefined,
        cedula: personalForm.cedula.trim() || undefined,
        correo: personalForm.correo.trim() || undefined,
        celular: personalForm.celular.trim() || undefined,
        edad: personalForm.edad ? parseInt(personalForm.edad, 10) : undefined,
        ocupacion: personalForm.ocupacion.trim() || undefined,
        estado_civil: personalForm.estado_civil.trim() || undefined,
        nivel_educativo: personalForm.nivel_educativo.trim() || undefined,
        direccion: personalForm.direccion.trim() || undefined,
        ciudad: personalForm.ciudad.trim() || undefined,
      })
      onRefresh()
      setEditingPersonal(false)
    } finally {
      setSavingPersonal(false)
    }
  }

  const totalCursos = data.total_cursos ?? academicData?.matriculas.length ?? 0
  const matriculasActivas = (academicData?.matriculas || []).filter(
    (m) => m.estado?.toLowerCase() === "activo"
  )

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 2-Column Grid (de code.html líneas 190-321) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna 1: Datos Personales */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={UserAccountIcon} size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Datos Personales</h3>
              </div>
              {isAdmin && !editingPersonal && (
                <button
                  type="button"
                  onClick={handleStartEditPersonal}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={13} />
                  <span>Editar</span>
                </button>
              )}
            </div>

            {editingPersonal ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      value={personalForm.nombres}
                      onChange={(e) => setPersonalForm({ ...personalForm, nombres: e.target.value })}
                      placeholder="Nombres del estudiante"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={personalForm.apellidos}
                      onChange={(e) => setPersonalForm({ ...personalForm, apellidos: e.target.value })}
                      placeholder="Apellidos del estudiante"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Cédula de Identidad
                    </label>
                    <input
                      type="text"
                      value={personalForm.cedula}
                      onChange={(e) => setPersonalForm({ ...personalForm, cedula: e.target.value })}
                      placeholder="C.I. / Pasaporte"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Edad
                    </label>
                    <input
                      type="number"
                      value={personalForm.edad}
                      onChange={(e) => setPersonalForm({ ...personalForm, edad: e.target.value })}
                      placeholder="Ej. 24"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={personalForm.correo}
                      onChange={(e) => setPersonalForm({ ...personalForm, correo: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="text"
                      value={personalForm.celular}
                      onChange={(e) => setPersonalForm({ ...personalForm, celular: e.target.value })}
                      placeholder="Ej. 0964656545"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Estado Civil
                    </label>
                    <input
                      type="text"
                      value={personalForm.estado_civil}
                      onChange={(e) => setPersonalForm({ ...personalForm, estado_civil: e.target.value })}
                      placeholder="Soltero / Casado / etc."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Ocupación
                    </label>
                    <input
                      type="text"
                      value={personalForm.ocupacion}
                      onChange={(e) => setPersonalForm({ ...personalForm, ocupacion: e.target.value })}
                      placeholder="Ej. Estudiante universitario"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nivel Educativo
                    </label>
                    <input
                      type="text"
                      value={personalForm.nivel_educativo}
                      onChange={(e) => setPersonalForm({ ...personalForm, nivel_educativo: e.target.value })}
                      placeholder="Ej. Superior en curso / Bachillerato / etc."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Dirección Domiciliaria
                    </label>
                    <input
                      type="text"
                      value={personalForm.direccion}
                      onChange={(e) => setPersonalForm({ ...personalForm, direccion: e.target.value })}
                      placeholder="Calle y número de casa"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Ciudad / Provincia
                    </label>
                    <input
                      type="text"
                      value={personalForm.ciudad}
                      onChange={(e) => setPersonalForm({ ...personalForm, ciudad: e.target.value })}
                      placeholder="Ej. Azogues / Cuenca"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nacionalidad
                    </label>
                    <input
                      type="text"
                      value={personalForm.nacionalidad}
                      onChange={(e) => setPersonalForm({ ...personalForm, nacionalidad: e.target.value })}
                      placeholder="Ej. Ecuatoriana"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#fd761a]/20 bg-white font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSavePersonal}
                    disabled={savingPersonal}
                    className="px-3 py-1.5 rounded-lg bg-[#fd761a] hover:bg-[#ea580c] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <HugeiconsIcon icon={SaveIcon} size={13} />
                    <span>{savingPersonal ? "Guardando..." : "Guardar cambios"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPersonal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nombres</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5">{data.nombres || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Apellidos</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5">{data.apellidos || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cédula de Identidad</dt>
                  <dd className="text-sm font-bold text-slate-900 mt-0.5">{data.cedula || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Edad</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                    {perfil?.edad != null ? `${perfil.edad} años` : "—"}
                  </dd>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{data.correo || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teléfono Móvil</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">{data.celular || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado Civil</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">
                    {perfil?.estado_civil || "—"}
                  </dd>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ocupación</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">{perfil?.ocupacion || "—"}</dd>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nivel Educativo</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">{perfil?.nivel_educativo || "—"}</dd>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dirección Domiciliaria</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">{perfil?.direccion || "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ciudad / Provincia</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                    {data.ciudad?.nombre || perfil?.ciudad || "—"}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nacionalidad</dt>
                  <dd className="text-sm font-semibold text-slate-800 mt-0.5">Ecuatoriana</dd>
                </div>
              </dl>
            )}
          </div>

          {!editingPersonal && isAdmin && (
            <div className="pt-4 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleStartEditPersonal}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Editar información personal
              </button>
            </div>
          )}
        </div>

        {/* Columna 2: Perfil Académico & Registro */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center">
                  <HugeiconsIcon icon={GraduationCapIcon} size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Perfil Académico & Registro</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                <span>Validado</span>
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4">
              <div className="flex flex-col">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Cursos</dt>
                <dd className="text-sm font-bold text-slate-900 mt-0.5">
                  {totalCursos} {totalCursos === 1 ? "curso registrado" : "cursos registrados"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estado en Plataforma</dt>
                <dd className="text-sm font-bold text-emerald-700 mt-0.5">
                  {data.es_activo ? "Activo y habilitado" : "Inactivo"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Primera Matrícula</dt>
                <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(perfil?.primera_matricula)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Última Matrícula</dt>
                <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(perfil?.ultima_matricula)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fecha de Registro</dt>
                <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(data.creado_en)}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Última Actualización</dt>
                <dd className="text-sm font-semibold text-slate-800 mt-0.5">
                  {formatDate(data.actualizado_en)}
                </dd>
              </div>
            </dl>

            {/* Cuadro de Notas de Coordinación Académica (de code.html líneas 302-313) */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={NoteIcon} size={15} className="text-[#fd761a]" />
                  <span>Notas de Coordinación Académica</span>
                </span>
                {isAdmin && !editingNotes && (
                  <button
                    type="button"
                    onClick={handleStartEditNotes}
                    className="text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Editar notas
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-2 mt-1">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={3}
                    placeholder="Escribe notas u observaciones para este estudiante..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="px-3 py-1 rounded-lg bg-[#fd761a] hover:bg-[#ea580c] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={SaveIcon} size={12} />
                      <span>{savingNotes ? "Guardando..." : "Guardar notas"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNotes(false)}
                      className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  {perfil?.notas_internas ? `"${perfil.notas_internas}"` : "Sin observaciones o notas internas registradas."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matrículas Activas Strip (de code.html líneas 323-362) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center">
              <HugeiconsIcon icon={Book02Icon} size={18} />
            </span>
            <h3 className="text-base font-bold text-slate-900">Matrículas Activas</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {academicLoading && !academicData
              ? "Cargando..."
              : `${matriculasActivas.length} ${matriculasActivas.length === 1 ? "curso activo actualmente" : "cursos activos actualmente"}`}
          </span>
        </div>

        {academicLoading && !academicData ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="animate-spin size-4 border-2 border-[#fd761a] border-t-transparent rounded-full" />
            <span>Cargando matrículas activas...</span>
          </div>
        ) : matriculasActivas.length > 0 ? (
          <div className="space-y-3">
            {matriculasActivas.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-xl bg-orange-100 text-[#fd761a] flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={GraduationCapIcon} size={22} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {m.curso}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ● Activo
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-semibold">
                        Presencial
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        #{m.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <span>
                        Inscrito: <strong className="text-slate-700">{formatDate(m.fecha_inscripcion)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Módulos: <strong className="text-slate-700">{(m.total_modulos ?? m.notas.length) || 0} registrados</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Asistencia:{" "}
                        <strong
                          className={
                            m.porcentaje_asistencia >= 70 ? "text-emerald-700" : "text-amber-700"
                          }
                        >
                          {m.porcentaje_asistencia}%
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onSwitchToAcademic && (
                    <button
                      type="button"
                      onClick={onSwitchToAcademic}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Ver expediente académico</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setTransferMatricula(m)}
                      className="px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#fd761a] text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={13} />
                      <span>Transferir</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-xs font-medium">
            No hay matrículas activas registradas actualmente.
          </div>
        )}
      </div>

      {transferMatricula && (
        <TransferCursoModal
          isOpen={!!transferMatricula}
          onClose={() => setTransferMatricula(null)}
          onSuccess={onRefresh}
          matricula={transferMatricula}
        />
      )}
    </div>
  )
}
