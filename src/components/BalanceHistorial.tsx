"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp, TrendingDown, Landmark, Banknote,
  Calendar, Loader2, Wallet, PieChart
} from "lucide-react";

export default function BalanceHistorial() {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState<any>(null);

  async function cargarBalance() {
    if (!periodo) return;
    setLoading(true);

    const [anio, mesNum] = periodo.split("-").map(Number);
    const primerDia = `${periodo}-01`;
    const ultimoDia = `${periodo}-${new Date(anio, mesNum, 0).getDate()}`;

    try {
      // ── Mes actual ──────────────────────────────────────────
      const [recaudado, egresos] = await Promise.all([
        supabase.from("pagos")
          .select("monto_total, metodo_pago")
          .gte("fecha_pago", primerDia)
          .lte("fecha_pago", ultimoDia),
        supabase.from("egresos")
          .select("monto, concepto, pagado_a, fecha")
          .gte("fecha", primerDia)
          .lte("fecha", ultimoDia)
      ]);

      const totalRecaudado = recaudado.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const totalGastos = egresos.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
      const ingresosBanco = recaudado.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const ingresosEfectivoBruto = recaudado.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const efectivoNetoMes = ingresosEfectivoBruto - totalGastos;

      // ── Meses anteriores: traer TODO lo anterior al primer día del mes ──
      const [pagosAnteriores, egresosAnteriores] = await Promise.all([
        supabase.from("pagos")
          .select("monto_total, metodo_pago")
          .eq("metodo_pago", "Efectivo")
          .lt("fecha_pago", primerDia),
        supabase.from("egresos")
          .select("monto")
          .lt("fecha", primerDia)
      ]);

      const efectivoAcumuladoAnterior =
        (pagosAnteriores.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0)
        - (egresosAnteriores.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0);

      const efectivoAcumulado = efectivoNetoMes + efectivoAcumuladoAnterior;

      setResumen({
        total: totalRecaudado,
        banco: ingresosBanco,
        efectivo: efectivoAcumulado,          // ← ahora es acumulado
        efectivoBruto: ingresosEfectivoBruto,
        gastos: totalGastos,
        balanceNeto: totalRecaudado - totalGastos,
        listaEgresos: egresos.data || []
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 font-sans px-0">

      {/* ── SELECTOR DE PERIODO ──────────────────────────────── */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3 sm:mb-0 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-400 flex-shrink-0" size={18} />
            <h2 className="text-slate-700 font-bold text-xs sm:text-sm uppercase tracking-widest">
              Cierre de Caja Mensual
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-auto sm:w-auto
          sm:flex sm:flex-row sm:items-center sm:justify-end">
          <div className="sm:hidden w-full flex items-center gap-2">
            <input
              type="month"
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-emerald-500/10 transition-all"
              onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
            />
            <button
              onClick={cargarBalance}
              disabled={loading || !periodo}
              className="flex-shrink-0 bg-slate-900 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-black active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center min-w-[90px]"
            >
              {loading ? <Loader2 className="animate-spin" size={15} /> : "Consultar"}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <input
              type="month"
              className="w-48 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 ring-emerald-500/10 transition-all"
              onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
            />
            <button
              onClick={cargarBalance}
              disabled={loading || !periodo}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Consultar"}
            </button>
          </div>
        </div>
      </section>

      {resumen ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4 sm:space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

            <div className="lg:col-span-7 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
              <div>
                <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">
                  Ingresos Totales (Bruto)
                </p>
                <h3 className="font-black text-slate-900 tabular-nums tracking-tighter
                  text-3xl sm:text-4xl md:text-5xl">
                  ${resumen.total.toLocaleString()}
                </h3>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100 space-y-3 sm:space-y-4">

                <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm text-blue-500 flex-shrink-0">
                      <Landmark size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-widest">En Bancos</span>
                      <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-0.5">Transferencias</span>
                    </div>
                  </div>
                  <span className="text-base sm:text-xl font-black text-slate-800 tabular-nums flex-shrink-0 ml-2">
                    ${resumen.banco.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg shadow-sm text-emerald-600 flex-shrink-0">
                      <Banknote size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] sm:text-[11px] font-black text-emerald-700 uppercase tracking-widest">Saldo Efectivo</span>
                      <span className="block text-[8px] sm:text-[9px] font-bold text-emerald-600/70 uppercase mt-0.5">
                        Dinero físico en caja
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className={`font-black tabular-nums tracking-tight text-lg sm:text-2xl ${resumen.efectivo < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      ${resumen.efectivo.toLocaleString()}
                    </span>
                    <p className="text-[8px] text-slate-400 font-bold mt-0.5 italic">
                      Ingresó: ${resumen.efectivoBruto.toLocaleString()} − Gastos: ${resumen.gastos.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">

              <div className="bg-rose-50 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-rose-100 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-1 sm:mb-2">
                  <p className="text-rose-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Egresos Totales</p>
                  <TrendingDown className="text-rose-300 flex-shrink-0" size={18} />
                </div>
                <h3 className="font-black text-rose-600 tabular-nums tracking-tighter text-2xl sm:text-4xl">
                  -${resumen.gastos.toLocaleString()}
                </h3>
                <p className="text-[8px] sm:text-[10px] text-rose-400 font-bold mt-2 sm:mt-3 uppercase tracking-widest">
                  {resumen.listaEgresos.length} facturas
                </p>
              </div>

              <div className="bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xl flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -bottom-4 -right-4 p-4 opacity-10 text-white">
                  <PieChart size={80} />
                </div>
                <div className="relative z-10">
                  <p className="text-emerald-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-1 sm:mb-2">
                    Saldo Neto
                  </p>
                  <h3 className={`font-black tabular-nums tracking-tighter text-2xl sm:text-4xl ${resumen.balanceNeto >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    ${resumen.balanceNeto.toLocaleString()}
                  </h3>
                </div>
                <div className="relative z-10 mt-3 sm:mt-6 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${resumen.balanceNeto >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Liquidez mensual</p>
                </div>
              </div>

            </div>
          </div>

          {/* ── TABLA EGRESOS ────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-slate-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <TrendingDown size={13} className="text-rose-500" /> Detalle de Egresos
              </h3>
            </div>

            <div className="sm:hidden divide-y divide-slate-50">
              {resumen.listaEgresos.length === 0 ? (
                <p className="px-4 py-10 text-center text-slate-400 text-xs italic">
                  No hay gastos registrados en este mes
                </p>
              ) : (
                resumen.listaEgresos.map((e: any, i: number) => (
                  <div key={i} className="p-4 flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-700 uppercase truncate">{e.pagado_a}</p>
                      <p className="text-[9px] text-slate-400 italic mt-0.5 truncate">{e.concepto}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{e.fecha}</p>
                    </div>
                    <p className="text-sm font-black text-rose-600 tabular-nums flex-shrink-0">
                      -${Number(e.monto).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Beneficiario</th>
                    <th className="px-6 py-3">Concepto</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {resumen.listaEgresos.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-400">{e.fecha}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700 uppercase">{e.pagado_a}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 italic">{e.concepto}</td>
                      <td className="px-6 py-4 text-right text-xs font-black text-rose-600 tabular-nums">
                        -${Number(e.monto).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {resumen.listaEgresos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                        No hay gastos registrados en este mes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-24 sm:py-32 text-center bg-white border border-slate-200 border-dashed rounded-2xl sm:rounded-[2.5rem]">
          <Wallet className="mx-auto text-slate-200 mb-4" size={40} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Seleccione un periodo para liquidar
          </p>
        </div>
      )}
    </div>
  );
}
