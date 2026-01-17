"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  FileText, Printer, Loader2, TrendingUp, TrendingDown, 
  Scale, Calendar, ChevronDown, Search 
} from "lucide-react";

export default function Reportes() {
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<{ ingresos: any[], egresos: any[] } | null>(null);

  async function generarReporte() {
    if (!mes) return;
    setLoading(true);

    const [anio, mesNum] = mes.split("-").map(Number);
    const primerDia = `${mes}-01`;
    const ultimoDiaNum = new Date(anio, mesNum, 0).getDate();
    const ultimoDia = `${mes}-${ultimoDiaNum}`;

    try {
      const [resIng, resEgr] = await Promise.all([
        supabase.from("pagos").select("*").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia).order('fecha_pago'),
        supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order('fecha')
      ]);

      setReporteData({ ingresos: resIng.data || [], egresos: resEgr.data || [] });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const totalIng = reporteData?.ingresos.reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;
  const totalEgr = reporteData?.egresos.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
  const balance = totalIng - totalEgr;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-2 md:px-0 font-sans">
      
      {/* SECCIÓN DE FILTROS (NO SE IMPRIME) */}
      <section className="bg-white p-4 rounded-xl border shadow-sm no-print flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <h2 className="font-black text-xs uppercase tracking-widest">Generador de Auditoría Mensual</h2>
        </div>
        
        <input 
          type="month" 
          className="bg-slate-50 border p-2 rounded-lg text-xs font-bold outline-none"
          onChange={(e) => { setMes(e.target.value); setReporteData(null); }}
        />
        
        <button 
          onClick={generarReporte} 
          disabled={loading || !mes}
          className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-xs font-bold disabled:opacity-30"
        >
          {loading ? <Loader2 className="animate-spin" /> : "GENERAR INFORME"}
        </button>

        {reporteData && (
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg text-xs font-bold">
            <Printer size={16} className="inline mr-2"/> IMPRIMIR
          </button>
        )}
      </section>

      {/* DOCUMENTO DE REPORTE */}
      {reporteData ? (
        <div id="print-report" className="w-full bg-white p-8 md:p-14 border border-slate-100 font-sans">
          
          <style>{`
            @media print {
              @page { size: letter; margin: 1.5cm; }
              body * { visibility: hidden; }
              #print-report, #print-report * { visibility: visible; }
              #print-report { position: absolute; left: 0; top: 0; width: 100%; }
              thead { display: table-header-group; } /* Repite encabezados en cada hoja */
              tr { page-break-inside: avoid; }
              .no-print { display: none !important; }
            }
          `}</style>

          {/* CABEZOTE COMPACTO */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="w-20" />
              <div>
                <h1 className="text-sm font-black uppercase italic">Reporte Mensual de Caja</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Conjunto Res. Parque de las Flores</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Periodo</p>
              <p className="text-lg font-black uppercase text-slate-900">{mes}</p>
            </div>
          </div>

          {/* RESUMEN EJECUTIVO (KPIs LINEALES) */}
          <div className="grid grid-cols-3 gap-4 mb-10 border-b pb-6">
            <div className="text-center">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Ingresos</p>
              <p className="text-xl font-black text-emerald-600 tabular-nums">${totalIng.toLocaleString()}</p>
            </div>
            <div className="text-center border-x">
              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Total Egresos</p>
              <p className="text-xl font-black text-rose-600 tabular-nums">${totalEgr.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Neto</p>
              <p className={`text-xl font-black tabular-nums ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* TABLA DE INGRESOS (DETALLADA) */}
          <div className="mb-12">
            <h3 className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 inline-block rounded mb-3">01. Relación de Recaudos</h3>
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 font-black uppercase text-slate-500">
                  <th className="py-2">Recibo</th>
                  <th>Unidad</th>
                  <th>Concepto Resumido</th>
                  <th>Fecha</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reporteData.ingresos.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="py-2 font-black">RC-{i.numero_recibo}</td>
                    <td className="font-bold">{i.unidad}</td>
                    <td className="uppercase text-slate-400 truncate max-w-[200px]">
                      {i.concepto_texto?.split("||")[0].split("|")[0] || "Administración"}
                    </td>
                    <td className="italic">{i.fecha_pago}</td>
                    <td className="text-right font-black text-emerald-600">${Number(i.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLA DE EGRESOS */}
          <div className="mb-16">
            <h3 className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1.5 inline-block rounded border mb-3">02. Relación de Gastos</h3>
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-400 font-black uppercase text-slate-400">
                  <th className="py-2">Egreso</th>
                  <th>Beneficiario</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reporteData.egresos.map(e => (
                  <tr key={e.id}>
                    <td className="py-2 font-black">CE-{e.recibo_n}</td>
                    <td className="font-bold uppercase">{e.pagado_a}</td>
                    <td className="italic text-slate-400">{e.concepto}</td>
                    <td>{e.fecha}</td>
                    <td className="text-right font-black text-rose-600">${Number(e.monto).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FIRMAS FINALES */}
          <div className="grid grid-cols-2 gap-20 mt-20 pt-10 border-t">
            <div className="text-center">
              <div className="w-full border-t border-slate-900 mb-2"></div>
              <p className="text-[9px] font-black uppercase">Firma Administrador / Revisor</p>
            </div>
            <div className="text-center">
              <div className="w-full border-t border-slate-900 mb-2"></div>
              <p className="text-[9px] font-black uppercase">Presidente de Consejo</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed rounded-3xl opacity-20 no-print">
          <Search size={48} className="mx-auto mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">Esperando Selección de Periodo</p>
        </div>
      )}
    </div>
  );
}