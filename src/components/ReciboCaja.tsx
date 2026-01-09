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

// Función para formatear el mes (pasa de "2026-01" a "ENERO 2026")
const formatearMes = (mesAnio: string) => {
  if (!mesAnio) return "";
  const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  const [anio, mes] = mesAnio.split("-");
  return `${meses[parseInt(mes) - 1]} ${anio}`;
};

const ReciboContenido = ({ datos }: { datos: any }) => (
  <div className="w-full bg-white p-12 border border-slate-300 text-slate-800 font-sans text-[12px] leading-tight shadow-sm print:shadow-none print:border-slate-400 h-auto min-h-[580px] flex flex-col relative">

    {/* HEADER ACTUALIZADO: Logo más grande y sin texto inferior */}
    <div className="flex justify-between items-center mb-8 border-b-2 border-slate-900 pb-6">
      <div className="w-1/3 flex items-center justify-start">
        {/* Logo ampliado a w-40 (puedes ajustarlo más si deseas) */}
        <img src="/logo.png" alt="Logo" className="w-44 h-auto object-contain" />
      </div>

      <div className="flex-1 text-center px-4">
        <h2 className="font-black text-[14px] leading-tight uppercase mb-1">Agrupación Res. El Parque de las Flores</h2>
        <p className="font-bold text-[10px] text-slate-700">NIT. 832.011.421-3</p>
        <p className="text-[9px]">Dg 9 Nº 4B-90, Soacha, Cund. | Cel.: 315 340 0657</p>
        <p className="text-[10px] font-black mt-2 text-emerald-800">Banco Caja Social - Cta. Ahorros 24511819298</p>
        <p className="text-[9px] font-bold">Convenio 15939402 Torre - Apto</p>
        <p className="text-[8px] font-bold lowercase text-slate-500 italic mt-1">e-mail: cr.parquedelasflores@gmail.com</p>
      </div>

      <div className="w-1/4 border-2 border-slate-900 p-3 text-center rounded-sm bg-slate-50">
        <p className="font-black text-[10px] mb-1 uppercase tracking-tighter">Recibo de Caja</p>
        <p className="text-2xl font-black tracking-widest text-slate-900">Nº {datos.numero}</p>
      </div>
    </div>

    {/* CAMPOS DE DATOS */}
    <div className="grid grid-cols-12 border border-slate-900 mb-1">
      <div className="col-span-9 p-3 border-r border-slate-900 uppercase">
        <span className="font-bold text-[9px] text-slate-400 mr-2 tracking-widest">CIUDAD Y FECHA:</span>
        <span className="font-bold text-[12px]">SOACHA, {datos.fecha}</span>
      </div>
      <div className="col-span-3 p-3 bg-slate-50">
        <span className="font-bold text-[9px] text-slate-400 mr-2">VALOR:</span>
        <span className="font-black text-emerald-600 text-base">${datos.valor.toLocaleString('es-CO')}</span>
      </div>
    </div>

    <div className="grid grid-cols-12 border border-slate-900 mb-1">
      <div className="col-span-9 p-3 border-r border-slate-900 uppercase">
        <span className="font-bold text-[9px] text-slate-400 mr-2 tracking-widest">RECIBIDO DE:</span>
        <span className="font-bold text-[12px]">{datos.nombre}</span>
      </div>
      <div className="col-span-3 p-3 uppercase">
        <span className="font-bold text-[9px] text-slate-400 mr-2">UNIDAD:</span>
        <span className="font-bold text-[12px]">{datos.unidad}</span>
      </div>
    </div>

    <div className="border border-slate-900 p-3 mb-1 bg-emerald-50/20 italic">
      <span className="font-bold text-[9px] text-slate-400 mr-2 not-italic uppercase tracking-widest">La suma de:</span>
      <span className="font-bold text-slate-800 text-[11px] tracking-tight">{numeroALetras(datos.valor)}</span>
    </div>

    {/* CONCEPTO CON MES Y AÑO */}
    <div className="grid grid-cols-12 border border-slate-900 mb-6 min-h-[60px]">
      <div className="col-span-9 p-3 border-r border-slate-900 uppercase font-bold text-[12px]">
        <span className="font-black text-[9px] text-slate-400 block mb-1 tracking-widest">CONCEPTO:</span>
        - {datos.concepto}
      </div>
      <div className="col-span-3 p-3 text-right flex items-end justify-end font-black text-sm">
        ${datos.valor.toLocaleString('es-CO')}
      </div>
    </div>

    {/* MEDIO DE PAGO */}
    <div className="border border-slate-900 flex items-center gap-8 px-6 py-3 mb-8 text-[11px] font-bold bg-slate-50/30">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 border-2 border-slate-900 flex items-center justify-center font-black`}>{datos.metodo === 'Efectivo' ? 'X' : ''}</div>
        <span>EFECTIVO</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 border-2 border-slate-900 flex items-center justify-center font-black`}>{datos.metodo === 'Transferencia' ? 'X' : ''}</div>
        <span>BANCO</span>
      </div>
      <div className="flex-1 italic text-slate-400 font-medium">Ref / Comprobante: {datos.comprobante || 'N/A'}</div>
    </div>

    {/* ESTADO DE CUENTA */}
    <div className="flex justify-around items-center mb-10 px-8 text-center border-y border-slate-100 py-6">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Ant.</p>
        <p className="font-bold text-base text-slate-600">${datos.saldoAnterior.toLocaleString()}</p>
      </div>
      <div className="text-slate-200 font-light text-2xl">-</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Abono</p>
        <p className="font-bold text-base text-emerald-600">${datos.valor.toLocaleString()}</p>
      </div>
      <div className="text-slate-200 font-light text-2xl">=</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Saldo</p>
        <p className="font-black text-xl text-rose-600 tracking-tighter">${(datos.saldoAnterior - datos.valor).toLocaleString()}</p>
      </div>
    </div>

    {/* FIRMAS */}
    <div className="flex gap-12 px-4 mt-auto mb-6">
      <div className="flex-1 border-t border-slate-400 pt-2 text-center font-black text-[9px] uppercase text-slate-400 tracking-widest">Elaboró</div>
      <div className="flex-1 border-t border-slate-400 pt-2 text-center font-black text-[9px] uppercase text-slate-400 tracking-widest">Contabilizó</div>
      <div className="w-1/3 border-2 border-slate-200 h-16 rounded-md flex items-center justify-center text-[9px] text-slate-300 font-bold uppercase text-center p-2">Firma Administración</div>
    </div>

    <p className="text-center text-[10px] font-black italic text-emerald-700 bg-emerald-50/50 py-3 rounded-xl">
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
      // Recuerda poner tus llaves reales de EmailJS
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams, 'YOUR_PUBLIC_KEY');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
    } catch (error) {
      alert("Error al enviar.");
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
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; } 
          .page-break { page-break-after: always; height: auto; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      <div className="no-print w-full max-w-4xl bg-white/10 p-6 rounded-[2.5rem] mb-6 flex justify-between items-center border border-white/10">
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
            <Printer size={20} /> Imprimir (2 Hojas)
          </button>
          <button
            onClick={enviarPorEmail}
            disabled={enviando || !datos.email}
            className={`px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95 ${enviado ? 'bg-white text-emerald-600' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30'}`}
          >
            {enviando ? <Loader2 className="animate-spin" size={20} /> : enviado ? <><CheckCircle size={20} /> Enviado</> : <><Send size={20} /> Enviar Correo</>}
          </button>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/10 p-4 rounded-2xl transition-all"><X /></button>
      </div>

      <div id="print-area" className="w-full max-w-4xl space-y-8 pb-20">
        <div className="page-break"><ReciboContenido datos={datos} /></div>
        <div className="page-break"><ReciboContenido datos={datos} /></div>
      </div>
    </div>
  );
}