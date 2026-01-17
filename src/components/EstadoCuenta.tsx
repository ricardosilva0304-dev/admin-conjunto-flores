"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Wallet, History, FileText } from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("residente_id", residente.id)
        .order('fecha_pago', { ascending: false });
      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  // --- LÓGICA M1, M2, M3 CORREGIDA ---
  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales?.mes_causado) return d.saldo_pendiente || 0;

    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

    // Mapeo de columnas (Busca ambos nombres por seguridad)
    const m1 = d.monto_1_10 || d.precio_m1 || 0;
    const m2 = d.monto_11_20 || d.precio_m2 || m1;
    const m3 = d.monto_21_adelante || d.precio_m3 || m1;

    let precioAplicable = m1;

    // Si la deuda es de meses pasados -> Mora (M3)
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioAplicable = m3;
    } else {
      // Si es el mes actual -> Tramos por día
      if (dia > 10 && dia <= 20) precioAplicable = m2;
      else if (dia > 20) precioAplicable = m3;
    }

    // Calcular abono previo (M1 original - Saldo en DB)
    const pagadoYa = m1 - (d.saldo_pendiente || 0);
    return Math.max(0, precioAplicable - pagadoYa);
  };

  const totalPendiente = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto">
      <style>{`
        @media print {
          @page { size: letter; margin: 1cm; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-lg border">
        <span className="text-[10px] font-black uppercase text-slate-400">Auditoría: {residente.apartamento}</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold">IMPRIMIR</button>
          <button onClick={onClose} className="p-2 text-slate-300"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-4xl bg-white p-8 md:p-12 shadow-2xl font-sans">
        {/* ENCABEZADO MINIMALISTA */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-20" />
            <div>
              <h1 className="text-sm font-black uppercase">Estado de Cuenta</h1>
              <p className="text-[9px] font-bold text-slate-400">P. DE LAS FLORES - NIT 832.011.421-3</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black italic">T{residente.torre.slice(-1)}-{residente.apartamento}</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase">Corte: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* RESUMEN LINEAL */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase">Residente</p>
            <p className="text-xs font-black uppercase truncate">{residente.nombre}</p>
          </div>
          <div className="text-center border-x">
            <p className="text-[8px] font-black text-slate-400 uppercase">Total Recaudado</p>
            <p className="text-xs font-black text-emerald-600">${pagos.reduce((acc,p)=>acc+Number(p.monto_total || 0),0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase">Saldo Hoy (Tramos)</p>
            <p className="text-xs font-black text-rose-600">${totalPendiente.toLocaleString()}</p>
          </div>
        </div>

        {/* TABLAS */}
        <div className="space-y-8">
          <section>
            <h3 className="text-[9px] font-black uppercase mb-2 flex items-center gap-2"><Wallet size={10}/> Deudas Pendientes</h3>
            <table className="w-full text-[10px] text-left">
              <thead className="border-b font-black uppercase text-slate-400">
                <tr><th className="py-2">Periodo</th><th>Concepto</th><th className="text-right">Valor Hoy</th></tr>
              </thead>
              <tbody className="divide-y">
                {deudas.map((d: any) => (
                  <tr key={d.id}>
                    <td className="py-2 font-bold">{d.causaciones_globales?.mes_causado}</td>
                    <td className="py-2 uppercase text-slate-500">{d.concepto_nombre}</td>
                    <td className="py-2 text-right font-black text-rose-600">${calcularValorHoy(d).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-[9px] font-black uppercase mb-2 flex items-center gap-2"><History size={10}/> Historial de Pagos</h3>
            <table className="w-full text-[10px] text-left border">
              <thead className="bg-slate-50 border-b font-black uppercase text-slate-400">
                <tr><th className="p-2">Recibo</th><th>Fecha</th><th>Medio</th><th className="p-2 text-right">Monto</th></tr>
              </thead>
              <tbody className="divide-y">
                {pagos.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-2 font-black">RC-{p.numero_recibo}</td>
                    <td>{p.fecha_pago}</td>
                    <td className="text-[8px] uppercase">{p.metodo_pago}</td>
                    <td className="p-2 text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}