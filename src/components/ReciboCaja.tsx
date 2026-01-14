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

const ReciboContenido = ({ datos }: { datos: any }) => (
  <div className="w-full bg-white p-10 border border-slate-300 text-slate-800 font-sans text-[11px] leading-snug h-[13.8cm] flex flex-col relative box-border">
    
    {/* HEADER */}
    <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
      <div className="w-[130px] flex items-center">
        <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
      </div>
      
      <div className="flex-1 text-center px-4">
        <h2 className="font-black text-[12.5px] uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h2>
        <p className="font-bold text-[9px] text-slate-600 uppercase">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
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

      <div className="w-[160px] border-2 border-slate-900 p-2 text-center rounded-md bg-slate-50 shadow-inner">
        <p className="font-black text-[10px] uppercase text-slate-400 mb-0.5 tracking-widest">Recibo de Caja</p>
        <p className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">Nº {datos.numero}</p>
      </div>
    </div>

    {/* CUADRO DE DATOS TÉCNICOS */}
    <div className="border border-slate-900 rounded-sm mb-1">
      <div className="flex border-b border-slate-900">
        <div className="flex-1 p-2 border-r border-slate-900 bg-slate-50/40 uppercase">
          <span className="font-black text-[8px] text-slate-400 mr-2 tracking-widest">CIUDAD Y FECHA:</span> 
          <span className="font-bold text-[12px]">SOACHA, {datos.fecha}</span>
        </div>
        <div className="w-[200px] p-2 bg-slate-100 flex items-center justify-between">
          <span className="font-black text-[8px] text-slate-400">VALOR:</span> 
          <span className="font-black text-emerald-600 text-lg">${datos.valor.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="flex border-b border-slate-900 uppercase font-bold text-[11.5px]">
        <div className="flex-1 p-2 border-r border-slate-900 truncate">
          <span className="text-[8px] font-black text-slate-300 mr-3 uppercase tracking-tighter">Recibido de:</span> 
          {datos.nombre}
        </div>
        <div className="w-[200px] p-2 text-center tracking-wider italic">
          <span className="text-[8px] font-black text-slate-300 mr-2 uppercase tracking-tighter">Unidad:</span> {datos.unidad}
        </div>
      </div>

      <div className="p-2 border-b border-slate-900 italic text-[10.5px] font-bold leading-tight">
        <span className="not-italic uppercase font-black mr-2 text-[8px] text-slate-300 tracking-tighter">La suma de:</span> 
        {numeroALetras(datos.valor)}
      </div>

      {/* ÁREA DE CONCEPTO - CORREGIDA PARA MOSTRAR MÚLTIPLES LÍNEAS */}
      <div className="flex font-bold uppercase min-h-[70px] bg-white">
        <div className="flex-1 p-3 border-r border-slate-900 overflow-visible">
          <span className="text-[8px] font-black text-slate-300 block mb-1.5 tracking-widest">Relación detallada de causaciones pagadas:</span>
          {/* Usamos white-space: pre-line para que las comas generen saltos o el texto fluya sin cortarse */}
          <p className="leading-[1.4] text-[10px] text-slate-700 break-words whitespace-pre-wrap">
            - {datos.concepto.replaceAll(", ", "\n- ")} 
          </p>
        </div>
        <div className="w-[200px] p-4 text-right flex flex-col justify-end font-black text-xs tabular-nums text-slate-300 italic">
          Total Rubro: ${datos.valor.toLocaleString('es-CO')}
        </div>
      </div>
    </div>

    {/* METODO PAGO */}
    <div className="border border-slate-900 px-6 py-2.5 mb-6 bg-slate-50/50 flex items-center gap-12 text-[10px] font-black">
       <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-900 flex items-center justify-center bg-white">
             {datos.metodo === 'Efectivo' ? 'X' : ''}
          </div> 
          <span>EFECTIVO</span>
       </div>
       <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-900 flex items-center justify-center bg-white">
             {datos.metodo !== 'Efectivo' ? 'X' : ''}
          </div> 
          <span>BANCO / TRANSFERENCIA</span>
       </div>
       <div className="flex-1 text-[9px] text-slate-400 text-right pr-2 italic font-bold">
          Soporte: {datos.comprobante || 'TRANSACCIÓN SISTEMA'}
       </div>
    </div>

    {/* RESUMEN DE SALDOS */}
    <div className="flex justify-between items-center px-12 mb-8 mt-2 py-4 border-y border-slate-100">
      <div className="text-center">
         <p className="text-[7.5px] font-black text-slate-300 uppercase tracking-widest">Saldo Anterior</p>
         <p className="font-bold text-[13px] text-slate-500 tabular-nums">${datos.saldoAnterior.toLocaleString('es-CO')}</p>
      </div>
      <div className="text-slate-200 font-light text-2xl pb-1">-</div>
      <div className="text-center px-4 bg-emerald-50/30 rounded-lg py-2 border border-emerald-50">
         <p className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Abono Aplicado</p>
         <p className="font-black text-[15px] text-emerald-600 tabular-nums leading-none">${datos.valor.toLocaleString('es-CO')}</p>
      </div>
      <div className="text-slate-200 font-light text-2xl pb-1">=</div>
      <div className="text-center">
         <p className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest">Nuevo Saldo</p>
         <p className="font-black text-[16px] text-rose-600 tabular-nums tracking-tighter">${Math.max(0, datos.saldoAnterior - datos.valor).toLocaleString('es-CO')}</p>
      </div>
    </div>

    {/* FIRMAS */}
    <div className="flex justify-between items-end mt-auto gap-24 px-4 pb-2">
      <div className="flex-1 border-t-2 border-slate-300 pt-2 text-[8px] font-black uppercase text-slate-400 text-center tracking-widest">Firma Elaborado</div>
      <div className="flex-1 border-t-2 border-slate-300 pt-2 text-[8px] font-black uppercase text-slate-400 text-center tracking-widest">Firma Recibido</div>
      <div className="w-16 h-10 border border-slate-100 flex items-center justify-center opacity-10">
         <span className="text-[8px] font-black rotate-12">SELLO</span>
      </div>
    </div>

    <div className="text-center mt-6">
       <p className="text-[8.5px] font-black italic text-emerald-800 bg-emerald-50/40 py-2 rounded-lg border border-emerald-100">
         "Su cumplimiento oportuno fortalece el progreso de nuestra Agrupación Residencial"
       </p>
    </div>
  </div>
);

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarPorEmail = async () => {
    if (!datos.email) return alert("Error: Residente no posee e-mail.");
    setEnviando(true);
    const templateParams = {
      to_email: datos.email, to_name: datos.nombre, recibo_num: datos.numero,
      valor_num: datos.valor.toLocaleString('es-CO'), valor_letras: numeroALetras(datos.valor),
      unidad: datos.unidad, concepto: datos.concepto,
      saldo_nuevo: (datos.saldoAnterior - datos.valor).toLocaleString('es-CO')
    };

    try {
      await emailjs.send('service_t8z6itp', 'template_5qlyv0i', templateParams, 'Gq_mBsh8eCSiYQk33');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) {
      alert("Falla en envío.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
      
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
            border: none;
            background: white;
          } 
          @page { size: letter; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* BARRA ACCIONES */}
      <div className="no-print w-full max-w-4xl bg-white p-4 rounded-b-2xl md:rounded-3xl mb-8 flex justify-between items-center shadow-2xl border border-slate-200">
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            <Printer size={18} /> Imprimir Recibo
          </button>
          
          <button 
            onClick={enviarPorEmail}
            disabled={enviando || !datos.email}
            className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest flex items-center gap-2 transition-all ${
              enviado ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {enviando ? <Loader2 className="animate-spin" size={16}/> : enviado ? "ENVIADO" : <><Send size={16}/> EMAIL</>}
          </button>
        </div>
        <button onClick={onClose} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 rounded-full transition-colors">
          <X size={24}/>
        </button>
      </div>

      <div id="receipt-doc" className="w-full max-w-4xl px-2 md:px-0">
          <ReciboContenido datos={datos} />
      </div>

    </div>
  );
}