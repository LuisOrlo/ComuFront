import type { Estudiante } from "@/services/estudiantes.service"

interface InfoTabContentProps {
  data: Estudiante | null
  loading: boolean
}

export function InfoTabContent({ data, loading }: InfoTabContentProps) {
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin size-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando informacion del estudiante...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No se encontro informacion del estudiante.</p>
      </div>
    )
  }

  const perfil = data.perfil_estudiante

  const rows = [
    { label: "Nombres", value: data.nombres },
    { label: "Apellidos", value: data.apellidos },
    { label: "Cedula", value: data.cedula || '—' },
    { label: "Correo", value: data.correo || '—' },
    { label: "Celular", value: data.celular || '—' },
  ]

  const perfilRows = perfil ? [
    { label: "Fecha de Nacimiento", value: perfil.fecha_nacimiento?.split('-').reverse().join('/') || '—' },
    { label: "Primera Matricula", value: perfil.primera_matricula?.split('-').reverse().join('/') || '—' },
    { label: "Ultima Matricula", value: perfil.ultima_matricula?.split('-').reverse().join('/') || '—' },
    { label: "Total Cursos", value: String(perfil.total_cursos || data.total_cursos || 0) },
    { label: "Notas Internas", value: perfil.notas_internas || '—', full: true },
  ] : []

  const fechasRows = [
    { label: "Registrado", value: data.creado_en ? new Date(data.creado_en).toLocaleString('es-ES') : (perfil?.primera_matricula ? new Date(perfil.primera_matricula + 'T12:00:00').toLocaleString('es-ES') : '—') },
    { label: "Ultima actualizacion", value: data.actualizado_en ? new Date(data.actualizado_en).toLocaleString('es-ES') : '—' },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Datos Personales</h3>
          <div className="divide-y divide-gray-50">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className="font-bold text-gray-800 text-right ml-4">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {perfilRows.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Perfil Academico</h3>
            <div className="divide-y divide-gray-50">
              {perfilRows.map((row) => (
                <div key={row.label} className={`flex justify-between py-2.5 text-sm ${row.full ? 'flex-col' : ''}`}>
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`font-bold text-gray-800 ${row.full ? '' : 'text-right ml-4'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Metadatos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          {fechasRows.map((row) => (
            <div key={row.label} className="flex justify-between py-2.5 text-sm">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-bold text-gray-800 text-right ml-4">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
