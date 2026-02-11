"use client";
import React, { useMemo } from "react";
import { Printer, X, Landmark } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {

  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "-";
    const [year, month] = mesCausado.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => {
      const fA = a.causaciones_globales?.mes_causado || "";
      const fB = b.causaciones_globales?.mes_causado || "";
      return fA.localeCompare(fB);
    });
  }, [deudas]);

  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;
    const hoy = new Date();
    const dia = hoy.getDate();
    const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);
    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;
    let precio = m1;
    if (hoy.getFullYear() > yC || (hoy.getFullYear() === yC && (hoy.getMonth() + 1) > mC)) {
      precio = m3;
    } else {
      if (dia > 10 && dia <= 20) precio = m2;
      else if (dia > 20) precio = m3;
    }
    return Math.max(0, precio - (m1 - (d.saldo_pendiente || 0)));
  };

  const total = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto print-container">
      <style>{`
        @media print {
          @page { size: letter; margin: 1.5cm; }
          html, body { height: auto !important; overflow: visible !important; }
          
          body > * { display: none !important; }
          body > .print-container { display: block !important; position: static !important; background: white !important; }

          #print-doc { 
            display: block !important; 
            position: static !important; 
            width: 100% !important; 
            box-shadow: none !important; 
            border: none !important;
            padding: 0 !important;
          }

          .print-container { background: white !important; backdrop-filter: none !important; }
          .no-print { display: none !important; }
          tr { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-lg border">
        <span className="text-xs font-black text-slate-400">DOCUMENTO DE COBRO</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer size={14} /> IMPRIMIR
          </button>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X /></button>
        </div>
      </div>

      <div id="print-doc" className="w-full max-w-4xl bg-white p-10 md:p-14 border border-slate-100 font-sans shadow-2xl">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-20" />
            <div>
              <h1 className="text-sm font-black uppercase">Cuenta de Cobro Mensual</h1>
              <p className="text-[9px] font-bold text-slate-400">NIT. 832.011.421-3</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-3 py-1 rounded text-sm font-black italic">
              Ref: {residente.apartamento}-{new Date().getMonth() + 1}
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Emisión: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 py-2 px-4 border bg-slate-50/50 rounded text-[10px] font-black uppercase">
          <span>Unidad: <span className="text-slate-500 ml-1">T{residente.torre.slice(-1)}-{residente.apartamento}</span></span>
          <span>Residente: <span className="text-slate-500 ml-1">{residente.nombre}</span></span>
        </div>

        <table className="w-full text-left text-xs mb-8">
          <thead className="border-b-2 border-slate-900">
            <tr className="font-black uppercase text-[9px]">
              <th className="py-2">Periodo</th><th>Concepto</th><th className="text-right">Vr. Actualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deudasOrdenadas.map((d: any) => (
              <tr key={d.id}>
                <td className="py-3 font-bold">{formatPeriodo(d.causaciones_globales?.mes_causado)}</td>
                <td className="py-3 uppercase text-slate-500">{d.concepto_nombre}</td>
                <td className="py-3 text-right font-black">${calcularValorHoy(d).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50">
              <td colSpan={2} className="py-6 px-4 text-right font-black uppercase text-xs">Total a Pagar Hoy:</td>
              <td className="py-6 px-4 text-right font-black text-2xl text-rose-600">${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <p className="text-[10px] italic text-slate-500 mb-10">Son: {numeroALetras(total)} pesos m/cte.</p>

        <div className="grid grid-cols-2 gap-10 border-t pt-8">
          <div className="p-4 border rounded-lg bg-slate-50/30">
            <p className="text-[9px] font-black uppercase mb-1 flex items-center gap-2"><Landmark size={12} /> Datos de Pago</p>
            <p className="text-[11px] font-bold">Banco Caja Social - Ahorros: <span className="font-black">24511819298</span></p>
            <p className="text-[10px] text-slate-500">Referencia: Apto {residente.apartamento}</p>
          </div>
          <div className="flex flex-col justify-end items-center">
            <div className="w-full border-t border-slate-900 mb-1"></div>
            <p className="text-[9px] font-black uppercase text-slate-400 italic">Tesorería / Administración</p>
          </div>
        </div>
      </div>
    </div>
  );
}