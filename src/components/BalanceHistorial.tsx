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
    <div className="w-full font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-0.5">Finanzas</p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Cierre de Caja
            </h1>
          </div>

          {/* Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input
                type="month"
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm"
                onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
              />
            </div>
            <button
              onClick={cargarBalance}
              disabled={loading || !periodo}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 disabled:opacity-30 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : "Consultar"}
            </button>
          </div>
        </div>

        {/* ── RESULTADOS ── */}
        {resumen ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">

            {/* Fila de tarjetas:
                Mobile  → apiladas (efectivo arriba)
                Desktop → efectivo ocupa 2/3, bancos + brutos apilados en 1/3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* ── EFECTIVO EN CAJA — grande, a la izquierda ── */}
              <div className={`md:col-span-2 rounded-2xl p-6 sm:p-8 flex flex-col justify-between border shadow-sm relative overflow-hidden
                ${neg(resumen.efectivo)
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-emerald-50 border-emerald-100'}`}>
                {/* círculo decorativo */}
                <div className={`absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-10
                  ${neg(resumen.efectivo) ? 'bg-rose-400' : 'bg-emerald-400'}`} />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-xl ${neg(resumen.efectivo) ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      <Banknote size={18} className={neg(resumen.efectivo) ? 'text-rose-500' : 'text-emerald-600'} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-black tracking-[0.2em] uppercase
                        ${neg(resumen.efectivo) ? 'text-rose-400' : 'text-emerald-600'}`}>
                        Efectivo en Caja
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        Dinero físico acumulado
                      </p>
                    </div>
                  </div>

                  <p className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight leading-none mb-3
                    ${neg(resumen.efectivo) ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {neg(resumen.efectivo) ? "−" : ""}{fmt(resumen.efectivo)}
                  </p>

                  {/* desglose */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      ↑ Ingresó&nbsp;<span className="text-slate-700 font-black">{fmt(resumen.efectivoBruto)}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      ↓ Gastos&nbsp;<span className="text-rose-500 font-black">{fmt(resumen.gastos)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TABLA EGRESOS ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft size={14} className="text-rose-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Detalle de Egresos
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  {resumen.listaEgresos.length} facturas · -{fmt(resumen.gastos)}
                </span>
              </div>

              {/* Mobile: cards */}
              <div className="sm:hidden divide-y divide-slate-50">
                {resumen.listaEgresos.length === 0 ? (
                  <p className="px-5 py-12 text-center text-slate-400 text-xs italic">
                    Sin gastos en este periodo
                  </p>
                ) : (
                  resumen.listaEgresos.map((e: any, i: number) => (
                    <div key={i} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 uppercase truncate">{e.pagado_a}</p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{e.concepto}</p>
                        <p className="text-[9px] font-semibold text-slate-300 uppercase mt-1 tracking-wider">{e.fecha}</p>
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
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Beneficiario</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Concepto</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.listaEgresos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-14 text-center text-slate-400 text-xs italic">
                          Sin gastos en este periodo
                        </td>
                      </tr>
                    ) : (
                      resumen.listaEgresos.map((e: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 text-[11px] font-semibold text-slate-400 whitespace-nowrap">{e.fecha}</td>
                          <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{e.pagado_a}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 italic">{e.concepto}</td>
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