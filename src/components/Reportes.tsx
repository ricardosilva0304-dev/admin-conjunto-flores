"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  FileText, Printer, Loader2, Scale, TrendingDown, TrendingUp,
  Wallet, Landmark, Banknote, Users, PieChart, ChevronRight
} from "lucide-react";

export default function Reportes() {
  const [tipo, setTipo] = useState("General");
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [reporteData, setReporteData] = useState<{
    ingresos: any[],
    egresos: any[],
    residentes: any[],
    cartera: any[]
  } | null>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0"; iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");

    doc.write(`
      <html>
        <head>
          <title>Reporte Administrativo</title>
          ${styles}
          <style>
            @page { size: letter; margin: 1.5cm; }
            body { background: white !important; font-family: 'Inter', sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5px; }
            th { background: #f8fafc !important; padding: 8px; text-align: left; border-bottom: 2px solid #1e293b; color: #475569; font-weight: 800; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #334155; }
            .text-right { text-align: right; }
            .kpi-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
            .kpi-card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <div class="print-container">${content.innerHTML}</div>
          <script>window.onload=()=>{window.print();setTimeout(()=>window.frameElement.remove(),100);};</script>
        </body>
      </html>
    `);
    doc.close();
  };

  async function generarReporte() {
    setLoading(true);
    setReporteData(null);
    try {
      if (tipo === "General" || tipo === "Solo Ingresos" || tipo === "Solo Egresos") {
        if (!mes) return alert("Selecciona un mes");

        // --- CORRECCIÓN DE FECHAS DINÁMICAS ---
        const [anio, mesNum] = mes.split("-").map(Number);
        const primerDia = `${mes}-01`;

        // Esta línea calcula el último día real del mes (28, 30 o 31)
        const ultimoDiaNum = new Date(anio, mesNum, 0).getDate();
        const ultimoDia = `${mes}-${ultimoDiaNum.toString().padStart(2, '0')}`;
        // ---------------------------------------

        const [resIng, resEgr] = await Promise.all([
          supabase.from("pagos")
            .select("*")
            .gte("fecha_pago", primerDia)
            .lte("fecha_pago", ultimoDia)
            .order('fecha_pago'),
          supabase.from("egresos")
            .select("*")
            .gte("fecha", primerDia)
            .lte("fecha", ultimoDia)
            .order('fecha')
        ]);

        setReporteData({ ingresos: resIng.data || [], egresos: resEgr.data || [], residentes: [], cartera: [] });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  // Cálculos rápidos para los KPIs
  const totalIng = reporteData?.ingresos.reduce((a, b) => a + Number(b.monto_total), 0) || 0;
  const totalEgr = reporteData?.egresos.reduce((a, b) => a + Number(b.monto), 0) || 0;
  const banco = reporteData?.ingresos.filter(i => i.metodo_pago === 'Transferencia').reduce((a, b) => a + Number(b.monto_total), 0) || 0;
  const efectivo = reporteData?.ingresos.filter(i => i.metodo_pago === 'Efectivo').reduce((a, b) => a + Number(b.monto_total), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans text-slate-800">

      {/* SECCIÓN DE FILTROS (MÓVIL-FIRST) */}
      <section className="no-print bg-slate-900 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 border border-white/5">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
            <PieChart size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-white font-black text-sm uppercase tracking-widest leading-none">Módulo de Auditoría</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-tighter">Generación de informes contables</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            className="flex-1 md:w-56 bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-xs font-black outline-none focus:ring-2 ring-emerald-500/50"
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setReporteData(null); }}
          >
            <optgroup label="FINANCIEROS" className="bg-slate-900">
              <option value="General">Balance Consolidado</option>
              <option value="Solo Ingresos">Libro de Ingresos</option>
              <option value="Solo Egresos">Libro de Gastos</option>
            </optgroup>
            <optgroup label="ADMINISTRATIVOS" className="bg-slate-900">
              <option value="Estado Cartera">Estado de Cartera (Mora)</option>
              <option value="Directorio Residentes">Censo de Residentes</option>
            </optgroup>
          </select>

          {(tipo === "General" || tipo.includes("Solo")) && (
            <input type="month" className="bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-xs font-black outline-none" onChange={(e) => setMes(e.target.value)} />
          )}

          <button
            onClick={generarReporte}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "GENERAR"}
          </button>
        </div>
      </section>

      {/* ÁREA DEL REPORTE */}
      {reporteData && (
        <div className="bg-white border-2 border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-700">

          <div className="no-print p-6 border-b border-slate-50 flex justify-end">
            <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
              <Printer size={16} /> Imprimir en PDF
            </button>
          </div>

          <div ref={printRef} className="p-12 md:p-16 w-full bg-white text-slate-900">

            {/* CABEZOTE PROFESIONAL */}
            <div className="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-10">
              <div className="flex items-center gap-6">
                <img src="/logo.png" alt="Logo" className="w-20" />
                <div>
                  <h1 className="text-xl font-black uppercase italic leading-none mb-1">Informe de Gestión Contable</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">C.R. El Parque de las Flores • NIT 832.011.421-3</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Tipo de Reporte</p>
                <div className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-black uppercase mb-2 inline-block">{tipo}</div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{mes ? `Periodo: ${mes}` : `Corte: ${new Date().toLocaleDateString()}`}</p>
              </div>
            </div>

            {/* TABLERO DE CIFRAS (KPIs) */}
            {(tipo === "General" || tipo.includes("Solo")) && (
              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Recaudo Total</p>
                    <TrendingUp size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black tabular-nums">${totalIng.toLocaleString()}</p>
                  <div className="mt-3 flex gap-4 text-[8px] font-bold text-slate-400 uppercase">
                    <span>Bco: ${banco.toLocaleString()}</span>
                    <span>Efec: ${efectivo.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Egresos / Gastos</p>
                    <TrendingDown size={16} className="text-rose-500" />
                  </div>
                  <p className="text-3xl font-black tabular-nums">-${totalEgr.toLocaleString()}</p>
                  <p className="mt-3 text-[8px] font-bold text-slate-400 uppercase">{reporteData.egresos.length} facturas pagadas</p>
                </div>
                <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Saldo Neto</p>
                    <Scale size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black tabular-nums">${(totalIng - totalEgr).toLocaleString()}</p>
                  <p className="mt-3 text-[8px] font-bold text-slate-500 uppercase tracking-widest">Utilidad operativa mes</p>
                </div>
              </div>
            )}

            {/* TABLA: INGRESOS DETALLADOS */}
            {(tipo === "General" || tipo === "Solo Ingresos") && (
              <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> Relación Detallada de Ingresos
                </h3>
                <table className="w-full">
                  <thead>
                    <tr><th>Recibo</th><th>Unidad</th><th>Titular</th><th>Concepto Principal</th><th>Medio</th><th className="text-right">Monto</th></tr>
                  </thead>
                  <tbody>
                    {reporteData.ingresos.map(i => (
                      <tr key={i.id}>
                        <td className="font-black">RC-{i.numero_recibo}</td>
                        <td className="font-bold">{i.unidad}</td>
                        <td className="uppercase">{i.residentes?.nombre || 'Residente'}</td>
                        <td className="uppercase text-slate-400">{i.concepto_texto?.split("||")[0].split("|")[0]}</td>
                        <td className="text-[8px] font-bold uppercase">{i.metodo_pago}</td>
                        <td className="text-right font-black text-emerald-600">${Number(i.monto_total).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reporteData.ingresos.length === 0 && <tr><td colSpan={6} className="text-center py-10 italic text-slate-400">No se registraron ingresos en este periodo.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA: EGRESOS DETALLADOS */}
            {(tipo === "General" || tipo === "Solo Egresos") && (
              <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div> Relación Detallada de Gastos
                </h3>
                <table className="w-full">
                  <thead>
                    <tr><th>Gasto No.</th><th>Fecha</th><th>Beneficiario (Tercero)</th><th>Descripción / Concepto</th><th className="text-right">Monto</th></tr>
                  </thead>
                  <tbody>
                    {reporteData.egresos.map(e => (
                      <tr key={e.id}>
                        <td className="font-black">CE-{e.recibo_n}</td>
                        <td>{e.fecha}</td>
                        <td className="font-bold uppercase">{e.pagado_a}</td>
                        <td className="italic text-slate-400 uppercase">{e.concepto}</td>
                        <td className="text-right font-black text-rose-600">${Number(e.monto).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reporteData.egresos.length === 0 && <tr><td colSpan={5} className="text-center py-10 italic text-slate-400">No se registraron gastos en este periodo.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA: ESTADO DE CARTERA */}
            {tipo === "Estado Cartera" && (
              <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-rose-600 rounded-full"></div> Balance General de Cartera Morosa
                </h3>
                <table className="w-full">
                  <thead><tr><th>Unidad</th><th>Titular de la Unidad</th><th>Estado Contable</th><th className="text-right">Saldo a la Fecha</th></tr></thead>
                  <tbody>
                    {reporteData.cartera.sort((a, b) => b.total - a.total).map(r => (
                      <tr key={r.id}>
                        <td className="font-black">T{r.torre.slice(-1)}-{r.apartamento}</td>
                        <td className="uppercase font-medium">{r.nombre}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${r.total > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {r.total > 0 ? 'En Mora' : 'Anticipo / CR'}
                          </span>
                        </td>
                        <td className={`text-right font-black tabular-nums ${r.total < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          ${Math.abs(r.total).toLocaleString()} {r.total < 0 ? '(CR)' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-900 p-6 rounded-2xl mt-6 flex justify-between items-center text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest">Total Cartera en Calle:</p>
                  <p className="text-2xl font-black tabular-nums">${reporteData.cartera.reduce((a, b) => a + (b.total > 0 ? b.total : 0), 0).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* FIRMAS LEGALES */}
            <div className="mt-32 pt-10 border-t-2 border-slate-900 grid grid-cols-2 gap-24">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-900">Administración / Tesorería</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Responsable del Recaudo</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-900">Consejo de Admón / Revisoría</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Control Interno</p>
              </div>
            </div>

            <div className="mt-20 text-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">
              Fin del Reporte Administrativo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}