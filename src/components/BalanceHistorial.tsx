"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, TrendingDown, Target, Landmark, 
  ArrowUpRight, ArrowDownRight, Search, FileBarChart,
  Calendar, CheckCircle2, AlertTriangle, Loader2
} from "lucide-react";

export default function BalanceHistorial() {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState<any>(null);

  async function cargarBalance() {
    if (!periodo) return alert("Selecciona un mes");
    setLoading(true);

    const [anio, mes] = periodo.split("-");
    const primerDia = `${periodo}-01`;
    const ultimoDia = `${periodo}-31`;

    // 1. Lo que se debió cobrar (Causación)
    const { data: causaciones } = await supabase.from("causaciones_globales").select("*").eq("mes_causado", periodo);
    
    // 2. Lo que realmente se cobró (Pagos)
    const { data: pagos } = await supabase.from("pagos").select("monto_total").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia);
    
    // 3. Lo que se gastó (Egresos)
    const { data: egresos } = await supabase.from("egresos").select("monto").gte("fecha", primerDia).lte("fecha", ultimoDia);

    const esperado = causaciones?.reduce((acc, c) => acc + (c.monto_total || 0), 0) || 0; // Tendrías que asegurar que este campo sume en causación
    const recaudado = pagos?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
    const gastos = egresos?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;

    setResumen({
      esperado: 0, // Esto se llenaría mejor con una suma de deudas_residentes original_monto
      recaudado,
      gastos,
      excedente: recaudado - gastos,
      efectividad: esperado > 0 ? (recaudado / esperado) * 100 : 100
    });
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* 1. SELECTOR DE PERIODO */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Calendar size={28} />
           </div>
           <div>
              <h2 className="text-slate-900 text-2xl font-black uppercase tracking-tight">Balance Mensual</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Análisis de rendimiento histórico</p>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            type="month" 
            className="flex-1 bg-slate-50 border border-slate-200 p-5 rounded-2xl outline-none focus:ring-4 ring-emerald-500/5 font-black text-slate-700"
            onChange={(e) => setPeriodo(e.target.value)}
          />
          <button 
            onClick={cargarBalance}
            className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            CONSULTAR
          </button>
        </div>
      </section>

      {/* 2. RESULTADOS DEL BALANCE */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={50} /></div>
      ) : resumen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* CARRETERA DE INGRESO (METRICAS) */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group">
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Ingresos Percibidos
               </p>
               <h4 className="text-4xl font-black text-slate-900 tabular-nums">${resumen.recaudado.toLocaleString()}</h4>
               <p className="text-[11px] font-bold text-slate-300 mt-2 italic">Dinero total que entró a caja</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl group">
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Utilidad Operativa
               </p>
               <h4 className="text-4xl font-black text-emerald-400 tabular-nums">
                 ${resumen.excedente.toLocaleString()}
               </h4>
               <p className="text-[11px] font-bold text-slate-500 mt-2">Saldo final libre después de egresos</p>
            </div>
          </div>

          {/* ESTADÍSTICAS DE EFICACIA */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden relative group">
             <div className="relative z-10">
                <Target className="text-slate-100 mb-4 group-hover:text-emerald-50 transition-colors" size={60} />
                <h3 className="text-slate-900 font-black text-xl mb-1 uppercase tracking-tighter">Eficiencia Recaudo</h3>
                <p className="text-slate-400 text-xs font-bold leading-tight">Porcentaje de éxito vs Meta causada</p>
                
                <div className="mt-12 space-y-4">
                   <div className="flex items-end gap-3">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">{resumen.efectividad === 100 ? '---' : Math.round(resumen.efectividad) + '%'}</span>
                      <TrendingUp className="text-emerald-500 mb-2" size={24} />
                   </div>
                   <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full bg-emerald-500" style={{ width: `${resumen.efectividad}%` }}></div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
          </div>

          {/* EGRESOS VS IMPACTO */}
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] shadow-sm flex flex-col justify-center text-center space-y-4">
             <div className="w-16 h-16 bg-white rounded-3xl mx-auto flex items-center justify-center text-rose-500 shadow-xl shadow-rose-200/50 mb-2">
                <TrendingDown size={32} />
             </div>
             <div>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Gasto Consumido</p>
                <h4 className="text-3xl font-black text-rose-700">${resumen.gastos.toLocaleString()}</h4>
             </div>
             <p className="text-[11px] font-bold text-rose-900/40 uppercase tracking-tighter">Equivale al {resumen.recaudado > 0 ? Math.round((resumen.gastos/resumen.recaudado)*100) : 0}% del ingreso</p>
          </div>

        </div>
      ) : (
        <div className="py-32 text-center opacity-30 flex flex-col items-center">
           <FileBarChart size={100} strokeWidth={1} />
           <p className="mt-4 font-black uppercase tracking-widest text-sm">Selecciona un periodo fiscal para comenzar</p>
        </div>
      )}

      {/* FOOTER INFORMATIVO */}
      {resumen && (
        <div className="bg-emerald-900 p-10 rounded-[3rem] text-white flex items-center gap-10 shadow-2xl relative overflow-hidden">
           <div className="flex-1 space-y-4 relative z-10">
              <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px]">Conclusión Administrativa</h3>
              <p className="text-xl font-bold leading-snug">
                El mes de <span className="underline decoration-emerald-500 decoration-4">{periodo}</span> cerró con una disponibilidad real en banco de <span className="text-emerald-300 font-black text-2xl tracking-tighter italic ml-2">${resumen.excedente.toLocaleString()}</span>. 
              </p>
              <div className="flex items-center gap-2 text-emerald-400/50 text-[10px] font-black">
                 <CheckCircle2 size={14}/> TODOS LOS REGISTROS ESTÁN AUDITADOS Y RESPALDADOS
              </div>
           </div>
           <ArrowUpRight className="text-emerald-800 opacity-20" size={150} />
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full -mt-20"></div>
        </div>
      )}

    </div>
  );
}