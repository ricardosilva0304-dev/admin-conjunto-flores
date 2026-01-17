"use client";
import React from "react";
import { Printer, X, FileText, Landmark, User, Building2 } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {

  const calcularValorACobrar = (deuda: any) => {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = (deuda.causaciones_globales?.mes_causado || "2000-01").split("-").map(Number);

    let precio = deuda.precio_m1 || 0;
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) precio = deuda.precio_m3;
    else {
      if (dia > 10 && dia <= 20) precio = deuda.precio_m2;
      if (dia > 20) precio = deuda.precio_m3;
    }
    const abonado = (deuda.precio_m1 || 0) - (deuda.saldo_pendiente || 0);
    return Math.max(0, precio - abonado);
  };

  const total = deudas.reduce((acc: number, d: any) => acc + calcularValorACobrar(d), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto">

      <style>{`
        @media print {
          @page { size: letter; margin: 1cm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-lg border border-slate-200">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Previsualización de Cobro</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer size={16} /> IMPRIMIR
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500"><X /></button>
        </div>
      </div>

      {/* Documento */}
      <div id="print-document" className="w-full max-w-4xl bg-white p-8 md:p-12 font-sans text-slate-800">

        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex gap-4 items-center">
            <img src="/logo.png" alt="Logo" className="w-24" />
            <div>
              <h2 className="text-xs font-black uppercase">Cuenta de Cobro Mensual</h2>
              <p className="text-[9px] font-bold text-slate-400">NIT. 832.011.421-3</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-3 py-1 rounded mb-1 inline-block">
              <p className="text-sm font-black italic">Ref: {residente.apartamento}-{new Date().getMonth() + 1}</p>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase">Emisión: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* Línea de Información del Residente (Minimalista) */}
        <div className="flex justify-between items-center mb-6 py-2 px-4 border border-slate-100 rounded-md bg-slate-50/30">
          <div className="flex gap-4">
            <span className="text-[9px] font-black text-slate-400 uppercase">Unidad: <span className="text-slate-900 ml-1">T{residente.torre.slice(-1)}-{residente.apartamento}</span></span>
            <span className="text-[9px] font-black text-slate-400 uppercase">Señor(a): <span className="text-slate-900 ml-1">{residente.nombre}</span></span>
          </div>
          <div className="text-[9px] font-black text-slate-400 uppercase">
            Destino: <span className="text-slate-900 ml-1">SOACHA, CUNDINAMARCA</span>
          </div>
        </div>

        {/* Tabla Detalle */}
        <div className="mb-10">
          <table className="w-full text-left">
            <thead className="border-b-2 border-slate-900">
              <tr className="text-[10px] font-black uppercase tracking-widest">
                <th className="py-4">Mes Periodo</th>
                <th className="py-4">Concepto</th>
                <th className="py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deudas.map((d: any) => (
                <tr key={d.id} className="text-sm">
                  <td className="py-4 font-bold">{d.causaciones_globales?.mes_causado}</td>
                  <td className="py-4 text-slate-500 uppercase text-xs">{d.concepto_nombre}</td>
                  <td className="py-4 text-right font-black">${calcularValorACobrar(d).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50">
                <td colSpan={2} className="py-6 px-4 text-right font-black uppercase text-xs">Total a Pagar:</td>
                <td className="py-6 px-4 text-right font-black text-2xl text-rose-600 tabular-nums">
                  ${total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Valor en Letras */}
        <div className="mb-10 p-4 border border-dashed border-slate-300 rounded-lg text-[11px] italic font-medium text-slate-500">
          Son: {numeroALetras(total)} pesos m/cte.
        </div>

        {/* Footer y Datos Banco */}
        <div className="grid grid-cols-2 gap-10 mt-20 pt-10 border-t border-slate-100">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-900">Canal de Pago:</p>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-bold">BANCO CAJA SOCIAL</p>
              <p className="text-[11px]">Cuenta Ahorros: <span className="font-black">24511819298</span></p>
              <p className="text-[10px] text-slate-500 mt-1">Ref: {residente.apartamento}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-end">
            <div className="w-full border-t border-slate-900 mb-2"></div>
            <p className="text-[9px] font-black uppercase text-slate-400">Administración / Tesorería</p>
          </div>
        </div>
      </div>
    </div>
  );
}