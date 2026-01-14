"use client";
import React, { useState } from "react";
import { Printer, X, Send, Loader2, CheckCircle2, Building2 } from "lucide-react";
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
  // Dividimos la cadena para obtener cada cargo por separado
  const cargos = datos.concepto.includes("||")
    ? datos.concepto.split("||")
    : [datos.concepto];

  return (
    <div className="w-full bg-white p-12 border border-slate-300 text-slate-800 font-sans text-[11.5px] leading-tight h-auto min-h-[13.8cm] flex flex-col relative box-border overflow-visible shadow-sm print:shadow-none">

      {/* HEADER CORREGIDO */}
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
          <p className="font-black text-[9px] uppercase text-slate-400 mb-0.5 tracking-widest">Recibo de Caja</p>
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
          <div className="w-[180px] p-2.5 bg-slate-100 flex items-center justify-between">
            <span className="font-bold text-[8.5px] text-slate-400">VALOR:</span>
            <span className="font-black text-emerald-600 text-lg tabular-nums leading-none">${datos.valor.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="flex border-b border-slate-900 uppercase font-bold text-[11.5px]">
          <div className="flex-1 p-2.5 border-r border-slate-900"><span className="text-[8.5px] font-black text-slate-300 mr-4 uppercase">Recibido de:</span> {datos.nombre}</div>
          <div className="w-[180px] p-2.5 text-center bg-white"><span className="text-[8.5px] font-black text-slate-300 mr-2 uppercase tracking-tighter">Unidad:</span> {datos.unidad}</div>
        </div>

        <div className="p-2.5 border-b border-slate-900 italic text-[11px] font-bold bg-slate-50/10">
          <span className="not-italic uppercase font-black mr-4 text-[8px] text-slate-300 tracking-widest">La suma de:</span>
          {numeroALetras(datos.valor)}
        </div>

        <div className="bg-white flex flex-col font-bold min-h-[80px]">
          <div className="p-1.5 border-b border-slate-50 text-[8px] font-black text-slate-400 tracking-[0.2em] bg-slate-50/50 uppercase">
            Relación detallada de causaciones pagadas
          </div>
          <div className="flex-1 px-5 py-3 space-y-1.5 uppercase">
            {cargos.map((cargo: string, idx: number) => {
              // Separamos por el caracter pipe "|"
              const [nombreConcepto, precioIndividual] = cargo.split("|");
              if (!nombreConcepto) return null; // Salta si está vacío

              return (
                <div key={idx} className="flex justify-between items-center text-[10.5px] border-b border-dotted border-slate-100 pb-1">
                  <span className="text-slate-800">{nombreConcepto}</span>
                  <span className="text-slate-900 font-black tabular-nums">
                    {precioIndividual || ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* METODO PAGO ADJUNTO A TABLA */}
      <div className="border border-slate-900 px-6 py-2 mb-6 bg-slate-50/50 flex items-center gap-12 text-[10px] font-black">
        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black">{datos.metodo === 'Efectivo' ? 'X' : ''}</div> <span>EFECTIVO</span></div>
        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black">{datos.metodo === 'Transferencia' ? 'X' : ''}</div> <span>BANCO / TRANSF.</span></div>
        <div className="flex-1 text-[9px] text-slate-400 text-right italic font-bold">Referencia Soporte: {datos.comprobante || 'TRANSACCIÓN DIGITAL'}</div>
      </div>

      {/* RESUMEN DE SALDOS */}
      <div className="flex justify-between items-center px-10 mb-8 py-5 border-y border-slate-100 bg-[#fdfdfd]">
        <div className="text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Saldo Ant.</p>
          <p className="font-bold text-sm text-slate-500 tabular-nums">${datos.saldoAnterior.toLocaleString('es-CO')}</p>
        </div>
        <div className="text-slate-200 font-light text-2xl pb-1">-</div>
        <div className="text-center group">
          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Abono Aplicado</p>
          <p className="font-black text-[15px] text-emerald-600 tabular-nums tracking-tighter leading-none">${datos.valor.toLocaleString('es-CO')}</p>
        </div>
        <div className="text-slate-200 font-light text-2xl pb-1">=</div>
        <div className="text-center">
          <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Nuevo Saldo</p>
          <p className="font-black text-[17px] text-rose-600 tabular-nums tracking-tighter leading-none italic">${Math.max(0, datos.saldoAnterior - datos.valor).toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* FIRMAS LEGALES */}
      <div className="flex justify-between items-end mt-auto gap-24 px-4 pb-2">
        <div className="flex-1 border-t-2 border-slate-900 pt-1 text-[9px] font-black uppercase text-slate-400 text-center tracking-[0.2em] italic">Elaboró</div>
        <div className="flex-1 border-t-2 border-slate-900 pt-1 text-[9px] font-black uppercase text-slate-400 text-center tracking-[0.2em] italic">Recibido</div>
        <div className="w-[100px] text-[7px] font-black uppercase opacity-20 text-center italic rotate-12 border p-1 leading-tight">
          Sello Administrativo <br /> Flores
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-[8px] font-black italic text-emerald-700 bg-emerald-50/50 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
          "Su cumplimiento oportuno fortalece el progreso de nuestra Agrupación Residencial"
        </p>
      </div>
    </div>
  );
};

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarPorEmail = async () => {
    if (!datos.email) return alert("Error: Residente no posee e-mail.");
    setEnviando(true);
    const templateParams = {
      to_email: datos.email, to_name: datos.nombre, recibo_num: datos.numero,
      valor_num: datos.valor.toLocaleString('es-CO'), valor_letras: numeroALetras(datos.valor),
      unidad: datos.unidad, concepto: datos.concepto.replaceAll("||", " \n "), // Lo enviamos limpio al correo
      saldo_nuevo: (datos.saldoAnterior - datos.valor).toLocaleString('es-CO')
    };

    try {
      await emailjs.send('service_t8z6itp', 'template_5qlyv0i', templateParams, 'Gq_mBsh8eCSiYQk33');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) {
      alert("Error al enviar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0c0e]/95 backdrop-blur-md z-[200] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">

      {/* CSS DE IMPRESIÓN CENTRADA */}
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

      {/* BARRA ACCIONES PANTALLA */}
      <div className="no-print w-full max-w-4xl bg-white p-4 rounded-b-2xl md:rounded-3xl mb-8 flex justify-between items-center shadow-2xl border border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-lg"
          >
            <Printer size={16} className="inline mr-2" /> IMPRIMIR RECIBO
          </button>

          <button
            onClick={enviarPorEmail}
            disabled={enviando || !datos.email}
            className={`px-8 py-3 rounded-2xl font-black text-[11px] tracking-widest flex items-center gap-2 transition-all uppercase ${enviado ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
              }`}
          >
            {enviando ? <Loader2 className="animate-spin" size={16} /> : enviado ? "LISTO / ENVIADO" : <><Send size={16} /> ENVIAR CORREO</>}
          </button>
        </div>
        <button onClick={onClose} className="p-4 hover:bg-slate-50 text-slate-300 rounded-full transition-colors">
          <X size={26} />
        </button>
      </div>

      <div id="receipt-doc" className="w-full max-w-4xl px-2 md:px-0 animate-in zoom-in-95 duration-500 pb-20">
        <ReciboContenido datos={datos} />
      </div>

    </div>
  );
}