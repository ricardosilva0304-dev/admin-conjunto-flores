"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, Printer, Loader2, TrendingUp, TrendingDown, Scale, History, ChevronDown
} from "lucide-react";

export default function Reportes() {
  const [tipo, setTipo] = useState("General");
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<{ingresos: any[], egresos: any[]} | null>(null);

  async function generarReporte() {
    if (!mes) return alert("Por favor selecciona un mes");
    setLoading(true);
    
    const primerDia = `${mes}-01`;
    const ultimoDia = `${mes}-31`;

    const [resIng, resEgr] = await Promise.all([
      supabase.from("pagos").select("*").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia),
      supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia)
    ]);

    setReporteData({ ingresos: resIng.data || [], egresos: resEgr.data || [] });
    setLoading(false);
  }

  const totalIng = reporteData?.ingresos.reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;
  const totalEgr = reporteData?.egresos.reduce((acc, e) => acc + Number(e.monto), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* PANEL DE FILTROS SUPERIOR */}
      <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 no-print">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-slate-900 text-xl font-black uppercase tracking-tight">Auditoría Mensual</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Generador de Documentos</p>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-4 w-full">
            <div className="relative min-w-[200px]">
              <label className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Tipo</label>
              <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700 appearance-none" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option>General (Ingresos y Egresos)</option>
                <option>Solo Ingresos</option>
                <option>Solo Egresos</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            </div>

            <div className="relative min-w-[180px]">
              <label className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Periodo</label>
              <input type="month" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold text-slate-700" onChange={(e) => setMes(e.target.value)} />
            </div>

            <button onClick={generarReporte} disabled={loading} className="bg-slate-900 hover:bg-black text-white font-black px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all active:scale-95">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><FileText size={18}/> GENERAR</>}
            </button>

            {reporteData && (
              <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95">
                <Printer size={18} /> IMPRIMIR
              </button>
            )}
          </div>
        </div>
      </section>

      {/* VISTA PREVIA DEL REPORTE */}
      <div className="w-full flex justify-center">
        {reporteData && (
          <div id="report-print" className="w-full bg-white p-16 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col min-h-[1000px] print:p-0 print:border-0 print:shadow-none">
            
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #report-print, #report-print * { visibility: visible; }
                #report-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 1.5cm; }
                .no-print { display: none !important; }
              }
            `}</style>

            {/* CABECERA */}
            <div className="flex justify-between items-center mb-12 border-b-4 border-slate-900 pb-10">
               <div className="flex items-center gap-6">
                  <img src="/logo.png" alt="Logo" className="w-32 h-auto" />
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 leading-none tracking-tighter">ESTADO DE CUENTAS</h2>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Agrupación Res. El Parque de las Flores</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Periodo Fiscal</p>
                  <p className="text-2xl font-black text-slate-900 uppercase">
                    {new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(mes + "-01"))}
                  </p>
               </div>
            </div>

            {/* RESUMEN KPI - CORREGIDO PARA QUE EL NÚMERO NO SE CORTE */}
            <div className="grid grid-cols-3 gap-6 mb-16">
               <div className="bg-emerald-50/50 p-8 rounded-[3rem] border border-emerald-100 text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Recaudado</p>
                  <h3 className="text-3xl font-black text-emerald-700 tabular-nums">${totalIng.toLocaleString('es-CO')}</h3>
               </div>
               <div className="bg-rose-50/50 p-8 rounded-[3rem] border border-rose-100 text-center">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Gasto Mensual</p>
                  <h3 className="text-3xl font-black text-rose-700 tabular-nums">${totalEgr.toLocaleString('es-CO')}</h3>
               </div>
               <div className="bg-slate-900 p-8 rounded-[3rem] text-center shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-white/50">Saldo en Caja</p>
                  <h3 className={`text-3xl font-black tabular-nums ${totalIng - totalEgr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${(totalIng - totalEgr).toLocaleString('es-CO')}
                  </h3>
               </div>
            </div>

            {/* TABLA DE INGRESOS - CORREGIDO UNDEFINED */}
            <div className="flex-1 space-y-16">
              {(tipo === 'General' || tipo === 'Solo Ingresos') && (
                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 mb-6 border-l-4 border-emerald-500 pl-4">Relación de Recaudos</h4>
                  <div className="overflow-hidden border border-slate-200 rounded-3xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-black uppercase">
                        <tr>
                          <th className="py-4 px-6">Unidad</th>
                          <th className="py-4 px-6">Concepto Detallado</th>
                          <th className="py-4 px-6">Fecha</th>
                          <th className="py-4 px-6 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {reporteData.ingresos.map(i => (
                          <tr key={i.id}>
                            <td className="py-4 px-6 font-black text-slate-900">{i.unidad}</td>
                            <td className="py-4 px-6 font-bold uppercase">
                              {/* PARACAÍDAS PARA EL UNDEFINED */}
                              {i.concepto_texto && i.concepto_texto !== 'undefined' ? i.concepto_texto : 'ADMINISTRACIÓN (CUOTA MENSUAL)'}
                            </td>
                            <td className="py-4 px-6">{i.fecha_pago}</td>
                            <td className="py-4 px-6 text-right font-black tabular-nums text-slate-900">${Number(i.monto_total).toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* FIRMAS */}
            <div className="mt-auto pt-20">
               <div className="flex justify-around mb-12">
                  <div className="w-64 border-t-2 border-slate-300 pt-3 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">Firma Administradora</div>
                  <div className="w-64 border-t-2 border-slate-300 pt-3 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">Revisado / Consejo</div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}