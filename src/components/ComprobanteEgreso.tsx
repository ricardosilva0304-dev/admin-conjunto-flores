"use client";
import React from "react";
import { Printer, X, FileText, Landmark, User, CheckSquare } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function ComprobanteEgreso({ datos, onClose }: any) {
  const cargos = datos.concepto && datos.concepto.includes("|")
    ? (datos.concepto.includes("||") ? datos.concepto.split("||") : [datos.concepto])
    : [`${datos.concepto}|${Number(datos.valor).toLocaleString('es-CO')}`];
  return (
    <div className="fixed inset-0 bg-[#0a0c0e]/95 backdrop-blur-md z-[150] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">

      {/* CSS DE IMPRESIÓN CENTRADA (IDÉNTICO AL DE CAJA) */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #receipt-doc-egreso, #receipt-doc-egreso * { visibility: visible; } 
          #receipt-doc-egreso { 
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

      {/* BARRA DE ACCIONES (PANTALLA) */}
      <div className="no-print w-full max-w-4xl bg-white p-4 rounded-b-2xl md:rounded-3xl mb-8 flex justify-between items-center shadow-2xl border border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-lg flex items-center gap-2"
          >
            <Printer size={16} /> IMPRIMIR EGRESO
          </button>
        </div>
        <button onClick={onClose} className="p-4 hover:bg-slate-50 text-slate-300 rounded-full transition-colors">
          <X size={26} />
        </button>
      </div>

      {/* CUERPO DEL DOCUMENTO */}
      <div id="receipt-doc-egreso" className="w-full max-w-4xl px-2 md:px-0 animate-in zoom-in-95 duration-500 pb-20">
        <div className="w-full bg-white p-12 border border-slate-300 text-slate-800 font-sans text-[11.5px] leading-tight h-auto min-h-[13.8cm] flex flex-col relative box-border overflow-visible shadow-sm print:shadow-none">

          {/* HEADER (Estilo Recibo de Caja) */}
          <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
            <div className="w-[180px]">
              <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
            </div>

            <div className="flex-1 text-center px-4">
              <h2 className="font-black text-[13px] uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h2>
              <p className="font-bold text-[9px] text-slate-600">NIT. 832.011.421-3 • DG 9 #4B-90 • Soacha, Cundinamarca</p>
              <div className="text-[8.5px] text-slate-500 space-x-2 mt-1">
                <span>Cel.: 315 340 0657</span>
                <span>•</span>
                <span>Convenio 15939402 Torre - Apto</span>
              </div>
              <div className="text-[8.5px] text-slate-500 space-x-2 mt-1">
                <span>Cta. Ahorros 24511819298 Banco Caja Social</span>
                <span>e-mail: cr.parquedelasflores@gmail.com</span>
              </div>
            </div>

            <div className="w-[160px] border-2 border-slate-900 p-2 text-center rounded-sm bg-slate-50 shadow-inner">
              <p className="font-black text-[9px] uppercase text-slate-400 mb-0.5 tracking-widest">Comprobante Egreso</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">Nº {datos.numero}</p>
            </div>
          </div>

          {/* CUADRO TÉCNICO DE DATOS */}
          <div className="border border-slate-900 rounded-sm mb-0.5">
            <div className="flex border-b border-slate-900">
              <div className="flex-1 p-2.5 border-r border-slate-900 bg-slate-50/30 uppercase">
                <span className="font-black text-[8.5px] text-slate-400 mr-4 tracking-widest uppercase">Ciudad y Fecha:</span>
                <span className="font-bold text-[12.5px]">SOACHA, {datos.fecha}</span>
              </div>
              <div className="w-[180px] p-2.5 bg-rose-50 flex items-center justify-between">
                <span className="font-bold text-[8.5px] text-rose-400">VALOR:</span>
                <span className="font-black text-rose-600 text-lg tabular-nums leading-none">${Number(datos.valor).toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="flex border-b border-slate-900 uppercase font-bold text-[11.5px]">
              <div className="flex-1 p-2.5"><span className="text-[8.5px] font-black text-slate-300 mr-4 uppercase">Pagado a:</span> {datos.pagado_a}</div>
            </div>

            <div className="p-2.5 border-b border-slate-900 italic text-[11px] font-bold bg-slate-50/10">
              <span className="not-italic uppercase font-black mr-4 text-[8px] text-slate-300 tracking-widest">La suma de:</span>
              {numeroALetras(Number(datos.valor))}
            </div>

            {/* CONCEPTO DETALLADO */}
            <div className="bg-white flex flex-col font-bold min-h-[100px]">
              <div className="p-1.5 border-b border-slate-50 text-[8px] font-black text-slate-400 tracking-[0.2em] bg-slate-50/50 uppercase">
                Por concepto detallado de:
              </div>
              <div className="flex-1 px-5 py-4 space-y-2 uppercase">
                {cargos.map((cargo: string, idx: number) => {
                  const [nombre, precio] = cargo.split("|");
                  return (
                    <div key={idx} className="flex justify-between items-center text-[11px] border-b border-dotted border-slate-100 pb-1">
                      <span className="text-slate-700">- {nombre}</span>
                      <span className="text-slate-900 font-black tabular-nums">
                        ${precio?.replace('$', '')} {/* Limpiamos el $ por si ya lo trae */}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* METODO PAGO */}
          <div className="border border-slate-900 px-6 py-2 mb-8 bg-slate-50/50 flex items-center gap-12 text-[10px] font-black">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black">{datos.metodo === 'Efectivo' ? 'X' : ''}</div> <span>EFECTIVO</span></div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black">{datos.metodo !== 'Efectivo' ? 'X' : ''}</div> <span>BANCO / TRANSF.</span></div>
            <div className="flex-1 text-[9px] text-slate-400 text-right italic font-bold uppercase">Soporte original debe adjuntarse a este folio</div>
          </div>

          {/* FIRMAS LEGALES (3 Columnas como pediste) */}
          <div className="flex justify-between items-end mt-auto gap-12 px-4 pb-6">
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full border-t-2 border-slate-900 mb-1"></div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Elaboró (Tesorería)</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full border-t-2 border-slate-900 mb-1"></div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Aprobó (Consejo)</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full border-t-2 border-slate-900 mb-1"></div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">C.C. / Firma Recibido</p>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-[8px] font-black italic text-slate-400 bg-slate-50/50 py-1.5 rounded-lg border border-slate-100 uppercase tracking-widest">
              "Certificado oficial de egreso - Agrupación Residencial el Parque de las Flores"
            </p>
          </div>
        </div>

        <p className="no-print mt-10 text-center text-[10px] text-rose-500/50 font-black uppercase tracking-[0.5em] animate-pulse">
          Vista de comprobante finalizada
        </p>
      </div>
    </div>
  );
}