"use client";
import React, { useState, useRef } from "react";
import { Printer, X, Send, Loader2 } from "lucide-react";
import { numeroALetras } from "@/lib/utils";
import emailjs from '@emailjs/browser';

interface ReciboProps {
  datos: {
    numero: string; fecha: string; nombre: string; unidad: string;
    valor: number; concepto: string; metodo: string; comprobante: string;
    saldoAnterior: number; email: string;
    fechaTransaccion?: string; // <-- NUEVA PROPIEDAD
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
    <div className="w-full bg-white p-8 md:p-12 border border-slate-300 text-slate-800 font-sans text-[11px] leading-tight flex flex-col relative box-border">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
        <div className="w-[200px]">
          <img src="/logo.png" alt="Logo " className="w-full h-auto object-contain" />
        </div>
        <div className="flex-1 text-center px-4">
          <h2 className="font-black text-[11px] uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h2>
          <h2 className="font-black text-[10px] uppercase leading-none mb-1">NIT. 832.011.421-3 </h2>
          <p className="font-bold text-[10px] text-slate-500">Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
          <p className="font-bold text-[10px] text-slate-500">Celular: 315 340 0657</p>
          <p className="font-bold text-[10px] text-slate-500">Banco Caja Social</p>
          <p className="font-bold text-[10px] text-slate-500">Cuenta de Ahorros 24511819298</p>
          <p className="font-bold text-[10px] text-red-600">Convenio 15939402 • Ref.: Torre y Apat.</p>
          <p className="font-bold text-[10px] text-slate-500">E-MAIL: cr.parquedelasflores@gmail.com</p>
        </div>
        <div className="w-[140px] border-2 border-slate-900 p-2 text-center rounded-sm bg-slate-50">
          <p className="font-black text-[8px] uppercase text-slate-400 mb-0.5 tracking-widest">Recibo de Caja</p>
          <p className="text-xl font-black text-slate-900 tabular-nums">Nº {datos.numero}</p>
        </div>
      </div>

      {/* CUADRO TÉCNICO */}
      <div className="border border-slate-900 rounded-sm mb-1">
        <div className="flex border-b border-slate-900">
          <div className="flex-1 p-2.5 border-r border-slate-900 bg-slate-50/30">
            <span className="font-black text-[8px] text-slate-400 mr-2 uppercase">Ciudad y Fecha:</span>
            <span className="font-bold uppercase text-[11.5px]">SOACHA, {datos.fecha}</span>
          </div>
          <div className="w-[180px] p-2.5 bg-slate-100 flex items-center justify-between">
            <span className="font-bold text-[8px] text-slate-400">VALOR:</span>
            <span className="font-black text-emerald-600 text-lg tabular-nums">${datos.valor.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="flex border-b border-slate-900 uppercase font-bold text-[11px]">
          <div className="flex-1 p-2.5 border-r border-slate-900">
            <span className="text-[8px] font-black text-slate-300 mr-2 uppercase">Recibido de:</span> {datos.nombre}
          </div>
          <div className="w-[130px] p-2.5">
            <span className="text-[8px] font-black text-slate-300 mr-2 uppercase">Unidad:</span> {datos.unidad}
          </div>
        </div>

        <div className="p-2.5 border-b border-slate-900 italic font-bold bg-slate-50/10">
          <span className="not-italic uppercase font-black mr-2 text-[8px] text-slate-300">La suma de:</span>
          <span className="uppercase text-[10px]">{numeroALetras(datos.valor)}</span>
        </div>

        <div className="bg-white flex flex-col font-bold">
          <div className="p-1.5 border-b border-slate-50 text-[7px] font-black text-slate-400 tracking-widest bg-slate-50/50 uppercase">Detalle de conceptos pagados</div>
          <div className="px-5 py-3 space-y-1.5 uppercase">
            {cargos.map((cargo: string, idx: number) => {
              const parts = cargo.split("|");
              return (
                <div key={idx} className="flex justify-between items-center text-[10px] border-b border-dotted border-slate-100 pb-1">
                  <span className="text-slate-700">{parts[0] || "Pago"}</span>
                  <span className="text-slate-900 font-black tabular-nums">{parts[1] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* METODO PAGO */}
      <div className="border border-slate-900 px-6 py-2 mb-4 bg-slate-50/50 flex items-center gap-10 text-[9px] font-black">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-slate-900 flex items-center justify-center">{datos.metodo === 'Efectivo' ? 'X' : ''}</div>
          <span>EFECTIVO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-slate-900 flex items-center justify-center">{datos.metodo !== 'Efectivo' ? 'X' : ''}</div>
          <span>TRANSFERENCIA</span>
        </div>

        {/* AQUÍ SE MUESTRA LA REF Y LA NUEVA FECHA */}
        <div className="flex-1 text-[8px] text-slate-400 text-right italic font-bold">
          Ref: {datos.comprobante || 'N/A'}
          {datos.fechaTransaccion && (
            <span className="text-slate-600 ml-2"> • Fecha Trx: {datos.fechaTransaccion}</span>
          )}
        </div>
      </div>

      {/* OPERACIÓN DE SALDO */}
      <div className="flex justify-between items-center px-10 py-4 border-y border-slate-200 bg-slate-50/20 gap-4 mb-8">
        <div className="text-center">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Anterior</p>
          <p className="font-black text-xs text-slate-500 tabular-nums">${Math.abs(saldoAnterior).toLocaleString('es-CO')}</p>
        </div>
        <div className="text-slate-300">−</div>
        <div className="text-center">
          <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mb-1">Abono Realizado</p>
          <p className="font-black text-xs text-emerald-600 tabular-nums">${abonoRealizado.toLocaleString('es-CO')}</p>
        </div>
        <div className="text-slate-300">=</div>
        <div className="text-center">
          <p className={`text-[7px] font-black uppercase tracking-widest mb-1 ${esSaldoAFavor ? 'text-emerald-500' : 'text-rose-500'}`}>
            {esSaldoAFavor ? 'Saldo a Favor' : 'Saldo Pendiente'}
          </p>
          <p className={`font-black text-sm tabular-nums italic ${esSaldoAFavor ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${Math.abs(nuevoSaldoRaw).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* FIRMAS */}
      <div className="flex justify-between items-end mt-auto gap-20 px-4 pb-2">
        <div className="flex-1 border-t border-slate-900 pt-1 text-[8px] font-black uppercase text-slate-400 text-center italic">Firma Administración</div>
        <div className="flex-1 border-t border-slate-900 pt-1 text-[8px] font-black uppercase text-slate-400 text-center italic">Firma Contador</div>
      </div>
    </div>
  );
};

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // --- NUEVA LÓGICA DE IMPRESIÓN BLINDADA ---
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.right = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");

    doc.write(`<html><head><title>RC-${datos.numero}</title>${styles}
      <style>
        @page { size: letter; margin: 15mm; }
        body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; }
        .print-wrap { width: 100%; height: auto; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      </style>
    </head><body><div class="print-wrap">${content.innerHTML}</div><script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};</script></body></html>`);
    doc.close();
  };

  const enviarPorEmail = async () => {
    if (!datos.email) return alert("Error: E-mail no registrado.");
    setEnviando(true);
    const saldoFinal = datos.saldoAnterior - datos.valor;
    const templateParams = {
      to_email: datos.email, to_name: datos.nombre, recibo_num: datos.numero,
      valor_num: datos.valor.toLocaleString('es-CO'), valor_letras: numeroALetras(datos.valor),
      unidad: datos.unidad, concepto: datos.concepto.replaceAll("||", "\n"),
      saldo_nuevo: Math.abs(saldoFinal).toLocaleString('es-CO'),
      label_saldo: saldoFinal < 0 ? "NUEVO SALDO A FAVOR" : "NUEVO SALDO PENDIENTE"
    };

    try {
      await emailjs.send('service_t8z6itp', 'template_5qlyv0i', templateParams, 'Gq_mBsh8eCSiYQk33');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) { alert("Fallo al enviar."); }
    finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex flex-col items-center p-4 md:p-8 overflow-y-auto no-scrollbar">

      {/* BARRA ACCIONES */}
      <div className="no-print w-full max-w-4xl bg-white p-4 rounded-2xl mb-6 flex justify-between items-center shadow-2xl border border-white/20">
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all">IMPRIMIR SOPORTE</button>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
      </div>

      {/* CONTENEDOR DEL RECIBO */}
      <div ref={printRef} className="w-full max-w-4xl bg-white shadow-2xl animate-in zoom-in-95 duration-500 mb-20 md:rounded-2xl overflow-hidden">
        <ReciboContenido datos={datos} />
      </div>
    </div>
  );
}