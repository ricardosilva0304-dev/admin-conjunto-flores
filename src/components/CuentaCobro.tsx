"use client";
import React from "react";
import { Printer, X, FileText, Landmark } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  // Lógica de cálculo dinámico para el valor exigible hoy
  const saldoExigible = deudas.reduce((acc: number, d: any) => {
    const hoy = new Date().getDate();
    let p = d.precio_m1;
    if (hoy > 10 && hoy <= 20) p = d.precio_m2;
    if (hoy > 20) p = d.precio_m3;
    const abonado = (d.monto_original || 0) - (d.saldo_pendiente || 0);
    return acc + Math.max(0, p - abonado);
  }, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex flex-col items-center p-4 overflow-y-auto no-scrollbar">
      <style>{`
        @media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 1.5cm; } .no-print { display: none !important; } }
      `}</style>

      {/* PANEL CONTROL */}
      <div className="no-print w-full max-w-3xl bg-white p-4 rounded-xl mb-4 flex justify-between items-center shadow-lg border border-slate-200">
        <h3 className="text-slate-800 font-bold text-xs uppercase flex items-center gap-2 ml-2"><FileText size={14}/> Generar Notificación de Cobro</h3>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-black transition-all">Imprimir Cobro</button>
           <button onClick={onClose} className="p-2 text-slate-400"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-3xl bg-white p-16 border border-slate-200 text-slate-800 font-sans shadow-sm min-h-[900px]">
         {/* CABECERA */}
         <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-10">
           <img src="/logo.png" alt="Logo" className="w-48 h-auto" />
           <div className="text-right">
              <h2 className="font-black text-2xl tracking-tighter">CUENTA DE COBRO</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Notificación de Cartera Mensual</p>
              <p className="text-[10px] mt-4 font-black">EMITIDO: {new Date().toLocaleDateString('es-CO')}</p>
           </div>
         </div>

         {/* TITULARES */}
         <div className="mb-10 text-sm">
            <p className="font-bold">CONJUNTO RESIDENCIAL EL PARQUE DE LAS FLORES (NIT 832.011.421-3)</p>
            <p className="mt-4 uppercase text-lg">Certifica que el residente:</p>
            <p className="font-black text-2xl underline decoration-slate-900 underline-offset-4 mt-2">{residente.nombre}</p>
            <p className="text-lg mt-2">Corresponiente a la unidad: <span className="font-black">T{residente.torre.replace("Torre ","")}-{residente.apartamento}</span></p>
         </div>

         <div className="bg-slate-50 border-2 border-slate-800 p-8 rounded-xl mb-8">
            <p className="font-bold text-center mb-6 uppercase tracking-widest text-slate-500 text-xs">Adeuda por conceptos de administración a la fecha:</p>
            
            {/* TABLA DE DEUDAS SIMPLIFICADA */}
            <table className="w-full text-sm mb-6">
              <thead><tr className="border-b border-slate-300 font-bold"><th className="pb-2">MES / CONCEPTO</th><th className="pb-2 text-right">VALOR VIGENTE</th></tr></thead>
              <tbody>
                {deudas.map((d: any) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="py-2 italic">{d.causaciones_globales?.mes_causado} - Cuota Admin</td>
                    <td className="py-2 text-right font-bold text-base tabular-nums">${d.saldo_pendiente.toLocaleString()}</td>
                  </tr>
                ))}
                <tr>
                   <td className="pt-6 font-black uppercase text-base text-slate-900">Total a Pagar hoy:</td>
                   <td className="pt-6 text-right font-black text-3xl text-rose-600 underline decoration-rose-600">${saldoExigible.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 p-4 border border-dashed border-slate-400 bg-white text-center italic text-xs font-bold text-slate-500">
               "La suma de: {numeroALetras(saldoExigible)}"
            </div>
         </div>

         {/* INFO PAGO */}
         <div className="border border-slate-200 p-6 rounded-2xl flex items-center gap-6 bg-slate-50 mb-12">
            <Landmark className="text-emerald-700" size={36}/>
            <div className="text-xs">
               <p className="font-black text-slate-900">INSTRUCCIONES DE PAGO</p>
               <p className="mt-1 font-bold">CONSIGNAR A: BANCO CAJA SOCIAL | Ahorros 24511819298</p>
               <p className="text-[10px]">Identificar con Unidad T{residente.torre.replace("Torre ","")}-{residente.apartamento} y enviar soporte por medio administrativo.</p>
            </div>
         </div>

         {/* FIRMA */}
         <div className="mt-auto flex flex-col items-center">
            <div className="w-1/3 border-b-2 border-slate-300 h-10 mb-2"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atentamente: Administración del Conjunto</p>
         </div>
      </div>
    </div>
  );
}