"use client";
import React, { useMemo, useRef } from "react";
import { Printer, X, Landmark, FileText, MapPin, Phone, Mail } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);

  // --- 1. LÓGICA DE FECHAS (Soporta Manual y Automático) ---
  const formatPeriodo = (d: any) => {
    const fechaStr = d.causaciones_globales?.mes_causado || d.fecha_vencimiento?.substring(0, 7);
    if (!fechaStr) return "";
    const [year, month] = fechaStr.split("-");
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const mesIndex = parseInt(month) - 1;
    return isNaN(mesIndex) ? "" : `${meses[mesIndex]} ${year}`;
  };

  // --- 2. LÓGICA DE VALORES (M1, M2, M3 + MODOS FORZADOS) ---
  // CORRECCIÓN: Cambiado el nombre a calcularValorHoy para coincidir con el resto del código
  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;

    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;
    const pagado = m1 - (d.saldo_pendiente || 0);

    // Revisar modo forzado
    const modo = d.causaciones_globales.tipo_cobro || 'NORMAL';
    if (modo === 'M1') return Math.max(0, m1 - pagado);
    if (modo === 'M2') return Math.max(0, m2 - pagado);
    if (modo === 'M3') return Math.max(0, m3 - pagado);

    // Lógica Automática Normal
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const mesCausado = d.causaciones_globales.mes_causado;
    if (!mesCausado) return d.saldo_pendiente || 0;

    const [yC, mC] = mesCausado.split("-").map(Number);
    let precio = m1;
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precio = m3;
    } else {
      if (dia > 10 && dia <= 20) precio = m2;
      else if (dia > 20) precio = m3;
    }

    return Math.max(0, precio - pagado);
  };

  // --- 3. ORDENAR CRONOLÓGICAMENTE ---
  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => {
      const fechaA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento?.substring(0, 7) || "9999-99";
      const fechaB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento?.substring(0, 7) || "9999-99";
      return fechaA.localeCompare(fechaB);
    });
  }, [deudas]);

  const total = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  // --- 4. MOTOR DE IMPRESIÓN ---
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
          <title>CC-${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: ui-sans-serif, system-ui, sans-serif; }
            .print-page { width: 100%; height: 100vh; padding: 2cm; box-sizing: border-box; position: relative; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #0f172a; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .text-right { text-align: right; }
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
          <div className="bg-amber-50 text-amber-600 p-2 rounded-lg border border-amber-100">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-sm uppercase">Cuenta de Cobro</h2>
            <p className="text-[10px] text-slate-500 font-bold">Unidad: {residente.torre} - {residente.apartamento}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg">
            <Printer size={16} /> IMPRIMIR
          </button>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* DOCUMENTO */}
      <div ref={printRef} className="w-[816px] min-h-[1056px] bg-white p-16 shadow-2xl text-slate-800 relative">

        {/* ENCABEZADO */}
        <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-900">
          <div className="flex gap-5">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            <div className="space-y-1">
              <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest">NIT. 832.011.421-3</p>
              <div className="pt-1 space-y-0.5">
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><MapPin size={10} /> Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><Phone size={10} /> 315 340 0657</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-4 py-1.5 rounded mb-2 inline-block">
              <span className="text-sm font-black italic uppercase text-white">CUENTA DE COBRO</span>
            </div>
            <p className="text-xl font-black text-slate-900">No. {new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{residente.apartamento}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Fecha: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* INFO RESIDENTE */}
        <div className="mb-10 bg-slate-50 rounded-lg p-4 border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsable</p>
            <h2 className="text-sm font-black text-slate-900 uppercase">{residente.nombre || "PROPIETARIO"}</h2>
            <p className="text-[10px] text-slate-500">Torre {residente.torre.slice(-1)} - Apto {residente.apartamento}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 italic">Total a Pagar</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">${total.toLocaleString()}</h2>
          </div>
        </div>

        {/* TABLA CONCEPTOS */}
        <table className="w-full mb-10 table-fixed border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-900">
              <th className="w-[20%] font-black text-slate-500 text-[10px] py-3">Periodo</th>
              <th className="w-[60%] font-black text-slate-500 text-[10px] py-3">Concepto</th>
              <th className="w-[20%] font-black text-slate-500 text-[10px] text-right py-3">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deudasOrdenadas.map((d: any) => {
              const textoPeriodo = formatPeriodo(d);

              // CALCULAMOS EL PRECIO DE LA TARIFA SELECCIONADA
              const m1 = d.precio_m1 || d.monto_original || 0;
              const m2 = d.precio_m2 || m1;
              const m3 = d.precio_m3 || m1;
              const modo = d.causaciones_globales?.tipo_cobro || 'NORMAL';

              let tarifaBase = m1;
              if (modo === 'M1') tarifaBase = m1;
              else if (modo === 'M2') tarifaBase = m2;
              else if (modo === 'M3') tarifaBase = m3;
              else {
                const hoy = new Date();
                const dia = hoy.getDate();
                const [yC, mC] = (d.causaciones_globales?.mes_causado || "0-0").split("-").map(Number);
                if (hoy.getFullYear() > yC || (hoy.getFullYear() === yC && hoy.getMonth() + 1 > mC)) tarifaBase = m3;
                else if (dia > 10 && dia <= 20) tarifaBase = m2;
                else if (dia > 20) tarifaBase = m3;
              }

              return (
                <tr key={d.id}>
                  <td className="py-3 align-top">
                    {textoPeriodo === "CARGO EXTRA" ? (
                      <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">Cargo Extra</span>
                    ) : (
                      <span className="font-bold text-slate-800 text-xs">{textoPeriodo}</span>
                    )}
                  </td>
                  <td className="text-xs text-slate-600 uppercase py-3 align-top leading-tight pr-4 break-words">
                    <span className="font-bold text-slate-800">
                      {d.concepto_nombre || d.causaciones_globales?.concepto_nombre}
                    </span>
                    <span className="ml-1 text-slate-400">
                      - {formatPeriodo(d)}
                    </span>
                  </td>

                  {/* Aquí mostramos la tarifa base que calculamos arriba */}
                  <td className="text-right font-bold text-slate-900 text-xs py-3 align-top tabular-nums">
                    ${tarifaBase.toLocaleString()}
                  </td>
                  <td className="py-6 px-4 text-right font-black text-2xl">
                    {total < 0 ? (
                      <span className="text-emerald-600">A FAVOR: ${Math.abs(total).toLocaleString()}</span>
                    ) : (
                      <span className="text-rose-600">${total.toLocaleString()}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* VALOR EN LETRAS */}
        <div className="mb-12 border-l-4 border-slate-300 pl-4 py-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">La suma de:</p>
          <p className="text-xs font-black italic text-slate-700 uppercase">{numeroALetras(total)} PESOS M/CTE.</p>
        </div>

        {/* PAGO Y FIRMA */}
        <div className="mt-auto grid grid-cols-2 gap-10 items-end">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-[10px] text-slate-600">
            <p className="font-black text-slate-800 uppercase mb-2">Instrucciones de Pago</p>
            <p>Banco: <b>Caja Social</b></p>
            <p>Cuenta Ahorros No: <b>24511819298</b></p>
            <p>Ref: <b>{residente.apartamento}</b></p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-slate-400 mx-auto mb-2"></div>
            <p className="text-[10px] font-black uppercase text-slate-800">Administración</p>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Copia Administración</p>
        </div>

      </div>
    </div>
  );
}