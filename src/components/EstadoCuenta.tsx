"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, FileText } from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
   const [pagos, setPagos] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchPagos = async () => {
         const { data } = await supabase
            .from("pagos")
            .select("*") // <-- ESTA ES LA PARTE QUE FALTABA
            .eq("residente_id", residente.id)
            .order('fecha_pago', { ascending: false });

         if (data) setPagos(data);
         setLoading(false);
      };
      fetchPagos();
   }, [residente]);

   const saldoPendienteTotal = deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente || 0), 0);

   if (loading) return <div className="fixed inset-0 bg-white/80 z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

   return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center p-4 overflow-y-auto">
         <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 1cm; background: white; } 
          .no-print { display: none !important; } 
        }
      `}</style>

         {/* PANEL CONTROL */}
         <div className="no-print w-full max-w-4xl bg-white p-4 rounded-2xl mb-4 flex justify-between items-center shadow-lg">
            <h3 className="text-slate-700 font-bold uppercase text-sm ml-2">Estado de Cuenta: {residente.torre}-{residente.apartamento}</h3>
            <div className="flex gap-2">
               <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"><Printer size={16} /> Imprimir</button>
               <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
            </div>
         </div>

         <div id="print-area" className="w-full max-w-4xl bg-white p-12 border border-slate-200 shadow-sm flex flex-col text-slate-800 font-sans">

            {/* HEADER SENCILLO */}
            <div className="flex justify-between border-b-2 border-slate-800 pb-8 mb-8">
               <div>
                  <img src="/logo.png" alt="Logo" className="w-40 h-auto mb-4" />
                  <h2 className="font-black text-lg">AGRUPACIÓN RES. EL PARQUE DE LAS FLORES</h2>
                  <p className="text-xs text-slate-500 font-bold">NIT. 832.011.421-3 • Gestión de Cartera Individual</p>
               </div>
               <div className="text-right">
                  <h1 className="text-3xl font-black text-slate-900">T{residente.torre.replace("Torre ", "")}-{residente.apartamento}</h1>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Fecha Consulta: {new Date().toLocaleDateString()}</p>
               </div>
            </div>

            {/* INFO RESIDENTE */}
            <div className="grid grid-cols-2 mb-10 text-sm">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Propietario</p>
                  <p className="font-bold text-lg">{residente.nombre}</p>
                  <p className="text-slate-500 italic">{residente.email}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Pendiente a Pagar</p>
                  <p className="text-2xl font-black text-rose-600">${saldoPendienteTotal.toLocaleString()}</p>
               </div>
            </div>

            {/* TABLA UNIFICADA DE CARTERA */}
            <div className="mb-12">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 bg-slate-50 p-2 border-l-4 border-slate-400">Detalle de Cartera y Deudas</h4>
               <table className="w-full text-left text-xs border-collapse">
                  <thead>
                     <tr className="border-b-2 border-slate-200">
                        <th className="py-3 px-2 font-black uppercase">Periodo</th>
                        <th className="py-3 px-2 font-black uppercase">Descripción Concepto</th>
                        <th className="py-3 px-2 text-right font-black uppercase">Monto Inicial</th>
                        <th className="py-3 px-2 text-right font-black uppercase">Saldo Actual</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {deudas.map((d: any) => (
                        <tr key={d.id}>
                           <td className="py-3 px-2 font-bold">{d.causaciones_globales?.mes_causado}</td>
                           <td className="py-3 px-2 uppercase">{d.concepto_nombre || "Cuota Administrativa"}</td>
                           <td className="py-3 px-2 text-right text-slate-400">${Number(d.monto_original).toLocaleString()}</td>
                           <td className="py-3 px-2 text-right font-black text-rose-600">${Number(d.saldo_pendiente).toLocaleString()}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* TABLA UNIFICADA DE RECAUDO */}
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 bg-slate-50 p-2 border-l-4 border-emerald-400">Historial de Recibos y Abonos</h4>
               <table className="w-full text-left text-xs border-collapse">
                  <thead>
                     <tr className="border-b-2 border-slate-200 text-slate-400">
                        <th className="py-3 px-2 font-black">Nº RECIBO</th>
                        <th className="py-3 px-2 font-black">FECHA</th>
                        <th className="py-3 px-2 font-black">MÉTODO</th>
                        <th className="py-3 px-2 text-right font-black">MONTO ABONADO</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {pagos.map((p: any) => (
                        <tr key={p.id}>
                           <td className="py-3 px-2 font-bold text-slate-400 italic">#{p.numero_recibo}</td>
                           <td className="py-3 px-2">{p.fecha_pago}</td>
                           <td className="py-3 px-2 uppercase text-[10px]">{p.metodo_pago}</td>
                           <td className="py-3 px-2 text-right font-black text-emerald-600">+$ {Number(p.monto_total).toLocaleString()}</td>
                        </tr>
                     ))}
                     {pagos.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center italic text-slate-300">No hay pagos registrados.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            <div className="mt-auto pt-10 border-t border-slate-100 flex justify-between items-end">
               <div className="text-[9px] text-slate-400 uppercase italic">
                  Este documento certifica los saldos administrativos vigentes.<br />
                  Conjunto Residencial Parque de las Flores
               </div>
               <div className="w-40 border-t border-slate-300 pt-1 text-[9px] font-black text-center text-slate-400">Firma Administrador</div>
            </div>
         </div>
      </div>
   );
}