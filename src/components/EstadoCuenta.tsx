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

  // --- Lógica de Cálculos (M1, M2, M3) ---
  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    
    // Protección contra fechas inválidas
    const mesCausado = d.causaciones_globales.mes_causado;
    if(!mesCausado) return d.saldo_pendiente || 0;

    const [yC, mC] = mesCausado.split("-").map(Number);
    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;
    
    let precio = m1;
    // Si año actual > año deuda O (mismo año Y mes actual > mes deuda)
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) { 
        precio = m3; 
    } else { 
        if (dia > 10 && dia <= 20) precio = m2; 
        else if (dia > 20) precio = m3; 
    }
    
    // Saldo = Precio que aplica hoy - (Lo que ya pagó basándonos en M1)
    return Math.max(0, precio - (m1 - (d.saldo_pendiente || 0)));
  };

  const totalDeuda = deudas.reduce((acc, d) => acc + calcularValorHoy(d), 0);

  // --- Lógica de Impresión (Iframe) ---
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Copiamos los estilos de Tailwind y globales
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");

    doc.write(`
      <html>
        <head>
          <title>Estado de Cuenta - ${residente.apartamento}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            .print-page { width: 100%; height: 100vh; padding: 1.5cm; box-sizing: border-box; page-break-after: always; position: relative; }
            .print-page:last-child { page-break-after: auto; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background-color: #f1f5f9 !important; color: #64748b !important; font-weight: 800 !important; text-transform: uppercase; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>
            setTimeout(() => { window.print(); window.frameElement.remove(); }, 500);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "CARGO EXTRA";
    const [year, month] = mesCausado.split("-");
    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  // Reducimos un poco las filas por página para que quepa la info nueva del residente
  const ROWS_PER_PAGE = 13; 
  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  const deudaPages = chunkArray(deudas, ROWS_PER_PAGE);
  const pagosPages = chunkArray(pagos, ROWS_PER_PAGE + 5); // En pagos caben más porque no hay header grande

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[300] flex flex-col items-center p-4 md:p-6 overflow-y-auto">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="no-print sticky top-0 w-full max-w-[816px] bg-white p-4 mb-6 flex justify-between items-center rounded-xl shadow-xl z-50 border border-slate-100">
        <div>
          <h2 className="text-slate-800 font-bold text-sm uppercase tracking-wider">Vista Previa de Impresión</h2>
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
        
        {/* PAGINAS DE DEUDAS */}
        {deudaPages.length > 0 ? deudaPages.map((chunk, index) => (
          <div key={`page-${index}`} className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col relative overflow-hidden">
            
            {/* ENCABEZADO (DATOS DEL CONJUNTO) */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex gap-5">
                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                <div>
                  <h1 className="text-lg font-black text-slate-900 uppercase leading-none mb-1">Agrupación Res. El Parque de las Flores</h1>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest mb-1">NIT. 832.011.421-3</p>
                  <p className="text-[9px] text-slate-400 flex items-center gap-1"><MapPin size={10}/> Diagonal 9 # 4B-90 • Soacha, Cundinamarca</p>
                  <p className="text-[9px] text-slate-400 flex items-center gap-1"><Phone size={10}/> 315 340 0657</p>
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

            {/* DATOS DEL RESIDENTE (COMPLETO) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsable</p>
                <p className="text-sm font-black text-slate-800 uppercase mb-1">{residente.nombre || 'Propietario'}</p>
                <div className="flex flex-col gap-0.5">
                   <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"><MapPin size={10} className="text-emerald-500"/> {residente.torre} - Apt {residente.apartamento}</span>
                   <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"><Mail size={10} className="text-emerald-500"/> {residente.email || 'Sin correo registrado'}</span>
                   <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"><Phone size={10} className="text-emerald-500"/> {residente.celular || 'Sin teléfono'}</span>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center border-l border-slate-200 pl-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Deuda a la Fecha</p>
                <p className={`text-3xl font-black tabular-nums tracking-tighter ${totalDeuda > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${totalDeuda.toLocaleString()}
                </p>
                {totalDeuda === 0 && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full self-end mt-1">PAZ Y SALVO</span>}
              </div>
            </div>

            {/* TABLA DE DEUDAS */}
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase text-slate-800 mb-2 flex items-center gap-2">
                <Wallet size={12} className="text-rose-500" /> Obligaciones Pendientes
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Concepto</th>
                    <th className="text-right">Vr. Original</th>
                    <th className="text-right">Saldo Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((d: any) => (
                    <tr key={d.id}>
                      <td className="font-bold">{formatPeriodo(d.causaciones_globales?.mes_causado)}</td>
                      <td className="uppercase text-[9px]">{d.concepto_nombre || d.causaciones_globales?.concepto_nombre}</td>
                      <td className="text-right text-slate-400">${(d.monto_original || 0).toLocaleString()}</td>
                      <td className="text-right font-black text-rose-600">${calcularValorHoy(d).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PIE DE PAGINA (DATOS DE PAGO) */}
            <div className="mt-auto border-t-2 border-slate-800 pt-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-800 mb-1">Instrucciones de Pago</p>
                  <p className="text-[9px] font-medium text-slate-600">Banco: <b>Caja Social</b> - Ahorros No. <b>24511819298</b></p>
                  <p className="text-[9px] font-medium text-slate-600">Convenio: <b>15939402</b> - Ref: <b>{residente.apartamento}</b></p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-400 uppercase italic">
                    "La puntualidad en sus pagos garantiza el bienestar y la valorización de su patrimonio."
                  </p>
                  <p className="text-[8px] text-slate-300 mt-1">Generado por AdminPro Flores</p>
                </div>
              </div>
            </div>

          </div>
        )) : (
          // SI NO HAY DEUDAS, MOSTRAR CERTIFICADO DE PAZ Y SALVO
          <div className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col items-center justify-center text-center p-20 border-4 border-double border-emerald-100">
             <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                <CheckCircle2 size={60} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 uppercase mb-2">Paz y Salvo</h1>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10">Agrupación Res. El Parque de las Flores</p>
             
             <p className="text-lg text-slate-700 max-w-lg leading-relaxed">
               Certificamos que la unidad <b>{residente.torre} - {residente.apartamento}</b>, propiedad de <b>{residente.nombre}</b>, se encuentra al día por todo concepto de administración y expensas comunes a la fecha de corte.
             </p>
             <p className="mt-10 text-xs font-bold text-slate-400">Expedido el: {new Date().toLocaleDateString('es-CO', {dateStyle: 'full'})}</p>
          </div>
        )}

        {/* PAGINAS DE PAGOS (HISTORIAL) */}
        {pagos.length > 0 && pagosPages.map((chunk, index) => (
           <div key={`pago-page-${index}`} className="print-page bg-white shadow-2xl w-[816px] h-[1056px] flex flex-col">
              <div className="border-b pb-4 mb-6 flex justify-between items-end">
                 <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                   <History size={16} className="text-emerald-600" /> Historial de Pagos
                 </h3>
                 <span className="text-[9px] font-bold text-slate-400">Anexo {index + 1}</span>
              </div>
              
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Recibo No.</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Medio</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((p) => (
                    <tr key={p.id}>
                      <td className="font-bold text-slate-700">RC-{p.numero_recibo}</td>
                      <td>{p.fecha_pago}</td>
                      <td className="text-[8px] uppercase max-w-[200px] truncate">{p.concepto_texto?.split("||")[0]}</td>
                      <td><span className="uppercase text-[8px] font-bold bg-slate-100 px-1 rounded">{p.metodo_pago}</span></td>
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