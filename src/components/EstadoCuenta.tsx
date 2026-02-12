"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Wallet, History, Info, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

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

  // --- 1. LÓGICA DE CÁLCULOS (M1, M2, M3 + MODOS FORZADOS) ---
  const calcularValorHoy = (d: any) => {
    // Si es manual (sin causación), devuelve saldo directo
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;

    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;
    const pagado = m1 - (d.saldo_pendiente || 0);

    // Revisar si hay un modo forzado (M1, M2, M3)
    const modo = d.causaciones_globales.tipo_cobro || 'NORMAL';

    if (modo === 'M1') return Math.max(0, m1 - pagado);
    if (modo === 'M2') return Math.max(0, m2 - pagado);
    if (modo === 'M3') return Math.max(0, m3 - pagado);

    // Lógica Normal (AUTO por fecha)
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

  const totalDeuda = deudas.reduce((acc, d) => acc + calcularValorHoy(d), 0);

  // --- 2. FORMATEO DE PERIODO (Soporta Manual y Automático) ---
  const formatPeriodo = (d: any) => {
    const fechaStr = d.causaciones_globales?.mes_causado || d.fecha_vencimiento?.substring(0, 7);
    if (!fechaStr) return "CARGO EXTRA";

    const [year, month] = fechaStr.split("-");
    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const mesIndex = parseInt(month) - 1;
    
    if (isNaN(mesIndex) || mesIndex < 0 || mesIndex > 11) return "CARGO EXTRA";
    return `${meses[mesIndex]} ${year}`;
  };

  // --- 3. PAGINACIÓN Y ORDENAMIENTO ---
  const ROWS_PER_PAGE = 13;

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  const deudasOrdenadas = [...deudas].sort((a, b) => {
    const fechaA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento?.substring(0, 7) || "9999-99";
    const fechaB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento?.substring(0, 7) || "9999-99";
    return fechaA.localeCompare(fechaB);
  });

  const deudaPages = chunkArray(deudasOrdenadas, ROWS_PER_PAGE);
  const pagosPages = chunkArray(pagos, ROWS_PER_PAGE + 5);

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
          <title>Estado de Cuenta - ${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: ui-sans-serif, system-ui, sans-serif; }
            .print-page { width: 100%; height: 100vh; padding: 1.5cm; box-sizing: border-box; page-break-after: always; position: relative; }
            .print-page:last-child { page-break-after: auto; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; table-fixed; }
            th { background-color: #f1f5f9 !important; color: #64748b !important; font-weight: 800 !important; text-transform: uppercase; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="print-container">${content.innerHTML}</div>
          <script>
            setTimeout(() => { window.print(); window.frameElement.remove(); }, 500);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[300] flex flex-col items-center p-4 md:p-6 overflow-y-auto">

      {/* BARRA DE HERRAMIENTAS */}
      <div className="no-print sticky top-0 w-full max-w-[816px] bg-white p-4 mb-6 flex justify-between items-center rounded-xl shadow-xl z-50 border border-slate-100">
        <div>
          <h2 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Vista Previa</h2>
          <p className="text-[10px] text-slate-400 font-bold">Unidad: {residente.torre} - {residente.apartamento}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg">
            <Printer size={16} /> IMPRIMIR
          </button>
          <button onClick={onClose} className="bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE HOJAS */}
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
                  <p className="text-[9px] text-slate-500 flex items-center gap-1"><MapPin size={10} /> Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
                  <p className="text-[9px] text-slate-500 flex items-center gap-1"><Phone size={10} /> 315 340 0657</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-3 py-1 rounded mb-1 inline-block">
                  <span className="text-xl font-black italic">ESTADO DE CUENTA</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Corte: {new Date().toLocaleDateString('es-CO')}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Pág. {index + 1} de {deudaPages.length + (pagosPages.length > 0 ? pagosPages.length : 0)}</p>
              </div>
            </div>

            {/* DATOS RESIDENTE */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsable</p>
                <p className="text-sm font-black text-slate-800 uppercase mb-1">{residente.nombre || 'Propietario'}</p>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"><MapPin size={10} className="text-emerald-500" /> {residente.torre} - Apt {residente.apartamento}</span>
                  <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"><Mail size={10} className="text-emerald-500" /> {residente.email || 'Sin correo registrado'}</span>
                  <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"><Phone size={10} className="text-emerald-500" /> {residente.celular || 'Sin teléfono'}</span>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center border-l border-slate-200 pl-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Deuda a la Fecha</p>
                <p className={`text-3xl font-black tabular-nums tracking-tighter ${totalDeuda > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${totalDeuda.toLocaleString()}
                </p>
              </div>
            </div>

            {/* TABLA DE DEUDAS */}
            <div className="flex-1 mt-6">
              <h3 className="text-[10px] font-black uppercase text-slate-800 mb-2 flex items-center gap-2">
                <Wallet size={12} className="text-emerald-600" /> Detalle de Obligaciones
              </h3>

              <table className="w-full text-[10px] table-fixed border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="w-[20%] py-2 text-left font-black text-slate-500 uppercase">Periodo</th>
                    <th className="w-[50%] py-2 text-left font-black text-slate-500 uppercase">Concepto</th>
                    <th className="w-[15%] py-2 text-right font-black text-slate-500 uppercase">Vr. Original</th>
                    <th className="w-[15%] py-2 text-right font-black text-slate-800 uppercase">Saldo Hoy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chunk.map((d: any) => {
                    const periodoTexto = formatPeriodo(d);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2">
                          {periodoTexto === "CARGO EXTRA" ? (
                            <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-slate-200 uppercase">Cargo Extra</span>
                          ) : (
                            <span className="font-bold text-slate-800">{periodoTexto}</span>
                          )}
                        </td>
                        <td className="py-2 text-slate-600 uppercase pr-2 leading-tight break-words">
                          {d.concepto_nombre || d.causaciones_globales?.concepto_nombre}
                        </td>
                        <td className="py-2 text-right text-slate-400 tabular-nums">
                          ${(d.monto_original || 0).toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-black text-rose-600 tabular-nums">
                          ${calcularValorHoy(d).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PIE DE PAGINA */}
            <div className="mt-auto border-t-2 border-slate-800 pt-4">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-[9px] text-slate-500">
                   <p className="font-bold text-slate-800 mb-1 uppercase">Información de Pago</p>
                   <p>Banco Caja Social • Ahorros • No. 24511819298</p>
                   <p>Convenio: 15939402 • Ref: {residente.apartamento}</p>
                </div>
                <div className="text-right text-[8px] text-slate-300">
                  Generado automáticamente por AdminPro Flores
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col items-center justify-center text-center p-20 border-4 border-double border-emerald-100">
            <CheckCircle2 size={60} className="text-emerald-500 mb-6" />
            <h1 className="text-4xl font-black text-slate-900 uppercase">Paz y Salvo</h1>
            <p className="text-lg text-slate-700 mt-4 max-w-lg">La unidad <b>{residente.torre} - {residente.apartamento}</b> se encuentra al día con sus obligaciones.</p>
          </div>
        )}

        {/* HISTORIAL PAGOS */}
        {pagos.length > 0 && pagosPages.map((chunk, index) => (
          <div key={`pago-page-${index}`} className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col">
            <div className="border-b-2 pb-4 mb-6 flex justify-between items-end">
              <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><History size={16} className="text-emerald-600" /> Historial de Pagos</h3>
              <span className="text-[9px] font-bold text-slate-400">Anexo {index + 1}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr><th>Recibo No.</th><th>Fecha</th><th>Concepto</th><th>Medio</th><th className="text-right">Monto</th></tr>
              </thead>
              <tbody className="divide-y">
                {chunk.map((p) => (
                  <tr key={p.id}>
                    <td className="font-bold">RC-{p.numero_recibo}</td>
                    <td>{p.fecha_pago}</td>
                    <td className="text-[8px] uppercase max-w-[200px] truncate">{p.concepto_texto?.split("||")[0]}</td>
                    <td className="text-[9px] font-bold uppercase">{p.metodo_pago}</td>
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