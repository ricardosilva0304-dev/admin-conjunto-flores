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
  const saldoAnterior = Number(datos.saldoAnterior) || 0;
  const abonoRealizado = Number(datos.valor) || 0;
  const nuevoSaldoRaw = saldoAnterior - abonoRealizado;

  // Si el número es negativo, significa que el residente tiene dinero a favor
  const esSaldoAFavor = nuevoSaldoRaw < 0;

  const cargos = datos.concepto.includes("||")
    ? datos.concepto.split("||")
    : [datos.concepto];

  return (
    // Reducimos padding en móvil (p-4) y lo mantenemos en PC (md:p-12)
    <div className="w-full bg-white p-4 md:p-12 border border-slate-300 text-slate-800 font-sans text-[11px] md:text-[11.5px] leading-tight h-auto flex flex-col relative box-border shadow-sm print:shadow-none">

      {/* HEADER: Se apila en móvil (flex-col) y se alinea en PC (md:flex-row) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b-2 border-slate-900 pb-4 gap-4">
        <div className="w-[140px] md:w-[180px]">
          <img src="/logo.png" alt="Logo" className="w-full h-auto object-contain" />
        </div>

        <div className="flex-1 text-center px-4">
          <h2 className="font-black text-[11px] uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h2>
          <h2 className="font-black text-[11px] uppercase leading-none mb-1">NIT. 832.011.421-3 </h2>
          <p className="font-bold text-[10px] text-slate-600">Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
          <p className="font-bold text-[9px] text-slate-600">Cuenta de Ahorros 24511819298 Banco Caja Social</p>
          <p className="font-bold text-[9px] text-slate-600">Convenio 15939402 Torre - Apto</p>
          <p className="font-bold text-[9px] text-slate-600">Celular: 315 340 0657</p>
          <p className="font-bold text-[9px] text-slate-600">e-mail: cr.parquedelasflores@gmail.com</p>
        </div>

        <div className="w-full md:w-[160px] border-2 border-slate-900 p-2 text-center rounded-sm bg-slate-50">
          <p className="font-black text-[8px] md:text-[9px] uppercase text-slate-400 mb-0.5 tracking-widest">Recibo de Caja</p>
          <p className="text-xl md:text-2xl font-black text-slate-900 tabular-nums leading-none">Nº {datos.numero}</p>
        </div>
      </div>

      {/* CUADRO TÉCNICO */}
      <div className="border border-slate-900 rounded-sm mb-0.5">
        <div className="flex flex-col md:flex-row border-b border-slate-900">
          <div className="flex-1 p-2 border-b md:border-b-0 md:border-r border-slate-900 bg-slate-50/30">
            <span className="font-black text-[8px] text-slate-400 mr-2 uppercase">Fecha:</span>
            <span className="font-bold uppercase text-[11px] md:text-[12.5px]">SOACHA, {datos.fecha}</span>
          </div>
          <div className="w-full md:w-[180px] p-2 bg-slate-100 flex items-center justify-between">
            <span className="font-bold text-[8px] text-slate-400">VALOR:</span>
            <span className="font-black text-emerald-600 text-base md:text-lg tabular-nums">${datos.valor.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row border-b border-slate-900 uppercase font-bold text-[10px] md:text-[11.5px]">
          <div className="flex-1 p-2 border-b md:border-b-0 md:border-r border-slate-900">
            <span className="text-[8px] font-black text-slate-300 mr-2 uppercase">Recibido de:</span> {datos.nombre}
          </div>
          <div className="w-full md:w-[150px] p-2 bg-white">
            <span className="text-[8px] font-black text-slate-300 mr-2 uppercase">Unidad:</span> {datos.unidad}
          </div>
        </div>

        <div className="p-2 border-b border-slate-900 italic text-[10px] md:text-[11px] font-bold bg-slate-50/10">
          <span className="not-italic uppercase font-black mr-2 text-[8px] text-slate-300">La suma de:</span>
          <span className="uppercase">{numeroALetras(datos.valor)}</span>
        </div>

        {/* DETALLE POR ITEM */}
        <div className="bg-white flex flex-col font-bold">
          <div className="p-1.5 border-b border-slate-50 text-[7.5px] font-black text-slate-400 tracking-widest bg-slate-50/50 uppercase">Detalle de pago</div>
          <div className="px-3 md:px-5 py-3 space-y-1.5 uppercase">
            {cargos.map((cargo: string, idx: number) => {
              const parts = cargo.split("|");
              return (
                <div key={idx} className="flex justify-between items-center text-[10px] md:text-[10.5px] border-b border-dotted border-slate-100 pb-1">
                  <span className="text-slate-800 pr-2">{parts[0] || "Concepto"}</span>
                  <span className="text-slate-900 font-black tabular-nums">{parts[1] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* METODO PAGO: Se ajusta para que no se desborde */}
      <div className="border border-slate-900 px-3 md:px-6 py-2 mb-4 bg-slate-50/50 flex flex-wrap items-center gap-4 md:gap-12 text-[9px] md:text-[10px] font-black">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-slate-900 flex items-center justify-center">{datos.metodo === 'Efectivo' ? 'X' : ''}</div>
          <span>EFECTIVO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-slate-900 flex items-center justify-center">{datos.metodo === 'Transferencia' ? 'X' : ''}</div>
          <span>TRANSF.</span>
        </div>
        <div className="flex-1 text-[8px] text-slate-400 text-right italic font-bold truncate">Ref: {datos.comprobante || 'Digital'}</div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-10 mb-6 py-4 border-y border-slate-100 bg-[#fdfdfd] gap-4">
        <div className="text-center">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Saldo Anterior</p>
          <p className="font-bold text-xs md:text-sm text-slate-500">
            ${Math.abs(saldoAnterior).toLocaleString('es-CO')} {saldoAnterior < 0 ? '(A Favor)' : ''}
          </p>
        </div>

        <div className="hidden md:block text-slate-200 text-xl">-</div>

        <div className="text-center">
          <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Abono Realizado</p>
          <p className="font-black text-sm md:text-base text-emerald-600">
            ${abonoRealizado.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="hidden md:block text-slate-200 text-xl">=</div>

        <div className="text-center">
          <p className={`text-[7px] font-black uppercase tracking-widest ${esSaldoAFavor ? 'text-emerald-500' : 'text-rose-500'}`}>
            {esSaldoAFavor ? 'Nuevo Saldo a Favor' : 'Nuevo Saldo Pendiente'}
          </p>
          <p className={`font-black text-base md:text-lg italic ${esSaldoAFavor ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${Math.abs(nuevoSaldoRaw).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* FIRMAS: Más compactas */}
      <div className="flex justify-between items-end mt-auto gap-4 md:gap-24 px-2 pb-2">
        <div className="flex-1 border-t border-slate-900 pt-1 text-[8px] font-black uppercase text-slate-300 text-center italic">Elaboró</div>
        <div className="flex-1 border-t border-slate-900 pt-1 text-[8px] font-black uppercase text-slate-300 text-center italic">Recibido</div>
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
    <div className="fixed inset-0 bg-[#0a0c0e]/95 backdrop-blur-md z-[300] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar">

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