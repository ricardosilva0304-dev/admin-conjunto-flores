"use client";
import React, { useMemo, useRef } from "react";
import { Printer, X, FileText, MapPin, Phone } from "lucide-react";
import { numeroALetras, calcularValorDeudaHoy, formatPeriodo } from "@/lib/utils"; // Lógica unificada

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);

  // --- ORDENAR CRONOLÓGICAMENTE ---
  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => {
      const fechaA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento || "9999-99";
      const fechaB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento || "9999-99";
      return fechaA.localeCompare(fechaB);
    });
  }, [deudas]);

  // CÁLCULO TOTAL USANDO LIBRERÍA CENTRAL
  const total = deudas.reduce((acc: number, d: any) => acc + calcularValorDeudaHoy(d), 0);

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
          <title>CuentaCobro-${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: sans-serif; }
            .print-page { width: 100%; height: 100vh; padding: 2cm; box-sizing: border-box; position: relative; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { text-align: left; padding: 10px; border-bottom: 2px solid #000; text-transform: uppercase; font-weight: 900; }
            td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="print-page">${content.innerHTML}</div>
          <script>setTimeout(() => { window.print(); window.frameElement.remove(); }, 500);</script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-8 overflow-y-auto">

      {/* TOOLBAR */}
      <div className="no-print sticky top-0 w-full max-w-[816px] bg-white p-4 mb-6 flex justify-between items-center rounded-xl shadow-xl border border-slate-100 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2 rounded-lg"><FileText size={18} /></div>
          <div>
            <h2 className="text-slate-900 font-bold text-sm uppercase">Documento de Cobro</h2>
            <p className="text-[10px] text-slate-500 font-bold">Unidad: T{residente.torre.slice(-1)} - {residente.apartamento}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg">IMPRIMIR</button>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg"><X size={20} /></button>
        </div>
      </div>

      {/* DOCUMENTO */}
      <div ref={printRef} className="w-[816px] min-h-[1056px] bg-white p-16 shadow-2xl text-slate-800 relative">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-900">
          <div className="flex gap-5">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            <div className="space-y-1">
              <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest">NIT. 832.011.421-3</p>
              <div className="pt-1 space-y-0.5">
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><MapPin size={10} /> Soacha, Cundinamarca</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><Phone size={10} /> 315 340 0657</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-4 py-1.5 rounded mb-2 inline-block">
              <span className="text-sm font-black italic uppercase">CUENTA DE COBRO</span>
            </div>
            <p className="text-xl font-black text-slate-900">Nº {new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{residente.apartamento}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Corte: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* INFO RESIDENTE */}
        <div className="mb-10 bg-slate-50 rounded-lg p-6 border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsable de Unidad</p>
            <h2 className="text-lg font-black text-slate-900 uppercase">{residente.nombre || "PROPIETARIO"}</h2>
            <p className="text-xs text-slate-500 font-bold">Torre {residente.torre.slice(-1)} - Apto {residente.apartamento}</p>
          </div>
          <div className="text-right">
            <p className={`text-[9px] font-black uppercase mb-1 italic ${total < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {total < 0 ? 'Crédito a Favor' : 'Total a Pagar'}
            </p>
            <h2 className={`text-4xl font-black tracking-tighter tabular-nums ${total < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              ${Math.abs(total).toLocaleString()}
            </h2>
          </div>
        </div>

        {/* TABLA CONCEPTOS */}
        <table className="w-full mb-10 border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="w-[25%]">Periodo</th>
              <th className="w-[50%]">Concepto Detallado</th>
              <th className="w-[25%] text-right">Valor Hoy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deudasOrdenadas.map((d: any) => {
              const valorIndividual = calcularValorDeudaHoy(d);
              return (
                <tr key={d.id}>
                  <td className="py-4 font-bold text-slate-800 text-xs">
                    {formatPeriodo(d)}
                  </td>
                  <td className="text-xs text-slate-600 uppercase py-4 font-medium">
                    {d.causaciones_globales?.concepto_nombre || d.concepto_nombre}
                  </td>
                  <td className={`text-right font-black tabular-nums text-sm py-4 ${valorIndividual < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    ${Math.abs(valorIndividual).toLocaleString()} {valorIndividual < 0 ? '(CR)' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* VALOR EN LETRAS */}
        <div className="mb-12 border-l-4 border-slate-900 pl-5 py-2 bg-slate-50/50">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">La suma de:</p>
          <p className="text-xs font-black italic text-slate-700 uppercase">{numeroALetras(total)}</p>
        </div>

        {/* PAGO Y FIRMA */}
        <div className="mt-auto grid grid-cols-2 gap-10 items-end">
          <div className="bg-slate-900 text-white p-5 rounded-xl text-[10px] space-y-1">
            <p className="font-black text-emerald-400 uppercase mb-2 tracking-widest">Instrucciones de Recaudo</p>
            <p>Banco: <b>Caja Social</b> • Ahorros</p>
            <p>Cuenta: <b>24511819298</b></p>
            <p>Convenio: <b>15939402</b> • Ref: <b>{residente.apartamento}</b></p>
          </div>
          <div className="text-center pb-2">
            <div className="w-48 border-t-2 border-slate-900 mx-auto mb-2"></div>
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Administración / Tesorería</p>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">Original Administración - Copia Residente</p>
        </div>

      </div>
    </div>
  );
}