"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils"; // ASUNCIÓN: Esta función existe y es correcta.
import {
  FileText, Printer, Loader2, Scale, TrendingDown, TrendingUp,
  Wallet, Landmark, Banknote, Users, PieChart, Home, Phone, Mail, UserCheck, UserX
} from "lucide-react";

// --- INTERFACES PARA UNA MEJOR ORGANIZACIÓN DE DATOS ---
interface ReporteFinancieroData {
  tipo: 'FINANCIERO';
  ingresos: any[];
  egresos: any[];
  summary: {
    totalIngresos: number;
    totalEgresos: number;
    saldoNeto: number;
    ingresosBanco: number;
    ingresosEfectivo: number;
    numIngresos: number;
    numEgresos: number;
  };
}

interface ReporteCarteraData {
  tipo: 'CARTERA';
  enMora: any[];
  conSaldoAFavor: any[];
  summary: {
    totalEnMora: number;
    unidadesEnMora: number;
    totalSaldoAFavor: number;
    unidadesConSaldoAFavor: number;
  };
}

interface ReporteCensoData {
  tipo: 'CENSO';
  residentes: any[];
  summary: {
    totalUnidades: number;
    unidadesOcupadas: number;
    unidadesVacias: number;
  };
}

type ReporteData = ReporteFinancieroData | ReporteCarteraData | ReporteCensoData | null;


