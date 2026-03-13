"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import { Printer, X, Loader2, Wallet, History, CheckCircle2 } from "lucide-react";

interface Props { residente: any; deudas: any[]; onClose: () => void; }

export default function EstadoCuenta({ residente, deudas, onClose }: Props) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase.from("pagos").select("*").eq("residente_id", residente.id).order("fecha_pago", { ascending: false });
      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  const deudasPendientes = useMemo(() => deudas.filter(d => calcularValorDeudaHoy(d) !== 0), [deudas]);
  const totalDeuda = deudasPendientes.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.right = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map(s => s.outerHTML).join("");
    doc.write(`<html><head><title>Estado de Cuenta - ${residente.apartamento}</title>${styles}<style>
      @page { size: letter; margin: 10mm; }
      body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; }
      .print-container { width: 100%; height: auto; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
      th { background: #f8fafc !important; padding: 8px; text-align: left; border-bottom: 1.5pt solid #000; font-size: 9pt; text-transform: uppercase; }
      td { padding: 8px; border-bottom: 0.5pt solid #e2e8f0; font-size: 9pt; vertical-align: top; word-wrap: break-word; }
      .text-right { text-align: right; }
      .no-print { display: none !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style></head><body><div class="print-container">${content.innerHTML}</div><script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};<\/script></body></html>`);
    doc.close();
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={36} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex flex-col items-center overflow-y-auto no-scrollbar p-3 sm:p-6 md:p-10">

      {/* ── BARRA DE ACCIONES ─────────────────────────────── */}
      <div className="no-print w-full max-w-4xl bg-white p-3 sm:p-4 mb-4 sm:mb-6 flex justify-between items-center rounded-2xl shadow-2xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Wallet size={17} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 leading-none">Estado de Cuenta</p>
            <h2 className="text-xs sm:text-sm font-black uppercase text-slate-800">
              T{residente.torre.slice(-1)} - {residente.apartamento}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-1.5 px-3 py-2.5 text-[9px] sm:px-6 sm:py-3 sm:text-xs"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">IMPRIMIR REPORTE</span>
            <span className="sm:hidden">Imprimir</span>
          </button>
          <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── DOCUMENTO ─────────────────────────────────────── */}
      <div ref={printRef} className="w-full max-w-4xl bg-white shadow-2xl text-slate-800 flex flex-col border border-slate-100 mb-10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-16">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b-2 border-slate-900 pb-4 sm:pb-6 mb-5 sm:mb-8 gap-3">
          <div className="flex items-center gap-3 sm:gap-5">
            <img src="/logo.png" alt="Logo" className="w-12 h-auto sm:w-20 object-contain flex-shrink-0" />
            <div>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 uppercase leading-tight">
                Agrupación Res. El Parque de las Flores
              </h1>
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                NIT. 832.011.421-3 • Soacha, Cundinamarca
              </p>
            </div>
          </div>
          <div className="flex sm:flex-col sm:text-right items-center sm:items-end gap-2 sm:gap-1">
            <div className="bg-slate-900 text-white px-2.5 py-1 rounded text-[9px] sm:text-xs font-black uppercase">
              ESTADO DE CUENTA
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
              Emisión: {new Date().toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>

        {/* RESUMEN UNIDAD */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 sm:mb-10 gap-3 sm:gap-6">
          <div className="border-l-4 border-slate-200 pl-3 sm:pl-4">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase mb-0.5">Responsable</p>
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase leading-tight">{residente.nombre || 'PROPIETARIO'}</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase mt-0.5">
              Unidad T{residente.torre.slice(-1)} - Apto {residente.apartamento}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 sm:px-8 text-left sm:text-right">
            <p className={`text-[8px] sm:text-[9px] font-black uppercase mb-1 ${totalDeuda < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {totalDeuda < 0 ? 'Saldo a Favor (CR)' : 'Total a Pagar'}
            </p>
            <h3 className={`text-2xl sm:text-3xl font-black tabular-nums ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${Math.abs(totalDeuda).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* OBLIGACIONES PENDIENTES */}
        <div className="mb-6 sm:mb-10">
          <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-800 mb-3 sm:mb-4 border-b border-slate-100 pb-2">
            Obligaciones Pendientes
          </h3>
          {deudasPendientes.length > 0 ? (
            <>
              {/* Móvil: lista de cards */}
              <div className="sm:hidden space-y-2">
                {deudasPendientes.map((d: any) => {
                  const valor = calcularValorDeudaHoy(d);
                  return (
                    <div key={d.id} className="flex justify-between items-center py-2.5 border-b border-slate-50">
                      <p className="text-xs font-bold text-slate-700 uppercase leading-tight flex-1 pr-3">
                        {d.concepto_nombre}
                      </p>
                      <p className={`text-sm font-black tabular-nums flex-shrink-0 ${valor < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        ${Math.abs(valor).toLocaleString()}{valor < 0 ? ' CR' : ''}
                      </p>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Saldo Consolidado:</p>
                  <p className={`text-base font-black tabular-nums ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${Math.abs(totalDeuda).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Desktop: tabla */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr><th className="w-2/3">Concepto / Periodo</th><th className="text-right">Valor Hoy</th></tr>
                </thead>
                <tbody>
                  {deudasPendientes.map((d: any) => {
                    const valor = calcularValorDeudaHoy(d);
                    return (
                      <tr key={d.id}>
                        <td className="uppercase font-bold text-slate-700">{d.concepto_nombre}</td>
                        <td className={`text-right font-black tabular-nums ${valor < 0 ? 'text-emerald-600' : ''}`}>
                          ${Math.abs(valor).toLocaleString()} {valor < 0 ? 'CR' : ''}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-black">
                    <td className="text-right py-4 uppercase text-[9px] text-slate-400">Saldo Consolidado:</td>
                    <td className={`text-right py-4 text-base ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${Math.abs(totalDeuda).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : (
            <div className="py-8 sm:py-10 text-center border-2 border-dashed border-emerald-100 rounded-2xl sm:rounded-3xl">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="font-black text-slate-900 uppercase text-sm">La unidad se encuentra al día</p>
            </div>
          )}
        </div>

        {/* ÚLTIMOS MOVIMIENTOS */}
        {pagos.length > 0 && (
          <div className="mb-6 sm:mb-10">
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 mb-3 sm:mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <History size={12} /> Últimos Movimientos Registrados
            </h3>

            {/* Móvil: cards compactas */}
            <div className="sm:hidden space-y-2">
              {pagos.slice(0, 10).map(p => (
                <div key={p.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-black text-slate-500">RC-{p.numero_recibo}</span>
                      <span className="text-[8px] text-slate-300">{p.fecha_pago}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase leading-tight truncate">
                      {p.concepto_texto ? p.concepto_texto.split("||").map((c: any) => c.split("|")[0]).join(" + ") : "Pago de Cartera"}
                    </p>
                  </div>
                  <p className="text-sm font-black text-emerald-600 tabular-nums flex-shrink-0">
                    ${Number(p.monto_total).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop: tabla */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr>
                  <th className="w-24">Recibo No.</th>
                  <th className="w-24">Fecha</th>
                  <th>Concepto Pagado</th>
                  <th className="text-right w-28">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pagos.slice(0, 10).map(p => (
                  <tr key={p.id}>
                    <td className="font-bold">RC-{p.numero_recibo}</td>
                    <td className="text-slate-500">{p.fecha_pago}</td>
                    <td className="uppercase text-slate-600">
                      {p.concepto_texto ? p.concepto_texto.split("||").map((c: any) => c.split("|")[0]).join(" + ") : "Pago de Cartera"}
                    </td>
                    <td className="text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-auto pt-4 sm:pt-8 border-t-2 border-slate-100 flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-10 items-start sm:items-end">
          <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase space-y-1">
            <p>Banco: <b>Caja Social</b> • Ahorros • <b>24511819298</b></p>
            <p>Convenio: <b>15939402</b> • Ref: <b>{residente.torre.slice(-1)}{residente.apartamento}</b></p>
          </div>
          <div className="text-left sm:text-right">
            <div className="w-32 sm:w-40 border-t border-slate-400 sm:ml-auto mb-1"></div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-slate-900">Administración</p>
            <p className="text-[7px] sm:text-[8px] font-bold text-slate-300 uppercase tracking-widest">Este documento no es una factura legal</p>
          </div>
        </div>
      </div>
    </div>
  );
}