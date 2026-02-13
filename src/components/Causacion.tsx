"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  RefreshCw, CheckCircle2, Calendar, LayoutGrid
} from "lucide-react";

export default function Causacion() {
  // --- ESTADOS ---
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
      const mes = h.mes_causado; // Formato YYYY-MM
      if (!grupos[mes]) grupos[mes] = [];
      grupos[mes].push(h);
    });
    return grupos;
  }, [historial]);

  const mesesOrdenados = Object.keys(historialAgrupado).sort().reverse();

  // --- FUNCIONES DE ACCIÓN ---
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

  const deudasFiltradas = useMemo(() => {
    return deudasDetalle.filter((d: any) =>
      d.unidad?.toLowerCase().includes(busquedaDetalle.toLowerCase()) ||
      d.residentes?.nombre?.toLowerCase().includes(busquedaDetalle.toLowerCase())
    );
  }, [deudasDetalle, busquedaDetalle]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 font-sans text-slate-800">

      {/* 1. BARRA DE COMANDOS (SIMPLIFICADA) */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 w-full">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Servicio</label>
              <select className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all" value={conceptoId} onChange={(e) => setConceptoId(e.target.value)}>
                <option value="">Elegir concepto...</option>
                {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Mes a Cobrar</label>
              <input type="month" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all" onChange={(e) => setMesDeuda(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha Límite</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all" onChange={(e) => setFechaLimite(e.target.value)} />
            </div>
          </div>
          
          <button onClick={generarCausacion} disabled={generando || !conceptoId} className="w-full md:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-slate-900/10">
            {generando ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={16} /> Generar Cobros</>}
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['TODOS', 'CARRO', 'MOTO', 'BICI'].map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filtroTipo === f ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>
              {f === 'TODOS' ? `Afectar: ${residentesAfectados.length} Unidades` : `Solo ${f}`}
            </button>
          ))}
        </div>
      </section>

      {/* 2. HISTORIAL AGRUPADO POR MESES */}
      <div className="space-y-10">
        {mesesOrdenados.map(mesKey => {
            const [anio, mesNum] = mesKey.split("-");
            const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
            const nombreMes = `${mesesNombres[parseInt(mesNum)-1]} ${anio}`;

            return (
                <div key={mesKey} className="space-y-4">
                    {/* SEPARADOR DE MES */}
                    <div className="flex items-center gap-4 px-2">
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{nombreMes}</span>
                        </div>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    {/* ITEMS DEL MES */}
                    <div className="grid grid-cols-1 gap-3">
                        {historialAgrupado[mesKey].map(h => (
                            <div key={h.id} className="bg-white border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:border-emerald-200 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">{h.concepto_nombre}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{h.total_residentes} Unidades cobradas</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0">
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 items-center">
                                        {['M1', 'M2', 'M3', 'NORMAL'].map((m) => {
                                            const active = (h.tipo_cobro || 'NORMAL') === m;
                                            return (
                                                <button key={m} onClick={() => cambiarModo(h.id, m)} className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${active ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}>
                                                    {m === 'NORMAL' ? 'AUTO' : m}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => verDetalles(h)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><Eye size={18}/></button>
                                        <button onClick={async() => {if(confirm("¿Borrar?")) {await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos();}}} className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* MODAL DETALLES... (Se mantiene tu lógica funcional) */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
             {/* Tu modal de auditoría actual, pero con el diseño actualizado a redondeado */}
             <div className="p-6 border-b flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter italic">Auditoría: {causacionActiva?.concepto_nombre}</h3>
                <button onClick={() => setShowDetalles(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            
            <div className="p-4 bg-slate-50 border-b flex gap-4">
              <input placeholder="Filtrar por unidad..." className="bg-white border p-3 rounded-2xl text-xs font-bold w-full max-w-xs outline-none focus:border-emerald-500" onChange={(e) => setBusquedaDetalle(e.target.value)} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-[#F8FAFC]">
              {loadingDetalle ? <Loader2 className="animate-spin mx-auto mt-20" /> : deudasFiltradas.map(d => (
                <div key={d.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">{d.unidad}</span>
                    <p className="font-black text-xs uppercase text-slate-700">{d.residentes?.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tabular-nums ${d.saldo_pendiente === 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                      ${calcularValorDeudaHoy(d).toLocaleString()}
                    </p>
                    <p className="text-[7px] font-black text-slate-300 uppercase">{d.saldo_pendiente === 0 ? 'Pagado' : 'Pendiente'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}