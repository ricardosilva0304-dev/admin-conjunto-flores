"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText, Printer, Loader2, Scale, CheckCircle2, AlertCircle, TrendingDown, TrendingUp,
  Wallet, Landmark, Banknote
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

  // --- LÓGICA DE IMPRESIÓN PRO ---
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']")).map((s) => s.outerHTML).join("");

    doc.write(`
      <html>
        <head>
          <title>Reporte - ${tipo}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 1.5cm; }
            body { margin: 0; padding: 0; background: white !important; font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            .print-container { width: 100%; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          <div class="print-container">${content.innerHTML}</div>
          <script>window.onload = () => { window.print(); setTimeout(() => { window.frameElement.remove(); }, 100); };</script>
        </body>
      </html>
    `);
    doc.close();
  };

  // --- MOTOR DE CÁLCULO DE CARTERA ---
  const calcularDeudaTotal = (deudas: any[]) => {
    return deudas.reduce((acc, d) => {
      if (!d.causaciones_globales) return acc + (d.saldo_pendiente || 0);
      const hoy = new Date();
      const dia = hoy.getDate();
      const [yC, mC] = d.causaciones_globales.mes_causado.split("-").map(Number);
      const mesAct = hoy.getMonth() + 1;
      const anioAct = hoy.getFullYear();

      const m1 = d.precio_m1 || d.monto_original || 0;
      const m2 = d.precio_m2 || m1;
      const m3 = d.precio_m3 || m1;
      const modo = d.causaciones_globales.tipo_cobro || 'NORMAL';

      let precio = m1;
      if (modo === 'M1') precio = m1;
      else if (modo === 'M2') precio = m2;
      else if (modo === 'M3') precio = m3;
      else {
        if (anioAct > yC || (anioAct === yC && mesAct > mC)) precio = m3;
        else if (dia > 10 && dia <= 20) precio = m2;
        else if (dia > 20) precio = m3;
      }
      const pagado = m1 - (d.saldo_pendiente || 0);
      return acc + (precio - pagado);
    }, 0);
  };

  async function generarReporte() {
    setLoading(true);
    setReporteData(null);
    try {
      if (tipo === "General" || tipo === "Solo Ingresos" || tipo === "Solo Egresos") {
        if (!mes) return alert("Selecciona un mes");
        const [anio, mesNum] = mes.split("-").map(Number);
        const primerDia = `${mes}-01`;
        const ultimoDia = `${mes}-${new Date(anio, mesNum, 0).getDate()}`;

        const [resIng, resEgr] = await Promise.all([
          supabase.from("pagos").select("*").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia).order('fecha_pago'),
          supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order('fecha')
        ]);
        setReporteData({ ingresos: resIng.data || [], egresos: resEgr.data || [], residentes: [], cartera: [] });
      }
      else if (tipo === "Directorio Residentes") {
        const { data } = await supabase.from("residentes").select("*").neq("torre", "Torre 1").order("torre").order("apartamento");
        setReporteData({ ingresos: [], egresos: [], cartera: [], residentes: data || [] });
      }
      else if (tipo === "Estado Cartera") {
        const [resRes, deudasRes] = await Promise.all([
          supabase.from("residentes").select("*").neq("torre", "Torre 1").order("torre").order("apartamento"),
          supabase.from("deudas_residentes").select("*, causaciones_globales(mes_causado, tipo_cobro)").gt("saldo_pendiente", 0)
        ]);
        const residentes = resRes.data || [];
        const todasDeudas = deudasRes.data || [];
        const cartera = residentes.map(r => ({ ...r, deudaTotal: calcularDeudaTotal(todasDeudas.filter((d:any) => d.residente_id === r.id)) }));
        setReporteData({ ingresos: [], egresos: [], residentes: [], cartera });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const totalIng = reporteData?.ingresos.reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;
  const totalEgr = reporteData?.egresos.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
  const ingBanco = reporteData?.ingresos.filter(i => i.metodo_pago === 'Transferencia').reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;
  const ingEfectivo = reporteData?.ingresos.filter(i => i.metodo_pago === 'Efectivo').reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 font-sans text-slate-800">
      
      {/* 1. BARRA DE FILTROS */}
      <section className="bg-white p-4 rounded-xl border shadow-sm no-print flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white"><FileText size={20} /></div>
          <div><h2 className="font-black text-xs uppercase tracking-widest leading-none">Módulo de Auditoría</h2><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Generación de Reportes PDF</p></div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="bg-slate-50 border p-2.5 rounded-lg text-xs font-bold outline-none uppercase" value={tipo} onChange={(e) => { setTipo(e.target.value); setReporteData(null); }}>
            <optgroup label="CONTABILIDAD">
              <option value="General">Balance (Ingresos/Gastos)</option>
              <option value="Solo Ingresos">Solo Ingresos</option>
              <option value="Solo Egresos">Solo Gastos</option>
            </optgroup>
            <optgroup label="LISTADOS">
              <option value="Directorio Residentes">Directorio (T5-T8)</option>
              <option value="Estado Cartera">Estado de Cartera (Todos)</option>
            </optgroup>
          </select>
          {(tipo === "General" || tipo.includes("Solo")) && <input type="month" className="bg-slate-50 border p-2 rounded-lg text-xs font-bold outline-none" onChange={(e) => setMes(e.target.value)} />}
        </div>
        <button onClick={generarReporte} disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-30">{loading ? <Loader2 className="animate-spin" /> : "Generar"}</button>
        {reporteData && <button onClick={handlePrint} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest"><Printer size={16} className="inline mr-2"/>Imprimir</button>}
      </section>

      {/* 2. ÁREA DE REPORTE */}
      {reporteData && (
        <div className="bg-white border shadow-2xl rounded-2xl overflow-hidden">
          <div ref={printRef} className="p-10 md:p-14 w-full bg-white">
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-8">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Logo" className="w-16" />
                <div>
                  <h1 className="text-sm font-black uppercase italic">
                    {tipo === 'Estado Cartera' ? 'Informe General de Cartera' : tipo === 'Directorio Residentes' ? 'Censo de Residentes' : 'Reporte de Caja Mensual'}
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">P. De Las Flores - NIT 832.011.421-3</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Emisión</p>
                <p className="text-sm font-black uppercase">{new Date().toLocaleDateString()}</p>
                {mes && <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Periodo: {mes}</p>}
              </div>
            </div>

            {/* KPIs FINANCIEROS CON DESGLOSE */}
            {(tipo === "General" || tipo.includes("Solo")) && (
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                   <div>
                     <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-1"><TrendingUp size={12}/> Recaudo Total</p>
                     <p className="text-2xl font-black text-emerald-800 tabular-nums">${totalIng.toLocaleString()}</p>
                   </div>
                   {(tipo === "General" || tipo === "Solo Ingresos") && (
                     <div className="mt-4 pt-3 border-t border-emerald-200/50 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-emerald-700/60 uppercase"><span>Bancos:</span><span>${ingBanco.toLocaleString()}</span></div>
                        <div className="flex justify-between text-[8px] font-bold text-emerald-700/60 uppercase"><span>Efectivo:</span><span>${ingEfectivo.toLocaleString()}</span></div>
                     </div>
                   )}
                </div>
                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                   <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 mb-1"><TrendingDown size={12}/> Gastos</p>
                   <p className="text-2xl font-black text-rose-800 tabular-nums">-${totalEgr.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-slate-900 rounded-2xl text-white">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1"><Scale size={12}/> Balance Neto</p>
                   <p className={`text-2xl font-black tabular-nums ${totalIng - totalEgr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${(totalIng - totalEgr).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* TABLA DE INGRESOS (Solo si aplica) */}
            {(tipo === "General" || tipo === "Solo Ingresos") && (
              <div className="mb-10">
                <h3 className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 inline-block rounded mb-4">Relación Detallada de Ingresos</h3>
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b-2 border-slate-900 font-black uppercase text-slate-500">
                    <tr><th className="py-2">Recibo</th><th>Unidad</th><th>Concepto Principal</th><th>Medio</th><th className="text-right">Monto</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {reporteData.ingresos.map(i => (
                      <tr key={i.id}>
                        <td className="py-2 font-black">RC-{i.numero_recibo}</td>
                        <td className="font-bold">{i.unidad}</td>
                        <td className="uppercase text-slate-400">{i.concepto_texto?.split("||")[0].split("|")[0]}</td>
                        <td className="text-[8px] uppercase">{i.metodo_pago}</td>
                        <td className="text-right font-black text-emerald-600">${Number(i.monto_total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA DE EGRESOS (Solo si aplica) */}
            {(tipo === "General" || tipo === "Solo Egresos") && (
              <div className="mb-10">
                <h3 className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 border px-3 py-1.5 inline-block rounded mb-4">Relación Detallada de Gastos</h3>
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b-2 border-slate-400 font-black uppercase text-slate-400">
                    <tr><th className="py-2">Gasto No.</th><th>Beneficiario</th><th>Descripción</th><th className="text-right">Monto</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {reporteData.egresos.map(e => (
                      <tr key={e.id}>
                        <td className="py-2 font-black">CE-{e.recibo_n}</td>
                        <td className="font-bold uppercase">{e.pagado_a}</td>
                        <td className="italic text-slate-400 uppercase">{e.concepto}</td>
                        <td className="text-right font-black text-rose-600">${Number(e.monto).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA DE RESIDENTES */}
            {tipo === "Directorio Residentes" && (
              <table className="w-full text-left text-[9px]">
                <thead className="border-b-2 border-slate-900 font-black uppercase">
                  <tr><th className="py-2">Unidad</th><th>Residente</th><th>Contacto</th><th>Vehículos</th></tr>
                </thead>
                <tbody className="divide-y text-slate-600">
                  {reporteData.residentes.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 font-black text-slate-900">{r.torre.replace("Torre ","T")}-{r.apartamento}</td>
                      <td className="uppercase font-bold">{r.nombre}</td>
                      <td>{r.celular} / {r.email}</td>
                      <td>{r.carros > 0 ? `Car:${r.carros} ` : ''}{r.motos > 0 ? `Mot:${r.motos}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TABLA DE CARTERA */}
            {tipo === "Estado Cartera" && (
              <table className="w-full text-left text-[10px]">
                <thead className="border-b-2 border-slate-900 font-black uppercase">
                  <tr><th className="py-2">Unidad</th><th>Residente</th><th>Estado</th><th className="text-right">Saldo Hoy</th></tr>
                </thead>
                <tbody className="divide-y">
                  {reporteData.cartera.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 font-black">T{r.torre.slice(-1)}-{r.apartamento}</td>
                      <td className="uppercase">{r.nombre}</td>
                      <td><span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${r.deudaTotal > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{r.deudaTotal > 0 ? 'En Mora' : 'Al día'}</span></td>
                      <td className={`text-right font-black ${r.deudaTotal < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>${Math.abs(r.deudaTotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* FIRMAS LEGALES */}
            <div className="mt-20 pt-10 border-t grid grid-cols-2 gap-20">
              <div className="text-center"><div className="w-full border-t border-slate-400 mb-2"></div><p className="text-[9px] font-black uppercase">Administración / Tesorería</p></div>
              <div className="text-center"><div className="w-full border-t border-slate-400 mb-2"></div><p className="text-[9px] font-black uppercase">Revisoría Fiscal / Consejo</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}