"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils"; // Importamos la lógica central
import {
  Zap, History, Trash2, Eye, X, Loader2,
  PieChart, RefreshCw, CheckCircle2
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

  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("TODOS");

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
    if (!concepto || !confirm(`¿Generar cobros para ${residentesAfectados.length} unidades?`)) return;

    setGenerando(true);
    try {
      // FORMATEAMOS EL PERIODO PARA EL NOMBRE (Ej: ENERO 2026)
      const [anio, mes] = mesDeuda.split("-");
      const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      const periodoTexto = `${mesesNombres[parseInt(mes) - 1]} ${anio}`;
      const nombreConPeriodo = `${concepto.nombre.trim().toUpperCase()} (${periodoTexto})`;

      const { data: lote, error: errLote } = await supabase.from("causaciones_globales").insert([{
        mes_causado: mesDeuda,
        concepto_nombre: nombreConPeriodo, // <--- GUARDAMOS CON EL MES INCLUIDO
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
          causacion_id: lote.id,
          residente_id: res.id,
          unidad: `T${res.torre.slice(-1)}-${res.apartamento}`,
          concepto_nombre: nombreConPeriodo, // <--- COHERENCIA TOTAL
          monto_original: montoBase,
          precio_m1: montoBase,
          precio_m2: (Number(concepto.monto_11_20) || montoBase) * factor,
          precio_m3: (Number(concepto.monto_21_adelante) || montoBase) * factor,
          saldo_pendiente: montoBase,
          fecha_vencimiento: fechaLimite
        };
      }).filter(d => d !== null);

      if (deudas.length > 0) await supabase.from("deudas_residentes").insert(deudas);

      await cargarDatos();
      setConceptoId("");
      alert("¡Causación generada correctamente!");
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

  const historialFiltrado = historial.filter(h => {
    const term = busquedaHistorial.toLowerCase();
    const coincide = h.concepto_nombre.toLowerCase().includes(term) || h.mes_causado.includes(term);
    const coincideAnio = filtroAnio === "TODOS" || h.mes_causado.startsWith(filtroAnio);
    return coincide && coincideAnio;
  });

  const deudasFiltradas = deudasDetalle.filter(d =>
    d.unidad?.includes(busquedaDetalle) || d.residentes?.nombre?.toLowerCase().includes(busquedaDetalle.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-2 md:px-0">

      {/* GENERADOR DE COBROS */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-emerald-500" /> Generar Facturación Masiva
          </h2>
          <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
            {residentesAfectados.length} Unidades en filtro
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <select className="bg-slate-50 border p-3 rounded-lg text-sm font-bold outline-none" value={conceptoId} onChange={(e) => setConceptoId(e.target.value)}>
            <option value="">Seleccionar concepto...</option>
            {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="month" className="bg-slate-50 border p-3 rounded-lg text-sm font-bold outline-none" onChange={(e) => setMesDeuda(e.target.value)} />
          <input type="date" className="bg-slate-50 border p-3 rounded-lg text-sm font-bold outline-none" onChange={(e) => setFechaLimite(e.target.value)} />

          <button onClick={generarCausacion} disabled={generando || !conceptoId} className="h-full bg-slate-900 text-white p-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
            {generando ? <Loader2 className="animate-spin" size={14} /> : "PROCESAR COBROS"}
          </button>
        </div>

        <div className="px-6 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {['TODOS', 'CARRO', 'MOTO', 'BICI'].map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filtroTipo === f ? "bg-emerald-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-400"}`}>
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* ARCHIVO HISTÓRICO */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-400 font-bold text-[10px] uppercase">
            <tr>
              <th className="px-6 py-4">Mes</th>
              <th className="px-6 py-4">Concepto</th>
              <th className="px-6 py-4 text-center">Unidades</th>
              <th className="px-6 py-4 text-center">Tarifa Activa</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historialFiltrado.map(h => (
              <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-black">{h.mes_causado}</td>
                <td className="px-6 py-4 uppercase text-xs font-bold text-slate-500">{h.concepto_nombre}</td>
                <td className="px-6 py-4 text-center font-bold text-slate-400">{h.total_residentes}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-1 bg-slate-100 p-1 rounded-lg w-fit mx-auto">
                    {['M1', 'M2', 'M3', 'NORMAL'].map((m) => {
                      const active = (h.tipo_cobro || 'NORMAL') === m;
                      return (
                        <button key={m} onClick={() => cambiarModo(h.id, m)} className={`px-2 py-1 rounded text-[8px] font-black transition-all ${active ? "bg-slate-800 text-white shadow-sm" : "text-slate-400"}`}>
                          {m === 'NORMAL' ? 'AUTO' : m}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => verDetalles(h)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"><Eye size={18} /></button>
                    <button onClick={async () => { if (confirm("¿Borrar lote?")) { await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos(); } }} className="p-2 bg-slate-100 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* MODAL AUDITORÍA */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase italic">Auditoría: {causacionActiva?.concepto_nombre} ({causacionActiva?.mes_causado})</h3>
              <button onClick={() => setShowDetalles(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X /></button>
            </div>

            <div className="p-4 bg-slate-50 border-b flex gap-4 overflow-x-auto">
              <input placeholder="Buscar apto..." className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold w-full max-w-xs" onChange={(e) => setBusquedaDetalle(e.target.value)} />
              <div className="flex-1 text-right flex items-center justify-end gap-4">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Total Recaudado</p>
                  <span className="font-black text-emerald-600 text-sm">${deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
              {loadingDetalle ? <Loader2 className="animate-spin mx-auto mt-20" /> : deudasFiltradas.map(d => (
                <div key={d.id} className="bg-white border p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{d.unidad}</span>
                    <p className="font-bold text-xs uppercase text-slate-700">{d.residentes?.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black tabular-nums ${d.saldo_pendiente === 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
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