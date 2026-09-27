import { Link } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Wallet, Landmark, Boxes, Receipt, AlertTriangle, ShoppingBag } from "lucide-react";
import { PageHeader, StatCard, PeriodFilter, usePeriod } from "../components/common";
import { useApi, qs } from "../lib/hooks";
import { formatRp, formatNum, formatDate, formatPct } from "../lib/format";

const COLORS = ["#0F766E", "#EA580C", "#0284C7", "#16A34A", "#8B5CF6", "#F59E0B", "#DC2626"];
const tipFmt = (v) => formatRp(v);
const shortRp = (v) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}jt` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)}rb` : v);

const Panel = ({ title, children, testId }) => (
  <div className="card-panel fade-up" data-testid={testId}>
    <h3 className="mb-4 font-heading text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
    {children}
  </div>
);

export default function Dashboard() {
  const period = usePeriod("month");
  const { data, loading } = useApi(`/dashboard${qs(period.range)}`, [period.range.start, period.range.end]);
  const d = data || {};
  const p = d.period || {};
  const daily = (d.daily || []).map((x) => ({ ...x, label: formatDate(x.date).slice(0, 6) }));
  return (
    <div data-testid="dashboard-page">
      <PageHeader title="Dashboard" subtitle="Ringkasan kinerja usaha Anda" actions={<PeriodFilter period={period} />} />
      {loading && !data ? <p className="text-sm text-muted-foreground">Memuat...</p> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Omzet Hari Ini" value={formatRp(d.today_omzet)} icon={Receipt} tone="primary" testId="stat-today-omzet" />
            <StatCard label="Omzet Bulan Ini" value={formatRp(d.month_omzet)} icon={TrendingUp} tone="primary" testId="stat-month-omzet" />
            <StatCard label="Pengeluaran Hari Ini" value={formatRp(d.today_expense)} icon={Wallet} tone="accent" testId="stat-today-expense" />
            <StatCard label="Pengeluaran Bulan Ini" value={formatRp(d.month_expense)} icon={TrendingDown} tone="accent" testId="stat-month-expense" />
            <StatCard label="Laba Kotor (periode)" value={formatRp(p.gross_profit)} sub={`Margin ${formatPct(p.gross_margin_pct)}`} tone={p.gross_profit >= 0 ? "good" : "bad"} testId="stat-gross-profit" />
            <StatCard label="Laba Bersih (periode)" value={formatRp(p.net_profit)} sub={`Margin ${formatPct(p.net_margin_pct)}`} tone={p.net_profit >= 0 ? "good" : "bad"} testId="stat-net-profit" />
            <StatCard label="Saldo Kas" value={formatRp(d.cash_balance)} icon={Landmark} sub={`${(d.accounts || []).length} akun`} testId="stat-cash" />
            <StatCard label="Nilai Stok" value={formatRp(d.stock_value)} icon={Boxes} sub={`Bahan ${formatRp(d.material_stock_value)} · Produk ${formatRp(d.product_stock_value)}`} testId="stat-stock-value" />
            <StatCard label="Produk Terjual (periode)" value={formatNum(p.qty_sold, 0)} icon={ShoppingBag} testId="stat-qty-sold" />
            <StatCard label="Jumlah Transaksi (periode)" value={formatNum(p.transactions, 0)} testId="stat-transactions" />
            <StatCard label="Omzet Periode" value={formatRp(p.net_sales)} sub={`HPP ${formatRp(p.hpp)}`} testId="stat-period-omzet" />
            <StatCard label="Biaya Operasional (periode)" value={formatRp(p.opex)} tone="accent" testId="stat-period-opex" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Omzet, Pengeluaran & Laba Harian" testId="chart-daily">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" fontSize={11} /><YAxis fontSize={11} tickFormatter={shortRp} width={48} />
                  <Tooltip formatter={tipFmt} />
                  <Legend />
                  <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EA580C" fill="#EA580C" fillOpacity={0.12} />
                  <Area type="monotone" dataKey="profit" name="Laba" stroke="#0284C7" fill="#0284C7" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Penjualan per Channel" testId="chart-channel">
              {(d.by_channel || []).length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Belum ada penjualan</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={d.by_channel} dataKey="net" nameKey="channel" innerRadius={55} outerRadius={95} paddingAngle={2}>
                      {(d.by_channel || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={tipFmt} /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Panel>
            <Panel title="Produk Terjual (periode)" testId="chart-products">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d.by_product || []} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="product_name" width={120} fontSize={11} />
                  <Tooltip /><Bar dataKey="qty" name="Qty terjual" fill="#0F766E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Pergerakan Stok (masuk / keluar)" testId="chart-stock">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={(d.stock_movement || []).map((x) => ({ ...x, label: formatDate(x.date).slice(0, 6) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" fontSize={11} /><YAxis fontSize={11} width={48} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="in" name="Masuk" stroke="#16A34A" dot={false} /><Line type="monotone" dataKey="out" name="Keluar" stroke="#DC2626" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={<span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Bahan Baku Stok Rendah ({(d.low_stock_materials || []).length})</span>} testId="low-stock-materials">
              {(d.low_stock_materials || []).length === 0 ? <p className="text-sm text-muted-foreground">Semua stok bahan di atas minimum.</p> : (
                <ul className="divide-y text-sm">{d.low_stock_materials.map((m) => <li key={m.id} className="flex justify-between py-2"><Link to="/bahan" className="hover:underline">{m.name}</Link><span className="num text-orange-600">{formatNum(m.stock)} / min {formatNum(m.min_stock)} {m.unit}</span></li>)}</ul>
              )}
            </Panel>
            <Panel title={<span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Produk Stok Rendah ({(d.low_stock_products || []).length})</span>} testId="low-stock-products">
              {(d.low_stock_products || []).length === 0 ? <p className="text-sm text-muted-foreground">Semua stok produk di atas minimum.</p> : (
                <ul className="divide-y text-sm">{d.low_stock_products.map((m) => <li key={m.id} className="flex justify-between py-2"><Link to="/produk" className="hover:underline">{m.name}</Link><span className="num text-orange-600">{formatNum(m.stock)} / min {formatNum(m.min_stock)} {m.unit}</span></li>)}</ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
