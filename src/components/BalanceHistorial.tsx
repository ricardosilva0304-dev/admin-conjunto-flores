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

      setResumen({
        total: totalRecaudado,
        banco: recaudado.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0,
        efectivo: recaudado.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* INGRESOS TOTALES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Ingresos Totales</p>
                <h3 className="text-2xl font-black text-emerald-600 tabular-nums">${resumen.total.toLocaleString()}</h3>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Landmark size={12}/> Bancos</span>
                  <span className="text-slate-900">${resumen.banco.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Banknote size={12}/> Efectivo</span>
                  <span className="text-slate-900">${resumen.efectivo.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* EGRESOS TOTALES */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Egresos Totales</p>
                <h3 className="text-2xl font-black text-rose-500 tabular-nums">${resumen.gastos.toLocaleString()}</h3>
              </div>
              <p className="text-[9px] text-slate-400 font-medium mt-4 uppercase">
                {resumen.listaEgresos.length} facturas pagadas
              </p>
            </div>

            {/* BALANCE NETO (DESTACADO) */}
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                  <PieChart size={80} />
               </div>
               <div className="relative z-10">
                  <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Utilidad / Saldo Neto</p>
                  <h3 className={`text-4xl font-black tabular-nums ${resumen.balanceNeto >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    ${resumen.balanceNeto.toLocaleString()}
                  </h3>
               </div>
               <div className="relative z-10 mt-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${resumen.balanceNeto >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase">Estado de liquidez mensual</p>
               </div>
            </div>
          </div>

          {/* TABLA SENCILLA DE GASTOS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-slate-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                 <TrendingDown size={14} className="text-rose-500"/> Detalle de Egresos
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