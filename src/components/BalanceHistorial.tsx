"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, TrendingDown, Target, Landmark, 
  ArrowUpRight, FileBarChart, Calendar, 
  CheckCircle2, Loader2, Banknote 
} from "lucide-react";

export default function BalanceHistorial() {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState<any>(null);

  async function cargarBalance() {
    if (!periodo) return;
    setLoading(true);

    const primerDia = `${periodo}-01`;
    const ultimoDia = `${periodo}-31`;

    try {
      // Carga paralela de datos para máxima velocidad
      const [causado, recaudado, egresos] = await Promise.all([
        supabase.from("deudas_residentes")
          .select("monto_original")
          .eq("causaciones_globales.mes_causado", periodo),
        
        supabase.from("pagos")
          .select("monto_total, metodo_pago")
          .gte("fecha_pago", primerDia)
          .lte("fecha_pago", ultimoDia),

        supabase.from("egresos")
          .select("monto")
          .gte("fecha", primerDia)
          .lte("fecha", ultimoDia)
      ]);

      const sumaEsperado = causado.data?.reduce((acc, d) => acc + Number(d.monto_original), 0) || 0;
      const sumaRecaudado = recaudado.data?.reduce((acc, p) => acc + Number(p.monto_total), 0) || 0;
      const sumaGastos = egresos.data?.reduce((acc, e) => acc + Number(e.monto), 0) || 0;

      setResumen({
        esperado: sumaEsperado,
        recaudado: sumaRecaudado,
        gastos: sumaGastos,
        excedente: sumaRecaudado - sumaGastos,
        banco: recaudado.data?.filter(p => p.metodo_pago === 'Transferencia').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0,
        efectivo: recaudado.data?.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + Number(p.monto_total), 0) || 0,
        efectividad: sumaEsperado > 0 ? (sumaRecaudado / sumaEsperado) * 100 : 100
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans">
      
      {/* 1. FILTROS SIMPLES */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
           <Calendar className="text-slate-400" size={20} />
           <h2 className="text-slate-700 font-bold text-lg uppercase tracking-tight">Cierre de Mes</h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="month" 
            className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-lg outline-none focus:border-emerald-500 font-bold text-slate-700"
            onChange={(e) => { setPeriodo(e.target.value); setResumen(null); }}
          />
          <button 
            onClick={cargarBalance}
            disabled={loading || !periodo}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold text-xs tracking-widest disabled:opacity-30 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "AUDITAR"}
          </button>
        </div>
      </section>

      {/* 2. DASHBOARD DE RESULTADOS (DISEÑO LIMPIO) */}
      {resumen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Ingresos Detallados */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
             <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Recaudado Real</p>
                <h4 className="text-3xl font-black text-slate-900">${resumen.recaudado.toLocaleString()}</h4>
             </div>
             <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                   <span className="flex items-center gap-2"><Landmark size={14} className="text-slate-400" /> Bancos</span>
                   <span className="text-slate-900 font-bold">${resumen.banco.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-500">
                   <span className="flex items-center gap-2"><Banknote size={14} className="text-slate-400" /> Efectivo</span>
                   <span className="text-slate-900 font-bold">${resumen.efectivo.toLocaleString()}</span>
                </div>
             </div>
          </div>

          {/* Eficacia y Meta */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
             <div className="flex items-center justify-between">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Efectividad Cobro</p>
                <Target size={16} className="text-emerald-500" />
             </div>
             <div className="mt-4 flex items-end justify-between">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{Math.round(resumen.efectividad)}%</span>
                <span className="text-[10px] text-slate-400 font-bold mb-2">FACTURADO: ${resumen.esperado.toLocaleString()}</span>
             </div>
             <div className="mt-4 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${resumen.efectividad}%` }}></div>
             </div>
          </div>

          {/* Balance Operativo (Gasto vs Utilidad) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
             {/* Sutil indicador de saldo positivo/negativo */}
             <div className={`absolute top-0 right-0 p-4 font-black text-[10px] ${resumen.excedente >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} rounded-bl-xl`}>
                {resumen.excedente >= 0 ? '+ DISPONIBLE' : '- DEFICIT'}
             </div>
             
             <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Resultado Neto</p>
                <h4 className={`text-3xl font-black ${resumen.excedente >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${resumen.excedente.toLocaleString()}
                </h4>
             </div>
             <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
                <span>Gastos registrados</span>
                <span className="text-rose-500 font-bold">-${resumen.gastos.toLocaleString()}</span>
             </div>
          </div>

        </div>
      ) : (
        <div className="py-20 text-center bg-slate-50 border border-slate-200 rounded-xl border-dashed">
           <FileBarChart className="mx-auto text-slate-200 mb-4" size={48} />
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Esperando Selección de Periodo</p>
        </div>
      )}

      {/* CONCLUSIÓN (MENSAJE FINAL LIMPIO) */}
      {resumen && (
        <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
          <p className="text-slate-800 font-bold text-sm leading-relaxed uppercase">
            Conclusión: <span className="text-slate-500 font-normal ml-2">El cierre administrativo del mes arroja un {resumen.excedente >= 0 ? 'Excedente' : 'Déficit'} de </span> 
            <span className={resumen.excedente >= 0 ? 'text-emerald-600' : 'text-rose-600'}> ${resumen.excedente.toLocaleString()} </span>
            <span className="text-slate-500 font-normal italic lowercase ml-2">Basado en auditoría de caja.</span>
          </p>
        </div>
      )}

    </div>
  );
}