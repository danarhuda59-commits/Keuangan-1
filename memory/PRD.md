# PRD — Business Finance & HPP Management System (UMKM F&B)

## Problem Statement (original, ringkas)
Aplikasi web functional untuk UMKM produksi makanan/F&B (generik): Bahasa Indonesia, Rupiah, responsif, auth, data per user/business terpisah. Alur terhubung: Bahan → Supplier → Pembelian → Stok bahan → Resep/BOM → Produksi → HPP → Stok produk → Penjualan → Laba rugi → Laporan. Resep multi-bahan dinamis tak terbatas (tabel recipe_items), konversi satuan, waste %, kemasan/tenaga kerja/overhead/lainnya (per batch / per unit / % bahan), yield, HPP batch & per unit, margin/markup, nested sub-recipe opsional, snapshot HPP historis (HPP lama tidak berubah), inventory ledger, kas multi-akun, laba rugi, cash flow, BEP, laporan lengkap + export, import CSV/Excel dengan preview, demo data + tombol hapus, validasi (qty/harga negatif, yield 0, NaN).

## Architecture
- Backend: FastAPI + MongoDB (motor). `/app/backend/core.py` (db, auth JWT+bcrypt, HPP engine `compute_hpp`, `recipe_cost` (nested), `expand_items`, inventory ledger `post_inventory`, cash ledger `post_cash`, `reverse_ref`).
- Routers: `auth.py`, `master.py` (categories, units, unit_conversions, suppliers, raw_materials, products), `recipes.py` (recipes + recipe_items collection, /hpp/calculate, /hpp/calculations), `operations.py` (production + production_items snapshot, inventory, purchases, sales, expenses, /meta), `finance.py` (cash_accounts, cash_transactions, dashboard, reports/*, bep, audit-logs), `settings_router.py` (business, users, upload via Emergent Object Storage, backup/restore JSON, import template/preview/commit, demo seed/delete).
- Collections: users, businesses, categories, units, unit_conversions, suppliers, raw_materials, material_price_history, products, recipes, recipe_items, production_orders, production_items, inventory_transactions, purchases (items embedded), sales (items embedded), expenses, cash_accounts, cash_transactions, channels, bep_calculations, hpp_calculations, audit_logs, counters, files, login_attempts. Semua doc punya `business_id`; soft delete via `is_deleted`; demo via `is_demo`.
- Frontend: React 19 + Tailwind + shadcn, recharts, xlsx (export CSV/Excel), sonner. `lib/hpp.js` mirror formula realtime; `components/RecipeEditor.jsx` (TAMBAH BAHAN dinamis, reorder, waste, extra cost, ringkasan); pages: Dashboard, MasterData, Recipes, HppCalculator, Production, Stock, Transactions (Purchases/Sales/Expenses), Finance (Cash/ProfitLoss/CashFlow/Bep), Reports (11 tab), Settings.
- Auth: JWT (Bearer in localStorage + httpOnly cookies), brute-force lockout, admin seeded from .env.

## Key formulas (implemented & tested)
- harga/satuan pakai = harga beli / faktor konversi; biaya item = qty_base × harga/satuan × (1+waste%)
- Total HPP batch = Σ bahan + kemasan + tenaga kerja + overhead + lainnya; HPP/unit = total/yield (None jika yield 0)
- Laba/unit, margin = laba/harga jual, markup = laba/HPP. Produksi menyimpan snapshot (production_items + recipe_snapshot).
- Sale HPP = qty × product.avg_hpp (weighted avg dari produksi). Laba kotor = penjualan bersih − HPP; laba bersih = laba kotor − pengeluaran.

## Implemented (2026-06)
- Semua modul di atas, demo data (12 bahan, 2 supplier, 3 produk, 4 resep termasuk 1 sub-resep nested, 3 pembelian, 4 produksi, 16 penjualan multi-channel, 8 pengeluaran, modal awal), tombol "Hapus Semua Demo Data".
- Automated tests: `/app/backend/tests/test_hpp.py` (1/5/10/30/50 bahan, contoh spesifikasi 6.400/9.900/990, konversi, waste, yield 0, negatif) + `/app/backend/tests/backend_test.py` (43 kasus e2e, testing agent).
- Import CSV/Excel: bahan, produk, supplier, resep, pembelian, penjualan (preview + validasi + konfirmasi). Backup/restore JSON. Audit log. Dark/light toggle.

## Implemented (2026-06) — Iterasi 2
- Export PDF native (jspdf + autotable) di semua tabel/laporan: header nama usaha, judul, periode; baris TOTAL diulang di setiap halaman (`lib/format.js exportPDF`, `ReportContext`).
- Dashboard "Analisis Biaya Bahan": harga kini vs 30 hari lalu per bahan (% naik/turun), belanja bahan bulan ini vs bulan lalu (`GET /api/dashboard/material-cost-trend`).
- Edit Pembelian & Penjualan langsung (`PUT /api/purchases/{id}`, `PUT /api/sales/{id}`): efek stok/kas/histori harga lama dibalik lalu diterapkan ulang, nomor tetap.
- Notifikasi Stok harian (`GET /api/alerts/stock`): daftar bahan/produk di bawah minimum + saran qty pesan/produksi (14 hari cover dari rata-rata pemakaian 30 hari) + estimasi biaya; badge bel di header.
- Tests: `/app/backend/tests/test_iteration2.py` (7 kasus, run with `-n0`).

## Backlog / Next
- P1: filter kategori pada laporan; pagination server-side untuk data besar; edit produksi.
- P1: Laporan pemakaian bahan & waste per periode; email/WhatsApp notifikasi stok terjadwal.
- P2: Multi-business per user, role permission granular, notifikasi stok rendah, foto bukti preview inline, template import pembelian multi-item.

## Test credentials
Lihat `/app/memory/test_credentials.md` (danarhuda59@gmail.com / admin123).
