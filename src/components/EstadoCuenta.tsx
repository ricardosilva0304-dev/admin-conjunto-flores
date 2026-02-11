"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Printer, X, Loader2, Wallet, History, FileText } from "lucide-react";

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

  // --- FUNCIÓN PARA FORMATEAR EL PERIODO (Ej: 2025-02 -> Febrero 2025) ---
  const formatPeriodo = (mesCausado: string) => {
    if (!mesCausado) return "N/A";
    const [year, month] = mesCausado.split("-");
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  // --- LÓGICA DE ORDENAMIENTO (De más antiguo a más reciente) ---
  const deudasOrdenadas = useMemo(() => {
    return [...deudas].sort((a, b) => {
      const fechaA = a.causaciones_globales?.mes_causado || "";
      const fechaB = b.causaciones_globales?.mes_causado || "";
      return fechaA.localeCompare(fechaB);
    });
  }, [deudas]);

  const calcularValorHoy = (d: any) => {
    if (!d.causaciones_globales) return d.saldo_pendiente || 0;
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesAct = hoy.getMonth() + 1;
    const anioAct = hoy.getFullYear();
    const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);

    const m1 = d.precio_m1 || d.monto_original || 0;
    const m2 = d.precio_m2 || m1;
    const m3 = d.precio_m3 || m1;

    let precioAplicable = m1;
    if (anioAct > yC || (anioAct === yC && mesAct > mC)) {
      precioAplicable = m3;
    } else {
      if (dia > 10 && dia <= 20) precioAplicable = m2;
      else if (dia > 20) precioAplicable = m3;
    }
    const pagadoYa = m1 - (d.saldo_pendiente || 0);
    return Math.max(0, precioAplicable - pagadoYa);
  };

  const totalPendiente = deudas.reduce((acc: number, d: any) => acc + calcularValorHoy(d), 0);

  if (loading) return <div className="fixed inset-0 bg-white/90 z-[400] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex flex-col items-center p-0 md:p-6 overflow-y-auto">
      <style>{`
        @media print {
          /* 1. Definir tamaño de página y márgenes */
          @page { 
            size: letter; 
            margin: 1.5cm; 
          }

          /* 2. Forzar que el cuerpo y los contenedores dejen fluir el contenido */
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          /* 3. ¡IMPORTANTE! Anulamos el 'fixed' del contenedor principal */
          .fixed.inset-0 {
            position: static !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            display: block !important;
          }

          /* 4. Visibilidad de elementos */
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          
          /* 5. Ajustes del área de impresión */
          #print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* 6. Evitar cortes feos en tablas */
          tr { page-break-inside: avoid; }
          section { page-break-inside: auto; }
          thead { display: table-header-group; } /* Repite el encabezado en cada hoja si la tabla es muy larga */

          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 flex justify-between items-center rounded-xl shadow-lg border">
        <span className="text-[10px] font-black uppercase text-slate-400">Auditoría: {residente.apartamento}</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer size={14} /> IMPRIMIR
          </button>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X /></button>
        </div>
      </div>

      <div id="print-area" className="w-full max-w-4xl bg-white p-8 md:p-12 border border-slate-100 font-sans shadow-2xl rounded-sm">
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-20" />
            <div>
              <h1 className="text-sm font-black uppercase">Estado de Cuenta</h1>
              <p className="text-[9px] font-bold text-slate-400">P. DE LAS FLORES - NIT 832.011.421-3</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black italic">T{residente.torre.slice(-1)}-{residente.apartamento}</h2>
            <p className="text-[8px] font-bold text-slate-400 uppercase">Corte: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* RESUMEN */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase">Residente</p>
            <p className="text-xs font-black uppercase truncate">{residente.nombre}</p>
          </div>
          <div className="text-center border-x border-slate-200">
            <p className="text-[8px] font-black text-slate-400 uppercase">Total Recaudado</p>
            <p className="text-xs font-black text-emerald-600">${pagos.reduce((acc, p) => acc + Number(p.monto_total || 0), 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase">Saldo Hoy (Tramos)</p>
            <p className="text-xs font-black text-rose-600">${totalPendiente.toLocaleString()}</p>
          </div>
        </div>

        {/* TABLAS */}
        <div className="space-y-8">
          <section>
            <h3 className="text-[9px] font-black uppercase mb-2 flex items-center gap-2 border-b pb-1">
              <Wallet size={10} /> Deudas Pendientes
            </h3>
            <table className="w-full text-[10px] text-left">
              <thead className="border-b font-black uppercase text-slate-400">
                <tr>
                  <th className="py-2">Periodo</th>
                  <th>Concepto</th>
                  <th className="text-right">Valor Hoy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deudasOrdenadas.map((d: any) => (
                  <tr key={d.id}>
                    {/* Aquí aplicamos el nuevo formato de Periodo */}
                    <td className="py-2 font-bold">{formatPeriodo(d.causaciones_globales?.mes_causado)}</td>
                    <td className="py-2 uppercase text-slate-500">{d.concepto_nombre}</td>
                    <td className="py-2 text-right font-black text-rose-600">${calcularValorHoy(d).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-[9px] font-black uppercase mb-2 flex items-center gap-2 border-b pb-1">
              <History size={10} /> Historial de Pagos
            </h3>
            <table className="w-full text-[10px] text-left border">
              <thead className="bg-slate-50 border-b font-black uppercase text-slate-400">
                <tr>
                  <th className="p-2">Recibo</th>
                  <th>Fecha</th>
                  <th>Medio</th>
                  <th className="p-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagos.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-2 font-black">RC-{p.numero_recibo}</td>
                    <td>{new Date(p.fecha_pago).toLocaleDateString()}</td>
                    <td className="text-[8px] uppercase">{p.metodo_pago}</td>
                    <td className="p-2 text-right font-black text-emerald-600">${Number(p.monto_total).toLocaleString()}</td>
                  </tr>
                ))}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400 italic">No se registran pagos realizados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}