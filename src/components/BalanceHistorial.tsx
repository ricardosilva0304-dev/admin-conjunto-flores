"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Landmark, Banknote, Calendar, Loader2, Wallet,
  TrendingDown, ArrowDownLeft, ArrowUpRight
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
        efectivo: efectivoAcumulado,
        efectivoBruto: ingresosEfectivoBruto,
        gastos: totalGastos,
        listaEgresos: egresos.data || []
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString("es-CO")}`;
  const neg = (n: number) => n < 0;

  return (
    <div className="min-h-screen bg-[#F5F4F0] font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-1">Finanzas</p>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Cierre de Caja
            </h1>
          </div>

          {/* Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={15} />
              <input
                type="month"
                className="pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 outline-none focus:ring-2 focus:ring-stone-900/10 transition-all shadow-sm"
                onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
              />
            </div>
            <button
              onClick={cargarBalance}
              disabled={loading || !periodo}
              className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 active:scale-95 disabled:opacity-30 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : "Consultar"}
            </button>
          </div>
        </div>

        {/* ── RESULTADOS ── */}
        {resumen ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">

            {/* Fila 1: Ingresos brutos + dos sub-tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Ingresos brutos — ocupa 1 col en md, full en mobile */}
              <div className="md:col-span-1 bg-stone-900 rounded-2xl p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                {/* decoración sutil */}
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/[0.03]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black tracking-[0.2em] text-stone-400 uppercase">Ingresos Brutos</span>
                    <ArrowUpRight size={15} className="text-emerald-400" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight leading-none">
                    {fmt(resumen.total)}
                  </p>
                </div>
              </div>

              {/* En Bancos */}
              <div className="bg-white rounded-2xl p-6 flex flex-col justify-between border border-stone-100 shadow-sm min-h-[160px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Landmark size={16} className="text-blue-500" />
                  </div>
                  <span className="text-[9px] font-black tracking-[0.18em] text-stone-400 uppercase">Bancos</span>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-stone-900 tabular-nums tracking-tight">
                    {fmt(resumen.banco)}
                  </p>
                  <p className="text-[10px] text-stone-400 font-semibold mt-1.5 uppercase tracking-wider">Transferencias</p>
                </div>
              </div>

              {/* Saldo Efectivo — el más importante, bien destacado */}
              <div className={`rounded-2xl p-6 flex flex-col justify-between min-h-[160px] border shadow-sm
                ${neg(resumen.efectivo)
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${neg(resumen.efectivo) ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                    <Banknote size={16} className={neg(resumen.efectivo) ? 'text-rose-500' : 'text-emerald-600'} />
                  </div>
                  <span className={`text-[9px] font-black tracking-[0.18em] uppercase
                    ${neg(resumen.efectivo) ? 'text-rose-400' : 'text-emerald-600'}`}>
                    Efectivo en Caja
                  </span>
                </div>
                <div>
                  <p className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight
                    ${neg(resumen.efectivo) ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {neg(resumen.efectivo) ? "-" : ""}{fmt(resumen.efectivo)}
                  </p>
                  <p className="text-[10px] text-stone-500 font-semibold mt-1.5">
                    Ingresó {fmt(resumen.efectivoBruto)} · Gastos {fmt(resumen.gastos)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── TABLA EGRESOS ── */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft size={14} className="text-rose-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-600">
                    Detalle de Egresos
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  {resumen.listaEgresos.length} facturas · -{fmt(resumen.gastos)}
                </span>
              </div>

              {/* Mobile: cards */}
              <div className="sm:hidden divide-y divide-stone-50">
                {resumen.listaEgresos.length === 0 ? (
                  <p className="px-5 py-12 text-center text-stone-400 text-xs italic">
                    Sin gastos en este periodo
                  </p>
                ) : (
                  resumen.listaEgresos.map((e: any, i: number) => (
                    <div key={i} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-stone-800 uppercase truncate">{e.pagado_a}</p>
                        <p className="text-[10px] text-stone-400 italic mt-0.5 truncate">{e.concepto}</p>
                        <p className="text-[9px] font-semibold text-stone-300 uppercase mt-1 tracking-wider">{e.fecha}</p>
                      </div>
                      <p className="text-sm font-black text-rose-600 tabular-nums flex-shrink-0">
                        -{fmt(Number(e.monto))}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop: tabla */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-50">
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-stone-400">Fecha</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-stone-400">Beneficiario</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-stone-400">Concepto</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-stone-400 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.listaEgresos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-14 text-center text-stone-400 text-xs italic">
                          Sin gastos en este periodo
                        </td>
                      </tr>
                    ) : (
                      resumen.listaEgresos.map((e: any, i: number) => (
                        <tr key={i} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60 transition-colors">
                          <td className="px-6 py-4 text-[11px] font-semibold text-stone-400 whitespace-nowrap">{e.fecha}</td>
                          <td className="px-6 py-4 text-xs font-black text-stone-800 uppercase">{e.pagado_a}</td>
                          <td className="px-6 py-4 text-xs text-stone-500 italic">{e.concepto}</td>
                          <td className="px-6 py-4 text-right text-xs font-black text-rose-600 tabular-nums whitespace-nowrap">
                            -{fmt(Number(e.monto))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          /* Estado vacío */
          <div className="py-28 sm:py-36 text-center bg-white border border-dashed border-stone-200 rounded-2xl">
            <Wallet className="mx-auto text-stone-200 mb-4" size={36} />
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em]">
              Seleccione un periodo para consultar
            </p>
          </div>
        )}

      </div>
    </div>
  );
}