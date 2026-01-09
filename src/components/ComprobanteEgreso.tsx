"use client";
import React from "react";
import { Printer, X, Building2 } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function ComprobanteEgreso({ datos, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center p-4 overflow-y-auto">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2cm; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      <div className="no-print w-full max-w-3xl bg-white/10 p-6 rounded-[2.5rem] mb-6 flex justify-between items-center border border-white/10">
        <h3 className="text-white font-black uppercase tracking-tighter">Comprobante de Egreso</h3>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-rose-500 hover:bg-rose-400 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all"><Printer size={18} /> Imprimir</button>
          <button onClick={onClose} className="text-white hover:bg-white/10 p-4 rounded-2xl transition-all"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-3xl bg-white p-12 border border-slate-300 text-slate-800 font-sans shadow-2xl flex flex-col min-h-[600px]">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-8">
           <img src="/logo.png" alt="Logo" className="w-40 h-auto" />
           <div className="text-right">
              <h2 className="font-black text-xl leading-none mb-1">COMPROBANTE DE EGRESO</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 italic">Documento Oficial de Contabilidad</p>
              <div className="bg-slate-900 text-white px-6 py-3 rounded-xl inline-block">
                 <span className="text-[9px] font-bold opacity-50 mr-2 uppercase">Nº Recibo</span>
                 <span className="text-xl font-black"># {datos.numero}</span>
              </div>
           </div>
        </div>

        {/* INFO CUERPO */}
        <div className="space-y-px">
          <div className="grid grid-cols-12 border border-slate-900">
             <div className="col-span-8 p-4 border-r border-slate-900 bg-slate-50"><span className="text-[9px] font-black text-slate-400 block mb-1">CIUDAD Y FECHA</span> <span className="font-black">SOACHA, {datos.fecha}</span></div>
             <div className="col-span-4 p-4"><span className="text-[9px] font-black text-slate-400 block mb-1">VALOR TOTAL</span> <span className="font-black text-xl text-rose-600">${Number(datos.valor).toLocaleString()}</span></div>
          </div>
          <div className="p-4 border border-slate-900">
             <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase">PAGADO A:</span> 
             <span className="font-black text-lg uppercase tracking-tight">{datos.pagado_a}</span>
          </div>
          <div className="p-4 border border-slate-900 bg-slate-50 italic">
             <span className="text-[9px] font-black text-slate-400 block mb-1 not-italic">LA SUMA DE:</span> 
             <span className="font-bold">{numeroALetras(Number(datos.valor))}</span>
          </div>
          <div className="p-4 border border-slate-900 min-h-[100px]">
             <span className="text-[9px] font-black text-slate-400 block mb-1 uppercase">POR CONCEPTO DE:</span> 
             <span className="font-black text-lg uppercase leading-tight">{datos.concepto}</span>
          </div>
        </div>

        {/* FIRMAS */}
        <div className="mt-auto grid grid-cols-3 gap-10 pt-20">
           <div className="border-t border-slate-400 pt-2 text-[9px] font-black text-slate-400 uppercase text-center">Elaboró</div>
           <div className="border-t border-slate-400 pt-2 text-[9px] font-black text-slate-400 uppercase text-center">Aprobó</div>
           <div className="border-b border-slate-200 h-16 relative flex items-end justify-center">
              <span className="text-[9px] font-black text-slate-300 uppercase mb-1">Firma Beneficiario / C.C.</span>
           </div>
        </div>

      </div>
    </div>
  );
}