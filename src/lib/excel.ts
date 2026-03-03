import * as XLSX from 'xlsx';

export const exportToExcel = (fileName: string, sheets: { name: string, data: any[] }[]) => {
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
