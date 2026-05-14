"use client";
import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { numeroALetras } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


interface ReciboProps {
  datos: {
    numero: string; fecha: string; nombre: string; unidad: string;
    valor: number; concepto: string; metodo: string; comprobante: string;
    saldoAnterior: number; email: string;
    fechaTransaccion?: string;
  };
  onClose: () => void;
}

const ReciboContenido = ({ datos }: { datos: any }) => {
  const saldoAnterior = Number(datos.saldoAnterior) || 0;
  const abonoRealizado = Number(datos.valor) || 0;
  const nuevoSaldoRaw = saldoAnterior - abonoRealizado;
  const esSaldoAFavor = nuevoSaldoRaw < 0;

  const cargos = datos.concepto.includes("||") ? datos.concepto.split("||") : [datos.concepto];

  return (
    <div className="w-full bg-white text-slate-800 font-sans leading-tight flex flex-col relative box-border
      /* mobile */ p-4 text-[10px]
      /* tablet+ */ sm:p-8 sm:text-[11px]
      /* desktop */ md:p-12">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6 border-b-2 border-slate-900 pb-3 sm:pb-4 gap-3">

        {/* Logo */}
        <div className="w-[90px] sm:w-[160px] md:w-[200px] flex-shrink-0">
          <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
        </div>

        {/* Info central */}
        <div className="flex-1 text-center px-2 sm:px-4">
          <h2 className="font-black text-[9px] sm:text-[11px] uppercase leading-snug mb-0.5">
            Agrupación Res. El Parque de las Flores
          </h2>
          <h2 className="font-black text-[9px] sm:text-[10px] uppercase leading-none mb-1">
            NIT. 832.011.421-3
          </h2>
          <p className="font-bold text-[8px] sm:text-[10px] text-slate-500">Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
          <p className="font-bold text-[8px] sm:text-[10px] text-slate-500">Celular: 315 340 0657</p>
          <p className="font-bold text-[8px] sm:text-[10px] text-slate-500">Banco Caja Social</p>
          <p className="font-bold text-[8px] sm:text-[10px] text-slate-500">Cuenta de Ahorros 24511819298</p>
          <p className="font-bold text-[8px] sm:text-[10px] text-red-600">Convenio 15939402 • Ref.: Torre y Apat.</p>
          <p className="font-bold text-[8px] sm:text-[10px] text-slate-500">E-MAIL: cr.parquedelasflores@gmail.com</p>
        </div>

        {/* Badge recibo */}
        <div className="w-[80px] sm:w-[120px] md:w-[140px] flex-shrink-0 border-2 border-slate-900 p-1.5 sm:p-2 text-center rounded-sm bg-slate-50">
          <p className="font-black text-[7px] sm:text-[8px] uppercase text-slate-400 mb-0.5 tracking-widest">Recibo de Caja</p>
          <p className="text-base sm:text-xl font-black text-slate-900 tabular-nums">Nº {datos.numero}</p>
        </div>
      </div>

      {/* ── CUADRO TÉCNICO ──────────────────────────────────────── */}
      <div className="border border-slate-900 rounded-sm mb-1">

        {/* Fila: Ciudad/Fecha + Valor */}
        <div className="flex border-b border-slate-900">
          <div className="flex-1 p-2 sm:p-2.5 border-r border-slate-900 bg-slate-50/30 flex flex-wrap items-center gap-1">
            <span className="font-black text-[7px] sm:text-[8px] text-slate-400 uppercase">Ciudad y Fecha:</span>
            <span className="font-bold uppercase text-[10px] sm:text-[11.5px]">SOACHA, {datos.fecha}</span>
          </div>
          <div className="w-[130px] sm:w-[180px] p-2 sm:p-2.5 bg-slate-100 flex items-center justify-between gap-1">
            <span className="font-bold text-[7px] sm:text-[8px] text-slate-400">VALOR:</span>
            <span className="font-black text-emerald-600 text-sm sm:text-lg tabular-nums">
              ${datos.valor.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        {/* Fila: Nombre + Unidad */}
        <div className="flex border-b border-slate-900 uppercase font-bold">
          <div className="flex-1 p-2 sm:p-2.5 border-r border-slate-900 text-[9px] sm:text-[11px]">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-300 mr-1 uppercase">Recibido de:</span>
            {datos.nombre}
          </div>
          <div className="w-[130px] sm:w-[180px] p-2 sm:p-2.5 text-[9px] sm:text-[11px]">
            <span className="text-[7px] sm:text-[8px] font-black text-slate-300 mr-1 uppercase">Unidad:</span>
            {datos.unidad}
          </div>
        </div>

        {/* La suma de */}
        <div className="p-2 sm:p-2.5 border-b border-slate-900 italic font-bold bg-slate-50/10">
          <span className="not-italic uppercase font-black mr-1 text-[7px] sm:text-[8px] text-slate-300">La suma de:</span>
          <span className="uppercase text-[9px] sm:text-[10px]">{numeroALetras(datos.valor)}</span>
        </div>

        {/* Detalle conceptos */}
        <div className="bg-white flex flex-col font-bold">
          <div className="p-1.5 border-b border-slate-50 text-[7px] font-black text-slate-400 tracking-widest bg-slate-50/50 uppercase">
            Detalle de conceptos pagados
          </div>
          <div className="px-3 sm:px-5 py-2 sm:py-3 space-y-1.5 uppercase">
            {cargos.map((cargo: string, idx: number) => {
              const parts = cargo.split("|");
              return (
                <div key={idx} className="flex justify-between items-start gap-2 text-[9px] sm:text-[10px] border-b border-dotted border-slate-100 pb-1">
                  <span className="text-slate-700 flex-1 leading-snug">{parts[0] || "Pago"}</span>
                  <span className="text-slate-900 font-black tabular-nums flex-shrink-0">{parts[1] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MÉTODO DE PAGO ──────────────────────────────────────── */}
      <div className="border border-slate-900 px-3 sm:px-6 py-2 mb-4 bg-slate-50/50 flex flex-wrap items-center gap-3 sm:gap-10 text-[8px] sm:text-[9px] font-black">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 border border-slate-900 flex items-center justify-center flex-shrink-0">
            {datos.metodo === 'Efectivo' ? 'X' : ''}
          </div>
          <span>EFECTIVO</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 border border-slate-900 flex items-center justify-center flex-shrink-0">
            {datos.metodo !== 'Efectivo' ? 'X' : ''}
          </div>
          <span>TRANSFERENCIA</span>
        </div>
        <div className="flex-1 text-[7px] sm:text-[8px] text-slate-400 text-right italic font-bold min-w-0">
          Ref: {datos.comprobante || 'N/A'}
          {datos.fechaTransaccion && (
            <span className="text-slate-600 ml-1 sm:ml-2"> • Fecha Trx: {datos.fechaTransaccion}</span>
          )}
        </div>
      </div>

      {/* ── OPERACIÓN DE SALDO ──────────────────────────────────── */}
      <div className="flex justify-between items-center px-3 sm:px-10 py-3 sm:py-4 border-y border-slate-200 bg-slate-50/20 gap-2 mb-6 sm:mb-8">
        <div className="text-center">
          <p className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Anterior</p>
          <p className="font-black text-[10px] sm:text-xs text-slate-500 tabular-nums">
            ${Math.abs(saldoAnterior).toLocaleString('es-CO')}
          </p>
        </div>
        <div className="text-slate-300 text-xs">−</div>
        <div className="text-center">
          <p className="text-[6px] sm:text-[7px] font-black text-emerald-500 uppercase tracking-widest mb-1">Abono Realizado</p>
          <p className="font-black text-[10px] sm:text-xs text-emerald-600 tabular-nums">
            ${abonoRealizado.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="text-slate-300 text-xs">=</div>
        <div className="text-center">
          <p className={`text-[6px] sm:text-[7px] font-black uppercase tracking-widest mb-1 ${esSaldoAFavor ? 'text-emerald-500' : 'text-rose-500'}`}>
            {esSaldoAFavor ? 'Saldo a Favor' : 'Saldo Pendiente'}
          </p>
          <p className={`font-black text-xs sm:text-sm tabular-nums italic ${esSaldoAFavor ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${Math.abs(nuevoSaldoRaw).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* ── FIRMAS ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mt-auto gap-8 sm:gap-20 px-2 sm:px-4 pb-2">
        <div className="flex-1 border-t border-slate-900 pt-1 text-[7px] sm:text-[8px] font-black uppercase text-slate-400 text-center italic">
          Firma Administración
        </div>
        <div className="flex-1 border-t border-slate-900 pt-1 text-[7px] sm:text-[8px] font-black uppercase text-slate-400 text-center italic">
          Firma Contador
        </div>
      </div>
    </div>
  );
};

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const getStyles = () =>
    Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map(s => s.outerHTML).join("");

  const baseStyles = `
    @page { size: letter; margin: 15mm; }
    body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; }
    .print-wrap { width: 100%; height: auto; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  `;

  // Abre diálogo de impresora física
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;bottom:0;right:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.write(`<html><head><title>RC-${datos.numero}</title>${getStyles()}
      <style>${baseStyles}</style>
    </head><body><div class="print-wrap">${content.innerHTML}</div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement?.remove(),500);};<\/script>
    </body></html>`);
    doc.close();
  };

  // Abre diálogo "Guardar como PDF" con nombre predefinido
  const handleGuardarPDF = async () => {
    const content = printRef.current;
    if (!content) return;
    const nombreArchivo = `RC-${datos.numero}_${datos.unidad.replace(/\s/g, "")}`;
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll("*").forEach((el) => {
          const style = (el as HTMLElement).style;
          if (style) {
            style.color = style.color?.includes("lab(") ? "" : style.color;
            style.backgroundColor = style.backgroundColor?.includes("lab(") ? "" : style.backgroundColor;
          }
        });
      },
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;
    const yOffset = imgH < pageH ? (pageH - imgH) / 2 : 0;
    pdf.addImage(imgData, "PNG", 0, yOffset, imgW, imgH);
    pdf.save(`${nombreArchivo}.pdf`); 
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex flex-col items-center overflow-y-auto no-scrollbar
      p-3 sm:p-6 md:p-8">

      {/* ── BARRA DE ACCIONES ───────────────────────────────────── */}
      <div className="no-print w-full max-w-4xl bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 flex justify-between items-center shadow-2xl border border-white/20 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón imprimir → manda a impresora */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            Imprimir
          </button>
          {/* Botón PDF → guarda con nombre RC-XXXXX_T8-202 */}
          <button
            onClick={handleGuardarPDF}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
            Guardar PDF
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 sm:p-3 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── RECIBO ──────────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="w-full max-w-4xl bg-white shadow-2xl animate-in zoom-in-95 duration-500 mb-10 rounded-xl sm:rounded-2xl overflow-hidden"
      >
        <ReciboContenido datos={datos} />
      </div>
    </div>
  );
}