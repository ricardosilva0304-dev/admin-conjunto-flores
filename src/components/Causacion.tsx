"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  RefreshCw, CheckCircle2, Calendar, LayoutGrid, Search, TrendingUp, Wallet
} from "lucide-react";

export default function Causacion() {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [residentes, setResidentes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const [showDetalles, setShowDetalles] = useState(false);
  const [causacionActiva, setCausacionActiva] = useState<any>(null);
  const [deudasDetalle, setDeudasDetalle] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busquedaDetalle, setBusquedaDetalle] = useState("");

  const [conceptoId, setConceptoId] = useState("");
  const [mesDeuda, setMesDeuda] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    const [c, r, h] = await Promise.all([
      supabase.from("conceptos_pago").select("*"),
      supabase.from("residentes").select("*").neq("torre", "Torre 1"),
      supabase.from("causaciones_globales").select("*").order('mes_causado', { ascending: false })
    ]);
    if (c.data) setConceptos(c.data);
    if (r.data) setResidentes(r.data);
    if (h.data) setHistorial(h.data);
    setLoading(false);
  }

  // --- LÓGICA DE AGRUPACIÓN POR MES ---
  const historialAgrupado = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    historial.forEach(h => {
      const mes = h.mes_causado;
      if (!grupos[mes]) grupos[mes] = [];
      grupos[mes].push(h);
    });
    return grupos;
  }, [historial]);

  const mesesOrdenados = Object.keys(historialAgrupado).sort().reverse();

  // --- LÓGICA DE BÚSQUEDA EN EL MODAL ---
  const deudasFiltradas = useMemo(() => {
    return deudasDetalle.filter((d: any) =>
      d.unidad?.toLowerCase().includes(busquedaDetalle.toLowerCase()) ||
      d.residentes?.nombre?.toLowerCase().includes(busquedaDetalle.toLowerCase())
    );
  }, [deudasDetalle, busquedaDetalle]);

  async function cambiarModo(id: number, nuevoModo: string) {
    setHistorial(prev => prev.map(h => h.id === id ? { ...h, tipo_cobro: nuevoModo } : h));
    await supabase.from("causaciones_globales").update({ tipo_cobro: nuevoModo }).eq("id", id);
  }

  async function verDetalles(causacion: any) {
    setCausacionActiva(causacion);
    setShowDetalles(true);
    setLoadingDetalle(true);
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`*, residentes(nombre), causaciones_globales(mes_causado, tipo_cobro)`)
      .eq("causacion_id", causacion.id)
      .order('unidad', { ascending: true });
    if (data) setDeudasDetalle(data);
    setLoadingDetalle(false);
  }

  async function generarCausacion() {
    if (!conceptoId || !mesDeuda || !fechaLimite) return;
    const concepto = conceptos.find(c => c.id === parseInt(conceptoId));
    if (!concepto || !confirm(`¿Confirmar cobros para ${residentesAfectados.length} unidades?`)) return;

    setGenerando(true);
    try {
      const [anio, mes] = mesDeuda.split("-");
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      const periodoTexto = `${mesesNombres[parseInt(mes) - 1]} ${anio}`;
      const nombreConPeriodo = `${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;

      const { data: lote, error: errLote } = await supabase.from("causaciones_globales").insert([{
        mes_causado: mesDeuda,
        concepto_nombre: nombreConPeriodo,
        total_residentes: residentesAfectados.length,
        fecha_limite: fechaLimite,
        tipo_cobro: 'NORMAL'
      }]).select().single();

      if (errLote) throw errLote;

      const deudas = residentesAfectados.map(res => {
        let factor = 1;
        const nombreC = concepto.nombre.toUpperCase();
        if (concepto.cobro_por_vehiculo) {
          if (nombreC.includes("CARRO")) factor = Number(res.carros) || 0;
          else if (nombreC.includes("MOTO")) factor = Number(res.motos) || 0;
          else if (nombreC.includes("BICI")) factor = Number(res.bicis) || 0;
        }
        if (factor === 0) return null;

        const montoBase = (Number(concepto.monto_1_10) || 0) * factor;

        return {
          causacion_id: lote.id, residente_id: res.id,
          unidad: `T${res.torre.slice(-1)}-${res.apartamento}`,
          concepto_nombre: nombreConPeriodo,
          monto_original: montoBase, precio_m1: montoBase,
          precio_m2: (Number(concepto.monto_11_20) || montoBase) * factor,
          precio_m3: (Number(concepto.monto_21_adelante) || montoBase) * factor,
          saldo_pendiente: montoBase, fecha_vencimiento: fechaLimite
        };
      }).filter(d => d !== null);

      if (deudas.length > 0) await supabase.from("deudas_residentes").insert(deudas);
      await cargarDatos();
      setConceptoId("");
      alert("Proceso completado.");
    } catch (err: any) { alert(err.message); }
    finally { setGenerando(false); }
  }

  const residentesAfectados = residentes.filter(r => {
    if (filtroTipo === "TODOS") return true;
    if (filtroTipo === "CARRO") return (r.carros || 0) > 0;
    if (filtroTipo === "MOTO") return (r.motos || 0) > 0;
    if (filtroTipo === "BICI") return (r.bicis || 0) > 0;
    return false;
  });

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* 1. SECCIÓN SUPERIOR: GENERADOR SIMPLIFICADO */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
              <Zap size={20} strokeWidth={2.5}/>
           </div>
           <div>
              <h2 className="text-slate-900 font-black text-sm uppercase tracking-widest leading-none">Generar Cobros Masivos</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-tighter">Planificación financiera del mes</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Concepto de pago</label>
            <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner" value={conceptoId} onChange={(e) => setConceptoId(e.target.value)}>
              <option value="">Selecciona servicio...</option>
              {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Mes</label>
            <input type="month" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner" onChange={(e) => setMesDeuda(e.target.value)} />
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Vencimiento</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner" onChange={(e) => setFechaLimite(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <button onClick={generarCausacion} disabled={generando || !conceptoId} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10 h-[54px]">
              {generando ? <Loader2 className="animate-spin mx-auto" /> : "PROCESAR"}
            </button>
          </div>
        </div>

        {/* FILTROS MEJORADOS (IMAGEN 2) */}
        <div className="mt-6 flex flex-wrap gap-2">
          {['TODOS', 'CARRO', 'MOTO', 'BICI'].map(f => {
            const count = residentes.filter(r => {
                if (f === "TODOS") return true;
                if (f === "CARRO") return (r.carros || 0) > 0;
                if (f === "MOTO") return (r.motos || 0) > 0;
                if (f === "BICI") return (r.bicis || 0) > 0;
                return false;
            }).length;

            return (
                <button 
                    key={f} 
                    onClick={() => setFiltroTipo(f)} 
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${filtroTipo === f ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"}`}
                >
                    {f === 'TODOS' ? 'General' : f} 
                    <span className={`px-1.5 py-0.5 rounded-lg text-[9px] ${filtroTipo === f ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                        {count}
                    </span>
                </button>
            );
          })}
        </div>
      </section>

      {/* 2. HISTORIAL AGRUPADO POR MESES (LIMPIEZA VISUAL) */}
      <div className="space-y-12">
        {mesesOrdenados.map(mesKey => {
            const [anio, mesNum] = mesKey.split("-");
            const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
            const nombreMes = `${mesesNombres[parseInt(mesNum)-1]} ${anio}`;

            return (
                <div key={mesKey} className="space-y-4">
                    <div className="flex items-center gap-4 px-6">
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full shadow-lg">
                            <Calendar size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{nombreMes}</span>
                        </div>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                        {historialAgrupado[mesKey].map(h => (
                            <div key={h.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex flex-col gap-5 hover:border-emerald-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                            <History size={22} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight leading-tight">{h.concepto_nombre}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{h.total_residentes} Unidades afectadas</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => verDetalles(h)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Eye size={18}/></button>
                                        <button onClick={async() => {if(confirm("¿Borrar?")) {await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos();}}} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={18}/></button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Regla de Cobro:</span>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 items-center gap-1">
                                        {['M1', 'M2', 'M3', 'NORMAL'].map((m) => {
                                            const active = (h.tipo_cobro || 'NORMAL') === m;
                                            return (
                                                <button key={m} onClick={() => cambiarModo(h.id, m)} className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${active ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}>
                                                    {m === 'NORMAL' ? 'AUTO' : m}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* 3. MODAL DE AUDITORÍA REDISEÑADO (IMAGEN 1) */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[500] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 border border-white/20">
             
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><LayoutGrid size={24}/></div>
                    <div>
                        <h3 className="font-black text-slate-900 uppercase italic tracking-tighter">Auditoría Detallada</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{causacionActiva?.concepto_nombre}</p>
                    </div>
                </div>
                <button onClick={() => setShowDetalles(false)} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-500 rounded-full shadow-sm transition-all"><X size={24}/></button>
            </div>
            
            {/* RESUMEN DE RECAUDO EN EL MODAL */}
            <div className="px-8 py-6 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input placeholder="Buscar por unidad o nombre..." className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all shadow-inner" onChange={(e) => setBusquedaDetalle(e.target.value)} />
              </div>
              
              <div className="flex gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl text-right">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Recaudado</p>
                    <span className="font-black text-emerald-700 text-lg tabular-nums">
                        ${deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 px-6 py-3 rounded-2xl text-right">
                    <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Por Cobrar</p>
                    <span className="font-black text-rose-700 text-lg tabular-nums">
                        ${deudasDetalle.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0).toLocaleString()}
                    </span>
                  </div>
              </div>
            </div>

            {/* LISTA DE RESIDENTES (REDISEÑO IMAGEN 1) */}
            <div className="flex-1 overflow-y-auto p-8 space-y-3 bg-[#F8FAFC]">
              {loadingDetalle ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20"><Loader2 className="animate-spin mb-4" size={40}/><p className="font-black uppercase text-xs tracking-widest">Cargando Hoja de Ruta...</p></div>
              ) : deudasFiltradas.map(d => {
                const pagado = Number(d.saldo_pendiente) === 0;
                return (
                  <div key={d.id} className={`bg-white border p-5 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md ${pagado ? 'border-emerald-100 opacity-60' : 'border-slate-100 hover:border-emerald-300'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-12 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${pagado ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {d.unidad}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase text-slate-800 tracking-tight">{d.residentes?.nombre}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${pagado ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                {pagado ? 'PAGO COMPLETO' : 'SALDO PENDIENTE'}
                            </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-black tabular-nums leading-none ${pagado ? 'text-emerald-500' : 'text-rose-600'}`}>
                        ${(pagado ? (Number(d.monto_original)).toLocaleString() : (calcularValorDeudaHoy(d)).toLocaleString())}
                      </p>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Cifra de Auditoría</p>
                    </div>
                  </div>
                )
              })}
              {deudasFiltradas.length === 0 && (
                <div className="py-20 text-center opacity-30 italic uppercase text-xs font-black tracking-[0.4em]">Sin coincidencias</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Admin Pro - Parque de las Flores</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}