"use client";
import React from "react";
import { Printer, X, FileText, Landmark, Calendar, User, Info, Building2 } from "lucide-react";
import { numeroALetras } from "@/lib/utils";

export default function CuentaCobro({ residente, deudas, onClose }: any) {
  
  // --- LÓGICA DE CÁLCULO DE DEUDA DINÁMICA POR TRAMOS ---
  const calcularValorACobrar = (deuda: any) => {
    if (!deuda.causaciones_globales) return deuda.saldo_pendiente || 0;

    const hoy = new Date();
    const diaMes = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    // Parseamos el periodo de la deuda (Formato: YYYY-MM)
    const [anioC, mesC] = deuda.causaciones_globales.mes_causado.split("-").map(Number);

    let precioBaseTarifa = deuda.precio_m1 || 0;

    // 1. Si el mes ya venció (Estamos en un mes posterior) -> Tarifa M3
    if (anioActual > anioC || (anioActual === anioC && mesActual > mesC)) {
      precioBaseTarifa = deuda.precio_m3 || 0;
    } else {
      // 2. Si es el mes corriente, aplicamos los tramos 1-10, 11-20, 21+
      if (diaMes > 10 && diaMes <= 20) precioBaseTarifa = deuda.precio_m2 || 0;
      if (diaMes > 20) precioBaseTarifa = deuda.precio_m3 || 0;
    }

    // Restamos abonos parciales previos si existen
    const yaPagadoAnteriormente = (deuda.precio_m1 || 0) - (deuda.saldo_pendiente || 0);
    return Math.max(0, precioBaseTarifa - yaPagadoAnteriormente);
  };

  const totalFinalACobrar = deudas.reduce((acc: number, d: any) => acc + calcularValorACobrar(d), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center p-0 md:p-6 overflow-y-auto no-scrollbar">
      
      {/* MEDIA QUERY PARA IMPRESIÓN (SIN CAMBIOS DE MARGENES EXTRAÑOS) */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-document, #print-document * { visibility: visible; } 
          #print-document { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2.5cm; border: none; shadow: none; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* CONTROLADOR DE ACCIÓN (RESPONSIVE) */}
      <div className="no-print w-full max-w-4xl bg-white md:rounded-2xl flex justify-between items-center p-4 md:mb-6 shadow-xl border-b md:border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500 hidden sm:block">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold text-xs uppercase tracking-widest">Cobro de Unidad: {residente.torre}-{residente.apartamento}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black active:scale-95 transition-all shadow-md"
          >
            <Printer size={14} /> IMPRIMIR COBRO
          </button>
          <button onClick={onClose} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* DOCUMENTO: DISEÑO EJECUTIVO MINIMALISTA */}
      <div id="print-document" className="w-full max-w-4xl bg-white p-8 md:p-16 border border-slate-100 shadow-2xl flex flex-col min-h-[1050px] font-sans">
        
        {/* ENCABEZADO TÉCNICO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 border-b-4 border-slate-900 pb-10">
           <div className="space-y-4">
              <img src="/logo.png" alt="Logo" className="w-40 md:w-52 h-auto object-contain" />
              <div className="space-y-1">
                 <h2 className="text-lg font-black text-slate-900 leading-none">CONJUNTO RES. PARQUE DE LAS FLORES</h2>
                 <p className="text-[10px] font-bold text-slate-500 tracking-wider">NIT. 832.011.421-3 • RÉGIMEN PROPIEDAD HORIZONTAL</p>
              </div>
           </div>
           <div className="text-right mt-6 md:mt-0 flex flex-col items-end">
              <div className="bg-slate-900 text-white px-6 py-4 rounded-xl inline-block mb-3">
                 <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mb-1 text-left">Documento de Cobro No.</p>
                 <h3 className="text-2xl font-black italic tracking-tighter tabular-nums uppercase">{residente.torre.charAt(residente.torre.length-1)}{residente.apartamento}-{new Date().getMonth()+1}</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Fecha de expedición: <span className="text-slate-800">{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</span></p>
           </div>
        </div>

        {/* TITULAR DEL DOCUMENTO */}
        <div className="mb-12">
           <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Obligado al Pago:</h4>
           <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-2 border-slate-100 p-8 rounded-[2rem]">
              <div className="md:col-span-8 space-y-1">
                 <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{residente.nombre}</p>
                 <div className="flex gap-6 pt-2">
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2"><User size={12}/> PROPIETARIO</p>
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-2 uppercase tracking-tighter"><Building2 size={12}/> UNIDAD {residente.torre.replace("Torre ","T")}-{residente.apartamento}</p>
                 </div>
              </div>
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 text-right flex flex-col justify-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Municipio / Destino</p>
                 <p className="text-sm font-black text-slate-700">SOACHA, CUNDINAMARCA</p>
              </div>
           </div>
        </div>

        {/* DETALLE FINANCIERO */}
        <div className="flex-1">
           <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-1">Relación detallada de periodos facturados:</h4>
           <div className="overflow-hidden border border-slate-200 rounded-2xl mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest">
                    <th className="py-4 px-6">Mes Vencimiento</th>
                    <th className="py-4 px-6 text-center">Referencia Obligación</th>
                    <th className="py-4 px-6 text-right">Saldo Actualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {deudas.map((d: any) => (
                    <tr key={d.id} className="text-slate-600 hover:bg-slate-50/50">
                      <td className="py-4 px-6 text-slate-900">{d.causaciones_globales?.mes_causado}</td>
                      <td className="py-4 px-6 text-center uppercase text-[10px] tracking-tight">{d.concepto_nombre || "Gasto Común Administrativo"}</td>
                      <td className="py-4 px-6 text-right tabular-nums text-slate-900 font-black italic">
                        ${calcularValorACobrar(d).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="py-8 px-6 text-right font-black uppercase tracking-[0.3em] text-slate-500 text-xs">Gran Total de Obligaciones Hoy:</td>
                    <td className="py-8 px-6 text-right font-black text-3xl text-rose-600 tracking-tighter tabular-nums decoration-rose-600 underline underline-offset-8">
                      ${totalFinalACobrar.toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tbody>
              </table>
           </div>

           {/* TOTAL LETRAS PREMIUM */}
           <div className="p-5 bg-white border border-slate-100 rounded-xl flex items-center gap-4 italic text-slate-400 font-bold text-xs uppercase shadow-sm">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             "LA SUMA DE: {numeroALetras(totalFinalACobrar)}"
           </div>
        </div>

        {/* CANALES DE PAGO LIMPIOS */}
        <div className="mt-10 p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-inner">
           <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-md">
             <Landmark size={32} />
           </div>
           <div className="space-y-1.5 flex-1">
             <h5 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2 underline underline-offset-4 decoration-emerald-500 decoration-2">Información para Consignación</h5>
             <p className="text-[13px] font-bold text-slate-700 leading-relaxed uppercase">
                Banco Caja Social • Cuenta de Ahorros: 24511819298 • Titular: Conjunto P. de las Flores • NIT 832.011.421-3
             </p>
             <p className="text-[9px] font-medium text-slate-400 flex items-center gap-2">
                <Info size={10} /> Por favor especifique el número de apartamento en la descripción de la transferencia.
             </p>
           </div>
        </div>

        {/* ESPACIO PARA FIRMA */}
        <div className="mt-20 pt-16 border-t-2 border-slate-900 text-center flex flex-col items-center">
           <div className="w-48 border-b border-slate-300 h-8"></div>
           <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic leading-loose">
             "Construyendo un futuro transparente y en orden."
           </p>
        </div>

      </div>
    </div>
  );
}