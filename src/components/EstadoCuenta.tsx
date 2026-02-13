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

  // Filtramos deudas con saldo para el reporte (Solo lo pendiente real)
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
    doc.write(`<html><head><title>Estado de Cuenta</title>${styles}<style>
      @page { size: letter; margin: 1cm; }
      body { background: white !important; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
      .print-container { width: 100%; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
      th { background: #f1f5f9 !important; padding: 10px; text-align: left; border-bottom: 2px solid #334155; text-transform: uppercase; color: #475569; font-weight: 800; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #1e293b; }
      .total-row { background: #f8fafc !important; font-weight: 900; font-size: 13px; }
    </style></head><body><div class="print-container">${content.innerHTML}</div><script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),100);};</script></body></html>`);
    doc.close();
  };

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex flex-col items-center p-4 md:p-10 overflow-y-auto no-scrollbar">

      {/* BARRA DE ACCIONES MODERNA */}
      <div className="no-print w-full max-w-4xl bg-white/10 border border-white/10 p-4 mb-6 flex justify-between items-center rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4 text-white">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Wallet size={20}/></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">Documento de Cartera</p>
            <h2 className="text-sm font-black uppercase tracking-tight">T{residente.torre.slice(-1)} - {residente.apartamento}</h2>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2">
            <Printer size={16} /> IMPRIMIR REPORTE
          </button>
          <button onClick={onClose} className="p-3 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
        </div>
      </div>

      {/* DOCUMENTO REDISEÑADO */}
      <div ref={printRef} className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-10 md:p-16 text-slate-800 animate-in zoom-in-95 duration-500 min-h-[1056px] flex flex-col">
        
        {/* ENCABEZADO SIMPLIFICADO */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Agrupación Res. El Parque de las Flores</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">NIT. 832.011.421-3 • Soacha, Cundinamarca</p>
              <p className="text-[9px] font-medium text-slate-500 flex items-center gap-2 italic">Certificado oficial de estado de cuenta individual</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-lg font-black italic mb-2 tracking-tighter">ESTADO DE CUENTA</div>
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Fecha de Emisión</p>
            <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </div>

        {/* INFO RESIDENTE PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl p-8 flex items-center gap-6">
             <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400"><UserCircle size={40} strokeWidth={1.5}/></div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Titular Responsable</p>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{residente.nombre || 'PROPIETARIO'}</h2>
                <div className="flex gap-4 mt-2">
                   <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Unidad T{residente.torre.slice(-1)}-{residente.apartamento}</span>
                   {residente.celular && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase leading-none"><MapPin size={10}/> {residente.celular}</span>}
                </div>
             </div>
          </div>
          <div className="md:col-span-5 bg-slate-900 rounded-3xl p-8 flex flex-col justify-center items-end text-right">
             <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${totalDeuda < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {totalDeuda < 0 ? 'Crédito a Favor (CR)' : 'Saldo Total Pendiente'}
             </p>
             <h3 className={`text-4xl font-black tabular-nums tracking-tighter ${totalDeuda < 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                ${Math.abs(totalDeuda).toLocaleString()}
             </h3>
          </div>
        </div>

        {/* CONTENIDO DE TABLAS */}
        <div className="flex-1">
          {deudasPendientes.length > 0 ? (
            <div className="mb-12">
              <h3 className="text-xs font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div> Relación de Obligaciones Pendientes
              </h3>
              <table className="w-full">
                <thead>
                  <tr><th className="w-2/3">Descripción del Concepto / Servicio</th><th className="text-right">Saldo Actual</th></tr>
                </thead>
                <tbody>
                  {deudasPendientes.map((d: any) => {
                    const valor = calcularValorDeudaHoy(d);
                    return (
                      <tr key={d.id}>
                        <td className="py-4 uppercase font-bold tracking-tight text-slate-700">
                           {d.concepto_nombre}
                        </td>
                        <td className={`py-4 text-right font-black text-sm tabular-nums ${valor < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                           ${Math.abs(valor).toLocaleString()} {valor < 0 ? 'CR' : ''}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td className="text-right py-5 text-slate-500 uppercase tracking-widest text-[10px]">Total Consolidado:</td>
                    <td className={`text-right py-5 ${totalDeuda < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       ${Math.abs(totalDeuda).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center border-4 border-double border-emerald-100 rounded-[3rem] mb-12 flex flex-col items-center">
              <CheckCircle2 size={60} className="text-emerald-500 mb-4" />
              <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Certificado de Paz y Salvo</h4>
              <p className="text-slate-500 font-medium max-w-sm mt-2 uppercase text-[11px] tracking-widest">Esta unidad se encuentra al día con todas sus obligaciones financieras a la fecha de hoy.</p>
            </div>
          )}

          {pagos.length > 0 && (
            <div className="mb-10 page-break-before">
              <h3 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
                 <History size={16}/> Historial Reciente de Pagos
              </h3>
              <table className="w-full opacity-80">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="bg-transparent! py-3 font-black text-slate-300">Recibo No.</th>
                    <th className="bg-transparent! py-3 font-black text-slate-300">Fecha</th>
                    <th className="bg-transparent! py-3 font-black text-slate-300">Método</th>
                    <th className="bg-transparent! py-3 font-black text-slate-300 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="text-slate-500">
                  {pagos.slice(0, 10).map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 font-bold text-[10px]">RC-{p.numero_recibo}</td>
                      <td className="py-3 text-[10px]">{p.fecha_pago}</td>
                      <td className="py-3 text-[10px] uppercase font-bold">{p.metodo_pago}</td>
                      <td className="py-3 text-right font-black text-emerald-600 text-[10px]">${Number(p.monto_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA PROFESIONAL */}
        <div className="mt-auto pt-10 border-t border-slate-100">
           <div className="flex flex-col md:flex-row justify-between items-end gap-10">
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Canales de Pago Autorizados</p>
                 <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[9px] font-bold text-slate-400 uppercase">
                    <span>Entidad: <b>Caja Social</b></span>
                    <span>Cuenta: <b>24511819298</b></span>
                    <span>Convenio: <b>15939402</b></span>
                    <span>Referencia: <b>{residente.apartamento}</b></span>
                 </div>
              </div>
              <div className="text-right">
                 <div className="w-48 border-t border-slate-300 mb-2"></div>
                 <p className="text-[10px] font-black uppercase text-slate-900">Oficina de Administración</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Copia de Auditoría</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}