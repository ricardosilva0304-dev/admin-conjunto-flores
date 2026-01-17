"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, TrendingDown, Landmark, Banknote, 
  FileText, Calendar, Loader2, ArrowRightLeft, 
  ArrowUpRight, ArrowDownRight, Scale
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
      const [causado, recaudado, egresos] = await Promise.all([
        // 1. Lo que se le cobró a la gente este mes (Facturación)
        supabase.from("deudas_residentes")
          .select("monto_original, causaciones_globales!inner(mes_causado)")
          .eq("causaciones_globales.mes_causado", periodo),

        // 2. Lo que entró a caja este mes (Recaudo)
        supabase.from("pagos")
          .select("monto_total, metodo_pago")
          .gte("fecha_pago", primerDia)
          .lte("fecha_pago", ultimoDia),

        // 3. Lo que salió de caja este mes (Gastos)
        supabase.from("egresos")
          .select("monto, concepto")
          .gte("fecha", primerDia)
          .lte("fecha", ultimoDia)
      ]);

      const totalFacturado = causado.data?.reduce((acc, d) => acc + Number(d.monto_original), 0) || 0;
      const totalRecaudado = recaudado.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const totalGastos = egresos.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;

      setResumen({
        facturado: totalFacturado,
        recaudado: totalRecaudado,
        gastos: totalGastos,
        banco: recaudado.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0,
        efectivo: recaudado.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0,
        excedente: totalRecaudado - totalGastos,
        carteraDelMes: Math.max(0, totalFacturado - totalRecaudado),
        detallesEgresos: egresos.data || []
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans px-2 md:px-0 animate-in fade-in duration-700">
      
      {/* SELECTOR DE PERIODO PROFESIONAL */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-lg uppercase tracking-tight">Auditoría de Periodo</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Consulta de flujo de caja histórico</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="month" 
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 p-3.5 rounded-xl outline-none font-black text-slate-700 focus:bg-white transition-all"
            onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
          />
          <button 
            onClick={cargarBalance}
            disabled={loading || !periodo}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black active:scale-95 disabled:opacity-20 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "ANALIZAR"}
          </button>
        </div>
      </section>

      {resumen ? (
        <div className="space-y-6">
          
          {/* GRILLA DE KPIS PRINCIPALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Ingresos Reales (Caja)</p>
              <h3 className="text-4xl font-black text-slate-900 tabular-nums">${resumen.recaudado.toLocaleString()}</h3>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                   <span className="flex items-center gap-2"><Landmark size={14} className="text-slate-300"/> Transferencias</span>
                   <span className="text-slate-900">${resumen.banco.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                   <span className="flex items-center gap-2"><Banknote size={14} className="text-slate-300"/> Efectivo</span>
                   <span className="text-slate-900">${resumen.efectivo.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Egresos Reales (Gastos)</p>
              <h3 className="text-4xl font-black text-rose-600 tabular-nums">-${resumen.gastos.toLocaleString()}</h3>
              <p className="mt-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Total de comprobantes: {resumen.detallesEgresos.length}
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-500">Resultado Neto</p>
              <h3 className={`text-4xl font-black tabular-nums ${resumen.excedente >= 0 ? 'text-white' : 'text-rose-500'}`}>
                ${resumen.excedente.toLocaleString()}
              </h3>
              <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Liquidez del Mes</p>
                <p className="text-xs text-slate-300 font-medium">Fondos disponibles tras cubrir gastos operativos.</p>
              </div>
            </div>
          </div>

          {/* COMPARATIVA CONTABLE: LO QUE SE DEBIÓ COBRAR VS LO QUE ENTRÓ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100">
              <h4 className="text-slate-800 font-black text-sm uppercase tracking-tighter mb-8 flex items-center gap-2">
                <Scale size={18} className="text-slate-400" /> Conciliación de Facturación
              </h4>
              <div className="space-y-8">
                <div>
                   <div className="flex justify-between mb-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Facturación Generada (M1)</span>
                     <span className="text-sm font-black text-slate-700">${resumen.facturado.toLocaleString()}</span>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-slate-900" style={{ width: '100%' }}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between mb-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Recaudo Efectivo</span>
                     <span className="text-sm font-black text-emerald-600">${resumen.recaudado.toLocaleString()}</span>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${(resumen.recaudado / resumen.facturado) * 100}%` }}></div>
                   </div>
                </div>
                <div className="pt-4 border-t border-dashed">
                  <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Diferencia (Cartera Nueva)</p>
                  <p className="text-xl font-black text-slate-900">${resumen.carteraDelMes.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* LISTADO DE GASTOS DEL MES */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col">
              <h4 className="text-slate-800 font-black text-sm uppercase tracking-tighter mb-6 flex items-center gap-2">
                <ArrowDownRight size={18} className="text-rose-500" /> Desglose de Egresos
              </h4>
              <div className="flex-1 overflow-y-auto max-h-[250px] space-y-3 pr-2 custom-scrollbar">
                {resumen.detallesEgresos.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[180px]">{e.concepto}</span>
                    <span className="text-xs font-black text-rose-600">-${Number(e.monto).toLocaleString()}</span>
                  </div>
                ))}
                {resumen.detallesEgresos.length === 0 && (
                  <div className="py-10 text-center text-slate-300 italic text-xs">No se registraron gastos este periodo.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-32 text-center bg-white border border-slate-200 border-dashed rounded-[3rem]">
          <FileText className="mx-auto text-slate-200 mb-6" size={60} />
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Seleccione un periodo para auditar</p>
        </div>
      )}
    </div>
  );
}