"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Zap, History, Trash2, Eye, X, Loader2, Search,
  CheckCircle2, PieChart, RefreshCw, Filter, ChevronRight
} from "lucide-react";

export default function Causacion() {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [residentes, setResidentes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Estados de Auditoría
  const [showDetalles, setShowDetalles] = useState(false);
  const [causacionActiva, setCausacionActiva] = useState<any>(null);
  const [deudasDetalle, setDeudasDetalle] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busquedaDetalle, setBusquedaDetalle] = useState("");

  // Estados de Filtros
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("TODOS");

  // Estados del Formulario
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
    const mesCausadoStr = deuda.causaciones_globales?.mes_causado;
    if (!mesCausadoStr) return deuda.precio_m1 || 0;
    const partes = mesCausadoStr.split("-");
    if (partes.length < 2) return deuda.precio_m1 || 0;

    const yearC = parseInt(partes[0]);
    const monthC = parseInt(partes[1]);
    const hoy = new Date();
    const dia = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    if (anioActual > yearC || (anioActual === yearC && mesActual > monthC)) return deuda.precio_m3 || 0;
    if (dia <= 10) return deuda.precio_m1 || 0;
    if (dia <= 20) return deuda.precio_m2 || 0;
    return deuda.precio_m3 || 0;
  };

  async function verDetalles(causacion: any) {
    setCausacionActiva(causacion);
    setShowDetalles(true);
    setLoadingDetalle(true);
    const { data } = await supabase
      .from("deudas_residentes")
      .select(`*, residentes(nombre), causaciones_globales(mes_causado)`)
      .eq("causacion_id", causacion.id)
      .order('unidad', { ascending: true });
    if (data) setDeudasDetalle(data);
    setLoadingDetalle(false);
  }

  async function generarCausacion() {
    if (!conceptoId || !mesDeuda || !fechaLimite) return;
    const concepto = conceptos.find(c => c.id === parseInt(conceptoId));
    if (!concepto || !confirm("¿Confirmar generación de cobros masivos?")) return;

    setGenerando(true);
    try {
      const { data: lote } = await supabase.from("causaciones_globales").insert([{
        mes_causado: mesDeuda,
        concepto_nombre: concepto.nombre,
        total_residentes: residentesAfectados.length,
        fecha_limite: fechaLimite
      }]).select().single();

      const deudas = residentesAfectados.map(res => {
        let factor = 1;

        // --- LÓGICA CORREGIDA: Detectar factor por el nombre del concepto ---
        if (concepto.cobro_por_vehiculo) {
          const nombreC = concepto.nombre.toUpperCase();
          if (nombreC.includes("CARRO")) {
            factor = Number(res.carros) || 0;
          } else if (nombreC.includes("MOTO")) {
            factor = Number(res.motos) || 0;
          } else if (nombreC.includes("BICI")) {
            factor = Number(res.bicis) || 0;
          }
        }

        // Si por alguna razón el factor es 0 (ej: el residente no tiene el vehículo), 
        // pero entró en el filtro, le ponemos 0 para que no genere deuda vacía o errónea.
        const montoBase = (concepto.monto_1_10 || 0) * factor;

        return {
          causacion_id: lote.id,
          residente_id: res.id,
          unidad: `${res.torre.replace("Torre ", "")}-${res.apartamento}`,
          monto_original: montoBase,
          precio_m1: montoBase,
          precio_m2: (concepto.monto_11_20 || 0) * factor,
          precio_m3: (concepto.monto_21_adelante || 0) * factor,
          saldo_pendiente: montoBase,
          fecha_vencimiento: fechaLimite
        };
      }).filter(d => d.monto_original > 0); // Opcional: No generar deudas de $0

      if (deudas.length > 0) {
        await supabase.from("deudas_residentes").insert(deudas);
      }

      cargarDatos();
      setConceptoId("");
      alert("Causación generada exitosamente.");
    } catch (err: any) { // <--- Agrega el ": any" aquí
      console.error(err);
      alert("Error al generar: " + err.message);
    }
    finally { setGenerando(false); }
  }

  const residentesAfectados = residentes.filter(r => {
    if (filtroTipo === "TODOS") return true;
    if (filtroTipo === "CARRO") return r.carros > 0;
    if (filtroTipo === "MOTO") return r.motos > 0;
    if (filtroTipo === "BICI") return r.bicis > 0;
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

  const aniosUnicos = Array.from(new Set(historial.map(h => h.mes_causado.split("-")[0]))).sort().reverse();

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={30} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-2 md:px-0">

      {/* 1. MÓDULO DE ACCIÓN - SENCILLO PERO POTENTE */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-emerald-500" /> Nuevo Proceso de Cobro
          </h2>
          <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
            Meta: {residentesAfectados.length} Unidades (Torres 5-8)
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none" value={conceptoId} onChange={(e) => setConceptoId(e.target.value)}>
            <option value="">Elegir Concepto...</option>
            {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="month" className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none" onChange={(e) => setMesDeuda(e.target.value)} />
          <input type="date" className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-medium focus:border-emerald-500 outline-none" onChange={(e) => setFechaLimite(e.target.value)} />

          <button
            onClick={generarCausacion}
            disabled={generando || !conceptoId}
            className="bg-slate-900 text-white p-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            {generando ? <Loader2 className="animate-spin" size={14} /> : <><CheckCircle2 size={14} /> Procesar</>}
          </button>
        </div>

        <div className="px-6 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {['TODOS', 'CARRO', 'MOTO', 'BICI'].map(f => (
            <button key={f} onClick={() => setFiltroTipo(f)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${filtroTipo === f ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white border border-slate-200 text-slate-400"}`}>
              Filtro: {f}
            </button>
          ))}
        </div>
      </section>

      {/* 2. HISTORIAL INTEGRADO */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History size={18} className="text-slate-400" />
            <h2 className="text-slate-800 font-bold text-base uppercase tracking-widest">Archivo de Causaciones</h2>
          </div>

          <div className="flex gap-2">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input placeholder="Buscar..." className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs font-bold w-40" onChange={(e) => setBusquedaHistorial(e.target.value)} />
            </div>
            <select className="bg-white border border-slate-200 px-2 py-2 rounded-lg text-[9px] font-black uppercase outline-none" value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              <option value="TODOS">Año</option>
              {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={cargarDatos} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-emerald-500"><RefreshCw size={14} /></button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
              <tr>
                <th className="px-6 py-4">Mes Periodo</th>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4 text-center">Unidades</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historialFiltrado.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">{h.mes_causado}</td>
                  <td className="px-6 py-4 uppercase text-xs text-slate-500">{h.concepto_nombre}</td>
                  <td className="px-6 py-4 text-center text-slate-400 font-medium">{h.total_residentes} Apts</td>
                  <td className="px-6 py-4 flex justify-end gap-3">
                    <button onClick={() => verDetalles(h)} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-500"><Eye size={18} /></button>
                    <button onClick={async () => { if (confirm("¿Eliminar lote?")) { await supabase.from("causaciones_globales").delete().eq("id", h.id); cargarDatos(); } }} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-rose-500"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. MODAL DE AUDITORÍA - REDISEÑO SIMPLE Y FULL MÓVIL */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-end md:justify-center">
          <div className="bg-white w-full max-w-5xl md:h-[80vh] md:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><PieChart size={20} /></div>
                <div><h3 className="font-black text-slate-900 text-lg uppercase tracking-tighter">Detalle de Cobros</h3><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{causacionActiva?.mes_causado}</p></div>
              </div>
              <button onClick={() => setShowDetalles(false)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-600"><X /></button>
            </div>

            <div className="p-4 bg-slate-50/50 flex gap-4 overflow-x-auto no-scrollbar border-b border-slate-100">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex-1 min-w-[120px]">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Recaudado</p>
                <span className="font-black text-emerald-600 text-sm">${deudasDetalle.reduce((acc, d) => acc + ((d.monto_original || 0) - (d.saldo_pendiente || 0)), 0).toLocaleString()}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex-1 min-w-[120px]">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Pendiente</p>
                <span className="font-black text-rose-500 text-sm">
                  ${deudasDetalle.reduce((acc, d) => {
                    const yaPagado = (d.precio_m1 || 0) - (d.saldo_pendiente || 0);
                    const actual = calcularPrecioActual(d);
                    return acc + Math.max(0, actual - yaPagado);
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl flex-1 min-w-[120px]">
                <input placeholder="Busca Apto..." className="bg-transparent border-none text-white text-xs w-full focus:outline-none" onChange={(e) => setBusquedaDetalle(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F8FAFC]">
              {loadingDetalle ? <Loader2 className="animate-spin mx-auto mt-20 text-slate-300" /> : deudasFiltradas.map(d => {
                const pagado = d.saldo_pendiente === 0;
                return (
                  <div key={d.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-emerald-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${pagado ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{d.unidad}</span>
                      <div>
                        <p className="font-bold text-xs text-slate-900 uppercase truncate max-w-[150px]">{d.residentes?.nombre}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${pagado ? 'text-emerald-500' : 'text-rose-400'}`}>{pagado ? 'Al día' : 'Pendiente'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900 tracking-tighter tabular-nums">
                        ${(() => {
                          const yaPagado = (d.precio_m1 || 0) - (d.saldo_pendiente || 0);
                          const actual = calcularPrecioActual(d);
                          return Math.max(0, actual - yaPagado);
                        })().toLocaleString()}
                      </p>
                      {!pagado && <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-1">Saldo</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}