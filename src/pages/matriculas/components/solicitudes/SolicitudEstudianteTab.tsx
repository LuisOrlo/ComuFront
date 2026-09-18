/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  SearchIcon,
  Calendar03Icon,
  MailIcon,
  CallIcon,
  Location01Icon,
  GraduationCapIcon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  Edit01Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons"
import { EF } from "../../AprobacionHelpers"
import { CiudadBadge } from "../../../estudiantes/components/Badges"
import { toast } from "sonner"

interface SolicitudEstudianteTabProps {
  selected: any
  editField: string | null
  editVal: string
  startEdit: (field: string, value: string) => void
  setEditVal: (value: string) => void
  saveEdit: () => void
  cancelEdit: () => void
  savingEdit: boolean
}

export function SolicitudEstudianteTab({
  selected,
  editField,
  editVal,
  startEdit,
  setEditVal,
  saveEdit,
  cancelEdit,
  savingEdit,
}: SolicitudEstudianteTabProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === "—") return
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    toast.success(`${label} copiado al portapapeles`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const datos = selected.solicitante?.datos || {}
  const celularLimpio = (datos.celular || datos.telefono || "").replace(/\D/g, "")

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Datos del estudiante
          </h2>
         
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            Haz clic en <HugeiconsIcon icon={Edit01Icon} size={13} className="inline mx-0.5 text-[#fd761a]" /> para editar cualquier campo
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Información Personal */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800">
            <HugeiconsIcon icon={UserIcon} size={18} className="text-[#fd761a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Información personal
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-sm">
            <EF
              icon={UserIcon}
              label="Nombres"
              field="nombres"
              data={datos}
              editField={editField}
              editVal={editVal}
              onEdit={startEdit}
              onChange={setEditVal}
              onSave={saveEdit}
              onCancel={cancelEdit}
              saving={savingEdit}
            />
            <EF
              icon={UserIcon}
              label="Apellidos"
              field="apellidos"
              data={datos}
              editField={editField}
              editVal={editVal}
              onEdit={startEdit}
              onChange={setEditVal}
              onSave={saveEdit}
              onCancel={cancelEdit}
              saving={savingEdit}
            />
            <div className="relative group">
              <EF
                icon={SearchIcon}
                label="Cédula de Identidad"
                field="cedula"
                data={datos}
                bold
                editField={editField}
                editVal={editVal}
                onEdit={startEdit}
                onChange={setEditVal}
                onSave={saveEdit}
                onCancel={cancelEdit}
                saving={savingEdit}
              />
              {datos.cedula && editField !== "cedula" && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(datos.cedula, "Cédula")}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#fd761a] transition-colors p-1 cursor-pointer"
                  title="Copiar cédula"
                >
                  <HugeiconsIcon icon={copiedField === "Cédula" ? CheckmarkCircle02Icon : Copy01Icon} size={14} />
                </button>
              )}
            </div>
            <EF
              icon={Calendar03Icon}
              label="Edad"
              field="edad"
              data={datos}
              editField={editField}
              editVal={editVal}
              onEdit={startEdit}
              onChange={setEditVal}
              onSave={saveEdit}
              onCancel={cancelEdit}
              saving={savingEdit}
              inputType="number"
            />
            <EF
              icon={UserIcon}
              label="Ocupación"
              field="ocupacion"
              data={datos}
              editField={editField}
              editVal={editVal}
              onEdit={startEdit}
              onChange={setEditVal}
              onSave={saveEdit}
              onCancel={cancelEdit}
              saving={savingEdit}
            />
            <EF
              icon={UserIcon}
              label="Estado Civil"
              field="estado_civil"
              data={datos}
              editField={editField}
              editVal={editVal}
              onEdit={startEdit}
              onChange={setEditVal}
              onSave={saveEdit}
              onCancel={cancelEdit}
              saving={savingEdit}
            />
            <div className="sm:col-span-2">
              <EF
                icon={GraduationCapIcon}
                label="Nivel Educativo"
                field="nivel_educativo"
                data={datos}
                editField={editField}
                editVal={editVal}
                onEdit={startEdit}
                onChange={setEditVal}
                onSave={saveEdit}
                onCancel={cancelEdit}
                saving={savingEdit}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contacto */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-slate-800">
            <HugeiconsIcon icon={CallIcon} size={18} className="text-[#fd761a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Contacto
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-sm">
            <div className="relative group">
              <EF
                icon={MailIcon}
                label="Correo electrónico"
                field="correo"
                data={datos}
                editField={editField}
                editVal={editVal}
                onEdit={startEdit}
                onChange={setEditVal}
                onSave={saveEdit}
                onCancel={cancelEdit}
                saving={savingEdit}
              />
              {datos.correo && editField !== "correo" && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(datos.correo, "Correo")}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#fd761a] transition-colors p-1 cursor-pointer"
                  title="Copiar correo"
                >
                  <HugeiconsIcon icon={copiedField === "Correo" ? CheckmarkCircle02Icon : Copy01Icon} size={14} />
                </button>
              )}
            </div>

            <div className="relative group flex items-center justify-between">
              <div className="flex-1">
                <EF
                  icon={CallIcon}
                  label="Teléfono celular"
                  field="celular"
                  data={datos}
                  editField={editField}
                  editVal={editVal}
                  onEdit={startEdit}
                  onChange={setEditVal}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  saving={savingEdit}
                />
              </div>
              {celularLimpio && editField !== "celular" && (
                <div className="flex items-center gap-1.5 pr-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(datos.celular, "Teléfono")}
                    className="text-slate-400 hover:text-[#fd761a] transition-colors p-1 cursor-pointer"
                    title="Copiar teléfono"
                  >
                    <HugeiconsIcon icon={copiedField === "Teléfono" ? CheckmarkCircle02Icon : Copy01Icon} size={14} />
                  </button>
                  <a
                    href={`https://wa.me/${celularLimpio.startsWith("593") ? celularLimpio : `593${celularLimpio.replace(/^0/, "")}`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors shadow-xs"
                    title="Abrir chat de WhatsApp"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Ubicación */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-slate-800">
            <HugeiconsIcon icon={Location01Icon} size={18} className="text-[#fd761a]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ubicación
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-sm">
            <EF
              icon={Location01Icon}
              label="Dirección"
              field="direccion"
              data={datos}
              editField={editField}
              editVal={editVal}
              onEdit={startEdit}
              onChange={setEditVal}
              onSave={saveEdit}
              onCancel={cancelEdit}
              saving={savingEdit}
            />
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={MapsLocation01Icon} size={16} className="text-[#fd761a]" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ciudad</span>
              </div>
              <div className="flex items-center gap-2">
                <CiudadBadge ciudad={datos.ciudad} />
                <button
                  type="button"
                  onClick={() => startEdit("ciudad", datos.ciudad || "")}
                  className="text-slate-400 hover:text-[#fd761a] p-1 transition-colors"
                  title="Editar ciudad"
                >
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
