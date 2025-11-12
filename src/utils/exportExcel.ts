// Support Vite + ESM import for sheetjs
import * as XLSX from 'xlsx';

export function exportToExcel<T extends object>(data: T[], filename: string) {
  const rows = Array.isArray(data) ? data : [];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const safe = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safe);
}