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

        {/* Header */}
        <div className="flex justify-between items-end border-b-4 border-slate-900 pb-10 mb-12">
          <div className="space-y-4">
            <img src="/logo.png" alt="Logo" className="w-48" />
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900">Estado de Cuenta</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen General de Obligaciones y Pagos</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-slate-900">T{residente.torre.slice(-1)}-{residente.apartamento}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Corte: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* Grid de Resumen */}
        <div className="grid grid-cols-2 gap-10 mb-16">
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Titular de la Unidad:</p>
            <p className="text-xl font-black uppercase">{residente.nombre}</p>
            <p className="text-xs font-bold text-emerald-600 mt-1">{residente.email || 'Sin registro de correo'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 border rounded-2xl text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Pagado</p>
              <p className="text-lg font-black text-emerald-600">
                ${pagos.reduce((acc: number, p: any) => acc + Number(p.monto_total || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-6 border rounded-2xl bg-rose-50 border-rose-100 text-center">
              <p className="text-[8px] font-black text-rose-400 uppercase mb-1">Saldo Pendiente</p>
              <p className="text-lg font-black text-rose-600">
                ${deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente || 0), 0).toLocaleString()}
              </p>
            </div>
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