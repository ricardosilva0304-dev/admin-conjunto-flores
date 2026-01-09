"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit, X, Loader2, DollarSign, Percent, Info } from "lucide-react";

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
    const { data: cData } = await supabase.from("conceptos_pago").select("*").order('id', { ascending: true });
    if (cData) setConceptos(cData);
    const { data: gData } = await supabase.from("configuracion_global").select("tasa_mora").eq("id", 1).single();
    if (gData) setTasaMora(gData.tasa_mora.toString());
    setLoading(false);
  }

  async function guardarConcepto() {
    const datos = {
      nombre: nuevo.nombre,
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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* SECCIÓN CONCEPTOS */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-slate-900 text-lg font-bold">Tarifas de Conceptos</h2>
            <p className="text-slate-500 text-sm">Define los cobros mensuales del conjunto</p>
          </div>
          <button 
            onClick={() => { setEditandoId(null); setNuevo({nombre:"", porVehiculo:"No", m1:"", m2:"", m3:""}); setShowModal(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            <Plus size={18} /> Nuevo Concepto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5 text-center">Tarifas Escalonadas (10, 20, 30 días)</th>
                <th className="px-8 py-5 text-right">Opciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conceptos.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-6">
                    <span className="text-slate-800 font-bold block text-base">{c.nombre}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${c.cobro_por_vehiculo ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                      {c.cobro_por_vehiculo ? "POR VEHÍCULO" : "VALOR FIJO"}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700 font-bold text-sm">${c.monto_1_10.toLocaleString()}</div>
                      <div className="w-4 h-[1px] bg-slate-200"></div>
                      <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm">${c.monto_11_20.toLocaleString()}</div>
                      <div className="w-4 h-[1px] bg-slate-200"></div>
                      <div className="bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 text-rose-700 font-bold text-sm">${c.monto_21_adelante.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditandoId(c.id); setNuevo({nombre:c.nombre, porVehiculo: c.cobro_por_vehiculo ? "Si" : "No", m1:c.monto_1_10.toString(), m2:c.monto_11_20.toString(), m3:c.monto_21_adelante.toString()}); setShowModal(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                        <Edit size={18} />
                      </button>
                      <button onClick={async () => { if(confirm("¿Eliminar?")) { await supabase.from("conceptos_pago").delete().eq("id", c.id); cargarDatos(); } }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN MORA */}
      <div className="grid md:grid-cols-2 gap-10">
        <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><Percent size={20}/></div>
             <h2 className="text-slate-900 text-lg font-bold">Interés por Mora</h2>
          </div>
          <div className="relative">
            <input 
              type="number" step="0.1" value={tasaMora}
              onChange={async (e) => { setTasaMora(e.target.value); await supabase.from("configuracion_global").update({ tasa_mora: parseFloat(e.target.value) }).eq("id", 1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-10 pr-4 py-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500/10 focus:border-emerald-500 font-bold text-xl transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">%</span>
          </div>
          <p className="mt-4 text-slate-400 text-xs flex gap-2"><Info size={14} className="shrink-0" /> Este porcentaje se aplica automáticamente sobre deudas vencidas.</p>
        </section>

        <section className="bg-emerald-900 rounded-3xl p-8 text-white shadow-xl shadow-emerald-900/10 flex flex-col justify-center border border-white/10">
          <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Consejo de Configuración</h3>
          <p className="text-emerald-50 leading-relaxed text-sm">Asegúrate de que los montos escalonados cumplan con el reglamento de propiedad horizontal del conjunto residencial.</p>
        </section>
      </div>

      {/* MODAL CLARO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 pt-10 pb-6">
              <h3 className="text-slate-900 text-2xl font-extrabold tracking-tight mb-2">{editandoId ? "Editar Concepto" : "Nuevo Concepto"}</h3>
              <p className="text-slate-400 text-sm">Completa los detalles para la facturación.</p>
            </div>
            
            <div className="px-10 pb-10 space-y-5">
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Nombre</label>
                <input className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all text-slate-800" value={nuevo.nombre} onChange={(e)=>setNuevo({...nuevo, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Día 1-10</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-emerald-600 font-bold outline-none" value={nuevo.m1} onChange={(e)=>setNuevo({...nuevo, m1: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Día 11-20</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-500 font-bold outline-none" value={nuevo.m2} onChange={(e)=>setNuevo({...nuevo, m2: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-bold uppercase ml-1">Día 21+</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-rose-500 font-bold outline-none" value={nuevo.m3} onChange={(e)=>setNuevo({...nuevo, m3: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button onClick={guardarConcepto} className="flex-1 bg-emerald-600 text-white font-bold py-5 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Guardar Datos</button>
                <button onClick={()=>setShowModal(false)} className="px-8 bg-slate-100 text-slate-500 font-bold py-5 rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}