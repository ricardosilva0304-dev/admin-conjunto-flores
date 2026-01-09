"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Printer, X, Building2, Wallet, 
  CheckCircle2, Loader2, ArrowUpRight, History, 
  TrendingUp, TrendingDown, Landmark, User, FileText
} from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  const [pagosHistoricos, setPagosHistoricos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, [residente]);

  async function cargarHistorial() {
    setLoading(true);
    const { data: pagos } = await supabase
      .from("pagos")
      .select("*")
      .eq("residente_id", residente.id)
      .order('fecha_pago', { ascending: false });

    if (pagos) setPagosHistoricos(pagos);
    setLoading(false);
  }

  // Cálculos rápidos (Resta lo que se ha abonado de la deuda total histórica)
  const totalGenerado = deudas.reduce((acc: number, d: any) => acc + Number(d.monto_original || 0), 0);
  const totalAbonado = pagosHistoricos.reduce((acc: number, p: any) => acc + Number(p.monto_total || 0), 0);
  const saldoPendiente = deudas.reduce((acc: number, d: any) => acc + Number(d.saldo_pendiente || 0), 0);

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={60} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-[100] flex flex-col items-center p-6 overflow-y-auto no-scrollbar">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #print-area, #print-area * { visibility: visible; } 
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2cm; background: white; } 
          .no-print { display: none !important; } 
        }
      `}</style>

      {/* CABECERA DE CONTROL (PANTALLA) */}
      <div className="no-print w-full max-w-5xl bg-white/5 border border-white/10 p-6 rounded-[2.5rem] mb-8 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <FileText size={28} strokeWidth={2.5} />
           </div>
           <div>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Auditoría Digital</p>
              <h3 className="text-white font-black text-2xl tracking-tighter">Certificado de Estado de Cuenta</h3>
           </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-white hover:bg-emerald-500 hover:text-black text-slate-900 font-black px-10 py-4 rounded-[1.25rem] flex items-center gap-3 transition-all active:scale-95">
            <Printer size={20} /> IMPRIMIR INFORME
          </button>
          <button onClick={onClose} className="bg-white/5 hover:bg-rose-500 text-white p-4 rounded-[1.25rem] transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* ÁREA DE DOCUMENTO */}
      <div id="print-area" className="w-full max-w-5xl bg-white p-20 shadow-2xl flex flex-col min-h-[1100px] relative overflow-hidden border border-slate-100 print:shadow-none print:border-0">
        
        {/* LÍNEA DE DISEÑO LATERAL (SOLO IMPRESIÓN) */}
        <div className="absolute top-0 left-0 w-2 h-full bg-slate-900 print:block hidden"></div>

        {/* HEADER DOCUMENTAL */}
        <div className="flex justify-between items-start mb-16">
           <div className="flex flex-col gap-6">
              <img src="/logo.png" alt="Logo" className="w-48 h-auto" />
              <div className="space-y-1">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">PARQUE DE LAS FLORES</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">NIT. 832.011.421-3 • AGRUPACIÓN RESIDENCIAL</p>
              </div>
           </div>
           
           <div className="flex flex-col items-end gap-3">
              <div className="bg-slate-900 text-white p-6 rounded-[1.5rem] text-center shadow-xl">
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Identificación Unidad</span>
                 <span className="text-3xl font-black italic tracking-tighter tabular-nums uppercase">T{residente.torre.replace("Torre ","")}-{residente.apartamento}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Consultado: {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
           </div>
        </div>

        {/* DATOS DEL PROPIETARIO */}
        <div className="mb-12 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center">
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Titular de Cuenta</p>
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{residente.nombre}</h4>
              <p className="text-emerald-600 font-bold text-xs mt-1 lowercase italic">{residente.email || 'correo@no-registrado.com'}</p>
           </div>
           <div className="text-right border-l border-slate-200 pl-10 h-16 flex flex-col justify-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
              <p className="text-lg font-black text-slate-900">SOACHA, CUNDINAMARCA</p>
           </div>
        </div>

        {/* KPI: BALANCE EJECUTIVO */}
        <div className="grid grid-cols-3 gap-6 mb-16">
           <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center justify-center relative overflow-hidden group shadow-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 z-10">Total Generado</p>
              <h4 className="text-3xl font-black tabular-nums z-10 tracking-tighter">${totalGenerado.toLocaleString('es-CO')}</h4>
              <div className="absolute -bottom-4 -right-4 opacity-5 z-0 transition-transform group-hover:scale-110"><TrendingUp size={100} /></div>
           </div>
           
           <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/5">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Abonado a la Fecha</p>
              <h4 className="text-3xl font-black text-emerald-700 tabular-nums tracking-tighter">${totalAbonado.toLocaleString('es-CO')}</h4>
           </div>

           <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 flex flex-col items-center justify-center shadow-lg shadow-rose-500/5">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Saldo en Cartera</p>
              <h4 className="text-4xl font-black text-rose-600 tabular-nums tracking-tighter">${saldoPendiente.toLocaleString('es-CO')}</h4>
           </div>
        </div>

        {/* CUERPO DEL INFORME: TABLAS */}
        <div className="flex-1 space-y-20">
          {/* TABLA 1: DEUDAS */}
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <div className="w-10 h-1 px-1 bg-rose-500 rounded-full"></div>
              Relación de Obligaciones Pendientes
            </h3>
            <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-white font-black uppercase">
                     <tr>
                        <th className="py-5 px-8">PERIODO</th>
                        <th className="py-5 px-8">CONCEPTO FACTURADO</th>
                        <th className="py-5 px-8 text-right font-light">VALOR NOMINAL</th>
                        <th className="py-5 px-8 text-right font-black text-emerald-400">SALDO ACTIVO</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {deudas.map((d:any) => (
                       <tr key={d.id} className="text-slate-600 font-bold uppercase hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-8 font-black text-slate-900">{d.causaciones_globales?.mes_causado}</td>
                          <td className="py-5 px-8 tracking-tighter">{d.concepto_nombre || 'Cuota Administrativa'}</td>
                          <td className="py-5 px-8 text-right tabular-nums font-medium text-slate-300">${Number(d.monto_original).toLocaleString()}</td>
                          <td className="py-5 px-8 text-right tabular-nums text-rose-600 font-black text-sm">${Number(d.saldo_pendiente).toLocaleString()}</td>
                       </tr>
                     ))}
                     {deudas.length === 0 && (
                        <tr><td colSpan={4} className="py-16 text-center text-slate-300 font-black italic tracking-widest text-xs uppercase">Cuenta sin saldos pendientes a la fecha.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>

          {/* TABLA 2: RECAUDOS */}
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <div className="w-10 h-1 bg-emerald-500 rounded-full"></div>
              Historial de Pagos y Abonos Recibidos
            </h3>
            <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
               <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                     <tr>
                        <th className="py-5 px-8">COMPROBANTE</th>
                        <th className="py-5 px-8 text-center italic">FECHA</th>
                        <th className="py-5 px-8">MÉTODO DE PAGO</th>
                        <th className="py-5 px-8 text-right font-black text-emerald-600 tracking-tighter">MONTO</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                     {pagosHistoricos.map((p:any) => (
                       <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-5 px-8 font-black text-slate-900 italic tracking-tighter">RECIBO #{p.numero_recibo}</td>
                          <td className="py-5 px-8 text-center font-bold">{p.fecha_pago}</td>
                          <td className="py-5 px-8 font-black uppercase text-[10px]">{p.metodo_pago}</td>
                          <td className="py-5 px-8 text-right tabular-nums text-emerald-600 font-black text-base">+ ${Number(p.monto_total).toLocaleString()}</td>
                       </tr>
                     ))}
                     {pagosHistoricos.length === 0 && (
                        <tr><td colSpan={4} className="py-16 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">No existen pagos registrados en el periodo seleccionado.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA REFINADO */}
        <div className="mt-32 border-t-4 border-slate-900 pt-10 text-center relative overflow-hidden bg-slate-50/50 p-8 rounded-b-[4rem]">
           <div className="mb-10 flex justify-between items-end px-16">
              <div className="flex flex-col items-center">
                 <div className="w-32 border-b-2 border-slate-300 mb-2"></div>
                 <p className="text-[9px] font-black uppercase text-slate-400">ADMINISTRADOR / SELLO</p>
              </div>
              <Building2 className="text-slate-100" size={60} />
              <div className="flex flex-col items-center">
                 <div className="w-32 border-b-2 border-slate-300 mb-2"></div>
                 <p className="text-[9px] font-black uppercase text-slate-400">COPIETARIO / REVISADO</p>
              </div>
           </div>
           <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em] leading-relaxed mb-4">
             "Construimos seguridad y armonía financiera"
           </p>
           <p className="text-[8px] text-slate-200 tracking-tighter uppercase italic italic">Documento emitido electrónicamente por el Sistema Integrado v1.0. Para rectificación de saldos escribir a: <span className="lowercase">cr.parquedelasflores@gmail.com</span></p>
        </div>

      </div>
    </div>
  );
}