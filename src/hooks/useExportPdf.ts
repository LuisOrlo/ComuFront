import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { EstadisticasResponse } from "@/types/estadisticas"

const money = (value: number) => `$${Number(value || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`

export async function exportarEstadisticasPDF(data: EstadisticasResponse): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4")
  const margin = 14
  const title = "Informe de estadísticas financieras"
  const period = `${data.periodo.desde} al ${data.periodo.hasta}`
  pdf.setFillColor(20, 34, 53); pdf.rect(0, 0, 210, 31, "F")
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(17); pdf.text(title, margin, 15)
  pdf.setFontSize(9); pdf.text(`Período: ${period}`, margin, 22); pdf.text(`Generado: ${new Date().toLocaleDateString("es-EC")}`, margin, 27)
  pdf.setTextColor(30, 41, 59)
  autoTable(pdf, { startY: 38, theme: "grid", head: [["Ingresos cobrados", "Egresos registrados", "Resultado neto", "Margen neto", "Matrículas del período"]], body: [[money(data.metricas.ingresos), money(data.metricas.egresos), money(data.metricas.balance), `${data.metricas.margen_neto}%`, String(data.metricas.estudiantes_matriculados)]], styles: { fontSize: 8.5, halign: "center" }, headStyles: { fillColor: [20, 34, 53] } })
  const section = (name: string, description?: string) => { const y = (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 45; const top = y > 248 ? (pdf.addPage(), 16) : y + 12; pdf.setFontSize(11); pdf.setTextColor(20, 34, 53); pdf.text(name, margin, top); if (description) { pdf.setFontSize(7.5); pdf.setTextColor(100, 110, 125); pdf.text(description, margin, top + 4); return top + 7 } return top + 4 }
  if (data.ingresos_vs_egresos.length > 0) autoTable(pdf, { startY: section("Evolución de ingresos y egresos", "Movimientos registrados dentro del período seleccionado."), head: [["Mes", "Ingresos cobrados", "Egresos", "Resultado neto"]], body: data.ingresos_vs_egresos.map(item => [item.mes, money(item.ingresos), money(item.egresos), money(item.ingresos - item.egresos)]), styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } })
  if (data.distribucion_categorias.length > 0) autoTable(pdf, { startY: section("Origen de los ingresos", "Distribución de cobros verificados por línea de negocio."), head: [["Línea de negocio", "Ingreso cobrado", "Participación"]], body: data.distribucion_categorias.map(item => [item.name, money(item.value), `${item.porcentaje}%`]), styles: { fontSize: 8 }, headStyles: { fillColor: [22, 163, 74] } })
  if (data.metodo_pago.length > 0) autoTable(pdf, { startY: section("Cómo se realizaron los cobros"), head: [["Método de pago", "Ingreso cobrado"]], body: data.metodo_pago.map(item => [item.name.charAt(0).toUpperCase() + item.name.slice(1), money(item.value)]), styles: { fontSize: 8 }, headStyles: { fillColor: [8, 145, 178] } })
  if (data.catalogos_top.length > 0) autoTable(pdf, { startY: section("Rendimiento académico por catálogo", "Solo se muestran catálogos con ofertas durante el período."), head: [["Catálogo", "Ofertas", "Estudiantes", "Ocupación", "Aprobación", "Ingresos"]], body: data.catalogos_top.map(item => [item.nombre, item.ofertas, item.estudiantes, `${item.ocupacion_pct}%`, `${item.aprobacion_pct}%`, money(item.ingreso)]), styles: { fontSize: 7.5 }, headStyles: { fillColor: [124, 58, 237] } })
  autoTable(pdf, { startY: section("Estado de cobranza", "Deuda pendiente de estudiantes con matrícula dentro del período."), head: [["Indicador", "Estudiantes"]], body: [["Con al menos un pago pendiente", data.cobranza.deben_al_menos_un_pago], ["Con todos sus pagos pendientes", data.cobranza.deben_todos_los_pagos]], styles: { fontSize: 8 }, headStyles: { fillColor: [234, 88, 12] } })
  if (data.actividad_servicios.length > 0) autoTable(pdf, { startY: section("Servicios", "Los ingresos corresponden a cobros recibidos en el período; la cantidad refleja servicios con fecha registrada en el período."), head: [["Servicio", "Servicios registrados", "Ingresos cobrados"]], body: data.actividad_servicios.map(item => [item.tipo, item.cantidad > 0 ? item.cantidad : "Sin registro en el período", money(item.ingresos)]), styles: { fontSize: 8 }, headStyles: { fillColor: [168, 85, 247] } })
  const pages = pdf.getNumberOfPages(); for (let page = 1; page <= pages; page++) { pdf.setPage(page); pdf.setFontSize(8); pdf.setTextColor(110, 120, 135); pdf.text(`${title} · ${period}`, margin, 290); pdf.text(`Página ${page} de ${pages}`, 196, 290, { align: "right" }) }
  pdf.save(`estadisticas_${data.periodo.desde}_a_${data.periodo.hasta}.pdf`)
}
