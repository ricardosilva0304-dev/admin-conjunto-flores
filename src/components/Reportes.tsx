"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import { Printer, Loader2, PieChart, Landmark, Banknote, ArrowUpRight, TrendingDown } from "lucide-react";

interface ReporteFinancieroData {
  tipo: 'FINANCIERO';
  ingresos: any[];
  egresos: any[];
  summary: {
    totalIngresos: number; totalEgresos: number; saldoNeto: number;
    ingresosBanco: number; ingresosEfectivo: number;
    ingresosEfectivoBruto: number; numIngresos: number; numEgresos: number;
    efectivoAcumulado: number;
  };
}
interface ReporteCarteraData {
  tipo: 'CARTERA';
  enMora: any[];
  summary: { totalEnMora: number; unidadesEnMora: number; };
}
interface ReporteCensoData { tipo: 'CENSO'; residentes: any[]; }
interface ReporteVehiculosData {
  tipo: 'VEHICULOS';
  carros: any[];
  motos: any[];
  bicis: any[];
  totalCarros: number;
  totalMotos: number;
  totalBicis: number;
}
type ReporteData = ReporteFinancieroData | ReporteCarteraData | ReporteCensoData | ReporteVehiculosData | null;

const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

function periodoLabel(mes: string) {
  if (!mes) return "";
  const [anio, m] = mes.split("-");
  return `${MESES[parseInt(m) - 1]} ${anio}`;
}