export default function Reportes() {
  const [tipoReporte, setTipoReporte] = useState("General");
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [datosReporte, setDatosReporte] = useState<ReporteData>(null);

  // --- FUNCIÓN DE IMPRESIÓN (SIN CAMBIOS SIGNIFICATIVOS) ---
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
          <title>Reporte Administrativo - C.R. El Parque de las Flores</title>
          ${styles}
          <style>
            @page { size: letter; margin: 1.5cm; }
            body { background: white !important; font-family: 'Inter', sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5px; }
            th { background: #f8fafc !important; padding: 8px; text-align: left; border-bottom: 2px solid #1e293b; color: #475569; font-weight: 800; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #334155; }
            .no-print { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body><div class="print-container">${content.innerHTML}</div></body>
        <script>window.onload=()=>{window.print();setTimeout(()=>document.body.removeChild(window.frameElement),100);};</script>
      </html>
    `);
    doc.close();
  };

  // --- LÓGICA CENTRALIZADA PARA GENERAR REPORTES ---
  async function generarReporte() {
    setLoading(true);
    setDatosReporte(null);
    try {
      // --- BLOQUE PARA REPORTES FINANCIEROS ---
      if (tipoReporte === "General" || tipoReporte === "Solo Ingresos" || tipoReporte === "Solo Egresos") {
        if (!mes) {
          alert("Por favor, selecciona un mes para los reportes financieros.");
          setLoading(false);
          return;
        }

        const [anio, mesNum] = mes.split("-").map(Number);
        const primerDia = `${mes}-01`;
        const ultimoDiaNum = new Date(anio, mesNum, 0).getDate();
        const ultimoDia = `${mes}-${ultimoDiaNum.toString().padStart(2, '0')}`;

        const [resIng, resEgr] = await Promise.all([
          supabase.from("pagos").select("*, residentes(nombre)").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia).order('fecha_pago'),
          supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order('fecha')
        ]);

        if (resIng.error || resEgr.error) throw resIng.error || resEgr.error;

        const ingresos = resIng.data || [];
        const egresos = resEgr.data || [];

        // Pre-cálculo de métricas
        const totalIngresos = ingresos.reduce((sum, i) => sum + Number(i.monto_total), 0);
        const totalEgresos = egresos.reduce((sum, e) => sum + Number(e.monto), 0);
        const ingresosBanco = ingresos.filter(i => i.metodo_pago === 'Transferencia').reduce((sum, i) => sum + Number(i.monto_total), 0);
        const ingresosEfectivo = ingresos.filter(i => i.metodo_pago === 'Efectivo').reduce((sum, i) => sum + Number(i.monto_total), 0);

        setDatosReporte({
          tipo: 'FINANCIERO',
          ingresos,
          egresos,
          summary: {
            totalIngresos,
            totalEgresos,
            saldoNeto: totalIngresos - totalEgresos,
            ingresosBanco,
            ingresosEfectivo,
            numIngresos: ingresos.length,
            numEgresos: egresos.length
          }
        });
      }
      // --- BLOQUE PARA REPORTE DE ESTADO DE CARTERA ---
      else if (tipoReporte === "Estado Cartera") {
        const { data: residentesData, error } = await supabase.from("residentes").select("*, pagos(*)");
        if (error) throw error;

        const enMora = [];
        const conSaldoAFavor = [];
        let totalEnMora = 0;
        let totalSaldoAFavor = 0;

        for (const r of residentesData) {
          const deuda = calcularValorDeudaHoy(r); // Función externa que calcula la deuda
          if (deuda > 0) {
            enMora.push({ ...r, deuda });
            totalEnMora += deuda;
          } else if (deuda < 0) {
            conSaldoAFavor.push({ ...r, deuda });
            totalSaldoAFavor += deuda;
          }
        }

        setDatosReporte({
          tipo: 'CARTERA',
          enMora: enMora.sort((a,b) => b.deuda - a.deuda),
          conSaldoAFavor: conSaldoAFavor.sort((a,b) => a.deuda - b.deuda),
          summary: {
            totalEnMora,
            unidadesEnMora: enMora.length,
            totalSaldoAFavor: Math.abs(totalSaldoAFavor),
            unidadesConSaldoAFavor: conSaldoAFavor.length,
          }
        });
      }
      // --- BLOQUE PARA REPORTE DE CENSO DE RESIDENTES ---
      else if (tipoReporte === "Directorio Residentes") {
        const { data: residentes, error } = await supabase.from("residentes").select("*").order('torre').order('apartamento');
        if (error) throw error;

        const totalUnidades = residentes.length;
        const unidadesOcupadas = residentes.filter(r => r.habita).length;

        setDatosReporte({
          tipo: 'CENSO',
          residentes: residentes || [],
          summary: {
            totalUnidades,
            unidadesOcupadas,
            unidadesVacias: totalUnidades - unidadesOcupadas,
          }
        });
      }
    } catch (e) {
      console.error("Error generando reporte:", e);
      alert("Hubo un error al generar el reporte: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // --- COMPONENTE JSX ---
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 font-sans text-slate-800">

      {/* SECCIÓN DE FILTROS Y CONTROLES */}
      <section className="no-print bg-slate-900 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 border border-white/5">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
            <PieChart size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-white font-black text-lg uppercase tracking-widest leading-none">Módulo de Auditoría</h2>
            <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-tighter">Generación de informes contables</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            className="flex-1 md:w-56 bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-sm font-black outline-none focus:ring-2 ring-emerald-500/50"
            value={tipoReporte}
            onChange={(e) => { setTipoReporte(e.target.value); setDatosReporte(null); }}
          >
            <optgroup label="FINANCIEROS" className="font-bold">
              <option value="General">Balance Consolidado</option>
              <option value="Solo Ingresos">Libro de Ingresos</option>
              <option value="Solo Egresos">Libro de Gastos</option>
            </optgroup>
            <optgroup label="ADMINISTRATIVOS" className="font-bold">
              <option value="Estado Cartera">Estado de Cartera (Mora)</option>
              <option value="Directorio Residentes">Censo de Residentes</option>
            </optgroup>
          </select>

          {(tipoReporte === "General" || tipoReporte.includes("Solo")) && (
            <input type="month" className="bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-sm font-black outline-none" onChange={(e) => setMes(e.target.value)} />
          )}

          <button
            onClick={generarReporte}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "GENERAR"}
          </button>
        </div>
      </section>

      {/* ÁREA DEL REPORTE VISIBLE */}
      {datosReporte && (
        <div className="bg-white border-2 border-slate-100 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">

          <div className="no-print p-6 border-b border-slate-100 flex justify-end">
            <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
              <Printer size={16} /> Imprimir o Guardar PDF
            </button>
          </div>

          <div ref={printRef} className="p-10 md:p-14 w-full bg-white text-slate-900">
            {/* --- CABECERA ESTÁNDAR PARA TODOS LOS REPORTES --- */}
            <header className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
              <div className="flex items-center gap-6">
                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                <div>
                  <h1 className="text-2xl font-black uppercase italic leading-none mb-1">Informe de Gestión Administrativa</h1>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">C.R. El Parque de las Flores • NIT 832.011.421-3</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Reporte</p>
                <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-black uppercase mb-2 inline-block">{tipoReporte}</div>
                <p className="text-xs font-bold text-slate-500 uppercase">{mes ? `Periodo: ${mes}` : `Corte a: ${new Date().toLocaleDateString()}`}</p>
              </div>
            </header>

            <main>
              {/* --- VISTA PARA REPORTES FINANCIEROS --- */}
              {datosReporte.tipo === 'FINANCIERO' && (
                <>
                  {/* KPIs Financieros */}
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                      <div className="flex items-center justify-between mb-4"><p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Recaudo Total</p><TrendingUp size={18} className="text-emerald-500" /></div>
                      <p className="text-4xl font-black tabular-nums">${datosReporte.summary.totalIngresos.toLocaleString()}</p>
                      <p className="mt-3 text-xs font-bold text-slate-400 uppercase">{datosReporte.summary.numIngresos} Transacciones</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                      <div className="flex items-center justify-between mb-4"><p className="text-xs font-black text-rose-600 uppercase tracking-widest">Total Gastos</p><TrendingDown size={18} className="text-rose-500" /></div>
                      <p className="text-4xl font-black tabular-nums">-${datosReporte.summary.totalEgresos.toLocaleString()}</p>
                       <p className="mt-3 text-xs font-bold text-slate-400 uppercase">{datosReporte.summary.numEgresos} Facturas Pagadas</p>
                    </div>
                    <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                      <div className="flex items-center justify-between mb-4"><p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Saldo Neto del Periodo</p><Scale size={18} className="text-emerald-400" /></div>
                      <p className="text-4xl font-black tabular-nums">${datosReporte.summary.saldoNeto.toLocaleString()}</p>
                      <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Utilidad Operativa</p>
                    </div>
                  </section>
                  
                  {/* Desglose de Ingresos - SOLICITADO */}
                  {(tipoReporte === "General" || tipoReporte === "Solo Ingresos") && (
                    <section className="mb-12">
                       <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-3"><div className="w-2 h-5 bg-emerald-500 rounded-full"></div>Desglose de Ingresos del Periodo</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                            <Banknote size={32} className="text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-emerald-800 font-bold uppercase">Ingreso Total</p>
                                <p className="text-2xl font-black text-emerald-900">${datosReporte.summary.totalIngresos.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-5 bg-sky-50 border border-sky-200 rounded-2xl">
                            <Landmark size={32} className="text-sky-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-sky-800 font-bold uppercase">Ingresos por Banco</p>
                                <p className="text-2xl font-black text-sky-900">${datosReporte.summary.ingresosBanco.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-5 bg-lime-50 border border-lime-200 rounded-2xl">
                            <Wallet size={32} className="text-lime-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-lime-800 font-bold uppercase">Ingresos en Efectivo</p>
                                <p className="text-2xl font-black text-lime-900">${datosReporte.summary.ingresosEfectivo.toLocaleString()}</p>
                            </div>
                          </div>
                       </div>
                    </section>
                  )}

                  {/* Tabla de Ingresos */}
                  {(tipoReporte === "General" || tipoReporte === "Solo Ingresos") && (
                    <section className="mb-12">
                      <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-3"><div className="w-2 h-5 bg-emerald-500 rounded-full"></div>Relación Detallada de Ingresos</h3>
                      <table>
                        <thead><tr><th>Recibo</th><th>Fecha</th><th>Unidad</th><th>Titular</th><th>Concepto</th><th className="text-right">Monto</th></tr></thead>
                        <tbody>
                          {datosReporte.ingresos.map(i => (<tr key={i.id}><td>RC-{i.numero_recibo}</td><td>{i.fecha_pago}</td><td>{i.unidad}</td><td>{i.residentes?.nombre}</td><td>{i.concepto_texto?.split("||")[0]}</td><td className="text-right font-bold text-emerald-700">${Number(i.monto_total).toLocaleString()}</td></tr>))}
                          {datosReporte.ingresos.length === 0 && <tr><td colSpan={6} className="text-center py-10">No hay ingresos en este periodo.</td></tr>}
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* Tabla de Egresos */}
                  {(tipoReporte === "General" || tipoReporte === "Solo Egresos") && (
                     <section className="mb-12">
                      <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-3"><div className="w-2 h-5 bg-rose-500 rounded-full"></div>Relación Detallada de Egresos</h3>
                      <table>
                        <thead><tr><th>Comprobante</th><th>Fecha</th><th>Beneficiario</th><th>Concepto</th><th className="text-right">Monto</th></tr></thead>
                        <tbody>
                          {datosReporte.egresos.map(e => (<tr key={e.id}><td>CE-{e.recibo_n}</td><td>{e.fecha}</td><td>{e.pagado_a}</td><td>{e.concepto}</td><td className="text-right font-bold text-rose-700">${Number(e.monto).toLocaleString()}</td></tr>))}
                          {datosReporte.egresos.length === 0 && <tr><td colSpan={5} className="text-center py-10">No hay egresos en este periodo.</td></tr>}
                        </tbody>
                      </table>
                    </section>
                  )}
                </>
              )}

              {/* --- VISTA PARA REPORTE DE CARTERA --- */}
              {datosReporte.tipo === 'CARTERA' && (
                <>
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl">
                      <div className="flex items-center justify-between mb-4"><p className="text-xs font-black text-rose-600 uppercase tracking-widest">Cartera Total en Mora</p><UserX size={18} className="text-rose-500" /></div>
                      <p className="text-4xl font-black text-rose-900 tabular-nums">${datosReporte.summary.totalEnMora.toLocaleString()}</p>
                      <p className="mt-3 text-xs font-bold text-slate-500 uppercase">{datosReporte.summary.unidadesEnMora} Unidades en Mora</p>
                    </div>
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl">
                      <div className="flex items-center justify-between mb-4"><p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total Saldos a Favor</p><UserCheck size={18} className="text-emerald-500" /></div>
                      <p className="text-4xl font-black text-emerald-900 tabular-nums">${datosReporte.summary.totalSaldoAFavor.toLocaleString()}</p>
                      <p className="mt-3 text-xs font-bold text-slate-500 uppercase">{datosReporte.summary.unidadesConSaldoAFavor} Unidades con Anticipo</p>
                    </div>
                  </section>
                  
                  <section className="mb-12">
                     <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-3"><div className="w-2 h-5 bg-rose-500 rounded-full"></div>Unidades en Mora</h3>
                     <table>
                        <thead><tr><th>Unidad</th><th>Titular</th><th>Teléfono</th><th className="text-right">Saldo Deudor</th></tr></thead>
                        <tbody>
                          {datosReporte.enMora.map(r => (<tr key={r.id}><td>T{r.torre.slice(-1)}-{r.apartamento}</td><td className="uppercase">{r.nombre}</td><td>{r.telefono || 'N/A'}</td><td className="text-right font-bold text-rose-700 tabular-nums">${r.deuda.toLocaleString()}</td></tr>))}
                          {datosReporte.enMora.length === 0 && <tr><td colSpan={4} className="text-center py-10">No hay unidades en mora. ¡Excelente gestión!</td></tr>}
                        </tbody>
                     </table>
                  </section>
                  
                   <section>
                     <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-3"><div className="w-2 h-5 bg-emerald-500 rounded-full"></div>Unidades con Saldo a Favor (Anticipos)</h3>
                     <table>
                        <thead><tr><th>Unidad</th><th>Titular</th><th>Teléfono</th><th className="text-right">Saldo a Favor</th></tr></thead>
                        <tbody>
                          {datosReporte.conSaldoAFavor.map(r => (<tr key={r.id}><td>T{r.torre.slice(-1)}-{r.apartamento}</td><td className="uppercase">{r.nombre}</td><td>{r.telefono || 'N/A'}</td><td className="text-right font-bold text-emerald-700 tabular-nums">${Math.abs(r.deuda).toLocaleString()}</td></tr>))}
                          {datosReporte.conSaldoAFavor.length === 0 && <tr><td colSpan={4} className="text-center py-10">Ninguna unidad presenta saldo a favor.</td></tr>}
                        </tbody>
                     </table>
                  </section>
                </>
              )}

              {/* --- VISTA PARA REPORTE DE CENSO --- */}
              {datosReporte.tipo === 'CENSO' && (
                <>
                   <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <Home size={32} className="text-slate-600" />
                      <div><p className="text-xs text-slate-800 font-bold uppercase">Total Unidades</p><p className="text-2xl font-black text-slate-900">{datosReporte.summary.totalUnidades}</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <UserCheck size={32} className="text-slate-600" />
                      <div><p className="text-xs text-slate-800 font-bold uppercase">Unidades Ocupadas</p><p className="text-2xl font-black text-slate-900">{datosReporte.summary.unidadesOcupadas}</p></div>
                    </div>
                     <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <UserX size={32} className="text-slate-600" />
                      <div><p className="text-xs text-slate-800 font-bold uppercase">Unidades Vacías</p><p className="text-2xl font-black text-slate-900">{datosReporte.summary.unidadesVacias}</p></div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-black uppercase text-slate-800 mb-4 flex items-center gap-3"><div className="w-2 h-5 bg-sky-500 rounded-full"></div>Directorio General de Residentes</h3>
                    <table>
                      <thead><tr><th>Unidad</th><th>Titular</th><th>Cédula</th><th>Teléfono</th><th>Email</th><th>Estado</th></tr></thead>
                      <tbody>
                        {datosReporte.residentes.map(r => (
                          <tr key={r.id}>
                            <td className="font-bold">T{r.torre.slice(-1)}-{r.apartamento}</td>
                            <td className="uppercase">{r.nombre}</td>
                            <td>{r.cedula || 'N/A'}</td>
                            <td>{r.telefono || 'N/A'}</td>
                            <td className="lowercase">{r.email || 'N/A'}</td>
                            <td><span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${r.habita ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>{r.habita ? 'Residente' : 'Vacío'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </>
              )}
            </main>

            {/* --- PIE DE PÁGINA ESTÁNDAR PARA TODOS LOS REPORTES --- */}
            <footer className="mt-32 pt-10 border-t-2 border-slate-900 grid grid-cols-2 gap-24">
              <div className="border-t-2 border-slate-400 pt-4 text-center"><p className="text-sm font-black uppercase text-slate-900">Firma Administración / Tesorería</p><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Responsable del Recaudo</p></div>
              <div className="border-t-2 border-slate-400 pt-4 text-center"><p className="text-sm font-black uppercase text-slate-900">Firma Consejo de Admón / Revisoría</p><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Función de Control Interno</p></div>
            </footer>
             <div className="mt-20 text-center text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">Fin del Reporte</div>
          </div>
        </div>
      )}
    </div>
  );
}