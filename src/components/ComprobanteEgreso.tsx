"use client";
import React from "react";
import { Printer, X, FileText, Landmark, User, CheckSquare } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function ComprobanteEgreso({ datos, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-[#0a0c0e]/95 backdrop-blur-md z-[150] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">

      {/* LÓGICA DE IMPRESIÓN CENTRADA */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area-egreso, #print-area-egreso * { visibility: visible; } 
          #print-area-egreso { 
            position: absolute; 
            left: 0; 
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            padding: 0 1cm !important;
            margin: 0 !important;
          } 
          @page { size: letter; margin: 0; }
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* BARRA DE ACCIONES (PANTALLA) */}
      <div className="no-print w-full max-w-4xl bg-white border border-slate-100 p-5 md:rounded-3xl shadow-2xl flex justify-between items-center mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
          >
            <Printer size={18} /> IMPRIMIR CENTRADO
          </button>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-300 hover:text-slate-900 rounded-xl transition-all">
          <X size={24} />
        </button>
      </div>

      {/* CUERPO DEL DOCUMENTO (RÉPLICA EJECUTIVA) */}
      <div id="print-area-egreso" className="w-full max-w-4xl bg-white p-12 border border-slate-300 shadow-sm font-sans text-slate-800 relative h-[13.5cm] flex flex-col box-border overflow-hidden">

        {/* HEADER */}
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
          <div className="w-40 border-2 border-slate-900 p-3 text-center bg-slate-50 rounded-sm">
            <p className="text-[9px] font-black uppercase mb-1 opacity-40">Folio de Gasto</p>
            <p className="text-2xl font-black text-slate-900 tracking-widest leading-none"># {datos.numero}</p>
          </div>
        </div>

        {/* CUADRO TÉCNICO DE GASTO */}
        <div className="space-y-1 mb-6">
          <div className="flex border border-slate-800 uppercase text-[11px] font-bold">
            <div className="flex-1 p-3 border-r border-slate-800 bg-slate-50/50 flex items-center">
              <span className="opacity-40 text-[9px] font-black uppercase mr-4 tracking-widest">Ciudad y Fecha:</span>
              <span className="font-black">SOACHA, {datos.fecha}</span>
            </div>
            <div className="w-1/3 p-3 flex items-center justify-between">
              <span className="opacity-40 text-[9px] font-black">VALOR TOTAL:</span>
              <span className="font-black text-rose-600 text-lg tabular-nums">
                ${Number(datos.valor).toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          <div className="flex border border-slate-800 uppercase text-[11px] font-bold">
            <div className="flex-1 p-3 flex items-center">
              <span className="opacity-40 text-[9px] font-black uppercase mr-4 tracking-widest">Pagado a (Beneficiario):</span>
              <span className="font-black text-[13px]">{datos.pagado_a}</span>
            </div>
          </div>

          <div className="p-3 border border-slate-800 bg-slate-50/20 italic text-[11px] font-bold">
            <span className="not-italic uppercase font-black mr-4 text-[8px] text-slate-400 tracking-widest">La suma de (Letras):</span>
            <span className="text-slate-900 uppercase">{numeroALetras(Number(datos.valor))}</span>
          </div>

          <div className="flex border border-slate-800 uppercase font-bold text-[11px] min-h-[60px]">
            <div className="flex-1 p-3 border-r border-slate-800">
              <span className="opacity-40 text-[9px] font-black block mb-1 uppercase tracking-widest">Por Concepto detallado de:</span>
              <p className="leading-snug text-slate-700 tracking-tighter">
                - {datos.concepto}
              </p>
            </div>
            <div className="w-1/3 p-3 flex flex-col justify-end text-right border-l border-slate-800">
              <span className="opacity-30 text-[8px] font-black">Subtotal Egreso</span>
              <p className="font-black text-slate-400 tabular-nums">${Number(datos.valor).toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>

        {/* MÉTODO DE PAGO - ESTILO CONTABLE */}
        <div className="grid grid-cols-12 gap-8 items-center mb-8 border border-slate-200 p-4 rounded-xl">
          <div className="col-span-5 flex items-center gap-8 text-[10px] font-black">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center bg-white shadow-sm">
                {datos.metodo === 'Efectivo' ? 'X' : ''}
              </div>
              <span>EFECTIVO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center bg-white shadow-sm">
                {datos.metodo !== 'Efectivo' ? 'X' : ''}
              </div>
              <span>TRANSF. BANCARIA</span>
            </div>
          </div>
          <div className="col-span-7 text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none italic underline underline-offset-4 decoration-rose-200 decoration-2">
              "Todo egreso requiere soporte original adjunto"
            </p>
          </div>
        </div>

        {/* SECCIÓN FIRMAS LEGALES */}
        <div className="grid grid-cols-3 gap-12 mt-auto pb-4">
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-slate-300 mb-2"></div>
            <p className="text-[8px] font-black uppercase text-slate-400">Elaboró (Tesorería)</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-t border-slate-300 mb-2"></div>
            <p className="text-[8px] font-black uppercase text-slate-400">Aprobó (Consejo)</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full border-b border-slate-200 h-8 mb-2"></div>
            <p className="text-[8px] font-black uppercase text-slate-400">C.C. / Firma Recibido</p>
          </div>
        </div>

        <p className="text-center text-[7px] font-black uppercase tracking-[0.4em] text-slate-200 mt-6 border-t border-slate-50 pt-2">
          Certificado Oficial de Gastos Administrativos • Parque de las Flores v1.0
        </p>

      </div>

      <p className="no-print mt-10 text-[10px] text-rose-500/50 font-black uppercase tracking-[0.5em] animate-pulse">
        Vista de comprobante finalizada
      </p>
    </div>
  );
}