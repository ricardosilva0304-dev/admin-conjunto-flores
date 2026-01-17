"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, FileText, Landmark, User, History, Wallet } from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase.from("pagos").select("*").eq("residente_id", residente.id).order('fecha_pago', { ascending: false });
      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto">

      <style>{`
        @media print {
          @page { size: letter; margin: 1.5cm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: relative !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          section, tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* Control Toolbar */}
      <div className="no-print w-full max-w-5xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-xl">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <FileText size={16} /> Informe de Cartera: {residente.apartamento}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg">
            IMPRIMIR REPORTE
          </button>
          <button onClick={onClose} className="p-2 text-slate-300"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-5xl bg-white p-12 md:p-20 border font-sans shadow-2xl print:shadow-none print:border-0">

        {/* Fila 1: Logo e Identificación de Unidad */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-24 h-auto" />
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter">Estado de Cuenta Detallado</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Agrupación Res. Parque de las Flores</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black italic tabular-nums leading-none">T{residente.torre.slice(-1)}-{residente.apartamento}</h2>
            <p className="text-[8px] font-black text-slate-400 uppercase">Corte: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* Fila 2: Barra de Datos (Nombre, Pagado, Pendiente) */}
        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3 mb-6 bg-slate-50/50 p-2 rounded-lg">
          <div className="pl-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Propietario / Residente</p>
            <p className="text-xs font-black uppercase truncate">{residente.nombre}</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Recaudado</p>
            <p className="text-xs font-black text-emerald-600">
              ${pagos.reduce((acc: number, p: any) => acc + Number(p.monto_total || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="text-right pr-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
            <p className="text-xs font-black text-rose-600">
              ${deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Sección de Cartera Pendiente */}
        <section className="mb-16">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-t-lg flex items-center gap-2">
            <Wallet size={14} className="text-emerald-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Saldos Pendientes por Recaudar</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr className="font-black uppercase text-slate-500">
                <th className="p-4">Periodo</th>
                <th className="p-4">Concepto Detallado</th>
                <th className="p-4 text-right">Saldo Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deudas.map((d: any) => (
                <tr key={d.id}>
                  <td className="p-4 font-bold">{d.causaciones_globales?.mes_causado}</td>
                  <td className="p-4 text-slate-500 uppercase">{d.concepto_nombre}</td>
                  <td className="p-4 text-right font-black text-rose-600">${Number(d.saldo_pendiente).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Sección de Pagos Recibidos */}
        <section>
          <div className="bg-slate-100 text-slate-600 px-6 py-3 rounded-t-lg flex items-center gap-2 border-x border-t">
            <History size={14} className="text-emerald-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Historial de Pagos Registrados</h3>
          </div>
          <table className="w-full text-left text-xs border">
            <thead className="bg-slate-50 border-b">
              <tr className="font-black uppercase text-slate-400 text-[9px]">
                <th className="p-4">No. Recibo</th>
                <th className="p-4">Fecha Pago</th>
                <th className="p-4">Método</th>
                <th className="p-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagos.map((p: any) => (
                <tr key={p.id}>
                  <td className="p-4 font-black">RC-{p.numero_recibo}</td>
                  <td className="p-4">{p.fecha_pago}</td>
                  <td className="p-4 text-[10px] uppercase font-bold text-slate-400">{p.metodo_pago}</td>
                  <td className="p-4 text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer Legal */}
        <div className="mt-24 pt-10 border-t border-slate-200 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Certificación Administrativa Oficial</p>
          <p className="text-[9px] text-slate-300 mt-2 italic">Este documento es una relación informativa y no constituye un recibo legal de pago por sí mismo.</p>
        </div>

      </div>
    </div>
  );
}