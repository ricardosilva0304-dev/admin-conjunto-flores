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

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarPorEmail = async () => {
    if (!datos.email) return alert("Residente sin correo registrado.");
    setEnviando(true);
    const templateParams = {
      to_email: datos.email,
      to_name: datos.nombre,
      recibo_num: datos.numero,
      valor_num: datos.valor.toLocaleString('es-CO'),
      valor_letras: numeroALetras(datos.valor),
      unidad: datos.unidad,
      concepto: datos.concepto,
      saldo_nuevo: (datos.saldoAnterior - datos.valor).toLocaleString('es-CO')
    };

    try {
      await emailjs.send('service_t8z6itp', 'template_5qlyv0i', templateParams, 'Gq_mBsh8eCSiYQk33');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) {
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0c0e]/90 backdrop-blur-md z-[150] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
      
      {/* CONFIGURACIÓN DE IMPRESIÓN DINÁMICA */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #receipt-canvas, #receipt-canvas * { visibility: visible; } 
          #receipt-canvas { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          } 
          .no-print { display: none !important; }
          @page { margin: 1cm; size: letter; }
        }
      `}</style>

      {/* BARRA DE ACCIONES (PANTALLA) */}
      <div className="no-print w-full max-w-4xl bg-white border-b md:border md:rounded-2xl p-4 flex justify-between items-center shadow-2xl mb-8">
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs tracking-widest flex items-center gap-2 hover:bg-black active:scale-95"
          >
            <Printer size={18} /> IMPRIMIR RECIBO
          </button>
          
          <button 
            onClick={enviarPorEmail}
            disabled={enviando || !datos.email}
            className={`px-8 py-3 rounded-xl font-black text-xs tracking-widest flex items-center gap-2 transition-all ${
              enviado ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white disabled:opacity-30'
            }`}
          >
            {enviando ? <Loader2 className="animate-spin" size={18}/> : enviado ? "ENVIADO CORRECTO" : <><Send size={16}/> ENVIAR CORREO</>}
          </button>
        </div>
        <button onClick={onClose} className="p-3 text-slate-300 hover:text-slate-900"><X size={24}/></button>
      </div>

      {/* DOCUMENTO RECIBO - RÉPLICA DISEÑO TRADICIONAL */}
      <div id="receipt-canvas" className="w-full max-w-4xl bg-white p-12 md:p-16 flex flex-col font-sans border border-slate-100 shadow-xl">
        
        {/* CABECERA: NIT Y CONTACTO */}
        <div className="flex justify-between items-start mb-8 relative">
           <div className="w-1/3 flex justify-start">
              <img src="/logo.png" alt="Logo" className="w-48 h-auto object-contain" />
           </div>
           
           <div className="flex-1 text-center flex flex-col gap-0.5 mt-2">
              <h2 className="text-[16px] font-black text-slate-900 uppercase">Agrupación Res. El Parque de las Flores</h2>
              <p className="text-[11px] font-bold text-slate-700 uppercase">Nit. 832.011.421-3</p>
              <p className="text-[10px] text-slate-600 uppercase">Dg 9 Nº 4B-90, Soacha, Cund.</p>
              <p className="text-[10px] text-slate-600">Cel.: 315 340 0657</p>
              <p className="text-[10px] font-black mt-2 text-emerald-800">Banco Caja Social - Cta. Ahorros 24511819298</p>
              <p className="text-[9px] font-bold uppercase tracking-tight text-slate-600">Convenio 15939402 Torre - Apto</p>
              <p className="text-[10px] font-medium lowercase text-slate-500 italic mt-1 underline">e-mail: cr.parquedelasflores@gmail.com</p>
           </div>

           <div className="w-48 border-2 border-slate-900 p-2 text-center rounded-sm bg-slate-50 absolute -right-4 top-0 shadow-sm">
              <p className="text-[11px] font-black uppercase text-slate-900 mb-0.5 tracking-tight">Recibo de Caja</p>
              <p className="text-3xl font-black tabular-nums tracking-tighter">Nº {datos.numero}</p>
           </div>
        </div>

        <div className="h-[2px] w-full bg-slate-900 mb-8"></div>

        {/* CONTENIDO: ESTRUCTURA DE CELDAS CERRADAS */}
        <div className="border border-slate-900 overflow-hidden mb-1">
           <div className="flex border-b border-slate-900">
              <div className="flex-1 p-3 border-r border-slate-900 uppercase flex items-center">
                 <span className="text-[9px] font-black text-slate-400 mr-4 tracking-widest shrink-0 uppercase">Ciudad y Fecha:</span> 
                 <span className="text-base font-bold text-slate-900 tracking-tighter italic">SOACHA, {datos.fecha}</span>
              </div>
              <div className="w-[200px] p-3 flex items-center gap-3 bg-slate-50">
                 <span className="text-[9px] font-black text-slate-400 uppercase">VALOR:</span> 
                 <span className="text-2xl font-black text-emerald-700 tracking-tighter tabular-nums leading-none">
                    ${datos.valor.toLocaleString('es-CO')}
                 </span>
              </div>
           </div>

           <div className="flex border-b border-slate-900">
              <div className="flex-1 p-3 border-r border-slate-900 uppercase">
                 <span className="text-[9px] font-black text-slate-400 mr-4 tracking-widest uppercase block mb-1">Recibido de:</span> 
                 <span className="text-xl font-black text-slate-900 tracking-tight leading-none italic">{datos.nombre}</span>
              </div>
              <div className="w-[200px] p-3 flex flex-col justify-center border-l border-slate-900 uppercase text-center bg-white">
                 <span className="text-[9px] font-black text-slate-400 tracking-widest">Identidad:</span> 
                 <span className="text-2xl font-black text-slate-900 leading-none tracking-widest italic">{datos.unidad}</span>
              </div>
           </div>

           <div className="p-3 border-b border-slate-900 italic text-[11px] bg-emerald-50/20">
              <span className="not-italic uppercase font-black mr-4 text-slate-400">La suma de:</span> 
              <span className="text-slate-900 font-bold uppercase tracking-tight">{numeroALetras(datos.valor)}</span>
           </div>

           <div className="flex text-sm">
              <div className="flex-1 p-3 uppercase font-black flex flex-col gap-2 min-h-[60px] bg-white border-r border-slate-900">
                <span className="text-slate-400 text-[9px] font-black tracking-widest block">POR CONCEPTO DE:</span>
                <p className="leading-tight text-base tracking-tighter">{datos.concepto}</p>
              </div>
              <div className="w-[200px] p-4 text-right flex items-end justify-end font-black text-xl italic text-slate-900">
                ${datos.valor.toLocaleString('es-CO')}
              </div>
           </div>
        </div>

        {/* METODOS PAGO ADJUNTO A TABLA */}
        <div className="border-x border-b border-slate-900 px-4 py-2 mb-8 bg-slate-50 text-[11px] font-black flex items-center gap-10">
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-slate-900 flex items-center justify-center shadow-inner">
               {datos.metodo === 'Efectivo' ? 'X' : ''}
             </div>
             <span>EFECTIVO</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-slate-900 flex items-center justify-center shadow-inner">
               {datos.metodo === 'Transferencia' ? 'X' : ''}
             </div>
             <span>BANCO</span>
           </div>
           <div className="flex-1 text-[10px] text-slate-400 italic font-bold">
              REFERENCIA DE SOPORTE: {datos.comprobante || '---'}
           </div>
        </div>

        {/* SECCIÓN BALANCE RESUMEN (DISEÑO TRADICIONAL) */}
        <div className="flex justify-between items-center gap-10 px-8 py-10 bg-[#fcfcfc] border-y border-slate-200 shadow-inner rounded-sm mb-16">
          <div className="text-center flex flex-col gap-1">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Saldo Ant.</p>
             <p className="text-xl font-bold text-slate-500 tabular-nums italic">${datos.saldoAnterior.toLocaleString('es-CO')}</p>
          </div>
          <span className="text-slate-300 font-bold text-2xl">-</span>
          <div className="text-center flex flex-col gap-1 scale-110">
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest underline decoration-2 decoration-emerald-200 underline-offset-4">Abono Aplicado</p>
             <p className="text-2xl font-black text-emerald-700 tabular-nums italic tracking-tighter leading-none">${datos.valor.toLocaleString('es-CO')}</p>
          </div>
          <span className="text-slate-300 font-bold text-2xl">=</span>
          <div className="text-center flex flex-col gap-1">
             <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Saldo Restante Mora</p>
             <p className="text-2xl font-black text-rose-600 tabular-nums italic tracking-tighter leading-none underline decoration-rose-200">
               ${Math.max(0, datos.saldoAnterior - datos.valor).toLocaleString('es-CO')}
             </p>
          </div>
        </div>

        {/* PIE Y FIRMAS */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-16 mt-auto">
           <div className="flex-1 w-full space-y-16">
              <div className="flex gap-20">
                <div className="flex-1 border-t-2 border-slate-900 pt-1 text-[10px] font-black text-slate-400 uppercase text-center tracking-[0.2em]">Elaboró / Firma Responsable</div>
                <div className="flex-1 border-t-2 border-slate-900 pt-1 text-[10px] font-black text-slate-400 uppercase text-center tracking-[0.2em]">Sello Recepción</div>
              </div>
              <p className="text-[11px] font-black italic text-emerald-700 leading-none text-center">
                 "Su cumplimiento en los pagos genera desarrollo y progreso en la Agrupación Residencial"
              </p>
           </div>

           <div className="w-48 h-32 border-2 border-slate-100 rounded-xl flex items-center justify-center relative shadow-inner p-4 text-center opacity-40">
              <span className="text-[9px] font-black uppercase text-slate-200 tracking-widest leading-none rotate-45 border p-2">SELLO ADMON. <br/> FLORES</span>
           </div>
        </div>

        <p className="mt-20 text-center text-[9px] font-bold text-slate-200 uppercase tracking-[0.5em] hover:text-slate-400 transition-all cursor-default">
           Software de Gestión Profesional V1.0 • Emitido electrónicamente
        </p>

      </div>
    </div>
  );
}