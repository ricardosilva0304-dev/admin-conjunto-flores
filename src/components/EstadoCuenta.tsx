"use client";
import React from "react";
import { Printer, X, Building2, Calendar, Wallet } from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center p-4 overflow-y-auto">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2cm; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      <div className="no-print w-full max-w-4xl bg-white/10 p-6 rounded-[2.5rem] mb-6 flex justify-between items-center border border-white/10">
        <h3 className="text-white font-black uppercase tracking-widest text-sm">Estado de Cuenta Individual</h3>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all"><Printer size={18} /> Imprimir</button>
          <button onClick={onClose} className="text-white hover:bg-white/10 p-4 rounded-2xl transition-all"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-4xl bg-white p-16 border border-slate-200 text-slate-800 font-sans shadow-2xl flex flex-col min-h-[900px]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12 border-b-2 border-slate-900 pb-10">
           <img src="/logo.png" alt="Logo" className="w-40 h-auto" />
           <div className="text-right">
              <h2 className="font-black text-2xl leading-none mb-1 tracking-tighter">ESTADO DE CUENTA</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Parque de las Flores</p>
              <div className="bg-slate-900 text-white px-6 py-2 rounded-xl inline-block">
                 <span className="text-[10px] font-black uppercase">Unidad: {residente.torre.replace("Torre ","")}-{residente.apartamento}</span>
              </div>
           </div>
        </div>

        {/* INFO RESIDENTE */}
        <div className="grid grid-cols-2 gap-10 mb-12 bg-slate-50 p-8 rounded-3xl border border-slate-100">
           <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residente Titular</p>
              <p className="text-xl font-black uppercase text-slate-900">{residente.nombre}</p>
              <p className="text-xs font-bold text-slate-500">{residente.email || "Sin correo registrado"}</p>
           </div>
           <div className="text-right space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha de Generación</p>
              <p className="text-sm font-black">{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
           </div>
        </div>

        {/* TABLA DE DEUDAS */}
        <div className="flex-1">
           <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-3">
              <Wallet size={16} className="text-emerald-600" /> Detalle de Obligaciones Pendientes
           </h3>
           <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white">
                 <tr className="text-[10px] font-black uppercase tracking-widest">
                    <th className="py-4 px-6">Mes / Periodo</th>
                    <th className="py-4 px-6">Concepto</th>
                    <th className="py-4 px-6 text-right">Monto Original</th>
                    <th className="py-4 px-6 text-right">Saldo Actual</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                 {deudas.map((d: any) => (
                   <tr key={d.id}>
                      <td className="py-5 px-6 font-bold uppercase">{d.causaciones_globales.mes_causado}</td>
                      <td className="py-5 px-6 font-medium">{d.concepto_nombre || "ADMINISTRACIÓN"}</td>
                      <td className="py-5 px-6 text-right font-bold text-slate-400">${Number(d.monto_original).toLocaleString()}</td>
                      <td className="py-5 px-6 text-right font-black text-rose-600 text-base">${Number(d.saldo_pendiente).toLocaleString()}</td>
                   </tr>
                 ))}
                 <tr className="bg-slate-50">
                    <td colSpan={3} className="py-6 px-6 text-right font-black uppercase tracking-widest text-slate-900">Total Deuda Acumulada:</td>
                    <td className="py-6 px-6 text-right font-black text-2xl text-rose-600 underline decoration-2 underline-offset-4">
                      ${deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente), 0).toLocaleString()}
                    </td>
                 </tr>
              </tbody>
           </table>
        </div>

        {/* FOOTER */}
        <div className="mt-20 border-t border-slate-100 pt-8 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Por favor, póngase al día con sus obligaciones para evitar intereses de mora.</p>
           <p className="text-[8px] text-slate-300 uppercase tracking-widest">Documento generado automáticamente por el Panel Administrativo v1.0</p>
        </div>

      </div>
    </div>
  );
}