"use client";
import React, { useMemo, useRef } from "react";
import { Printer, X, Landmark, FileText, User, MapPin } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "-";
    const [year, month] = mesCausado.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

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

  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => (a.causaciones_globales?.mes_causado || "").localeCompare(b.causaciones_globales?.mes_causado || ""));
  }, [deudas]);

  const total = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  // --- FUNCIÓN DE IMPRESIÓN SOLIDA ---
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
          <title>Cuenta de Cobro - ${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: 'Inter', sans-serif; }
            .print-doc { width: 100%; padding: 2cm; box-sizing: border-box; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <div class="print-doc">${content.innerHTML}</div>
          <script>
            window.onload = () => { window.print(); setTimeout(() => { window.frameElement.remove(); }, 100); };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      
      {/* TOOLBAR */}
      <div className="sticky top-0 w-full max-w-4xl bg-white p-4 mb-6 flex justify-between items-center rounded-2xl shadow-2xl border border-slate-100 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-700 p-2 rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-sm">Cuenta de Cobro</h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Referencia: CC-{new Date().getFullYear()}{new Date().getMonth()+1}-{residente.apartamento}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
            <Printer size={16} /> IMPRIMIR DOCUMENTO
          </button>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2.5 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* DOCUMENTO RE-DISEÑADO */}
      <div ref={printRef} className="w-full max-w-[816px] bg-white p-16 shadow-2xl border border-slate-100 text-slate-800">
        
        {/* HEADER FORMAL */}
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-2">
            <img src="/logo.png" alt="Logo" className="w-24 mb-4" />
            <h1 className="text-xl font-black text-slate-900">PARQUE DE LAS FLORES</h1>
            <p className="text-xs font-bold text-slate-500 uppercase">Propiedad Horizontal - NIT: 832.011.421-3</p>
            <p className="text-[10px] text-slate-400 w-64">Administración Central: Calle 123 #45-67, Bogotá D.C.<br/>Correo: administracion@flores.com | Tel: 601 234 5678</p>
          </div>
          <div className="text-right space-y-1">
            <div className="bg-slate-100 px-4 py-3 rounded-xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuenta de Cobro No.</p>
              <p className="text-xl font-black text-slate-900">CC-{new Date().getFullYear()}{new Date().getMonth()+1}-{residente.apartamento}</p>
            </div>
            <p className="text-[10px] font-bold text-slate-500 pt-2 uppercase">Fecha de Expedición</p>
            <p className="text-xs font-black">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* SECCIÓN "DEBE A" */}
        <div className="grid grid-cols-2 gap-12 mb-10 pb-10 border-b border-slate-100">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Deudor / Residente</h3>
            <div className="flex items-start gap-3">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase">{residente.nombre || residente.nombre_residente || 'N/A'}</p>
                <p className="text-xs text-slate-500">C.C. {residente.cedula || '---'}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Ubicación de la Unidad</h3>
            <div className="flex items-start gap-3">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">TORRE {residente.torre.slice(-1)} - APTO {residente.apartamento}</p>
                <p className="text-xs text-slate-500">Agrupación Residencial Parque de las Flores</p>
              </div>
            </div>
          </div>
        </div>

        {/* CUERPO DEL DOCUMENTO */}
        <div className="mb-10 text-sm leading-relaxed text-slate-700">
          La Administración de la <b>Agrupación Residencial Parque de las Flores</b> hace constar que la unidad arriba mencionada
          adeuda a la fecha, por conceptos de administración y otros servicios comunes, los siguientes valores:
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-y-2 border-slate-900 text-[10px] font-black uppercase text-slate-500">
              <th className="py-4 text-left">Periodo Causado</th>
              <th className="py-4 text-left">Concepto del Cobro</th>
              <th className="py-4 text-right">Valor a Pagar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deudasOrdenadas.map((d: any) => (
              <tr key={d.id} className="text-xs">
                <td className="py-4 font-bold text-slate-900">{formatPeriodo(d.causaciones_globales?.mes_causado)}</td>
                <td className="py-4 uppercase text-slate-500">{d.concepto_nombre}</td>
                <td className="py-4 text-right font-black text-slate-900">${calcularValorHoy(d).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50/50">
              <td colSpan={2} className="py-6 px-4 text-right font-black uppercase text-xs text-slate-500">Total Neto a Pagar:</td>
              <td className="py-6 px-4 text-right font-black text-2xl text-slate-900">${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        {/* VALOR EN LETRAS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 mb-12">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Valor Total en Letras</p>
          <p className="text-xs font-bold italic text-slate-600 uppercase">
            Son: {numeroALetras(total)} pesos m/cte.
          </p>
        </div>

        {/* INSTRUCCIONES Y FIRMA */}
        <div className="grid grid-cols-2 gap-16 mt-20">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Landmark size={14} className="text-amber-600" />
              <h4 className="text-[10px] font-black uppercase">Instrucciones de Pago</h4>
            </div>
            <div className="text-[10px] space-y-1 text-slate-500 border-l-2 border-slate-200 pl-4">
              <p><b>Banco:</b> Banco Caja Social</p>
              <p><b>Tipo Cuenta:</b> Cuenta de Ahorros</p>
              <p><b>Número:</b> 24511819298</p>
              <p><b>Titular:</b> Parque de las Flores P.H.</p>
              <p className="pt-2 italic">* Favor enviar comprobante al correo de administración indicando Torre y Apto.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="w-full border-t border-slate-400 mb-3"></div>
            <p className="text-[10px] font-black uppercase text-slate-900">Administración / Tesorería</p>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest">Firma Autorizada</p>
          </div>
        </div>

        {/* FOOTER DE PÁGINA */}
        <div className="mt-20 pt-8 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-300 font-medium uppercase tracking-[0.2em]">
            Este documento no constituye factura de venta, es una cuenta de cobro para efectos de cobro administrativo.
          </p>
        </div>
      </div>
    </div>
  );
}