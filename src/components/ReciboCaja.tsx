"use client";
import React, { useState } from "react";
import { Printer, X, Send, Loader2, CheckCircle2, Building2, Landmark, Wallet, AlertCircle, CheckCircle } from "lucide-react";
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
    if (!datos.email) return alert("El residente no posee un correo electrónico registrado.");
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
      // Reemplaza con tus IDs de EmailJS si los cambiaste
      await emailjs.send('service_t8z6itp', 'template_5qlyv0i', templateParams, 'Gq_mBsh8eCSiYQk33');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) {
      alert("Error en el protocolo de envío. Reintente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0c0e]/80 backdrop-blur-md z-[150] flex flex-col items-center p-0 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-500">
      
      {/* LÓGICA DE IMPRESIÓN PROFESIONAL */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #receipt-doc, #receipt-doc * { visibility: visible; } 
          #receipt-doc { 
            position: absolute; 
            left: 0; 
            top: 15%; 
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 1cm !important;
          } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* BARRA DE COMANDOS PREMIUM */}
      <div className="no-print w-full max-w-4xl bg-white md:rounded-3xl p-5 mb-8 flex justify-between items-center shadow-2xl border-b md:border border-slate-100 sticky top-0 z-20">
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
          >
            <Printer size={16} /> Imprimir Copia
          </button>
          
          <button 
            onClick={enviarPorEmail}
            disabled={enviando || !datos.email}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
              enviado ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-30'
            }`}
          >
            {enviando ? <Loader2 className="animate-spin" size={16}/> : enviado ? <><CheckCircle2 size={16}/> Recibo Enviado</> : <><Send size={16}/> Enviar Email</>}
          </button>
        </div>

        <button onClick={onClose} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
          <X size={26} />
        </button>
      </div>

      {/* DOCUMENTO: EL RECIBO DE CAJA */}
      <div id="receipt-doc" className="w-full max-w-4xl bg-white p-8 md:p-14 border border-slate-200 shadow-xl rounded-sm font-sans text-slate-800 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* SECCIÓN 1: CABECERA Y LOGOTIPO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b-4 border-slate-900 pb-10 gap-8">
           <div className="flex flex-col items-start gap-4">
              <img src="/logo.png" alt="Logo Administrativo" className="w-44 md:w-56 h-auto object-contain" />
              <div className="space-y-0.5">
                 <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Agrupación Res. El Parque de las Flores</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nit. 832.011.421-3 • Soacha, Cundinamarca</p>
              </div>
           </div>

           <div className="text-right flex flex-col items-end gap-3 w-full md:w-auto">
              <div className="bg-slate-900 text-white p-4 px-8 rounded-xl border border-white/10 shadow-lg text-center">
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 opacity-80">Recibo Oficial No.</p>
                 <span className="text-2xl font-black italic tracking-tighter tabular-nums leading-none">#{datos.numero}</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                 Expedición: <span className="text-slate-800 font-bold ml-1">{datos.fecha}</span>
              </p>
           </div>
        </div>

        {/* SECCIÓN 2: IDENTIFICACIÓN (DATOS PRINCIPALES) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 border border-slate-900 rounded-sm overflow-hidden mb-1">
           <div className="md:col-span-8 p-3 bg-white flex flex-col justify-center">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pagador Registrado</span>
              <p className="font-black text-lg uppercase leading-tight tracking-tight text-slate-900">{datos.nombre}</p>
           </div>
           <div className="md:col-span-4 p-3 bg-slate-900 text-white border-l border-slate-800 text-center flex flex-col justify-center">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Identidad Unidad</span>
              <p className="text-2xl font-black italic tracking-tighter tabular-nums uppercase">{datos.unidad}</p>
           </div>
        </div>

        {/* SECCIÓN 3: CUADRO FINANCIERO INTEGRADO */}
        <div className="space-y-px mb-8 border border-slate-900 rounded-sm">
           {/* Valor Letras */}
           <div className="p-3 bg-emerald-50/20 italic border-b border-slate-900 flex gap-4">
              <span className="font-black text-[9px] uppercase not-italic text-slate-400 w-24">La Suma de:</span> 
              <span className="font-bold text-[11px] text-slate-700">{numeroALetras(datos.valor)}</span>
           </div>

           {/* Concepto y Monto Actual */}
           <div className="flex text-sm border-b border-slate-900">
              <div className="flex-1 p-3 bg-white flex flex-col gap-1 min-h-[70px]">
                 <span className="font-black text-[9px] uppercase text-slate-400">Concepto Recaudado</span>
                 <p className="font-black uppercase text-slate-900 text-[13px]">{datos.concepto}</p>
              </div>
              <div className="w-1/3 p-3 bg-slate-50 border-l border-slate-900 flex flex-col items-end justify-center">
                 <span className="font-black text-[9px] uppercase text-slate-400 mb-1">Total Abono</span>
                 <p className="text-3xl font-black tabular-nums tracking-tighter text-emerald-600 italic">
                   ${datos.valor.toLocaleString('es-CO')}
                 </p>
              </div>
           </div>

           {/* Info Banco */}
           <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold">
              <div className="flex gap-6 items-center">
                 <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black ${datos.metodo === 'Efectivo' ? 'bg-slate-900 text-white' : ''}`}>{datos.metodo === 'Efectivo' ? 'X' : ''}</div>
                    <span className="tracking-widest">EFECTIVO</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 border-2 border-slate-900 flex items-center justify-center font-black ${datos.metodo === 'Transferencia' ? 'bg-slate-900 text-white' : ''}`}>{datos.metodo === 'Transferencia' ? 'X' : ''}</div>
                    <span className="tracking-widest">TRANSF./BANCO</span>
                 </div>
              </div>
              <div className="text-slate-400 italic font-medium border-l md:pl-4 border-slate-100 flex items-center gap-2">
                 <Landmark size={12}/> Ref: {datos.comprobante || 'TRANSACCIÓN DIGITAL'}
              </div>
           </div>
        </div>

        {/* SECCIÓN 4: AUDITORÍA DE SALDOS (RESUMEN EJECUTIVO) */}
        <div className="bg-[#fcfcfd] border-y-2 border-slate-200 p-8 rounded-[2.5rem] flex flex-wrap justify-between items-center gap-10 shadow-inner mb-14">
          <div className="flex flex-col items-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Wallet size={12}/> Deuda Anterior</p>
            <p className="text-lg font-black text-slate-500 tabular-nums">${datos.saldoAnterior.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-2xl text-slate-200 font-light hidden sm:block">-</div>
          <div className="flex flex-col items-center scale-110">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Pago Aplicado</p>
            <p className="text-xl font-black text-emerald-600 tabular-nums shadow-[0_4px_10px_rgba(16,185,129,0.05)] border-b-2 border-emerald-500">
               ${datos.valor.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="text-2xl text-slate-200 font-light hidden sm:block">=</div>
          <div className="flex flex-col items-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><AlertCircle size={12}/> Nuevo Saldo Mora</p>
            <p className="text-2xl font-black text-rose-600 tabular-nums tracking-tighter">
               ${Math.max(0, datos.saldoAnterior - datos.valor).toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        {/* SECCIÓN 5: CIERRE Y AUTORIZACIÓN */}
        <div className="flex flex-col md:flex-row justify-between items-end mt-auto pt-10">
           <div className="flex flex-col items-center w-full md:w-72">
              <div className="w-full border-t-2 border-slate-900 h-0.5"></div>
              <p className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest">CONTROL ADMINISTRATIVO / FIRMA</p>
           </div>
           
           <div className="bg-emerald-900 text-white p-6 rounded-3xl mt-8 md:mt-0 flex flex-col gap-2 relative overflow-hidden group border border-white/5 max-w-xs shadow-xl">
              <h5 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest relative z-10 italic">Lema Corporativo:</h5>
              <p className="text-[11px] font-black tracking-tight leading-snug relative z-10">
                 "Juntos fortalecemos el desarrollo del Parque de las Flores"
              </p>
              <Building2 className="absolute top-2 right-2 text-white/5 -rotate-12 transition-transform group-hover:rotate-0" size={60}/>
           </div>
        </div>

        <div className="mt-16 text-center">
           <p className="text-[8px] font-bold text-slate-200 uppercase tracking-[0.5em] hover:text-slate-400 transition-colors">
              Comprobante Generado por el Sistema v1.0 • Admin. Flores
           </p>
        </div>

      </div>

      <p className="no-print mt-12 mb-10 text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-4">
         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
         Documento único para trámites bancarios
      </p>

    </div>
  );
}