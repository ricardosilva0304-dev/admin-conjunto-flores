"use client";
import React, { useState } from "react";
import { Printer, X, Send, Loader2, CheckCircle, Building2 } from "lucide-react";
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
  /* Se establece un alto fijo de 13.8cm para que sumados (2) den 27.6cm (menor a los 27.94cm de la hoja carta) */
  <div className="w-full bg-white px-10 py-6 border border-slate-300 text-slate-800 font-sans text-[11.5px] leading-tight print:shadow-none print:border-slate-400 h-[13.7cm] flex flex-col relative box-border overflow-hidden">
    
    {/* HEADER ACTUALIZADO */}
    <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-3">
      <div className="w-1/3 flex items-center justify-start">
        {/* Logo ampliado y sin texto debajo */}
        <img src="/logo.png" alt="Logo" className="w-52 h-auto object-contain" />
      </div>
      
      <div className="flex-1 text-center px-2">
        <h2 className="font-black text-[12px] leading-tight uppercase mb-1">Agrupación Res. El Parque de las Flores</h2>
        <p className="font-bold text-[9px] text-slate-700">NIT. 832.011.421-3</p>
        <p className="text-[8px]">Dg 9 Nº 4B-90, Soacha, Cund. | Cel.: 315 340 0657</p>
        <p className="text-[9px] font-black mt-1 text-emerald-800">Banco Caja Social - Cta. Ahorros 24511819298</p>
        <p className="text-[8px] font-bold">Convenio 15939402 Torre - Apto</p>
        <p className="text-[7px] font-bold lowercase text-slate-500 italic">e-mail: cr.parquedelasflores@gmail.com</p>
      </div>

      <div className="w-1/4 border-2 border-slate-900 p-2 text-center rounded-sm bg-slate-50">
        <p className="font-black text-[9px] mb-1 uppercase tracking-tighter">Recibo de Caja</p>
        <p className="text-xl font-black tracking-widest leading-none text-slate-900">Nº {datos.numero}</p>
      </div>
    </div>

    {/* CAMPOS DE DATOS */}
    <div className="grid grid-cols-12 border border-slate-900 mb-0.5">
       <div className="col-span-9 p-2 border-r border-slate-900 uppercase">
         <span className="font-bold text-[8px] text-slate-400 mr-2 tracking-widest">CIUDAD Y FECHA:</span> 
         <span className="font-bold">SOACHA, {datos.fecha}</span>
       </div>
       <div className="col-span-3 p-2 bg-slate-50">
         <span className="font-bold text-[8px] text-slate-400 mr-2 uppercase">VALOR:</span> 
         <span className="font-black text-emerald-600 text-sm">${datos.valor.toLocaleString('es-CO')}</span>
       </div>
    </div>

    <div className="grid grid-cols-12 border border-slate-900 mb-0.5">
       <div className="col-span-9 p-2 border-r border-slate-900 uppercase">
         <span className="font-bold text-[8px] text-slate-400 mr-2 tracking-widest">RECIBIDO DE:</span> 
         <span className="font-bold">{datos.nombre}</span>
       </div>
       <div className="col-span-3 p-2 uppercase">
         <span className="font-bold text-[8px] text-slate-400 mr-2 uppercase">UNIDAD:</span> 
         <span className="font-bold">{datos.unidad}</span>
       </div>
    </div>

    <div className="border border-slate-900 p-2 mb-0.5 bg-emerald-50/20 italic">
      <span className="font-bold text-[8px] text-slate-400 mr-2 not-italic uppercase tracking-widest">La suma de:</span> 
      <span className="font-bold text-slate-800 tracking-tight">{numeroALetras(datos.valor)}</span>
    </div>

    {/* CONCEPTO DINÁMICO */}
    <div className="grid grid-cols-12 border border-slate-900 mb-4 min-h-[45px]">
      <div className="col-span-9 p-2 border-r border-slate-900 uppercase font-bold">
        <span className="font-black text-[8px] text-slate-400 block mb-1 tracking-widest">CONCEPTO:</span> 
        - {datos.concepto}
      </div>
      <div className="col-span-3 p-2 text-right flex items-end justify-end font-black text-sm">
        ${datos.valor.toLocaleString('es-CO')}
      </div>
    </div>

    {/* MEDIO DE PAGO */}
    <div className="border border-slate-900 flex items-center gap-8 px-4 py-1.5 mb-5 text-[10px] font-bold bg-slate-50/30">
       <div className="flex items-center gap-2">
         <div className={`w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black`}>{datos.metodo === 'Efectivo' ? 'X' : ''}</div> 
         <span>EFECTIVO</span>
       </div>
       <div className="flex items-center gap-2">
         <div className={`w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black`}>{datos.metodo === 'Transferencia' ? 'X' : ''}</div> 
         <span>BANCO</span>
       </div>
       <div className="flex-1 italic text-slate-400 font-medium">Ref / Comprobante: {datos.comprobante || 'N/A'}</div>
    </div>

    {/* ESTADO DE CUENTA COMPACTO */}
    <div className="flex justify-around items-center mb-6 px-4 text-center border-y border-slate-100 py-4 bg-white">
      <div>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Saldo Ant.</p>
        <p className="font-bold text-[12px] text-slate-600">${datos.saldoAnterior.toLocaleString()}</p>
      </div>
      <div className="text-slate-200 font-light text-xl">-</div>
      <div>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Abono</p>
        <p className="font-bold text-[12px] text-emerald-600">${datos.valor.toLocaleString()}</p>
      </div>
      <div className="text-slate-200 font-light text-xl">=</div>
      <div>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Nuevo Saldo</p>
        <p className="font-black text-[15px] text-rose-600 tracking-tighter">${(datos.saldoAnterior - datos.valor).toLocaleString()}</p>
      </div>
    </div>

    {/* FIRMAS */}
    <div className="flex gap-12 px-4 mt-auto mb-2">
      <div className="flex-1 border-t border-slate-400 pt-1 text-center font-black text-[8px] uppercase text-slate-400 tracking-widest">Elaboró</div>
      <div className="flex-1 border-t border-slate-400 pt-1 text-center font-black text-[8px] uppercase text-slate-400 tracking-widest">Contabilizó</div>
      <div className="w-1/4 border border-slate-200 h-12 rounded flex items-center justify-center text-[7px] text-slate-300 font-bold uppercase text-center p-1 leading-none">Firma Administración</div>
    </div>

    <p className="text-center text-[8px] font-black italic text-emerald-700 bg-emerald-50/50 py-1.5 rounded-lg leading-none">
      "Su cumplimiento en los pagos genera desarrollo y progreso en la Agrupación Residencial"
    </p>
  </div>
);

