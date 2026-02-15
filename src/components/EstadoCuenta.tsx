"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import { Printer, X, Loader2, Wallet, History, UserCircle, CheckCircle2 } from "lucide-react";

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

  const deudasPendientes = useMemo(() => {
    return deudas.filter(d => calcularValorDeudaHoy(d) !== 0);
  }, [deudas]);

  const totalDeuda = deudasPendientes.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);

  // --- MOTOR DE IMPRESIÓN CORREGIDO ---
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.right = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");
    
    doc.write(`<html><head><title>Estado de Cuenta - ${residente.apartamento}</title>${styles}<style>
      @page { size: letter; margin: 10mm; }
      body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; }
      .print-container { width: 100%; height: auto; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
      th { background: #f8fafc !important; padding: 8px; text-align: left; border-bottom: 1.5pt solid #000; font-size: 9pt; text-transform: uppercase; }
      td { padding: 8px; border-bottom: 0.5pt solid #e2e8f0; font-size: 9pt; vertical-align: top; word-wrap: break-word; }
      .text-right { text-align: right; }
      .no-print { display: none !important; }
      .status-badge { font-weight: bold; text-transform: uppercase; font-size: 8pt; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style></head><body><div class="print-container">${content.innerHTML}</div><script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};</script></body></html>`);
    doc.close();
  };

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-10 overflow-y-auto no-scrollbar">

      {/* BARRA DE ACCIONES (VISTA WEB) */}
      <div className="no-print w-full max-w-4xl bg-white p-4 mb-6 flex justify-between items-center rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4 text-slate-800">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Wallet size={20}/></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Estado de Cuenta</p>
            <h2 className="text-sm font-black uppercase">T{residente.torre.slice(-1)} - {residente.apartamento}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg">IMPRIMIR REPORTE</button>
          <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-xl transition-all"><X size={24}/></button>
        </div>
      </div>

      {/* DOCUMENTO (LO QUE SE IMPRIME) */}
      <div ref={printRef} className="w-full max-w-4xl bg-white md:rounded-3xl shadow-2xl p-8 md:p-16 text-slate-800 flex flex-col border border-slate-100">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex items-center gap-5">
            <img src="/logo.png" alt="Logo" className="w-20 h-auto object-contain" />
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase leading-none">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-black uppercase mb-1">ESTADO DE CUENTA</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Emisión: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* RESUMEN UNIDAD */}
        <div className="flex justify-between items-end mb-10 gap-6">
           <div className="flex-1 border-l-4 border-slate-200 pl-4">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Responsable</p>
              <h2 className="text-base font-black text-slate-900 uppercase">{residente.nombre || 'PROPIETARIO'}</h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Unidad T{residente.torre.slice(-1)} - Apto {residente.apartamento}</p>
           </div>
           <div className="text-right bg-slate-50 border border-slate-200 rounded-2xl p-4 px-8 min-w-[200px]">
              <p className={`text-[9px] font-black uppercase mb-1 ${totalDeuda < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                {totalDeuda < 0 ? 'Saldo a Favor (CR)' : 'Total a Pagar'}
              </p>
              <h3 className={`text-3xl font-black tabular-nums ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${Math.abs(totalDeuda).toLocaleString()}
              </h3>
           </div>
        </div>

        {/* OBLIGACIONES PENDIENTES */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase text-slate-800 mb-4 border-b border-slate-100 pb-2">Obligaciones Pendientes</h3>
          {deudasPendientes.length > 0 ? (
            <table className="w-full">
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
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-emerald-100 rounded-3xl">
               <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
               <p className="font-black text-slate-900 uppercase">La unidad se encuentra al día</p>
            </div>
          )}
        </div>

        {/* ÚLTIMOS MOVIMIENTOS (FIX: Ahora garantizado en impresión) */}
        {pagos.length > 0 && (
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
               <History size={14}/> Últimos Movimientos Registrados
            </h3>
            <table className="w-full">
              <thead>
                <tr><th className="w-24">Recibo No.</th><th className="w-24">Fecha</th><th>Concepto Pagado</th><th className="text-right w-28">Monto</th></tr>
              </thead>
              <tbody>
                {pagos.slice(0, 10).map((p) => (
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
        <div className="mt-auto pt-8 border-t-2 border-slate-100 grid grid-cols-2 gap-10 items-end">
           <div className="text-[9px] text-slate-400 font-bold uppercase space-y-1">
              <p>Banco: <b>Caja Social</b> • Ahorros • <b>24511819298</b></p>
              <p>Convenio: <b>15939402</b> • Ref: <b>{residente.torre}{residente.apartamento}</b></p>
           </div>
           <div className="text-right">
              <div className="w-40 border-t border-slate-400 ml-auto mb-1"></div>
              <p className="text-[10px] font-black uppercase text-slate-900">Administración</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Este documento no es una factura legal</p>
           </div>
        </div>

      </div>
    </div>
  );
}