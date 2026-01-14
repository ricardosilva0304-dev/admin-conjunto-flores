"use client";
import React, { useState } from "react";
import { Printer, X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { numeroALetras } from "@/lib/utils";
import emailjs from '@emailjs/browser';

interface ReciboProps {
  datos: {
    numero: string;
    fecha: string;
    nombre: string;
    unidad: string;
    valor: number;
    concepto: string; 
    metodo: string;
    comprobante: string;
    saldoAnterior: number;
    email: string;
  };
  onClose: () => void;
}

const ReciboContenido = ({ datos }: { datos: any }) => {
  // Procesamos las líneas del concepto para separar nombre de valor
  const lineasConcepto = datos.concepto.split("||");

  return (
    <div className="w-full bg-white p-12 border border-slate-300 text-slate-800 font-sans text-[11.5px] leading-snug h-[13.8cm] flex flex-col relative box-border overflow-hidden">
      
      {/* HEADER: LOGO GRANDE Y TEXTO CENTRADO */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
        <div className="w-[180px]">
          <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
        </div>
        
        <div className="flex-1 text-center px-4">
          <h2 className="font-black text-[13.5px] uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h2>
          <p className="font-bold text-[9px] text-slate-600">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
          <div className="text-[8.5px] text-slate-500 mt-1">
            <span className="font-black">BANCO CAJA SOCIAL • Cta. Ahorros 24511819298</span>
            <p className="mt-1">Cel.: 315 340 0657 • e-mail: cr.parquedelasflores@gmail.com</p>
          </div>
        </div>

        <div className="w-[150px] border-2 border-slate-900 p-2 text-center rounded-sm bg-slate-50">
          <p className="font-black text-[9px] uppercase tracking-tighter text-slate-400 mb-0.5">Recibo de Caja</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">Nº {datos.numero}</p>
        </div>
      </div>

      {/* CUADRO TÉCNICO DE DATOS */}
      <div className="border border-slate-900 rounded-sm mb-1">
        <div className="flex border-b border-slate-900">
          <div className="flex-1 p-2.5 border-r border-slate-900 bg-slate-50/30 uppercase">
            <span className="font-black text-[8px] text-slate-400 mr-4 tracking-widest uppercase">Ciudad y Fecha:</span> 
            <span className="font-bold text-[12px]">SOACHA, {datos.fecha}</span>
          </div>
          <div className="w-[200px] p-2.5 bg-slate-100 flex items-center justify-between">
            <span className="font-black text-[8px] text-slate-400 uppercase">Valor Pago:</span> 
            <span className="font-black text-emerald-600 text-lg tabular-nums leading-none">${datos.valor.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="flex border-b border-slate-900 uppercase font-bold text-[12px]">
          <div className="flex-1 p-2.5 border-r border-slate-900">
            <span className="text-[8px] font-black text-slate-300 mr-4 uppercase">Recibido de:</span> {datos.nombre}
          </div>
          <div className="w-[200px] p-2.5 text-center bg-white italic tracking-widest uppercase">
            <span className="text-[8px] font-black text-slate-300 mr-2 uppercase tracking-tighter">Unidad:</span> {datos.unidad}
          </div>
        </div>

        <div className="p-2.5 border-b border-slate-900 italic text-[11px] font-bold bg-slate-50/10">
          <span className="not-italic uppercase font-black mr-4 text-[8px] text-slate-300 tracking-widest">La suma de:</span> 
          {numeroALetras(datos.valor)}
        </div>

        {/* DETALLE POR ITEM: CONCEPTOS Y VALORES INDIVIDUALES */}
        <div className="bg-white min-h-[90px] flex flex-col uppercase font-bold">
           <div className="p-2 border-b border-slate-50 text-[8px] font-black text-slate-400 tracking-[0.2em] bg-slate-50/50">Desglose de Causaciones Pagadas</div>
           <div className="flex-1 px-4 py-2 space-y-1">
             {lineasConcepto.map((linea: string, idx: number) => {
               const [label, price] = linea.split("|");
               return (
                 <div key={idx} className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-700">- {label || "CARGO ADM."}</span>
                    <span className="text-slate-900 tabular-nums font-black">{price || "---"}</span>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* METODO PAGO */}
      <div className="border border-slate-900 px-6 py-2.5 mb-6 bg-slate-50/30 flex items-center gap-12 text-[10px] font-black">
         <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black">{datos.metodo === 'Efectivo' ? 'X' : ''}</div> 
            <span>EFECTIVO</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black">{datos.metodo !== 'Efectivo' ? 'X' : ''}</div> 
            <span>BANCO / TRANSFERENCIA</span>
         </div>
         <div className="flex-1 text-[9px] text-slate-400 text-right pr-2 italic uppercase">Ref: {datos.comprobante || 'TRANSACCIÓN DIGITAL'}</div>
      </div>

      {/* ESTADO DE SALDOS: FILA LIMPIA */}
      <div className="flex justify-between items-center px-12 mb-10 mt-2 py-4 border-y border-slate-100 bg-[#fdfdfd]">
        <div className="text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Saldo Ant.</p>
           <p className="font-bold text-base text-slate-500 tabular-nums">${datos.saldoAnterior.toLocaleString('es-CO')}</p>
        </div>
        <div className="text-slate-200 font-light text-2xl pb-1">-</div>
        <div className="text-center group scale-105">
           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Abono Aplicado</p>
           <p className="font-black text-xl text-emerald-600 tabular-nums leading-none tracking-tighter italic">${datos.valor.toLocaleString('es-CO')}</p>
        </div>
        <div className="text-slate-200 font-light text-2xl pb-1">=</div>
        <div className="text-center">
           <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Saldo Pendiente</p>
           <p className="font-black text-xl text-rose-600 tabular-nums tracking-tighter italic">${Math.max(0, datos.saldoAnterior - datos.valor).toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* FIRMAS LEGALES */}
      <div className="flex justify-between items-end mt-auto gap-24 px-8 pb-2">
        <div className="flex-1 border-t-2 border-slate-900 pt-1 text-[9px] font-black uppercase text-slate-400 text-center tracking-widest italic">Elaborado</div>
        <div className="flex-1 border-t-2 border-slate-900 pt-1 text-[9px] font-black uppercase text-slate-400 text-center tracking-widest italic">Recibido</div>
        <div className="w-[100px] border border-slate-50 flex flex-col items-center justify-center py-2 opacity-10">
           <div className="border p-1 text-[7px] font-black uppercase rotate-12 leading-none text-center">Sello Administrativo <br/> Flores</div>
        </div>
      </div>

      <div className="text-center mt-6">
         <p className="text-[8px] font-black italic text-emerald-700 tracking-[0.2em] border-t border-slate-100 pt-3">
           "Su cumplimiento oportuno fortalece el progreso de nuestra Agrupación Residencial"
         </p>
      </div>
    </div>
  );
};

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  return (
    <div className="fixed inset-0 bg-[#080a0c]/95 backdrop-blur-xl z-[200] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #receipt-doc, #receipt-doc * { visibility: visible; } 
          #receipt-doc { 
            position: absolute; 
            left: 0; right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            margin: 0; padding: 0;
          } 
          @page { size: letter; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ACCIONES (PANTALLA) */}
      <div className="no-print w-full max-w-4xl bg-white p-4 rounded-b-2xl md:rounded-3xl mb-8 flex justify-between items-center shadow-2xl border border-slate-200 animate-in slide-in-from-top-4">
        <div className="flex gap-2 pl-4">
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs tracking-widest active:scale-95 shadow-xl transition-all">
             <Printer size={16} className="inline mr-2" /> IMPRIMIR RECIBO
           </button>
        </div>
        <button onClick={onClose} className="p-4 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all text-slate-300">
          <X size={28}/>
        </button>
      </div>

      <div id="receipt-doc" className="w-full max-w-4xl px-2 md:px-0 animate-in zoom-in-95 duration-500">
          <ReciboContenido datos={datos} />
      </div>
    </div>
  );
}