export default function Reportes() {
  const [tipoReporte, setTipoReporte] = useState("General");
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [datosReporte, setDatosReporte] = useState<ReporteData>(null);

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString("es-CO")}`;
  const neg = (n: number) => n < 0;

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
        @page { size: letter; margin: 12mm 15mm; }
        body { margin: 0; padding: 0; background: white !important; font-family: sans-serif; }
        .no-print { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      </style>
    </head><body>${content.innerHTML}</body>
    <script>window.onload=()=>{window.print();setTimeout(()=>document.body.removeChild(window.frameElement),100);};<\/script></html>`);
    doc.close();
  };

  async function generarReporte() {
    setLoading(true);
    setDatosReporte(null);
    const TORRES_REQUERIDAS = ['Torre 5', 'Torre 6', 'Torre 7', 'Torre 8'];
    try {
      if (tipoReporte === "General" || tipoReporte === "Solo Ingresos" || tipoReporte === "Solo Egresos") {
        if (!mes) { setLoading(false); return alert("Selecciona un mes"); }
        const [anio, mesNum] = mes.split("-").map(Number);
        const primerDia = `${mes}-01`;
        const ultimoDia = `${mes}-${new Date(anio, mesNum, 0).getDate().toString().padStart(2, '0')}`;

        const [resIng, resEgr, pagosAnteriores, egresosAnteriores] = await Promise.all([
          supabase.from("pagos").select("*, residentes(nombre)").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia).order('fecha_pago'),
          supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order('fecha'),
          supabase.from("pagos").select("monto_total").eq("metodo_pago", "Efectivo").lt("fecha_pago", primerDia),
          supabase.from("egresos").select("monto").lt("fecha", primerDia),
        ]);

        const ingresos = resIng.data || [];
        const egresos = resEgr.data || [];
        const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto_total), 0);
        const totalEgresos = egresos.reduce((s, e) => s + Number(e.monto), 0);
        const ingresosBanco = ingresos.filter(i => i.metodo_pago === 'Transferencia').reduce((s, i) => s + Number(i.monto_total), 0);
        const ingresosEfectivoBruto = ingresos.filter(i => i.metodo_pago === 'Efectivo').reduce((s, i) => s + Number(i.monto_total), 0);
        const efectivoAntAnterior =
          (pagosAnteriores.data?.reduce((s, p) => s + Number(p.monto_total), 0) || 0)
          - (egresosAnteriores.data?.reduce((s, e) => s + Number(e.monto), 0) || 0);
        const efectivoAcumulado = (ingresosEfectivoBruto - totalEgresos) + efectivoAntAnterior;

        setDatosReporte({
          tipo: 'FINANCIERO', ingresos, egresos,
          summary: {
            totalIngresos, totalEgresos, saldoNeto: totalIngresos - totalEgresos,
            ingresosBanco, ingresosEfectivo: ingresosEfectivoBruto - totalEgresos,
            ingresosEfectivoBruto, numIngresos: ingresos.length, numEgresos: egresos.length,
            efectivoAcumulado,
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
      } else if (tipoReporte === "Vehículos") {
        const ORDEN_TORRES: Record<string, number> = { "Torre 5": 0, "Torre 6": 1, "Torre 7": 2, "Torre 8": 3, "Torre 1": 4 };
        const { data } = await supabase.from("residentes").select("*").order('torre').order('apartamento');
        const todos = (data || []).sort((a, b) => {
          const oa = ORDEN_TORRES[a.torre] ?? 9;
          const ob = ORDEN_TORRES[b.torre] ?? 9;
          if (oa !== ob) return oa - ob;
          return parseInt(a.apartamento) - parseInt(b.apartamento);
        });
        // Expandir: una fila por vehículo
        const carros: any[] = [];
        const motos: any[] = [];
        const bicis: any[] = [];
        todos.forEach(r => {
          const unidad = `T${r.torre.slice(-1)}-${r.apartamento}`;
          for (let i = 0; i < (r.carros || 0); i++) carros.push({ ...r, unidad, vehiculo_num: i + 1 });
          for (let i = 0; i < (r.motos || 0); i++) motos.push({ ...r, unidad, vehiculo_num: i + 1 });
          for (let i = 0; i < (r.bicis || 0); i++) bicis.push({ ...r, unidad, vehiculo_num: i + 1 });
        });
        setDatosReporte({
          tipo: 'VEHICULOS', carros, motos, bicis,
          totalCarros: carros.length, totalMotos: motos.length, totalBicis: bicis.length,
        });
      }
    } catch (e) { alert("Error: " + (e as Error).message); }
    finally { setLoading(false); }
  }

  const needsMes = tipoReporte === "General" || tipoReporte.includes("Solo");

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-24 font-sans text-slate-800 px-0">

      {/* ── PANEL DE CONTROLES ── */}
      <section className="no-print bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-900 shadow-lg flex-shrink-0">
            <PieChart size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-white font-black text-xs sm:text-sm uppercase tracking-widest leading-none">Auditoría Flores</h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase mt-0.5 tracking-tighter">Gestión de Informes</p>
          </div>
        </div>
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
            <option value="Vehículos">Reporte de Vehículos</option>
          </select>
          {needsMes && (
            <input type="month"
              className="sm:w-44 bg-slate-800 border border-white/10 text-white p-3 rounded-xl text-xs font-black outline-none focus:ring-2 ring-emerald-500/50"
              onChange={(e) => { setMes(e.target.value); setDatosReporte(null); }}
            />
          )}
          <button onClick={generarReporte} disabled={loading}
            className="bg-emerald-500 text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "GENERAR"}
          </button>
        </div>
      </section>

      {/* ── RESULTADO ── */}
      {datosReporte && (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100">

            {/* Botón imprimir */}
            <div className="no-print px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-end">
              <button onClick={handlePrint}
                className="bg-slate-900 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
                <Printer size={13} /> IMPRIMIR PDF
              </button>
            </div>

            {/* ── CONTENIDO IMPRIMIBLE ── */}
            <div ref={printRef} className="bg-white text-slate-900 p-6 sm:p-10">

              {/* Encabezado */}
              <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-5 border-b-2 border-slate-900 mb-8">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0" />
                  <div>
                    <h1 className="text-sm font-black uppercase leading-tight tracking-tight text-slate-900">
                      Agrupación Res. El Parque de las Flores
                    </h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      NIT 832.011.421-3 · Soacha, Cundinamarca
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest inline-block mb-1">
                    {tipoReporte === "General" ? "Balance Consolidado"
                      : tipoReporte === "Solo Ingresos" ? "Libro de Ingresos"
                        : tipoReporte === "Solo Egresos" ? "Libro de Gastos"
                          : tipoReporte}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Periodo: {periodoLabel(mes)}
                  </p>
                </div>
              </header>

              {/* ── BALANCE CONSOLIDADO y SOLO INGRESOS: tarjetas estilo BalanceHistorial ── */}
              {datosReporte.tipo === 'FINANCIERO' && (tipoReporte === "General" || tipoReporte === "Solo Ingresos") && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    {/* Efectivo en Caja */}
                    <div className={`sm:col-span-2 rounded-2xl p-6 flex flex-col justify-between border relative overflow-hidden
                      ${neg(datosReporte.summary.efectivoAcumulado) ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div className={`absolute -bottom-10 -right-10 w-44 h-44 rounded-full opacity-10
                        ${neg(datosReporte.summary.efectivoAcumulado) ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-2 rounded-xl ${neg(datosReporte.summary.efectivoAcumulado) ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                            <Banknote size={18} className={neg(datosReporte.summary.efectivoAcumulado) ? 'text-rose-500' : 'text-emerald-600'} />
                          </div>
                          <div>
                            <p className={`text-[10px] font-black tracking-[0.2em] uppercase
                              ${neg(datosReporte.summary.efectivoAcumulado) ? 'text-rose-400' : 'text-emerald-600'}`}>
                              Efectivo en Caja
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Dinero físico acumulado</p>
                          </div>
                        </div>
                        <p className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight leading-none mb-3
                          ${neg(datosReporte.summary.efectivoAcumulado) ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {neg(datosReporte.summary.efectivoAcumulado) ? "−" : ""}{fmt(datosReporte.summary.efectivoAcumulado)}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ↑ Ingresó&nbsp;<span className="text-slate-700 font-black">{fmt(datosReporte.summary.ingresosEfectivoBruto)}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ↓ Gastos&nbsp;<span className="text-rose-500 font-black">{fmt(datosReporte.summary.totalEgresos)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Columna derecha: Bancos + Bruto */}
                    <div className="flex flex-row sm:flex-col gap-4">
                      <div className="flex-1 bg-white rounded-2xl p-5 flex flex-col justify-between border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="bg-blue-50 p-1.5 rounded-lg">
                            <Landmark size={14} className="text-blue-500" />
                          </div>
                          <span className="text-[9px] font-black tracking-[0.18em] text-slate-400 uppercase">Bancos</span>
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-900 tabular-nums">{fmt(datosReporte.summary.ingresosBanco)}</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Transferencias</p>
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-900 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black tracking-[0.18em] text-slate-400 uppercase">Bruto total</span>
                            <ArrowUpRight size={13} className="text-emerald-400" />
                          </div>
                          <p className="text-xl font-black text-white tabular-nums">{fmt(datosReporte.summary.totalIngresos)}</p>
                          <p className="text-[9px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">Ingresos del mes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla ingresos efectivo */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Ingresos en Efectivo del Periodo
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Recibo</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Unidad</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Titular</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Concepto</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosReporte.ingresos.filter(i => i.metodo_pago === 'Efectivo').length === 0 ? (
                          <tr><td colSpan={5} className="py-4 text-center text-[10px] text-slate-300 italic">Sin ingresos en efectivo en este periodo</td></tr>
                        ) : (
                          datosReporte.ingresos.filter(i => i.metodo_pago === 'Efectivo').map((i, idx) => (
                            <tr key={i.id} className={`border-b border-slate-50 ${idx % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                              <td className="py-2 text-[10px] font-bold text-slate-500">RC-{i.numero_recibo}</td>
                              <td className="py-2 text-[10px] font-black text-slate-800">{i.unidad}</td>
                              <td className="py-2 text-[10px] uppercase text-slate-600">{i.residentes?.nombre}</td>
                              <td className="py-2 text-[10px] text-slate-400 uppercase">{i.concepto_texto?.split("||")[0].split("|")[0]}</td>
                              <td className="py-2 text-[10px] font-black text-emerald-600 tabular-nums text-right">{fmt(Number(i.monto_total))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200">
                          <td colSpan={4} className="pt-2 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right pr-4">Subtotal Efectivo:</td>
                          <td className="pt-2 text-[11px] font-black text-emerald-700 tabular-nums text-right">
                            {fmt(datosReporte.ingresos.filter(i => i.metodo_pago === 'Efectivo').reduce((s, i) => s + Number(i.monto_total), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tabla egresos */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Egresos del Periodo
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Gasto No.</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Tercero</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Descripción</th>
                          <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosReporte.egresos.length === 0 ? (
                          <tr><td colSpan={5} className="py-4 text-center text-[10px] text-slate-300 italic">Sin egresos en este periodo</td></tr>
                        ) : (
                          datosReporte.egresos.map((e, idx) => (
                            <tr key={e.id} className={`border-b border-slate-50 ${idx % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                              <td className="py-2 text-[10px] font-bold text-slate-500">CE-{e.recibo_n}</td>
                              <td className="py-2 text-[10px] text-slate-400">{e.fecha}</td>
                              <td className="py-2 text-[10px] font-black text-slate-800 uppercase">{e.pagado_a}</td>
                              <td className="py-2 text-[10px] text-slate-400 italic uppercase">{e.concepto}</td>
                              <td className="py-2 text-[10px] font-black text-rose-600 tabular-nums text-right">{fmt(Number(e.monto))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200">
                          <td colSpan={4} className="pt-2 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right pr-4">Total Egresos:</td>
                          <td className="pt-2 text-[11px] font-black text-rose-700 tabular-nums text-right">{fmt(datosReporte.summary.totalEgresos)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Pie */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Documento de uso interno · No es una factura legal
                    </p>
                    <div className="text-right">
                      <div className="w-36 border-t border-slate-400 mb-1 ml-auto" />
                      <p className="text-[10px] font-black uppercase text-slate-800">Administración</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Conjunto Flores</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SOLO EGRESOS: tarjeta resumen + tabla ── */}
              {datosReporte.tipo === 'FINANCIERO' && tipoReporte === "Solo Egresos" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-rose-100 p-2 rounded-xl">
                          <TrendingDown size={18} className="text-rose-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-rose-500">Gastos del Periodo</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Total egresos registrados</p>
                        </div>
                      </div>
                      <p className="text-4xl font-black text-rose-700 tabular-nums mb-2">{fmt(datosReporte.summary.totalEgresos)}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{datosReporte.summary.numEgresos} facturas registradas</p>
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Gasto No.</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Fecha</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Tercero</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Descripción</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosReporte.egresos.map((e, i) => (
                        <tr key={e.id} className={`border-b border-slate-50 ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                          <td className="py-2.5 text-[10px] font-bold text-slate-500">CE-{e.recibo_n}</td>
                          <td className="py-2.5 text-[10px] text-slate-400">{e.fecha}</td>
                          <td className="py-2.5 text-[10px] font-black text-slate-800 uppercase">{e.pagado_a}</td>
                          <td className="py-2.5 text-[10px] text-slate-400 italic uppercase">{e.concepto}</td>
                          <td className="py-2.5 text-[10px] font-black text-rose-600 tabular-nums text-right">{fmt(Number(e.monto))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900">
                        <td colSpan={4} className="pt-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right pr-4">Total Egresos:</td>
                        <td className="pt-3 text-sm font-black text-rose-700 tabular-nums text-right">{fmt(datosReporte.summary.totalEgresos)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Documento de uso interno · No es una factura legal</p>
                    <div className="text-right">
                      <div className="w-36 border-t border-slate-400 mb-1 ml-auto" />
                      <p className="text-[10px] font-black uppercase text-slate-800">Administración</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Conjunto Flores</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CARTERA ── */}
              {datosReporte.tipo === 'CARTERA' && (
                <section className="space-y-6">
                  <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex justify-between items-center gap-3">
                    <div>
                      <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Cartera Morosa Global</p>
                      <p className="text-3xl font-black text-rose-900 tabular-nums">${datosReporte.summary.totalEnMora.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-rose-400 uppercase">Unidades en Mora</p>
                      <p className="text-2xl font-black text-rose-900">{datosReporte.summary.unidadesEnMora}</p>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Unidad</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Titular</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Teléfono</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Deuda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosReporte.enMora.map((r, i) => (
                        <tr key={r.id} className={`border-b border-slate-50 ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                          <td className="py-2.5 text-[10px] font-black text-slate-800">T{r.torre.slice(-1)}-{r.apartamento}</td>
                          <td className="py-2.5 text-[10px] uppercase text-slate-700">{r.nombre}</td>
                          <td className="py-2.5 text-[10px] text-slate-400">{r.celular || '--'}</td>
                          <td className="py-2.5 text-[10px] font-black text-rose-600 tabular-nums text-right">${r.saldoReal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900">
                        <td colSpan={3} className="pt-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right pr-4">Total Cartera:</td>
                        <td className="pt-3 text-sm font-black text-rose-700 tabular-nums text-right">${datosReporte.summary.totalEnMora.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </section>
              )}

              {/* ── CENSO ── */}
              {datosReporte.tipo === 'CENSO' && (
                <section>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900">
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Unidad</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Nombre</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Celular</th>
                        <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Vehículos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosReporte.residentes.map((r, i) => (
                        <tr key={r.id} className={`border-b border-slate-50 ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                          <td className="py-2.5 text-[10px] font-black text-slate-800">T{r.torre.slice(-1)}-{r.apartamento}</td>
                          <td className="py-2.5 text-[10px] uppercase text-slate-700">{r.nombre}</td>
                          <td className="py-2.5 text-[10px] text-slate-400">{r.celular || '--'}</td>
                          <td className="py-2.5 text-[9px] text-slate-400">Car: <b>{r.carros}</b> · Mot: <b>{r.motos}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* ── VEHÍCULOS ── */}
              {datosReporte.tipo === 'VEHICULOS' && (() => {
                const resumen = [
                  { label: 'Carros', count: datosReporte.totalCarros, color: 'bg-blue-50 border-blue-100 text-blue-700' },
                  { label: 'Motos', count: datosReporte.totalMotos, color: 'bg-amber-50 border-amber-100 text-amber-700' },
                  { label: 'Bicicletas', count: datosReporte.totalBicis, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                ];
                const TablaVehiculo = ({ titulo, datos, color, num }: { titulo: string; datos: any[]; color: string; num: number }) => (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${color}`}>
                      <h3 className="text-[11px] font-black uppercase tracking-widest">{titulo}</h3>
                      <span className="text-[11px] font-black tabular-nums">{num} unidad{num !== 1 ? 'es' : ''}</span>
                    </div>
                    {datos.length === 0 ? (
                      <p className="text-center text-[10px] text-slate-300 italic py-4">Sin registros</p>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">#</th>
                            <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Unidad</th>
                            <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Torre</th>
                            <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Propietario</th>
                            <th className="pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((r, i) => (
                            <tr key={`${r.id}-${r.vehiculo_num}`} className={`border-b border-slate-50 ${i % 2 !== 0 ? 'bg-slate-50/60' : ''}`}>
                              <td className="py-2 text-[10px] font-bold text-slate-300 tabular-nums w-6">{i + 1}</td>
                              <td className="py-2">
                                <span className="inline-block bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-lg">
                                  {r.unidad}
                                </span>
                              </td>
                              <td className="py-2 text-[10px] text-slate-500 font-semibold">{r.torre}</td>
                              <td className="py-2 text-[10px] font-black text-slate-800 uppercase">{r.nombre}</td>
                              <td className="py-2 text-[10px] text-slate-400">{r.celular || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
                return (
                  <section className="space-y-8">
                    {/* KPIs resumen */}
                    <div className="grid grid-cols-3 gap-3">
                      {resumen.map(({ label, count, color }) => (
                        <div key={label} className={`rounded-2xl border px-5 py-4 ${color}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
                          <p className="text-3xl font-black tabular-nums leading-none">{count}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tablas */}
                    <TablaVehiculo titulo="🚗  Carros" datos={datosReporte.carros} color="bg-blue-50 border-blue-200 text-blue-800" num={datosReporte.totalCarros} />
                    <TablaVehiculo titulo="🏍️  Motos" datos={datosReporte.motos} color="bg-amber-50 border-amber-200 text-amber-800" num={datosReporte.totalMotos} />
                    <TablaVehiculo titulo="🚲  Bicicletas" datos={datosReporte.bicis} color="bg-emerald-50 border-emerald-200 text-emerald-800" num={datosReporte.totalBicis} />

                    {/* Pie */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        Documento de uso interno · No es una factura legal
                      </p>
                      <div className="text-right">
                        <div className="w-36 border-t border-slate-400 mb-1 ml-auto" />
                        <p className="text-[10px] font-black uppercase text-slate-800">Administración</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Conjunto Flores</p>
                      </div>
                    </div>
                  </section>
                );
              })()}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}