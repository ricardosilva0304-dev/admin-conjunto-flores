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
    concepto: string; // Ej: "ADMINISTRACIÓN (ENERO 2026)"
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
      setTimeout(() => setEnviado(false), 3000);
    } catch (error) {
      alert("Error al enviar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center p-4 overflow-y-auto no-scrollbar">
      {/* ESTILOS DE IMPRESIÓN */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #printable-recibo, #printable-recibo * { visibility: visible; } 
          #printable-recibo { 
            position: absolute; 
            left: 50%; 
            top: 50%; 
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 19cm; /* Ancho estándar de recibo */
          } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* BARRA DE ACCIONES (PANTALLA) */}
      <div className="no-print w-full max-w-4xl bg-white p-5 rounded-2xl mb-6 flex justify-between items-center shadow-2xl border border-slate-100">
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()} 
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-black transition-all active:scale-95"
          >
            <Printer size={18} /> IMPRIMIR RECIBO
          </button>
          <button 
            onClick={enviarPorEmail}
            disabled={enviando || !datos.email}
            className={`px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all active:scale-95 ${enviado ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white disabled:opacity-30'}`}
          >
            {enviando ? <Loader2 className="animate-spin" size={18}/> : enviado ? <><CheckCircle size={18}/> ENVIADO</> : <><Send size={18}/> ENVIAR AL CORREO</>}
          </button>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
          <X size={24} />
        </button>
      </div>

      {/* RECIBO ÚNICO Y SENCILLO */}
      <div id="printable-recibo" className="w-full max-w-4xl bg-white p-12 border border-slate-300 shadow-sm font-sans text-slate-800 relative">
        
        {/* HEADER LIMPIO */}
        <div className="flex justify-between items-center mb-8 border-b-4 border-slate-900 pb-8">
           <img src="/logo.png" alt="Logo" className="w-48 h-auto object-contain" />
           <div className="text-center px-4">
              <h2 className="font-black text-sm uppercase">Agrupación Res. El Parque de las Flores</h2>
              <p className="font-bold text-[10px] text-slate-500 uppercase tracking-tighter">NIT. 832.011.421-3 • Soacha, Cund.</p>
              <p className="text-[9px] font-black text-emerald-800 mt-2">Banco Caja Social - Ahorros 24511819298</p>
           </div>
           <div className="w-40 border-2 border-slate-900 p-3 text-center bg-slate-50 rounded-sm">
              <p className="text-[9px] font-black uppercase mb-1">Recibo de Caja</p>
              <p className="text-2xl font-black text-slate-900 tracking-widest leading-none">Nº {datos.numero}</p>
           </div>
        </div>

        {/* CONTENIDO PRINCIPAL (GRID SENCILLO) */}
        <div className="space-y-1 mb-8">
           <div className="flex border border-slate-800 uppercase text-[11px] font-bold">
              <div className="flex-1 p-3 border-r border-slate-800 bg-slate-50/50">Ciudad y Fecha: <span className="font-black ml-2">SOACHA, {datos.fecha}</span></div>
              <div className="w-1/3 p-3">Valor: <span className="font-black text-emerald-600 text-sm ml-2">${datos.valor.toLocaleString('es-CO')}</span></div>
           </div>

           <div className="flex border border-slate-800 uppercase text-[11px] font-bold">
              <div className="flex-1 p-3 border-r border-slate-800">Recibido de: <span className="font-black ml-2 text-[12px]">{datos.nombre}</span></div>
              <div className="w-1/3 p-3">Unidad: <span className="font-black ml-2">{datos.unidad}</span></div>
           </div>

           <div className="p-3 border border-slate-800 italic text-[10px] font-bold bg-slate-50/30">
              <span className="not-italic uppercase font-black mr-2 opacity-50">La suma de:</span> 
              <span className="text-slate-900 uppercase tracking-tighter">{numeroALetras(datos.valor)}</span>
           </div>

           <div className="flex border border-slate-800 uppercase font-bold text-[11px] min-h-[60px]">
              <div className="flex-1 p-3 border-r border-slate-800">
                <span className="opacity-50 text-[9px] block mb-1">Concepto Detallado</span>
                - {datos.concepto}
              </div>
              <div className="w-1/3 p-3 flex items-end justify-end text-sm font-black italic">
                ${datos.valor.toLocaleString('es-CO')}
              </div>
           </div>
        </div>

        {/* MÉTODO Y SALDOS */}
        <div className="grid grid-cols-12 gap-8 mb-12">
           <div className="col-span-5 flex items-center gap-6 border-b border-slate-200 py-2">
              <div className="flex items-center gap-2 text-[10px] font-black">
                 <div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center">{datos.metodo === 'Efectivo' ? 'X' : ''}</div>
                 EFECTIVO
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black">
                 <div className="w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center">{datos.metodo === 'Transferencia' ? 'X' : ''}</div>
                 BANCO
              </div>
              {datos.comprobante && <div className="text-[9px] text-slate-400 truncate"># {datos.comprobante}</div>}
           </div>

           <div className="col-span-7 flex justify-end gap-10 text-right">
              <div>
                <p className="text-[8px] font-black text-slate-300 uppercase">Sald. Ant.</p>
                <p className="text-xs font-bold text-slate-500">${datos.saldoAnterior.toLocaleString()}</p>
              </div>
              <div className="flex items-end text-xl text-slate-200">-</div>
              <div>
                <p className="text-[8px] font-black text-slate-300 uppercase">Abono</p>
                <p className="text-xs font-bold text-emerald-600">${datos.valor.toLocaleString()}</p>
              </div>
              <div className="flex items-end text-xl text-slate-200">=</div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nvo. Saldo</p>
                <p className="text-lg font-black text-rose-600">${(datos.saldoAnterior - datos.valor).toLocaleString()}</p>
              </div>
           </div>
        </div>

        {/* FIRMAS Y PIE */}
        <div className="flex justify-between items-end">
           <div className="w-64 border-t-2 border-slate-800 pt-1 text-[10px] font-black uppercase text-slate-300 text-center">Firma Administración</div>
           <div className="text-center bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 italic font-bold text-[9px] text-emerald-700">
             "Su cumplimiento genera progreso en la Agrupación"
           </div>
        </div>

      </div>

      <p className="no-print mt-10 text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em]">
         Documento Único de Control • Versión v1.0
      </p>
    </div>
  );
}