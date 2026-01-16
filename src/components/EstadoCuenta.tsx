"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Building2, Wallet, History, FileText, CheckCircle2, User } from "lucide-react";

export default function EstadoCuenta({ residente, deudas, onClose }: any) {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      const { data } = await supabase
        .from("pagos")
        .select("*")
        .eq("residente_id", residente.id)
        .order('fecha_pago', { ascending: false });

      if (data) setPagos(data);
      setLoading(false);
    };
    fetchPagos();
  }, [residente]);

  // --- NUEVA LÓGICA DE CÁLCULO DINÁMICO (M1, M2, M3) ---
  const obtenerSaldosDinamicos = (deuda: any) => {
    if (!deuda.causaciones_globales) return { causado: 0, pendiente: 0 };

    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = deuda.causaciones_globales.mes_causado.split("-").map(Number);

    // Definir cuál es el precio que aplica HOY
    let precioQueAplicaHoy = deuda.precio_m1 || 0;

    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioQueAplicaHoy = deuda.precio_m3 || 0; // Mes vencido
    } else {
      if (dia > 10 && dia <= 20) precioQueAplicaHoy = deuda.precio_m2 || 0; // Tramo 2
      if (dia > 20) precioQueAplicaHoy = deuda.precio_m3 || 0; // Tramo 3
    }

    // Calcular cuánto ha pagado el residente de esta deuda específica
    // (Precio base M1 - Saldo pendiente en DB)
    const yaPagadoReal = (deuda.precio_m1 || 0) - (deuda.saldo_pendiente || 0);

    // El pendiente actual es lo que debería valer hoy menos lo que ya abonó
    const pendienteRealHoy = Math.max(0, precioQueAplicaHoy - yaPagadoReal);

    return {
      causado: precioQueAplicaHoy,
      pendiente: pendienteRealHoy
    };
  };

  // Totales para los KPIs superiores
  const totalAbonado = pagos.reduce((acc: number, p: any) => acc + Number(p.monto_total || 0), 0);

  // Calculamos la deuda vigente sumando el "pendiente real hoy" de cada registro
  const deudaVigenteActual = deudas.reduce((acc: number, d: any) => {
    return acc + obtenerSaldosDinamicos(d).pendiente;
  }, 0);

  if (loading) return (
    <div className="fixed inset-0 bg-white/90 z-[110] flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-slate-300" size={40} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando Informe...</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto no-scrollbar">

      <style>{`
        @media print { 
          /* 1. Resetear el cuerpo para permitir múltiples páginas */
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 2. Ocultar absolutamente todo lo que no sea el área de impresión */
          body * { 
            visibility: hidden; 
          }

          /* 3. El área de impresión debe ser visible y fluir naturalmente */
          #print-area, #print-area * { 
            visibility: visible; 
          }

          /* 4. Posicionamiento crítico para evitar cortes */
          #print-area { 
            position: absolute !important; /* Volvemos a relativo/estático para el flujo */
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 1.5cm !important; /* Margen físico de la hoja */
            box-shadow: none !important;
            border: none !important;
            display: block !important;
          }

          /* 5. Forzar saltos de página inteligentes en las tablas */
          tr { 
            page-break-inside: avoid !important; 
          }
          
          .no-print { 
            display: none !important; 
          }

          /* Definir tamaño de página */
          @page { 
            size: letter; 
            margin: 0; 
          }
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="no-print w-full max-w-5xl bg-white border-b md:border md:rounded-2xl p-4 flex justify-between items-center shadow-2xl md:mb-6 sticky top-0 z-[120]">
        <div className="flex items-center gap-3 px-2">
          <FileText className="text-slate-400" size={18} />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Estado de Cuenta Detallado</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tighter hover:bg-emerald-600 transition-all shadow-lg">
            <Printer size={14} className="inline mr-2" /> Imprimir
          </button>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-5xl bg-white p-8 md:p-16 border border-slate-100 shadow-xl flex flex-col text-slate-800 font-sans print:shadow-none print:border-0 print:m-0 print:p-0">

        {/* ENCABEZADO */}
        <div className="flex justify-between border-b-4 border-slate-900 pb-10 mb-10">
          <div className="space-y-4">
            <img src="/logo.png" alt="Logo" className="w-44 h-auto object-contain" />
            <div className="space-y-0.5">
              <h2 className="font-black text-lg text-slate-900 leading-none">AGRUPACIÓN RES. EL PARQUE DE LAS FLORES</h2>
              <p className="text-[9px] text-slate-500 font-black tracking-widest">NIT. 832.011.421-3 • RÉGIMEN PROPIEDAD HORIZONTAL</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Unidad Habitacional</p>
              <h1 className="text-3xl font-black text-slate-900 tabular-nums italic">T{residente.torre.replace("Torre ", "")}-{residente.apartamento}</h1>
            </div>
            <p className="text-[9px] font-bold text-slate-300 mt-4 uppercase">Generado el: {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
          </div>
        </div>

        {/* RESUMEN KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2"><User size={12} className="inline mr-1" /> Propietario</p>
            <h4 className="text-2xl font-black text-slate-900 uppercase">{residente.nombre}</h4>
            <p className="text-emerald-600 font-bold text-xs mt-2">{residente.email || 'Sin email registrado'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 p-5 rounded-2xl text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pagado</p>
              <p className="text-xl font-black text-emerald-600">${totalAbonado.toLocaleString('es-CO')}</p>
            </div>
            <div className="border border-slate-200 p-5 rounded-2xl bg-rose-50 border-rose-100 text-center">
              <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Deuda a la Fecha</p>
              <p className="text-xl font-black text-rose-600 underline underline-offset-4">${deudaVigenteActual.toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>

        {/* TABLA DE SALDOS DINÁMICOS */}
        <div className="flex-1 space-y-16">
          <div>
            <div className="flex items-center gap-3 mb-6 bg-slate-900 p-3 rounded-lg text-white">
              <Wallet size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Saldos Pendientes (Cálculo por Tramo)</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-black border-b border-slate-100 uppercase text-[9px]">
                <tr>
                  <th className="py-4 px-3">Periodo</th>
                  <th className="py-4 px-3">Detalle</th>
                  <th className="py-4 px-3 text-right">Vr. Causado Hoy</th>
                  <th className="py-4 px-3 text-right">Vr. Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold uppercase">
                {deudas.map((d: any) => {
                  const saldos = obtenerSaldosDinamicos(d);
                  return (
                    <tr key={d.id} className="text-slate-600 hover:bg-slate-50">
                      <td className="py-4 px-3 text-slate-900">{d.causaciones_globales?.mes_causado}</td>
                      <td className="py-4 px-3 font-normal text-[10px]">{d.concepto_nombre || "CARGO MENSUAL"}</td>
                      <td className="py-4 px-3 text-right text-slate-400 font-medium">${saldos.causado.toLocaleString()}</td>
                      <td className="py-4 px-3 text-right text-rose-600 font-black text-sm">${saldos.pendiente.toLocaleString()}</td>
                    </tr>
                  )
                })}
                {deudas.length === 0 && (
                  <tr><td colSpan={4} className="py-20 text-center opacity-30 italic">Unidad al día.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* HISTORIAL DE PAGOS */}
          <div>
            <div className="flex items-center gap-3 mb-6 bg-slate-100 p-3 rounded-lg">
              <History size={16} className="text-emerald-600" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Historial de Recibos de Caja</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[9px] uppercase border-b border-slate-100">
                <tr>
                  <th className="py-4 px-4">Recibo No.</th>
                  <th className="py-4 px-4 text-center">Fecha</th>
                  <th className="py-4 px-4">Metodo</th>
                  <th className="py-4 px-4 text-right">Abono (+)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {pagos.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-4 px-4 font-black text-slate-800">RC #{p.numero_recibo}</td>
                    <td className="py-4 px-4 text-center font-bold text-slate-400">{p.fecha_pago}</td>
                    <td className="py-4 px-4 text-[9px] uppercase">{p.metodo_pago}</td>
                    <td className="py-4 px-4 text-right font-black text-emerald-600">$ {Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PIE DE PAGINA */}
        <div className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2 italic">
            CONJUNTO RESIDENCIAL PARQUE DE LAS FLORES
          </p>
          <p className="text-[9px] text-slate-400">Certificación administrativa generada automáticamente.</p>
        </div>
      </div>
    </div>
  );
}