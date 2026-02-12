"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText, Printer, Loader2, TrendingUp, TrendingDown,
  Scale, Users, Wallet, CheckCircle2, AlertCircle
} from "lucide-react";

export default function Reportes() {
  const [tipo, setTipo] = useState("General"); // General, Ingresos, Egresos, Residentes, Cartera
  const [mes, setMes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estado flexible para guardar cualquier tipo de data
  const [reporteData, setReporteData] = useState<{ 
    ingresos: any[], 
    egresos: any[],
    residentes: any[],
    cartera: any[]
  } | null>(null);

  // --- LÓGICA DE CÁLCULO DE DEUDA (Mismo motor que en Deudores) ---
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

      let precio = m1;
      if (anioAct > yC || (anioAct === yC && mesAct > mC)) precio = m3;
      else {
        if (dia > 10 && dia <= 20) precio = m2;
        else if (dia > 20) precio = m3;
      }
      
      const pagado = m1 - (d.saldo_pendiente || 0);
      return acc + Math.max(0, precio - pagado);
    }, 0);
  };

  async function generarReporte() {
    setLoading(true);
    setReporteData(null);

    try {
      // 1. REPORTE FINANCIERO MENSUAL (Ingresos/Egresos)
      if (tipo === "General" || tipo === "Solo Ingresos" || tipo === "Solo Egresos") {
        if (!mes) { alert("Selecciona un mes"); setLoading(false); return; }
        const [anio, mesNum] = mes.split("-").map(Number);
        const primerDia = `${mes}-01`;
        const ultimoDia = `${mes}-${new Date(anio, mesNum, 0).getDate()}`;

        const [resIng, resEgr] = await Promise.all([
          supabase.from("pagos").select("*").gte("fecha_pago", primerDia).lte("fecha_pago", ultimoDia).order('fecha_pago'),
          supabase.from("egresos").select("*").gte("fecha", primerDia).lte("fecha", ultimoDia).order('fecha')
        ]);

        setReporteData({ 
          ingresos: resIng.data || [], 
          egresos: resEgr.data || [], 
          residentes: [], 
          cartera: [] 
        });
      }

      // 2. REPORTE DE BASE DE DATOS (Residentes)
      else if (tipo === "Directorio Residentes") {
        const { data } = await supabase
          .from("residentes")
          .select("*")
          .neq("torre", "Torre 1") // EXCLUIR TORRE 1
          .order("torre", { ascending: true })
          .order("apartamento", { ascending: true }); // Esto ordena por string (101, 102...)

        setReporteData({ ingresos: [], egresos: [], cartera: [], residentes: data || [] });
      }

      // 3. REPORTE DE CARTERA COMPLETA (Deudores y Paz y Salvo)
      else if (tipo === "Estado Cartera") {
        // Traemos residentes (sin Torre 1) y TODAS las deudas con saldo > 0
        const [resRes, deudasRes] = await Promise.all([
          supabase.from("residentes").select("*").neq("torre", "Torre 1").order("torre").order("apartamento"),
          supabase.from("deudas_residentes").select(`*, causaciones_globales(mes_causado)`).gt("saldo_pendiente", 0)
        ]);

        const residentes = resRes.data || [];
        const todasLasDeudas = deudasRes.data || [];

        // Mapeamos para calcular deuda uno por uno
        const carteraCalculada = residentes.map(r => {
            const susDeudas = todasLasDeudas.filter((d: any) => d.residente_id === r.id);
            const total = calcularDeudaTotal(susDeudas);
            return { ...r, deudaTotal: total };
        });

        setReporteData({ ingresos: [], egresos: [], residentes: [], cartera: carteraCalculada });
      }

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // --- CALCULOS PARA EL HEADER FINANCIERO ---
  const totalIng = reporteData?.ingresos.reduce((acc, i) => acc + Number(i.monto_total), 0) || 0;
  const totalEgr = reporteData?.egresos.reduce((acc, e) => acc + Number(e.monto), 0) || 0;
  const balance = totalIng - totalEgr;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 px-2 md:px-0 font-sans">
      
      {/* BARRA DE FILTROS */}
      <section className="bg-white p-4 rounded-xl border shadow-sm no-print flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-black text-xs uppercase tracking-widest">Generador de Reportes</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Auditoría y Listados</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="bg-slate-50 border p-2.5 rounded-lg text-xs font-bold outline-none uppercase"
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setReporteData(null); }}
          >
            <optgroup label="Contabilidad Mensual">
                <option value="General">Balance General (Ingresos/Gastos)</option>
                <option value="Solo Ingresos">Solo Ingresos</option>
                <option value="Solo Egresos">Solo Gastos</option>
            </optgroup>
            <optgroup label="Listados Generales (Torres 5-8)">
                <option value="Directorio Residentes">Base de Residentes Detallada</option>
                <option value="Estado Cartera">Sábana de Cartera (Todos)</option>
            </optgroup>
          </select>

          {/* El input de mes solo se muestra para reportes financieros */}
          {(tipo === "General" || tipo.includes("Solo")) && (
            <input 
              type="month" 
              className="bg-slate-50 border p-2 rounded-lg text-xs font-bold outline-none"
              onChange={(e) => { setMes(e.target.value); setReporteData(null); }}
            />
          )}
        </div>
        
        <button 
          onClick={generarReporte} 
          disabled={loading || ((tipo === "General" || tipo.includes("Solo")) && !mes)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-xs font-bold disabled:opacity-30 uppercase tracking-wide"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Generar Datos"}
        </button>

        {reporteData && (
          <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide">
            <Printer size={16} className="inline mr-2"/> Imprimir
          </button>
        )}
      </section>

      {/* ÁREA DE IMPRESIÓN */}
      {reporteData ? (
        <div id="print-report" className="w-full bg-white p-8 md:p-14 border border-slate-100 font-sans">
          
          <style>{`
            @media print {
              @page { size: letter; margin: 1cm; }
              body * { visibility: hidden; }
              #print-report, #print-report * { visibility: visible; }
              #print-report { position: absolute; left: 0; top: 0; width: 100%; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
              .no-print { display: none !important; }
            }
          `}</style>

          {/* CABEZOTE COMÚN */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="w-16" />
              <div>
                <h1 className="text-sm font-black uppercase italic">
                    {tipo === 'Estado Cartera' ? 'Informe General de Cartera' : 
                     tipo === 'Directorio Residentes' ? 'Censo General de Residentes' : 'Reporte Mensual de Caja'}
                </h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Conjunto Res. Parque de las Flores</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Fecha de Emisión</p>
              <p className="text-sm font-black uppercase text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* 1. VISTA DE DIRECTORIO RESIDENTES */}
          {tipo === "Directorio Residentes" && (
             <div>
                <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                        Total Unidades Listadas: <span className="text-slate-900">{reporteData.residentes.length}</span> (Torres 5, 6, 7 y 8)
                    </p>
                </div>
                <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900 font-black uppercase text-slate-600">
                            <th className="py-2">Ubicación</th>
                            <th>Propietario / Residente</th>
                            <th>Contacto</th>
                            <th>Vehículos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reporteData.residentes.map(r => (
                            <tr key={r.id}>
                                <td className="py-2 font-black text-slate-800">
                                    {r.torre.replace("Torre ", "T")}-{r.apartamento}
                                </td>
                                <td className="uppercase">{r.nombre}</td>
                                <td>
                                    <div>Cel: {r.celular || '--'}</div>
                                    <div className="text-slate-400 italic">{r.email}</div>
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        {r.carros > 0 && <span className="bg-emerald-50 text-emerald-700 px-1 rounded font-bold">Car: {r.carros}</span>}
                                        {r.motos > 0 && <span className="bg-amber-50 text-amber-700 px-1 rounded font-bold">Mot: {r.motos}</span>}
                                        {r.bicis > 0 && <span className="bg-blue-50 text-blue-700 px-1 rounded font-bold">Bic: {r.bicis}</span>}
                                        {r.carros===0 && r.motos===0 && r.bicis===0 && <span className="text-slate-300">-</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          )}

          {/* 2. VISTA DE CARTERA COMPLETA */}
          {tipo === "Estado Cartera" && (
             <div>
                <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                        Cobertura: Torres 5-8
                    </p>
                    <div className="flex gap-4 text-[9px] font-bold uppercase">
                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Al día</span>
                        <span className="text-rose-600 flex items-center gap-1"><AlertCircle size={12}/> En Mora</span>
                    </div>
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-900 font-black uppercase text-slate-600">
                            <th className="py-2">Unidad</th>
                            <th>Residente</th>
                            <th>Estado Cartera</th>
                            <th className="text-right">Saldo Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reporteData.cartera.map(r => (
                            <tr key={r.id}>
                                <td className="py-2 font-black text-slate-800 w-24">
                                    {r.torre.replace("Torre ", "T")}-{r.apartamento}
                                </td>
                                <td className="uppercase w-64 truncate">{r.nombre}</td>
                                <td>
                                    {r.deudaTotal > 0 ? (
                                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[8px] uppercase">Pendiente</span>
                                    ) : (
                                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[8px] uppercase">Paz y Salvo</span>
                                    )}
                                </td>
                                <td className="text-right font-black text-slate-900">
                                    ${r.deudaTotal.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-6 border-t pt-4 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Cartera en Calle</p>
                    <p className="text-xl font-black text-rose-600">
                        ${reporteData.cartera.reduce((a, b) => a + b.deudaTotal, 0).toLocaleString()}
                    </p>
                </div>
             </div>
          )}

          {/* 3. VISTA FINANCIERA (INGRESOS/EGRESOS) - MANTIENE TU DISEÑO ANTERIOR */}
          {(tipo === "General" || tipo.includes("Solo")) && (
            <>
                <div className="grid grid-cols-3 gap-4 mb-10 border-b pb-6">
                    <div className="text-center">
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Ingresos</p>
                    <p className="text-xl font-black text-emerald-600 tabular-nums">${totalIng.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x">
                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Total Egresos</p>
                    <p className="text-xl font-black text-rose-600 tabular-nums">${totalEgr.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Neto</p>
                    <p className={`text-xl font-black tabular-nums ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        ${balance.toLocaleString()}
                    </p>
                    </div>
                </div>

                {/* TABLA DE INGRESOS */}
                {(tipo === "General" || tipo === "Solo Ingresos") && (
                    <div className="mb-12">
                        <h3 className="text-[10px] font-black uppercase bg-slate-900 text-white px-3 py-1.5 inline-block rounded mb-3">01. Relación de Recaudos</h3>
                        <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900 font-black uppercase text-slate-500">
                            <th className="py-2">Recibo</th>
                            <th>Unidad</th>
                            <th>Concepto</th>
                            <th>Fecha</th>
                            <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reporteData.ingresos.map(i => (
                            <tr key={i.id}>
                                <td className="py-2 font-black">RC-{i.numero_recibo}</td>
                                <td className="font-bold">{i.unidad}</td>
                                <td className="uppercase text-slate-400 truncate max-w-[200px]">{i.concepto_texto?.split("||")[0].split("|")[0]}</td>
                                <td className="italic">{i.fecha_pago}</td>
                                <td className="text-right font-black text-emerald-600">${Number(i.monto_total).toLocaleString()}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}

                {/* TABLA DE EGRESOS */}
                {(tipo === "General" || tipo === "Solo Egresos") && (
                    <div className="mb-16">
                        <h3 className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1.5 inline-block rounded border mb-3">02. Relación de Gastos</h3>
                        <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-400 font-black uppercase text-slate-400">
                            <th className="py-2">Egreso</th>
                            <th>Beneficiario</th>
                            <th>Descripción</th>
                            <th>Fecha</th>
                            <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reporteData.egresos.map(e => (
                            <tr key={e.id}>
                                <td className="py-2 font-black">CE-{e.recibo_n}</td>
                                <td className="font-bold uppercase">{e.pagado_a}</td>
                                <td className="italic text-slate-400">{e.concepto}</td>
                                <td>{e.fecha}</td>
                                <td className="text-right font-black text-rose-600">${Number(e.monto).toLocaleString()}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}
            </>
          )}

          {/* FIRMAS FINALES */}
          <div className="grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-slate-200">
            <div className="text-center">
              <div className="w-full border-t border-slate-900 mb-2"></div>
              <p className="text-[9px] font-black uppercase">Firma Administrador</p>
            </div>
            <div className="text-center">
              <div className="w-full border-t border-slate-900 mb-2"></div>
              <p className="text-[9px] font-black uppercase">Revisoría Fiscal / Consejo</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed rounded-3xl opacity-20 no-print">
          <Scale size={48} className="mx-auto mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">Seleccione tipo de reporte</p>
        </div>
      )}
    </div>
  );
}