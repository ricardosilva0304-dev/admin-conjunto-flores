"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, X, Loader2, Percent, Settings } from "lucide-react";

export default function Configuracion() {
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [tasaMora, setTasaMora] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nuevo, setNuevo] = useState({ nombre: "", porVehiculo: "No", m1: "", m2: "", m3: "" });

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from("conceptos_pago").select("*").order('id', { ascending: true });
      if (cData) setConceptos(cData);
      const { data: gData } = await supabase.from("configuracion_global").select("tasa_mora").eq("id", 1).single();
      if (gData) setTasaMora(gData.tasa_mora.toString());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function actualizarTasaMora(valor: string) {
    setTasaMora(valor);
    const num = parseFloat(valor);
    if (isNaN(num)) return;
    await supabase.from("configuracion_global").update({ tasa_mora: num }).eq("id", 1);
  }

  async function guardarConcepto(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.m1) return;
    const datos = {
      nombre: nuevo.nombre.trim().toUpperCase(),
      cobro_por_vehiculo: nuevo.porVehiculo === "Si",
      monto_1_10: parseFloat(nuevo.m1),
      monto_11_20: parseFloat(nuevo.m2 || nuevo.m1),
      monto_21_adelante: parseFloat(nuevo.m3 || nuevo.m1)
    };
    if (editandoId) await supabase.from("conceptos_pago").update(datos).eq("id", editandoId);
    else await supabase.from("conceptos_pago").insert([datos]);
    setShowModal(false);
    cargarDatos();
  }

  const abrirEditar = (c: any) => {
    setEditandoId(c.id);
    setNuevo({ nombre: c.nombre, porVehiculo: c.cobro_por_vehiculo ? "Si" : "No", m1: c.monto_1_10.toString(), m2: c.monto_11_20.toString(), m3: c.monto_21_adelante.toString() });
    setShowModal(true);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-slate-300" size={28} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20 font-sans px-0">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
        <div className="min-w-0">
          <h1 className="text-slate-800 font-bold flex items-center gap-2 text-base sm:text-xl">
            <Settings size={16} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">PARÁMETROS FINANCIEROS</span>
          </h1>
          <p className="text-slate-400 text-[9px] sm:text-xs mt-0.5 uppercase tracking-widest font-medium">
            Configuración de tarifas base
          </p>
        </div>
        <button
          onClick={() => { setEditandoId(null); setNuevo({ nombre: "", porVehiculo: "No", m1: "", m2: "", m3: "" }); setShowModal(true); }}
          className="flex-shrink-0 bg-slate-900 text-white rounded-lg font-black tracking-widest hover:bg-black transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shadow-slate-900/20
            px-3 py-2.5 text-[9px]
            sm:px-5 sm:py-3 sm:text-xs"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">NUEVO CONCEPTO</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* ── CATÁLOGO ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios y Cobranza</span>
          <span className="text-[10px] font-bold text-slate-500">{conceptos.length} Items configurados</span>
        </div>

        {/* ── MÓVIL: cards apiladas ── */}
        <div className="sm:hidden divide-y divide-slate-100">
          {conceptos.map(c => (
            <div key={c.id} className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="min-w-0 flex-1">
                {/* Nombre + badge */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="font-black text-sm text-slate-800 uppercase leading-tight">{c.nombre}</h4>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black flex-shrink-0 ${c.cobro_por_vehiculo ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    {c.cobro_por_vehiculo ? "X VEH." : "FIJO"}
                  </span>
                </div>

                {/* Tramos en fila */}
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-[7px] font-black text-slate-300 uppercase mb-0.5">1-10</p>
                    <p className="text-xs font-black text-emerald-600 tabular-nums">${Number(c.monto_1_10).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] font-black text-slate-300 uppercase mb-0.5">11-20</p>
                    <p className="text-xs font-black text-slate-500 tabular-nums">${Number(c.monto_11_20).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] font-black text-slate-300 uppercase mb-0.5">21+</p>
                    <p className="text-xs font-black text-rose-500 tabular-nums">${Number(c.monto_21_adelante).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Botón editar */}
              <button
                onClick={() => abrirEditar(c)}
                className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Edit size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* ── DESKTOP: tabla original ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Modo Cobro</th>
                <th className="px-6 py-4 text-center">Tramo 1-10</th>
                <th className="px-6 py-4 text-center">Tramo 11-20</th>
                <th className="px-6 py-4 text-center">Tramo 21+</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {conceptos.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{c.nombre}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] px-2 py-1 rounded font-black ${c.cobro_por_vehiculo ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                      {c.cobro_por_vehiculo ? "POR VEHÍCULO" : "VALOR FIJO"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-emerald-600 tabular-nums">${Number(c.monto_1_10).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-500 tabular-nums">${Number(c.monto_11_20).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center font-medium text-rose-500 tabular-nums">${Number(c.monto_21_adelante).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => abrirEditar(c)} className="p-2 text-slate-300 hover:text-emerald-500 transition-colors">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TASA DE MORA ─────────────────────────────────────── */}
      <section className="bg-white p-5 sm:p-8 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
        <div className="flex-1 space-y-1 sm:space-y-2">
          <h3 className="text-slate-900 font-bold flex items-center gap-2 text-sm sm:text-base">
            <Percent size={16} className="text-amber-500 flex-shrink-0" /> Interés por Mora
          </h3>
          <p className="text-slate-400 text-[10px] sm:text-[11px] leading-relaxed uppercase tracking-wider font-medium">
            Este porcentaje penaliza las deudas de meses anteriores sobre el saldo vencido actual.
          </p>
        </div>
        <div className="w-full sm:w-64 relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">%</span>
          <input
            type="number" step="0.1" value={tasaMora}
            onBlur={(e) => actualizarTasaMora(e.target.value)}
            onChange={(e) => setTasaMora(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-black text-xl text-center outline-none focus:border-amber-400 focus:bg-white transition-all tabular-nums"
          />
        </div>
      </section>

      {/* ── MODAL ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110] animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <form onSubmit={guardarConcepto} className="p-5 sm:p-8">

              <div className="flex justify-between items-center mb-6 sm:mb-10">
                <div>
                  <h3 className="text-slate-900 text-lg sm:text-xl font-bold tracking-tight">
                    {editandoId ? "Editar Configuración" : "Nuevo Servicio"}
                  </h3>
                  <p className="text-slate-400 text-[9px] mt-0.5 uppercase font-black tracking-wider">
                    Detalle de facturación mensual
                  </p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Nombre Concepto</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-100 p-3.5 sm:p-4 rounded-xl outline-none focus:ring-4 ring-emerald-500/5 font-bold uppercase text-sm mt-1"
                    value={nuevo.nombre}
                    onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                    required placeholder="EJ: ADMINISTRACIÓN"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] ml-1">Modalidad de cobro</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 mt-1">
                    {['No', 'Si'].map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => setNuevo({ ...nuevo, porVehiculo: opt })}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${nuevo.porVehiculo === opt ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400"}`}
                      >
                        {opt === 'No' ? 'VALOR FIJO' : 'X VEHÍCULO'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { t: 'Día 1-10', f: 'm1', c: 'emerald' },
                    { t: 'Día 11-20', f: 'm2', c: 'slate' },
                    { t: 'Día 21+', f: 'm3', c: 'rose' }
                  ].map(item => (
                    <div key={item.f} className="space-y-1">
                      <label className="text-slate-400 text-[8px] font-black uppercase ml-1">{item.t}</label>
                      <input
                        type="number" inputMode="numeric"
                        className={`w-full bg-slate-50 p-3 sm:p-4 rounded-xl font-bold outline-none border border-slate-100 tabular-nums text-sm focus:border-${item.c}-500`}
                        value={nuevo[item.f as keyof typeof nuevo]}
                        onChange={(e) => setNuevo({ ...nuevo, [item.f]: e.target.value })}
                        required
                      />
                    </div>
                  ))}
                </div>

                {editandoId && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("¿Eliminar para siempre?")) {
                        await supabase.from("conceptos_pago").delete().eq("id", editandoId);
                        setShowModal(false); cargarDatos();
                      }
                    }}
                    className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] w-full text-center hover:text-rose-600 transition-colors py-3"
                  >
                    Eliminar Servicio definitivamente
                  </button>
                )}

                <div className="flex gap-2 sm:gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white font-black py-3.5 sm:py-4 rounded-xl text-xs uppercase tracking-[0.1em] hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Guardar Datos
                  </button>
                  <button
                    type="button" onClick={() => setShowModal(false)}
                    className="px-5 sm:px-6 bg-slate-50 text-slate-500 font-bold py-3.5 sm:py-4 rounded-xl text-xs uppercase"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}