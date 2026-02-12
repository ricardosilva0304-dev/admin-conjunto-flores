"use client";
import React, { useMemo, useRef } from "react";
import { Printer, X, Landmark, FileText, MapPin, Phone, Mail } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);

  // --- LÓGICA DE FECHAS Y VALORES ---
  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "CARGO EXTRA";
    const [year, month] = mesCausado.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  const calcularValorHoy = (d: any) => {
    // Si es cargo manual (sin causación), devuelve saldo directo
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;

    const hoy = new Date();
    const dia = hoy.getDate();

    // Protección contra fechas nulas
    const mesCausado = d.causaciones_globales.mes_causado;
    if (!mesCausado) return d.saldo_pendiente || 0;

    const [yC, mC] = mesCausado.split("-").map(Number);
    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;

    let precio = m1;

    // Lógica M1, M2, M3
    if (hoy.getFullYear() > yC || (hoy.getFullYear() === yC && (hoy.getMonth() + 1) > mC)) {
      precio = m3;
    } else {
      if (dia > 10 && dia <= 20) precio = m2;
      else if (dia > 20) precio = m3;
    }

    // Restamos lo que ya se pagó sobre la base M1
    return Math.max(0, precio - (m1 - (d.saldo_pendiente || 0)));
  };

  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => (a.causaciones_globales?.mes_causado || "").localeCompare(b.causaciones_globales?.mes_causado || ""));
  }, [deudas]);

  const total = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  // --- MOTOR DE IMPRESIÓN ROBUSTO (IFRAME) ---
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Copiar estilos
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");

    doc.write(`
      <html>
        <head>
          <title>Cuenta Cobro - ${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: ui-sans-serif, system-ui, sans-serif; }
            .print-page { width: 100%; height: 100vh; padding: 2cm; box-sizing: border-box; position: relative; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #0f172a; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="print-page">${content.innerHTML}</div>
          <script>
            setTimeout(() => { window.print(); window.frameElement.remove(); }, 500);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-8 overflow-y-auto">

      {/* BARRA DE HERRAMIENTAS */}
      <div className="no-print sticky top-0 w-full max-w-[816px] bg-white p-4 mb-6 flex justify-between items-center rounded-xl shadow-xl border border-slate-100 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 text-amber-600 p-2 rounded-lg border border-amber-100">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-sm">Cuenta de Cobro</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Ref: {residente.apartamento} / {new Date().toLocaleDateString()}</p>
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

      {/* DOCUMENTO (HOJA CARTA) */}
      <div ref={printRef} className="w-[816px] min-h-[1056px] bg-white p-16 shadow-2xl text-slate-800 relative">

        {/* ENCABEZADO CONJUNTO */}
        <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-900">
          <div className="flex gap-5">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            <div className="space-y-1">
              <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest">NIT. 832.011.421-3</p>
              <div className="pt-1 space-y-0.5">
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><MapPin size={10} /> Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><Phone size={10} /> 315 340 0657</p>
                <p className="text-[9px] text-slate-500 flex items-center gap-1"><Mail size={10} /> cr.parquedelasflores@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-4 py-1.5 rounded mb-2 inline-block">
              <span className="text-sm font-black italic uppercase">CUENTA DE COBRO</span>
            </div>
            <p className="text-xl font-black text-slate-900">No. {new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}-{residente.apartamento}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Fecha Emisión: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* INFO RESIDENTE (DISEÑO COMPACTO) */}
        <div className="mb-10 bg-slate-50 rounded-lg p-4 border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsable del Pago</p>
            <h2 className="text-sm font-black text-slate-900 uppercase">{residente.nombre || "PROPIETARIO"}</h2>
            <p className="text-[10px] text-slate-500 font-medium">C.C. {residente.cedula || '---'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Inmueble</p>
            <h2 className="text-lg font-black text-slate-900">TORRE {residente.torre.slice(-1)} - APTO {residente.apartamento}</h2>
          </div>
        </div>

        {/* TEXTO LEGAL */}
        <div className="mb-8 text-xs text-slate-600 leading-relaxed text-justify">
          La Administración se permite informar el estado de cuenta a la fecha, correspondiente a expensas comunes y otros conceptos.
          Agradecemos realizar el pago antes de la fecha límite para evitar intereses de mora.
        </div>

        <table className="w-full mb-10 table-fixed border-collapse">
          <thead>
            <tr className="border-y-2 border-slate-900">
              {/* 1. Definimos anchos exactos para que no se muevan */}
              <th className="w-[20%] font-black text-slate-500 text-[10px] text-left py-3">Periodo</th>
              <th className="w-[60%] font-black text-slate-500 text-[10px] text-left py-3">Concepto</th>
              <th className="w-[20%] font-black text-slate-500 text-[10px] text-right py-3">Valor a Pagar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deudasOrdenadas.map((d: any) => (
              <tr key={d.id}>
                {/* Columna Periodo: Si es Cargo Extra, lo ponemos chiquito */}
                <td className="py-3 align-top">
                  {!d.causaciones_globales?.mes_causado ? (
                    <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                      Cargo Extra
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800 text-xs">
                      {formatPeriodo(d.causaciones_globales.mes_causado)}
                    </span>
                  )}
                </td>

                {/* Columna Concepto */}
                <td className="text-xs text-slate-600 uppercase py-3 align-top leading-tight pr-4">
                  {d.concepto_nombre || d.causaciones_globales?.concepto_nombre}
                </td>

                {/* Columna Valor */}
                <td className="text-right font-bold text-slate-900 text-xs py-3 align-top tabular-nums">
                  ${calcularValorHoy(d).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 bg-slate-50">
              <td colSpan={2} className="text-right font-black text-xs uppercase py-4 pr-4 text-slate-500">Total Neto a Pagar:</td>
              <td className="text-right font-black text-xl text-slate-900 py-4 tabular-nums">
                ${total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* VALOR EN LETRAS */}
        <div className="mb-12 border-l-4 border-slate-300 pl-4 py-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">La suma de:</p>
          <p className="text-xs font-black italic text-slate-700 uppercase">{numeroALetras(total)} PESOS M/CTE.</p>
        </div>

        {/* INFO BANCARIA Y FIRMA */}
        <div className="mt-auto grid grid-cols-2 gap-10 items-end">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Landmark size={14} className="text-amber-600" />
              <span className="text-[10px] font-black uppercase text-slate-800">Consignación Bancaria</span>
            </div>
            <ul className="text-[10px] text-slate-600 space-y-1">
              <li>• Banco: <b>Banco Caja Social</b></li>
              <li>• Tipo: <b>Ahorros</b></li>
              <li>• Número: <b>24511819298</b></li>
              <li>• Titular: <b>Parque de las Flores P.H.</b></li>
            </ul>
          </div>

          <div className="text-center">
            <div className="w-48 border-t border-slate-400 mx-auto mb-2"></div>
            <p className="text-[10px] font-black uppercase text-slate-800">Administración</p>
            <p className="text-[9px] text-slate-400">Firma Autorizada</p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            Original - Copia Administración
          </p>
        </div>

      </div>
    </div>
  );
}