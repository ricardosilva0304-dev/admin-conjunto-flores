"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy, formatPeriodo } from "@/lib/utils"; // Lógica unificada
import { Printer, X, Loader2, Wallet, History, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

interface Props {
  residente: any;
  deudas: any[];
  onClose: () => void;
}

export default function EstadoCuenta({ residente, deudas, onClose }: Props) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("residente_id", residente.id)
        .order("fecha_pago", { ascending: false });
      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  // CALCULO GLOBAL USANDO LIBRERIA CENTRAL
  const totalDeuda = deudas.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);

  // --- PAGINACIÓN Y ORDENAMIENTO ---
  const ROWS_PER_PAGE = 13;
  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => {
      const fA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento || "9999-12";
      const fB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento || "9999-12";
      return fA.localeCompare(fB);
    });
  }, [deudas]);

  const deudaPages = chunkArray(deudasOrdenadas, ROWS_PER_PAGE);
  const pagosPages = chunkArray(pagos, ROWS_PER_PAGE + 5);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");

    doc.write(`
      <html>
        <head>
          <title>Estado de Cuenta - ${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: sans-serif; }
            .print-page { width: 100%; height: 100vh; padding: 1.5cm; box-sizing: border-box; page-break-after: always; position: relative; }
            .print-page:last-child { page-break-after: auto; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
            th { background-color: #f1f5f9 !important; color: #64748b !important; font-weight: 800 !important; text-transform: uppercase; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="print-container">${content.innerHTML}</div>
          <script>setTimeout(() => { window.print(); window.frameElement.remove(); }, 500);</script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[300] flex flex-col items-center p-4 md:p-6 overflow-y-auto">

      <div className="no-print sticky top-0 w-full max-w-[816px] bg-white p-4 mb-6 flex justify-between items-center rounded-xl shadow-xl z-50 border border-slate-100">
        <div>
          <h2 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Hoja de Vida Financiera</h2>
          <p className="text-[10px] text-slate-400 font-bold">Unidad: T{residente.torre.slice(-1)} - {residente.apartamento}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
            <Printer size={16} /> IMPRIMIR
          </button>
          <button onClick={onClose} className="bg-slate-100 hover:bg-rose-100 text-slate-400 p-2 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      <div ref={printRef} className="w-full flex flex-col items-center gap-8 pb-20">

        {deudaPages.length > 0 ? deudaPages.map((chunk, index) => (
          <div key={`page-${index}`} className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col relative overflow-hidden">

            {/* ENCABEZADO */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex gap-5">
                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                <div>
                  <h1 className="text-lg font-black text-slate-900 uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h1>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest mb-1">NIT. 832.011.421-3</p>
                  <p className="text-[9px] text-slate-500">Soacha, Cundinamarca • Cel: 315 340 0657</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-3 py-1 rounded mb-1 inline-block">
                  <span className="text-xl font-black italic">ESTADO DE CUENTA</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Corte: {new Date().toLocaleDateString('es-CO')}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Pág. {index + 1} de {deudaPages.length + pagosPages.length}</p>
              </div>
            </div>

            {/* RESUMEN DE SALDO */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsable</p>
                <p className="text-sm font-black text-slate-800 uppercase mb-1">{residente.nombre || 'Propietario'}</p>
                <span className="text-[9px] text-slate-500 font-medium">T{residente.torre.slice(-1)} - Apto {residente.apartamento}</span>
              </div>
              <div className="text-right flex flex-col justify-center border-l border-slate-200 pl-6">
                <p className={`text-[9px] font-black uppercase mb-1 ${totalDeuda < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {totalDeuda < 0 ? 'SALDO A FAVOR (CR)' : 'TOTAL DEUDA PENDIENTE'}
                </p>
                <p className={`text-3xl font-black tabular-nums tracking-tighter ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${Math.abs(totalDeuda).toLocaleString()}
                </p>
              </div>
            </div>

            {/* TABLA DE DEUDAS */}
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase text-slate-800 mb-2 flex items-center gap-2">
                <Wallet size={12} className="text-emerald-600" /> Detalle de Obligaciones
              </h3>

              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="w-[25%] py-2">Periodo</th>
                    <th className="w-[50%] py-2">Concepto</th>
                    <th className="w-[25%] py-2 text-right">Saldo Hoy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chunk.map((d: any) => {
                    const valorHoy = calcularValorDeudaHoy(d);
                    return (
                      <tr key={d.id}>
                        <td className="py-2 font-bold text-slate-800">{formatPeriodo(d)}</td>
                        <td className="py-2 text-slate-600 uppercase pr-2 font-medium">
                          {d.causaciones_globales?.concepto_nombre || d.concepto_nombre}
                        </td>
                        <td className={`py-2 text-right font-black tabular-nums ${valorHoy < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${Math.abs(valorHoy).toLocaleString()} {valorHoy < 0 ? '(CR)' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PIE DE PÁGINA */}
            <div className="mt-auto border-t-2 border-slate-800 pt-4">
               <div className="flex justify-between items-end">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">
                    Banco Caja Social • Ahorros • 24511819298 • Ref: {residente.apartamento}
                  </div>
                  <div className="text-[8px] text-slate-300">AdminPro - El Parque de las Flores</div>
               </div>
            </div>
          </div>
        )) : (
          /* VISTA PAZ Y SALVO */
          <div className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col items-center justify-center text-center p-20 border-8 border-double border-emerald-50">
            <CheckCircle2 size={80} className="text-emerald-500 mb-6" />
            <h1 className="text-4xl font-black text-slate-900 uppercase">Certificado de Paz y Salvo</h1>
            <p className="text-xl text-slate-700 mt-4">La unidad <b>T{residente.torre.slice(-1)} - {residente.apartamento}</b> se encuentra al día.</p>
          </div>
        )}

        {/* HISTORIAL DE PAGOS */}
        {pagos.length > 0 && pagosPages.map((chunk, index) => (
          <div key={`pago-page-${index}`} className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col">
            <div className="border-b-2 pb-4 mb-6 flex justify-between items-end">
              <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><History size={16} className="text-emerald-600" /> Historial de Pagos</h3>
              <span className="text-[9px] font-bold text-slate-400">Anexo {index + 1}</span>
            </div>
            <table className="w-full">
              <thead><tr><th>Recibo</th><th>Fecha</th><th>Concepto Principal</th><th className="text-right">Monto Pagado</th></tr></thead>
              <tbody className="divide-y text-[10px]">
                {chunk.map((p) => (
                  <tr key={p.id}>
                    <td className="font-bold py-2">RC-{p.numero_recibo}</td>
                    <td>{p.fecha_pago}</td>
                    <td className="uppercase truncate">{p.concepto_texto?.split("||")[0].split("|")[0]}</td>
                    <td className="text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}