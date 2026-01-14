"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, Printer, Loader2, TrendingUp, TrendingDown, Scale, History, 
  ChevronDown, Search, ArrowRight, Building2, Calendar
} from "lucide-react";

export default function Reportes() {
  const [tipo, setTipo] = useState("General");
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<{ingresos: any[], egresos: any[]} | null>(null);

  async function generarReporte() {
    if (!mes) return;
    setLoading(true);
    
    // Obtenemos el rango del mes seleccionado
    const primerDia = `${mes}-01`;
    const ultimoDia = `${mes}-31`;

    try {
      const [resIng, resEgr] = await Promise.all([
        supabase.from("pagos").select("*").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia),
        supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia)
      ]);

      setReporteData({ 
        ingresos: resIng.data || [], 
        egresos: resEgr.data || [] 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalIng = reporteData?.ingresos.reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;
  const totalEgr = reporteData?.egresos.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
  const balance = totalIng - totalEgr;

  // Lógica para corregir el nombre del mes (Enero 2026 etc)
  const obtenerNombreMes = (mesString: string) => {
    if (!mesString) return "";
    const [anio, mesNum] = mesString.split("-");
    const fecha = new Date(parseInt(anio), parseInt(mesNum) - 1, 1);
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(fecha);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-2 md:px-0 font-sans">
      
      {/* 1. BARRA DE CONTROL (FILTROS) */}
      <section className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest leading-none">Módulo de Auditoría</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase mt-1">Reportes contables</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full lg:justify-end">
            <div className="relative w-full sm:w-56 group">
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-600 text-xs appearance-none" 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)}
              >
                <option>General</option>
                <option>Solo Ingresos</option>
                <option>Solo Egresos</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            </div>

            <div className="relative w-full sm:w-48">
              <input 
                type="month" 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-600 text-xs cursor-pointer" 
                onChange={(e) => { setMes(e.target.value); setReporteData(null); }} 
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={generarReporte} 
                  disabled={loading || !mes} 
                  className="flex-1 sm:flex-none bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "GENERAR"}
                </button>

                {reporteData && (
                  <button 
                    onClick={() => window.print()} 
                    className="flex-1 sm:flex-none bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-95"
                  >
                    <Printer size={16} /> IMPRIMIR
                  </button>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOJA DE VISTA PREVIA */}
      <div className="flex justify-center">
        {!reporteData ? (
          <div className="w-full py-32 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
             <Search className="mx-auto text-slate-200 mb-4" size={48} />
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Pendiente Selección de Datos</p>
          </div>
        ) : (
          <div id="report-print" className="w-full bg-white p-10 md:p-20 rounded-[2rem] border border-slate-100 shadow-2xl flex flex-col print:shadow-none print:border-0 print:m-0 print:p-0 animate-in slide-in-from-bottom-4">
            
            {/* CSS LOCAL IMPRESION CORREGIDO PARA MÚLTIPLES HOJAS */}
            <style>{`
              @media print { 
                body { background: white !important; height: auto !important; overflow: visible !important; }
                body * { visibility: hidden; } 
                #report-print, #report-print * { visibility: visible; } 
                #report-print { 
                  position: relative !important; 
                  left: 0 !important; 
                  top: 0 !important; 
                  width: 100% !important; 
                  height: auto !important;
                  margin: 0 !important; 
                  padding: 0 !important;
                  display: block !important;
                  overflow: visible !important;
                } 
                .no-print { display: none !important; } 
                tr { page-break-inside: avoid !important; }
                @page { size: letter; margin: 1.5cm; }
              }
            `}</style>

            {/* HEADER OFICIAL */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-10 mb-10">
               <div className="flex flex-col gap-6">
                  <img src="/logo.png" alt="Logo" className="w-36 h-auto" />
                  <div className="space-y-1">
                     <h2 className="text-xl font-black text-slate-900 leading-none uppercase">PARQUE DE LAS FLORES</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Contable del Conjunto Residencial</p>
                  </div>
               </div>
               <div className="text-right">
                  <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 mb-2">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Periodo Consultado</p>
                     <p className="text-sm font-black text-slate-900 uppercase">
                        {obtenerNombreMes(mes)}
                     </p>
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Emisión: {new Date().toLocaleDateString()}</p>
               </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <div className="p-6 border border-slate-100 bg-emerald-50 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest flex items-center gap-2">
                    <TrendingUp size={12}/> Ingreso Mensual
                  </p>
                  <p className="text-2xl font-black text-emerald-800 tabular-nums">${totalIng.toLocaleString('es-CO')}</p>
               </div>
               <div className="p-6 border border-slate-100 bg-rose-50 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-600 uppercase mb-1 tracking-widest flex items-center gap-2">
                    <TrendingDown size={12}/> Gasto Realizado
                  </p>
                  <p className="text-2xl font-black text-rose-800 tabular-nums">${totalEgr.toLocaleString('es-CO')}</p>
               </div>
               <div className="p-6 border border-slate-800 bg-slate-900 rounded-2xl text-white">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest flex items-center gap-2">
                    <Scale size={12}/> Balance Neto
                  </p>
                  <p className={`text-2xl font-black tabular-nums ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${balance.toLocaleString('es-CO')}
                  </p>
               </div>
            </div>

            {/* LISTADO DE INGRESOS */}
            <div className="flex-1 space-y-16">
              {(tipo === 'General' || tipo === 'Solo Ingresos') && (
                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 bg-slate-50 p-2 inline-block px-4 rounded-full border border-slate-100">01. Relación de Recaudos (Ingresos)</h4>
                   <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase">
                        <tr>
                          <th className="py-4 px-2">Unidad</th>
                          <th className="py-4 px-2">Concepto</th>
                          <th className="py-4 px-2 text-center">Fecha</th>
                          <th className="py-4 px-2 text-right">Monto Recaudado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reporteData.ingresos.map(i => (
                          <tr key={i.id}>
                            <td className="py-3 px-2 font-black text-slate-900">{i.unidad}</td>
                            <td className="py-3 px-2 uppercase font-medium">
                               {/* LIMPIEZA DE CONCEPTO PARA EL REPORTE */}
                               {i.concepto_texto && i.concepto_texto !== 'undefined' ? (
                                  i.concepto_texto.split("||").map((item: string, idx: number) => (
                                    <div key={idx}>• {item.split("|")[0]}</div>
                                  ))
                               ) : 'CUOTA ADM.'}
                            </td>
                            <td className="py-3 px-2 text-center italic text-slate-400">{i.fecha_pago}</td>
                            <td className="py-3 px-2 text-right font-bold text-slate-800 tabular-nums">${Number(i.monto_total).toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              )}

              {/* LISTADO DE EGRESOS */}
              {(tipo === 'General' || tipo === 'Solo Egresos') && (
                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 bg-slate-50 p-2 inline-block px-4 rounded-full border border-slate-100">02. Relación de Gastos (Salidas)</h4>
                   <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase">
                        <tr>
                          <th className="py-4 px-2">Proveedor / Beneficiario</th>
                          <th className="py-4 px-2">Concepto</th>
                          <th className="py-4 px-2 text-center">Fecha</th>
                          <th className="py-4 px-2 text-right">Gasto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {reporteData.egresos.map(e => (
                          <tr key={e.id}>
                            <td className="py-3 px-2 font-black text-slate-900 uppercase">{e.pagado_a}</td>
                            <td className="py-3 px-2 italic">{e.concepto}</td>
                            <td className="py-3 px-2 text-center text-slate-400">{e.fecha}</td>
                            <td className="py-3 px-2 text-right font-bold tabular-nums text-rose-600">${Number(e.monto).toLocaleString('es-CO')}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              )}
            </div>

            {/* SECCIÓN FIRMAS LEGAL */}
            <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-20">
               <div className="flex flex-col items-center">
                  <div className="w-full border-t border-slate-400"></div>
                  <p className="text-[8px] font-black uppercase text-slate-300 mt-2">Responsable de Auditoría</p>
               </div>
               <div className="flex flex-col items-center">
                  <div className="w-full border-t border-slate-400"></div>
                  <p className="text-[8px] font-black uppercase text-slate-300 mt-2">Presidente de Consejo</p>
               </div>
            </div>

            <div className="mt-10 pt-10 text-center opacity-30 text-[8px] font-black uppercase tracking-[0.4em]">
               Informe de Certificación Integrada • Admin Flores
            </div>
          </div>
        )}
      </div>

    </div>
  );
}