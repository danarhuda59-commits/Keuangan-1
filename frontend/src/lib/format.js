import * as XLSX from "xlsx";

const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const rpDec = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 });
const numFmt = (d) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: d });

export const safe = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) || !Number.isFinite(Number(v)) ? 0 : Number(v));
export const formatRp = (v, dec = false) => (v === null || v === undefined ? "-" : (dec ? rpDec : rp).format(safe(v)));
export const formatNum = (v, d = 2) => (v === null || v === undefined ? "-" : numFmt(d).format(safe(v)));
export const formatPct = (v) => (v === null || v === undefined ? "-" : `${numFmt(2).format(safe(v))}%`);
export const formatDate = (s) => {
  if (!s) return "-";
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};
export const formatDateTime = (s) => (s ? new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");

const iso = (d) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};
export const todayISO = () => iso(new Date());

export const PERIODS = [
  { key: "today", label: "Hari ini" }, { key: "yesterday", label: "Kemarin" }, { key: "7d", label: "7 hari" }, { key: "month", label: "Bulan ini" },
  { key: "last_month", label: "Bulan lalu" }, { key: "year", label: "Tahun ini" }, { key: "all", label: "Semua" }, { key: "custom", label: "Custom" },
];

export function periodRange(key) {
  const now = new Date();
  const t = iso(now);
  const y = new Date(now); y.setDate(y.getDate() - 1);
  const w = new Date(now); w.setDate(w.getDate() - 6);
  const ms = new Date(now.getFullYear(), now.getMonth(), 1);
  const lms = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lme = new Date(now.getFullYear(), now.getMonth(), 0);
  switch (key) {
    case "today": return { start: t, end: t };
    case "yesterday": return { start: iso(y), end: iso(y) };
    case "7d": return { start: iso(w), end: t };
    case "month": return { start: iso(ms), end: t };
    case "last_month": return { start: iso(lms), end: iso(lme) };
    case "year": return { start: `${now.getFullYear()}-01-01`, end: t };
    case "all": return { start: "", end: "" };
    default: return { start: iso(ms), end: t };
  }
}

const cellValue = (row, col) => {
  const v = col.export ? col.export(row) : typeof col.key === "function" ? col.key(row) : row[col.key];
  return v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : v;
};

export function toSheetRows(rows, columns) {
  const cols = columns.filter((c) => !c.noExport);
  return rows.map((r) => Object.fromEntries(cols.map((c) => [c.label, cellValue(r, c)])));
}

export function exportCSV(rows, columns, filename) {
  const ws = XLSX.utils.json_to_sheet(toSheetRows(rows, columns));
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportExcel(rows, columns, filename) {
  const ws = XLSX.utils.json_to_sheet(toSheetRows(rows, columns));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export const printPage = () => window.print();
