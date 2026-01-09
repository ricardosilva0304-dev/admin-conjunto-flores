"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Printer, X, Building2, Wallet, 
  CheckCircle2, Loader2, ArrowUpRight, History, 
  TrendingUp, TrendingDown 
} from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  const [pagosHistoricos, setPagosHistoricos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorialCompleto();
  }, [residente]);

  async function cargarHistorialCompleto() {
    setLoading(true);
    // Traer todos los recibos de pago del residente
    const { data: pagos } = await supabase
      .from("pagos")
      .select("*")
      .eq("residente_id", residente.id)
      .order('fecha_pago', { ascending: false });

    if (pagos) setPagosHistoricos(pagos);
    setLoading(false);
  }

  // Cálculos rápidos
  const totalFacturadoHistorico = deudas.reduce((acc: number, d: any) => acc + Number(d.monto_original || 0), 0);
  const recaudadoMesesActuales = pagosHistoricos.reduce((acc: number, p: any) => acc + Number(p.monto_total || 0), 0);
  const deudaPendienteHoy = deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente || 0), 0);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={50} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center p-6 overflow-y-auto no-scrollbar">
      {/* CSS PARA IMPRESIÓN */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 1.5cm; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* PANEL DE ACCIÓN */}
      <div className="no-print w-full max-w-4xl bg-white p-6 rounded-[2.5rem] mb-6 flex justify-between items-center shadow-2xl border border-white/20 animate-in slide-in-from-top-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><History /></div>
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Auditoría Individual</p>
              <h3 className="text-slate-900 font-black text-xl uppercase tracking-tighter">Estado de Cuenta</h3>
           </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-xl active:scale-95 shadow-emerald-500/20"><Printer size={20} /> Imprimir</button>
          <button onClick={onClose} className="bg-slate-100 text-slate-400 p-4 rounded-2xl hover:bg-slate-200 transition-all"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-4xl bg-white p-12 border border-slate-100 shadow-2xl flex flex-col min-h-[1000px]">
        
        {/* CABECERA DOCUMENTAL */}
        <div className="flex justify-between items-start mb-10 border-b-4 border-slate-900 pb-10">
           <div className="flex flex-col gap-4">
              <img src="/logo.png" alt="Logo" className="w-40 h-auto" />
              <div className="space-y-1">
                 <h2 className="text-xl font-black text-slate-900 leading-none">AGRUPACIÓN RES. EL PARQUE DE LAS FLORES</h2>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Informe de Gestión Cartera • {new Date().toLocaleDateString('es-CO', {month: 'long', year: 'numeric'})}</p>
              </div>
           </div>
           <div className="text-right flex flex-col gap-2">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl inline-block shadow-lg">
                 <span className="text-[11px] font-bold text-emerald-400 block mb-1">Identificación Unidad</span>
                 <span className="text-3xl font-black italic tracking-tighter">{residente.torre.replace("Torre ","T")}-{residente.apartamento}</span>
              </div>
           </div>
        </div>

        {/* INFO DEL TITULAR */}
        <div className="grid grid-cols-2 gap-8 mb-12">
           <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Residente / Propietario</p>
              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{residente.nombre}</h4>
              <p className="text-slate-400 font-bold text-xs mt-1">{residente.email || 'Sin correo registrado'}</p>
           </div>
           <div className="flex flex-col justify-center bg-white border border-slate-100 p-8 rounded-[2rem] text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Consulta</p>
              <p className="font-black text-slate-900 text-base">{new Date().toLocaleString('es-CO', { dateStyle: 'full' })}</p>
              <p className="text-[9px] text-emerald-600 font-bold mt-2 uppercase tracking-widest">Información Sincronizada en Tiempo Real</p>
           </div>
        </div>

        {/* KPI: RESUMEN DE SALDOS */}
        <div className="grid grid-cols-3 gap-6 mb-12">
           <div className="p-6 bg-slate-900 rounded-[1.8rem] text-white">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Total Generado</p>
              <h4 className="text-2xl font-black tabular-nums">${totalFacturadoHistorico.toLocaleString()}</h4>
           </div>
           <div className="p-6 bg-emerald-50 rounded-[1.8rem] border border-emerald-100">
              <p className="text-emerald-500 text-[10px] font-black uppercase mb-1">Total Abonado</p>
              <h4 className="text-2xl font-black text-emerald-700 tabular-nums">${recaudadoMesesActuales.toLocaleString()}</h4>
           </div>
           <div className="p-6 bg-rose-50 rounded-[1.8rem] border border-rose-100">
              <p className="text-rose-400 text-[10px] font-black uppercase mb-1">Deuda a Pagar</p>
              <h4 className="text-2xl font-black text-rose-600 tabular-nums underline underline-offset-4">${deudaPendienteHoy.toLocaleString()}</h4>
           </div>
        </div>

        <div className="flex-1 space-y-12">
          {/* TABLA 1: DEUDAS PENDIENTES */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Saldos y Obligaciones Pendientes</h3>
            </div>
            <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
               <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-100">
                     <tr>
                        <th className="py-4 px-6 italic">PERIODO</th>
                        <th className="py-4 px-6 tracking-widest">CONCEPTO</th>
                        <th className="py-4 px-6 text-right">MONTO ORIGINAL</th>
                        <th className="py-4 px-6 text-right text-rose-600 font-black">SALDO ACTUAL</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {deudas.length > 0 ? deudas.map((d:any) => (
                       <tr key={d.id} className="text-slate-600 font-bold uppercase tracking-tight">
                          <td className="py-4 px-6 font-black text-slate-900">{d.causaciones_globales?.mes_causado}</td>
                          <td className="py-4 px-6">{d.concepto_nombre || 'Cuota Admin.'}</td>
                          <td className="py-4 px-6 text-right tabular-nums font-medium text-slate-400">${Number(d.monto_original).toLocaleString()}</td>
                          <td className="py-4 px-6 text-right tabular-nums text-rose-600 font-black text-sm">${Number(d.saldo_pendiente).toLocaleString()}</td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="p-8 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">Unidad al día - Sin deudas</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>

          {/* TABLA 2: HISTORIAL DE PAGOS */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Últimos Recibos Aplicados</h3>
            </div>
            <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
               <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-100">
                     <tr>
                        <th className="py-4 px-6">RECIBO Nº</th>
                        <th className="py-4 px-6 text-center italic">FECHA</th>
                        <th className="py-4 px-6 tracking-widest">MÉTODO</th>
                        <th className="py-4 px-6 text-right text-emerald-600 font-black tracking-widest">MONTO ABONADO</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {pagosHistoricos.length > 0 ? pagosHistoricos.map((p:any) => (
                       <tr key={p.id} className="text-slate-600 font-bold tracking-tight">
                          <td className="py-4 px-6 font-black text-slate-900 italic">#{p.numero_recibo}</td>
                          <td className="py-4 px-6 text-center text-slate-400">{p.fecha_pago}</td>
                          <td className="py-4 px-6 font-medium text-[10px] uppercase">{p.metodo_pago}</td>
                          <td className="py-4 px-6 text-right tabular-nums text-emerald-600 font-black text-sm">
                             <span className="mr-1">+</span>${Number(p.monto_total).toLocaleString()}
                          </td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="p-8 text-center text-slate-300 uppercase tracking-widest font-black text-xs italic">Sin recaudos históricos en sistema</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA PROFESIONAL */}
        <div className="mt-16 border-t-2 border-slate-100 pt-10 text-center relative overflow-hidden bg-slate-50 p-6 rounded-[2rem]">
           <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-3 italic">"Construyendo comunidad, Parque de las Flores"</p>
           <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">Este documento sirve como certificación administrativa del estado contable individual.<br/>Cualquier inquietud, favor contactar al e-mail oficial: <span className="text-emerald-600 lowercase italic">cr.parquedelasflores@gmail.com</span></p>
           <div className="mt-12 flex justify-between px-10">
              <div className="w-48 border-t border-slate-300 pt-1 text-[8px] font-black uppercase text-slate-300">Administrador Responsable</div>
              <div className="w-16 h-16 border border-slate-100 rounded-full flex items-center justify-center opacity-10 rotate-12 grayscale"><Building2 size={40} /></div>
           </div>
        </div>

      </div>
    </div>
  );
}