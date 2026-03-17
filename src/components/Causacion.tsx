"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { calcularValorDeudaHoy } from "@/lib/utils";
import {
  Zap, History, Trash2, Eye, X, Loader2,
  CheckCircle2, Calendar, LayoutGrid, Search, ChevronDown, ChevronUp
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

  // Meses del historial abiertos/cerrados
  const [mesesAbiertos, setMesesAbiertos] = useState<Record<string, boolean>>({});

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
    if (h.data) {
      setHistorial(h.data);
      // Abrir el mes más reciente por defecto
      if (h.data.length > 0) {
        const primerMes = h.data[0].mes_causado;
        setMesesAbiertos({ [primerMes]: true });
      }
    }
    setLoading(false);
  }

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
    setBusquedaDetalle("");
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

  const MESES_NOMBRES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={28} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8 pb-24 px-0 font-sans text-slate-800">

      {/* ── GENERADOR ────────────────────────────────────────── */}
      <section className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
        {/* Título */}
        <div className="flex items-center gap-3 mb-5 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-xs sm:text-sm uppercase tracking-widest leading-none">
              Generar Cobros Masivos
            </h2>
            <p className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase mt-0.5 tracking-tighter">
              Planificación financiera del mes
            </p>
          </div>
        </div>

        {/* Formulario — 1 columna en móvil, grid en desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-end">
          <div className="sm:col-span-2 md:col-span-4 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Concepto de pago</label>
            <select
              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
              value={conceptoId}
              onChange={(e) => setConceptoId(e.target.value)}
            >
              <option value="">Selecciona servicio...</option>
              {conceptos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Mes</label>
            <input
              type="month"
              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
              onChange={(e) => setMesDeuda(e.target.value)}
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Vencimiento</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all shadow-inner"
              onChange={(e) => setFechaLimite(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 md:col-span-2">
            <button
              onClick={generarCausacion}
              disabled={generando || !conceptoId}
              className="w-full bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-xl disabled:opacity-30 flex items-center justify-center"
            >
              {generando ? <Loader2 className="animate-spin" size={18} /> : "PROCESAR"}
            </button>
          </div>
        </div>

        {/* Filtros de tipo */}
        <div className="mt-4 sm:mt-6 flex bg-slate-100 p-1 rounded-2xl gap-1">
          {[
            { key: 'TODOS', label: 'General' },
            { key: 'CARRO', label: 'Carros' },
            { key: 'MOTO', label: 'Motos' },
            { key: 'BICI', label: 'Bicis' },
          ].map(({ key, label }) => {
            const count = residentes.filter(r => {
              if (key === "TODOS") return true;
              if (key === "CARRO") return (r.carros || 0) > 0;
              if (key === "MOTO") return (r.motos || 0) > 0;
              if (key === "BICI") return (r.bicis || 0) > 0;
              return false;
            }).length;
            const activo = filtroTipo === key;
            return (
              <button
                key={key}
                onClick={() => setFiltroTipo(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all ${activo ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
              >
                {label}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${activo ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── HISTORIAL AGRUPADO ───────────────────────────────── */}
      <div className="space-y-3 sm:space-y-4">
        {mesesOrdenados.map(mesKey => {
          const [anio, mesNum] = mesKey.split("-");
          const nombreMes = `${MESES_NOMBRES[parseInt(mesNum) - 1]} ${anio}`;
          const abierto = mesesAbiertos[mesKey] ?? false;
          const items = historialAgrupado[mesKey];

          return (
            <div key={mesKey} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

              {/* Cabecera del mes — clickeable */}
              <button
                onClick={() => setMesesAbiertos(prev => ({ ...prev, [mesKey]: !prev[mesKey] }))}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-3 sm:px-4 py-1.5 rounded-full">
                    <Calendar size={11} className="text-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">{nombreMes}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">{items.length} concepto{items.length !== 1 ? 's' : ''}</span>
                </div>
                {abierto
                  ? <ChevronUp size={15} className="text-slate-300 flex-shrink-0" />
                  : <ChevronDown size={15} className="text-slate-300 flex-shrink-0" />
                }
              </button>

              {/* Contenido del mes */}
              {abierto && (
                <div className="border-t border-slate-100 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map(h => (
                    <div
                      key={h.id}
                      className="border border-slate-100 p-4 sm:p-5 rounded-2xl flex flex-col gap-4 hover:border-emerald-200 hover:shadow-md transition-all group"
                    >
                      {/* Info + acciones */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors flex-shrink-0">
                            <History size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight leading-tight truncate">
                              {h.concepto_nombre}
                            </h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {h.total_residentes} unidades
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => verDetalles(h)}
                            className="p-2 sm:p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("¿Borrar esta causación?")) {
                                await supabase.from("causaciones_globales").delete().eq("id", h.id);
                                cargarDatos();
                              }
                            }}
                            className="p-2 sm:p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Regla de cobro */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <span className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest">Regla:</span>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-0.5">
                          {['M1', 'M2', 'NORMAL'].map(m => {
                            const active = (h.tipo_cobro || 'NORMAL') === m;
                            const label = m === 'NORMAL' ? 'AUTO' : m === 'M1' ? 'Puntual' : 'Tardío';
                            return (
                              <button
                                key={m}
                                onClick={() => cambiarModo(h.id, m)}
                                className={`px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[9px] font-black transition-all ${active ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {mesesOrdenados.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <CheckCircle2 className="mx-auto text-slate-200 mb-3" size={36} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sin causaciones registradas</p>
          </div>
        )}
      </div>

      {/* ── MODAL DE AUDITORÍA ───────────────────────────────── */}
      {showDetalles && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[500] flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-4xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border border-white/20 max-h-[90vh] sm:h-[85vh]">

            {/* Header modal */}
            <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                  <LayoutGrid size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm sm:text-base">
                    Auditoría Detallada
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {causacionActiva?.concepto_nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetalles(false)}
                className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-rose-500 rounded-full shadow-sm transition-all flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Buscador + KPIs */}
            <div className="px-4 sm:px-8 py-3 sm:py-5 bg-white border-b border-slate-100 flex flex-col gap-3 flex-shrink-0">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={15} />
                <input
                  placeholder="Buscar por unidad o nombre..."
                  className="w-full bg-slate-50 border border-slate-100 p-3 sm:p-4 pl-11 rounded-2xl text-xs font-bold outline-none focus:bg-white transition-all shadow-inner"
                  onChange={(e) => setBusquedaDetalle(e.target.value)}
                />
              </div>

              {/* KPIs en 2 columnas */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-emerald-50 border border-emerald-100 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                  <p className="text-[7px] sm:text-[8px] font-black text-emerald-600 uppercase tracking-widest">Recaudado</p>
                  <span className="font-black text-emerald-700 text-base sm:text-lg tabular-nums">
                    ${deudasDetalle.reduce((acc, d) => acc + (Number(d.monto_original) - Number(d.saldo_pendiente)), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-100 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                  <p className="text-[7px] sm:text-[8px] font-black text-rose-600 uppercase tracking-widest">Por Cobrar</p>
                  <span className="font-black text-rose-700 text-base sm:text-lg tabular-nums">
                    ${deudasDetalle.reduce((acc, d) => acc + Number(d.saldo_pendiente), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de deudas */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 bg-[#F8FAFC]">
              {loadingDetalle ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-20">
                  <Loader2 className="animate-spin mb-3" size={32} />
                  <p className="font-black uppercase text-xs tracking-widest">Cargando...</p>
                </div>
              ) : deudasFiltradas.map(d => {
                const pagado = Number(d.saldo_pendiente) === 0;
                return (
                  <div
                    key={d.id}
                    className={`bg-white border p-3 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 transition-all shadow-sm hover:shadow-md ${pagado ? 'border-emerald-100 opacity-70' : 'border-slate-100 hover:border-emerald-200'}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                      <div className={`w-12 h-10 sm:w-14 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[9px] sm:text-xs flex-shrink-0 ${pagado ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {d.unidad}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs sm:text-sm uppercase text-slate-800 tracking-tight truncate">
                          {d.residentes?.nombre}
                        </p>
                        <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block ${pagado ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                          {pagado ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm sm:text-lg font-black tabular-nums flex-shrink-0 ${pagado ? 'text-emerald-500' : 'text-rose-600'}`}>
                      ${(pagado ? Number(d.monto_original) : calcularValorDeudaHoy(d)).toLocaleString()}
                    </p>
                  </div>
                );
              })}
              {deudasFiltradas.length === 0 && !loadingDetalle && (
                <div className="py-16 text-center opacity-30 italic uppercase text-xs font-black tracking-[0.4em]">
                  Sin coincidencias
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 text-center border-t border-slate-100 flex-shrink-0">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Admin Pro - Parque de las Flores
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}