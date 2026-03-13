"use client";
import React, { useMemo, useRef } from "react";
import { X, FileText } from "lucide-react";
import { numeroALetras, calcularValorDeudaHoy, formatPeriodo } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);

  // Solo deudas con valor POSITIVO (excluye saldos a favor)
  const deudasOrdenadas = useMemo(() => {
    return [...deudas]
      .filter(d => calcularValorDeudaHoy(d) > 0) // ← FILTRO: solo deudas reales
      .sort((a, b) => {
        const fechaA = a.causaciones_globales?.mes_causado || a.fecha_vencimiento || "0000-00";
        const fechaB = b.causaciones_globales?.mes_causado || b.fecha_vencimiento || "0000-00";
        return fechaA.localeCompare(fechaB);
      });
  }, [deudas]);

  // Total solo de deudas positivas
  const total = deudasOrdenadas.reduce((acc: number, d: any) => acc + calcularValorDeudaHoy(d), 0);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <title>CuentaCobro-${residente.apartamento}</title>
          <style>
            @page { size: letter; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1e293b; line-height: 1.4; }
            table.main-container { width: 100%; border-collapse: collapse; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            .header-box { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { width: 70px; height: auto; margin-right: 15px; }
            .residente-box { display: flex; justify-content: space-between; align-items: flex-end; padding: 10px 0; border-top: 1px solid #e2e8f0; margin-top: 10px; }
            .info-text { font-size: 11px; }
            .info-text b { font-size: 13px; text-transform: uppercase; }
            .total-banner { text-align: right; }
            .total-label { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .total-amount { font-size: 24px; font-weight: 900; margin: 0; }
            th { text-align: left; padding: 8px; border-bottom: 1px solid #000; font-size: 10px; text-transform: uppercase; background: #f8fafc; }
            td { padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; vertical-align: middle; }
            .text-right { text-align: right; }
            tr { page-break-inside: avoid; }
            .letras-box { background: #f8fafc; padding: 10px; border-left: 4px solid #000; margin: 20px 0; font-size: 10px; font-style: italic; text-transform: uppercase; }
            .footer-instructions { background: #1e293b; color: white; padding: 15px; border-radius: 8px; font-size: 9px; }
            .signature-area { margin-top: 40px; text-align: center; border-top: 1px solid #000; width: 200px; margin-left: auto; padding-top: 5px; font-size: 10px; font-weight: bold; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <table class="main-container">
            <thead>
              <tr>
                <td colspan="3" style="border:none; padding:0;">
                  <div class="header-box">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="display: flex; align-items: center;">
                        <img src="/logo.png" class="logo" />
                        <div>
                          <h1 style="font-size: 14px; margin: 0; text-transform: uppercase;">Agrupación Res. El Parque de las Flores</h1>
                          <p style="font-size: 9px; margin: 2px 0; color: #64748b;">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="background: #000; color: #fff; padding: 4px 10px; font-size: 11px; font-weight: bold;">CUENTA DE COBRO</div>
                        <p style="font-size: 12px; font-weight: 800; margin: 5px 0 0 0;">Nº ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${residente.apartamento}</p>
                      </div>
                    </div>
                    <div class="residente-box">
                      <div class="info-text">
                        <span class="total-label">Deudor:</span><br/>
                        <b>${residente.nombre || 'PROPIETARIO'}</b><br/>
                        Unidad T${residente.torre.slice(-1)} - Apto ${residente.apartamento}
                      </div>
                      <div class="total-banner">
                        <span class="total-label">Saldo a la Fecha</span>
                        <p class="total-amount">$${total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th style="width: 20%">Periodo</th>
                <th style="width: 60%">Concepto Detallado</th>
                <th style="width: 20%" class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${deudasOrdenadas.map(d => `
                <tr>
                  <td>${formatPeriodo(d)}</td>
                  <td style="text-transform: uppercase;">${d.causaciones_globales?.concepto_nombre || d.concepto_nombre}</td>
                  <td class="text-right"><b>$${calcularValorDeudaHoy(d).toLocaleString()}</b></td>
                </tr>
              `).join('')}
              <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="2" class="text-right">TOTAL A PAGAR:</td>
                <td class="text-right" style="font-size: 13px;">$${total.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="border:none; padding: 0;">
                  <div class="letras-box"><b>Son:</b> ${numeroALetras(total)}</div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div class="footer-instructions">
                      <b style="color: #10b981; display: block; margin-bottom: 5px;">INSTRUCCIONES DE PAGO</b>
                      Banco: Caja Social • Cuenta Ahorros: 24511819298<br/>
                      Convenio: 15939402 • Referencia: ${residente.apartamento}
                    </div>
                    <div class="signature-area">Administración / Tesorería</div>
                  </div>
                  <p style="text-align: center; font-size: 7px; color: #cbd5e1; margin-top: 30px; letter-spacing: 3px;">
                    ORIGINAL: ADMINISTRACIÓN - COPIA: RESIDENTE
                  </p>
                </td>
              </tr>
            </tfoot>
          </table>
          <script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};<\/script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex flex-col items-center overflow-y-auto p-3 sm:p-6 md:p-8">

      {/* ── TOOLBAR ──────────────────────────────────────────── */}
      <div className="no-print sticky top-0 w-full max-w-4xl bg-white p-3 sm:p-4 mb-4 sm:mb-6 flex justify-between items-center rounded-xl shadow-xl border border-slate-100 z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-amber-50 text-amber-600 p-2 rounded-lg flex-shrink-0">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-slate-900 font-bold text-xs sm:text-sm uppercase leading-tight truncate">
              Documento de Cobro
            </h2>
            <p className="text-[9px] text-slate-500 font-bold tracking-widest">
              T{residente.torre.slice(-1)} - {residente.apartamento}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-widest transition-all px-4 py-2.5 text-[9px] sm:px-6 sm:py-2.5 sm:text-xs"
          >
            IMPRIMIR
          </button>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2.5 rounded-xl">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── DOCUMENTO PREVIEW ─────────────────────────────────── */}
      <div
        ref={printRef}
        className="w-full max-w-4xl bg-white shadow-2xl text-slate-800 flex flex-col mb-10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12"
      >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b-2 border-slate-900 pb-4 mb-5 sm:mb-6 gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/logo.png" alt="Logo" className="w-12 sm:w-16 h-auto object-contain flex-shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase leading-tight">
                Agrupación Res. El Parque de las Flores
              </h1>
              <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold mt-0.5">NIT. 832.011.421-3 • Soacha</p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
            <span className="bg-slate-900 text-white px-2.5 py-1 text-[9px] sm:text-[10px] font-black italic flex-shrink-0">
              CUENTA DE COBRO
            </span>
            <p className="text-sm sm:text-lg font-black text-slate-800">
              Nº {new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{residente.apartamento}
            </p>
          </div>
        </div>

        {/* RESUMEN DEUDOR */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end py-3 sm:py-4 border-y border-slate-100 mb-5 sm:mb-6 gap-3">
          <div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mb-0.5">Responsable</p>
            <h2 className="text-sm sm:text-base font-black uppercase leading-tight">{residente.nombre || "PROPIETARIO"}</h2>
            <p className="text-[9px] sm:text-xs font-bold text-slate-500 mt-0.5">
              Unidad T{residente.torre.slice(-1)} - Apto {residente.apartamento}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mb-0.5">Total a Pagar</p>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-600 tabular-nums">
              ${total.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* TABLA DEUDAS */}
        {/* Móvil: lista de filas */}
        <div className="sm:hidden space-y-1 mb-5">
          <div className="grid grid-cols-3 gap-2 pb-2 border-b-2 border-slate-900">
            <p className="text-[8px] font-black text-slate-500 uppercase">Periodo</p>
            <p className="text-[8px] font-black text-slate-500 uppercase">Concepto</p>
            <p className="text-[8px] font-black text-slate-500 uppercase text-right">Valor</p>
          </div>
          {deudasOrdenadas.map((d: any) => (
            <div key={d.id} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-50 items-start">
              <p className="text-[9px] font-bold text-slate-600 leading-tight">{formatPeriodo(d)}</p>
              <p className="text-[9px] uppercase text-slate-700 leading-tight">{d.causaciones_globales?.concepto_nombre || d.concepto_nombre}</p>
              <p className="text-[9px] font-black text-right tabular-nums">${calcularValorDeudaHoy(d).toLocaleString()}</p>
            </div>
          ))}
          {/* Total */}
          <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50">
            <p className="col-span-2 text-[9px] font-black text-slate-500 uppercase text-right">Total a Pagar:</p>
            <p className="text-xs font-black text-rose-600 text-right tabular-nums">${total.toLocaleString()}</p>
          </div>
        </div>

        {/* Desktop: tabla */}
        <table className="hidden sm:table w-full text-xs mb-6">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-50">
              <th className="py-2 px-2 w-1/5">Periodo</th>
              <th className="py-2 px-2">Concepto</th>
              <th className="py-2 px-2 text-right w-1/5">Valor</th>
            </tr>
          </thead>
          <tbody>
            {deudasOrdenadas.map((d: any) => (
              <tr key={d.id} className="border-b border-slate-100">
                <td className="py-2 px-2 font-bold">{formatPeriodo(d)}</td>
                <td className="py-2 px-2 uppercase">{d.causaciones_globales?.concepto_nombre || d.concepto_nombre}</td>
                <td className="py-2 px-2 text-right font-black">${calcularValorDeudaHoy(d).toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-black">
              <td colSpan={2} className="py-3 px-2 text-right text-[10px] text-slate-500 uppercase">Total a Pagar:</td>
              <td className="py-3 px-2 text-right text-sm text-rose-600">${total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* EN LETRAS */}
        <div className="p-3 sm:p-4 bg-slate-50 border-l-4 border-slate-900 text-[9px] sm:text-[10px] uppercase font-bold italic mb-5 sm:mb-6">
          <b>Son:</b> {numeroALetras(total)}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mt-auto pt-4 sm:pt-6">
          <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-xl text-[8px] sm:text-[9px] space-y-1">
            <p className="font-black text-emerald-400 uppercase border-b border-slate-700 pb-1 mb-1.5">
              Instrucciones de Pago — Caja Social
            </p>
            <p>Cuenta Ahorros: <b>24511819298</b></p>
            <p>Convenio: <b>15939402</b> • Referencia: <b>{residente.torre.slice(-1)}{residente.apartamento}</b></p>
          </div>
          <div className="text-center sm:text-right">
            <div className="w-36 sm:w-48 border-t border-slate-900 sm:ml-auto mb-1"></div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase">Administración</p>
          </div>
        </div>
      </div>
    </div>
  );
}