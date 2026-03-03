"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp, TrendingDown, Landmark, Banknote,
  Calendar, Loader2, Wallet, ArrowRight, PieChart
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
        // 1. Recaudo real (Lo que entró)
        supabase.from("pagos")
          .select("monto_total, metodo_pago")
          .gte("fecha_pago", primerDia)
          .lte("fecha_pago", ultimoDia),

        // 2. Gastos reales (Lo que salió)
        supabase.from("egresos")
          .select("monto, concepto, pagado_a, fecha")
          .gte("fecha", primerDia)
          .lte("fecha", ultimoDia)
      ]);

      const totalRecaudado = recaudado.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const totalGastos = egresos.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;

      const ingresosBanco = recaudado.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const ingresosEfectivoBruto = recaudado.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;

      const efectivoNeto = ingresosEfectivoBruto - totalGastos;

      setResumen({
        total: totalRecaudado, // El ingreso total bruto sigue siendo el mismo
        banco: ingresosBanco,
        efectivo: efectivoNeto, // Guardamos el nuevo valor NETO
        efectivoBruto: ingresosEfectivoBruto, // Guardamos el bruto para mostrar el desglose
        gastos: totalGastos,
        balanceNeto: totalRecaudado - totalGastos,
        listaEgresos: egresos.data || []
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans px-2 md:px-0">

      {/* SELECTOR DE PERIODO SIMPLE */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="text-slate-400" size={20} />
          <h2 className="text-slate-700 font-bold text-sm uppercase tracking-widest">Cierre de Caja Mensual</h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="month"
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700 focus:ring-2 ring-emerald-500/10 transition-all"
            onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
          />
          <button
            onClick={cargarBalance}
            disabled={loading || !periodo}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black active:scale-95 disabled:opacity-20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Consultar"}
          </button>
        </div>
      </section>

      {resumen ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">

          {/* GRILLA DE RESULTADOS DIRECTOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* COLUMNA IZQUIERDA: INGRESOS Y DESGLOSE (Ocupa más espacio) */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="mb-6">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Ingresos Totales (Bruto)</p>
                {/* Texto MUCHO más grande */}
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                  ${resumen.total.toLocaleString()}
                </h3>
              </div>

              {/* DESGLOSE BANCARIO VS EFECTIVO (Diseño tipo "ticket") */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">

                {/* BANCOS */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500"><Landmark size={18} /></div>
                    <div>
                      <span className="block text-[11px] font-black text-slate-800 uppercase tracking-widest">En Bancos</span>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase mt-0.5">Transferencias</span>
                    </div>
                  </div>
                  <span className="text-xl font-black text-slate-800 tabular-nums">${resumen.banco.toLocaleString()}</span>
                </div>

                {/* EFECTIVO (Resaltado como pediste) */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg shadow-sm text-emerald-600"><Banknote size={18} /></div>
                    <div>
                      <span className="block text-[11px] font-black text-emerald-700 uppercase tracking-widest">Saldo Efectivo</span>
                      <span className="block text-[9px] font-bold text-emerald-600/70 uppercase mt-0.5">Dinero físico en caja</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* El saldo efectivo neto es el protagonista aquí */}
                    <span className={`text-2xl font-black tabular-nums tracking-tight ${resumen.efectivo < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      ${resumen.efectivo.toLocaleString()}
                    </span>
                    {/* Explicación matemática sutil debajo */}
                    <p className="text-[9px] text-slate-400 font-bold mt-1 italic">
                      Ingresó: ${resumen.efectivoBruto.toLocaleString()} - Gastos: ${resumen.gastos.toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* COLUMNA DERECHA: EGRESOS Y SALDO NETO */}
            <div className="lg:col-span-5 space-y-6 flex flex-col">

              {/* EGRESOS TOTALES */}
              <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 flex flex-col justify-center flex-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">Egresos Totales</p>
                  <TrendingDown className="text-rose-300" size={24} />
                </div>
                <h3 className="text-4xl font-black text-rose-600 tabular-nums tracking-tighter">
                  -${resumen.gastos.toLocaleString()}
                </h3>
                <p className="text-[10px] text-rose-400 font-bold mt-3 uppercase tracking-widest">
                  {resumen.listaEgresos.length} facturas pagadas
                </p>
              </div>

              {/* BALANCE NETO (DESTACADO OSCURO) */}
              <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl flex flex-col justify-center relative overflow-hidden flex-1">
                <div className="absolute -bottom-4 -right-4 p-4 opacity-10 text-white">
                  <PieChart size={120} />
                </div>
                <div className="relative z-10">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Utilidad / Saldo Neto</p>
                  <h3 className={`text-4xl font-black tabular-nums tracking-tighter ${resumen.balanceNeto >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    ${resumen.balanceNeto.toLocaleString()}
                  </h3>
                </div>
                <div className="relative z-10 mt-6 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${resumen.balanceNeto >= 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_emerald]' : 'bg-rose-500'}`}></div>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Estado de liquidez mensual</p>
                </div>
              </div>

            </div>
          </div>

          {/* TABLA SENCILLA DE GASTOS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-slate-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <TrendingDown size={14} className="text-rose-500" /> Detalle de Egresos
              </h3>
            </div>
            <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 text-right text-xs font-black text-rose-600 tabular-nums">-${Number(e.monto).toLocaleString()}</td>
                    </tr>
                  ))}
                  {resumen.listaEgresos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs italic">No hay gastos registrados en este mes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-32 text-center bg-white border border-slate-200 border-dashed rounded-[2.5rem]">
          <Wallet className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Seleccione un periodo para liquidar</p>
        </div>
      )}
    </div>
  );
}