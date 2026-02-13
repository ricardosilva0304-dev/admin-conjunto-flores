"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import { Printer, X, Loader2, Wallet, History, MapPin, CheckCircle2, UserCircle } from "lucide-react";

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

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");
    
    doc.write(`<html><head><title>Estado de Cuenta - ${residente.apartamento}</title>${styles}<style>
      @page { size: letter; margin: 0; }
      body { background: white !important; font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; }
      .print-page { width: 216mm; height: 279mm; padding: 20mm; box-sizing: border-box; position: relative; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #f8fafc !important; padding: 12px 10px; text-align: left; border-bottom: 2px solid #1e293b; text-transform: uppercase; font-size: 10px; color: #475569; }
      td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 11px; color: #1e293b; }
      .text-right { text-align: right; }
      .bg-light { background: #f8fafc !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style></head><body><div class="print-page">${content.innerHTML}</div><script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),200);};</script></body></html>`);
    doc.close();
  };

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-10 overflow-y-auto no-scrollbar">

      {/* BARRA DE ACCIONES */}
      <div className="no-print w-full max-w-4xl bg-white p-4 mb-6 flex justify-between items-center rounded-2xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white"><Wallet size={20}/></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Vista de Impresión</p>
            <h2 className="text-sm font-black uppercase text-slate-800">Unidad {residente.torre} - {residente.apartamento}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all">IMPRIMIR PDF</button>
          <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"><X size={24}/></button>
        </div>
      </div>

      {/* DOCUMENTO REDISEÑADO */}
      <div ref={printRef} className="w-full max-w-4xl bg-white md:rounded-3xl shadow-2xl p-8 md:p-16 text-slate-800 animate-in zoom-in-95 duration-500 min-h-[1056px] flex flex-col border border-slate-100">
        
        {/* HEADER LIMPIO */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-10">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Logo" className="w-24 h-auto object-contain" />
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
              <p className="text-[9px] text-slate-500 italic mt-1">Extracto de cuenta para fines informativos y administrativos.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded text-xs font-black uppercase mb-2">ESTADO DE CUENTA</div>
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Emisión: {new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* PANEL DE INFORMACIÓN (CUADROS CLAROS) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-12">
          {/* Lado Residente */}
          <div className="md:col-span-7 border border-slate-200 rounded-2xl p-6 bg-slate-50/30 flex items-center gap-5">
             <div className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300"><UserCircle size={32}/></div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Responsable</p>
                <h2 className="text-base font-black text-slate-900 uppercase">{residente.nombre || 'PROPIETARIO'}</h2>
                <span className="text-[10px] font-bold text-emerald-600">Unidad T{residente.torre.slice(-1)}-{residente.apartamento}</span>
             </div>
          </div>

          {/* Lado Saldo (AHORA CLARO) */}
          <div className="md:col-span-5 border-2 border-slate-900 rounded-2xl p-6 bg-white flex flex-col justify-center items-end text-right">
             <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${totalDeuda < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                {totalDeuda < 0 ? 'Crédito a Favor' : 'Saldo Total a Pagar'}
             </p>
             <h3 className={`text-4xl font-black tabular-nums tracking-tighter ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${Math.abs(totalDeuda).toLocaleString()}
             </h3>
          </div>
        </div>

        {/* TABLA DE DEUDAS */}
        <div className="flex-1">
          {deudasPendientes.length > 0 ? (
            <div className="mb-12">
              <table className="w-full">
                <thead>
                  <tr><th>Concepto o Servicio Pendiente</th><th className="text-right">Valor Hoy</th></tr>
                </thead>
                <tbody>
                  {deudasPendientes.map((d: any) => {
                    const valor = calcularValorDeudaHoy(d);
                    return (
                      <tr key={d.id}>
                        <td className="py-4 uppercase font-bold text-slate-700">{d.concepto_nombre}</td>
                        <td className={`py-4 text-right font-black tabular-nums ${valor < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                           ${Math.abs(valor).toLocaleString()} {valor < 0 ? 'CR' : ''}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50">
                    <td className="text-right py-4 font-black text-slate-400 uppercase text-[9px]">Gran Total Consolidado:</td>
                    <td className={`text-right py-4 font-black text-base ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       ${Math.abs(totalDeuda).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-emerald-100 rounded-3xl mb-12">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
              <h4 className="text-2xl font-black text-slate-900 uppercase">Unidad a Paz y Salvo</h4>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">No registra obligaciones pendientes.</p>
            </div>
          )}

          {/* HISTORIAL BREVE */}
          {pagos.length > 0 && (
            <div className="mb-10">
              <h3 className="text-[10px] font-black uppercase text-slate-300 mb-3 flex items-center gap-2">
                 <History size={14}/> Últimos Pagos Registrados
              </h3>
              <table className="w-full opacity-60">
                <thead>
                  <tr className="border-b border-slate-100"><th className="bg-transparent! py-2">RC No.</th><th>Fecha</th><th>Método</th><th className="text-right">Monto</th></tr>
                </thead>
                <tbody className="text-[10px]">
                  {pagos.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td className="font-bold py-2">RC-{p.numero_recibo}</td>
                      <td>{p.fecha_pago}</td>
                      <td className="uppercase">{p.metodo_pago}</td>
                      <td className="text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA */}
        <div className="mt-auto pt-8 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-end gap-6">
           <div className="text-[9px] text-slate-400 uppercase font-bold space-y-1">
              <p>Entidad: <b>Banco Caja Social</b> • Cta Ahorros: <b>24511819298</b></p>
              <p>Convenio: <b>15939402</b> • Referencia: <b>{residente.apartamento}</b></p>
           </div>
           <div className="text-right">
              <div className="w-40 border-t border-slate-300 mb-1 ml-auto"></div>
              <p className="text-[10px] font-black uppercase text-slate-900 leading-none">Administración</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Parque de las Flores</p>
           </div>
        </div>

      </div>
    </div>
  );
}