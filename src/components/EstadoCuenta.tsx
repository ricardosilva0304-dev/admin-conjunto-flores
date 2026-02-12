"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Wallet, History, Info, CheckCircle2, AlertCircle } from "lucide-react";

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

  // --- Lógica de Cálculos para el Resumen ---
  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;
    const hoy = new Date();
    const dia = hoy.getDate();
    const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);
    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;
    let precio = m1;
    if (hoy.getFullYear() > yC || (hoy.getFullYear() === yC && hoy.getMonth() + 1 > mC)) { precio = m3; } 
    else { if (dia > 10 && dia <= 20) precio = m2; else if (dia > 20) precio = m3; }
    return Math.max(0, precio - (m1 - (d.saldo_pendiente || 0)));
  };

  const totalDeuda = deudas.reduce((acc, d) => acc + calcularValorHoy(d), 0);
  const ultimoPago = pagos.length > 0 ? pagos[0] : null;

  // --- Lógica de Impresión ---
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
            .print-page { width: 100%; padding: 1.2cm; box-sizing: border-box; page-break-after: always; break-after: page; }
            .no-print-element { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #f8fafc !important; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>
            window.onload = () => { window.print(); setTimeout(() => { window.frameElement.remove(); }, 100); };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "-";
    const [year, month] = mesCausado.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  const ROWS_PER_PAGE = 16;
  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  const deudaPages = chunkArray(deudas, ROWS_PER_PAGE);

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      
      {/* BARRA DE HERRAMIENTAS FLOTANTE */}
      <div className="sticky top-0 w-full max-w-4xl bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center rounded-2xl shadow-2xl border border-white/20 z-10">
        <div>
          <h2 className="text-slate-900 font-bold">Panel de Impresión</h2>
          <p className="text-xs text-slate-500">Generando reporte para {residente.nombre_residente}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200">
            <Printer size={16} /> CONFIRMAR E IMPRIMIR
          </button>
          <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      <div ref={printRef} className="w-full flex flex-col items-center">
        {deudaPages.map((chunk, index) => (
          <div key={`page-${index}`} className="print-page bg-white shadow-2xl mb-10 w-full max-w-[816px] min-h-[1056px] relative flex flex-col">
            
            {/* ENCABEZADO PROFESIONAL */}
            <div className="flex justify-between items-start border-b-4 border-slate-800 pb-6 mb-8">
              <div className="flex items-center gap-5">
                <div className="bg-slate-100 p-3 rounded-2xl">
                  <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Estado de Cuenta</h1>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">P. De Las Flores | NIT 832.011.421-3</p>
                  <p className="text-[10px] text-slate-400">Calle Falsa 123, Ciudad, País | Tel: (601) 123 4567</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg inline-block mb-2">
                  <span className="text-2xl font-black italic">T{residente.torre.slice(-1)}-{residente.apartamento}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Fecha de Emisión</p>
                <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* INFORMACIÓN DEL RESIDENTE */}
            <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Titular de la Unidad</p>
                <p className="text-md font-bold text-slate-800">{residente.nombre_residente || 'N/A'}</p>
                <p className="text-xs text-slate-500">Cédula: {residente.cedula || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Resumen de Saldos</p>
                <p className={`text-2xl font-black ${totalDeuda > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${totalDeuda.toLocaleString()}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase">
                  Saldo Pendiente a la Fecha
                </span>
              </div>
            </div>

            {/* TABLA DE DEUDAS */}
            <div className="flex-grow">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Wallet size={14} className="text-emerald-600" /> Detalle de Conceptos Pendientes
              </h3>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-y-2 border-slate-200">
                    <th className="py-3 px-2 text-left text-slate-500 font-bold uppercase">Periodo</th>
                    <th className="py-3 px-2 text-left text-slate-500 font-bold uppercase">Concepto / Descripción</th>
                    <th className="py-3 px-2 text-right text-slate-500 font-bold uppercase">Valor Original</th>
                    <th className="py-3 px-2 text-right text-slate-800 font-black uppercase">Valor Hoy *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chunk.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-700">{formatPeriodo(d.causaciones_globales?.mes_causado)}</td>
                      <td className="py-3 px-2 text-slate-600">{d.concepto_nombre}</td>
                      <td className="py-3 px-2 text-right text-slate-400">${(d.monto_original || 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-bold text-rose-600">${calcularValorHoy(d).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PIE DE PÁGINA CON INSTRUCCIONES (Solo en la última página o todas) */}
            <div className="mt-10 border-t-2 border-slate-100 pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <h4 className="text-[10px] font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1">
                    <Info size={12}/> Canales de Pago Autorizados
                  </h4>
                  <ul className="text-[9px] text-emerald-700 space-y-1">
                    <li>• <b>Transferencia Bancaria:</b> Banco ABC - Cuenta de Ahorros No. 123-456789-01</li>
                    <li>• <b>Convenio Recaudo:</b> Punto de pago Efecty Convenio #9988 / Ref: {residente.apartamento}</li>
                    <li>• <b>Oficina:</b> Lunes a Viernes 8am - 5pm (Aceptamos tarjetas de débito/crédito)</li>
                  </ul>
                </div>
                <div className="text-[9px] text-slate-400 italic flex items-end justify-end text-right">
                  * El valor de los conceptos puede variar según la fecha de pago y las políticas de descuentos por pronto pago o intereses de mora vigentes.
                </div>
              </div>
              <div className="mt-6 text-center text-[9px] text-slate-300 font-medium uppercase tracking-widest">
                Documento generado automáticamente por el sistema de Control de Cartera
              </div>
            </div>

          </div>
        ))}

        {/* PÁGINA ADICIONAL: HISTORIAL DE PAGOS (Si hay pagos) */}
        {pagos.length > 0 && chunkArray(pagos, ROWS_PER_PAGE).map((chunk, index) => (
           <div key={`pago-page-${index}`} className="print-page bg-white shadow-2xl mb-10 w-full max-w-[816px] min-h-[1056px] p-[50px]">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-emerald-600" /> Historial Reciente de Pagos
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Página {index + 1} de Historial</span>
              </div>
              
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-3 text-left font-bold text-slate-500 uppercase">Recibo No.</th>
                    <th className="p-3 text-left font-bold text-slate-500 uppercase">Fecha</th>
                    <th className="p-3 text-left font-bold text-slate-500 uppercase">Método</th>
                    <th className="p-3 text-right font-bold text-slate-500 uppercase">Monto Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {chunk.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 font-bold text-slate-700">RC-{p.numero_recibo}</td>
                      <td className="p-3">{new Date(p.fecha_pago).toLocaleDateString()}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-slate-100 rounded uppercase text-[9px] font-bold">{p.metodo_pago}</span></td>
                      <td className="p-3 text-right font-bold text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
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