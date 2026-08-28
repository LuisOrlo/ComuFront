/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type AnyRecord = Record<string, any>

const PRIMARY: [number, number, number] = [31, 41, 55]
const ACCENT: [number, number, number] = [232, 148, 0]
const MUTED: [number, number, number] = [107, 114, 128]
const BORDER: [number, number, number] = [229, 231, 235]

const money = (value: unknown) => `$${Number(value || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const date = () => new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })
const safeName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase()

function footer(pdf: jsPDF, title: string) {
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(...BORDER)
    pdf.line(14, 285, 196, 285)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setTextColor(...MUTED)
    pdf.text(`${title} · Generado el ${date()}`, 14, 291)
    pdf.text(`Página ${page} de ${pages}`, 196, 291, { align: "right" })
  }
}

function header(pdf: jsPDF, title: string, subtitle: string) {
  pdf.setFillColor(...PRIMARY)
  pdf.rect(0, 0, 210, 30, "F")
  pdf.setTextColor(255, 255, 255)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.text(title, 14, 14)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  pdf.text(subtitle, 14, 22)
}

function summary(pdf: jsPDF, y: number, total: number, paid: number, pending: number) {
  autoTable(pdf, {
    startY: y,
    head: [["Total esperado", "Total abonado", "Saldo pendiente"]],
    body: [[money(total), money(paid), money(pending)]],
    theme: "grid",
    styles: { fontSize: 9, halign: "center", cellPadding: 4, textColor: PRIMARY },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  })
}

function nextY(pdf: jsPDF) {
  return ((pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 40) + 10
}

export function generarCuentaCursoPDF(data: AnyRecord) {
  const curso = data?.curso || {}
  const estudiantes = Array.isArray(data?.estudiantes) ? data.estudiantes : []
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const title = "Reporte financiero de curso"
  header(pdf, title, `${curso.nombre_instancia || curso.nombre || "Curso"} · Generado el ${date()}`)

  const rows = estudiantes.map((student: AnyRecord, index: number) => {
    const modules = Object.values(student.modulos || student.lineas_pago_modulo || {}) as AnyRecord[]
    const inscription = student.inscripcion || {}
    const total = modules.reduce((sum, item) => sum + Number(item.precio ?? item.monto_ajustado ?? 0), 0) + Number(inscription.monto_ajustado || 0)
    const paid = modules.reduce((sum, item) => sum + Number(item.abonado ?? item.monto_abonado ?? 0), 0) + Number(inscription.monto_abonado || 0)
    return [index + 1, student.nombre || `${student.apellidos || ""} ${student.nombres || ""}`.trim() || "—", student.cedula || "—", money(total), money(paid), money(Math.max(0, total - paid)), total > 0 ? `${Math.round((paid / total) * 100)}%` : "0%"]
  })
  const totals = {
    total: Number(data?.totales?.esperado_catalogo ?? estudiantes.reduce((sum: number, student: AnyRecord) => {
      const modules = Object.values(student.modulos || student.lineas_pago_modulo || {}) as AnyRecord[]
      return sum + modules.reduce((inner, item) => inner + Number(item.precio ?? item.monto_ajustado ?? 0), 0) + Number(student.inscripcion?.monto_ajustado || 0)
    }, 0)),
    paid: Number(data?.totales?.recaudado_real ?? estudiantes.reduce((sum: number, student: AnyRecord) => sum + Number(student.total_pagado || 0), 0)),
  }
  summary(pdf, 38, totals.total, totals.paid, Math.max(0, totals.total - totals.paid))
  autoTable(pdf, {
    startY: nextY(pdf),
    head: [["N°", "Estudiante", "Cédula", "Total esperado", "Abonado", "Pendiente", "% pagado"]],
    body: rows,
    theme: "grid",
    margin: { left: 14, right: 14, bottom: 16 },
    styles: { fontSize: 8, cellPadding: 3, textColor: PRIMARY, lineColor: BORDER, lineWidth: 0.15 },
    headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], halign: "center" },
    columnStyles: { 0: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 28 }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "center" } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  })
  footer(pdf, title)
  pdf.save(`cuentas-${safeName(curso.nombre_instancia || curso.nombre || "curso")}.pdf`)
}

export function generarCuentaTallerPDF(data: AnyRecord) {
  const taller = data?.taller || {}
  const participants = Array.isArray(data?.participantes) ? data.participantes : []
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const title = "Reporte financiero de taller"
  header(pdf, title, `${taller.nombre || "Taller"} · Generado el ${date()}`)
  const rows = participants.map((p: AnyRecord, index: number) => [index + 1, p.estudiante_nombre || `${p.nombres || ""} ${p.apellidos || ""}`.trim() || "—", p.cedula || "—", money(p.monto_total), money(p.monto_abonado), money(p.saldo_pendiente), Number(p.saldo_pendiente || 0) <= 0 ? "Pagado" : "Pendiente"])
  const total = participants.reduce((sum: number, p: AnyRecord) => sum + Number(p.monto_total || 0), 0)
  const paid = participants.reduce((sum: number, p: AnyRecord) => sum + Number(p.monto_abonado || 0), 0)
  summary(pdf, 38, total, paid, Math.max(0, total - paid))
  autoTable(pdf, { startY: nextY(pdf), head: [["N°", "Participante", "Cédula", "Total esperado", "Abonado", "Pendiente", "Estado"]], body: rows, theme: "grid", margin: { left: 14, right: 14, bottom: 16 }, styles: { fontSize: 8, cellPadding: 3, textColor: PRIMARY, lineColor: BORDER, lineWidth: 0.15 }, headStyles: { fillColor: ACCENT, textColor: [255, 255, 255], halign: "center" }, alternateRowStyles: { fillColor: [249, 250, 251] } })
  footer(pdf, title)
  pdf.save(`cuentas-${safeName(taller.nombre || "taller")}.pdf`)
}

export function generarCuentaServicioPDF(data: AnyRecord) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const title = "Reporte de cuenta por cobrar"
  header(pdf, title, `${data.nombre || "Servicio"} · ${data.cliente || "Cliente"}`)
  summary(pdf, 38, Number(data.total || 0), Number(data.cobrado || 0), Number(data.saldo || 0))
  const transactions = Array.isArray(data.transacciones) ? data.transacciones : []
  autoTable(pdf, { startY: nextY(pdf), head: [["Fecha", "Método de pago", "Estado", "Monto"]], body: transactions.map((t: AnyRecord) => [t.fecha_pago ? new Date(t.fecha_pago).toLocaleDateString("es-EC") : "—", t.metodo_pago || "—", t.estado_verificacion === "aprobado" ? "Verificado" : t.estado_verificacion || "Pendiente", money(t.monto)]), theme: "grid", margin: { left: 14, right: 14, bottom: 16 }, styles: { fontSize: 8.5, cellPadding: 3, textColor: PRIMARY, lineColor: BORDER, lineWidth: 0.15 }, headStyles: { fillColor: ACCENT, textColor: [255, 255, 255] }, alternateRowStyles: { fillColor: [249, 250, 251] } })
  footer(pdf, title)
  pdf.save(`cuenta-${safeName(data.nombre || "servicio")}.pdf`)
}
