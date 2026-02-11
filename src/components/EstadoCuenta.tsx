"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Wallet, History } from "lucide-react";

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

  // Formato de periodo: 2025-02 -> Febrero 2025
  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "-";
    const [year, month] = mesCausado.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  // Ordenar deudas de más antigua a más reciente
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

  const totalPendiente = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <style>{`
        @media print {
          /* Configuración de página */
          @page {
            size: letter;
            margin: 1cm;
          }
          
          /* Resetear completamente el body y html */
          html, body {
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            overflow: visible;
            background: white;
          }
          
          /* Ocultar el overlay de fondo */
          body > div:first-child {
            position: static !important;
            background: white !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Ocultar botones y controles */
          .no-print {
            display: none !important;
          }
          
          /* El área de impresión debe ser estática y fluir naturalmente */
          #print-area {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Control de saltos de página - permitir que fluya */
          table {
            page-break-inside: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Asegurar que los colores se impriman */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Asegurar que todo el contenedor padre sea visible */
          .fixed {
            position: static !important;
          }
          
          .inset-0 {
            position: static !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto print:static print:bg-white print:p-0">
        {/* Botones de control - NO SE IMPRIMEN */}
        <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-lg border">
          <span className="text-[10px] font-black uppercase text-slate-400">Auditoría: {residente.apartamento}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()} 
              className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Printer size={14} /> IMPRIMIR
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <X />
            </button>
          </div>
        </div>

        {/* CONTENIDO A IMPRIMIR */}
        <div id="print-area" className="w-full max-w-4xl bg-white p-8 md:p-12 border border-slate-100 font-sans shadow-2xl print:max-w-full print:shadow-none print:border-0 print:p-0">
          {/* ENCABEZADO */}
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

          {/* RESUMEN */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
            <div className="p-1">
              <p className="text-[8px] font-black text-slate-400 uppercase">Residente</p>
              <p className="text-xs font-black uppercase truncate">{residente.nombre}</p>
            </div>
            <div className="p-1 text-center border-x border-slate-200">
              <p className="text-[8px] font-black text-slate-400 uppercase">Total Recaudado</p>
              <p className="text-xs font-black text-emerald-600">${pagos.reduce((acc, p) => acc + Number(p.monto_total || 0), 0).toLocaleString()}</p>
            </div>
            <div className="p-1 text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase">Saldo Hoy (Tramos)</p>
              <p className="text-xs font-black text-rose-600">${totalPendiente.toLocaleString()}</p>
            </div>
          </div>

          {/* DEUDAS PENDIENTES */}
          <section className="mb-8">
            <h3 className="text-[9px] font-black uppercase mb-2 flex items-center gap-2 border-b pb-1">
              <Wallet size={10} /> Deudas Pendientes
            </h3>
            <table className="w-full text-[10px] text-left">
              <thead className="border-b font-black uppercase text-slate-400">
                <tr>
                  <th className="py-2">Periodo</th>
                  <th>Concepto</th>
                  <th className="text-right">Valor Hoy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deudasOrdenadas.map((d: any) => (
                  <tr key={d.id}>
                    <td className="py-2 font-bold">{formatPeriodo(d.causaciones_globales?.mes_causado)}</td>
                    <td className="py-2 uppercase text-slate-500">{d.concepto_nombre}</td>
                    <td className="py-2 text-right font-black text-rose-600">${calcularValorHoy(d).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* HISTORIAL DE PAGOS */}
          <section>
            <h3 className="text-[9px] font-black uppercase mb-2 flex items-center gap-2 border-b pb-1">
              <History size={10} /> Historial de Pagos
            </h3>
            <table className="w-full text-[10px] text-left border">
              <thead className="bg-slate-50 border-b font-black uppercase text-slate-400">
                <tr>
                  <th className="p-2">Recibo</th>
                  <th>Fecha</th>
                  <th>Medio</th>
                  <th className="p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagos.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-2 font-black">RC-{p.numero_recibo}</td>
                    <td>{new Date(p.fecha_pago).toLocaleDateString()}</td>
                    <td className="text-[8px] uppercase">{p.metodo_pago}</td>
                    <td className="p-2 text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>
  );
}