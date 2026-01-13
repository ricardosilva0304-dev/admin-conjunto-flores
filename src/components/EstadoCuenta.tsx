"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Building2, Wallet, History, FileText, CheckCircle2, User } from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("residente_id", residente.id)
        .order('fecha_pago', { ascending: false });

      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  // Cálculos Avanzados
  const totalGeneradoOriginal = deudas.reduce((acc: number, d: any) => acc + Number(d.monto_original || 0), 0);
  const totalAbonado = pagos.reduce((acc: number, p: any) => acc + Number(p.monto_total || 0), 0);
  const deudaVigenteActual = deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente || 0), 0);

  if (loading) return (
    <div className="fixed inset-0 bg-white/90 z-[110] flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-slate-300" size={40} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando Informe...</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col items-center p-0 md:p-6 overflow-y-auto no-scrollbar">
      
      {/* LÓGICA DE IMPRESIÓN LIMPIA */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2cm; background: white; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* TOOLBAR SUPERIOR (Oculto en impresión) */}
      <div className="no-print w-full max-w-5xl bg-white border-b md:border md:rounded-2xl p-4 flex justify-between items-center shadow-2xl md:mb-6 sticky top-0 z-[120]">
        <div className="flex items-center gap-3 px-2">
           <FileText className="text-slate-400" size={18} />
           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Informe: Unidad {residente.torre.replace("Torre ","T")}-{residente.apartamento}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tighter hover:bg-emerald-600 transition-all active:scale-95 shadow-lg">
             <Printer size={14} className="inline mr-2" /> Imprimir Documento
           </button>
           <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500"><X /></button>
        </div>
      </div>

      {/* DOCUMENTO PRINCIPAL */}
      <div id="print-area" className="w-full max-w-5xl bg-white p-8 md:p-16 border border-slate-100 shadow-xl flex flex-col text-slate-800 font-sans min-h-[1050px]">
        
        {/* ENCABEZADO MINIMALISTA */}
        <div className="flex flex-col md:flex-row justify-between border-b-4 border-slate-900 pb-10 mb-10">
           <div className="space-y-4">
              <img src="/logo.png" alt="Logo" className="w-44 h-auto object-contain" />
              <div className="space-y-0.5">
                <h2 className="font-black text-lg text-slate-900 leading-none">AGRUPACIÓN RES. EL PARQUE DE LAS FLORES</h2>
                <p className="text-[9px] text-slate-500 font-black tracking-widest">NIT. 832.011.421-3 • RÉGIMEN PROPIEDAD HORIZONTAL</p>
              </div>
           </div>
           <div className="mt-8 md:mt-0 flex flex-col items-end">
              <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl text-center shadow-inner">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Unidad Habitacional</p>
                <h1 className="text-3xl font-black text-slate-900 tabular-nums italic tracking-tighter">T{residente.torre.replace("Torre ", "")}-{residente.apartamento}</h1>
              </div>
              <p className="text-[9px] font-bold text-slate-300 mt-4 uppercase">Estado al día: {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
           </div>
        </div>

        {/* INFO DEL TITULAR Y RESUMEN KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
           <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Propietario Responsable</p>
              <h4 className="text-2xl font-black text-slate-900 leading-none uppercase tracking-tighter">{residente.nombre || 'RICARDO SILVA'}</h4>
              <p className="text-emerald-600 font-bold text-xs mt-2 underline decoration-2 underline-offset-4">{residente.email || 'Email no suministrado'}</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-200 p-5 rounded-2xl text-center">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Abonado a Hoy</p>
                 <p className="text-xl font-black text-emerald-600 tracking-tighter">${totalAbonado.toLocaleString('es-CO')}</p>
              </div>
              <div className="border border-slate-200 p-5 rounded-2xl bg-rose-50 border-rose-100 text-center">
                 <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Saldo Exigible</p>
                 <p className="text-xl font-black text-rose-600 tracking-tighter underline underline-offset-4 decoration-2 decoration-rose-200">
                    ${deudaVigenteActual.toLocaleString('es-CO')}
                 </p>
              </div>
           </div>
        </div>

        {/* CONTENIDO TABULAR INTEGRADO */}
        <div className="flex-1 space-y-16">
          
          {/* TABLA DE DEUDAS PENDIENTES */}
          <div>
            <div className="flex items-center gap-3 mb-6 bg-slate-900 p-3 rounded-lg text-white">
              <Wallet size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Saldos Facturados con Cobro Pendiente</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-black border-b border-slate-100 uppercase text-[9px]">
                 <tr>
                    <th className="py-4 px-3 italic">Periodo Fiscal</th>
                    <th className="py-4 px-3">Obligación / Detalle</th>
                    <th className="py-4 px-3 text-right">Vr. Causado</th>
                    <th className="py-4 px-3 text-right">Vr. Pendiente</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold uppercase">
                 {deudas.map((d: any) => (
                    <tr key={d.id} className="text-slate-600 group hover:bg-slate-50">
                       <td className="py-4 px-3 text-slate-900">{d.causaciones_globales?.mes_causado}</td>
                       <td className="py-4 px-3 font-normal tracking-tight text-[10px]">{d.concepto_nombre || "PAGO ADMINISTRACIÓN MENSUAL"}</td>
                       <td className="py-4 px-3 text-right text-slate-300 font-light">${Number(d.monto_original).toLocaleString()}</td>
                       <td className="py-4 px-3 text-right text-rose-600 font-black text-sm">${Number(d.saldo_pendiente).toLocaleString()}</td>
                    </tr>
                 ))}
                 {deudas.length === 0 && (
                   <tr><td colSpan={4} className="py-20 text-center flex flex-col items-center opacity-30 italic"><CheckCircle2 className="mb-2" size={32}/>Unidad al día en obligaciones financieras.</td></tr>
                 )}
              </tbody>
            </table>
          </div>

          {/* TABLA DE HISTORIAL DE PAGOS */}
          <div>
            <div className="flex items-center gap-3 mb-6 bg-slate-100 p-3 rounded-lg">
              <History size={16} className="text-emerald-600" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recibos de Caja Ingresados al Sistema</h3>
            </div>
            <table className="w-full text-left text-xs border-dashed border-2 border-slate-50 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[9px] uppercase border-b border-slate-100">
                 <tr>
                    <th className="py-4 px-4">Comprobante No.</th>
                    <th className="py-4 px-4 text-center">Fecha Operación</th>
                    <th className="py-4 px-4">Modo de Pago</th>
                    <th className="py-4 px-4 text-right">Crédito (+)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 uppercase font-medium">
                 {pagos.map((p: any) => (
                    <tr key={p.id}>
                       <td className="py-4 px-4 font-black text-slate-800 italic">RC #{p.numero_recibo}</td>
                       <td className="py-4 px-4 text-center font-bold tracking-tighter text-slate-400">{p.fecha_pago}</td>
                       <td className="py-4 px-4 text-[9px]">{p.metodo_pago}</td>
                       <td className="py-4 px-4 text-right font-black text-emerald-600 tracking-tight">$ {Number(p.monto_total).toLocaleString()}</td>
                    </tr>
                 ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* PIE DE DOCUMENTO CORPORATIVO */}
        <div className="mt-auto pt-16 flex flex-col items-center">
           <div className="w-full flex justify-between px-16 mb-20 opacity-30">
              <div className="w-48 border-t border-slate-300 h-0.5 pt-2 text-[8px] font-bold text-center">ELABORADO POR SISTEMA</div>
              <div className="w-48 border-t border-slate-300 h-0.5 pt-2 text-[8px] font-bold text-center">CONTROL DE CONSEJO</div>
           </div>
           <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-3 leading-relaxed underline decoration-2 underline-offset-8 decoration-emerald-500 italic">
              CONJUNTO RESIDENCIAL PARQUE DE LAS FLORES
           </p>
           <p className="text-[9px] text-slate-400 text-center font-medium max-w-md">
             Certificación automática para soporte administrativo y legal.<br/> 
             Cualquier duda administrativa favor contactar vía: <span className="text-slate-600 font-black">cr.parquedelasflores@gmail.com</span>
           </p>
        </div>

      </div>
    </div>
  );
}