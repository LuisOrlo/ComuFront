import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cursosPersonalizadosService, type CursoPersonalizado, type CursoPersonalizadoEstudiante, type FinanzasCursoPersonalizado } from "@/services/cursosPersonalizados.service"

const money = (value: number) => "$" + Number(value || 0).toFixed(2)
const financeLabel: Record<string, string> = { pagado: "Pagado", abonado: "Abonado", pendiente: "Pendiente", anulado: "Anulado" }

export function CursoPersonalizadoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CursoPersonalizado | null>(null)
  const [students, setStudents] = useState<CursoPersonalizadoEstudiante[]>([])
  const [finance, setFinance] = useState<FinanzasCursoPersonalizado | null>(null)
  const [tab, setTab] = useState<"resumen" | "estudiantes" | "finanzas">("resumen")
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!id) return
    setLoading(true)
    cursosPersonalizadosService.obtener(id).then(result => {
      setCourse(result.data); setStudents(result.estudiantes || []); setFinance(result.finanzas)
    }).catch(() => toast.error("No se pudo cargar el curso")).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const remove = async () => {
    if (!id || !window.confirm("¿Eliminar este curso personalizado?")) return
    try { await cursosPersonalizadosService.eliminar(id); toast.success("Curso eliminado"); navigate("/cursos-personalizados") }
    catch { toast.error("El curso no se puede eliminar si tiene matrículas asociadas") }
  }
  if (loading) return <div className="p-10 text-center text-sm text-gray-500">Cargando detalle...</div>
  if (!course) return <div className="p-10 text-center text-sm text-gray-500">Curso no encontrado</div>

  const tabs = [{ key: "resumen", label: "Resumen" }, { key: "estudiantes", label: "Estudiantes (" + students.length + ")" }, { key: "finanzas", label: "Finanzas" }] as const
  return <div className="mx-auto max-w-6xl px-6 py-8">
    <button onClick={() => navigate("/cursos-personalizados")} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"><ArrowLeft size={16} />Volver al listado</button>
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start">
      <div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Curso personalizado</span><h1 className="mt-3 text-3xl font-bold text-slate-800">{course.nombre}</h1><p className="mt-2 text-sm text-gray-500">{course.descripcion || "Sin descripción registrada."}</p></div>
      <div className="flex gap-2"><button onClick={() => navigate("/cursos-personalizados/" + id + "/editar")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Edit size={15} />Editar</button><button onClick={remove} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={15} />Eliminar</button></div>
    </div>
    <div className="mb-6 flex gap-1 overflow-x-auto border-b">{tabs.map(item => <button key={item.key} onClick={() => setTab(item.key)} className={"border-b-2 px-4 py-3 text-sm font-semibold " + (tab === item.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-blue-600")}>{item.label}</button>)}</div>
    {tab === "resumen" && <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="mb-5 font-bold text-slate-800">Información del curso</h2><dl className="space-y-4 text-sm"><div><dt className="text-gray-500">Docente</dt><dd className="font-medium">{course.docente ? course.docente.nombres + " " + course.docente.apellidos : "Sin docente"}</dd></div><div><dt className="text-gray-500">Modalidad</dt><dd className="font-medium">{course.modalidad}{course.ciudad ? " · " + course.ciudad : ""}</dd></div><div><dt className="text-gray-500">Periodo</dt><dd className="font-medium">{course.fecha_inicio?.slice(0, 10)} — {course.fecha_fin?.slice(0, 10)}</dd></div><div><dt className="text-gray-500">Horario</dt><dd className="font-medium">{course.hora_inicio || "—"} — {course.hora_fin || "—"}</dd></div></dl></section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="mb-5 font-bold text-slate-800">Cupos y precio</h2><div className="grid grid-cols-2 gap-4"><div className="rounded-xl bg-blue-50 p-4"><p className="text-xs text-gray-500">Matriculados</p><p className="mt-1 text-2xl font-bold text-blue-700">{course.matriculados}</p></div><div className="rounded-xl bg-green-50 p-4"><p className="text-xs text-gray-500">Disponibles</p><p className="mt-1 text-2xl font-bold text-green-700">{course.cupos_disponibles}</p></div><div><p className="text-xs text-gray-500">Capacidad</p><p className="font-semibold">{course.capacidad}</p></div><div><p className="text-xs text-gray-500">Precio</p><p className="font-semibold">{money(course.precio_total)}</p></div></div></section>
    </div>}
    {tab === "estudiantes" && <StudentTable students={students} />}
    {tab === "finanzas" && <FinancePanel finance={finance} students={students} />}
  </div>
}

function StudentTable({ students }: { students: CursoPersonalizadoEstudiante[] }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-bold text-slate-800">Estudiantes matriculados</h2><p className="mt-1 text-sm text-gray-500">Registros con matrícula asociada; se distingue su estado actual.</p></div>{students.length === 0 ? <p className="p-10 text-center text-sm text-gray-500">No hay estudiantes matriculados.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Identificación</th><th className="px-5 py-3">Matrícula</th><th className="px-5 py-3">Pagado</th><th className="px-5 py-3">Saldo</th><th className="px-5 py-3">Finanzas</th></tr></thead><tbody className="divide-y">{students.map(row => <tr key={row.matricula_id}><td className="px-5 py-4 font-medium">{row.estudiante?.nombre || "—"}<span className="block text-xs font-normal text-gray-500">{row.estudiante?.correo || ""}</span></td><td className="px-5 py-4">{row.estudiante?.identificacion || "—"}</td><td className="px-5 py-4 capitalize">{row.estado_matricula}</td><td className="px-5 py-4">{money(row.monto_pagado)}</td><td className="px-5 py-4">{money(row.saldo_pendiente)}</td><td className="px-5 py-4"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{financeLabel[row.estado_financiero || ""] || "Sin cuenta"}</span></td></tr>)}</tbody></table></div>}</section>
}

function FinancePanel({ finance, students }: { finance: FinanzasCursoPersonalizado | null; students: CursoPersonalizadoEstudiante[] }) {
  if (!finance) return <p className="text-sm text-gray-500">No hay información financiera.</p>
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Total esperado", money(finance.total_esperado)], ["Total abonado", money(finance.total_abonado)], ["Saldo pendiente", money(finance.saldo_pendiente)], ["Precio por estudiante", money(finance.precio_por_estudiante)]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-800">{value}</p></div>)}</div><div className="grid gap-4 sm:grid-cols-3">{[["Pagadas", finance.cuentas_pagadas], ["Abonadas", finance.cuentas_abonadas], ["Pendientes", finance.cuentas_pendientes]].map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 p-4 text-sm"><span className="text-gray-500">{label}</span><strong className="ml-2 text-slate-800">{value}</strong></div>)}</div><StudentTable students={students} /></div>
}
