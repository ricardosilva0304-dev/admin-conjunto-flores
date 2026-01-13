"use client";
import React, { useState } from "react";
import { Printer, X, Send, Loader2, Building2 } from "lucide-react";
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

const ReciboContenido = ({ datos }: { datos: any }) => (
  /* Altura controlada de 13.5cm para que se perciba como 'medio oficio' y no llene la hoja */
  <div className="w-full bg-white p-10 border border-slate-300 text-slate-800 font-sans text-[11px] leading-snug h-[13.5cm] flex flex-col relative box-border overflow-hidden">

    {/* HEADER CORREGIDO: Logo y Textos alineados */}
    <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
      <div className="w-[120px] flex items-center">
        <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
      </div>

      <div className="flex-1 text-center px-4">
        <h2 className="font-black text-[13px] uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h2>
        <p className="font-bold text-[9px] text-slate-600">NIT. 832.011.421-3 • DG 9 #4B-90 • Soacha, Cundinamarca</p>
        <div className="text-[8px] text-slate-500 space-x-2 mt-1">
          <span>Cel.: 315 340 0657</span>
          <span>•</span>
          <span>Convenio 15939402 Torre - Apto</span>
        </div>
        <div className="text-[8px] text-slate-500 space-x-2 mt-1">
          <span>Cta. Ahorros 24511819298 Banco Caja Social</span>
          <span>correo: cr.parquedelasflores@gmail.com </span>
        </div>
      </div>

      <div className="w-[150px] border-2 border-slate-900 p-2 text-center rounded-md bg-slate-50 shadow-inner">
        <p className="font-black text-[9px] uppercase text-slate-400 mb-0.5 tracking-widest">Recibo de Caja</p>
        <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">Nº {datos.numero}</p>
      </div>
    </div>

    {/* ESTRUCTURA TABULAR SIMPLIFICADA */}
    <div className="border border-slate-900 rounded-sm mb-1 overflow-hidden">
      <div className="flex border-b border-slate-900">
        <div className="flex-1 p-2 border-r border-slate-900 bg-slate-50/30 uppercase">
          <span className="font-black text-[8px] text-slate-400 mr-2 uppercase tracking-tighter">Ciudad y Fecha:</span>
          <span className="font-bold text-[12px]">SOACHA, {datos.fecha}</span>
        </div>
        <div className="w-[180px] p-2 bg-slate-100 flex items-center justify-between">
          <span className="font-black text-[8px] text-slate-400">VALOR:</span>
          <span className="font-black text-emerald-600 text-lg">${datos.valor.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="flex border-b border-slate-900 uppercase font-bold text-[11px]">
        <div className="flex-1 p-2 border-r border-slate-900"><span className="text-[8px] font-black text-slate-300 mr-2 uppercase tracking-tighter">Recibido de:</span> {datos.nombre}</div>
        <div className="w-[180px] p-2 text-center"><span className="text-[8px] font-black text-slate-300 mr-2 uppercase tracking-tighter">Unidad:</span> T{datos.unidad.replace("T", "")}</div>
      </div>

      <div className="p-2 border-b border-slate-900 italic text-[10px] font-bold">
        <span className="not-italic uppercase font-black mr-2 text-[8px] text-slate-300 tracking-tighter">La suma de:</span>
        {numeroALetras(datos.valor)}
      </div>

      <div className="flex font-bold text-[10px] uppercase min-h-[50px]">
        <div className="flex-1 p-2 border-r border-slate-900">
          <span className="text-[8px] font-black text-slate-300 block mb-1 tracking-tighter">Concepto detallado de la operación</span>
          - {datos.concepto}
        </div>
        <div className="w-[180px] p-2 text-right flex flex-col justify-end font-black text-xs tabular-nums text-slate-400">
          ${datos.valor.toLocaleString('es-CO')}
        </div>
      </div>
    </div>

    {/* METODO DE PAGO COMPACTO */}
    <div className="border border-slate-900 px-6 py-2 mb-6 bg-slate-50/50 flex items-center gap-10 text-[9px] font-bold">
      <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center">{datos.metodo === 'Efectivo' ? 'X' : ''}</div> <span>EFECTIVO</span></div>
      <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center">{datos.metodo === 'Transferencia' ? 'X' : ''}</div> <span>BANCO</span></div>
      <div className="flex-1 italic font-medium text-slate-400 text-right pr-2 tracking-tighter uppercase">Comprobante Soporte: {datos.comprobante || '---'}</div>
    </div>

    {/* BALANCE DE SALDOS - REDISEÑO SIMPLE Y ELEGANTE */}
    <div className="flex justify-between items-center px-10 mb-8 mt-4">
      <div className="text-center group">
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Saldo Anterior</p>
        <p className="font-bold text-slate-500 tabular-nums">${datos.saldoAnterior.toLocaleString()}</p>
      </div>
      <div className="h-6 w-px bg-slate-200"></div>
      <div className="text-center px-4">
        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mb-0.5 underline underline-offset-4 decoration-1 decoration-emerald-200">Abono Registrado</p>
        <p className="font-black text-[13px] text-emerald-600 tabular-nums">${datos.valor.toLocaleString()}</p>
      </div>
      <div className="h-6 w-px bg-slate-200"></div>
      <div className="text-center">
        <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest">Saldo Restante</p>
        <p className="font-black text-[15px] text-rose-600 tabular-nums">${(datos.saldoAnterior - datos.valor).toLocaleString()}</p>
      </div>
    </div>

    {/* FIRMAS MINIMALISTAS */}
    <div className="flex justify-between items-end mt-auto gap-20">
      <div className="flex-1 border-t border-slate-300 pt-1 text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Firma Elaborado</div>
      <div className="flex-1 border-t border-slate-300 pt-1 text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Firma Recibido</div>
      <div className="w-[80px] text-[7px] font-black uppercase opacity-20 text-center italic leading-tight">
        Sello <br /> Admon.
      </div>
    </div>

    <p className="text-center text-[8px] font-black italic text-emerald-700 bg-emerald-50/50 py-1.5 rounded-lg mt-6 tracking-tight">
      "Su cumplimiento oportuno fortalece el progreso de nuestra Agrupación Residencial"
    </p>
  </div>
);

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const [enviando, setEnviando] = useState(false);

  return (
    <div className="fixed inset-0 bg-[#0a0c0e]/95 backdrop-blur-md z-[150] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">

      {/* CSS DE IMPRESIÓN CORREGIDO: Centro de la hoja Letter */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-section, #print-section * { visibility: visible; } 
          #print-section { 
            position: absolute; 
            left: 0; 
            right: 0;
            top: 50%; /* Centro de la página */
            transform: translateY(-50%);
            width: 100%;
            padding: 0 1cm !important;
            margin: 0 !important;
          } 
          @page { size: letter; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* CONTROLES PANTALLA */}
      <div className="no-print w-full max-w-4xl bg-white border border-slate-100 p-5 md:rounded-3xl shadow-2xl flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Printer size={18} /> Imprimir Centrado
          </button>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all">
          <X size={24} />
        </button>
      </div>

      {/* ÁREA DE CONTENIDO (CENTRADOR VIRTUAL) */}
      <div className="flex flex-col items-center w-full min-h-[calc(100vh-100px)]">
        <div id="print-section" className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
          <ReciboContenido datos={datos} />
        </div>
      </div>
    </div>
  );
}