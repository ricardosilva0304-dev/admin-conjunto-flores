"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingDown, Landmark, Banknote, Calendar, Loader2, Wallet, PieChart } from "lucide-react";

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
        supabase.from("pagos").select("monto_total, metodo_pago").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia),
        supabase.from("egresos").select("monto, concepto, pagado_a, fecha").gte("fecha", primerDia).lte("fecha", ultimoDia)
      ]);

      const totalRecaudado = recaudado.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const totalGastos = egresos.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
      
      const ingresosBanco = recaudado.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const ingresosEfectivoBruto = recaudado.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;

      setResumen({
        total: totalRecaudado,
        banco: ingresosBanco,
        // SALDO REAL: Lo que entró en efectivo menos lo que se gastó (ya que todo egreso es efectivo)
        efectivo: ingresosEfectivoBruto - totalGastos,
        gastos: totalGastos,
        balanceNeto: totalRecaudado - totalGastos,
        listaEgresos: egresos.data || []
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans px-2 md:px-0">
      <section className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="text-slate-400" size={20} />
          <h2 className="text-slate-700 font-black text-xs uppercase tracking-widest">Cierre Mensual de Caja</h2>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input type="month" className="flex-1 md:w-48 bg-slate-50 border border-slate-100 p-3 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white" onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }} />
          <button onClick={cargarBalance} disabled={loading || !periodo} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black active:scale-95 disabled:opacity-20 transition-all">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "LIQUIDAR"}
          </button>
        </div>
      </section>

      {resumen ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Ingresos Totales</p><h3 className="text-2xl font-black text-slate-800 tabular-nums">${resumen.total.toLocaleString()}</h3></div>
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Bancos</span><span className="text-slate-900">${resumen.banco.toLocaleString()}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Caja (Recaudo)</span><span className="text-slate-900">${(resumen.efectivo + resumen.gastos).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Gastos (Efectivo)</p><h3 className="text-2xl font-black text-rose-500 tabular-nums">-${resumen.gastos.toLocaleString()}</h3></div>
              <p className="text-[9px] text-slate-400 font-bold mt-4 uppercase">{resumen.listaEgresos.length} comprobantes emitidos</p>
            </div>

            <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Dinero Disponible en Caja</p>
                  <h3 className={`text-4xl font-black tabular-nums ${resumen.efectivo >= 0 ? 'text-white' : 'text-rose-400'}`}>${resumen.efectivo.toLocaleString()}</h3>
               </div>
               <div className="relative z-10 mt-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${resumen.efectivo >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Saldo físico tras gastos</p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50">
               <h3 className="text-slate-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2"><TrendingDown size={14} className="text-rose-500"/> Detalle de Salidas de Efectivo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50"><th className="px-8 py-4">Fecha</th><th className="px-8 py-4">Beneficiario</th><th className="px-8 py-4">Concepto</th><th className="px-8 py-4 text-right">Monto</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {resumen.listaEgresos.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 text-[11px] font-bold text-slate-400">{e.fecha}</td>
                      <td className="px-8 py-4 text-xs font-black text-slate-700 uppercase">{e.pagado_a}</td>
                      <td className="px-8 py-4 text-xs text-slate-500 uppercase">{e.concepto.split('|')[0]}</td>
                      <td className="px-8 py-4 text-right text-xs font-black text-rose-600">-${Number(e.monto).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]"><Wallet className="mx-auto text-slate-100 mb-4" size={48} /><p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">Selecciona un mes para auditar la caja</p></div>
      )}
    </div>
  );
}