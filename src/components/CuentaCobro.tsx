"use client";
import React from "react";
import { Printer, X, Building2, Wallet, Landmark, Info, FileText  } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  
  // --- MISMA LÓGICA DE PRECIO DINÁMICO QUE USAMOS EN INGRESOS ---
  const calcularSaldoCobrable = (deuda: any) => {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = deuda.causaciones_globales?.mes_causado.split("-").map(Number);

    let precioBase = deuda.precio_m1 || 0;
    
    // Si ya pasó el mes: Cobramos M3
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioBase = deuda.precio_m3 || 0;
    } else {
      // Si estamos en el mismo mes:
      if (dia > 10 && dia <= 20) precioBase = deuda.precio_m2 || 0;
      if (dia > 20) precioBase = deuda.precio_m3 || 0;
    }

    // El residente podría haber abonado algo
    const yaAbonado = (deuda.precio_m1 || 0) - (deuda.saldo_pendiente || 0);
    return Math.max(0, precioBase - yaAbonado);
  };

  const totalDeudaReal = deudas.reduce((acc: number, d: any) => acc + calcularSaldoCobrable(d), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center p-6 overflow-y-auto">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2cm; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* CABECERA DE CONTROL (NO SE IMPRIME) */}
      <div className="no-print w-full max-w-4xl bg-white p-6 rounded-[2.5rem] mb-6 flex justify-between items-center shadow-2xl border border-white/20">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white"><FileText size={24} /></div>
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Generación de Cobro</p>
              <h3 className="text-slate-900 font-black text-xl uppercase tracking-tighter mt-1">Notificación Oficial</h3>
           </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-xl"><Printer size={20} /> Imprimir Cobro</button>
          <button onClick={onClose} className="bg-slate-100 text-slate-400 p-4 rounded-2xl hover:bg-slate-200 transition-all"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-4xl bg-white p-16 border border-slate-100 shadow-2xl flex flex-col min-h-[1050px]">
        
        {/* ENCABEZADO FORMAL */}
        <div className="flex justify-between items-center mb-12 border-b-2 border-slate-900 pb-10">
           <img src="/logo.png" alt="Logo" className="w-48 h-auto" />
           <div className="text-right">
              <h2 className="font-black text-2xl leading-none mb-1 tracking-tighter">CUENTA DE COBRO</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Administración Conjunto Residencial</p>
              <div className="bg-slate-50 px-4 py-2 rounded-xl inline-block border border-slate-200">
                 <span className="text-[9px] font-black text-slate-400 mr-2 uppercase tracking-widest">Emitida el:</span>
                 <span className="text-xs font-black text-slate-900">{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</span>
              </div>
           </div>
        </div>

        {/* DATOS DEL RESIDENTE */}
        <div className="mb-12">
           <p className="text-xs font-bold text-slate-900 mb-2">AGRUPACIÓN RES. EL PARQUE DE LAS FLORES (NIT. 832.011.421-3)</p>
           <p className="text-xl font-black uppercase text-slate-900 mb-6">DEBE A LA ADMINISTRACIÓN:</p>
           
           <div className="p-10 border-2 border-slate-900 rounded-[2rem] space-y-4">
              <div className="grid grid-cols-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residente Responsable:</span>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Identificación de Unidad:</span>
              </div>
              <div className="grid grid-cols-2 items-end">
                 <h4 className="text-2xl font-black text-slate-900 uppercase leading-none">{residente.nombre}</h4>
                 <div className="text-right font-black text-3xl italic tracking-tighter text-emerald-600 leading-none">
                   T{residente.torre.replace("Torre ","")}-{residente.apartamento}
                 </div>
              </div>
           </div>
        </div>

        {/* TABLA DE DEUDAS SOLO CON SALDOS ACTUALES */}
        <div className="flex-1">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-rose-500 pl-4 text-slate-500">Resumen Detallado de Saldos</h3>
           <table className="w-full text-left border-collapse border border-slate-200">
              <thead className="bg-slate-900 text-white">
                 <tr className="text-[9px] font-black uppercase tracking-widest">
                    <th className="py-4 px-6 border-r border-white/10">Mes / Periodo</th>
                    <th className="py-4 px-6 border-r border-white/10 text-center">Detalle Obligación</th>
                    <th className="py-4 px-6 text-right">Valor Vigente Hoy</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {deudas.map((d: any) => (
                   <tr key={d.id} className="text-slate-800 font-bold uppercase">
                      <td className="py-5 px-6 bg-slate-50 border-r border-slate-100">{d.causaciones_globales?.mes_causado}</td>
                      <td className="py-5 px-6 border-r border-slate-100 text-center text-xs tracking-tight">{d.concepto_nombre || "Cuota de Administración"}</td>
                      <td className="py-5 px-6 text-right tabular-nums text-sm font-black italic">
                        ${calcularSaldoCobrable(d).toLocaleString()}
                      </td>
                   </tr>
                 ))}
                 {/* LÍNEA TOTAL IMPACTANTE */}
                 <tr className="bg-rose-50 border-t-2 border-rose-600/30">
                    <td colSpan={2} className="py-8 px-6 text-right font-black uppercase tracking-widest text-slate-900 text-xs">VALOR TOTAL A CANCELAR:</td>
                    <td className="py-8 px-6 text-right font-black text-3xl text-rose-600 tabular-nums">
                       ${totalDeudaReal.toLocaleString()}
                    </td>
                 </tr>
              </tbody>
           </table>

           {/* TOTAL EN LETRAS (Premium) */}
           <div className="mt-4 p-4 border-2 border-slate-100 rounded-2xl italic font-bold text-slate-400 text-center">
              "LA SUMA DE: {numeroALetras(totalDeudaReal)}"
           </div>
        </div>

        {/* INSTRUCCIONES DE PAGO */}
        <div className="mt-10 p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-900/5 grid grid-cols-12 gap-8 items-center">
           <div className="col-span-1 flex items-center justify-center">
              <Landmark size={40} className="text-emerald-700" />
           </div>
           <div className="col-span-11 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información para Consignar</p>
              <p className="text-[13px] font-bold text-slate-800 leading-snug">BANCO CAJA SOCIAL | Cuenta de Ahorros: 24511819298 | NIT Conjunto: 832.011.421-3</p>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter">Referencia de Pago: Convenio 15939402 • Por favor reporte su pago al WhatsApp Administrativo.</p>
           </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="mt-auto flex flex-col items-center gap-10 pt-16 border-t-2 border-slate-900">
           <div className="w-1/3 border-b-2 border-slate-400 relative h-10 flex items-end justify-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest absolute -bottom-6">Firma y Sello de Administración</span>
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic mt-4 italic underline underline-offset-4 decoration-emerald-500 decoration-2">
              "Juntos cuidamos el bienestar de Parque de las Flores"
           </p>
        </div>

      </div>
    </div>
  );
}