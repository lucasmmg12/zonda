/**
 * Utilidades de exportación real a CSV (compatible con Excel en español con BOM UTF-8)
 * y generación de reportes imprimibles / PDF.
 */

export function exportToExcelCsv(
  filename: string,
  headersOrObjects: string[] | Record<string, string | number>[],
  optionalRows?: (string | number)[][]
) {
  let headers: string[] = [];
  let rows: (string | number)[][] = [];

  if (optionalRows) {
    headers = headersOrObjects as string[];
    rows = optionalRows;
  } else {
    const objs = headersOrObjects as Record<string, string | number>[];
    if (objs.length > 0) {
      headers = Object.keys(objs[0]);
      rows = objs.map((obj) => headers.map((k) => obj[k] ?? ''));
    } else {
      headers = ['Sin datos'];
      rows = [];
    }
  }

  const separator = ';';
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(separator),
    ...rows.map((row) => row.map(escapeCell).join(separator))
  ].join('\r\n');

  // BOM UTF-8 para que Microsoft Excel reconozca acentos y caracteres especiales automáticamente
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printFinancialReport(title: string, subtitle: string, headers: string[], rows: (string | number)[][]) {
  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) {
    window.print();
    return;
  }

  const tableRowsHtml = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (cell, i) =>
              `<td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 11px; text-align: ${
                i >= headers.length - 3 && typeof cell === 'string' && (cell.startsWith('$') || cell.startsWith('-'))
                  ? 'right'
                  : 'left'
              };">${cell}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #0f172a; margin: 24px; }
    .header { border-bottom: 2px solid #005696; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 18px; margin: 0; text-transform: uppercase; color: #0f172a; }
    p { font-size: 12px; color: #475569; margin: 4px 0 0 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <strong>Fecha de Emisión:</strong> ${new Date().toLocaleString('es-AR')}
    </div>
  </div>
  <div class="no-print" style="margin-bottom: 12px;">
    <button onclick="window.print()" style="padding: 6px 14px; background: #005696; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
      Imprimir / Guardar como PDF
    </button>
  </div>
  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
