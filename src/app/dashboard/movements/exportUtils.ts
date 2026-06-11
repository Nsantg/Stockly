import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Movement } from './types';

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hh}:${mm}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function userName(u: { nombre: string; apellido: string } | null | undefined): string {
  return u ? `${u.nombre} ${u.apellido}` : '—';
}

export function exportToExcel(movements: Movement[]): void {
  const rows = movements.map((m) => ({
    Fecha: fmtDate(m.date),
    Tipo: m.type,
    Producto: m.product?.name ?? '—',
    'Código': m.product?.code ?? '—',
    Cantidad: m.quantity,
    Usuario: userName(m.user),
    Estado: m.isAnnulled ? 'Anulado' : 'Activo',
    Observaciones: m.observations ?? '—',
    Cliente: m.client?.name ?? '—',
    'Tipo Cliente': m.clientType ?? '—',
    'Peso Total (kg)': m.totalWeight ?? '—',
    'Causa Devolución': m.returnCause ?? '—',
    'Motivo Anulación': m.annulledReason ?? '—',
    'Fecha Anulación': fmtDate(m.annulledAt),
    'Anulado por': userName(m.annulledBy),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, `historial-movimientos-${todayStr()}.xlsx`);
}

export function exportToPdf(movements: Movement[]): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const brand = '#1B3B6F';
  const gray = '#6B7280';

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brand);
  doc.text('STOCKLY — Historial de Movimientos', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(gray);
  const now = new Date().toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Generado el ${now}`, 14, 22);

  doc.setDrawColor('#E5E3DC');
  doc.line(14, 26, 283, 26);

  const body = movements.map((m) => [
    fmtDate(m.date),
    m.type,
    m.product?.name ?? '—',
    String(m.quantity),
    userName(m.user),
    m.isAnnulled ? 'Anulado' : 'Activo',
    (m.observations ?? '—').slice(0, 40),
    m.client?.name ?? '—',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Fecha', 'Tipo', 'Producto', 'Cant.', 'Usuario', 'Estado', 'Observaciones', 'Cliente']],
    body,
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 45 },
      3: { cellWidth: 15 },
      4: { cellWidth: 35 },
      5: { cellWidth: 18 },
      6: { cellWidth: 50 },
      7: { cellWidth: 35 },
    },
    headStyles: {
      fillColor: brand,
      textColor: '#FFFFFF',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: '#F5F4F0',
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const mov = movements[data.row.index];
        if (mov?.isAnnulled) {
          data.cell.styles.textColor = '#DC2626';
        }
      }
    },
    didDrawPage: (data) => {
      const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(7);
      doc.setTextColor(gray);
      doc.text(
        `Stockly — Página ${currentPage} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' },
      );
    },
  });

  doc.save(`historial-movimientos-${todayStr()}.pdf`);
}
