"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import { Printer, Loader2, PieChart } from "lucide-react";
import BalanceHistorial from "./BalanceHistorial";

interface ReporteFinancieroData {
  tipo: 'FINANCIERO';
  ingresos: any[];
  egresos: any[];
  summary: {
    totalIngresos: number; totalEgresos: number; saldoNeto: number;
    ingresosBanco: number; ingresosEfectivo: number;
    ingresosEfectivoBruto: number; numIngresos: number; numEgresos: number;
  };
}
interface ReporteCarteraData {
  tipo: 'CARTERA';
  enMora: any[];
  summary: { totalEnMora: number; unidadesEnMora: number; };
}
interface ReporteCensoData { tipo: 'CENSO'; residentes: any[]; }
type ReporteData = ReporteFinancieroData | ReporteCarteraData | ReporteCensoData | null;

export default function Reportes() {
  const [tipoReporte, setTipoReporte] = useState("General");
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [datosReporte, setDatosReporte] = useState<ReporteData>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map(s => s.outerHTML).join("");
    doc.write(`<html><head><title>Reporte Administrativo</title>${styles}
      <style>
        @page { size: letter; margin: 0; }
        body { margin: 0; padding: 0; background: white !important; }
        .print-page { width: 216mm; padding: 15mm; box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5px; font-family: sans-serif; }
        th { background: #f8fafc !important; padding: 8px; text-align: left; border-bottom: 2px solid #1e293b; color: #475569; font-weight: 800; text-transform: uppercase; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #1e293b; }
        .no-print { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      </style>
    </head><body><div class="print-page">${content.innerHTML}</div></body>
    <script>window.onload=()=>{window.print();setTimeout(()=>document.body.removeChild(window.frameElement),100);};<\/script></html>`);
    doc.close();
  };

  async function generarReporte() {
    setLoading(true);
    setDatosReporte(null);
    const TORRES_REQUERIDAS = ['Torre 5', 'Torre 6', 'Torre 7', 'Torre 8'];
    try {
      if (tipoReporte === "Solo Ingresos" || tipoReporte === "Solo Egresos") {
        if (!mes) return alert("Selecciona un mes");
        const [anio, mesNum] = mes.split("-").map(Number);
        const primerDia = `${mes}-01`;
        const ultimoDia = `${mes}-${new Date(anio, mesNum, 0).getDate().toString().padStart(2, '0')}`;
        const [resIng, resEgr] = await Promise.all([
          supabase.from("pagos").select("*, residentes(nombre)").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia).order('fecha_pago'),
          supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order('fecha')
        ]);
        const ingresos = resIng.data || [];
        const egresos = resEgr.data || [];
        const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto_total), 0);
        const totalEgresos = egresos.reduce((s, e) => s + Number(e.monto), 0);
        const ingresosBanco = ingresos.filter(i => i.metodo_pago === 'Transferencia').reduce((s, i) => s + Number(i.monto_total), 0);
        const ingresosEfectivoBruto = ingresos.filter(i => i.metodo_pago === 'Efectivo').reduce((s, i) => s + Number(i.monto_total), 0);
        setDatosReporte({
          tipo: 'FINANCIERO', ingresos, egresos,
          summary: {
            totalIngresos, totalEgresos, saldoNeto: totalIngresos - totalEgresos,
            ingresosBanco, ingresosEfectivo: ingresosEfectivoBruto - totalEgresos,
            ingresosEfectivoBruto, numIngresos: ingresos.length, numEgresos: egresos.length
          }
        });
      } else if (tipoReporte === "Estado Cartera") {
        const [resRes, deudasRes] = await Promise.all([
          supabase.from("residentes").select("*").in('torre', TORRES_REQUERIDAS),
          supabase.from("deudas_residentes").select("*, causaciones_globales(mes_causado, tipo_cobro)").neq("saldo_pendiente", 0)
        ]);
        const enMora = (resRes.data || []).map(r => {
          const saldoReal = (deudasRes.data || []).filter(d => d.residente_id === r.id).reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
          return { ...r, saldoReal };
        }).filter(r => r.saldoReal > 0).sort((a, b) => a.torre.localeCompare(b.torre) || parseInt(a.apartamento) - parseInt(b.apartamento));
        setDatosReporte({ tipo: 'CARTERA', enMora, summary: { totalEnMora: enMora.reduce((acc, r) => acc + r.saldoReal, 0), unidadesEnMora: enMora.length } });
      } else if (tipoReporte === "Directorio Residentes") {
        const { data } = await supabase.from("residentes").select("*").in('torre', TORRES_REQUERIDAS).order('torre').order('apartamento');
        setDatosReporte({ tipo: 'CENSO', residentes: data || [] });
      }
    } catch (e) { alert("Error: " + (e as Error).message); }
    finally { setLoading(false); }
  }

  const needsMes = tipoReporte.includes("Solo");
  const esBalanceConsolidado = tipoReporte === "General";

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 font-sans text-slate-800 px-0">

      {/* ── PANEL DE CONTROLES ───────────────────────────────── */}
      <section className="no-print bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl">

        {/* Título */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-900 shadow-lg flex-shrink-0">
            <PieChart size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-white font-black text-xs sm:text-sm uppercase tracking-widest leading-none">
              Auditoría Flores
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase mt-0.5 tracking-tighter">
              Gestión de Informes
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="flex-1 bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-xs font-black outline-none focus:ring-2 ring-emerald-500/50"
            value={tipoReporte}
            onChange={(e) => { setTipoReporte(e.target.value); setDatosReporte(null); }}
          >
            <option value="General">Balance Consolidado</option>
            <option value="Solo Ingresos">Libro de Ingresos</option>
            <option value="Solo Egresos">Libro de Gastos</option>
            <option value="Estado Cartera">Estado de Cartera</option>
            <option value="Directorio Residentes">Censo Residentes</option>
          </select>

          {needsMes && (
            <input
              type="month"
              className="sm:w-44 bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-xs font-black outline-none focus:ring-2 ring-emerald-500/50"
              onChange={(e) => setMes(e.target.value)}
            />
          )}

          {/* Balance Consolidado no necesita botón Generar — lo maneja BalanceHistorial */}
          {!esBalanceConsolidado && (
            <button
              onClick={generarReporte}
              disabled={loading}
              className="bg-emerald-500 text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "GENERAR"}
            </button>
          )}
        </div>
      </section>

      {/* ── BALANCE CONSOLIDADO — componente completo ── */}
      {esBalanceConsolidado && (
        <BalanceHistorial />
      )}

      {/* ── VISTA PREVIA otros reportes ─────────────────────── */}
      {!esBalanceConsolidado && datosReporte && (
        <div className="flex justify-center">
          <style jsx>{`
            .report-content table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; font-family: sans-serif; }
            .report-content th { background: #f8fafc; padding: 8px; text-align: left; border-bottom: 2px solid #1e293b; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 9px; }
            .report-content td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; color: #1e293b; font-size: 10px; }
          `}</style>

          <div className="w-full max-w-[216mm] bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">

            {/* Botón imprimir */}
            <div className="no-print p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex justify-end">
              <button
                onClick={handlePrint}
                className="bg-slate-900 text-white px-4 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
              >
                <Printer size={13} /> IMPRIMIR PDF
              </button>
            </div>

            {/* Contenido del reporte */}
            <div ref={printRef} className="report-content bg-white text-slate-900 p-4 sm:p-8 md:p-12 min-h-[200px] md:min-h-[279mm]">

              {/* ── ENCABEZADO ── */}
              <header className="mb-6 sm:mb-8 pb-4 border-b-2 border-slate-900">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 sm:w-14 sm:h-14 object-contain flex-shrink-0" />
                    <div>
                      <h1 className="text-xs sm:text-sm font-black uppercase leading-tight tracking-tight">
                        AGRUPACIÓN RESIDENCIAL EL PARQUE DE LAS FLORES
                      </h1>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                        NIT 832.011.421-3 • Soacha, Cundinamarca
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase mb-1 inline-block">
                      {tipoReporte}
                    </span>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">
                      {mes ? `Periodo: ${mes}` : `Fecha: ${new Date().toLocaleDateString('es-CO')}`}
                    </p>
                  </div>
                </div>
              </header>

              <main>
                {/* ── REPORTE FINANCIERO (Solo Ingresos / Solo Egresos) ── */}
                {datosReporte.tipo === 'FINANCIERO' && (
                  <>
                    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                      {tipoReporte === "Solo Ingresos" && (
                        <div className="p-3 sm:p-4 border border-slate-200 rounded-lg bg-white">
                          <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recaudo Total (Bruto)</p>
                          <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                            ${datosReporte.summary.totalIngresos.toLocaleString()}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                            <div className="flex justify-between text-[8px] sm:text-[9px] font-bold">
                              <span className="text-slate-400 uppercase">En Bancos:</span>
                              <span className="text-emerald-600">${datosReporte.summary.ingresosBanco.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[8px] sm:text-[9px] font-bold">
                              <span className="text-slate-400 uppercase">En Efectivo:</span>
                              <span className="text-emerald-600">${datosReporte.summary.ingresosEfectivoBruto.toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-[7px] text-slate-300 uppercase mt-1 text-right">
                            {datosReporte.summary.numIngresos} transacciones
                          </p>
                        </div>
                      )}
                      {tipoReporte === "Solo Egresos" && (
                        <div className="p-3 sm:p-4 border border-slate-200 rounded-lg bg-white">
                          <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gastos Totales</p>
                          <p className="text-lg sm:text-xl font-black text-rose-600 tabular-nums">
                            -${datosReporte.summary.totalEgresos.toLocaleString()}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-[7px] text-slate-300 uppercase mt-1 text-right italic">
                              {datosReporte.summary.numEgresos} facturas
                            </p>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Tabla ingresos en efectivo */}
                    {tipoReporte === "Solo Ingresos" && (
                      <section className="mb-6 sm:mb-10">
                        <h3 className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 mb-2 border-b pb-1">
                          Relación de Ingresos <span className="text-slate-400 font-normal italic">(Caja en Efectivo)</span>
                        </h3>
                        <div className="overflow-x-auto -mx-1">
                          <table className="min-w-[480px] sm:min-w-0">
                            <thead>
                              <tr><th>Recibo</th><th>Unidad</th><th>Titular</th><th>Concepto</th><th>Medio</th><th className="text-right">Monto</th></tr>
                            </thead>
                            <tbody>
                              {datosReporte.ingresos.filter(i => i.metodo_pago === 'Efectivo').map(i => (
                                <tr key={i.id}>
                                  <td>RC-{i.numero_recibo}</td>
                                  <td className="font-bold">{i.unidad}</td>
                                  <td className="uppercase">{i.residentes?.nombre}</td>
                                  <td className="uppercase text-slate-400">{i.concepto_texto?.split("||")[0].split("|")[0]}</td>
                                  <td className="text-[8px] font-bold uppercase">{i.metodo_pago}</td>
                                  <td className="text-right font-black text-emerald-700">${Number(i.monto_total).toLocaleString()}</td>
                                </tr>
                              ))}
                              {datosReporte.ingresos.filter(i => i.metodo_pago === 'Efectivo').length === 0 && (
                                <tr><td colSpan={6} className="text-center py-4 text-slate-400 italic text-xs">No hay ingresos en efectivo registrados.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* Tabla egresos */}
                    {tipoReporte === "Solo Egresos" && (
                      <section className="mb-6 sm:mb-10">
                        <h3 className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 mb-2 border-b pb-1">Relación de Gastos</h3>
                        <div className="overflow-x-auto -mx-1">
                          <table className="min-w-[420px] sm:min-w-0">
                            <thead>
                              <tr><th>Gasto No.</th><th>Fecha</th><th>Tercero</th><th>Descripción</th><th className="text-right">Monto</th></tr>
                            </thead>
                            <tbody>
                              {datosReporte.egresos.map(e => (
                                <tr key={e.id}>
                                  <td>CE-{e.recibo_n}</td>
                                  <td>{e.fecha}</td>
                                  <td className="font-bold uppercase">{e.pagado_a}</td>
                                  <td className="italic text-slate-400 uppercase">{e.concepto.split("||")[0].split("|")[0]}</td>
                                  <td className="text-right font-black text-rose-700">${Number(e.monto).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </>
                )}

                {/* ── CARTERA ── */}
                {datosReporte.tipo === 'CARTERA' && (
                  <section>
                    <div className="bg-rose-50 border border-rose-200 p-4 sm:p-6 rounded-xl mb-6 sm:mb-8 flex justify-between items-center gap-3">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-black text-rose-600 uppercase mb-1">Cartera Morosa Global</p>
                        <p className="text-xl sm:text-3xl font-black text-rose-900 tabular-nums">
                          ${datosReporte.summary.totalEnMora.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] sm:text-[10px] font-bold text-rose-400 uppercase">Unidades en Mora</p>
                        <p className="text-xl sm:text-2xl font-black text-rose-900">{datosReporte.summary.unidadesEnMora}</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto -mx-1">
                      <table className="min-w-[360px] sm:min-w-0">
                        <thead><tr><th>Unidad</th><th>Titular</th><th>Teléfono</th><th className="text-right">Deuda</th></tr></thead>
                        <tbody>
                          {datosReporte.enMora.map(r => (
                            <tr key={r.id}>
                              <td className="font-bold">T{r.torre.slice(-1)}-{r.apartamento}</td>
                              <td className="uppercase">{r.nombre}</td>
                              <td>{r.celular || '--'}</td>
                              <td className="text-right font-black text-rose-700">${r.saldoReal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* ── CENSO ── */}
                {datosReporte.tipo === 'CENSO' && (
                  <section>
                    <h3 className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 mb-2 border-b pb-1">Directorio de Residentes</h3>
                    <div className="overflow-x-auto -mx-1">
                      <table className="min-w-[360px] sm:min-w-0">
                        <thead><tr><th>Unidad</th><th>Nombre</th><th>Celular</th><th>Activos</th></tr></thead>
                        <tbody>
                          {datosReporte.residentes.map(r => (
                            <tr key={r.id}>
                              <td className="font-bold">T{r.torre.slice(-1)}-{r.apartamento}</td>
                              <td className="uppercase">{r.nombre}</td>
                              <td>{r.celular || '--'}</td>
                              <td>
                                <span className="flex gap-2 text-[9px]">
                                  <span>Car: <b>{r.carros}</b></span>
                                  <span>Mot: <b>{r.motos}</b></span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </main>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}