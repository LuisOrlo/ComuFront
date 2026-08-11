/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserIcon, SearchIcon, Calendar03Icon, MailIcon, CallIcon, Location01Icon } from "@hugeicons/core-free-icons"
import { Section, SubCategory, EF } from "../../AprobacionHelpers"

interface TallerParticipanteTabProps {
  selected: any
  editField: string | null
  editVal: string
  startEdit: (field: string, value: string) => void
  setEditVal: (value: string) => void
  saveEdit: () => void
  cancelEdit: () => void
  savingEdit: boolean
}

export function TallerParticipanteTab({ selected, editField, editVal, startEdit, setEditVal, saveEdit, cancelEdit, savingEdit }: TallerParticipanteTabProps) {
  return (
    <Section title="Datos del Participante" icon={UserIcon}>
      <div className="space-y-3">
        <SubCategory title="Información Personal">
          <EF icon={UserIcon} label="Nombres" field="nombres" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
          <EF icon={UserIcon} label="Apellidos" field="apellidos" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
          <EF icon={SearchIcon} label="Cédula" field="cedula" data={selected} bold
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
          <EF icon={Calendar03Icon} label="Edad" field="edad" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} inputType="number" />
          <EF icon={UserIcon} label="Ocupación" field="ocupacion" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
          <EF icon={UserIcon} label="Estado Civil" field="estado_civil" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
        </SubCategory>
        <SubCategory title="Contacto">
          <EF icon={MailIcon} label="Correo" field="correo" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
          <EF icon={CallIcon} label="Teléfono" field="telefono" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
        </SubCategory>
        <SubCategory title="Ubicación">
          <EF icon={Location01Icon} label="Dirección" field="direccion" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
          <EF icon={Location01Icon} label="Ciudad" field="ciudad" data={selected}
            editField={editField} editVal={editVal} onEdit={startEdit} onChange={setEditVal} onSave={saveEdit} onCancel={cancelEdit} saving={savingEdit} />
        </SubCategory>
      </div>
    </Section>
  )
}