export default function ReciboCaja({ datos, onClose }: ReciboProps) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarPorEmail = async () => {
    if (!datos.email) return alert("Este residente no tiene correo registrado.");
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
      // service_t8z6itp , template_5qlyv0i , Gq_mBsh8eCSiYQk33
      await emailjs.send('service_t8z6itp', 'template_5qlyv0i', templateParams, 'Gq_mBsh8eCSiYQk33');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
    } catch (error) {
      alert("Error al enviar el correo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center p-4 overflow-y-auto no-scrollbar">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 0; 
          } 
          /* Quita saltos de página automáticos que puedan sobrar */
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* BARRA DE ACCIONES */}
      <div className="no-print w-full max-w-4xl bg-white/10 p-6 rounded-[2.5rem] mb-6 flex justify-between items-center border border-white/10">
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-sm uppercase tracking-tighter">
            <Printer size={20} /> Imprimir (Hoja Carta)
          </button>
          <button 
            onClick={enviarPorEmail} 
            disabled={enviando || !datos.email}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-tighter flex items-center gap-2 transition-all active:scale-95 ${enviado ? 'bg-white text-emerald-600' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30'}`}
          >
            {enviando ? <Loader2 className="animate-spin" size={20}/> : enviado ? <><CheckCircle size={20}/> Enviado</> : <><Send size={20}/> Enviar Correo</>}
          </button>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/10 p-4 rounded-2xl transition-all"><X /></button>
      </div>

      {/* ÁREA DE IMPRESIÓN (Dos recibos en una hoja) */}
      <div id="print-area" className="w-full max-w-4xl flex flex-col items-center bg-slate-100 p-0 shadow-2xl">
        {/* Espaciado de seguridad de 2mm para que no se peguen */}
        <ReciboContenido datos={datos} />
        <div className="no-print w-full border-t-2 border-dashed border-slate-300"></div>
        <ReciboContenido datos={datos} />
      </div>
      
      {/* Aviso de impresión abajo solo visible en pantalla */}
      <p className="no-print mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest italic text-center pb-10">
        Asegúrate de configurar el tamaño de papel en "Carta" o "Letter" y escala 100% en las opciones de tu impresora.
      </p>
    </div>
  );
}