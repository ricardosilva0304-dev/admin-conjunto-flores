"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils"; // Importamos lógica central
import {
  FileText, Printer, Loader2, Scale, TrendingDown, TrendingUp,
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
          <title>Reporte Flores - ${tipo}</title>
          ${styles}
          <style>
            @page { size: letter; margin: 1.5cm; }
            body { margin: 0; padding: 0; background: white !important; font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
            th { background: #f8fafc; border-bottom: 2px solid #000; padding: 8px; text-align: left; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
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

  async function generarReporte() {
    setLoading(true);
    setReporteData(null);
    try {
      if (tipo === "General" || tipo === "Solo Ingresos" || tipo === "Solo Egresos") {
        if (!mes) return alert("Selecciona un mes");
        const primerDia = `${mes}-01`;
        const ultimoDia = `${mes}-31`;

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
        
        // CÁLCULO DE CARTERA USANDO LIBRERÍA UNIFICADA
        const cartera = residentes.map(r => {
            const deudasUnidad = todasDeudas.filter((d:any) => d.residente_id === r.id);
            const total = deudasUnidad.reduce((acc, d) => acc + calcularValorDeudaHoy(d), 0);
            return { ...r, deudaTotal: total };
        });

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
      
      {/* PANEL DE CONTROL */}
      <section className="bg-white p-4 rounded-xl border shadow-sm no-print flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white"><FileText size={20} /></div>
          <div><h2 className="font-black text-xs uppercase tracking-widest leading-none">Generador de Informes</h2><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Auditoría y Contabilidad</p></div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="bg-slate-50 border p-2.5 rounded-lg text-xs font-bold outline-none uppercase" value={tipo} onChange={(e) => { setTipo(e.target.value); setReporteData(null); }}>
            <option value="General">Balance Mensual</option>
            <option value="Solo Ingresos">Libro de Ingresos</option>
            <option value="Solo Egresos">Libro de Gastos</option>
            <option value="Estado Cartera">Estado de Cartera</option>
            <option value="Directorio Residentes">Censo Residentes</option>
          </select>
          {(tipo === "General" || tipo.includes("Solo")) && <input type="month" className="bg-slate-50 border p-2 rounded-lg text-xs font-bold outline-none" onChange={(e) => setMes(e.target.value)} />}
        </div>
        <button onClick={generarReporte} disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest">{loading ? <Loader2 className="animate-spin" /> : "GENERAR"}</button>
        {reporteData && <button onClick={handlePrint} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest">IMPRIMIR</button>}
      </section>

      {/* DOCUMENTO IMPRIMIBLE */}
      {reporteData && (
        <div className="bg-white border shadow-2xl rounded-2xl overflow-hidden">
          <div ref={printRef} className="p-10 md:p-14 w-full bg-white">
            
            {/* CABEZOTE REPORTE */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-8">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Logo" className="w-16" />
                <div>
                  <h1 className="text-sm font-black uppercase italic">{tipo}</h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Conjunto Residencial El Parque de las Flores</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fecha de Emisión</p>
                <p className="text-sm font-black uppercase">{new Date().toLocaleDateString()}</p>
                {mes && <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Periodo: {mes}</p>}
              </div>
            </div>

            {/* KPIs DE REPORTE */}
            {(tipo === "General" || tipo.includes("Solo")) && (
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                   <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Recaudo Total</p>
                   <p className="text-2xl font-black text-emerald-800 tabular-nums">${totalIng.toLocaleString()}</p>
                   <div className="mt-2 text-[8px] font-bold text-emerald-700/60 uppercase">Bancos: ${ingBanco.toLocaleString()} | Efec: ${ingEfectivo.toLocaleString()}</div>
                </div>
                <div className="p-5 bg-rose-50 rounded-xl border border-rose-100">
                   <p className="text-[9px] font-black text-rose-600 uppercase mb-1">Gastos Totales</p>
                   <p className="text-2xl font-black text-rose-800 tabular-nums">-${totalEgr.toLocaleString()}</p>
                </div>
                <div className="p-5 bg-slate-900 rounded-xl text-white">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Saldo Neto Caja</p>
                   <p className={`text-2xl font-black tabular-nums ${totalIng - totalEgr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${(totalIng - totalEgr).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* TABLA DE INGRESOS */}
            {(tipo === "General" || tipo === "Solo Ingresos") && (
              <div className="mb-10">
                <h3 className="text-[9px] font-black uppercase bg-slate-100 p-2 inline-block rounded mb-4">Relación de Entradas de Efectivo / Banco</h3>
                <table className="w-full">
                  <thead><tr><th>Recibo</th><th>Unidad</th><th>Concepto Principal</th><th>Medio</th><th className="text-right">Monto</th></tr></thead>
                  <tbody>
                    {reporteData.ingresos.map(i => (
                      <tr key={i.id}>
                        <td className="font-black text-slate-900">RC-{i.numero_recibo}</td>
                        <td className="font-bold">{i.unidad}</td>
                        <td className="uppercase text-slate-500">{i.concepto_texto?.split("||")[0].split("|")[0] || "Administración"}</td>
                        <td className="text-[8px] uppercase">{i.metodo_pago}</td>
                        <td className="text-right font-black text-emerald-600">${Number(i.monto_total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA DE EGRESOS */}
            {(tipo === "General" || tipo === "Solo Egresos") && (
              <div className="mb-10">
                <h3 className="text-[9px] font-black uppercase bg-slate-100 p-2 inline-block rounded mb-4">Relación de Gastos y Salidas</h3>
                <table className="w-full">
                  <thead><tr><th>Egreso No.</th><th>Beneficiario</th><th>Concepto / Descripción</th><th className="text-right">Monto</th></tr></thead>
                  <tbody>
                    {reporteData.egresos.map(e => (
                      <tr key={e.id}>
                        <td className="font-black text-slate-900">CE-{e.recibo_n}</td>
                        <td className="font-bold uppercase">{e.pagado_a}</td>
                        <td className="italic text-slate-400 uppercase">{e.concepto}</td>
                        <td className="text-right font-black text-rose-600">${Number(e.monto).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABLA DE CARTERA */}
            {tipo === "Estado Cartera" && (
              <table className="w-full">
                <thead><tr><th>Unidad</th><th>Nombre Residente</th><th>Estado</th><th className="text-right">Saldo Hoy</th></tr></thead>
                <tbody>
                  {reporteData.cartera.map(r => (
                    <tr key={r.id}>
                      <td className="font-black">T{r.torre.slice(-1)}-{r.apartamento}</td>
                      <td className="uppercase font-medium">{r.nombre}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${r.deudaTotal > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {r.deudaTotal > 0 ? 'En Mora' : 'A Paz y Salvo'}
                        </span>
                      </td>
                      <td className={`text-right font-black ${r.deudaTotal < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ${Math.abs(r.deudaTotal).toLocaleString()} {r.deudaTotal < 0 ? '(CR)' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* SECCIÓN DE FIRMAS */}
            <div className="mt-24 pt-10 border-t flex justify-around gap-20">
              <div className="text-center w-64"><div className="border-t border-slate-900 mb-2"></div><p className="text-[9px] font-black uppercase">Administración / Tesorería</p></div>
              <div className="text-center w-64"><div className="border-t border-slate-900 mb-2"></div><p className="text-[9px] font-black uppercase">Revisoría Fiscal / Consejo</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}