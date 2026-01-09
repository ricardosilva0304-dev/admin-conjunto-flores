"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Zap, History, Trash2, Eye, X, Loader2, Search,
  CheckCircle2, PieChart, Info, Sun, Moon, Flame,
  RefreshCw, Filter // <--- IMPORTACIÓN CORREGIDA
} from "lucide-react";

export default function Causacion() {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [residentes, setResidentes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Estados de Detalle (Auditoría)
  const [showDetalles, setShowDetalles] = useState(false);
  const [causacionActiva, setCausacionActiva] = useState<any>(null);
  const [deudasDetalle, setDeudasDetalle] = useState<any[]>([]);
  const [busquedaDetalle, setBusquedaDetalle] = useState("");

  // Estados del historial y filtros
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("TODOS");
  const [filtroConcepto, setFiltroConcepto] = useState("TODOS");

  // Estados del formulario
  const [conceptoId, setConceptoId] = useState("");
  const [mesDeuda, setMesDeuda] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    const { data: cData } = await supabase.from("conceptos_pago").select("*");
    const { data: rData } = await supabase.from("residentes").select("*").neq("torre", "Torre 1");
    const { data: hData } = await supabase.from("causaciones_globales").select("*").order('created_at', { ascending: false });

    if (cData) setConceptos(cData);
    if (rData) setResidentes(rData);
    if (hData) setHistorial(hData);
    setLoading(false);
  }

  const calcularPrecioActual = (deuda: any) => {
    if (!deuda) return 0;
    if (deuda.saldo_pendiente === 0) return deuda.monto_original || 0;

    const hoy = new Date();
    const diaMes = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const mesCausadoStr = deuda.causaciones_globales?.mes_causado;
    if (!mesCausadoStr) return deuda.precio_m1 || 0;

    const partes = mesCausadoStr.split("-");
    if (partes.length < 2) return deuda.precio_m1 || 0;

    const yearCausacion = parseInt(partes[0]);
    const monthCausacion = parseInt(partes[1]);

    if (anioActual > yearCausacion || (anioActual === yearCausacion && mesActual > monthCausacion)) {
      return deuda.precio_m3 || 0;
    }

    if (diaMes <= 10) return deuda.precio_m1 || 0;
    if (diaMes <= 20) return deuda.precio_m2 || 0;
    return deuda.precio_m3 || 0;
  };

  async function verDetalles(causacion: any) {
    setCausacionActiva(causacion);
    setShowDetalles(true);
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`*, residentes(nombre), causaciones_globales(mes_causado)`)
      .eq("causacion_id", causacion.id)
      .order('unidad', { ascending: true });

    if (data) setDeudasDetalle(data);
  }

  const residentesAfectados = residentes.filter(r => {
    if (filtroTipo === "TODOS") return true;
    if (filtroTipo === "CARRO") return r.carros > 0;
    if (filtroTipo === "MOTO") return r.motos > 0;
    if (filtroTipo === "BICI") return r.bicis > 0;
    return false;
  });

  async function generarCausacion() {
    if (!conceptoId || !mesDeuda || !fechaLimite) return alert("Faltan datos obligatorios");
    const concepto = conceptos.find(c => c.id === parseInt(conceptoId));
    if (!concepto || !confirm(`¿Generar cobros para ${residentesAfectados.length} residentes?`)) return;

    setGenerando(true);
    try {
      const { data: lote, error: errorLote } = await supabase.from("causaciones_globales").insert([{
        mes_causado: mesDeuda,
        concepto_nombre: concepto.nombre,
        total_residentes: residentesAfectados.length,
        fecha_limite: fechaLimite
      }]).select().single();

      if (errorLote) throw errorLote;

      const deudas = residentesAfectados.map(res => {
        let m1 = concepto.monto_1_10 || 0;
        let m2 = concepto.monto_11_20 || 0;
        let m3 = concepto.monto_21_adelante || 0;

        if (concepto.cobro_por_vehiculo) {
          const factor = filtroTipo === "CARRO" ? res.carros : filtroTipo === "MOTO" ? res.motos : res.bicis;
          m1 *= (factor || 0);
          m2 *= (factor || 0);
          m3 *= (factor || 0);
        }

        return {
          causacion_id: lote.id,
          residente_id: res.id,
          unidad: `${res.torre.replace("Torre ", "")}-${res.apartamento}`,
          monto_original: m1,
          precio_m1: m1,
          precio_m2: m2,
          precio_m3: m3,
          saldo_pendiente: m1,
          fecha_vencimiento: fechaLimite
        };
      });

      await supabase.from("deudas_residentes").insert(deudas);
      cargarDatos();
      setConceptoId("");
      alert("Causación generada correctamente.");
    } catch (err: any) { alert(err.message); }
    finally { setGenerando(false); }
  }

  // Filtrado del historial
  const historialFiltrado = historial.filter(h => {
    const cumpleBusqueda = h.concepto_nombre.toLowerCase().includes(busquedaHistorial.toLowerCase()) || h.mes_causado.includes(busquedaHistorial);
    const cumpleAnio = filtroAnio === "TODOS" || h.mes_causado.startsWith(filtroAnio);
    const cumpleConcepto = filtroConcepto === "TODOS" || h.concepto_nombre === filtroConcepto;
    return cumpleBusqueda && cumpleAnio && cumpleConcepto;
  });

  const deudasFiltradas = deudasDetalle.filter(d =>
    d.unidad?.includes(busquedaDetalle) ||
    d.residentes?.nombre?.toLowerCase().includes(busquedaDetalle.toLowerCase())
  );

  const aniosUnicos = Array.from(new Set(historial.map(h => h.mes_causado.split("-")[0]))).sort().reverse();
  const conceptosUnicos = Array.from(new Set(historial.map(h => h.concepto_nombre))).sort();

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">

      {/* SECCIÓN GENERAR */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200"><Zap size={28} /></div>
            <div>
              <h2 className="text-slate-900 text-2xl font-black uppercase tracking-tight">Generar Causación</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Excluyendo Torre 1 • Torres 5 a 8</p>
            </div>
          </div>
          <div className="bg-white px-8 py-3 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Unidades Meta</span>
            <span className="text-emerald-600 font-black text-2xl">{residentesAfectados.length}</span>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Concepto</label>
              <select className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-emerald-500 appearance-none" value={conceptoId} onChange={(e) => setConceptoId(e.target.value)}>
                <option value="">Elegir concepto...</option>
                {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mes de Deuda</label>
              <input type="month" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-emerald-500" onChange={(e) => setMesDeuda(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vencimiento</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-emerald-500" onChange={(e) => setFechaLimite(e.target.value)} />
            </div>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            {['TODOS', 'CARRO', 'MOTO', 'BICI'].map(f => (
              <button key={f} onClick={() => setFiltroTipo(f)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${filtroTipo === f ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{f}</button>
            ))}
          </div>

          <button onClick={generarCausacion} disabled={generando} className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
            {generando ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> PROCESAR COBROS MASIVOS</>}
          </button>
        </div>
      </section>

      {/* HISTORIAL CON FILTROS INTEGRADOS */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <History size={20} className="text-emerald-500" />
            <h2 className="text-slate-900 font-black text-xl uppercase tracking-[0.2em]">Historial de Periodos</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={14} />
              <input
                placeholder="Buscar..."
                className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 transition-all w-40"
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                value={busquedaHistorial}
              />
            </div>
            
            <select className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              <option value="TODOS">AÑO: TODOS</option>
              {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" value={filtroConcepto} onChange={(e) => setFiltroConcepto(e.target.value)}>
              <option value="TODOS">CONCEPTO: TODOS</option>
              {conceptosUnicos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <button onClick={() => { setBusquedaHistorial(""); setFiltroAnio("TODOS"); setFiltroConcepto("TODOS"); }} className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-xl transition-all" title="Limpiar filtros">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-8">Periodo</th>
                <th className="p-8">Concepto Generado</th>
                <th className="p-8 text-center">Unidades</th>
                <th className="p-8 text-right">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historialFiltrado.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic">No se encontraron resultados.</td></tr>
              ) : (
                historialFiltrado.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/50 transition-all group animate-in fade-in duration-300">
                    <td className="p-8 font-black text-slate-900 text-lg uppercase">{h.mes_causado}</td>
                    <td className="p-8">
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase border border-emerald-100">{h.concepto_nombre}</span>
                    </td>
                    <td className="p-8 text-center font-bold text-slate-500">{h.total_residentes} Apts</td>
                    <td className="p-8 text-right flex justify-end gap-3">
                      <button onClick={() => verDetalles(h)} className="p-4 bg-white text-slate-400 hover:text-emerald-600 border border-slate-100 rounded-2xl transition-all shadow-sm hover:shadow-md"><Eye size={20} /></button>
                      <button onClick={async () => { if (confirm("¿Eliminar lote?")) { await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos(); } }} className="p-4 bg-white text-slate-400 hover:text-rose-500 border border-slate-100 rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL AUDITORÍA */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#f8fafc] w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="px-12 py-10 bg-white border-b border-slate-100 flex justify-between items-end">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200"><PieChart size={36} strokeWidth={2.5} /></div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Corte Activo</span>
                    <h3 className="text-slate-900 text-3xl font-black uppercase tracking-tighter">Auditoría de Pagos</h3>
                  </div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{causacionActiva?.concepto_nombre} • {causacionActiva?.mes_causado}</p>
                </div>
              </div>
              <div className="flex items-end gap-10">
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Recaudado</p>
                  <h4 className="text-emerald-600 text-3xl font-black tracking-tighter tabular-nums">${deudasDetalle.reduce((acc, d) => acc + ((d.monto_original || 0) - (d.saldo_pendiente || 0)), 0).toLocaleString()}</h4>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Por Cobrar Hoy</p>
                  <h4 className="text-rose-500 text-3xl font-black tracking-tighter tabular-nums">${deudasDetalle.reduce((acc, d) => acc + Math.max(0, calcularPrecioActual(d) - ((d.monto_original || 0) - (d.saldo_pendiente || 0))), 0).toLocaleString()}</h4>
                </div>
                <button onClick={() => setShowDetalles(false)} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all ml-4"><X size={28} /></button>
              </div>
            </div>
            <div className="px-12 py-6 bg-white border-b border-slate-100">
              <div className="relative flex-1 group max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input placeholder="Filtrar unidad o nombre..." className="w-full bg-slate-50 border border-slate-100 pl-14 pr-8 py-5 rounded-[1.5rem] outline-none focus:ring-4 ring-emerald-500/5 focus:border-emerald-500 font-bold text-slate-700" onChange={(e) => setBusquedaDetalle(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
              <div className="max-w-5xl mx-auto space-y-2">
                <div className="grid grid-cols-12 px-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]"><div className="col-span-1">Unidad</div><div className="col-span-4">Nombre</div><div className="col-span-2 text-right">Monto Hoy</div><div className="col-span-2 text-right text-emerald-600">Abonos</div><div className="col-span-3 text-right">Saldo Real</div></div>
                {deudasFiltradas.map(d => {
                  const precioHoy = calcularPrecioActual(d);
                  const abonado = (d.monto_original || 0) - (d.saldo_pendiente || 0);
                  const saldoReal = Math.max(0, precioHoy - abonado);
                  const pagadoTotal = d.saldo_pendiente === 0;
                  return (
                    <div key={d.id} className="grid grid-cols-12 items-center bg-white border border-slate-100 px-8 py-5 rounded-2xl hover:shadow-xl hover:border-emerald-200 transition-all group relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pagadoTotal ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div className="col-span-1"><span className="text-slate-900 font-black text-xl tracking-tighter">{d.unidad}</span></div>
                      <div className="col-span-4 px-4"><p className="text-slate-800 font-extrabold text-sm truncate">{d.residentes?.nombre}</p></div>
                      <div className="col-span-2 text-right"><span className="text-slate-400 font-bold text-xs tabular-nums">${(precioHoy || 0).toLocaleString()}</span></div>
                      <div className="col-span-2 text-right"><span className="text-emerald-600 font-black text-xs tabular-nums">+${(abonado || 0).toLocaleString()}</span></div>
                      <div className="col-span-3 flex items-center justify-end gap-6"><span className={`text-2xl font-black tracking-tighter tabular-nums ${pagadoTotal ? 'text-slate-200' : 'text-rose-600'}`}>${(saldoReal || 0).toLocaleString()}</span><div className={`min-w-[90px] text-center py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border ${pagadoTotal ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{pagadoTotal ? 'Al día' : 'En Mora'}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}